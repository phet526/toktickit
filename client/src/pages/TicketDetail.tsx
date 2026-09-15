import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getTicketById,
  deleteAttachment,
  getStaffTicketDetail,
  updateTicketOwnership,
  updateITPriority,
  updateTicketStatus,
  getPublicComments,
  createPublicComment,
  getInternalNotes,
  createInternalNote,
  getActiveStaffList,
  indicateProblemResolved,
  ActiveStaffMember,
  CommentItem,
  InternalNoteItem
} from "../api";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const ticketId = Number(id);

  const isStaff = user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR";
  const isOnlyStaff = user?.role === "IT_STAFF";
  const isAdmin = user?.role === "ADMINISTRATOR";

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "danger"; text: string } | null>(null);

  // Discussion & Notes state
  const [activeTab, setActiveTab] = useState<"comments" | "notes">("comments");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [notes, setNotes] = useState<InternalNoteItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  // Operational Controls state
  const [activeStaffList, setActiveStaffList] = useState<ActiveStaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | string>("");
  const [updatingOwner, setUpdatingOwner] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Requester resolution indication modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Fetch initial ticket data
  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError("");

      if (isStaff && typeof getStaffTicketDetail === "function") {
        const data = await getStaffTicketDetail(ticketId);
        setTicket(data);
        if (data.assignedStaff) {
          setSelectedStaffId(data.assignedStaff.id);
        } else {
          setSelectedStaffId("");
        }
      } else if (typeof getTicketById === "function") {
        const requesterId = user?.id || Number(localStorage.getItem("requesterId"));
        const data = await getTicketById(ticketId, requesterId);
        setTicket(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId && !authLoading) {
      loadTicketData();
    }
  }, [ticketId, isStaff, authLoading, user?.id]);

  // Load active staff list for IT Staff/Admin
  useEffect(() => {
    if (isStaff && typeof getActiveStaffList === "function") {
      getActiveStaffList()
        .then((list) => setActiveStaffList(list))
        .catch((err) => console.error("Error loading active staff list:", err));
    }
  }, [isStaff]);

  // Load public comments
  const loadComments = async () => {
    if (typeof getPublicComments !== "function") return;
    try {
      setLoadingComments(true);
      const data = await getPublicComments(ticketId);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Load internal notes (IT Staff & Admin only)
  const loadNotes = async () => {
    if (!isStaff || typeof getInternalNotes !== "function") return;
    try {
      setLoadingNotes(true);
      const data = await getInternalNotes(ticketId);
      setNotes(data);
    } catch (err) {
      console.error("Failed to load internal notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      loadComments();
      if (isStaff) {
        loadNotes();
      }
    }
  }, [ticketId, isStaff]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Operation Handlers
  const handleClaim = async () => {
    if (!user) return;
    try {
      setUpdatingOwner(true);
      const result = await updateTicketOwnership(ticketId, user.id);
      setTicket((prev: any) => ({
        ...prev,
        assignedStaff: result.assignedStaff
      }));
      setSelectedStaffId(user.id);
      setToast({ type: "success", text: "You have claimed this ticket." });
    } catch (err: any) {
      setToast({ type: "danger", text: err.message || "Failed to claim ticket" });
    } finally {
      setUpdatingOwner(false);
    }
  };

  const handleReassign = async (staffId: number) => {
    try {
      setUpdatingOwner(true);
      const result = await updateTicketOwnership(ticketId, staffId);
      setTicket((prev: any) => ({
        ...prev,
        assignedStaff: result.assignedStaff
      }));
      setSelectedStaffId(staffId);
      setToast({ type: "success", text: `Ticket reassigned to ${result.assignedStaff?.name}.` });
    } catch (err: any) {
      setToast({ type: "danger", text: err.message || "Failed to reassign ticket" });
    } finally {
      setUpdatingOwner(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      setUpdatingPriority(true);
      const result = await updateITPriority(ticketId, newPriority);
      setTicket((prev: any) => ({
        ...prev,
        itPriority: result.itPriority
      }));
      setToast({ type: "success", text: `IT Priority updated to ${result.itPriority}.` });
    } catch (err: any) {
      setToast({ type: "danger", text: err.message || "Failed to update IT Priority" });
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const result = await updateTicketStatus(ticketId, newStatus);
      // Reload full staff ticket detail to refresh permitted next transitions
      const refreshed = await getStaffTicketDetail(ticketId);
      setTicket(refreshed);
      setToast({ type: "success", text: `Ticket status updated to ${result.currentStatus}.` });
    } catch (err: any) {
      setToast({ type: "danger", text: err.message || "Failed to update ticket status" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      setSubmittingComment(true);
      const newComment = await createPublicComment(ticketId, commentInput.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentInput("");
      setToast({ type: "success", text: "Comment posted successfully." });
    } catch (err: any) {
      setToast({ type: "danger", text: err.message || "Failed to post comment" });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    try {
      setSubmittingNote(true);
      const newNote = await createInternalNote(ticketId, noteInput.trim());
      setNotes((prev) => [...prev, newNote]);
      setNoteInput("");
      setToast({ type: "success", text: "Internal note saved successfully." });
    } catch (err: any) {
      setToast({ type: "danger", text: err.message || "Failed to save internal note" });
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleIndicateResolvedConfirm = async () => {
    try {
      setResolving(true);
      await indicateProblemResolved(ticketId);
      setTicket((prev: any) => ({
        ...prev,
        problemResolvedReported: true
      }));
      setShowResolveModal(false);
      setToast({
        type: "success",
        text: "Signal sent: Problem resolution indicated to IT staff."
      });
      loadComments();
    } catch (err: any) {
      setToast({ type: "danger", text: err.message || "Failed to indicate resolution" });
    } finally {
      setResolving(false);
    }
  };

  // Lab 2 Attachment actions
  const handleDeleteAttachment = async (attachmentId: number, filename: string) => {
    const reason = window.prompt(`Please enter the reason for deleting "${filename}":`);
    if (reason === null) return;
    if (reason.trim() === "") {
      alert("Reason is required to delete an attachment.");
      return;
    }

    try {
      const requesterId = user?.id || Number(localStorage.getItem("requesterId"));
      await deleteAttachment(ticketId, attachmentId, requesterId, reason);
      setTicket((prev: any) => ({
        ...prev,
        attachments: prev.attachments.map((a: any) =>
          a.id === attachmentId
            ? { ...a, deletedAt: new Date().toISOString(), deletedReason: reason }
            : a
        )
      }));
    } catch (err: any) {
      alert(err.message || "Failed to delete attachment");
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Allowed: JPG, PNG, WEBP, PDF");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const requesterId = user?.id || localStorage.getItem("requesterId");
      const url = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/v1/tickets/${id}/attachments?requesterId=${requesterId}`;

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      loadTicketData();
    } catch (err: any) {
      alert(err.message || "Failed to upload attachment");
    } finally {
      e.target.value = "";
    }
  };

  // Badges & Styles Helper
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "New":
        return { backgroundColor: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD" };
      case "Open":
        return { backgroundColor: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE" };
      case "In Progress":
        return { backgroundColor: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A" };
      case "Waiting for Requester":
        return { backgroundColor: "#F3E8FF", color: "#6B21A8", border: "1px solid #E9D5FF" };
      case "Resolved":
        return { backgroundColor: "#DCFCE7", color: "#15803D", border: "1px solid #BBF7D0" };
      case "Closed":
        return { backgroundColor: "#F3F4F6", color: "#4B5563", border: "1px solid #E5E7EB" };
      case "Reopened":
        return { backgroundColor: "#FEF9C3", color: "#854D0E", border: "1px solid #FEF08A" };
      case "Cancelled":
        return { backgroundColor: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" };
    }
  };

  const getPriorityBadgeStyle = (prio: string) => {
    switch (prio) {
      case "Low":
        return { backgroundColor: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0" };
      case "Medium":
        return { backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" };
      case "High":
        return { backgroundColor: "#FFEDD5", color: "#C2410C", border: "1px solid #FED7AA" };
      case "Critical":
        return { backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#4B5563", border: "1px solid #E5E7EB" };
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "REQUESTER":
        return { backgroundColor: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD" };
      case "IT_STAFF":
        return { backgroundColor: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" };
      case "ADMINISTRATOR":
        return { backgroundColor: "#EDE9FE", color: "#5B21B6", border: "1px solid #DDD6FE" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#4B5563" };
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="card shadow-sm border-0 py-5 text-center my-4" style={{ borderRadius: "12px" }}>
        <div className="spinner-border mx-auto mb-3" role="status" style={{ color: "#006B3C" }}>
          <span className="visually-hidden">Loading ticket...</span>
        </div>
        <div className="text-muted fw-medium">Loading ticket details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger shadow-sm my-4" style={{ borderRadius: "10px" }}>
        <h5 className="fw-bold mb-1">Unable to load ticket</h5>
        <div>{error}</div>
        <div className="mt-3">
          <Link to={isStaff ? "/staff/queue" : "/my-tickets"} className="btn btn-sm btn-outline-danger">
            Back to Ticket List
          </Link>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="alert alert-warning shadow-sm my-4" style={{ borderRadius: "10px" }}>
        Ticket not found
      </div>
    );
  }

  const statusStyle = getStatusBadgeStyle(ticket.currentStatus);
  const itPriorityStyle = getPriorityBadgeStyle(ticket.itPriority || ticket.requestedPriority);
  const reqPriorityStyle = getPriorityBadgeStyle(ticket.requestedPriority);

  // Can requester indicate problem resolved?
  const canIndicateResolution =
    !isStaff &&
    !ticket.problemResolvedReported &&
    ["Open", "In Progress", "Waiting for Requester"].includes(ticket.currentStatus);

  return (
    <div className="container-fluid px-0 py-2">
      {/* Toast Banner */}
      {toast && (
        <div
          className={`alert alert-${toast.type} alert-dismissible fade show shadow-sm mb-3`}
          role="alert"
          style={{ borderRadius: "10px" }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <span>{toast.text}</span>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setToast(null)}
            ></button>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div
        className="card shadow-sm border-0 mb-4"
        style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
      >
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                <span className="badge bg-light text-dark border font-monospace px-2 py-1 fs-6">
                  {ticket.ticketNo}
                </span>
                <span
                  className="badge px-2 py-1 rounded-pill"
                  style={{ ...statusStyle, fontSize: "0.85rem", fontWeight: 600 }}
                >
                  {ticket.currentStatus}
                </span>
                {ticket.itPriority && (
                  <span
                    className="badge px-2 py-1 rounded-pill"
                    style={{ ...itPriorityStyle, fontSize: "0.85rem", fontWeight: 600 }}
                    title="IT Priority"
                  >
                    IT: {ticket.itPriority}
                  </span>
                )}
                {ticket.problemResolvedReported && (
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-semibold">
                    ✓ Resolution Indicated
                  </span>
                )}
              </div>
              <h4 className="fw-bold mb-1" style={{ color: "#1F2937" }}>
                {ticket.summary}
              </h4>
              <div className="text-muted small">
                Created: {formatDate(ticket.createdAt || ticket.createdDate)}
                {ticket.requester && (
                  <span className="ms-2">
                    • Requested by: <strong>{ticket.requester.name}</strong> ({ticket.requester.email})
                  </span>
                )}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Requester "Problem Appears Resolved" button */}
              {canIndicateResolution && (
                <button
                  type="button"
                  id="btnIndicateResolved"
                  className="btn btn-outline-success fw-semibold"
                  style={{ borderColor: "#006B3C", color: "#006B3C", borderRadius: "8px" }}
                  onClick={() => setShowResolveModal(true)}
                >
                  ✓ Problem Appears Resolved
                </button>
              )}

              {ticket.problemResolvedReported && !isStaff && (
                <button
                  type="button"
                  className="btn btn-light text-muted fw-semibold"
                  disabled
                  style={{ borderRadius: "8px" }}
                >
                  ✓ Resolution Indicated
                </button>
              )}

              <Link
                to={isStaff ? "/staff/queue" : "/my-tickets"}
                className="btn btn-outline-secondary fw-semibold"
                style={{ borderRadius: "8px" }}
              >
                ← Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout for IT Staff, or 1-Column for Requester */}
      <div className="row g-4">
        {/* Left Column: Ticket Details, Attachments & Discussion/Notes */}
        <div className={isStaff ? "col-12 col-lg-8" : "col-12"}>
          {/* Resolution Indicator Alert Banner */}
          {ticket.problemResolvedReported && (
            <div
              className="alert border-0 shadow-sm d-flex align-items-center gap-3 mb-4"
              style={{
                backgroundColor: "#EAF6EF",
                borderLeft: "4px solid #006B3C",
                borderRadius: "10px"
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>💡</span>
              <div>
                <strong style={{ color: "#006B3C" }}>Resolution Indicated by Requester:</strong>
                <div className="small text-secondary mt-0">
                  The user has confirmed that this issue appears resolved. IT Staff can review and verify before moving the ticket to <strong>Resolved</strong> or <strong>Closed</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Ticket Information Card */}
          <div
            className="card shadow-sm border-0 mb-4"
            style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
          >
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold" style={{ color: "#006B3C" }}>
                Ticket Information
              </h5>
            </div>
            <div className="card-body p-3 p-md-4">
              <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Category
                  </label>
                  <p className="fw-medium text-dark mb-0">
                    <span className="badge bg-light text-dark border px-2 py-1">
                      {ticket.category?.name || "General"}
                    </span>
                  </p>
                </div>

                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Related System
                  </label>
                  <p className="fw-medium text-dark mb-0">
                    <span className="badge bg-light text-dark border px-2 py-1">
                      {ticket.relatedSystem?.name || "General Support"}
                    </span>
                  </p>
                </div>

                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Requested Priority
                  </label>
                  <p className="mb-0">
                    <span
                      className="badge px-2 py-1 rounded-pill"
                      style={{ ...reqPriorityStyle, fontSize: "0.8rem", fontWeight: 600 }}
                    >
                      {ticket.requestedPriority}
                    </span>
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="form-label small fw-semibold text-secondary mb-1">
                  Description
                </label>
                <div
                  className="p-3 bg-light rounded text-dark"
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                    border: "1px solid #E2E8F0"
                  }}
                >
                  {ticket.description}
                </div>
              </div>

              {/* Attachments Section */}
              <div>
                <label className="form-label small fw-semibold text-secondary mb-2">
                  Attachments
                </label>
                {ticket.attachments && ticket.attachments.length > 0 ? (
                  <ul className="list-group mb-3">
                    {ticket.attachments.map((file: any) => (
                      <li
                        key={file.id}
                        className="list-group-item d-flex justify-content-between align-items-center py-2 px-3"
                        style={{ borderColor: "#E2E8F0" }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span>📎</span>
                          {file.deletedAt ? (
                            <span className="text-muted text-decoration-line-through">
                              {file.filename} <small>({Math.round(file.size / 1024)} KB)</small>
                            </span>
                          ) : (
                            <a
                              href={`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/v1/tickets/${ticket.id}/attachments/${file.id}/download?requesterId=${user?.id || 1}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-decoration-none fw-medium"
                              style={{ color: "#006B3C" }}
                            >
                              {file.filename} <small className="text-muted">({Math.round(file.size / 1024)} KB)</small>
                            </a>
                          )}
                          {file.deletedAt && (
                            <span
                              className="badge bg-secondary ms-1"
                              title={`Deleted Reason: ${file.deletedReason}`}
                            >
                              Deleted
                            </span>
                          )}
                        </div>
                        {!file.deletedAt && !isStaff && (
                          <button
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            title="Delete Attachment"
                            onClick={() => handleDeleteAttachment(file.id, file.filename)}
                          >
                            X
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted fst-italic small mb-3">No attachments uploaded.</p>
                )}

                {!isStaff && (
                  <div>
                    <label
                      className="btn btn-sm text-white fw-semibold"
                      style={{ backgroundColor: "#006B3C", borderRadius: "8px" }}
                    >
                      <i className="bi bi-upload me-1"></i> Add Attachment
                      <input
                        id="fileUpload"
                        type="file"
                        className="d-none"
                        onChange={handleUploadAttachment}
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        aria-label="Upload Attachment"
                      />
                    </label>
                    <div className="form-text small mt-1">Max 5MB (JPG, PNG, WEBP, PDF)</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Discussion & Internal Notes Card */}
          <div
            className="card shadow-sm border-0 mb-4"
            style={{ borderRadius: "12px", backgroundColor: "#FFFFFF" }}
          >
            {/* Tabs Header */}
            <div className="card-header bg-white p-2 border-bottom">
              <ul className="nav nav-tabs card-header-tabs m-0 border-0" role="tablist">
                <li className="nav-item">
                  <button
                    id="tabPublicComments"
                    role="tab"
                    aria-selected={activeTab === "comments"}
                    className={`nav-link fw-semibold px-3 py-2 border-0 ${
                      activeTab === "comments"
                        ? "active text-dark border-bottom border-3 border-success"
                        : "text-muted"
                    }`}
                    style={{
                      borderBottomColor: activeTab === "comments" ? "#006B3C" : "transparent"
                    }}
                    onClick={() => setActiveTab("comments")}
                    type="button"
                  >
                    💬 Public Comments ({comments.length})
                  </button>
                </li>
                {isStaff && (
                  <li className="nav-item">
                    <button
                      id="tabInternalNotes"
                      role="tab"
                      aria-selected={activeTab === "notes"}
                      className={`nav-link fw-semibold px-3 py-2 border-0 ${
                        activeTab === "notes"
                          ? "active text-dark border-bottom border-3 border-warning"
                          : "text-muted"
                      }`}
                      style={{
                        borderBottomColor: activeTab === "notes" ? "#F59E0B" : "transparent"
                      }}
                      onClick={() => setActiveTab("notes")}
                      type="button"
                    >
                      🔒 Internal Notes ({notes.length})
                    </button>
                  </li>
                )}
              </ul>
            </div>

            <div className="card-body p-3 p-md-4">
              {/* Tab 1: Public Comments */}
              {activeTab === "comments" && (
                <div>
                  <div
                    className="p-3 mb-3 rounded"
                    style={{ backgroundColor: "#F4FBF7", border: "1px solid #A7F3D0" }}
                  >
                    <div className="small text-muted mb-0">
                      <strong>Public Discussion:</strong> Visible to the Requester, IT Staff, and Administrators.
                    </div>
                  </div>

                  {/* Comment Timeline */}
                  {loadingComments ? (
                    <div className="text-center py-3 text-muted small">Loading comments...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-4 text-muted small">
                      No public comments yet. Start the conversation below.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3 mb-4">
                      {comments.map((c) => {
                        const rStyle = getRoleBadgeStyle(c.author?.role);
                        return (
                          <div
                            key={c.id}
                            className="p-3 rounded shadow-xs"
                            style={{
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E2E8F0"
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white small"
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    backgroundColor: c.author?.role === "REQUESTER" ? "#0369A1" : "#006B3C"
                                  }}
                                >
                                  {c.author?.name ? c.author.name[0].toUpperCase() : "U"}
                                </div>
                                <span className="fw-semibold text-dark">{c.author?.name}</span>
                                <span
                                  className="badge rounded-pill"
                                  style={{ ...rStyle, fontSize: "0.7rem", fontWeight: 600 }}
                                >
                                  {c.author?.role}
                                </span>
                              </div>
                              <span className="text-muted small">{formatDate(c.createdAt)}</span>
                            </div>
                            <div className="text-dark" style={{ whiteSpace: "pre-wrap", fontSize: "0.92rem" }}>
                              {c.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Post Comment Form */}
                  <form onSubmit={handleSubmitComment} className="mt-3">
                    <div className="mb-2">
                      <label htmlFor="publicCommentInput" className="form-label small fw-semibold text-secondary">
                        Add a public comment
                      </label>
                      <textarea
                        id="publicCommentInput"
                        className="form-control"
                        rows={3}
                        placeholder="Type your message here (up to 1,000 characters)..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        maxLength={1000}
                        required
                        style={{ borderRadius: "8px", borderColor: "#D1D5DB" }}
                      ></textarea>
                      <div className="d-flex justify-content-between small text-muted mt-1">
                        <span>Markdown formatting supported</span>
                        <span>{commentInput.length} / 1000</span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      id="btnSubmitComment"
                      disabled={submittingComment || !commentInput.trim()}
                      className="btn text-white fw-semibold px-3 py-2"
                      style={{ backgroundColor: "#006B3C", borderRadius: "8px" }}
                    >
                      {submittingComment ? "Posting..." : "Post Comment"}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Confidential Internal Notes (IT Staff & Admin Only) */}
              {activeTab === "notes" && isStaff && (
                <div>
                  {/* Warning / Confidentiality Box */}
                  <div
                    className="p-3 mb-3 rounded"
                    style={{
                      backgroundColor: "#FFFBEB",
                      border: "1px solid #F59E0B"
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-warning text-dark fw-bold px-2 py-1">
                        🔒 Internal Note - IT Staff Only
                      </span>
                      <strong className="text-dark small">Strictly Confidential</strong>
                    </div>
                    <div className="small text-muted mb-0">
                      Notes recorded here are never shown to Requesters. Use this area for technical diagnostic logs, internal coordination, and escalation notes.
                    </div>
                  </div>

                  {/* Notes Timeline */}
                  {loadingNotes ? (
                    <div className="text-center py-3 text-muted small">Loading notes...</div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-4 text-muted small">
                      No internal notes recorded yet.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3 mb-4">
                      {notes.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded shadow-xs"
                          style={{
                            backgroundColor: "#FFFDF5",
                            border: "1px solid #FDE68A"
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-semibold text-dark">👤 {n.author?.name}</span>
                              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill small">
                                {n.author?.role}
                              </span>
                            </div>
                            <span className="text-muted small">{formatDate(n.createdAt)}</span>
                          </div>
                          <div className="text-dark" style={{ whiteSpace: "pre-wrap", fontSize: "0.92rem" }}>
                            {n.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Note Form (IT_STAFF and ADMINISTRATOR) */}
                  {isStaff && (
                    <form onSubmit={handleSubmitNote} className="mt-3">
                      <div className="mb-2">
                        <label htmlFor="internalNoteInput" className="form-label small fw-semibold text-secondary">
                          Record an internal note
                        </label>
                        <textarea
                          id="internalNoteInput"
                          className="form-control"
                          rows={3}
                          placeholder="Record technical notes or coordination details..."
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          maxLength={1000}
                          required
                          style={{ borderRadius: "8px", borderColor: "#FCD34D" }}
                        ></textarea>
                        <div className="d-flex justify-content-between small text-muted mt-1">
                          <span>Saved notes cannot be edited or deleted (Append-only).</span>
                          <span>{noteInput.length} / 1000</span>
                        </div>
                      </div>
                      <button
                        type="submit"
                        id="btnSubmitNote"
                        disabled={submittingNote || !noteInput.trim()}
                        className="btn btn-warning text-dark fw-bold px-3 py-2"
                        style={{ borderRadius: "8px" }}
                      >
                        {submittingNote ? "Saving..." : "Add Internal Note"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Operational Controls (IT Staff & Admin View) */}
        {isStaff && (
          <div className="col-12 col-lg-4">
            <div
              className="card shadow-sm border-0 sticky-top"
              style={{ top: "1rem", borderRadius: "12px", backgroundColor: "#FFFFFF" }}
            >
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="mb-0 fw-bold" style={{ color: "#006B3C" }}>
                  Operations & Controls
                </h5>
              </div>

              <div className="card-body p-3 p-md-4">
                {/* 1. Ticket Ownership Control */}
                <div className="mb-4 pb-3 border-bottom">
                  <label className="form-label small fw-bold text-dark d-flex justify-content-between">
                    <span>Ticket Owner</span>
                    {ticket.assignedStaff && (
                      <span className="text-muted fw-normal small">Active Staff</span>
                    )}
                  </label>

                  {ticket.assignedStaff ? (
                    <div className="d-flex align-items-center gap-2 mb-3 p-2 bg-light rounded">
                      <span style={{ fontSize: "1.2rem" }}>👤</span>
                      <div>
                        <div className="fw-semibold text-dark">{ticket.assignedStaff.name}</div>
                        <div className="small text-muted">{ticket.assignedStaff.email || "IT Support Staff"}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="badge bg-light text-muted border border-dashed py-2 px-3 w-100 mb-2 text-center fs-6">
                        Unassigned Ticket
                      </div>
                      <button
                        type="button"
                        id="btnClaimTicket"
                        disabled={updatingOwner}
                        onClick={handleClaim}
                        className="btn w-100 text-white fw-semibold py-2"
                        style={{ backgroundColor: "#006B3C", borderRadius: "8px" }}
                      >
                        {updatingOwner ? "Claiming..." : "⚡ Claim Ticket (Assign to Me)"}
                      </button>
                    </div>
                  )}

                  {/* Reassign Dropdown */}
                  <div>
                    <label htmlFor="selectReassignStaff" className="form-label small text-muted mb-1">
                      {ticket.assignedStaff ? "Reassign to another staff:" : "Or assign to staff member:"}
                    </label>
                    <div className="d-flex gap-2">
                      <select
                        id="selectReassignStaff"
                        className="form-select"
                        style={{ borderRadius: "8px", borderColor: "#D1D5DB" }}
                        value={selectedStaffId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedStaffId(val);
                          if (val) {
                            handleReassign(Number(val));
                          }
                        }}
                        disabled={updatingOwner}
                      >
                        <option value="">Select IT Staff / Admin...</option>
                        {activeStaffList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {user?.id === s.id ? "(You)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. IT Priority Control */}
                <div className="mb-4 pb-3 border-bottom">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label htmlFor="selectITPriority" className="form-label small fw-bold text-dark mb-0">
                      IT Priority
                    </label>
                    <span
                      className="badge px-2 py-1 rounded-pill"
                      style={{ ...itPriorityStyle, fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      {ticket.itPriority || ticket.requestedPriority}
                    </span>
                  </div>
                  <select
                    id="selectITPriority"
                    className="form-select"
                    style={{ borderRadius: "8px", borderColor: "#D1D5DB" }}
                    value={ticket.itPriority || ticket.requestedPriority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    disabled={updatingPriority}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <div className="form-text small text-muted mt-1">
                    Requested priority remains: <strong>{ticket.requestedPriority}</strong>
                  </div>
                </div>

                {/* 3. Ticket Status Control */}
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label htmlFor="selectTicketStatus" className="form-label small fw-bold text-dark mb-0">
                      Ticket Status
                    </label>
                    <span
                      className="badge px-2 py-1 rounded-pill"
                      style={{ ...statusStyle, fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      {ticket.currentStatus}
                    </span>
                  </div>

                  {ticket.permittedStatusTransitions && ticket.permittedStatusTransitions.length > 0 ? (
                    <div>
                      <select
                        id="selectTicketStatus"
                        className="form-select mb-2"
                        style={{ borderRadius: "8px", borderColor: "#D1D5DB" }}
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleStatusChange(e.target.value);
                          }
                        }}
                        disabled={updatingStatus}
                      >
                        <option value="">Select Next Status...</option>
                        {ticket.permittedStatusTransitions.map((st: string) => (
                          <option key={st} value={st}>
                            ➔ Change to: {st}
                          </option>
                        ))}
                      </select>
                      <div className="small text-muted">
                        Allowed transitions: {ticket.permittedStatusTransitions.join(", ")}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted small">No next status transitions permitted.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Requester Problem Appears Resolved */}
      {showResolveModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0" style={{ borderRadius: "12px" }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold" style={{ color: "#006B3C" }}>
                  Indicate Problem Resolved
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowResolveModal(false)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="mb-2">
                  Are you sure you want to signal that this problem appears resolved?
                </p>
                <div
                  className="p-2 rounded small text-secondary"
                  style={{ backgroundColor: "#F4FBF7", border: "1px solid #A7F3D0" }}
                >
                  This will notify the IT Staff team and automatically post a public confirmation note. The official status of the ticket will be verified and closed by IT Staff.
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowResolveModal(false)}
                  disabled={resolving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btnConfirmResolve"
                  className="btn text-white fw-semibold"
                  style={{ backgroundColor: "#006B3C" }}
                  onClick={handleIndicateResolvedConfirm}
                  disabled={resolving}
                >
                  {resolving ? "Sending..." : "Confirm Resolution"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
