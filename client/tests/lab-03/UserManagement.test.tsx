import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UserManagement, { getRoleBadgeStyle, formatRoleName } from "../../src/pages/UserManagement";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

// Mock API functions
vi.mock("../../src/api", () => ({
  getAdminUsers: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
  resetUserPassword: vi.fn()
}));

describe("UI-05: Admin User Management Component Tests", () => {
  const currentAdminUser: api.User = {
    id: 1,
    name: "John Smith",
    email: "john.smith@toktickit.com",
    role: "ADMINISTRATOR",
    isActive: true
  };

  const mockUsers: api.User[] = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@toktickit.com",
      role: "ADMINISTRATOR",
      isActive: true
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@toktickit.com",
      role: "IT_STAFF",
      isActive: true
    },
    {
      id: 3,
      name: "Requester Alpha",
      email: "requester_a@example.com",
      role: "REQUESTER",
      isActive: true
    },
    {
      id: 4,
      name: "Inactive Requester",
      email: "inactive@example.com",
      role: "REQUESTER",
      isActive: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: currentAdminUser,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      refreshUser: vi.fn()
    });
    (api.getAdminUsers as any).mockResolvedValue(mockUsers);
  });

  it("UI-05: renders user table, role badges, status badges, and action buttons", async () => {
    render(<UserManagement />);

    expect(screen.getByText(/user management/i)).toBeInTheDocument();
    expect(screen.getByTestId("create-user-btn")).toBeInTheDocument();
    expect(screen.getByTestId("search-user-input")).toBeInTheDocument();
    expect(screen.getByTestId("role-filter-select")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("user-table")).toBeInTheDocument();
      expect(screen.getAllByText("John Smith")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Sarah Johnson")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Requester Alpha")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Inactive Requester")[0]).toBeInTheDocument();
    });

    // Check Role Badges
    expect(screen.getByTestId("role-badge-1")).toHaveTextContent("Administrator");
    expect(screen.getByTestId("role-badge-2")).toHaveTextContent("IT Staff");
    expect(screen.getByTestId("role-badge-3")).toHaveTextContent("Requester");

    // Check Status Badges
    expect(screen.getByTestId("status-badge-1")).toHaveTextContent(/active/i);
    expect(screen.getByTestId("status-badge-4")).toHaveTextContent(/inactive/i);
  });

  it("applies Zen Green design tokens to role badges and formatRoleName", () => {
    const adminBadge = getRoleBadgeStyle("ADMINISTRATOR");
    expect(adminBadge.backgroundColor).toBe("#EDE9FE");
    expect(adminBadge.color).toBe("#5B21B6");

    const staffBadge = getRoleBadgeStyle("IT_STAFF");
    expect(staffBadge.backgroundColor).toBe("#D1FAE5");
    expect(staffBadge.color).toBe("#065F46");

    const requesterBadge = getRoleBadgeStyle("REQUESTER");
    expect(requesterBadge.backgroundColor).toBe("#E0F2FE");
    expect(requesterBadge.color).toBe("#0369A1");

    expect(formatRoleName("ADMINISTRATOR")).toBe("Administrator");
    expect(formatRoleName("IT_STAFF")).toBe("IT Staff");
    expect(formatRoleName("REQUESTER")).toBe("Requester");
  });

  it("triggers search and role filtering via getAdminUsers", async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(api.getAdminUsers).toHaveBeenCalledWith("", "ALL");
    });

    // Change role filter
    const roleSelect = screen.getByTestId("role-filter-select");
    fireEvent.change(roleSelect, { target: { value: "IT_STAFF" } });

    await waitFor(() => {
      expect(api.getAdminUsers).toHaveBeenCalledWith("", "IT_STAFF");
    });

    // Enter search term and submit
    const searchInput = screen.getByTestId("search-user-input");
    fireEvent.change(searchInput, { target: { value: "Sarah" } });
    fireEvent.submit(searchInput.closest("form")!);

    await waitFor(() => {
      expect(api.getAdminUsers).toHaveBeenCalledWith("Sarah", "IT_STAFF");
    });
  });

  it("opens Create User modal, submits valid data, and shows success", async () => {
    (api.createAdminUser as any).mockResolvedValue({
      message: "User created successfully",
      user: {
        id: 10,
        name: "Alex Thompson",
        email: "alex.t@toktickit.com",
        role: "IT_STAFF",
        isActive: true
      }
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("create-user-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("create-user-btn"));

    // Modal fields
    expect(screen.getByText(/create new user/i)).toBeInTheDocument();
    const nameInput = screen.getByTestId("create-name-input");
    const emailInput = screen.getByTestId("create-email-input");
    const roleSelect = screen.getByTestId("create-role-select");
    const passwordInput = screen.getByTestId("create-password-input");

    fireEvent.change(nameInput, { target: { value: "Alex Thompson" } });
    fireEvent.change(emailInput, { target: { value: "alex.t@toktickit.com" } });
    fireEvent.change(roleSelect, { target: { value: "IT_STAFF" } });
    fireEvent.change(passwordInput, { target: { value: "InitialPass123!" } });

    fireEvent.click(screen.getByTestId("create-user-submit"));

    await waitFor(() => {
      expect(api.createAdminUser).toHaveBeenCalledWith({
        name: "Alex Thompson",
        email: "alex.t@toktickit.com",
        role: "IT_STAFF",
        isActive: true,
        initialPassword: "InitialPass123!"
      });
    });
  });

  it("displays error message when creating a user with duplicate email", async () => {
    (api.createAdminUser as any).mockRejectedValue(new Error("Email already in use."));

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("create-user-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("create-user-btn"));

    fireEvent.change(screen.getByTestId("create-name-input"), { target: { value: "Duplicate User" } });
    fireEvent.change(screen.getByTestId("create-email-input"), { target: { value: "john.smith@toktickit.com" } });
    fireEvent.click(screen.getByTestId("create-user-submit"));

    await waitFor(() => {
      expect(screen.getByText("Email already in use.")).toBeInTheDocument();
    });
  });

  it("enforces Self-Protection in Edit Modal: disables active switch and role for own account", async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-user-btn-1")).toBeInTheDocument();
    });

    // Click Edit on John Smith (id: 1 = current logged-in admin)
    fireEvent.click(screen.getByTestId("edit-user-btn-1"));

    expect(screen.getByText(/edit user: john smith/i)).toBeInTheDocument();

    // Check self warning banner
    expect(
      screen.getByText(/you cannot deactivate or change the role of your own administrator account\./i)
    ).toBeInTheDocument();

    // Active switch & role select must be disabled
    const activeSwitch = screen.getByTestId("edit-active-switch");
    const roleSelect = screen.getByTestId("edit-role-select");
    expect(activeSwitch).toBeDisabled();
    expect(roleSelect).toBeDisabled();

    // In the table, the toggle button for self must also be disabled
    const toggleBtn = screen.getByTestId("toggle-status-btn-1");
    expect(toggleBtn).toBeDisabled();
  });

  it("allows editing other users without self-protection restriction", async () => {
    (api.updateAdminUser as any).mockResolvedValue({
      message: "User updated successfully",
      user: {
        id: 2,
        name: "Sarah Johnson Modified",
        email: "sarah.j@toktickit.com",
        role: "IT_STAFF",
        isActive: true
      }
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-user-btn-2")).toBeInTheDocument();
    });

    // Click Edit on Sarah Johnson (id: 2)
    fireEvent.click(screen.getByTestId("edit-user-btn-2"));

    const activeSwitch = screen.getByTestId("edit-active-switch");
    const roleSelect = screen.getByTestId("edit-role-select");
    expect(activeSwitch).not.toBeDisabled();
    expect(roleSelect).not.toBeDisabled();

    const nameInput = screen.getByTestId("edit-name-input");
    fireEvent.change(nameInput, { target: { value: "Sarah Johnson Modified" } });

    fireEvent.click(screen.getByTestId("edit-user-submit"));

    await waitFor(() => {
      expect(api.updateAdminUser).toHaveBeenCalledWith(2, {
        name: "Sarah Johnson Modified",
        email: "sarah.johnson@toktickit.com",
        role: "IT_STAFF",
        isActive: true
      });
    });
  });

  it("opens Reset Password modal and displays temporary password on success", async () => {
    (api.resetUserPassword as any).mockResolvedValue({
      message: "Initial password reset successfully"
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("reset-pwd-btn-2")).toBeInTheDocument();
    });

    // Click Reset Password on user 2
    fireEvent.click(screen.getByTestId("reset-pwd-btn-2"));

    expect(screen.getByText(/reset initial password: sarah johnson/i)).toBeInTheDocument();

    const pwdInput = screen.getByTestId("reset-password-input");
    fireEvent.change(pwdInput, { target: { value: "NewTemporaryPass2026!" } });

    fireEvent.click(screen.getByTestId("reset-password-submit"));

    await waitFor(() => {
      expect(api.resetUserPassword).toHaveBeenCalledWith(2, "NewTemporaryPass2026!");
      expect(screen.getByTestId("temp-password-display")).toHaveTextContent("NewTemporaryPass2026!");
    });
  });

  it("opens confirmation dialog when toggling user active status and calls updateAdminUser", async () => {
    (api.updateAdminUser as any).mockResolvedValue({
      message: "User updated successfully",
      user: { ...mockUsers[1], isActive: false }
    });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("toggle-status-btn-2")).toBeInTheDocument();
    });

    // Click Deactivate on Sarah Johnson
    fireEvent.click(screen.getByTestId("toggle-status-btn-2"));

    expect(screen.getByText(/are you sure you want to/i)).toBeInTheDocument();
    expect(screen.getByTestId("confirm-toggle-btn")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("confirm-toggle-btn"));

    await waitFor(() => {
      expect(api.updateAdminUser).toHaveBeenCalledWith(2, { isActive: false });
    });
  });
});
