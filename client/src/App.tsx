import { useState, useEffect } from "react";
import CreateTicket from "./pages/CreateTicket.js";

export default function App() {
  const [requesterName, setRequesterName] = useState("Development Requester 1");

  useEffect(() => {
    // กำหนดชื่อจำลองให้ตรงกับที่มีใน Local Storage
    const id = localStorage.getItem("requesterId");
    if (!id) {
      setRequesterName("No Context (Please Login)");
    }
  }, []);

  return (
    <div>
      {/* Navigation Bar (อ้างอิง Labsheet ข้อ 8) */}
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
            <span className="navbar-text text-white bg-success px-3 rounded-pill">
              👤 Profile: {requesterName}
            </span>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* เลิกใช้ปุ่ม Check System แบบเก่า และแสดง CreateTicket เป็นหลักแทน */}
        <CreateTicket />
      </div>
    </div>
  );
}
