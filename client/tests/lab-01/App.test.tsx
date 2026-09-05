import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/App";

// Mock the child components so we don't have to worry about their internal API calls or UI
vi.mock("../../src/pages/CreateTicket", () => ({
  default: () => <div data-testid="mock-create-ticket">Create Ticket Form</div>
}));

vi.mock("../../src/pages/MyTickets", () => ({
  default: () => <div data-testid="mock-my-tickets">My Tickets</div>
}));

vi.mock("../../src/pages/RequesterSelector", () => ({
  default: () => <div data-testid="mock-requester-selector">Requester Selector</div>
}));

describe("App Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the RequesterSelector when not logged in (no requesterId in localStorage)", () => {
    render(<App />);
    // The App should show the Mock Login (RequesterSelector)
    expect(screen.getByTestId("mock-requester-selector")).toBeInTheDocument();
    
    // The Navbar and internal pages should NOT be visible
    expect(screen.queryByText(/TokTickIT/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-my-tickets")).not.toBeInTheDocument();
  });

  it("renders the Navbar and defaults to MyTickets when logged in", () => {
    // Set localStorage to simulate a logged-in user
    localStorage.setItem("requesterId", "1");
    localStorage.setItem("requesterName", "John Doe");
    
    render(<App />);
    
    // The Navbar should be visible with the user's name
    expect(screen.getByText("TokTickIT")).toBeInTheDocument();
    expect(screen.getByText(/Profile: John Doe/i)).toBeInTheDocument();
    
    // The MyTickets view should be visible by default (due to index route)
    expect(screen.getByTestId("mock-my-tickets")).toBeInTheDocument();
    
    // The Mock Login should NOT be visible
    expect(screen.queryByTestId("mock-requester-selector")).not.toBeInTheDocument();
  });
});
