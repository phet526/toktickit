import { useState } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  void categories;
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCheck() {
    // TODO(Issue 4): set loading, call checkSystem(), then either
    //   - success: store categories and show Online + the list, or
    //   - error: show Offline + a useful message.
    setState("loading");
    setErrorMessage("");

    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      const data = await response.json();
      if (data.status === 'ok') {
        setState("success");
      } else {
        throw new Error("Invalid status from server");
      }
    } catch (error) {
      setState("error");
      setErrorMessage("Unable to connect to TokTickIT API");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {/* TODO(Issue 4): render loading / success (Online + categories) / error (Offline) states. */}
      {state === "success" && (
        <div className="mt-4">
          <p>System Status: <span className="text-success fw-bold">Online</span></p>
        </div>
      )}

      {state === "error" && (
        <div className="mt-4">
          <p>System Status: <span className="text-danger fw-bold">Offline</span></p>
          <p className="text-danger">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
