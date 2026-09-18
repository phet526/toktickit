import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "../../src/pages/Login";
import * as AuthContextModule from "../../src/context/AuthContext";

describe("UI-01: Login Component Tests", () => {
  const mockLogin = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
      logout: vi.fn(),
      changePassword: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it("renders email, password, and sign-in button", () => {
    render(<Login onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("toggles password visibility when clicking Show/Hide button", () => {
    render(<Login onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleBtn = screen.getByRole("button", { name: /show password/i });

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows client error if submitted with empty fields", async () => {
    render(<Login onSuccess={mockOnSuccess} />);

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/please enter both email and password/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows busy state and spinner while login request is in-flight", async () => {
    // Resolve login slowly
    let resolveLogin: any;
    mockLogin.mockImplementation(() => new Promise((res) => { resolveLogin = res; }));

    render(<Login onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "jennifer.anderson@toktickit.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Toktick2026!" },
    });

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Finish request
    resolveLogin({ id: 1, name: "Jennifer Anderson", role: "REQUESTER" });
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("displays safe error banner on invalid credentials (401)", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid email or password. Please try again."));

    render(<Login onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "WrongPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid email or password\. please try again\./i)
    ).toBeInTheDocument();
  });

  it("displays deactivated account safe error banner (403)", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Account is deactivated. Please contact your administrator."));

    render(<Login onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "requester_c@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Toktick2026!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/account is deactivated\. please contact your administrator\./i)
    ).toBeInTheDocument();
  });
});
