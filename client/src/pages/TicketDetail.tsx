import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getTicketById, deleteAttachment } from "../api.js";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requesterId = Number(localStorage.getItem("requesterId"));

  useEffect(() => {
    async function fetchTicket() {
      try {
        setLoading(true);
        const data = await getTicketById(Number(id), requesterId);
        setTicket(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch ticket");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTicket();
  }, [id]);

  const handleDeleteAttachment = async (attachmentId: number, filename: string) => {
    const reason = window.prompt(`Please enter the reason for deleting "${filename}":`);
    
    if (reason === null) {
      // User cancelled
      return;
    }
    
    if (reason.trim() === "") {
      alert("Reason is required to delete an attachment.");
      return;
    }

    try {
      const requesterId = Number(localStorage.getItem("requesterId"));
      await deleteAttachment(Number(id), attachmentId, requesterId, reason);
      
      // Update attachment state instead of removing
      setTicket((prev: any) => ({
        ...prev,
        attachments: prev.attachments.map((a: any) => 
          a.id === attachmentId ? { ...a, deletedAt: new Date().toISOString(), deletedReason: reason } : a
        )
      }));
    } catch (err: any) {
      alert(err.message || "Failed to delete attachment");
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Validation
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
      
      const requesterId = localStorage.getItem("requesterId");
      const url = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/v1/tickets/${id}/attachments?requesterId=${requesterId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      
      // Refresh ticket details to get new attachment
      const data = await getTicketById(Number(id), Number(requesterId));
      setTicket(data);
    } catch (err: any) {
      alert(err.message || "Failed to upload attachment");
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  if (loading) return <div className="text-center py-5">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!ticket) return <div className="alert alert-warning">Ticket not found</div>;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h4 className="mb-0" style={{ color: "#006B3C" }}>Ticket Detail: {ticket.ticketNo}</h4>
        <Link to="/my-tickets" className="btn btn-outline-secondary btn-sm">Back to List</Link>
      </div>
      <div className="card-body">
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label text-muted">Summary</label>
            <p className="fw-bold">{ticket.summary}</p>
          </div>
          <div className="col-md-3">
            <label className="form-label text-muted">Status</label>
            <p><span className="badge bg-primary">{ticket.currentStatus}</span></p>
          </div>
          <div className="col-md-3">
            <label className="form-label text-muted">Priority</label>
            <p>{ticket.requestedPriority}</p>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label text-muted">Category</label>
            <p>{ticket.category?.name}</p>
          </div>
          <div className="col-md-6">
            <label className="form-label text-muted">Related System</label>
            <p>{ticket.relatedSystem?.name}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label text-muted">Description</label>
          <div className="p-3 bg-light rounded" style={{ whiteSpace: "pre-wrap" }}>
            {ticket.description}
          </div>
        </div>

        <div>
          <label className="form-label text-muted">Attachments</label>
          {ticket.attachments && ticket.attachments.length > 0 ? (
            <ul className="list-group">
              {ticket.attachments.map((file: any) => (
                <li key={file.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <i className="bi bi-paperclip me-2"></i>
                    {file.deletedAt ? (
                      <span className="text-muted text-decoration-line-through">
                        {file.filename} <small>({Math.round(file.size / 1024)} KB)</small>
                      </span>
                    ) : (
                      <a 
                        href={`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/v1/tickets/${id}/attachments/${file.id}/download?requesterId=${requesterId}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary text-decoration-none"
                      >
                        {file.filename} <small>({Math.round(file.size / 1024)} KB)</small>
                      </a>
                    )}
                    {file.deletedAt && <span className="badge bg-secondary ms-2" title={`Deleted Reason: ${file.deletedReason}`}>Deleted</span>}
                  </div>
                  {!file.deletedAt && (
                    <button 
                      className="btn btn-sm btn-outline-danger" 
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
            <p className="text-muted fst-italic">No attachments.</p>
          )}
          
          <div className="mt-3">
            <label className="btn btn-sm btn-outline-primary" style={{ borderColor: "#006B3C", color: "#006B3C" }}>
              <i className="bi bi-upload me-1"></i> Add Attachment
              <input 
                type="file" 
                className="d-none" 
                onChange={handleUploadAttachment}
                accept=".jpg,.jpeg,.png,.webp,.pdf"
              />
            </label>
            <div className="form-text small">Max 5MB (JPG, PNG, WEBP, PDF)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
