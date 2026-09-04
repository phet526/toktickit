import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { TicketController } from "../controllers/tickets.controller.js";

const router = Router();

// Use memory storage for Lab 2 to avoid file system persistence complexities
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit at middleware level
});

// Middleware to catch Multer errors and return 400 instead of 500
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size exceeds 5MB limit" });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: "Unknown upload error" });
    }
    next();
  });
};

// GET /api/v1/tickets
router.get("/", TicketController.getTickets);

// GET /api/v1/tickets/:id
router.get("/:id", TicketController.getTicketById);

// POST /api/v1/tickets
router.post("/", TicketController.createTicket);

// POST /api/v1/tickets/:id/attachments
router.post("/:id/attachments", handleUpload, TicketController.uploadAttachment);

// DELETE /api/v1/tickets/:id/attachments/:attachmentId
router.delete("/:id/attachments/:attachmentId", TicketController.deleteAttachment);

// GET /api/v1/tickets/:id/attachments/:attachmentId/download
router.get("/:id/attachments/:attachmentId/download", TicketController.downloadAttachment);

export default router;
