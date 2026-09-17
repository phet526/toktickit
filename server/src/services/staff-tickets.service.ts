import { getPrisma } from "../prisma.js";
import { Prisma } from "@prisma/client";
import {
  getPermittedStatusTransitions,
  isValidStatusTransition,
  isValidITPriority,
  normalizeITPriority
} from "../utils/status-transition.validator.js";

export interface StaffTicketQueryOptions {
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  owner?: "all" | "unassigned" | "me" | string;
  page?: number | string;
  limit?: number | string;
  sortBy?: "createdAt" | "itPriority" | "ticketNo" | string;
  sortOrder?: "asc" | "desc" | string;
}

export interface CurrentStaffUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export class StaffTicketsService {
  static async getStaffTickets(options: StaffTicketQueryOptions, currentUser: CurrentStaffUser) {
    const prisma = getPrisma();

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};

    // 1. Search (Ticket No or Summary)
    if (options.search && options.search.trim()) {
      const searchTerm = options.search.trim();
      where.OR = [
        { ticketNo: { contains: searchTerm, mode: "insensitive" } },
        { summary: { contains: searchTerm, mode: "insensitive" } }
      ];
    }

    // 2. Status Filter
    if (options.status && options.status.trim() && options.status !== "all") {
      where.currentStatus = { equals: options.status.trim(), mode: "insensitive" };
    }

    // 3. Category Filter (by numeric ID or category name)
    if (options.category && options.category.trim() && options.category !== "all") {
      const catVal = options.category.trim();
      const numId = Number(catVal);
      if (!isNaN(numId) && numId > 0) {
        where.categoryId = numId;
      } else {
        where.category = { name: { equals: catVal, mode: "insensitive" } };
      }
    }

    // 4. Priority Filter (by itPriority or requestedPriority fallback)
    if (options.priority && options.priority.trim() && options.priority !== "all") {
      const prioVal = options.priority.trim();
      const priorityCondition: Prisma.TicketWhereInput[] = [
        { itPriority: { equals: prioVal, mode: "insensitive" } },
        {
          AND: [
            { itPriority: "" },
            { requestedPriority: { equals: prioVal, mode: "insensitive" } }
          ]
        }
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: priorityCondition }
        ];
        delete where.OR;
      } else {
        where.OR = priorityCondition;
      }
    }

    // 5. Ownership Filter
    if (options.owner) {
      const ownerVal = options.owner.toLowerCase().trim();
      if (ownerVal === "unassigned") {
        where.assignedStaffId = null;
      } else if (ownerVal === "me") {
        where.assignedStaffId = currentUser.id;
      }
    }

    // 6. Sorting
    const validSortFields = ["createdAt", "itPriority", "ticketNo"];
    const sortBy = validSortFields.includes(options.sortBy || "") ? (options.sortBy as string) : "createdAt";
    const sortOrder: "asc" | "desc" = options.sortOrder?.toLowerCase() === "asc" ? "asc" : "desc";

    const orderBy: Prisma.TicketOrderByWithRelationInput = {
      [sortBy]: sortOrder
    };

    const [totalItems, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true } },
          assignedStaff: { select: { id: true, name: true, email: true } }
        }
      })
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const data = tickets.map((t) => ({
      id: t.id,
      ticketNo: t.ticketNo,
      createdDate: t.createdAt.toISOString(),
      summary: t.summary,
      category: t.category.name,
      requestedPriority: t.requestedPriority,
      itPriority: t.itPriority || t.requestedPriority,
      currentStatus: t.currentStatus,
      ticketOwner: t.assignedStaff ? { id: t.assignedStaff.id, name: t.assignedStaff.name } : null,
      problemResolvedReported: t.problemResolvedReported
    }));

    return {
      data,
      meta: {
        totalItems,
        currentPage: page,
        totalPages,
        limit
      }
    };
  }

  static async getTicketDetail(ticketId: number) {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        attachments: {
          orderBy: { id: "asc" }
        }
      }
    });

    if (!ticket) {
      throw new Error("NOT_FOUND");
    }

    return {
      id: ticket.id,
      ticketNo: ticket.ticketNo,
      summary: ticket.summary,
      description: ticket.description,
      requestedPriority: ticket.requestedPriority,
      itPriority: ticket.itPriority || ticket.requestedPriority,
      currentStatus: ticket.currentStatus,
      problemResolvedReported: ticket.problemResolvedReported,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      category: ticket.category,
      relatedSystem: ticket.relatedSystem,
      requester: ticket.requester,
      assignedStaff: ticket.assignedStaff ? {
        id: ticket.assignedStaff.id,
        name: ticket.assignedStaff.name,
        email: ticket.assignedStaff.email
      } : null,
      attachments: ticket.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        size: a.size,
        mimeType: a.mimeType,
        deletedAt: a.deletedAt ? a.deletedAt.toISOString() : null,
        deletedReason: a.deletedReason
      })),
      permittedStatusTransitions: getPermittedStatusTransitions(ticket.currentStatus)
    };
  }

  static async updateOwnership(ticketId: number, assignedStaffId: number) {
    const prisma = getPrisma();

    if (!assignedStaffId || isNaN(Number(assignedStaffId))) {
      throw new Error("INVALID_STAFF");
    }

    // Verify staff exists and is active IT_STAFF or ADMINISTRATOR (Lab 3 Sheet Section 4.5)
    const staff = await prisma.user.findFirst({
      where: {
        id: Number(assignedStaffId),
        role: { in: ["IT_STAFF", "ADMINISTRATOR"] },
        isActive: true
      }
    });

    if (!staff) {
      throw new Error("INVALID_STAFF");
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new Error("NOT_FOUND");
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { assignedStaffId: staff.id },
      include: { assignedStaff: { select: { id: true, name: true, email: true } } }
    });

    return {
      message: "Ticket ownership updated successfully",
      assignedStaff: updated.assignedStaff ? {
        id: updated.assignedStaff.id,
        name: updated.assignedStaff.name
      } : null
    };
  }

  static async updatePriority(ticketId: number, itPriority: string) {
    if (!isValidITPriority(itPriority)) {
      throw new Error("INVALID_PRIORITY");
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new Error("NOT_FOUND");
    }

    const normalized = normalizeITPriority(itPriority);
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { itPriority: normalized }
    });

    return {
      message: "IT Priority updated successfully",
      itPriority: normalized
    };
  }

  static async updateStatus(ticketId: number, newStatus: string) {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new Error("NOT_FOUND");
    }

    if (!isValidStatusTransition(ticket.currentStatus, newStatus)) {
      throw new Error(`INVALID_TRANSITION: Invalid status transition from ${ticket.currentStatus} to ${newStatus}`);
    }

    // Normalize match
    const permitted = getPermittedStatusTransitions(ticket.currentStatus);
    const matchedStatus = permitted.find((p) => p.toLowerCase() === newStatus.toLowerCase()) || newStatus;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { currentStatus: matchedStatus }
    });

    return {
      message: "Ticket status updated successfully",
      currentStatus: matchedStatus
    };
  }

  static async getInternalNotes(ticketId: number) {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new Error("NOT_FOUND");
    }

    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, role: true } }
      }
    });

    return notes.map((n) => ({
      id: n.id,
      content: n.content,
      author: {
        id: n.author.id,
        name: n.author.name,
        role: n.author.role
      },
      createdAt: n.createdAt.toISOString()
    }));
  }

  static async createInternalNote(ticketId: number, authorId: number, content: string) {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new Error("NOT_FOUND");
    }

    if (!content || !content.trim()) {
      throw new Error("EMPTY_CONTENT");
    }

    if (content.trim().length > 1000) {
      throw new Error("CONTENT_TOO_LONG");
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId,
        content: content.trim()
      },
      include: {
        author: { select: { id: true, name: true, role: true } }
      }
    });

    return {
      id: note.id,
      content: note.content,
      author: {
        id: note.author.id,
        name: note.author.name,
        role: note.author.role
      },
      createdAt: note.createdAt.toISOString()
    };
  }

  static async getActiveStaffList() {
    const prisma = getPrisma();
    return prisma.user.findMany({
      where: { role: { in: ["IT_STAFF", "ADMINISTRATOR"] }, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    });
  }
}
