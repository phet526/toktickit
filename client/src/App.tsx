import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateTicket from "./pages/CreateTicket";
import RequesterSelector from "./pages/RequesterSelector";
import Layout from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import MyTickets from "./pages/MyTickets";
import TicketDetail from "./pages/TicketDetail";

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
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout requesterName={requesterName} onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/my-tickets" replace />} />
            <Route path="my-tickets" element={<MyTickets />} />
            <Route path="create-ticket" element={<CreateTicket />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="*" element={<Navigate to="/my-tickets" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
