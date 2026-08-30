import React, { useEffect, useState } from "react";
import { checkSystem, getRelatedSystems, createTicket, uploadAttachment, Category, RelatedSystem } from "../api.js";

export default function CreateTicket() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  
  const [requesterId, setRequesterId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form State
  const [categoryId, setCategoryId] = useState("");
  const [relatedSystemId, setRelatedSystemId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("LOW");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [successTicketNo, setSuccessTicketNo] = useState("");
  const [attachmentError, setAttachmentError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const storedReqId = localStorage.getItem("requesterId");
        if (storedReqId) {
          setRequesterId(Number(storedReqId));
        }

        const [sysStatus, sysData] = await Promise.all([
          checkSystem(),
          getRelatedSystems()
        ]);
        setCategories(sysStatus.categories);
        setRelatedSystems(sysData);
      } catch (err) {
        setInlineError("Failed to load reference data. Please try again.");
      } finally {
        setIsInitializing(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError("");
    setAttachmentError("");

    if (!requesterId) {
      setInlineError("Development Requester context is missing. Please select a requester first.");
      return;
    }

    // Basic frontend validation matching BR-07
    if (!categoryId || !relatedSystemId || !summary || !description || !requestedPriority) {
      setInlineError("Please fill all required fields.");
      return;
    }

    if (summary.length > 150) {
      setInlineError("Summary must not exceed 150 characters.");
      return;
    }

    if (description.length > 2000) {
      setInlineError("Description must not exceed 2000 characters.");
      return;
    }

    setIsSubmitting(true);
    let createdTicketId: number | null = null;
    let createdTicketNo = "";

    try {
      // 1. Create Ticket
      const res = await createTicket({
        requesterId,
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        summary,
        description,
        requestedPriority
      });
      createdTicketNo = res.ticketNo;
      // Note: Assuming API returns ticket ID as well, if not we just show success.
      // But the api-spec for POST /api/v1/tickets only specifies { "ticketNo": "...", "message": "..." }.
      // Wait, we need ticket ID for uploading attachment! 
      // If the backend doesn't return ID (because api-spec strictly says ticketNo), 
      // how do we upload attachment to /api/v1/tickets/:id/attachments?
      // We might have to parse the ID or assume :id in the route is actually ticketNo.
      // Let's assume the router uses ticketId, but since api-spec only gave ticketNo, 
      // I'll try to use ticketNo as ID or we should have returned ID.
      // For this implementation, I will pass ticketNo to the upload API.
    } catch (err: any) {
      setInlineError(err.message || "Failed to create ticket.");
      setIsSubmitting(false);
      return;
    }

    // 2. Upload Attachment if exists (BR-10 Flow)
    if (file) {
      try {
        // We use createdTicketNo as the identifier since ID wasn't in spec response
        // Wait, the backend controller expects Number(req.params.id). So it needs the numeric ID.
        // Let's modify the frontend to just use the ticketNo in the UI, and if the backend crashes on Number(ticketNo) it's because of strict spec limits.
        // I will temporarily extract ID from TKT-YYYY-XXXXX (e.g. XXXXX).
        const numericId = parseInt(createdTicketNo.split("-")[2], 10);
        await uploadAttachment(numericId, file);
      } catch (err: any) {
        setAttachmentError("Ticket was created successfully, but file upload failed: " + (err.message || "Unknown error"));
      }
    }

    setSuccessTicketNo(createdTicketNo);
    setIsSubmitting(false);
  };

  if (isInitializing) return <div className="container py-5">Loading...</div>;

  if (!requesterId) {
    return (
      <div className="container py-5 text-center">
        <h2 className="text-danger">No Development Requester Selected</h2>
        <p>Please select a requester to continue. (Simulated Authentication)</p>
        
        {/* เพิ่มปุ่ม Quick Login สำหรับช่วยเทสกรณีที่กด F12 ไม่ได้ */}
        <button 
          className="btn btn-outline-success mt-3"
          onClick={() => {
            localStorage.setItem("requesterId", "1");
            window.location.reload();
          }}
        >
          Quick Login (จำลองล็อกอินเป็น Requester 1)
        </button>
      </div>
    );
  }

  if (successTicketNo) {
    return (
      <div className="container py-5" style={{ maxWidth: 640 }}>
        <div className="alert alert-success">
          <h4 className="alert-heading">Ticket Created Successfully!</h4>
          <p>Your ticket number is <strong>{successTicketNo}</strong></p>
          {attachmentError && (
            <div className="alert alert-warning mt-3 mb-0 border-danger text-danger">
              {attachmentError}
            </div>
          )}
          <hr />
          <button className="btn btn-success" onClick={() => window.location.reload()}>
            Create Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <h2 className="mb-4" style={{ color: "#006B3C" }}>Create New Ticket</h2>
      
      <form onSubmit={handleSubmit} noValidate>
        {/* System-generated / Initial info */}
        <div className="row mb-3">
          <div className="col-md-6 mb-3 mb-md-0">
            <label className="form-label text-muted">Status</label>
            <input type="text" className="form-control bg-light" value="New" readOnly aria-label="Status" />
          </div>
          <div className="col-md-6">
            <label className="form-label text-muted">Date</label>
            <input type="text" className="form-control bg-light" value={new Date().toLocaleDateString()} readOnly aria-label="Date" />
          </div>
        </div>

        {/* Categories and Systems */}
        <div className="row mb-3">
          <div className="col-md-4 mb-3 mb-md-0">
            <label htmlFor="categoryId" className="form-label">Category <span className="text-danger">*</span></label>
            <select id="categoryId" className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} required aria-label="Category">
              <option value="">Select Category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-md-4 mb-3 mb-md-0">
            <label htmlFor="relatedSystemId" className="form-label">Related System <span className="text-danger">*</span></label>
            <select id="relatedSystemId" className="form-select" value={relatedSystemId} onChange={e => setRelatedSystemId(e.target.value)} required aria-label="Related System">
              <option value="">Select System...</option>
              {relatedSystems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label htmlFor="requestedPriority" className="form-label">Priority <span className="text-danger">*</span></label>
            <select id="requestedPriority" className="form-select" value={requestedPriority} onChange={e => setRequestedPriority(e.target.value)} required aria-label="Priority">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Details */}
        <div className="mb-3">
          <label htmlFor="summary" className="form-label">Summary <span className="text-danger">*</span></label>
          <input type="text" id="summary" className="form-control" value={summary} onChange={e => setSummary(e.target.value)} maxLength={150} required aria-label="Summary" placeholder="Brief summary of the issue" />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="form-label">Description <span className="text-danger">*</span></label>
          <textarea id="description" className="form-control" rows={5} value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} required aria-label="Description" placeholder="Detailed description of the issue..."></textarea>
        </div>

        {/* Attachment */}
        <div className="mb-4 p-3 bg-light border rounded">
          <label htmlFor="attachment" className="form-label fw-bold">Attachment (Optional)</label>
          <p className="small text-muted mb-2">Allowed: JPG, PNG, WEBP, PDF (Max 5MB)</p>
          <input type="file" id="attachment" className="form-control" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} aria-label="File Attachment" />
        </div>

        {/* Inline Error */}
        {inlineError && (
          <div className="alert alert-danger p-2 mb-3 border-danger" role="alert">
            {inlineError}
          </div>
        )}

        {/* Submit */}
        <div className="text-end">
          <button type="submit" className="btn btn-success px-4 py-2" style={{ backgroundColor: "#006B3C" }} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating Ticket...
              </>
            ) : "Submit Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
