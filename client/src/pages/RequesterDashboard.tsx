import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRequesterDashboard, RequesterDashboardData } from "../api";
import { useAuth } from "../context/AuthContext";

export function getStatusBadgeStyle(status: string) {
  switch (status?.toLowerCase()) {
    case "new":
      return { backgroundColor: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD" };
    case "open":
      return { backgroundColor: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE" };
    case "in progress":
      return { backgroundColor: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A" };
    case "waiting for requester":
      return { backgroundColor: "#F3E8FF", color: "#6B21A8", border: "1px solid #E9D5FF" };
    case "resolved":
      return { backgroundColor: "#DCFCE7", color: "#15803D", border: "1px solid #BBF7D0" };
    case "closed":
      return { backgroundColor: "#F3F4F6", color: "#4B5563", border: "1px solid #E5E7EB" };
    case "reopened":
      return { backgroundColor: "#FEF9C3", color: "#854D0E", border: "1px solid #FEF08A" };
    case "cancelled":
      return { backgroundColor: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#4B5563", border: "1px solid #E5E7EB" };
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

export default function RequesterDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRequesterDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load requester dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const userName = data?.requester?.name || user?.name || "Requester";

  return (
    <div className="container py-4" style={{ maxWidth: "1200px" }}>
      {/* Welcome Header Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: "#006B3C" }}>
            Welcome, {userName}!
          </h2>
          <p className="text-muted mb-0">Here's the latest on your requests.</p>
        </div>
        <button
          type="button"
          id="btnRefreshRequesterDashboard"
          className="btn btn-outline-secondary d-flex align-items-center gap-1 shadow-sm"
          style={{ borderRadius: "8px" }}
          onClick={fetchDashboard}
          disabled={loading}
        >
          <span className={loading ? "spinner-border spinner-border-sm" : ""}>
            {!loading && "⟳"}
          </span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-danger shadow-sm d-flex justify-content-between align-items-center mb-4" role="alert">
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={fetchDashboard}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="text-center py-5">
          <div className="spinner-border mb-2" role="status" style={{ color: "#006B3C" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted">Loading your dashboard...</div>
        </div>
      )}

      {data && (
        <>
          {/* Metric Cards Row (4 Cards: Open, In Progress, Resolved, Closed) */}
          <div className="row g-3 mb-4" id="requesterMetricCards">
            {/* Card 1: My Open Tickets */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card h-100 shadow-sm border-0 p-3"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="text-muted small fw-semibold mb-1">My Open Tickets</div>
                <div className="fs-1 fw-bold mb-2" style={{ color: "#006B3C" }} id="metricOpenTickets">
                  {data.metrics.openTickets}
                </div>
                <div>
                  <Link
                    to="/my-tickets?status=Open"
                    id="linkDrillOpen"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#0B7A46" }}
                  >
                    View all &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: In Progress */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card h-100 shadow-sm border-0 p-3"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="text-muted small fw-semibold mb-1">In Progress</div>
                <div className="fs-1 fw-bold mb-2" style={{ color: "#B45309" }} id="metricInProgressTickets">
                  {data.metrics.inProgressTickets}
                </div>
                <div>
                  <Link
                    to="/my-tickets?status=In%20Progress"
                    id="linkDrillInProgress"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#B45309" }}
                  >
                    View all &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 3: Resolved */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card h-100 shadow-sm border-0 p-3"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="text-muted small fw-semibold mb-1">Resolved</div>
                <div className="fs-1 fw-bold mb-2" style={{ color: "#15803D" }} id="metricResolvedTickets">
                  {data.metrics.resolvedTickets}
                </div>
                <div>
                  <Link
                    to="/my-tickets?status=Resolved"
                    id="linkDrillResolved"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#15803D" }}
                  >
                    View all &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 4: Closed */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card h-100 shadow-sm border-0 p-3"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="text-muted small fw-semibold mb-1">Closed</div>
                <div className="fs-1 fw-bold mb-2" style={{ color: "#4B5563" }} id="metricClosedTickets">
                  {data.metrics.closedTickets}
                </div>
                <div>
                  <Link
                    to="/my-tickets?status=Closed"
                    id="linkDrillClosed"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#4B5563" }}
                  >
                    View all &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Operational Layout (Desktop >= 992px) */}
          <div className="row g-4">
            {/* Left Column: My Recent Tickets (65% / col-lg-8) */}
            <div className="col-12 col-lg-8">
              <div
                className="card shadow-sm border-0 h-100"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="card-header bg-white py-3 px-3 px-md-4 border-bottom d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold" style={{ color: "#006B3C" }}>
                    My Recent Tickets
                  </h5>
                  <Link
                    to="/my-tickets"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#006B3C" }}
                  >
                    View all
                  </Link>
                </div>
                <div className="card-body p-0">
                  {data.recentTickets.length === 0 ? (
                    <div className="text-center py-5 text-muted" id="emptyRecentTickets">
                      <div className="fs-3 mb-2">📋</div>
                      <div>No recent tickets found.</div>
                      <div className="small">Submit your first request using the button on the right.</div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0" id="tableRecentTickets">
                        <thead className="table-light text-secondary small">
                          <tr>
                            <th className="ps-3 ps-md-4 py-3">Ticket No</th>
                            <th className="py-3">Summary</th>
                            <th className="py-3">Status</th>
                            <th className="pe-3 pe-md-4 py-3 text-end">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recentTickets.map((t) => (
                            <tr key={t.id}>
                              <td className="ps-3 ps-md-4 py-3 fw-semibold">
                                <Link
                                  to={`/tickets/${t.id}`}
                                  className="text-decoration-none"
                                  style={{ color: "#006B3C" }}
                                >
                                  {t.ticketNo}
                                </Link>
                              </td>
                              <td className="py-3">
                                <div className="fw-medium text-dark text-truncate" style={{ maxWidth: "260px" }}>
                                  {t.summary}
                                </div>
                                <div className="text-muted small">{t.category}</div>
                              </td>
                              <td className="py-3">
                                <span
                                  className="badge px-2 py-1 rounded-pill fw-semibold"
                                  style={getStatusBadgeStyle(t.currentStatus)}
                                >
                                  {t.currentStatus}
                                </span>
                              </td>
                              <td className="pe-3 pe-md-4 py-3 text-end text-muted small">
                                {formatDate(t.updatedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Quick Actions Panel (35% / col-lg-4) */}
            <div className="col-12 col-lg-4">
              <div
                className="card shadow-sm border-0 h-100"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="card-header bg-white py-3 px-3 px-md-4 border-bottom">
                  <h5 className="mb-0 fw-bold" style={{ color: "#006B3C" }}>
                    Quick Actions
                  </h5>
                </div>
                <div className="card-body p-3 p-md-4 d-flex flex-column gap-3">
                  <Link
                    to="/create-ticket"
                    id="btnQuickCreateTicket"
                    className="btn text-white p-3 text-start shadow-sm d-flex align-items-center gap-3 text-decoration-none"
                    style={{ backgroundColor: "#006B3C", borderRadius: "10px" }}
                  >
                    <span className="fs-4">➕</span>
                    <div>
                      <div className="fw-bold">Create Ticket</div>
                      <div className="small opacity-75">Submit a new IT support request</div>
                    </div>
                  </Link>

                  <Link
                    to="/my-tickets"
                    id="btnQuickViewMyTickets"
                    className="btn btn-outline-secondary p-3 text-start shadow-sm d-flex align-items-center gap-3 text-decoration-none"
                    style={{ borderRadius: "10px", borderColor: "#E2E8F0" }}
                  >
                    <span className="fs-4">📋</span>
                    <div>
                      <div className="fw-bold text-dark">View My Tickets</div>
                      <div className="small text-muted">Track and review all your requests</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
