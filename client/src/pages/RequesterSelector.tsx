import React, { useEffect, useState } from "react";
import { getRequesters, DevelopmentRequester } from "../api.js";

interface Props {
  onLogin: (id: string, name: string) => void;
}

export default function RequesterSelector({ onLogin }: Props) {
  const [requesters, setRequesters] = useState<DevelopmentRequester[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getRequesters();
        setRequesters(data);
      } catch (err) {
        setError("Failed to load requesters. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleContinue = () => {
    if (!selectedId) return;
    const req = requesters.find(r => r.id.toString() === selectedId);
    if (req) {
      onLogin(req.id.toString(), req.name);
    }
  };

  if (loading) {
    return <div className="container py-5 text-center">Loading...</div>;
  }

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <div className="card shadow-sm border-0">
        <div className="card-header text-white text-center py-3" style={{ backgroundColor: "#006B3C" }}>
          <h4 className="mb-0">TokTickIT</h4>
          <small>IT Service Desk</small>
        </div>
        <div className="card-body p-4 text-center">
          <h5 className="mb-3">Simulated Login</h5>
          <p className="text-muted small mb-4">
            Select a Development Requester to simulate your session context. <br/>
            <strong>This is for testing only and is not a login screen.</strong>
          </p>

          {error && <div className="alert alert-danger">{error}</div>}

          {requesters.length === 0 && !error ? (
            <div className="alert alert-warning">
              No active requesters found. Please run the database seed.
            </div>
          ) : (
            <>
              <select 
                className="form-select form-select-lg mb-4" 
                value={selectedId} 
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">-- Select Requester --</option>
                {requesters.map(r => (
                  <option key={r.id} value={r.id.toString()}>{r.name}</option>
                ))}
              </select>
              <button 
                className="btn btn-success w-100 py-2" 
                disabled={!selectedId}
                onClick={handleContinue}
                style={{ backgroundColor: "#006B3C" }}
              >
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
