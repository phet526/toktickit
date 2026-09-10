import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangePassword from "../../src/pages/ChangePassword";
import * as AuthContextModule from "../../src/context/AuthContext";

describe("UI-02: Mandatory Change Password Component Tests", () => {
  const mockChangePassword = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: 1,
        name: "Jennifer Anderson",
        email: "jennifer.anderson@toktickit.com",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: true,
      },
      loading: false,
      login: vi.fn(),
      logout: mockLogout,
      changePassword: mockChangePassword,
      refreshUser: vi.fn(),
    });
  });

  it("renders all password fields and disabled Continue button initially", () => {
    render(<ChangePassword />);

    expect(screen.getByLabelText(/current \(temporary\) password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it("dynamically updates password rules checklist as user types", () => {
    render(<ChangePassword />);

    const newPassInput = screen.getByLabelText(/^new password$/i);

    // Rule 1: Be at least 8 characters
    // Rule 2: Include upper and lower case letters
    // Rule 3: Include a number and a special character

    // 1. Weak password (lowercase only, short)
    fireEvent.change(newPassInput, { target: { value: "pass" } });
    expect(screen.getByText(/be at least 8 characters/i).parentElement).toHaveTextContent("○");

    // 2. Add length >= 8
    fireEvent.change(newPassInput, { target: { value: "password123" } });
    expect(screen.getByText(/be at least 8 characters/i).parentElement).toHaveTextContent("✓");
    // still missing uppercase and special char
    expect(screen.getByText(/include upper and lower case letters/i).parentElement).toHaveTextContent("○");
    expect(screen.getByText(/include a number and a special character/i).parentElement).toHaveTextContent("○");

    // 3. Add uppercase
    fireEvent.change(newPassInput, { target: { value: "Password123" } });
    expect(screen.getByText(/include upper and lower case letters/i).parentElement).toHaveTextContent("✓");
    expect(screen.getByText(/include a number and a special character/i).parentElement).toHaveTextContent("○");

    // 4. Add special char -> all satisfied!
    fireEvent.change(newPassInput, { target: { value: "Password123!" } });
    expect(screen.getByText(/be at least 8 characters/i).parentElement).toHaveTextContent("✓");
    expect(screen.getByText(/include upper and lower case letters/i).parentElement).toHaveTextContent("✓");
    expect(screen.getByText(/include a number and a special character/i).parentElement).toHaveTextContent("✓");
  });

  it("shows error feedback when confirm password does not match", () => {
    render(<ChangePassword />);

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "ValidPassword2026!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "DifferentPassword2026!" },
    });

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("enables Continue button only when all fields and rules are fully satisfied", () => {
    render(<ChangePassword />);

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDisabled();

    // Fill current password
    fireEvent.change(screen.getByLabelText(/current \(temporary\) password/i), {
      target: { value: "Toktick2026!" },
    });
    expect(continueBtn).toBeDisabled();

    // Fill valid new password
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "BrandNewSecure2026!" },
    });
    expect(continueBtn).toBeDisabled();

    // Fill matching confirm password
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "BrandNewSecure2026!" },
    });

    // Button should now be enabled!
    expect(continueBtn).toBeEnabled();
  });

  it("submits valid form and handles busy state", async () => {
    let resolveChange: any;
    mockChangePassword.mockImplementation(() => new Promise((res) => { resolveChange = res; }));

    render(<ChangePassword />);

    fireEvent.change(screen.getByLabelText(/current \(temporary\) password/i), {
      target: { value: "Toktick2026!" },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "BrandNewSecure2026!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "BrandNewSecure2026!" },
    });

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueBtn);

    expect(screen.getByText(/updating password\.\.\./i)).toBeInTheDocument();
    expect(continueBtn).toBeDisabled();

    resolveChange();
    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith(
        "Toktick2026!",
        "BrandNewSecure2026!",
        "BrandNewSecure2026!"
      );
    });
  });

  it("calls logout when user clicks Sign out and return later", () => {
    render(<ChangePassword />);

    const signOutBtn = screen.getByRole("button", { name: /sign out and return later/i });
    fireEvent.click(signOutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
