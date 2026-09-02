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
      
      // Remove attachment from UI
      setTicket((prev: any) => ({
        ...prev,
        attachments: prev.attachments.filter((a: any) => a.id !== attachmentId)
      }));
    } catch (err: any) {
      alert(err.message || "Failed to delete attachment");
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
                    <a 
                      href={`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/v1/tickets/${id}/attachments/${file.id}/download?requesterId=${requesterId}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary text-decoration-none"
                    >
                      {file.filename} <small>({Math.round(file.size / 1024)} KB)</small>
                    </a>
                  </div>
                  <button 
                    className="btn btn-sm btn-outline-danger" 
                    title="Delete Attachment"
                    onClick={() => handleDeleteAttachment(file.id, file.filename)}
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted fst-italic">No active attachments.</p>
          )}
        </div>
      </div>
    </div>
  );
}
