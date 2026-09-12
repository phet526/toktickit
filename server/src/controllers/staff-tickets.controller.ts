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

export async function getStaffTicketDetail(req: Request, res: Response): Promise<void> {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const ticket = await StaffTicketsService.getTicketDetail(ticketId);
    res.status(200).json(ticket);
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    console.error("Error in getStaffTicketDetail:", error);
    res.status(500).json({ error: "Failed to retrieve ticket details", code: "INTERNAL_ERROR" });
  }
}

export async function updateTicketOwnership(req: Request, res: Response): Promise<void> {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const { assignedStaffId } = req.body;
    if (assignedStaffId === undefined || assignedStaffId === null || isNaN(Number(assignedStaffId))) {
      res.status(400).json({ error: "Valid assignedStaffId is required" });
      return;
    }

    const result = await StaffTicketsService.updateOwnership(ticketId, Number(assignedStaffId));
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "INVALID_STAFF") {
      res.status(400).json({ error: "assignedStaffId is invalid or not an active IT Staff member" });
      return;
    }
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    console.error("Error in updateTicketOwnership:", error);
    res.status(500).json({ error: "Failed to update ticket ownership", code: "INTERNAL_ERROR" });
  }
}

export async function updateTicketPriority(req: Request, res: Response): Promise<void> {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const { itPriority } = req.body;
    if (!itPriority || typeof itPriority !== "string") {
      res.status(400).json({ error: "itPriority is required and must be a string" });
      return;
    }

    const result = await StaffTicketsService.updatePriority(ticketId, itPriority);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "INVALID_PRIORITY") {
      res.status(400).json({ error: "Invalid IT Priority value. Must be Low, Medium, High, or Critical." });
      return;
    }
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    console.error("Error in updateTicketPriority:", error);
    res.status(500).json({ error: "Failed to update IT Priority", code: "INTERNAL_ERROR" });
  }
}

export async function updateTicketStatus(req: Request, res: Response): Promise<void> {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const { status } = req.body;
    if (!status || typeof status !== "string") {
      res.status(400).json({ error: "status is required and must be a string" });
      return;
    }

    const result = await StaffTicketsService.updateStatus(ticketId, status);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message?.startsWith("INVALID_TRANSITION")) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    console.error("Error in updateTicketStatus:", error);
    res.status(500).json({ error: "Failed to update ticket status", code: "INTERNAL_ERROR" });
  }
}

export async function getInternalNotes(req: Request, res: Response): Promise<void> {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const notes = await StaffTicketsService.getInternalNotes(ticketId);
    res.status(200).json(notes);
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    console.error("Error in getInternalNotes:", error);
    res.status(500).json({ error: "Failed to retrieve internal notes", code: "INTERNAL_ERROR" });
  }
}

export async function createInternalNote(req: Request, res: Response): Promise<void> {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const currentUser = req.user;
    if (!currentUser) {
      res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "Note content cannot be empty" });
      return;
    }
    if (content.trim().length > 1000) {
      res.status(400).json({ error: "Note content must not exceed 1000 characters" });
      return;
    }

    const note = await StaffTicketsService.createInternalNote(ticketId, currentUser.id, content);
    res.status(201).json(note);
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    if (error.message === "EMPTY_CONTENT" || error.message === "CONTENT_TOO_LONG") {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error("Error in createInternalNote:", error);
    res.status(500).json({ error: "Failed to create internal note", code: "INTERNAL_ERROR" });
  }
}

export async function getActiveStaffList(_req: Request, res: Response): Promise<void> {
  try {
    const staff = await StaffTicketsService.getActiveStaffList();
    res.status(200).json(staff);
  } catch (error) {
    console.error("Error in getActiveStaffList:", error);
    res.status(500).json({ error: "Failed to retrieve active staff list", code: "INTERNAL_ERROR" });
  }
}

