import React, { useState, useEffect, useCallback } from "react";
import { User, ActionTaken, getActionsTaken } from "../api";
import ActionTakenModal from "./ActionTakenModal";

export interface ActionsTakenSectionProps {
  ticketId: number;
  currentUser: User;
  isStaff: boolean;
  onActionsUpdated?: (count: number) => void;
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

export default function ActionsTakenSection({
  ticketId,
  currentUser,
  isStaff,
  onActionsUpdated
}: ActionsTakenSectionProps) {
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);

  const fetchActions = useCallback(async () => {
    if (typeof getActionsTaken !== "function") {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await getActionsTaken(ticketId);
      setActions(res.data || []);
      if (onActionsUpdated) {
        onActionsUpdated((res.data || []).length);
      }
    } catch (err: any) {
      console.error("Failed to load actions taken:", err);
      setError(err.message || "Failed to load actions taken");
    } finally {
      setLoading(false);
    }
  }, [ticketId, onActionsUpdated]);

  useEffect(() => {
    if (ticketId) {
      fetchActions();
    }
  }, [fetchActions, ticketId]);

  const handleOpenAddModal = () => {
    setEditingAction(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (act: ActionTaken) => {
    setEditingAction(act);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAction(null);
  };

  const handleSuccess = () => {
    fetchActions();
  };

  return (
    <div
      className="card shadow-sm border-0 mb-4"
      id="actionsTakenSection"
      style={{ borderRadius: "12px", backgroundColor: "#FFFFFF", maxWidth: "100%", overflowX: "hidden" }}
    >
      {/* Section Header */}
      <div className="card-header bg-white py-3 px-3 px-md-4 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: "#006B3C" }}>
            <span>🛠️ Actions Taken</span>
            <span
              className="badge rounded-pill fw-semibold"
              id="actionsCountBadge"
              style={{
                backgroundColor: actions.length > 0 ? "#EAF6EF" : "#F3F4F6",
                color: actions.length > 0 ? "#006B3C" : "#6B7280",
                fontSize: "0.85rem",
                border: "1px solid #E2E8F0"
              }}
            >
              ({actions.length})
            </span>
          </h5>
        </div>

        {/* Add Action Button - Only visible for IT Staff and Administrator (BR-03, AC-05) */}
        {isStaff && (
          <button
            type="button"
            id="btnAddActionTaken"
            className="btn text-white fw-semibold d-flex align-items-center gap-1 shadow-sm"
            style={{ backgroundColor: "#006B3C", borderColor: "#006B3C", borderRadius: "8px" }}
            onClick={handleOpenAddModal}
          >
            <span>➕</span>
            <span>Add Action Taken</span>
          </button>
        )}
      </div>

      <div className="card-body p-3 p-md-4">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-4" id="actionsLoading">
            <div className="spinner-border spinner-border-sm me-2" role="status" style={{ color: "#006B3C" }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="text-muted small">Loading actions taken...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center p-3 mb-0" role="alert">
            <div>
              <strong>Error:</strong> {error}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={fetchActions}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && actions.length === 0 && (
          <div
            className="text-center py-5 px-3 rounded"
            id="emptyActionsState"
            style={{ backgroundColor: "#F9FAFB", border: "1px dashed #D1D5DB" }}
          >
            <div className="text-muted mb-2" style={{ fontSize: "2rem" }}>📋</div>
            <h6 className="fw-semibold text-secondary mb-1">No actions taken recorded yet.</h6>
            <p className="text-muted small mb-0">
              {isStaff
                ? "Click '+ Add Action Taken' to record diagnostic steps and technical work performed."
                : "IT Staff will record technical actions and findings here as work progresses."}
            </p>
          </div>
        )}

        {/* Data Present: Responsive Views */}
        {!loading && !error && actions.length > 0 && (
          <>
            {/* 1. Desktop & Tablet Table View (Hidden on mobile < 768px) */}
            <div className="d-none d-md-block table-responsive" style={{ overflowX: "auto" }}>
              <table className="table table-hover align-middle mb-0" id="actionsTableDesktop">
                <thead style={{ backgroundColor: "#F4FBF7", color: "#1F2937" }}>
                  <tr>
                    <th style={{ width: "20%", borderBottom: "2px solid #E2E8F0" }}>Date & Time</th>
                    <th style={{ width: "35%", borderBottom: "2px solid #E2E8F0" }}>Action & Result</th>
                    <th style={{ width: "20%", borderBottom: "2px solid #E2E8F0" }}>Performer</th>
                    <th style={{ width: "15%", borderBottom: "2px solid #E2E8F0" }}>Follow-Up & Notes</th>
                    {isStaff && (
                      <th style={{ width: "10%", borderBottom: "2px solid #E2E8F0" }} className="text-end">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {actions.map((act) => (
                    <tr key={act.id} id={`action-row-${act.id}`}>
                      <td className="small text-secondary" style={{ whiteSpace: "nowrap" }}>
                        {formatDateTime(act.actionDateTime)}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark mb-1" style={{ wordBreak: "break-word" }}>
                          {act.actionDescription}
                        </div>
                        <div className="small text-muted" style={{ wordBreak: "break-word" }}>
                          <strong className="text-secondary">Result:</strong> {act.result}
                        </div>
                      </td>
                      <td>
                        <div className="fw-medium text-dark">{act.performedBy.name}</div>
                        <span className="badge bg-light text-secondary border small mt-1">
                          {act.performedBy.role}
                        </span>
                      </td>
                      <td>
                        {act.followUpRequired ? (
                          <div className="mb-1">
                            <span
                              className="badge rounded-pill"
                              style={{
                                backgroundColor: "#FEF3C7",
                                color: "#B45309",
                                border: "1px solid #F59E0B"
                              }}
                            >
                              ⚠️ Follow-Up Req
                            </span>
                            {act.followUpNote && (
                              <div className="small text-muted fst-italic mt-1" style={{ wordBreak: "break-word" }}>
                                "{act.followUpNote}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            className="badge rounded-pill mb-1"
                            style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
                          >
                            No Follow-up
                          </span>
                        )}
                        {act.attachmentNotes && (
                          <div className="small text-muted mt-1" style={{ wordBreak: "break-word" }}>
                            📎 {act.attachmentNotes}
                          </div>
                        )}
                      </td>
                      {isStaff && (
                        <td className="text-end">
                          <button
                            type="button"
                            id={`btnEditAction-${act.id}`}
                            className="btn btn-sm btn-outline-secondary fw-medium px-2 py-1"
                            style={{ borderRadius: "6px" }}
                            onClick={() => handleOpenEditModal(act)}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. Mobile Stacked Cards View (Hidden on screens >= 768px) */}
            <div
              className="d-block d-md-none"
              id="actionsListMobile"
              style={{ maxWidth: "100%", overflowX: "hidden" }}
            >
              <div className="d-flex flex-column gap-3">
                {actions.map((act) => (
                  <div
                    key={act.id}
                    className="card border shadow-sm p-3"
                    id={`action-card-mobile-${act.id}`}
                    style={{
                      borderRadius: "10px",
                      borderColor: "#E2E8F0",
                      backgroundColor: "#FFFFFF",
                      wordBreak: "break-word"
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
                      <span className="small text-muted fw-medium">{formatDateTime(act.actionDateTime)}</span>
                      {act.followUpRequired ? (
                        <span
                          className="badge rounded-pill"
                          style={{
                            backgroundColor: "#FEF3C7",
                            color: "#B45309",
                            border: "1px solid #F59E0B"
                          }}
                        >
                          ⚠️ Follow-Up Req
                        </span>
                      ) : (
                        <span
                          className="badge rounded-pill"
                          style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
                        >
                          No Follow-up
                        </span>
                      )}
                    </div>

                    <div className="fw-semibold text-dark mb-1">{act.actionDescription}</div>
                    <div className="small text-muted mb-2">
                      <strong className="text-secondary">Result:</strong> {act.result}
                    </div>

                    {act.followUpRequired && act.followUpNote && (
                      <div
                        className="p-2 mb-2 rounded small"
                        style={{ backgroundColor: "#FFFBEB", border: "1px solid #FEF3C7" }}
                      >
                        <strong>Follow-up Note:</strong> {act.followUpNote}
                      </div>
                    )}

                    {act.attachmentNotes && (
                      <div className="small text-muted mb-2">
                        📎 Ref: <em>{act.attachmentNotes}</em>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="small text-secondary">
                        By: <strong>{act.performedBy.name}</strong> ({act.performedBy.role})
                      </span>
                      {isStaff && (
                        <button
                          type="button"
                          id={`btnEditActionMobile-${act.id}`}
                          className="btn btn-sm btn-outline-secondary px-3 py-1"
                          style={{ borderRadius: "6px" }}
                          onClick={() => handleOpenEditModal(act)}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <ActionTakenModal
          show={showModal}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          ticketId={ticketId}
          currentUser={currentUser}
          editingAction={editingAction}
        />
      )}
    </div>
  );
}
