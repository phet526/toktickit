import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketDetail from "../../src/pages/TicketDetail";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import * as api from "../../src/api";

// Mock the API module
vi.mock("../../src/api", () => ({
  getTicketById: vi.fn(),
  deleteAttachment: vi.fn()
}));

describe("TicketDetail Component - Soft Delete Attachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("requesterId", "1");
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetail />} />
        </Routes>
      </BrowserRouter>
    );
  };

  const mockTicket = {
    id: 1,
    ticketNo: "TKT-TEST",
    summary: "Test Detail",
    description: "Testing detail view",
    currentStatus: "New",
    requestedPriority: "LOW",
    attachments: [
      { id: 101, filename: "screenshot.png", size: 1024 }
    ]
  };

  it("Case 1: Should not call API if user cancels the prompt", async () => {
    (api.getTicketById as any).mockResolvedValueOnce(mockTicket);
    
    // Set route to /tickets/1 for useParams
    window.history.pushState({}, 'Test', '/tickets/1');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("screenshot.png")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: "X" });
    
    // Mock prompt to return null (Cancel)
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValueOnce(null);

    fireEvent.click(deleteButton);

    expect(promptSpy).toHaveBeenCalled();
    expect(api.deleteAttachment).not.toHaveBeenCalled();
    
    // File should still be in UI
    expect(screen.getByText("screenshot.png")).toBeInTheDocument();
  });

  it("Case 2: Should call API and remove from UI if user provides a reason", async () => {
    (api.getTicketById as any).mockResolvedValueOnce(mockTicket);
    (api.deleteAttachment as any).mockResolvedValueOnce({ success: true });
    
    window.history.pushState({}, 'Test', '/tickets/1');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("screenshot.png")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: "X" });
    
    // Mock prompt to return a valid reason
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValueOnce("Wrong file uploaded");

    fireEvent.click(deleteButton);

    expect(promptSpy).toHaveBeenCalled();
    
    await waitFor(() => {
      // API should be called with correct arguments: ticketId, attachmentId, requesterId, reason
      // File should NOT disappear from UI, but have a strikethrough class
      const deletedFile = screen.getByText("screenshot.png");
      expect(deletedFile).toBeInTheDocument();
      expect(deletedFile).toHaveClass("text-decoration-line-through");
      expect(screen.getByText("Deleted")).toBeInTheDocument();
    });
  });
});
