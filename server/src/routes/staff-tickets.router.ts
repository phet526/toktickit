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

// Ticket Queue and Detail View: accessible by IT_STAFF and ADMINISTRATOR (BR-04)
router.get("/", requireRole("IT_STAFF", "ADMINISTRATOR"), getStaffTickets);
router.get("/:id", requireRole("IT_STAFF", "ADMINISTRATOR"), getStaffTicketDetail);

// Operational mutations (Claim, Reassign, Priority, Status): strictly restricted to IT_STAFF (BR-09, Authorization Matrix)
// Administrator is blocked with HTTP 403 Forbidden!
router.patch("/:id/ownership", requireRole("IT_STAFF"), updateTicketOwnership);
router.patch("/:id/priority", requireRole("IT_STAFF"), updateTicketPriority);
router.patch("/:id/status", requireRole("IT_STAFF"), updateTicketStatus);

// Internal Notes
// GET is accessible by IT_STAFF and ADMINISTRATOR (BR-04, BR-11: Requesters get 403 Forbidden)
router.get("/:id/notes", requireRole("IT_STAFF", "ADMINISTRATOR"), getInternalNotes);
// POST is accessible by IT_STAFF ONLY (Admin and Requester get 403)
router.post("/:id/notes", requireRole("IT_STAFF"), createInternalNote);

export default router;
