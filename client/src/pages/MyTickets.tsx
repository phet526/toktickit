import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTickets, checkSystem, getRelatedSystems, Category, RelatedSystem } from "../api";

export default function MyTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<RelatedSystem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [system, setSystem] = useState("");
  const [sort, setSort] = useState("createdAt:desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch filter options on mount
    Promise.all([checkSystem(), getRelatedSystems()])
      .then(([sysRes, sysList]) => {
        setCategories(sysRes.categories);
        setSystems(sysList);
      })
      .catch(console.error);
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const requesterId = Number(localStorage.getItem("requesterId"));
      const res = await getTickets({ 
        requesterId, 
        search, 
        status, 
        category, 
        system,
        sort, 
        page, 
        limit: 10 
      });
      setTickets(res.data);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, status, category, system, sort]); // Re-fetch on filter changes

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    fetchTickets();
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white py-3">
        <h4 className="mb-0" style={{ color: "#006B3C" }}>My Tickets</h4>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSearchSubmit} className="row g-2 mb-4">
          <div className="col-md-12 d-flex gap-2 mb-2">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Ticket No or Summary..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 2 }}
            />
            <button type="submit" className="btn btn-success px-4" style={{ backgroundColor: "#006B3C" }}>
              <i className="bi bi-search"></i> Search
            </button>
            <Link to="/create-ticket" className="btn btn-outline-success">
              + Create Ticket
            </Link>
          </div>
          
          <div className="col-md-12 d-flex gap-2">
            <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select className="form-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select className="form-select" value={system} onChange={(e) => { setSystem(e.target.value); setPage(1); }}>
              <option value="">All Systems</option>
              {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select className="form-select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
            </select>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-5">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="alert alert-info">No tickets found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Ticket No</th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>System</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>{ticket.ticketNo}</td>
                    <td>{ticket.summary}</td>
                    <td>{ticket.category?.name}</td>
                    <td>{ticket.relatedSystem?.name}</td>
                    <td>
                      <span className={`badge bg-${ticket.currentStatus === 'New' ? 'primary' : 'secondary'}`}>
                        {ticket.currentStatus}
                      </span>
                    </td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} className="btn btn-sm btn-outline-success">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <nav className="mt-4">
            <ul className="pagination justify-content-end">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>&laquo; Previous</button>
              </li>
              <li className="page-item disabled">
                <span className="page-link">Page {page} of {totalPages}</span>
              </li>
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next &raquo;</button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
