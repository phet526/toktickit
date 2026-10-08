import { Request, Response } from "express";
import { getPrisma } from "../prisma.js";

export interface ActionTakenValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
}

export function validateActionTakenInput(body: any): ActionTakenValidationResult {
  if (!body || typeof body !== "object") {
    return { isValid: false, error: "Invalid request body.", code: "VALIDATION_ERROR" };
  }

  const { actionDescription, result, followUpRequired, followUpNote, attachmentNotes } = body;

  // Description validation
  if (!actionDescription || typeof actionDescription !== "string" || actionDescription.trim().length === 0) {
    return { isValid: false, error: "Action description is required.", code: "VALIDATION_ERROR" };
  }
  if (actionDescription.length > 2000) {
    return { isValid: false, error: "Action description must not exceed 2,000 characters.", code: "VALIDATION_ERROR" };
  }

  // Result validation
  if (!result || typeof result !== "string" || result.trim().length === 0) {
    return { isValid: false, error: "Result is required.", code: "VALIDATION_ERROR" };
  }
  if (result.length > 2000) {
    return { isValid: false, error: "Result must not exceed 2,000 characters.", code: "VALIDATION_ERROR" };
  }

  // followUpRequired validation
  if (typeof followUpRequired !== "boolean") {
    return { isValid: false, error: "followUpRequired must be a boolean.", code: "VALIDATION_ERROR" };
  }

  // BR-06: Mandatory follow-up note when followUpRequired is true
  if (followUpRequired) {
    if (!followUpNote || typeof followUpNote !== "string" || followUpNote.trim().length === 0) {
      return {
        isValid: false,
        error: "Follow-up note is required when follow-up is marked as needed.",
        code: "FOLLOW_UP_NOTE_REQUIRED"
      };
    }
    if (followUpNote.length > 1000) {
      return { isValid: false, error: "Follow-up note must not exceed 1,000 characters.", code: "VALIDATION_ERROR" };
    }
  }

  // attachmentNotes validation (optional max 500)
  if (attachmentNotes !== undefined && attachmentNotes !== null) {
    if (typeof attachmentNotes !== "string" || attachmentNotes.length > 500) {
      return { isValid: false, error: "Attachment notes must not exceed 500 characters.", code: "VALIDATION_ERROR" };
    }
  }

  return { isValid: true };
}

export class ActionsTakenController {
  /**
   * GET /api/v1/tickets/:ticketId/actions
   * Requester: Allowed ONLY on their own ticket (BR-03)
   * IT Staff & Admin: Allowed on any ticket
   */
  static async getActions(req: Request, res: Response) {
    try {
      const ticketId = parseInt(req.params.ticketId || req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: "Invalid ticket ID.", code: "VALIDATION_ERROR" });
      }

      const prisma = getPrisma();
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found.", code: "NOT_FOUND" });
      }

      // Authorization check (BR-03)
      const user = req.user!;
      if (user.role === "REQUESTER" && ticket.requesterId !== user.id) {
        return res.status(403).json({
          error: "Access denied. You can only view actions on your own tickets.",
          code: "FORBIDDEN_ACTION"
        });
      }

      const actions = await prisma.actionTaken.findMany({
        where: { ticketId },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { actionDateTime: "asc" }
      });

      return res.status(200).json({
        ticketId: ticket.id,
        ticketNo: ticket.ticketNo,
        data: actions
      });
    } catch (error) {
      console.error("Error fetching actions taken:", error);
      return res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
    }
  }

  /**
   * POST /api/v1/tickets/:ticketId/actions
   * Only active IT_STAFF and ADMINISTRATOR (BR-04)
   * performedById is immutably set from session (BR-05)
   */
  static async createAction(req: Request, res: Response) {
    try {
      const ticketId = parseInt(req.params.ticketId || req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: "Invalid ticket ID.", code: "VALIDATION_ERROR" });
      }

      const prisma = getPrisma();
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });

      // BR-04: Active staff check
      if (!currentUser || !currentUser.isActive) {
        return res.status(403).json({
          error: "Only active IT Staff and Administrators can record actions taken.",
          code: "FORBIDDEN_ACTION"
        });
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found.", code: "NOT_FOUND" });
      }

      // Input Validation
      const validation = validateActionTakenInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error, code: validation.code });
      }

      const { actionDescription, result, followUpRequired, followUpNote, attachmentNotes, actionDateTime } = req.body;

      // BR-05: performedById strictly bound to authenticated user
      const performedById = currentUser.id;

      const newAction = await prisma.actionTaken.create({
        data: {
          ticketId,
          actionDateTime: actionDateTime ? new Date(actionDateTime) : new Date(),
          actionDescription: actionDescription.trim(),
          result: result.trim(),
          performedById,
          followUpRequired: Boolean(followUpRequired),
          followUpNote: followUpRequired && followUpNote ? followUpNote.trim() : null,
          attachmentNotes: attachmentNotes && attachmentNotes.trim() ? attachmentNotes.trim() : null
        },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      return res.status(201).json({
        message: "Action Taken recorded successfully",
        data: newAction
      });
    } catch (error) {
      console.error("Error creating action taken:", error);
      return res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
    }
  }

  /**
   * PUT /api/v1/tickets/:ticketId/actions/:actionId
   * Only active IT_STAFF and ADMINISTRATOR (BR-04)
   * Optimistic Concurrency check with HTTP 409 (BR-11)
   * performedById remains immutable (BR-05)
   */
  static async updateAction(req: Request, res: Response) {
    try {
      const ticketId = parseInt(req.params.ticketId || req.params.id);
      const actionId = parseInt(req.params.actionId);

      if (isNaN(ticketId) || isNaN(actionId)) {
        return res.status(400).json({ error: "Invalid ticket ID or action ID.", code: "VALIDATION_ERROR" });
      }

      const prisma = getPrisma();
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });

      // BR-04: Active staff check
      if (!currentUser || !currentUser.isActive) {
        return res.status(403).json({
          error: "Only active IT Staff and Administrators can update actions taken.",
          code: "FORBIDDEN_ACTION"
        });
      }

      const existingAction = await prisma.actionTaken.findFirst({
        where: { id: actionId, ticketId }
      });

      if (!existingAction) {
        return res.status(404).json({ error: "Action Taken record not found.", code: "NOT_FOUND" });
      }

      // BR-11: Optimistic Concurrency Check (Stale Update)
      if (req.body.updatedAt) {
        const clientTimestamp = new Date(req.body.updatedAt).getTime();
        const dbTimestamp = existingAction.updatedAt.getTime();

        if (clientTimestamp !== dbTimestamp) {
          return res.status(409).json({
            error: "Action Taken record has been modified by another user. Please refresh and try again.",
            code: "STALE_RECORD_CONFLICT"
          });
        }
      }

      // Input Validation
      const validation = validateActionTakenInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error, code: validation.code });
      }

      const { actionDescription, result, followUpRequired, followUpNote, attachmentNotes, actionDateTime } = req.body;

      const updatedAction = await prisma.actionTaken.update({
        where: { id: actionId },
        data: {
          actionDateTime: actionDateTime ? new Date(actionDateTime) : undefined,
          actionDescription: actionDescription.trim(),
          result: result.trim(),
          followUpRequired: Boolean(followUpRequired),
          followUpNote: followUpRequired && followUpNote ? followUpNote.trim() : null,
          attachmentNotes: attachmentNotes && attachmentNotes.trim() ? attachmentNotes.trim() : null
        },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      return res.status(200).json({
        message: "Action Taken updated successfully",
        data: updatedAction
      });
    } catch (error) {
      console.error("Error updating action taken:", error);
      return res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
    }
  }
}
