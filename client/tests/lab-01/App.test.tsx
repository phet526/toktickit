/*import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/App.js";

describe("App", () => {
  // WORKED EXAMPLE — provided for you.
  it("renders the TokTickIT heading", () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  // Issue 4 — write these yourself. Hint: mock the api module with
  // vi.spyOn(api, "checkSystem").mockResolvedValue(...) / .mockRejectedValue(...)
  // then click the button and assert the Online list / Offline message.
  it.todo("shows Online and the seeded categories on success");
  it.todo("shows an Offline error message when the API is unavailable");
});*/
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js"; // นำเข้า api มาเพื่อจำลองการทำงาน

describe("App", () => {
  // WORKED EXAMPLE — provided for you.
  it("renders the TokTickIT heading", () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  // Issue 4 — shows Online and the seeded categories on success
  it("shows Online and the seeded categories on success", async () => {
    // 1. จำลองข้อมูล (Mock) ว่า API ส่งกลับมาสำเร็จ
    const mockData = {
      status: "ok",
      categories: [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" }
      ]
    };
    const spy = vi.spyOn(api, "checkSystem").mockResolvedValue(mockData as any);

    render(<App />);

    // 2. จำลองการกดปุ่ม Check System
    const button = screen.getByRole("button", { name: /Check System/i });
    fireEvent.click(button);

    // 3. รอและตรวจสอบผลลัพธ์ว่าหน้าเว็บขึ้นคำว่า Online และโชว์ข้อมูลหมวดหมู่
    await waitFor(() => {
      expect(screen.getByText(/Online/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Account and Access")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();

    // 4. ล้างค่าการจำลอง (คืนค่าเดิมให้ระบบ)
    spy.mockRestore();
  });

  // Issue 4 — shows an Offline error message when the API is unavailable
  it("shows an Offline error message when the API is unavailable", async () => {
    // 1. จำลองข้อมูล (Mock) ว่าเซิร์ฟเวอร์ล่ม (ดึงข้อมูลไม่สำเร็จ)
    const spy = vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("Backend unavailable"));

    render(<App />);

    // 2. จำลองการกดปุ่ม Check System
    const button = screen.getByRole("button", { name: /Check System/i });
    fireEvent.click(button);

    // 3. รอและตรวจสอบผลลัพธ์ว่าหน้าเว็บขึ้นคำว่า Offline และโชว์ข้อความ Error
    await waitFor(() => {
      expect(screen.getByText(/Offline/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Unable to connect to TokTickIT API/i)).toBeInTheDocument();

    // 4. ล้างค่าการจำลอง
    spy.mockRestore();
  });
});
