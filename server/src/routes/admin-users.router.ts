import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
  listUsers,
  createUser,
  updateUser,
  resetUserPassword
} from "../controllers/admin-users.controller.js";

const router = Router();

// All admin user management routes require authentication and ADMINISTRATOR role
router.use(requireAuth, requireRole("ADMINISTRATOR"));

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.post("/:id/reset-password", resetUserPassword);

export default router;
