import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export default function ChangePassword() {
  const { changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Password Rules evaluation
  const ruleLength = useMemo(() => newPassword.length >= 8, [newPassword]);
  const ruleCase = useMemo(() => /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword), [newPassword]);
  const ruleNumberAndSpecial = useMemo(
    () => /\d/.test(newPassword) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
    [newPassword]
  );
  const allRulesPassed = ruleLength && ruleCase && ruleNumberAndSpecial;

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid = Boolean(currentPassword.trim()) && allRulesPassed && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{ backgroundColor: "#F5F7F6", padding: "1.5rem" }}
    >
      <div 
        className="card shadow-sm border-0 w-100" 
        style={{ maxWidth: 480, borderRadius: "12px", overflow: "hidden" }}
      >
        <div 
          className="card-header text-white text-center py-3" 
          style={{ backgroundColor: "#006B3C" }}
        >
          <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
            <span style={{ fontSize: "1.25rem" }}>🔒</span>
            <h4 className="mb-0 fw-bold">TokTickIT Security</h4>
          </div>
          <small className="opacity-75">Mandatory First-Login Password Setup</small>
        </div>

        <div className="card-body p-4 p-md-5 bg-white">
          <div className="text-center mb-4">
            <h4 className="fw-bold text-dark mb-1">Change Your Password</h4>
            <p className="text-muted small mb-0">You must change your password to continue.</p>
          </div>

          {error && (
            <div 
              role="alert"
              className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-4"
              style={{
                backgroundColor: "#FEF2F2",
                borderColor: "#EF4444",
                color: "#DC2626",
                fontSize: "0.875rem",
                borderRadius: "8px"
              }}
            >
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Current Password */}
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label small fw-semibold text-secondary mb-1">
                Current (temporary) password
              </label>
              <div className="input-group">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  className="form-control"
                  style={{ borderRadius: "8px 0 0 8px", borderColor: "#D1D5DB" }}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: "0 8px 8px 0", borderColor: "#D1D5DB" }}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label small fw-semibold text-secondary mb-1">
                New password
              </label>
              <div className="input-group">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  className="form-control"
                  style={{ borderRadius: "8px 0 0 8px", borderColor: "#D1D5DB" }}
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: "0 8px 8px 0", borderColor: "#D1D5DB" }}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label small fw-semibold text-secondary mb-1">
                Confirm new password
              </label>
              <div className="input-group">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-control ${confirmPassword && !passwordsMatch ? "is-invalid" : ""}`}
                  style={{ borderRadius: "8px 0 0 8px", borderColor: "#D1D5DB" }}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: "0 8px 8px 0", borderColor: "#D1D5DB" }}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <div className="text-danger small mt-1" style={{ fontSize: "0.8rem" }}>
                  Passwords do not match
                </div>
              )}
            </div>

            {/* Dynamic Password Rules Checklist */}
            <div 
              className="p-3 mb-4 rounded" 
              style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}
            >
              <div className="small fw-semibold text-secondary mb-2">Password must:</div>
              <ul className="list-unstyled mb-0" style={{ fontSize: "0.85rem" }}>
                <li className={`d-flex align-items-center gap-2 mb-1 ${ruleLength ? "text-success fw-medium" : "text-muted"}`}>
                  <span>{ruleLength ? "✓" : "○"}</span>
                  <span>Be at least 8 characters</span>
                </li>
                <li className={`d-flex align-items-center gap-2 mb-1 ${ruleCase ? "text-success fw-medium" : "text-muted"}`}>
                  <span>{ruleCase ? "✓" : "○"}</span>
                  <span>Include upper and lower case letters</span>
                </li>
                <li className={`d-flex align-items-center gap-2 ${ruleNumberAndSpecial ? "text-success fw-medium" : "text-muted"}`}>
                  <span>{ruleNumberAndSpecial ? "✓" : "○"}</span>
                  <span>Include a number and a special character</span>
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn text-white w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
              style={{
                backgroundColor: isFormValid ? "#006B3C" : "#9CA3AF",
                borderColor: isFormValid ? "#006B3C" : "#9CA3AF",
                borderRadius: "8px",
                fontSize: "1rem",
                minHeight: "44px"
              }}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-link text-muted small p-0"
                onClick={logout}
              >
                Sign out and return later
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
