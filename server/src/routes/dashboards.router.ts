import { Router } from "express";
import { getRequesterDashboard, getStaffDashboard } from "../controllers/dashboards.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

// GET /api/v1/dashboards/requester (BR-12, AC-13)
router.get("/requester", requireRole("REQUESTER"), getRequesterDashboard);

// GET /api/v1/dashboards/staff (FR-12, AC-15)
router.get("/staff", requireRole("IT_STAFF", "ADMINISTRATOR"), getStaffDashboard);

export default router;
