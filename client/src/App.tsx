import { useState, useEffect } from "react";
import CreateTicket from "./pages/CreateTicket.js";
import RequesterSelector from "./pages/RequesterSelector.js";

export default function App() {
  const [requesterName, setRequesterName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("requesterId");
    const name = localStorage.getItem("requesterName");
    if (id && name) {
      setRequesterName(name);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (id: string, name: string) => {
    localStorage.setItem("requesterId", id);
    localStorage.setItem("requesterName", name);
    setRequesterName(name);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("requesterId");
    localStorage.removeItem("requesterName");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <RequesterSelector onLogin={handleLogin} />;
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm" style={{ backgroundColor: "#006B3C" }}>
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">TokTickIT</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <a className="nav-link" href="#">My Tickets</a>
              </li>
              <li className="nav-item">
                <a className="nav-link active" href="#">Create Ticket</a>
              </li>
            </ul>
            <span className="navbar-text text-white bg-success px-3 rounded-pill me-2">
              👤 Profile: {requesterName}
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Switch User</button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        <CreateTicket />
      </div>
    </div>
  );
}
