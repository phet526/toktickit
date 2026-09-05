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
  const [files, setFiles] = useState<File[]>([]);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successTicketNo, setSuccessTicketNo] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [fileError, setFileError] = useState("");

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
        setErrors({ general: "Failed to load reference data. Please try again." });
      } finally {
        setIsInitializing(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAttachmentError("");

    if (!requesterId) {
      setErrors({ general: "Development Requester context is missing. Please select a requester first." });
      return;
    }

    // Inline Validation (Labsheet 8.3 & 7)
    const newErrors: Record<string, string> = {};
    if (!categoryId) newErrors.categoryId = "Please select a category.";
    if (!relatedSystemId) newErrors.relatedSystemId = "Please select a related system.";
    if (!summary) newErrors.summary = "Please fill this field.";
    if (!description) newErrors.description = "Please fill this field.";
    if (summary && summary.length > 150) newErrors.summary = "Summary must not exceed 150 characters.";
    if (description && description.length > 2000) newErrors.description = "Description must not exceed 2000 characters.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    let createdTicketNo = "";
    let createdTicketId = 0;

    try {
      const res = await createTicket({
        requesterId,
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        summary,
        description,
        requestedPriority
      });
      createdTicketNo = res.ticketNo;
      createdTicketId = res.id;
    } catch (err: any) {
      setErrors({ general: err.message || "Failed to create ticket." });
      setIsSubmitting(false);
      return;
    }

    if (files.length > 0) {
      try {
        const uploadPromises = files.map(f => uploadAttachment(createdTicketId, f, requesterId));
        await Promise.all(uploadPromises);
      } catch (err: any) {
        setAttachmentError("Ticket was created successfully, but file upload failed: " + (err.message || "Unknown error"));
      }
    }

    setSuccessTicketNo(createdTicketNo);
    setIsSubmitting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 5) {
        setFileError("You can only select up to 5 files.");
        e.target.value = ""; // Clear the input
        setFiles([]);
        return;
      }
      
      const oversizeFile = selectedFiles.find(file => file.size > 5 * 1024 * 1024);
      if (oversizeFile) {
        setFileError("File size exceeds 5MB limit");
        e.target.value = ""; // Clear the input
        setFiles([]);
        return;
      }

      setFiles(selectedFiles);
    } else {
      setFiles([]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      // Optional: If newFiles is empty, you might want to clear the file input value
      // but since React handles the input element separately, it's mostly fine for display
      return newFiles;
    });
  };

  if (isInitializing) return <div className="container py-5">Loading...</div>;

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
    <div className="container pb-5" style={{ maxWidth: 800 }}>
      <h2 className="mb-4" style={{ color: "#006B3C" }}>Create New Ticket</h2>
      
      {errors.general && (
        <div className="alert alert-danger p-2 mb-4 border-danger" role="alert">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
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

        <div className="row mb-3">
          <div className="col-md-4 mb-3 mb-md-0">
            <label htmlFor="categoryId" className="form-label">Category <span className="text-danger">*</span></label>
            <select id="categoryId" className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`} value={categoryId} onChange={e => setCategoryId(e.target.value)} aria-label="Category">
              <option value="">Select Category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <div className="text-danger small mt-1">{errors.categoryId}</div>}
          </div>
          <div className="col-md-4 mb-3 mb-md-0">
            <label htmlFor="relatedSystemId" className="form-label">Related System <span className="text-danger">*</span></label>
            <select id="relatedSystemId" className={`form-select ${errors.relatedSystemId ? 'is-invalid' : ''}`} value={relatedSystemId} onChange={e => setRelatedSystemId(e.target.value)} aria-label="Related System">
              <option value="">Select System...</option>
              {relatedSystems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.relatedSystemId && <div className="text-danger small mt-1">{errors.relatedSystemId}</div>}
          </div>
          <div className="col-md-4">
            <label htmlFor="requestedPriority" className="form-label">Priority <span className="text-danger">*</span></label>
            <select id="requestedPriority" className="form-select" value={requestedPriority} onChange={e => setRequestedPriority(e.target.value)} aria-label="Priority">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="summary" className="form-label">Summary <span className="text-danger">*</span></label>
          <input type="text" id="summary" className={`form-control ${errors.summary ? 'is-invalid' : ''}`} value={summary} onChange={e => setSummary(e.target.value)} maxLength={150} aria-label="Summary" placeholder="Brief summary of the issue" />
          {errors.summary && <div className="text-danger small mt-1">{errors.summary}</div>}
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="form-label">Description <span className="text-danger">*</span></label>
          <textarea id="description" className={`form-control ${errors.description ? 'is-invalid' : ''}`} rows={5} value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} aria-label="Description" placeholder="Detailed description of the issue..."></textarea>
          {errors.description && <div className="text-danger small mt-1">{errors.description}</div>}
        </div>

        <div className="mb-4 p-3 bg-light border rounded">
          <label htmlFor="attachment" className="form-label fw-bold">Attachment (Optional)</label>
          <p className="small text-muted mb-2">Allowed: JPG, PNG, WEBP, PDF (Max 5MB per file, Max 5 files)</p>
          <input type="file" id="attachment" className={`form-control ${fileError ? 'is-invalid' : ''}`} multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} aria-label="File Attachment" />
          {fileError && <div className="text-danger small mt-1">{fileError}</div>}
          
          {files.length > 0 && (
            <div className="mt-3">
              <p className="small text-muted mb-2">Selected Files ({files.length}/5):</p>
              <ul className="list-group">
                {files.map((file, index) => (
                  <li key={index} className="list-group-item d-flex justify-content-between align-items-center py-1">
                    <span className="small text-truncate" style={{ maxWidth: '85%' }}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button type="button" className="btn btn-sm btn-outline-danger border-0" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

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
