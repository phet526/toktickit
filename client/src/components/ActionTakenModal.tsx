import React, { useState, useEffect } from "react";
import {
  User,
  ActionTaken,
  createActionTaken,
  updateActionTaken
} from "../api";

export interface ActionTakenModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: number;
  currentUser: User;
  editingAction?: ActionTaken | null;
}

export interface ActionFormState {
  actionDateTime: string;
  actionDescription: string;
  result: string;
  followUpRequired: boolean;
  followUpNote: string;
  attachmentNotes: string;
}

export interface ActionFormErrors {
  actionDescription?: string;
  result?: string;
  followUpNote?: string;
  attachmentNotes?: string;
  general?: string;
}

function getLocalDateTimeString(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ActionTakenModal({
  show,
  onClose,
  onSuccess,
  ticketId,
  currentUser,
  editingAction
}: ActionTakenModalProps) {
  const [form, setForm] = useState<ActionFormState>({
    actionDateTime: getLocalDateTimeString(),
    actionDescription: "",
    result: "",
    followUpRequired: false,
    followUpNote: "",
    attachmentNotes: ""
  });

  const [errors, setErrors] = useState<ActionFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (editingAction) {
      setForm({
        actionDateTime: getLocalDateTimeString(editingAction.actionDateTime),
        actionDescription: editingAction.actionDescription || "",
        result: editingAction.result || "",
        followUpRequired: Boolean(editingAction.followUpRequired),
        followUpNote: editingAction.followUpNote || "",
        attachmentNotes: editingAction.attachmentNotes || ""
      });
    } else {
      setForm({
        actionDateTime: getLocalDateTimeString(),
        actionDescription: "",
        result: "",
        followUpRequired: false,
        followUpNote: "",
        attachmentNotes: ""
      });
    }
    setErrors({});
    setServerError(null);
  }, [editingAction, show]);

  if (!show) return null;

  const validateForm = (): boolean => {
    const newErrors: ActionFormErrors = {};

    if (!form.actionDescription.trim()) {
      newErrors.actionDescription = "Action description is required.";
    } else if (form.actionDescription.length > 2000) {
      newErrors.actionDescription = "Action description must not exceed 2,000 characters.";
    }

    if (!form.result.trim()) {
      newErrors.result = "Result is required.";
    } else if (form.result.length > 2000) {
      newErrors.result = "Result must not exceed 2,000 characters.";
    }

    // BR-06, AC-03: Conditional Validation for followUpNote
    if (form.followUpRequired) {
      if (!form.followUpNote.trim()) {
        newErrors.followUpNote = "Follow-up note is required when follow-up is marked as needed.";
      } else if (form.followUpNote.length > 1000) {
        newErrors.followUpNote = "Follow-up note must not exceed 1,000 characters.";
      }
    }

    if (form.attachmentNotes && form.attachmentNotes.length > 500) {
      newErrors.attachmentNotes = "Attachment notes must not exceed 500 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAction) {
        // Edit Mode
        await updateActionTaken(ticketId, editingAction.id, {
          actionDateTime: form.actionDateTime ? new Date(form.actionDateTime).toISOString() : undefined,
          actionDescription: form.actionDescription.trim(),
          result: form.result.trim(),
          followUpRequired: form.followUpRequired,
          followUpNote: form.followUpRequired ? form.followUpNote.trim() : null,
          attachmentNotes: form.attachmentNotes.trim() || null,
          updatedAt: editingAction.updatedAt
        });
      } else {
        // Create Mode
        await createActionTaken(ticketId, {
          actionDateTime: form.actionDateTime ? new Date(form.actionDateTime).toISOString() : undefined,
          actionDescription: form.actionDescription.trim(),
          result: form.result.trim(),
          followUpRequired: form.followUpRequired,
          followUpNote: form.followUpRequired ? form.followUpNote.trim() : null,
          attachmentNotes: form.attachmentNotes.trim() || null
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.status === 409 || err.code === "STALE_RECORD_CONFLICT") {
        setServerError(
          "⚠️ Action Taken record has been modified by another user. Please refresh and review the latest changes."
        );
      } else {
        setServerError(err.message || "An error occurred while saving the Action Taken.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const performerDisplay = editingAction
    ? `${editingAction.performedBy.name} (${editingAction.performedBy.email})`
    : `${currentUser.name} (${currentUser.email})`;

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content shadow border-0" style={{ borderRadius: "12px", overflow: "hidden" }}>
          {/* Header */}
          <div
            className="modal-header text-white py-3 px-4"
            style={{ backgroundColor: "#006B3C" }}
          >
            <h5 className="modal-title fw-bold" id="actionTakenModalTitle">
              {editingAction ? "✏️ Edit Action Taken" : "➕ Add Action Taken"}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Close"
              id="btnCloseActionModal"
              onClick={onClose}
              disabled={isSubmitting}
            />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body p-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              {/* Server Error Alert */}
              {serverError && (
                <div
                  className="alert alert-danger d-flex align-items-center mb-3"
                  role="alert"
                  id="actionTakenServerError"
                  style={{ borderRadius: "8px" }}
                >
                  <div>{serverError}</div>
                </div>
              )}

              {/* Performed By (Read-only session binding BR-05) */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary mb-1">
                  Performed By <span className="text-muted">(Auto-bound from Session)</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted border-end-0">👤</span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0 text-muted"
                    value={performerDisplay}
                    readOnly
                    disabled
                    aria-label="Performed By"
                  />
                </div>
                <div className="form-text small">
                  Audit trail identity cannot be altered manually.
                </div>
              </div>

              {/* Action Date & Time */}
              <div className="mb-3">
                <label htmlFor="actionDateTimeInput" className="form-label small fw-semibold text-secondary mb-1">
                  Action Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="actionDateTimeInput"
                  className="form-control"
                  value={form.actionDateTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, actionDateTime: e.target.value }))}
                  disabled={isSubmitting}
                  style={{ borderColor: "#E2E8F0" }}
                />
              </div>

              {/* Action Description */}
              <div className="mb-3">
                <label htmlFor="actionDescriptionInput" className="form-label small fw-semibold text-dark mb-1">
                  Action Description <span className="text-danger">*</span>
                </label>
                <textarea
                  id="actionDescriptionInput"
                  rows={3}
                  className={`form-control ${errors.actionDescription ? "is-invalid" : ""}`}
                  placeholder="Describe the action taken to diagnose or resolve the issue..."
                  value={form.actionDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, actionDescription: e.target.value }))}
                  disabled={isSubmitting}
                  maxLength={2000}
                  style={{ borderColor: errors.actionDescription ? undefined : "#E2E8F0" }}
                />
                <div className="d-flex justify-content-between mt-1">
                  {errors.actionDescription ? (
                    <div className="invalid-feedback d-block text-danger small fw-semibold">
                      {errors.actionDescription}
                    </div>
                  ) : <span />}
                  <span className="small text-muted">{form.actionDescription.length} / 2,000</span>
                </div>
              </div>

              {/* Result */}
              <div className="mb-3">
                <label htmlFor="resultInput" className="form-label small fw-semibold text-dark mb-1">
                  Result <span className="text-danger">*</span>
                </label>
                <textarea
                  id="resultInput"
                  rows={3}
                  className={`form-control ${errors.result ? "is-invalid" : ""}`}
                  placeholder="Describe the outcome, finding, or technical resolution..."
                  value={form.result}
                  onChange={(e) => setForm((prev) => ({ ...prev, result: e.target.value }))}
                  disabled={isSubmitting}
                  maxLength={2000}
                  style={{ borderColor: errors.result ? undefined : "#E2E8F0" }}
                />
                <div className="d-flex justify-content-between mt-1">
                  {errors.result ? (
                    <div className="invalid-feedback d-block text-danger small fw-semibold">
                      {errors.result}
                    </div>
                  ) : <span />}
                  <span className="small text-muted">{form.result.length} / 2,000</span>
                </div>
              </div>

              {/* Follow-Up Required Switch */}
              <div className="form-check form-switch mb-3 p-3 rounded" style={{ backgroundColor: "#F4FBF7", border: "1px solid #E2E8F0" }}>
                <input
                  className="form-check-input ms-0 me-2"
                  type="checkbox"
                  role="switch"
                  id="followUpRequiredCheck"
                  checked={form.followUpRequired}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((prev) => ({
                      ...prev,
                      followUpRequired: checked,
                      followUpNote: checked ? prev.followUpNote : ""
                    }));
                    if (!checked) {
                      setErrors((prev) => ({ ...prev, followUpNote: undefined }));
                    }
                  }}
                  disabled={isSubmitting}
                  style={{ cursor: "pointer", accentColor: "#006B3C" }}
                />
                <label
                  className="form-check-label fw-bold text-dark"
                  htmlFor="followUpRequiredCheck"
                  style={{ cursor: "pointer" }}
                >
                  Follow-Up Required?
                </label>
                <div className="form-text small mt-1">
                  Toggle on if subsequent monitoring, replacements, or user follow-up are needed.
                </div>
              </div>

              {/* Conditional Follow-up Note Textarea */}
              {form.followUpRequired && (
                <div
                  className="mb-3 p-3 rounded"
                  style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
                >
                  <label htmlFor="followUpNoteInput" className="form-label small fw-bold text-dark mb-1">
                    Follow-up Note <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="followUpNoteInput"
                    rows={3}
                    className={`form-control ${errors.followUpNote ? "is-invalid" : ""}`}
                    placeholder="e.g., Check back with requester on Monday to verify stable connection..."
                    value={form.followUpNote}
                    onChange={(e) => setForm((prev) => ({ ...prev, followUpNote: e.target.value }))}
                    disabled={isSubmitting}
                    maxLength={1000}
                    style={{ borderColor: errors.followUpNote ? undefined : "#F59E0B" }}
                  />
                  <div className="d-flex justify-content-between mt-1">
                    {errors.followUpNote ? (
                      <div className="invalid-feedback d-block text-danger small fw-semibold" id="followUpNoteError">
                        {errors.followUpNote}
                      </div>
                    ) : <span />}
                    <span className="small text-muted">{form.followUpNote.length} / 1,000</span>
                  </div>
                </div>
              )}

              {/* Attachment Notes */}
              <div className="mb-2">
                <label htmlFor="attachmentNotesInput" className="form-label small fw-semibold text-secondary mb-1">
                  Attachment Notes <span className="text-muted">(Optional filename reference)</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted border-end-0">📎</span>
                  <input
                    type="text"
                    id="attachmentNotesInput"
                    className={`form-control border-start-0 ${errors.attachmentNotes ? "is-invalid" : ""}`}
                    placeholder="e.g., vpn-gateway-log.png"
                    value={form.attachmentNotes}
                    onChange={(e) => setForm((prev) => ({ ...prev, attachmentNotes: e.target.value }))}
                    disabled={isSubmitting}
                    maxLength={500}
                  />
                </div>
                <div className="d-flex justify-content-between mt-1">
                  {errors.attachmentNotes ? (
                    <div className="invalid-feedback d-block text-danger small">
                      {errors.attachmentNotes}
                    </div>
                  ) : <span />}
                  <span className="small text-muted">{form.attachmentNotes.length} / 500</span>
                </div>
              </div>
            </div>

            {/* Modal Footer with Double-submit Protection */}
            <div className="modal-footer border-top bg-light py-2 px-4 d-flex justify-content-end gap-2">
              <button
                type="button"
                id="btnCancelAction"
                className="btn btn-outline-secondary fw-semibold"
                onClick={onClose}
                disabled={isSubmitting}
                style={{ borderRadius: "8px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btnSaveAction"
                className="btn text-white fw-semibold d-flex align-items-center gap-2"
                style={{ backgroundColor: "#006B3C", borderColor: "#006B3C", borderRadius: "8px" }}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                )}
                {isSubmitting
                  ? "Saving..."
                  : editingAction
                  ? "Update Action"
                  : "Save Action"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
