import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateTicket from "../../src/pages/CreateTicket";
import * as api from "../../src/api";

// Mock API functions
vi.mock("../../src/api", () => ({
  checkSystem: vi.fn(),
  getRelatedSystems: vi.fn(),
  createTicket: vi.fn(),
  uploadAttachment: vi.fn(),
}));

describe("CreateTicket Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    // Setup minimal mock returns
    vi.mocked(api.checkSystem).mockResolvedValue({ categories: [{ id: 1, name: "Network" }] } as any);
    vi.mocked(api.getRelatedSystems).mockResolvedValue([{ id: 1, name: "Email" }] as any);
  });

  it("should display empty state if no requesterId in localStorage", async () => {
    render(<CreateTicket />);
    // Wait for the isInitializing state to resolve
    await waitFor(() => {
      expect(screen.getByText("No Development Requester Selected")).toBeInTheDocument();
    });
  });

  it("should show inline validation errors if form submitted empty", async () => {
    localStorage.setItem("requesterId", "1");
    render(<CreateTicket />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Create New Ticket")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    // Should display inline errors exactly below the fields
    await waitFor(() => {
      // Summary and description are text inputs/textareas
      expect(screen.getAllByText("Please fill this field.").length).toBeGreaterThan(0);
      expect(screen.getByText("Please select a category.")).toBeInTheDocument();
      expect(screen.getByText("Please select a related system.")).toBeInTheDocument();
    });
  });
});
