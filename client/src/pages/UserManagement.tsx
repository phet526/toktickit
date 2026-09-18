import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetUserPassword
} from "../api";
import { useAuth } from "../context/AuthContext";

export function getRoleBadgeStyle(role: string) {
  switch (role) {
    case "REQUESTER":
      return { backgroundColor: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD" };
    case "IT_STAFF":
      return { backgroundColor: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" };
    case "ADMINISTRATOR":
      return { backgroundColor: "#EDE9FE", color: "#5B21B6", border: "1px solid #DDD6FE" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#4B5563", border: "1px solid #E5E7EB" };
  }
}

export function formatRoleName(role: string) {
  switch (role) {
    case "REQUESTER":
      return "Requester";
    case "IT_STAFF":
      return "IT Staff";
    case "ADMINISTRATOR":
      return "Administrator";
    default:
      return role;
  }
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showConfirmToggleModal, setShowConfirmToggleModal] = useState<boolean>(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create form fields
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState("REQUESTER");
  const [createInitialPassword, setCreateInitialPassword] = useState("Toktick2026!");
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  // Edit form fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("REQUESTER");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Reset password form fields
  const [newInitialPassword, setNewInitialPassword] = useState("Toktick2026!");
  const [resetFormError, setResetFormError] = useState<string | null>(null);
  const [tempPasswordDisplay, setTempPasswordDisplay] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const fetchUsers = async (searchOverride?: string, roleOverride?: string) => {
    try {
      setLoading(true);
      setErrorAlert(null);
      const search = searchOverride !== undefined ? searchOverride : searchTerm;
      const role = roleOverride !== undefined ? roleOverride : roleFilter;
      const data = await getAdminUsers(search, role);
      setUsers(data);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setErrorAlert(err.message || "Failed to load users. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(searchTerm, roleFilter);
  }, [roleFilter]);

  // Handle Search on Submit or Clear
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchTerm, roleFilter);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchUsers("", roleFilter);
  };

  // Count active administrators to check Last Admin rule
  const activeAdminCount = useMemo(() => {
    return users.filter(u => u.role === "ADMINISTRATOR" && u.isActive).length;
  }, [users]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCreateName("");
    setCreateEmail("");
    setCreateRole("REQUESTER");
    setCreateInitialPassword("Toktick2026!");
    setCreateIsActive(true);
    setCreateFormError(null);
    setShowCreateModal(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);

    if (!createName.trim()) {
      setCreateFormError("Name is required");
      return;
    }
    if (!createEmail.trim()) {
      setCreateFormError("Email is required");
      return;
    }
    if (!createInitialPassword) {
      setCreateFormError("Initial password is required");
      return;
    }

    try {
      setSubmitting(true);
      await createAdminUser({
        name: createName.trim(),
        email: createEmail.trim(),
        role: createRole,
        isActive: createIsActive,
        initialPassword: createInitialPassword
      });

      setShowCreateModal(false);
      setSuccessAlert(`User "${createName.trim()}" created successfully with initial password.`);
      fetchUsers();
    } catch (err: any) {
      setCreateFormError(err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (target: User) => {
    setSelectedUser(target);
    setEditName(target.name);
    setEditEmail(target.email);
    setEditRole(target.role);
    setEditIsActive(target.isActive);
    setEditFormError(null);
    setShowEditModal(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditFormError(null);

    if (!editName.trim()) {
      setEditFormError("Name is required");
      return;
    }
    if (!editEmail.trim()) {
      setEditFormError("Email is required");
      return;
    }

    try {
      setSubmitting(true);
      await updateAdminUser(selectedUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        isActive: editIsActive
      });

      setShowEditModal(false);
      setSuccessAlert(`User "${editName.trim()}" updated successfully.`);
      fetchUsers();
    } catch (err: any) {
      setEditFormError(err.message || "Failed to update user.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetModal = (target: User) => {
    setSelectedUser(target);
    setNewInitialPassword("Toktick2026!");
    setResetFormError(null);
    setTempPasswordDisplay(null);
    setCopiedNotification(false);
    setShowResetModal(true);
  };

  // Submit Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setResetFormError(null);

    if (!newInitialPassword) {
      setResetFormError("Password is required");
      return;
    }

    try {
      setSubmitting(true);
      await resetUserPassword(selectedUser.id, newInitialPassword);
      setTempPasswordDisplay(newInitialPassword);
      setSuccessAlert(`Password reset for ${selectedUser.name}.`);
    } catch (err: any) {
      setResetFormError(err.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  // Prompt Toggle Status
  const handlePromptToggle = (target: User) => {
    setSelectedUser(target);
    setShowConfirmToggleModal(true);
  };

  // Confirm Toggle Status
  const handleConfirmToggle = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      await updateAdminUser(selectedUser.id, {
        isActive: !selectedUser.isActive
      });
      setShowConfirmToggleModal(false);
      setSuccessAlert(
        `User "${selectedUser.name}" has been ${
          !selectedUser.isActive ? "activated" : "deactivated"
        }.`
      );
      fetchUsers();
    } catch (err: any) {
      setErrorAlert(err.message || "Failed to update user status.");
      setShowConfirmToggleModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Helpers for safety flags
  const isSelf = (userId: number) => currentUser?.id === userId;
  const isLastActiveAdmin = (user: User) =>
    user.role === "ADMINISTRATOR" && user.isActive && activeAdminCount <= 1;

  return (
    <div className="container-fluid px-0">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "#1F2937" }}>
            User Management
          </h1>
          <p className="text-muted mb-0 small">
            Manage system users, assign roles, and handle credentials according to TokTickIT safety policies.
          </p>
        </div>
        <button
          className="btn text-white fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
          style={{ backgroundColor: "#006B3C", borderRadius: "8px" }}
          onClick={handleOpenCreateModal}
          data-testid="create-user-btn"
        >
          <span>➕</span>
          <span>Create User</span>
        </button>
      </div>

      {/* Global Alerts */}
      {errorAlert && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
          <div>
            <strong>Error:</strong> {errorAlert}
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setErrorAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {successAlert && (
        <div className="alert alert-success d-flex justify-content-between align-items-center mb-4" role="alert">
          <div>
            <strong>Success:</strong> {successAlert}
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}>
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-6 col-lg-7">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  🔍
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchTerm(val);
                    if (val === "") {
                      fetchUsers("", roleFilter);
                    }
                  }}
                  data-testid="search-user-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0 bg-light"
                    onClick={handleClearSearch}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  className="btn text-white px-3"
                  style={{ backgroundColor: "#006B3C" }}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Role Filter */}
            <div className="col-12 col-md-4 col-lg-3">
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="roleFilterSelect" className="form-label mb-0 text-muted small fw-semibold text-nowrap">
                  Role:
                </label>
                <select
                  id="roleFilterSelect"
                  className="form-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  data-testid="role-filter-select"
                >
                  <option value="ALL">All Roles</option>
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>
            </div>

            {/* Total Count Badge */}
            <div className="col-12 col-md-2 col-lg-2 text-md-end">
              <span className="badge bg-light text-dark border px-3 py-2" style={{ borderRadius: "8px" }}>
                Total: {users.length} {users.length === 1 ? "User" : "Users"}
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}>
          <div className="spinner-border mb-3" role="status" style={{ color: "#006B3C" }}>
            <span className="visually-hidden">Loading users...</span>
          </div>
          <div className="text-muted small">Loading user list...</div>
        </div>
      ) : users.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}>
          <div className="fs-1 mb-2">👤</div>
          <h5 className="fw-semibold text-secondary">No users found</h5>
          <p className="text-muted small mb-3">
            {searchTerm || roleFilter !== "ALL"
              ? "Try adjusting your search query or role filter."
              : "No users exist in the system."}
          </p>
          {(searchTerm || roleFilter !== "ALL") && (
            <div>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("ALL");
                  fetchUsers("", "ALL");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table View (hidden on mobile <768px) */}
          <div className="card border-0 shadow-sm d-none d-md-block" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" data-testid="user-table">
                <thead style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  <tr>
                    <th scope="col" className="py-3 px-4 text-secondary small fw-bold">NAME</th>
                    <th scope="col" className="py-3 px-4 text-secondary small fw-bold">EMAIL</th>
                    <th scope="col" className="py-3 px-4 text-secondary small fw-bold">ROLE</th>
                    <th scope="col" className="py-3 px-4 text-secondary small fw-bold">STATUS</th>
                    <th scope="col" className="py-3 px-4 text-secondary small fw-bold text-end">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const self = isSelf(u.id);
                    const lastAdmin = isLastActiveAdmin(u);

                    return (
                      <tr key={u.id} data-testid={`user-row-${u.id}`}>
                        <td className="py-3 px-4">
                          <div className="fw-semibold text-dark">
                            {u.name} {self && <span className="badge bg-secondary ms-1 small">You</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted small">
                          {u.email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="badge rounded-pill px-3 py-1"
                            style={{
                              ...getRoleBadgeStyle(u.role),
                              fontSize: "0.75rem",
                              fontWeight: 600
                            }}
                            data-testid={`role-badge-${u.id}`}
                          >
                            {formatRoleName(u.role)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.isActive ? (
                            <span
                              className="badge rounded-pill px-3 py-1"
                              style={{
                                backgroundColor: "#DCFCE7",
                                color: "#15803D",
                                border: "1px solid #BBF7D0",
                                fontSize: "0.75rem",
                                fontWeight: 600
                              }}
                              data-testid={`status-badge-${u.id}`}
                            >
                              ● Active
                            </span>
                          ) : (
                            <span
                              className="badge rounded-pill px-3 py-1"
                              style={{
                                backgroundColor: "#FEE2E2",
                                color: "#B91C1C",
                                border: "1px solid #FECACA",
                                fontSize: "0.75rem",
                                fontWeight: 600
                              }}
                              data-testid={`status-badge-${u.id}`}
                            >
                              ○ Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="d-inline-flex align-items-center gap-2">
                            {/* Edit Button */}
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleOpenEditModal(u)}
                              data-testid={`edit-user-btn-${u.id}`}
                              title="Edit user details"
                            >
                              Edit
                            </button>

                            {/* Reset Password Button */}
                            <button
                              className="btn btn-sm btn-outline-warning text-dark"
                              onClick={() => handleOpenResetModal(u)}
                              data-testid={`reset-pwd-btn-${u.id}`}
                              title="Reset initial password"
                            >
                              Reset Password
                            </button>

                            {/* Toggle Active / Inactive Button */}
                            {(() => {
                              const isButtonDisabled = self || (u.isActive && lastAdmin);
                              const toggleTooltip = self
                                ? "Cannot deactivate your own account"
                                : lastAdmin
                                ? "Cannot deactivate the last active administrator"
                                : u.isActive
                                ? "Deactivate user"
                                : "Activate user";

                              return (
                                <span
                                  className="d-inline-block"
                                  tabIndex={0}
                                  title={toggleTooltip}
                                >
                                  <button
                                    className={`btn btn-sm ${
                                      u.isActive ? "btn-outline-danger" : "btn-outline-success"
                                    }`}
                                    disabled={isButtonDisabled}
                                    style={isButtonDisabled ? { pointerEvents: "none" } : undefined}
                                    onClick={() => handlePromptToggle(u)}
                                    data-testid={`toggle-status-btn-${u.id}`}
                                  >
                                    {u.isActive ? "Deactivate" : "Activate"}
                                  </button>
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View (<768px) */}
          <div className="d-block d-md-none">
            <div className="d-flex flex-column gap-3">
              {users.map((u) => {
                const self = isSelf(u.id);
                const lastAdmin = isLastActiveAdmin(u);

                return (
                  <div
                    key={u.id}
                    className="card border-0 shadow-sm p-3"
                    style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
                    data-testid={`user-card-${u.id}`}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">
                          {u.name} {self && <span className="badge bg-secondary ms-1 small">You</span>}
                        </h6>
                        <span className="text-muted small">{u.email}</span>
                      </div>
                      {u.isActive ? (
                        <span
                          className="badge rounded-pill px-2 py-1"
                          style={{
                            backgroundColor: "#DCFCE7",
                            color: "#15803D",
                            fontSize: "0.75rem"
                          }}
                        >
                          ● Active
                        </span>
                      ) : (
                        <span
                          className="badge rounded-pill px-2 py-1"
                          style={{
                            backgroundColor: "#FEE2E2",
                            color: "#B91C1C",
                            fontSize: "0.75rem"
                          }}
                        >
                          ○ Inactive
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <span
                        className="badge rounded-pill px-2 py-1"
                        style={{
                          ...getRoleBadgeStyle(u.role),
                          fontSize: "0.75rem"
                        }}
                      >
                        {formatRoleName(u.role)}
                      </span>
                    </div>

                    {/* Actions Full-width Stack on Mobile */}
                    <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                      <button
                        className="btn btn-sm btn-outline-secondary flex-grow-1"
                        onClick={() => handleOpenEditModal(u)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning text-dark flex-grow-1"
                        onClick={() => handleOpenResetModal(u)}
                      >
                        Reset Password
                      </button>
                      {(() => {
                        const isButtonDisabled = self || (u.isActive && lastAdmin);
                        const toggleTooltip = self
                          ? "Cannot deactivate your own account"
                          : lastAdmin
                          ? "Cannot deactivate the last active administrator"
                          : u.isActive
                          ? "Deactivate user"
                          : "Activate user";

                        return (
                          <span
                            className="d-inline-block flex-grow-1"
                            tabIndex={0}
                            title={toggleTooltip}
                          >
                            <button
                              className={`btn btn-sm w-100 ${
                                u.isActive ? "btn-outline-danger" : "btn-outline-success"
                              }`}
                              disabled={isButtonDisabled}
                              style={isButtonDisabled ? { pointerEvents: "none" } : undefined}
                              onClick={() => handlePromptToggle(u)}
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Create User Modal */}
      {/* ------------------------------------------------------------- */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "16px" }}>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold" style={{ color: "#006B3C" }}>
                    Create New User
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreateModal(false)}
                    disabled={submitting}
                  ></button>
                </div>

                <div className="modal-body py-3">
                  {createFormError && (
                    <div className="alert alert-danger py-2 small mb-3" role="alert">
                      {createFormError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Alex Thompson"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      required
                      data-testid="create-name-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. alex.t@toktickit.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      required
                      data-testid="create-email-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Role *</label>
                    <select
                      className="form-select"
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value)}
                      data-testid="create-role-select"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Initial Password *</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      value={createInitialPassword}
                      onChange={(e) => setCreateInitialPassword(e.target.value)}
                      required
                      data-testid="create-password-input"
                    />
                    <div className="form-text text-muted small">
                      User will be required to change password on first login. Min 8 chars, uppercase, lowercase, number, symbol.
                    </div>
                  </div>

                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="createActiveSwitch"
                      checked={createIsActive}
                      onChange={(e) => setCreateIsActive(e.target.checked)}
                      data-testid="create-active-switch"
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="createActiveSwitch">
                      Account is Active
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowCreateModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white px-4"
                    style={{ backgroundColor: "#006B3C" }}
                    disabled={submitting}
                    data-testid="create-user-submit"
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Edit User Modal */}
      {/* ------------------------------------------------------------- */}
      {showEditModal && selectedUser && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "16px" }}>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold" style={{ color: "#006B3C" }}>
                    Edit User: {selectedUser.name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                    disabled={submitting}
                  ></button>
                </div>

                <div className="modal-body py-3">
                  {editFormError && (
                    <div className="alert alert-danger py-2 small mb-3" role="alert">
                      {editFormError}
                    </div>
                  )}

                  {/* Self-account warning */}
                  {isSelf(selectedUser.id) && (
                    <div className="alert alert-warning py-2 small mb-3 d-flex align-items-center gap-2" role="alert">
                      <span>⚠️</span>
                      <span>You cannot deactivate or change the role of your own administrator account.</span>
                    </div>
                  )}

                  {/* Last active admin warning */}
                  {!isSelf(selectedUser.id) && isLastActiveAdmin(selectedUser) && (
                    <div className="alert alert-warning py-2 small mb-3 d-flex align-items-center gap-2" role="alert">
                      <span>⚠️</span>
                      <span>Cannot deactivate or demote the last active administrator.</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      data-testid="edit-name-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      data-testid="edit-email-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Role *</label>
                    <select
                      className="form-select"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      disabled={isSelf(selectedUser.id) || isLastActiveAdmin(selectedUser)}
                      data-testid="edit-role-select"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>

                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="editActiveSwitch"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      disabled={isSelf(selectedUser.id) || (editIsActive && isLastActiveAdmin(selectedUser))}
                      data-testid="edit-active-switch"
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="editActiveSwitch">
                      Account is Active
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowEditModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white px-4"
                    style={{ backgroundColor: "#006B3C" }}
                    disabled={submitting}
                    data-testid="edit-user-submit"
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Reset Initial Password Modal */}
      {/* ------------------------------------------------------------- */}
      {showResetModal && selectedUser && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: "#006B3C" }}>
                  Reset Initial Password: {selectedUser.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResetModal(false)}
                  disabled={submitting}
                ></button>
              </div>

              <div className="modal-body py-3">
                {resetFormError && (
                  <div className="alert alert-danger py-2 small mb-3" role="alert">
                    {resetFormError}
                  </div>
                )}

                {tempPasswordDisplay ? (
                  <div className="text-center py-3">
                    <div className="fs-1 mb-2">🔑</div>
                    <h6 className="fw-bold text-success mb-2">Password Reset Successful!</h6>
                    <p className="text-muted small mb-3">
                      The initial password has been set. The user must change it on their next login.
                    </p>
                    <div className="bg-light p-3 rounded-3 border d-flex justify-content-between align-items-center mb-3">
                      <span className="font-monospace fw-bold fs-5 text-dark" data-testid="temp-password-display">
                        {tempPasswordDisplay}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => copyToClipboard(tempPasswordDisplay)}
                      >
                        {copiedNotification ? "Copied! ✓" : "Copy"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleResetSubmit}>
                    <p className="text-muted small mb-3">
                      Set a new initial password for <strong>{selectedUser.name}</strong> ({selectedUser.email}).
                      The user will be required to change it immediately after signing in.
                    </p>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">New Initial Password *</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control font-monospace"
                          value={newInitialPassword}
                          onChange={(e) => setNewInitialPassword(e.target.value)}
                          required
                          data-testid="reset-password-input"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setNewInitialPassword("Toktick2026!")}
                          title="Generate default initial password"
                        >
                          Default
                        </button>
                      </div>
                      <div className="form-text text-muted small">
                        Min 8 chars, uppercase, lowercase, number, symbol.
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => setShowResetModal(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-warning text-dark px-4 fw-semibold"
                        disabled={submitting}
                        data-testid="reset-password-submit"
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Resetting...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {tempPasswordDisplay && (
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-primary px-4"
                    style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                    onClick={() => setShowResetModal(false)}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Confirmation Modal for Active/Inactive Toggle */}
      {/* ------------------------------------------------------------- */}
      {showConfirmToggleModal && selectedUser && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  {selectedUser.isActive ? "Deactivate User Account" : "Activate User Account"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmToggleModal(false)}
                  disabled={submitting}
                ></button>
              </div>

              <div className="modal-body py-3">
                <p className="text-muted mb-0">
                  Are you sure you want to{" "}
                  <strong>{selectedUser.isActive ? "deactivate" : "activate"}</strong> the account of{" "}
                  <strong>{selectedUser.name}</strong> ({selectedUser.email})?
                  {selectedUser.isActive && (
                    <span className="d-block mt-2 text-danger small">
                      ⚠️ Once deactivated, the user will immediately be prevented from signing in.
                    </span>
                  )}
                </p>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowConfirmToggleModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn text-white px-4 ${
                    selectedUser.isActive ? "btn-danger" : "btn-success"
                  }`}
                  onClick={handleConfirmToggle}
                  disabled={submitting}
                  data-testid="confirm-toggle-btn"
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating...
                    </>
                  ) : selectedUser.isActive ? (
                    "Yes, Deactivate"
                  ) : (
                    "Yes, Activate"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
