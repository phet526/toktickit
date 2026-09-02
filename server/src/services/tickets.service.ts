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
}
