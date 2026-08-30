import { Router } from "express";
import multer from "multer";
import { TicketController } from "../controllers/tickets.controller.js";

const router = Router();

// Use memory storage for Lab 2 to avoid file system persistence complexities, 
// as requested in Assumptions (Attachment Storage) we are just saving metadata in DB 
// and keeping files temporarily (or simulating storage).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit at middleware level
});

// POST /api/v1/tickets
router.post("/", TicketController.createTicket);

// POST /api/v1/tickets/:id/attachments
router.post("/:id/attachments", upload.single("file"), TicketController.uploadAttachment);

export default router;
