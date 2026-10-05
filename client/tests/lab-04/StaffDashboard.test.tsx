import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StaffDashboard from "../../src/pages/StaffDashboard";
import { BrowserRouter } from "react-router-dom";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

vi.mock("../../src/api", () => ({
  getStaffDashboard: vi.fn()
}));

describe("Lab 4 — IT Staff Dashboard Component Tests (Issue 5: #44, UI-07 & STYLE-01)", () => {
  const mockStaffUser = {
    id: 2,
    name: "Michael Chang",
    email: "michael.chang@toktickit.com",
    role: "IT_STAFF" as const,
    isActive: true
  };

  const mockAdminUser = {
    id: 1,
    name: "System Admin",
    email: "admin@toktickit.com",
    role: "ADMINISTRATOR" as const,
    isActive: true
  };

  const mockDashboardData: api.StaffDashboardData = {
    staff: {
      id: 2,
      name: "Michael Chang",
      role: "IT_STAFF"
    },
    metrics: {
      newTickets: 14,
      openTickets: 23,
      inProgressTickets: 18,
      waitingForRequesterTickets: 7,
      myAssignedTickets: 16,
      unassignedTickets: 8
    },
    trends: {
      newTickets: "+2 from yesterday",
      openTickets: "+0 from yesterday",
      inProgressTickets: "+0 from yesterday",
      waitingForRequesterTickets: "+0 from yesterday",
      myAssignedTickets: "+0 from yesterday",
      unassignedTickets: "+0 from yesterday"
    },
    ticketsByPriority: {
      Low: 12,
      Medium: 28,
      High: 17,
      Critical: 4
    },
    myRecentTickets: [
      {
        id: 134,
        ticketNo: "TKT-2026-000134",
        summary: "Laptop battery drains quickly",
        category: "Hardware",
        itPriority: "High",
        currentStatus: "In Progress",
        updatedAt: "2026-09-22T07:14:00.000Z"
      }
    ],
    adminSummary: null
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
    vi.mocked(api.getStaffDashboard).mockResolvedValue(mockDashboardData);
  });

  const renderDashboard = () =>
    render(
      <BrowserRouter>
        <StaffDashboard />
      </BrowserRouter>
    );

  it("UI-07: should render all 6 metric cards including Unassigned with drill-down links", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Welcome back, Michael Chang!")).toBeInTheDocument();
    });

    // Verify 6 card values
    expect(screen.getByText("14")).toBeInTheDocument(); // New
    expect(screen.getByText("23")).toBeInTheDocument(); // Open
    expect(screen.getByText("18")).toBeInTheDocument(); // In Progress
    expect(screen.getByText("7")).toBeInTheDocument();  // Waiting Req
    expect(screen.getByText("16")).toBeInTheDocument(); // My Assigned
    expect(screen.getByText("8")).toBeInTheDocument();  // Unassigned

    // Verify drill-down links (Section 6)
    expect(document.querySelector("a[href='/staff/queue?status=New']")).toBeTruthy();
    expect(document.querySelector("a[href='/staff/queue?status=Open']")).toBeTruthy();
    expect(document.querySelector("a[href='/staff/queue?status=In%20Progress']")).toBeTruthy();
    expect(document.querySelector("a[href='/staff/queue?status=Waiting%20for%20Requester']")).toBeTruthy();
    expect(document.querySelector("a[href='/staff/queue?owner=me']")).toBeTruthy();
    expect(document.querySelector("a[href='/staff/queue?owner=unassigned']")).toBeTruthy();
  });

  it("UI-07: should render Tickets by Priority, My Recent Tickets, and Quick Actions", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Tickets by IT Priority")).toBeInTheDocument();
    });

    // Check Priority counts
    expect(screen.getByText("12")).toBeInTheDocument(); // Low
    expect(screen.getByText("28")).toBeInTheDocument(); // Medium
    expect(screen.getByText("17")).toBeInTheDocument(); // High
    expect(screen.getByText("4")).toBeInTheDocument();  // Critical

    // Check Recent Ticket
    expect(screen.getByText("TKT-2026-000134")).toBeInTheDocument();
    expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();

    // Check Quick Action links (Operational shortcuts for Staff/Admin - No Create Ticket as per RBAC matrix)
    expect(document.querySelector("a[href='/create-ticket']")).toBeNull();
    expect(document.querySelector("a[href='/staff/queue']")).toBeTruthy();
    expect(document.querySelector("a[href='/staff/queue?owner=me']")).toBeTruthy();
    expect(document.querySelector("a[href='/staff/queue?owner=unassigned']")).toBeTruthy();
  });

  it("UI-07: should render Admin Summary panel when logged in as Administrator", async () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: mockAdminUser,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      changePassword: vi.fn()
    });

    vi.mocked(api.getStaffDashboard).mockResolvedValue({
      ...mockDashboardData,
      staff: { id: 1, name: "System Admin", role: "ADMINISTRATOR" },
      adminSummary: {
        totalActiveUsers: 15,
        activeStaff: 5,
        activeRequesters: 9,
        activeAdmins: 1
      }
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Admin Summary/i)).toBeInTheDocument();
    });

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Total Active Users")).toBeInTheDocument();
    expect(document.querySelector("a[href='/admin/users']")).toBeTruthy();
  });

  it("STYLE-01: should apply Zen Green theme tokens and visible contrast", async () => {
    renderDashboard();

    await waitFor(() => {
      const refreshBtn = document.getElementById("btnRefreshStaffDashboard");
      expect(refreshBtn).toBeTruthy();
      // Verify Zen Green color #006B3C is configured on the primary action
      expect(refreshBtn?.getAttribute("style")).toMatch(/rgb\(0,\s*107,\s*60\)|#006B3C/i);
    });
  });
});
