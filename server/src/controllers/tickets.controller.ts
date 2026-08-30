import { Request, Response } from "express";
import { TicketService } from "../services/tickets.service.js";
import { getPrisma } from "../prisma.js";

export class TicketController {
  static async createTicket(req: Request, res: Response): Promise<void> {
    try {
      // 1. Parse payload
      const {
        requesterId,
        categoryId,
        relatedSystemId,
        summary,
        description,
        requestedPriority
      } = req.body;

      // 2. Call Service
      const ticket = await TicketService.createTicket({
        requesterId: Number(requesterId),
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        summary,
        description,
        requestedPriority
      });

      // 3. Success Response (No Wrapper - Strict compliance with api-spec)
      res.status(201).json({
        ticketNo: ticket.ticketNo,
        message: "Ticket created successfully"
      });
    } catch (error: any) {
      console.error("[TicketController] Error creating ticket:", error);
      
      // Handle known validation errors as 400 Bad Request
      if (error instanceof Error && 
         (error.message.includes("Missing required fields") ||
          error.message.includes("must not exceed") ||
          error.message.includes("Invalid"))) {
        res.status(400).json({ error: error.message });
      } else {
        // Safe unexpected-error handling
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

  static async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const ticketId = Number(req.params.id);
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // Normally we would save metadata to DB here via TicketService
      // Mocking DB logic directly in controller for brevity or call service:
      // (This needs to be properly implemented in service, but we handle it here briefly)
      
      const { originalname, size, mimetype } = req.file;
      
      // BR-05 limits validation
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowedMimes.includes(mimetype)) {
        res.status(400).json({ error: "Invalid file type. Allowed: JPG, PNG, WEBP, PDF" });
        return;
      }

      if (size > 5 * 1024 * 1024) {
        res.status(400).json({ error: "File size exceeds 5MB limit" });
        return;
      }

      // Here you'd use prisma to insert the attachment metadata to DB
      const prisma = getPrisma();
      
      // Check limits (max 5)
      const count = await prisma.attachment.count({ where: { ticketId, deletedAt: null } });
      if (count >= 5) {
        res.status(400).json({ error: "Maximum 5 attachments allowed per ticket" });
        return;
      }

      await prisma.attachment.create({
        data: {
          filename: originalname,
          size: size,
          mimeType: mimetype,
          ticketId: ticketId
        }
      });

      res.status(201).json({ message: "Attachment uploaded successfully" });
    } catch (error: any) {
      console.error("[TicketController] Error uploading attachment:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
