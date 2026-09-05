import { getPrisma } from "../prisma.js";

export async function generateTicketNumber(): Promise<string> {
  const prisma = getPrisma();
  const currentYear = new Date().getFullYear();
  const prefix = `TKT-${currentYear}-`;

  // Find the most recent ticket created this year
  const lastTicket = await prisma.ticket.findFirst({
    where: {
      ticketNo: {
        startsWith: prefix
      }
    },
    orderBy: {
      ticketNo: 'desc'
    }
  });

  if (!lastTicket) {
    return `${prefix}00001`;
  }

  // Extract the running number part
  const lastNumberStr = lastTicket.ticketNo.replace(prefix, "");
  const lastNumber = parseInt(lastNumberStr, 10);
  const nextNumber = lastNumber + 1;

  // Pad with leading zeros up to 5 digits
  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}
