import { Router } from "express";
import { getStaffTickets } from "../controllers/staff-tickets.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("IT_STAFF", "ADMINISTRATOR"));

router.get("/", getStaffTickets);

export default router;
