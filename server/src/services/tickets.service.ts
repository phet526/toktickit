import { getPrisma } from "../prisma.js";
import { generateTicketNumber } from "../utils/ticket-utils.js";

export interface CreateTicketDTO {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: string;
}

export class TicketService {
  static async createTicket(data: CreateTicketDTO) {
    const prisma = getPrisma();

    // 1. Basic length and required validation
    if (!data.requesterId || !data.categoryId || !data.relatedSystemId || !data.summary || !data.description || !data.requestedPriority) {
      throw new Error("Missing required fields");
    }

    if (data.summary.length > 150) {
      throw new Error("Summary must not exceed 150 characters");
    }

    if (data.description.length > 2000) {
      throw new Error("Description must not exceed 2000 characters");
    }

    // 2. Foreign Key Validations
    const [requester, category, relatedSystem] = await Promise.all([
      prisma.developmentRequester.findUnique({ where: { id: data.requesterId } }),
      prisma.category.findUnique({ where: { id: data.categoryId } }),
      prisma.relatedSystem.findUnique({ where: { id: data.relatedSystemId } })
    ]);

    if (!requester || !requester.isActive) throw new Error("Invalid or inactive requester");
    if (!category) throw new Error("Invalid category");
    if (!relatedSystem) throw new Error("Invalid related system");

    // 3. Generate Ticket No
    const ticketNo = await generateTicketNumber();

    // 4. Create Ticket (BR-02: Status = "New")
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNo,
        summary: data.summary,
        description: data.description,
        requestedPriority: data.requestedPriority,
        currentStatus: "New",
        requesterId: data.requesterId,
        categoryId: data.categoryId,
        relatedSystemId: data.relatedSystemId,
      }
    });

    return newTicket;
  }

  static async getTickets(params: {
    requesterId: number;
    search?: string;
    category?: string;
    system?: string;
    status?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const prisma = getPrisma();
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;

    const where: any = { requesterId: params.requesterId };

    if (params.search) {
      where.OR = [
        { ticketNo: { contains: params.search, mode: 'insensitive' } },
        { summary: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.category) {
      // Assuming category is ID, if name, need to join
      where.categoryId = parseInt(params.category);
    }

    if (params.system) {
      where.relatedSystemId = parseInt(params.system);
    }

    if (params.status) {
      where.currentStatus = params.status;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (params.sort) {
      const [field, order] = params.sort.split(':');
      if (field && (order === 'asc' || order === 'desc')) {
        orderBy = { [field]: order };
      }
    }

    const [data, totalItems] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { name: true } },
          relatedSystem: { select: { name: true } },
        }
      }),
      prisma.ticket.count({ where })
    ]);

    return {
      data,
      meta: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  static async getTicketById(id: number, requesterId: number) {
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        relatedSystem: { select: { name: true } },
        attachments: true
      }
    });

    if (!ticket) throw new Error("NOT_FOUND");
    if (ticket.requesterId !== requesterId) throw new Error("FORBIDDEN");

    return ticket;
  }

  static async deleteAttachment(ticketId: number, attachmentId: number, requesterId: number, reason: string) {
    const prisma = getPrisma();
    
    if (!reason || reason.trim() === '') {
      throw new Error("Reason is required");
    }

    // Verify ticket ownership
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error("NOT_FOUND");
    if (ticket.requesterId !== requesterId) throw new Error("FORBIDDEN");

    // Verify attachment exists and belongs to ticket
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, ticketId, deletedAt: null }
    });
    if (!attachment) throw new Error("NOT_FOUND");

    // Soft delete
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        deletedAt: new Date(),
        deletedReason: reason
      }
    });

    return { success: true };
  }
}
