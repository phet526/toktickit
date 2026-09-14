import { Request, Response } from "express";
import { AdminUsersService } from "../services/admin-users.service.js";

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const { search, role } = req.query;

    const users = await AdminUsersService.getUsers({
      search: typeof search === "string" ? search : undefined,
      role: typeof role === "string" ? role : undefined
    });

    res.status(200).json(users);
  } catch (error: any) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error("Error in listUsers:", error);
    }
    res.status(status).json({ error: error.message || "Failed to retrieve users" });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, role, isActive, initialPassword } = req.body;

    const result = await AdminUsersService.createUser({
      name,
      email,
      role,
      isActive,
      initialPassword
    });

    res.status(201).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error("Error in createUser:", error);
    }
    res.status(status).json({ error: error.message || "Failed to create user" });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const targetId = Number(req.params.id);
    if (isNaN(targetId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const currentAdminId = req.user?.id;
    if (!currentAdminId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { name, email, role, isActive } = req.body;

    const result = await AdminUsersService.updateUser(targetId, currentAdminId, {
      name,
      email,
      role,
      isActive
    });

    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error("Error in updateUser:", error);
    }
    res.status(status).json({ error: error.message || "Failed to update user" });
  }
}

export async function resetUserPassword(req: Request, res: Response): Promise<void> {
  try {
    const targetId = Number(req.params.id);
    if (isNaN(targetId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const { initialPassword } = req.body;

    const result = await AdminUsersService.resetPassword(targetId, initialPassword);

    res.status(200).json(result);
  } catch (error: any) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error("Error in resetUserPassword:", error);
    }
    res.status(status).json({ error: error.message || "Failed to reset password" });
  }
}
