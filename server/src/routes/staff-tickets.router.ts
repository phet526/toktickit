import { Router } from "express";
import {
  getStaffTickets,
  getStaffTicketDetail,
  updateTicketOwnership,
  updateTicketPriority,
  updateTicketStatus,
  getInternalNotes,
  createInternalNote
} from "../controllers/staff-tickets.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("IT_STAFF", "ADMINISTRATOR"));

router.get("/", getStaffTickets);
router.get("/:id", getStaffTicketDetail);
router.patch("/:id/ownership", updateTicketOwnership);
router.patch("/:id/priority", updateTicketPriority);
router.patch("/:id/status", updateTicketStatus);

// Internal Notes
// GET is accessible by IT_STAFF and ADMINISTRATOR
router.get("/:id/notes", getInternalNotes);
// POST is accessible by IT_STAFF ONLY (Admin and Requester get 403)
router.post("/:id/notes", requireRole("IT_STAFF"), createInternalNote);

export default router;
