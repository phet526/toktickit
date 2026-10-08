import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketDetail from "../../src/pages/TicketDetail";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

vi.mock("../../src/api", () => ({
  getStaffTicketDetail: vi.fn(),
  getTicketById: vi.fn(),
  updateTicketOwnership: vi.fn(),
  updateITPriority: vi.fn(),
  updateTicketStatus: vi.fn(),
  getPublicComments: vi.fn().mockResolvedValue([]),
  createPublicComment: vi.fn(),
  getInternalNotes: vi.fn().mockResolvedValue([]),
  createInternalNote: vi.fn(),
  getActiveStaffList: vi.fn().mockResolvedValue([]),
  indicateProblemResolved: vi.fn(),
  deleteAttachment: vi.fn(),
  getActionsTaken: vi.fn().mockResolvedValue({ ticketId: 101, ticketNo: "TKT-2026-00001", data: [] })
}));

describe("Lab 4 — Ticket Workflow, Resolution Gate & Concurrency UI Tests (Issue 4: #43)", () => {
  const mockStaffUser = {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@toktickit.com",
    role: "IT_STAFF" as const,
    isActive: true
  };

  const mockStaffTicket: api.StaffTicketDetail = {
    id: 101,
    ticketNo: "TKT-2026-00001",
    summary: "Cannot connect to office VPN from home",
    description: "User reports intermittent timeout when connecting to Gateway 2.",
    requestedPriority: "High",
    itPriority: "High",
    currentStatus: "Open",
    problemResolvedReported: false,
    createdAt: "2026-09-08T10:00:00.000Z",
    updatedAt: "2026-09-08T10:30:00.000Z",
    category: { id: 1, name: "Network" },
    relatedSystem: { id: 2, name: "Corporate VPN" },
    requester: { id: 4, name: "Jennifer Anderson", email: "jennifer.anderson@example.com" },
    assignedStaff: { id: 2, name: "Sarah Johnson", email: "sarah.johnson@toktickit.com" },
    attachments: [],
    permittedStatusTransitions: ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: mockStaffUser,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      changePassword: vi.fn()
    });
    vi.mocked(api.getStaffTicketDetail).mockResolvedValue(mockStaffTicket);
    vi.mocked(api.getActionsTaken).mockResolvedValue({
      ticketId: 101,
      ticketNo: "TKT-2026-00004",
      data: []
    });
    vi.mocked(api.getActiveStaffList).mockResolvedValue([
      { id: 2, name: "Sarah Johnson", email: "sarah.johnson@toktickit.com" }
    ]);
    vi.mocked(api.getPublicComments).mockResolvedValue([]);
    vi.mocked(api.getInternalNotes).mockResolvedValue([]);
  });

  const renderWithRouter = (ticketId: number = 101) => {
    window.history.pushState({}, "Test page", `/tickets/${ticketId}`);
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetail />} />
        </Routes>
      </BrowserRouter>
    );
  };

  // ---------------------------------------------------------------------------
  // UI-04: Resolution Gate Feedback (AC-08, BR-08, Section 3.5.1)
  // ---------------------------------------------------------------------------
  it("UI-04: displays inline warning banner when Resolution Gate blocks transition to Resolved", async () => {
    const gateError: any = new Error(
      "Cannot resolve ticket without an assigned owner and at least one Action Taken record."
    );
    gateError.status = 400;
    gateError.code = "RESOLUTION_GATE_FAILED";
    gateError.details = { hasOwner: true, actionsCount: 0 };

    vi.mocked(api.updateTicketStatus).mockRejectedValueOnce(gateError);

    renderWithRouter(101);

    await waitFor(() => {
      expect(screen.getByText("Cannot connect to office VPN from home")).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText("Ticket Status") || document.getElementById("selectTicketStatus");
    expect(statusSelect).toBeInTheDocument();

    // Trigger transition to Resolved
    fireEvent.change(statusSelect!, { target: { value: "Resolved" } });

    // Verify Resolution Gate inline warning banner appears
    await waitFor(() => {
      const warningBanner = document.getElementById("resolutionGateWarning");
      expect(warningBanner).toBeInTheDocument();
      expect(warningBanner?.textContent).toContain("Resolution Gate Failed");
      expect(warningBanner?.textContent).toContain("at least one Action Taken record");
    });
  });

  // ---------------------------------------------------------------------------
  // UI-05: Concurrency / Stale Update Alert Modal (AC-11, BR-11, Section 3.5.2)
  // ---------------------------------------------------------------------------
  it("UI-05: displays 409 Conflict Dialog Modal on stale update and refreshes data on button click", async () => {
    const conflictError: any = new Error(
      "Ticket has been modified by another user. Please refresh and try again."
    );
    conflictError.status = 409;
    conflictError.code = "STALE_RECORD_CONFLICT";

    vi.mocked(api.updateTicketStatus).mockRejectedValueOnce(conflictError);

    renderWithRouter(101);

    await waitFor(() => {
      expect(screen.getByText("Cannot connect to office VPN from home")).toBeInTheDocument();
    });

    const statusSelect = document.getElementById("selectTicketStatus");
    expect(statusSelect).toBeInTheDocument();

    // Trigger transition which causes 409 Conflict
    fireEvent.change(statusSelect!, { target: { value: "In Progress" } });

    // Verify 409 Conflict Modal appears
    await waitFor(() => {
      expect(screen.getByText(/Data Out of Date \(409 Conflict\)/i)).toBeInTheDocument();
      expect(screen.getByText(/This ticket has been modified by another user/i)).toBeInTheDocument();
    });

    const refreshBtn = document.getElementById("btnRefreshConflict") || screen.getByText("Refresh Latest Data");
    expect(refreshBtn).toBeInTheDocument();

    // Click refresh button
    fireEvent.click(refreshBtn!);

    // Verify getStaffTicketDetail was called to reload fresh data
    await waitFor(() => {
      expect(api.getStaffTicketDetail).toHaveBeenCalledWith(101);
      expect(screen.queryByText(/Data Out of Date \(409 Conflict\)/i)).not.toBeInTheDocument();
    });
  });
});
