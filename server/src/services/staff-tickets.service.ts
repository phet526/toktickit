import { getPrisma } from "../prisma.js";
import { Prisma } from "@prisma/client";

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
}
