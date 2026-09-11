import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface LoginProps {
  onSuccess?: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("deactivated")) {
        setError("Account is deactivated. Please contact your administrator.");
      } else {
        setError("Invalid email or password. Please try again.");
      }
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
        style={{ maxWidth: 440, borderRadius: "12px", overflow: "hidden" }}
      >
        <div 
          className="card-header text-white text-center py-4" 
          style={{ backgroundColor: "#006B3C" }}
        >
          <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
            <span style={{ fontSize: "1.5rem" }}>🎫</span>
            <h3 className="mb-0 fw-bold tracking-tight">TokTickIT</h3>
          </div>
          <small className="opacity-75">IT Service Desk Platform</small>
        </div>

        <div className="card-body p-4 p-md-5 bg-white">
          <div className="text-center mb-4">
            <h4 className="fw-semibold text-dark mb-1">Sign in to your account</h4>
            <p className="text-muted small mb-0">Enter your credentials to access your workspace</p>
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
            <div className="mb-3">
              <label htmlFor="email" className="form-label small fw-semibold text-secondary mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control form-control-lg"
                style={{ fontSize: "0.95rem", borderRadius: "8px", borderColor: "#D1D5DB" }}
                placeholder="name@toktickit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label small fw-semibold text-secondary mb-1">
                Password
              </label>
              <div className="input-group">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control form-control-lg"
                  style={{ fontSize: "0.95rem", borderRadius: "8px 0 0 8px", borderColor: "#D1D5DB" }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: "0 8px 8px 0", borderColor: "#D1D5DB" }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn text-white w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
              style={{
                backgroundColor: "#006B3C",
                borderColor: "#006B3C",
                borderRadius: "8px",
                fontSize: "1rem",
                minHeight: "44px"
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
