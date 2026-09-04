import { Request, Response } from "express";
import { TicketService } from "../services/tickets.service.js";
import { getPrisma } from "../prisma.js";
import fs from "fs";
import path from "path";

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
        id: ticket.id,
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

      const requesterId = Number(req.body.requesterId || req.query.requesterId);
      if (!requesterId || isNaN(requesterId)) {
        res.status(403).json({ error: "requesterId is required" });
        return;
      }

      const { originalname, size, mimetype, buffer } = req.file;

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

      const prisma = getPrisma();
      
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        res.status(404).json({ error: "Ticket not found" });
        return;
      }
      if (ticket.requesterId !== requesterId) {
        res.status(403).json({ error: "Forbidden: You do not own this ticket" });
        return;
      }

      // Check limits (max 5)
      const count = await prisma.attachment.count({ where: { ticketId, deletedAt: null } });
      if (count >= 5) {
        res.status(400).json({ error: "Maximum 5 attachments allowed per ticket" });
        return;
      }

      const newAttachment = await prisma.attachment.create({
        data: {
          filename: originalname,
          size: size,
          mimeType: mimetype,
          ticketId: ticketId
        }
      });

      // Save real file to disk (Requirement 4)
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      fs.writeFileSync(path.join(uploadDir, String(newAttachment.id)), buffer);

      res.status(201).json({ message: "Attachment uploaded successfully", attachment: newAttachment });
    } catch (error: any) {
      console.error("[TicketController] Error uploading attachment:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = Number(req.query.requesterId);
      if (!requesterId || isNaN(requesterId)) {
        res.status(400).json({ error: "requesterId is required and must be a number" });
        return;
      }

      const params = {
        requesterId,
        search: req.query.search as string,
        category: req.query.category as string,
        system: req.query.system as string,
        status: req.query.status as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sort: req.query.sort as string,
      };

      const result = await TicketService.getTickets(params);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("[TicketController] Error getting tickets:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async getTicketById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const requesterId = Number(req.query.requesterId);

      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ticket ID" });
        return;
      }
      if (!requesterId || isNaN(requesterId)) {
        res.status(400).json({ error: "requesterId is required and must be a number" });
        return;
      }

      const ticket = await TicketService.getTicketById(id, requesterId);
      res.status(200).json(ticket);
    } catch (error: any) {
      console.error("[TicketController] Error getting ticket by id:", error);
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Ticket not found" });
      } else if (error.message === "FORBIDDEN") {
        res.status(403).json({ error: "Forbidden: You do not have permission to view this ticket" });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

  static async deleteAttachment(req: Request, res: Response): Promise<void> {
    try {
      const ticketId = Number(req.params.id);
      const attachmentId = Number(req.params.attachmentId);
      const { requesterId, reason } = req.body;

      if (isNaN(ticketId) || isNaN(attachmentId)) {
        res.status(400).json({ error: "Invalid ticket or attachment ID" });
        return;
      }

      if (!requesterId || isNaN(Number(requesterId))) {
        res.status(403).json({ error: "requesterId is required" }); // 403 as per "ไม่มีสิทธิ์ลบไฟล์ หรือไม่ได้ส่งเหตุผลการลบ"
        return;
      }

      if (!reason || String(reason).trim() === '') {
        res.status(403).json({ error: "reason is required" });
        return;
      }

      const result = await TicketService.deleteAttachment(ticketId, attachmentId, Number(requesterId), String(reason));
      res.status(200).json(result);
    } catch (error: any) {
      console.error("[TicketController] Error deleting attachment:", error);
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Ticket or attachment not found" });
      } else if (error.message === "FORBIDDEN") {
        res.status(403).json({ error: "Forbidden: You do not have permission" });
      } else if (error.message === "Reason is required") {
        res.status(403).json({ error: "reason is required" });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

  static async downloadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const ticketId = Number(req.params.id);
      const attachmentId = Number(req.params.attachmentId);

      if (isNaN(ticketId) || isNaN(attachmentId)) {
        res.status(400).json({ error: "Invalid ticket or attachment ID" });
        return;
      }

      const prisma = getPrisma();
      
      const attachment = await prisma.attachment.findFirst({
        where: { id: attachmentId, ticketId }
      });

      if (!attachment) {
        res.status(404).json({ error: "Attachment not found" });
        return;
      }

      if (attachment.deletedAt) {
        // As per API spec: 403/404 if soft-removed
        res.status(403).json({ error: "Forbidden: Attachment has been deleted" });
        return;
      }

      // Read real file from disk
      const filePath = path.join(process.cwd(), 'uploads', String(attachment.id));
      
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "File not found on disk" });
        return;
      }
      
      res.setHeader("Content-Disposition", `attachment; filename="${attachment.filename}"`);
      res.setHeader("Content-Type", attachment.mimeType);
      res.setHeader("Content-Length", attachment.size);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      console.error("[TicketController] Error downloading attachment:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
