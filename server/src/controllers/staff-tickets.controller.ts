import { Request, Response } from "express";
import { StaffTicketsService } from "../services/staff-tickets.service.js";

export async function getStaffTickets(req: Request, res: Response): Promise<void> {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
      return;
    }

    const {
      search,
      status,
      category,
      priority,
      owner,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const result = await StaffTicketsService.getStaffTickets(
      {
        search: typeof search === "string" ? search : undefined,
        status: typeof status === "string" ? status : undefined,
        category: typeof category === "string" ? category : undefined,
        priority: typeof priority === "string" ? priority : undefined,
        owner: typeof owner === "string" ? owner : undefined,
        page: typeof page === "string" ? page : undefined,
        limit: typeof limit === "string" ? limit : undefined,
        sortBy: typeof sortBy === "string" ? sortBy : undefined,
        sortOrder: typeof sortOrder === "string" ? sortOrder : undefined
      },
      currentUser
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getStaffTickets:", error);
    res.status(500).json({ error: "Failed to retrieve tickets", code: "INTERNAL_ERROR" });
  }
}
