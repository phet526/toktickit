import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

interface Props {
  requesterName: string;
  onLogout: () => void;
}

export default function Layout({ requesterName, onLogout }: Props) {
  const location = useLocation();

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm" style={{ backgroundColor: "#006B3C" }}>
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">TokTickIT</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/my-tickets' ? 'active' : ''}`} 
                  to="/my-tickets"
                >
                  My Tickets
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/create-ticket' ? 'active' : ''}`} 
                  to="/create-ticket"
                >
                  Create Ticket
                </Link>
              </li>
            </ul>
            <span className="navbar-text text-white bg-success px-3 rounded-pill me-2">
              👤 Profile: {requesterName}
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={onLogout}>Switch User</button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        <Outlet />
      </div>
    </div>
  );
}
