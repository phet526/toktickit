import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStaffDashboard, StaffDashboardData } from "../api";
import { useAuth } from "../context/AuthContext";
import { getStatusBadgeStyle, getPriorityBadgeStyle } from "./StaffTicketQueue";

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

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStaffDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load staff dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const staffName = data?.staff?.name || user?.name || "Staff Member";
  const isAdmin = user?.role === "ADMINISTRATOR" || data?.staff?.role === "ADMINISTRATOR";

  return (
    <div className="container py-4" style={{ maxWidth: "1280px" }}>
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: "#006B3C" }}>
            Welcome back, {staffName}!
          </h2>
          <p className="text-muted mb-0">Here's what's happening with your queue today.</p>
        </div>
        <button
          type="button"
          id="btnRefreshStaffDashboard"
          className="btn text-white d-flex align-items-center gap-1 shadow-sm"
          style={{ backgroundColor: "#006B3C", borderColor: "#006B3C", borderRadius: "8px" }}
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
          <div className="text-muted">Loading queue metrics...</div>
        </div>
      )}

      {data && (
        <>
          {/* Metric Cards Row (6 Cards: New, Open, In Progress, Waiting Req, My Assigned, Unassigned) */}
          <div className="row g-3 mb-4" id="staffMetricCards">
            {/* Card 1: New */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <div
                className="card h-100 shadow-sm border-0 p-3"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="text-muted small fw-semibold mb-1">New</div>
                <div className="fs-2 fw-bold mb-1" style={{ color: "#0369A1" }} id="metricNewTickets">
                  {data.metrics.newTickets}
                </div>
                <div className="small text-muted mb-2">{data.trends?.newTickets || "+0 from yest"}</div>
                <div>
                  <Link
                    to="/staff/queue?status=New"
                    id="linkDrillNew"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#0369A1" }}
                  >
                    View Queue &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Open */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <div
                className="card h-100 shadow-sm border-0 p-3"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="text-muted small fw-semibold mb-1">Open</div>
                <div className="fs-2 fw-bold mb-1" style={{ color: "#4338CA" }} id="metricOpenTickets">
                  {data.metrics.openTickets}
                </div>
                <div className="small text-muted mb-2">{data.trends?.openTickets || "+0 from yest"}</div>
                <div>
                  <Link
                    to="/staff/queue?status=Open"
                    id="linkDrillOpen"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#4338CA" }}
                  >
                    View Queue &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 3: In Progress */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <div
                className="card h-100 shadow-sm border-0 p-3"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="text-muted small fw-semibold mb-1">In Progress</div>
                <div className="fs-2 fw-bold mb-1" style={{ color: "#B45309" }} id="metricInProgressTickets">
                  {data.metrics.inProgressTickets}
                </div>
                <div className="small text-muted mb-2">{data.trends?.inProgressTickets || "+0 from yest"}</div>
                <div>
                  <Link
                    to="/staff/queue?status=In%20Progress"
                    id="linkDrillInProgress"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#B45309" }}
                  >
                    View Queue &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 4: Waiting for Requester */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <div
                className="card h-100 shadow-sm border-0 p-3"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="text-muted small fw-semibold mb-1">Waiting Req</div>
                <div className="fs-2 fw-bold mb-1" style={{ color: "#6B21A8" }} id="metricWaitingTickets">
                  {data.metrics.waitingForRequesterTickets}
                </div>
                <div className="small text-muted mb-2">{data.trends?.waitingForRequesterTickets || "+0 from yest"}</div>
                <div>
                  <Link
                    to="/staff/queue?status=Waiting%20for%20Requester"
                    id="linkDrillWaiting"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#6B21A8" }}
                  >
                    View Queue &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 5: My Assigned */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <div
                className="card h-100 shadow-sm border-0 p-3"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="text-muted small fw-semibold mb-1">My Assigned</div>
                <div className="fs-2 fw-bold mb-1" style={{ color: "#006B3C" }} id="metricMyAssignedTickets">
                  {data.metrics.myAssignedTickets}
                </div>
                <div className="small text-muted mb-2">{data.trends?.myAssignedTickets || "+0 from yest"}</div>
                <div>
                  <Link
                    to="/staff/queue?owner=me"
                    id="linkDrillMyAssigned"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#006B3C" }}
                  >
                    View Queue &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 6: Unassigned (Section 4.6 & 8.1) */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <div
                className="card h-100 shadow-sm border-0 p-3"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="text-muted small fw-semibold mb-1">Unassigned</div>
                <div className="fs-2 fw-bold mb-1" style={{ color: "#C2410C" }} id="metricUnassignedTickets">
                  {data.metrics.unassignedTickets}
                </div>
                <div className="small text-muted mb-2">{data.trends?.unassignedTickets || "+0 from yest"}</div>
                <div>
                  <Link
                    to="/staff/queue?owner=unassigned"
                    id="linkDrillUnassigned"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#C2410C" }}
                  >
                    View Queue &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Operational Layout */}
          <div className="row g-4">
            {/* Left Column: My Recent Tickets (60-65%) */}
            <div className="col-12 col-lg-7 col-xl-8">
              <div
                className="card shadow-sm border-0 h-100"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="card-header bg-white py-3 px-3 px-md-4 border-bottom d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold" style={{ color: "#006B3C" }}>
                    My Recent Tickets
                  </h5>
                  <Link
                    to="/staff/queue?owner=me"
                    className="small fw-semibold text-decoration-none"
                    style={{ color: "#006B3C" }}
                  >
                    View all
                  </Link>
                </div>
                <div className="card-body p-0">
                  {data.myRecentTickets.length === 0 ? (
                    <div className="text-center py-5 text-muted" id="emptyMyRecentTickets">
                      <div className="fs-3 mb-2">📋</div>
                      <div>No recent tickets assigned to you.</div>
                      <div className="small">Check unassigned queue to claim open tickets.</div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0" id="tableMyRecentTickets">
                        <thead className="table-light text-secondary small">
                          <tr>
                            <th className="ps-3 ps-md-4 py-3">Ticket No</th>
                            <th className="py-3">Summary</th>
                            <th className="py-3">Priority</th>
                            <th className="py-3">Status</th>
                            <th className="pe-3 pe-md-4 py-3 text-end">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.myRecentTickets.map((t) => (
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
                                <div className="fw-medium text-dark text-truncate" style={{ maxWidth: "220px" }}>
                                  {t.summary}
                                </div>
                                <div className="text-muted small">{t.category}</div>
                              </td>
                              <td className="py-3">
                                <span
                                  className="badge px-2 py-1 rounded-pill fw-semibold"
                                  style={getPriorityBadgeStyle(t.itPriority)}
                                >
                                  {t.itPriority}
                                </span>
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

            {/* Right Column: Quick Actions & Priority & Admin Summary */}
            <div className="col-12 col-lg-5 col-xl-4 d-flex flex-column gap-4">
              {/* Quick Actions Panel */}
              <div
                className="card shadow-sm border-0"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
              >
                <div className="card-header bg-white py-3 px-3 px-md-4 border-bottom">
                  <h5 className="mb-0 fw-bold" style={{ color: "#006B3C" }}>
                    Quick Actions
                  </h5>
                </div>
                <div className="card-body p-3 p-md-4 d-flex flex-column gap-2">
                  <Link
                    to="/staff/queue"
                    id="btnStaffQuickSearch"
                    className="btn text-white p-2 px-3 text-start shadow-sm d-flex align-items-center gap-2 text-decoration-none"
                    style={{ backgroundColor: "#006B3C", borderRadius: "8px" }}
                  >
                    <span>🔍</span>
                    <span className="fw-semibold">Search Tickets</span>
                  </Link>

                  <Link
                    to="/staff/queue?owner=me"
                    id="btnStaffQuickMyQueue"
                    className="btn btn-outline-secondary p-2 px-3 text-start shadow-sm d-flex align-items-center gap-2 text-decoration-none"
                    style={{ borderRadius: "8px" }}
                  >
                    <span>📋</span>
                    <span className="fw-semibold text-dark">My Assigned Queue</span>
                  </Link>

                  <Link
                    to="/staff/queue?owner=unassigned"
                    id="btnStaffQuickUnassigned"
                    className="btn btn-outline-secondary p-2 px-3 text-start shadow-sm d-flex align-items-center gap-2 text-decoration-none"
                    style={{ borderRadius: "8px" }}
                  >
                    <span>⚡</span>
                    <span className="fw-semibold text-dark">Unassigned Queue</span>
                  </Link>
                </div>
              </div>

              {/* Tickets by IT Priority */}
              <div
                className="card shadow-sm border-0"
                style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
                id="panelTicketsByPriority"
              >
                <div className="card-header bg-white py-3 px-3 px-md-4 border-bottom">
                  <h5 className="mb-0 fw-bold" style={{ color: "#006B3C" }}>
                    Tickets by IT Priority
                  </h5>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="badge px-2 py-1 rounded-pill" style={getPriorityBadgeStyle("Low")}>Low</span>
                    <span className="fw-bold">{data.ticketsByPriority?.Low || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="badge px-2 py-1 rounded-pill" style={getPriorityBadgeStyle("Medium")}>Medium</span>
                    <span className="fw-bold">{data.ticketsByPriority?.Medium || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="badge px-2 py-1 rounded-pill" style={getPriorityBadgeStyle("High")}>High</span>
                    <span className="fw-bold">{data.ticketsByPriority?.High || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2">
                    <span className="badge px-2 py-1 rounded-pill" style={getPriorityBadgeStyle("Critical")}>Critical</span>
                    <span className="fw-bold text-danger">{data.ticketsByPriority?.Critical || 0}</span>
                  </div>
                </div>
              </div>

              {/* Admin Summary Panel (Only rendered if adminSummary exists) */}
              {isAdmin && data.adminSummary && (
                <div
                  className="card shadow-sm border-0"
                  style={{ borderRadius: "12px", backgroundColor: "#F5F3FF", border: "1px solid #DDD6FE" }}
                  id="panelAdminSummary"
                >
                  <div className="card-header bg-transparent py-3 px-3 px-md-4 border-bottom d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold" style={{ color: "#5B21B6" }}>
                      👑 Admin Summary
                    </h5>
                    <Link
                      to="/admin/users"
                      className="small fw-semibold text-decoration-none"
                      style={{ color: "#5B21B6" }}
                    >
                      Manage &rarr;
                    </Link>
                  </div>
                  <div className="card-body p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-center py-1">
                      <span className="text-secondary small">Total Active Users</span>
                      <span className="fw-bold fs-5 text-dark" id="adminTotalActive">
                        {data.adminSummary.totalActiveUsers}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-1 text-muted small">
                      <span>IT Staff</span>
                      <span className="fw-semibold">{data.adminSummary.activeStaff}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-1 text-muted small">
                      <span>Requesters</span>
                      <span className="fw-semibold">{data.adminSummary.activeRequesters}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-1 text-muted small">
                      <span>Administrators</span>
                      <span className="fw-semibold">{data.adminSummary.activeAdmins}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
