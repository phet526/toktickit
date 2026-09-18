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

// Operational mutations (Claim, Reassign, Priority, Status): accessible by IT_STAFF and ADMINISTRATOR (Superuser)
router.patch("/:id/ownership", requireRole("IT_STAFF", "ADMINISTRATOR"), updateTicketOwnership);
router.patch("/:id/priority", requireRole("IT_STAFF", "ADMINISTRATOR"), updateTicketPriority);
router.patch("/:id/status", requireRole("IT_STAFF", "ADMINISTRATOR"), updateTicketStatus);

// Internal Notes
// GET is accessible by IT_STAFF and ADMINISTRATOR (BR-04, BR-11: Requesters get 403 Forbidden)
router.get("/:id/notes", requireRole("IT_STAFF", "ADMINISTRATOR"), getInternalNotes);
// POST is accessible by IT_STAFF and ADMINISTRATOR (Requesters get 403 Forbidden)
router.post("/:id/notes", requireRole("IT_STAFF", "ADMINISTRATOR"), createInternalNote);

export default router;
