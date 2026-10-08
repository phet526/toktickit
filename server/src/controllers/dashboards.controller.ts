import { Request, Response } from "express";
import { DashboardsService } from "../services/dashboards.service.js";

export async function getRequesterDashboard(req: Request, res: Response): Promise<void> {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
      return;
    }

    // Role check: Only REQUESTER (AC-13, BR-12)
    if (currentUser.role !== "REQUESTER") {
      res.status(403).json({
        error: "Access denied. Only requesters can access the requester dashboard.",
        code: "FORBIDDEN_ACTION"
      });
      return;
    }

    const data = await DashboardsService.getRequesterDashboard(currentUser.id);
    res.status(200).json(data);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message, code: error.code || "ERROR" });
      return;
    }
    console.error("Error in getRequesterDashboard:", error);
    res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getStaffDashboard(req: Request, res: Response): Promise<void> {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
      return;
    }

    // Role check: Only IT_STAFF and ADMINISTRATOR (AC-15, FR-12)
    if (currentUser.role !== "IT_STAFF" && currentUser.role !== "ADMINISTRATOR") {
      res.status(403).json({
        error: "Access denied. Only IT Staff and Administrators can access the staff dashboard.",
        code: "FORBIDDEN_ACTION"
      });
      return;
    }

    const data = await DashboardsService.getStaffDashboard({
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role
    });
    res.status(200).json(data);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message, code: error.code || "ERROR" });
      return;
    }
    console.error("Error in getStaffDashboard:", error);
    res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
  }
}
