import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MyTickets from "../../src/pages/MyTickets";
import { BrowserRouter } from "react-router-dom";
import * as api from "../../src/api";

// Mock the API module
vi.mock("../../src/api", () => ({
  getTickets: vi.fn(),
  checkSystem: vi.fn(),
  getRelatedSystems: vi.fn()
}));

describe("MyTickets Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("requesterId", "1");
    (api.checkSystem as any).mockResolvedValue({ online: true, categories: [] });
    (api.getRelatedSystems as any).mockResolvedValue([]);
  });

  it("should render tickets and handle pagination without crashing", async () => {
    const mockData = {
      data: [
        { id: 1, ticketNo: "TKT-001", summary: "Test 1", currentStatus: "New", createdAt: "2026-01-01" },
        { id: 2, ticketNo: "TKT-002", summary: "Test 2", currentStatus: "In Progress", createdAt: "2026-01-02" }
      ],
      meta: { totalPages: 2, currentPage: 1, totalItems: 15 }
    };

    (api.getTickets as any).mockResolvedValueOnce(mockData);

    render(
      <BrowserRouter>
        <MyTickets />
      </BrowserRouter>
    );

    // Initial load
    expect(api.getTickets).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));
    
    await waitFor(() => {
      expect(screen.getByText("TKT-001")).toBeInTheDocument();
      expect(screen.getByText("TKT-002")).toBeInTheDocument();
    });

    // Test clicking Next Page
    const nextButton = screen.getByText(/Next/i);
    
    // Mock the second page response
    (api.getTickets as any).mockResolvedValueOnce({
      data: [{ id: 3, ticketNo: "TKT-003", summary: "Test 3", currentStatus: "Resolved", createdAt: "2026-01-03" }],
      meta: { totalPages: 2, currentPage: 2, totalItems: 15 }
    });

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(api.getTickets).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });
});
