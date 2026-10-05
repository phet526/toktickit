import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RequesterDashboard from "../../src/pages/RequesterDashboard";
import { BrowserRouter } from "react-router-dom";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

vi.mock("../../src/api", () => ({
  getRequesterDashboard: vi.fn()
}));

describe("Lab 4 — Requester Dashboard Component Tests (Issue 5: #44, UI-06)", () => {
  const mockRequester = {
    id: 1,
    name: "Jennifer Miller",
    email: "jennifer.miller@example.com",
    role: "REQUESTER" as const,
    isActive: true
  };

  const mockDashboardData: api.RequesterDashboardData = {
    requester: {
      id: 1,
      name: "Jennifer Miller"
    },
    metrics: {
      openTickets: 3,
      inProgressTickets: 2,
      waitingForRequesterTickets: 1,
      resolvedTickets: 5,
      closedTickets: 12
    },
    recentTickets: [
      {
        id: 134,
        ticketNo: "TKT-2026-000134",
        summary: "Laptop battery drains quickly",
        category: "Hardware",
        requestedPriority: "Medium",
        currentStatus: "In Progress",
        updatedAt: "2026-09-22T07:14:00.000Z"
      }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: mockRequester,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      changePassword: vi.fn()
    });
    vi.mocked(api.getRequesterDashboard).mockResolvedValue(mockDashboardData);
  });

  const renderDashboard = () =>
    render(
      <BrowserRouter>
        <RequesterDashboard />
      </BrowserRouter>
    );

  it("UI-06: should render 4 metric cards with correct numbers and drill-down links", async () => {
    renderDashboard();

    // Check Welcome banner
    await waitFor(() => {
      expect(screen.getByText("Welcome, Jennifer Miller!")).toBeInTheDocument();
    });

    // Check Metric Cards counts
    expect(screen.getByText("3")).toBeInTheDocument(); // Open
    expect(screen.getByText("2")).toBeInTheDocument(); // In Progress
    expect(screen.getByText("5")).toBeInTheDocument(); // Resolved
    expect(screen.getByText("12")).toBeInTheDocument(); // Closed

    // Check Drill-down links (Section 6)
    expect(document.getElementById("linkDrillOpen")?.getAttribute("href")).toBe("/my-tickets?status=Open");
    expect(document.getElementById("linkDrillInProgress")?.getAttribute("href")).toBe("/my-tickets?status=In%20Progress");
    expect(document.getElementById("linkDrillResolved")?.getAttribute("href")).toBe("/my-tickets?status=Resolved");
    expect(document.getElementById("linkDrillClosed")?.getAttribute("href")).toBe("/my-tickets?status=Closed");
  });

  it("UI-06: should render Recent Tickets table and Quick Actions panel", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000134")).toBeInTheDocument();
    });

    expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();

    // Quick Actions buttons
    expect(screen.getByText("Create Ticket")).toBeInTheDocument();
    expect(screen.getByText("View My Tickets")).toBeInTheDocument();

    const createBtn = document.querySelector("a[href='/create-ticket']");
    expect(createBtn).toBeTruthy();
    const viewMyTicketsBtn = document.querySelector("a[href='/my-tickets']");
    expect(viewMyTicketsBtn).toBeTruthy();
  });

  it("UI-06: should render Empty State safely when user has 0 tickets", async () => {
    vi.mocked(api.getRequesterDashboard).mockResolvedValue({
      requester: { id: 1, name: "Jennifer Miller" },
      metrics: {
        openTickets: 0,
        inProgressTickets: 0,
        waitingForRequesterTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0
      },
      recentTickets: []
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("No recent tickets found.")).toBeInTheDocument();
    });
    expect(screen.getByText("Submit your first request using the button on the right.")).toBeInTheDocument();
  });
});
