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

  it("should display error if more than 5 files are selected", async () => {
    localStorage.setItem("requesterId", "1");
    render(<CreateTicket />);
    
    await waitFor(() => {
      expect(screen.getByText("Create New Ticket")).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText("File Attachment");
    
    // Create an array of 6 dummy files
    const mockFiles = Array.from({ length: 6 }).map((_, i) => 
      new File(["content"], `test${i}.jpg`, { type: "image/jpeg" })
    );

    // Simulate selecting 6 files
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByText("You can only select up to 5 files.")).toBeInTheDocument();
    });
  });
});
