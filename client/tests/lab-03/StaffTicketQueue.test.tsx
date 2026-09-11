import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StaffTicketQueue, { getStatusBadgeStyle, getPriorityBadgeStyle } from "../../src/pages/StaffTicketQueue";
import { BrowserRouter } from "react-router-dom";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  getStaffTickets: vi.fn(),
  checkSystem: vi.fn()
}));

describe("UI-03 & UI-06: IT Staff Ticket Queue Component Tests", () => {
  const mockTickets: api.StaffTicketItem[] = [
    {
      id: 101,
      ticketNo: "TKT-2026-00001",
      createdDate: "2026-09-08T10:00:00.000Z",
      summary: "Cannot connect to VPN from home",
      category: "Network",
      requestedPriority: "High",
      itPriority: "High",
      currentStatus: "In Progress",
      ticketOwner: { id: 2, name: "Sarah Johnson" },
      problemResolvedReported: false
    },
    {
      id: 102,
      ticketNo: "TKT-2026-00002",
      createdDate: "2026-09-09T14:30:00.000Z",
      summary: "Broken laptop display screen",
      category: "Hardware",
      requestedPriority: "Medium",
      itPriority: "Critical",
      currentStatus: "Open",
      ticketOwner: null,
      problemResolvedReported: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.checkSystem as any).mockResolvedValue({
      online: true,
      categories: [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Software" },
        { id: 4, name: "Network" }
      ]
    });
  });

  it("UI-03: renders ticket queue headers, search input, filters and ticket rows", async () => {
    (api.getStaffTickets as any).mockResolvedValue({
      data: mockTickets,
      meta: { totalItems: 2, currentPage: 1, totalPages: 1, limit: 10 }
    });

    render(
      <BrowserRouter>
        <StaffTicketQueue />
      </BrowserRouter>
    );

    // Verify Title & Subtitle
    expect(screen.getByText(/it staff ticket queue/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ticket no\. or summary\.\.\./i)).toBeInTheDocument();

    // Verify Filters
    expect(screen.getByLabelText(/^status$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^category$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^it priority$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^ownership$/i)).toBeInTheDocument();

    // Verify table data rendered
    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-00001")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Cannot connect to VPN from home")[0]).toBeInTheDocument();
      expect(screen.getAllByText("TKT-2026-00002")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Broken laptop display screen")[0]).toBeInTheDocument();
    });

    // Check Assigned owner & unassigned badge
    expect(screen.getAllByText("Sarah Johnson")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Unassigned")[0]).toBeInTheDocument();
  });

  it("UI-06: applies correct Zen Green status and priority badge color tokens", () => {
    const newStyle = getStatusBadgeStyle("New");
    expect(newStyle.backgroundColor).toBe("#E0F2FE");
    expect(newStyle.color).toBe("#0369A1");

    const inProgressStyle = getStatusBadgeStyle("In Progress");
    expect(inProgressStyle.backgroundColor).toBe("#FEF3C7");
    expect(inProgressStyle.color).toBe("#B45309");

    const resolvedStyle = getStatusBadgeStyle("Resolved");
    expect(resolvedStyle.backgroundColor).toBe("#DCFCE7");
    expect(resolvedStyle.color).toBe("#15803D");

    const critPriorityStyle = getPriorityBadgeStyle("Critical");
    expect(critPriorityStyle.backgroundColor).toBe("#FEE2E2");
    expect(critPriorityStyle.color).toBe("#991B1B");
  });

  it("triggers search with debounce and calls getStaffTickets", async () => {
    (api.getStaffTickets as any).mockResolvedValue({
      data: [mockTickets[0]],
      meta: { totalItems: 1, currentPage: 1, totalPages: 1, limit: 10 }
    });

    render(
      <BrowserRouter>
        <StaffTicketQueue />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/ticket no\. or summary\.\.\./i);
    fireEvent.change(searchInput, { target: { value: "VPN" } });

    await waitFor(() => {
      expect(api.getStaffTickets).toHaveBeenCalledWith(
        expect.objectContaining({ search: "VPN" })
      );
    });
  });

  it("applies status and ownership filter changes", async () => {
    (api.getStaffTickets as any).mockResolvedValue({
      data: mockTickets,
      meta: { totalItems: 2, currentPage: 1, totalPages: 1, limit: 10 }
    });

    render(
      <BrowserRouter>
        <StaffTicketQueue />
      </BrowserRouter>
    );

    const statusSelect = screen.getByLabelText(/^status$/i);
    fireEvent.change(statusSelect, { target: { value: "Open" } });

    await waitFor(() => {
      expect(api.getStaffTickets).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Open" })
      );
    });

    const ownerSelect = screen.getByLabelText(/^ownership$/i);
    fireEvent.change(ownerSelect, { target: { value: "unassigned" } });

    await waitFor(() => {
      expect(api.getStaffTickets).toHaveBeenCalledWith(
        expect.objectContaining({ owner: "unassigned" })
      );
    });
  });

  it("shows No-Results state when search or filters return empty and resets with Clear Filters", async () => {
    (api.getStaffTickets as any).mockImplementation((params: any) => {
      if (params?.search === "NonExistentTerm") {
        return Promise.resolve({
          data: [],
          meta: { totalItems: 0, currentPage: 1, totalPages: 1, limit: 10 }
        });
      }
      return Promise.resolve({
        data: mockTickets,
        meta: { totalItems: 2, currentPage: 1, totalPages: 1, limit: 10 }
      });
    });

    render(
      <BrowserRouter>
        <StaffTicketQueue />
      </BrowserRouter>
    );

    // Apply a search filter
    const searchInput = screen.getByPlaceholderText(/ticket no\. or summary\.\.\./i);
    fireEvent.change(searchInput, { target: { value: "NonExistentTerm" } });

    await waitFor(() => {
      expect(
        screen.getByText(/no tickets match your search criteria/i)
      ).toBeInTheDocument();
    });

    const clearButton = screen.getByRole("button", { name: /clear filters/i });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);

    await waitFor(() => {
      expect((searchInput as HTMLInputElement).value).toBe("");
    });
  });

  it("shows empty state message when queue has no tickets at all", async () => {
    (api.getStaffTickets as any).mockResolvedValue({
      data: [],
      meta: { totalItems: 0, currentPage: 1, totalPages: 1, limit: 10 }
    });

    render(
      <BrowserRouter>
        <StaffTicketQueue />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no tickets in queue/i)).toBeInTheDocument();
    });
  });

  it("handles pagination navigation buttons", async () => {
    (api.getStaffTickets as any).mockResolvedValue({
      data: mockTickets,
      meta: { totalItems: 25, currentPage: 1, totalPages: 3, limit: 10 }
    });

    render(
      <BrowserRouter>
        <StaffTicketQueue />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/showing/i)).toHaveTextContent(/showing 1 to 10 of 25 tickets/i);
    });

    const nextBtn = screen.getByLabelText(/next page/i);
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(api.getStaffTickets).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it("displays safe error banner on failure and retries on button click", async () => {
    (api.getStaffTickets as any).mockRejectedValueOnce(new Error("Network connection lost"));

    render(
      <BrowserRouter>
        <StaffTicketQueue />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/network connection lost/i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    (api.getStaffTickets as any).mockResolvedValueOnce({
      data: mockTickets,
      meta: { totalItems: 2, currentPage: 1, totalPages: 1, limit: 10 }
    });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-00001")[0]).toBeInTheDocument();
    });
  });
});
