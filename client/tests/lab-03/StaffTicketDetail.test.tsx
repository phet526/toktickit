import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketDetail from "../../src/pages/TicketDetail";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

// Mock the API module
vi.mock("../../src/api", () => ({
  getStaffTicketDetail: vi.fn(),
  getTicketById: vi.fn(),
  updateTicketOwnership: vi.fn(),
  updateITPriority: vi.fn(),
  updateTicketStatus: vi.fn(),
  getPublicComments: vi.fn(),
  createPublicComment: vi.fn(),
  getInternalNotes: vi.fn(),
  createInternalNote: vi.fn(),
  getActiveStaffList: vi.fn(),
  indicateProblemResolved: vi.fn(),
  deleteAttachment: vi.fn()
}));

describe("UI-04: Staff Ticket Detail & Operations Component Tests", () => {
  const mockStaffUser = {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@toktickit.com",
    role: "IT_STAFF" as const,
    isActive: true
  };

  const mockActiveStaff = [
    { id: 2, name: "Sarah Johnson", email: "sarah.johnson@toktickit.com" },
    { id: 3, name: "Michael Chang", email: "michael.chang@toktickit.com" }
  ];

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
    assignedStaff: null, // initially unassigned
    attachments: [
      { id: 11, filename: "vpn_error.png", size: 2048, mimeType: "image/png" }
    ],
    permittedStatusTransitions: ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"]
  };

  const mockComments: api.CommentItem[] = [
    {
      id: 1,
      content: "Please check if your VPN client is updated.",
      author: { id: 2, name: "Sarah Johnson", role: "IT_STAFF" },
      createdAt: "2026-09-08T10:15:00.000Z"
    }
  ];

  const mockNotes: api.InternalNoteItem[] = [
    {
      id: 1,
      content: "Gateway 2 CPU load was at 98% during peak hours.",
      author: { id: 2, name: "Sarah Johnson", role: "IT_STAFF" },
      createdAt: "2026-09-08T10:20:00.000Z"
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: mockStaffUser,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      refreshUser: vi.fn()
    });

    vi.mocked(api.getStaffTicketDetail).mockResolvedValue(mockStaffTicket);
    vi.mocked(api.getActiveStaffList).mockResolvedValue(mockActiveStaff);
    vi.mocked(api.getPublicComments).mockResolvedValue(mockComments);
    vi.mocked(api.getInternalNotes).mockResolvedValue(mockNotes);
  });

  const renderComponent = () => {
    window.history.pushState({}, "Test", "/tickets/101");
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetail />} />
        </Routes>
      </BrowserRouter>
    );
  };

  it("UI-04: renders ticket information, action bar, and unassigned status", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-00001")).toBeInTheDocument();
      expect(screen.getByText("Cannot connect to office VPN from home")).toBeInTheDocument();
      expect(screen.getByText("Unassigned Ticket")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Claim Ticket/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/IT Priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ticket Status/i)).toBeInTheDocument();
    });
  });

  it("UI-04: clicking Claim Ticket claims ownership for current user", async () => {
    vi.mocked(api.updateTicketOwnership).mockResolvedValueOnce({
      message: "Ticket ownership updated successfully",
      assignedStaff: { id: 2, name: "Sarah Johnson" }
    });

    renderComponent();

    const claimButton = await screen.findByRole("button", { name: /Claim Ticket/i });
    fireEvent.click(claimButton);

    await waitFor(() => {
      expect(api.updateTicketOwnership).toHaveBeenCalledWith(101, 2);
      expect(screen.getByText("You have claimed this ticket.")).toBeInTheDocument();
    });
  });

  it("UI-04: selecting a staff member reassigns ticket", async () => {
    vi.mocked(api.updateTicketOwnership).mockResolvedValueOnce({
      message: "Ticket ownership updated successfully",
      assignedStaff: { id: 3, name: "Michael Chang" }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Or assign to staff member:/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Or assign to staff member:/i);
    fireEvent.change(select, { target: { value: "3" } });

    await waitFor(() => {
      expect(api.updateTicketOwnership).toHaveBeenCalledWith(101, 3);
      expect(screen.getByText(/Ticket reassigned to Michael Chang/i)).toBeInTheDocument();
    });
  });

  it("UI-04: changing IT Priority triggers API and updates display", async () => {
    vi.mocked(api.updateITPriority).mockResolvedValueOnce({
      message: "IT Priority updated successfully",
      itPriority: "Critical"
    });

    renderComponent();

    await screen.findByText("TKT-2026-00001");

    const prioritySelect = screen.getByRole("combobox", { name: /^IT Priority$/i });
    fireEvent.change(prioritySelect, { target: { value: "Critical" } });

    await waitFor(() => {
      expect(api.updateITPriority).toHaveBeenCalledWith(101, "Critical");
      expect(screen.getByText(/IT Priority updated to Critical/i)).toBeInTheDocument();
    });
  });

  it("UI-04: selecting permitted next status transitions ticket", async () => {
    vi.mocked(api.updateTicketStatus).mockResolvedValueOnce({
      message: "Ticket status updated successfully",
      currentStatus: "In Progress"
    });

    renderComponent();

    await screen.findByText("TKT-2026-00001");

    const statusSelect = screen.getByRole("combobox", { name: /^Ticket Status$/i });
    fireEvent.change(statusSelect, { target: { value: "In Progress" } });

    await waitFor(() => {
      expect(api.updateTicketStatus).toHaveBeenCalledWith(101, "In Progress");
    });
  });

  it("UI-04: switches between Public Comments and Internal Notes with safety warning styling", async () => {
    renderComponent();

    // Verify public comments default tab
    await screen.findByText("Please check if your VPN client is updated.");

    // Switch to Internal Notes tab
    const notesTab = screen.getByRole("tab", { name: /Internal Notes/i });
    fireEvent.click(notesTab);

    // Verify Internal Note badge & confidential warning
    await waitFor(() => {
      expect(screen.getByText("🔒 Internal Note - IT Staff Only")).toBeInTheDocument();
      expect(screen.getByText("Strictly Confidential")).toBeInTheDocument();
      expect(screen.getByText("Gateway 2 CPU load was at 98% during peak hours.")).toBeInTheDocument();
    });
  });

  it("UI-04: submits internal note with loading state", async () => {
    vi.mocked(api.createInternalNote).mockResolvedValueOnce({
      id: 2,
      content: "Escalated to ISP provider.",
      author: { id: 2, name: "Sarah Johnson", role: "IT_STAFF" },
      createdAt: "2026-09-08T11:00:00.000Z"
    });

    renderComponent();

    const notesTab = await screen.findByRole("tab", { name: /Internal Notes/i });
    fireEvent.click(notesTab);

    const input = await screen.findByPlaceholderText(/Record technical notes/i);
    fireEvent.change(input, { target: { value: "Escalated to ISP provider." } });

    const submitBtn = screen.getByRole("button", { name: /Add Internal Note/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createInternalNote).toHaveBeenCalledWith(101, "Escalated to ISP provider.");
      expect(screen.getByText("Internal note saved successfully.")).toBeInTheDocument();
    });
  });

  it("UI-04: submits public comment with loading state", async () => {
    vi.mocked(api.createPublicComment).mockResolvedValueOnce({
      id: 2,
      content: "We deployed a patch to gateway 2.",
      author: { id: 2, name: "Sarah Johnson", role: "IT_STAFF" },
      createdAt: "2026-09-08T11:15:00.000Z"
    });

    renderComponent();

    const commentInput = await screen.findByPlaceholderText(/Type your message here/i);
    fireEvent.change(commentInput, { target: { value: "We deployed a patch to gateway 2." } });

    const submitBtn = screen.getByRole("button", { name: /Post Comment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createPublicComment).toHaveBeenCalledWith(101, "We deployed a patch to gateway 2.");
      expect(screen.getByText("Comment posted successfully.")).toBeInTheDocument();
    });
  });

  it("UI-04: hides Internal Notes tab completely when logged in as Requester", async () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: 4,
        name: "Jennifer Anderson",
        email: "jennifer.anderson@example.com",
        role: "REQUESTER",
        isActive: true
      },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      refreshUser: vi.fn()
    });

    vi.mocked(api.getTicketById).mockResolvedValueOnce(mockStaffTicket as any);

    renderComponent();

    await screen.findByText("Cannot connect to office VPN from home");

    // Internal Notes tab must NOT be in document!
    expect(screen.queryByRole("tab", { name: /Internal Notes/i })).not.toBeInTheDocument();
    expect(screen.queryByText("🔒 Internal Note - IT Staff Only")).not.toBeInTheDocument();
  });
});
