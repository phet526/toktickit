import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface LayoutProps {
  requesterName?: string;
  onLogout?: () => void;
}

export default function Layout({ requesterName, onLogout }: LayoutProps) {
  const location = useLocation();
  const auth = useAuth();
  
  const currentUser = auth.user;
  const displayName = requesterName || currentUser?.name || "User";
  const role = currentUser?.role || "REQUESTER";

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      auth.logout();
    }
  };

  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName) {
      case "REQUESTER":
        return { backgroundColor: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD" };
      case "IT_STAFF":
        return { backgroundColor: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" };
      case "ADMINISTRATOR":
        return { backgroundColor: "#EDE9FE", color: "#5B21B6", border: "1px solid #DDD6FE" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#4B5563", border: "1px solid #E5E7EB" };
    }
  };

  const formatRoleName = (roleName: string) => {
    switch (roleName) {
      case "REQUESTER":
        return "Requester";
      case "IT_STAFF":
        return "IT Staff";
      case "ADMINISTRATOR":
        return "Administrator";
      default:
        return roleName;
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "#F5F7F6" }}>
      <nav 
        className="navbar navbar-expand-lg navbar-dark shadow-sm py-2" 
        style={{ backgroundColor: "#006B3C" }}
      >
        <div className="container">
          <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
            <span>🎫</span>
            <span>TokTickIT</span>
          </Link>

          <button 
            className="navbar-toggler border-0" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            {/* Role-Based Nav Items */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {role === "REQUESTER" && (
                <>
                  <li className="nav-item">
                    <Link 
                      className={`nav-link px-3 ${location.pathname === "/my-tickets" || location.pathname === "/" ? "active fw-semibold" : ""}`} 
                      to="/my-tickets"
                    >
                      My Tickets
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      className={`nav-link px-3 ${location.pathname === "/create-ticket" ? "active fw-semibold" : ""}`} 
                      to="/create-ticket"
                    >
                      Create Ticket
                    </Link>
                  </li>
                </>
              )}

              {role === "IT_STAFF" && (
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 ${location.pathname.startsWith("/staff") ? "active fw-semibold" : ""}`} 
                    to="/staff/queue"
                  >
                    My Queue
                  </Link>
                </li>
              )}

              {role === "ADMINISTRATOR" && (
                <>
                  <li className="nav-item">
                    <Link 
                      className={`nav-link px-3 ${location.pathname.startsWith("/staff") ? "active fw-semibold" : ""}`} 
                      to="/staff/queue"
                    >
                      Ticket Queue
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      className={`nav-link px-3 ${location.pathname.startsWith("/admin") ? "active fw-semibold" : ""}`} 
                      to="/admin/users"
                    >
                      User Management
                    </Link>
                  </li>
                </>
              )}
            </ul>

            {/* Profile & Logout Action */}
            <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
              <div className="d-flex align-items-center gap-2 text-white">
                <span className="fw-medium text-white-90">👤 Profile: {displayName}</span>
                <span 
                  className="badge px-2 py-1 rounded-pill"
                  style={{
                    ...getRoleBadgeStyle(role),
                    fontSize: "0.75rem",
                    fontWeight: 600
                  }}
                >
                  {formatRoleName(role)}
                </span>
              </div>

              <button 
                className="btn btn-outline-light btn-sm px-3 py-1" 
                onClick={handleSignOut}
                style={{ borderRadius: "6px" }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-4 flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
}
