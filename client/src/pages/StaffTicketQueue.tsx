import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getStaffTickets,
  checkSystem,
  Category,
  StaffTicketItem,
  StaffTicketPaginationMeta
} from "../api";

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

export function getPriorityBadgeStyle(priority: string) {
  switch (priority?.toLowerCase()) {
    case "low":
      return { backgroundColor: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" };
    case "medium":
      return { backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" };
    case "high":
      return { backgroundColor: "#FFEDD5", color: "#C2410C", border: "1px solid #FED7AA" };
    case "critical":
      return { backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#4B5563", border: "1px solid #E5E7EB" };
  }
}

export default function StaffTicketQueue() {
  const [tickets, setTickets] = useState<StaffTicketItem[]>([]);
  const [meta, setMeta] = useState<StaffTicketPaginationMeta>({
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [owner, setOwner] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch categories on mount
  useEffect(() => {
    checkSystem()
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {
        // Fallback categories if service call fails
        setCategories([
          { id: 1, name: "Account and Access" },
          { id: 2, name: "Hardware" },
          { id: 3, name: "Software" },
          { id: 4, name: "Network" }
        ]);
      });
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffTickets({
        search: debouncedSearch,
        status: status !== "all" ? status : undefined,
        category: category !== "all" ? category : undefined,
        priority: priority !== "all" ? priority : undefined,
        owner: owner !== "all" ? owner : undefined,
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc"
      });
      setTickets(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, category, priority, owner, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("all");
    setCategory("all");
    setPriority("all");
    setOwner("all");
    setPage(1);
  };

  const hasActiveFilters =
    debouncedSearch !== "" ||
    status !== "all" ||
    category !== "all" ||
    priority !== "all" ||
    owner !== "all";

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const startItem = meta.totalItems === 0 ? 0 : (meta.currentPage - 1) * meta.limit + 1;
  const endItem = Math.min(meta.currentPage * meta.limit, meta.totalItems);

  return (
    <div className="container-fluid px-0">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: "1.5rem" }}>📋</span>
            <h2 className="mb-0 fw-bold" style={{ color: "#1F2937" }}>
              IT Staff Ticket Queue
            </h2>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Search, triage, and manage incoming support tickets across the organization
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={fetchTickets}
            disabled={loading}
            title="Refresh Queue"
            style={{ borderRadius: "8px", minHeight: "38px" }}
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="alert alert-danger d-flex align-items-center justify-content-between py-2 px-3 mb-4"
          style={{
            backgroundColor: "#FEF2F2",
            borderColor: "#EF4444",
            color: "#DC2626",
            borderRadius: "8px"
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={fetchTickets}
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filters Card */}
      <div
        className="card shadow-sm border-0 mb-4"
        style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
      >
        <div className="card-body p-3 p-md-4">
          <div className="row g-3">
            {/* Search Input */}
            <div className="col-12 col-lg-4">
              <label htmlFor="searchQueue" className="form-label small fw-semibold text-secondary mb-1">
                Search
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted border-end-0" style={{ borderRadius: "8px 0 0 8px" }}>
                  🔍
                </span>
                <input
                  id="searchQueue"
                  type="text"
                  className="form-control border-start-0"
                  style={{ borderRadius: "0 8px 8px 0", borderColor: "#D1D5DB" }}
                  placeholder="Ticket No. or Summary..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearch("")}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-3 col-lg-2">
              <label htmlFor="statusFilter" className="form-label small fw-semibold text-secondary mb-1">
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select"
                style={{ borderRadius: "8px", borderColor: "#D1D5DB" }}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="New">New</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Requester">Waiting for Requester</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-3 col-lg-2">
              <label htmlFor="categoryFilter" className="form-label small fw-semibold text-secondary mb-1">
                Category
              </label>
              <select
                id="categoryFilter"
                className="form-select"
                style={{ borderRadius: "8px", borderColor: "#D1D5DB" }}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="col-6 col-md-3 col-lg-2">
              <label htmlFor="priorityFilter" className="form-label small fw-semibold text-secondary mb-1">
                IT Priority
              </label>
              <select
                id="priorityFilter"
                className="form-select"
                style={{ borderRadius: "8px", borderColor: "#D1D5DB" }}
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Ownership Filter */}
            <div className="col-6 col-md-3 col-lg-2">
              <label htmlFor="ownerFilter" className="form-label small fw-semibold text-secondary mb-1">
                Ownership
              </label>
              <select
                id="ownerFilter"
                className="form-select"
                style={{ borderRadius: "8px", borderColor: "#D1D5DB" }}
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Tickets</option>
                <option value="unassigned">Unassigned</option>
                <option value="me">Assigned to Me</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips / Clear Button */}
          {hasActiveFilters && (
            <div className="d-flex align-items-center gap-2 mt-3 pt-2 border-top">
              <span className="text-muted small">Active Filters:</span>
              <button
                type="button"
                className="btn btn-link btn-sm text-danger text-decoration-none p-0 fw-semibold"
                onClick={handleClearFilters}
              >
                ✕ Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card shadow-sm border-0 py-5 text-center" style={{ borderRadius: "12px" }}>
          <div className="spinner-border mx-auto mb-3" role="status" style={{ color: "#006B3C" }}>
            <span className="visually-hidden">Loading tickets...</span>
          </div>
          <div className="text-muted fw-medium">Loading ticket queue...</div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card shadow-sm border-0 py-5 text-center" style={{ borderRadius: "12px" }}>
          <div className="card-body">
            <span style={{ fontSize: "3rem" }}>📂</span>
            {hasActiveFilters ? (
              <>
                <h5 className="fw-bold mt-3 mb-1" style={{ color: "#1F2937" }}>
                  No tickets match your search criteria
                </h5>
                <p className="text-muted small mb-3">
                  Try adjusting or clearing your filters to see more results.
                </p>
                <button
                  className="btn text-white px-3 py-2 fw-semibold"
                  style={{ backgroundColor: "#006B3C", borderRadius: "8px" }}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h5 className="fw-bold mt-3 mb-1" style={{ color: "#1F2937" }}>
                  No tickets in queue
                </h5>
                <p className="text-muted small mb-0">
                  There are currently no support tickets waiting in the queue.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table View (Hidden on Mobile < 768px) */}
          <div
            className="d-none d-md-block card shadow-sm border-0 overflow-hidden mb-3"
            style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
          >
            <div className="table-responsive mb-0">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.9rem" }}>
                <thead style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  <tr className="text-secondary small fw-semibold">
                    <th style={{ padding: "0.75rem 1rem", minWidth: "130px" }}>Ticket No.</th>
                    <th style={{ padding: "0.75rem 1rem", minWidth: "150px" }}>Created Date</th>
                    <th style={{ padding: "0.75rem 1rem", minWidth: "220px" }}>Summary</th>
                    <th style={{ padding: "0.75rem 1rem", minWidth: "110px" }}>Category</th>
                    <th style={{ padding: "0.75rem 1rem", minWidth: "110px" }}>Req. Priority</th>
                    <th style={{ padding: "0.75rem 1rem", minWidth: "110px" }}>IT Priority</th>
                    <th style={{ padding: "0.75rem 1rem", minWidth: "130px" }}>Status</th>
                    <th style={{ padding: "0.75rem 1rem", minWidth: "140px" }}>Owner</th>
                    <th style={{ padding: "0.75rem 1rem", minWidth: "90px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const statusStyle = getStatusBadgeStyle(t.currentStatus);
                    const itPriorityStyle = getPriorityBadgeStyle(t.itPriority);
                    const reqPriorityStyle = getPriorityBadgeStyle(t.requestedPriority);

                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span className="fw-semibold text-dark font-monospace">
                            {t.ticketNo}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#4B5563" }}>
                          {formatDate(t.createdDate)}
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div className="fw-medium text-dark text-truncate" style={{ maxWidth: "260px" }}>
                            {t.summary}
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span className="badge bg-light text-dark border">
                            {t.category}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            className="badge px-2 py-1 rounded-pill"
                            style={{ ...reqPriorityStyle, fontSize: "0.75rem", fontWeight: 600 }}
                          >
                            {t.requestedPriority}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            className="badge px-2 py-1 rounded-pill"
                            style={{ ...itPriorityStyle, fontSize: "0.75rem", fontWeight: 600 }}
                          >
                            {t.itPriority}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            className="badge px-2 py-1 rounded-pill"
                            style={{ ...statusStyle, fontSize: "0.75rem", fontWeight: 600 }}
                          >
                            {t.currentStatus}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          {t.ticketOwner ? (
                            <span className="fw-medium text-dark d-flex align-items-center gap-1">
                              <span>👤</span>
                              <span>{t.ticketOwner.name}</span>
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border border-dashed">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                          <Link
                            to={`/tickets/${t.id}`}
                            className="btn btn-sm btn-outline-success fw-semibold"
                            style={{
                              borderRadius: "6px",
                              borderColor: "#006B3C",
                              color: "#006B3C",
                              fontSize: "0.8rem",
                              padding: "0.25rem 0.6rem"
                            }}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (Visible only on Mobile < 768px, no horizontal overflow!) */}
          <div className="d-block d-md-none mb-3">
            <div className="d-flex flex-column gap-3">
              {tickets.map((t) => {
                const statusStyle = getStatusBadgeStyle(t.currentStatus);
                const itPriorityStyle = getPriorityBadgeStyle(t.itPriority);

                return (
                  <div
                    key={t.id}
                    className="card shadow-sm border-0 p-3"
                    style={{ borderRadius: "10px", backgroundColor: "#FFFFFF" }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold font-monospace text-dark">
                        {t.ticketNo}
                      </span>
                      <span
                        className="badge px-2 py-1 rounded-pill"
                        style={{ ...statusStyle, fontSize: "0.75rem", fontWeight: 600 }}
                      >
                        {t.currentStatus}
                      </span>
                    </div>

                    <h6 className="fw-semibold text-dark mb-2">
                      {t.summary}
                    </h6>

                    <div className="d-flex flex-wrap align-items-center gap-2 mb-3 small text-muted">
                      <span className="badge bg-light text-dark border">
                        {t.category}
                      </span>
                      <span
                        className="badge px-2 py-1 rounded-pill"
                        style={{ ...itPriorityStyle, fontSize: "0.72rem", fontWeight: 600 }}
                      >
                        Priority: {t.itPriority}
                      </span>
                      <span>•</span>
                      <span>{formatDate(t.createdDate)}</span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                      <div className="small text-secondary">
                        Owner:{" "}
                        <span className="fw-medium text-dark">
                          {t.ticketOwner ? t.ticketOwner.name : "Unassigned"}
                        </span>
                      </div>
                      <Link
                        to={`/tickets/${t.id}`}
                        className="btn btn-sm text-white fw-semibold px-3"
                        style={{
                          backgroundColor: "#006B3C",
                          borderRadius: "6px",
                          minHeight: "36px",
                          display: "inline-flex",
                          alignItems: "center"
                        }}
                      >
                        View Detail
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="card shadow-sm border-0 p-3" style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}>
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
              <div className="small text-secondary">
                Showing <span className="fw-semibold text-dark">{startItem}</span> to{" "}
                <span className="fw-semibold text-dark">{endItem}</span> of{" "}
                <span className="fw-semibold text-dark">{meta.totalItems}</span> tickets
              </div>

              <div className="d-flex align-items-center gap-1">
                <button
                  className="btn btn-outline-secondary btn-sm px-3"
                  style={{ borderRadius: "6px", minHeight: "36px" }}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  ‹ Previous
                </button>

                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`btn btn-sm px-3 ${
                      pageNum === page ? "text-white fw-bold" : "btn-outline-secondary"
                    }`}
                    style={{
                      borderRadius: "6px",
                      minHeight: "36px",
                      backgroundColor: pageNum === page ? "#006B3C" : "transparent",
                      borderColor: pageNum === page ? "#006B3C" : "#D1D5DB"
                    }}
                    onClick={() => setPage(pageNum)}
                    aria-current={pageNum === page ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  className="btn btn-outline-secondary btn-sm px-3"
                  style={{ borderRadius: "6px", minHeight: "36px" }}
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  aria-label="Next page"
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
