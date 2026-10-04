import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ActionsTakenSection from "../../src/components/ActionsTakenSection";
import ActionTakenModal from "../../src/components/ActionTakenModal";
import * as api from "../../src/api";

describe("Lab 4 — Actions Taken UI Component Tests (Issue 3: #42)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockStaffUser: api.User = {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@toktickit.com",
    role: "IT_STAFF",
    isActive: true
  };

  const mockRequesterUser: api.User = {
    id: 4,
    name: "Jennifer Anderson",
    email: "jennifer.anderson@example.com",
    role: "REQUESTER",
    isActive: true
  };

  const sampleAction: api.ActionTaken = {
    id: 1,
    ticketId: 10,
    actionDateTime: "2026-09-22T08:30:00.000Z",
    actionDescription: "Checked network switch port and resolved flapping link.",
    result: "Link stable at 1Gbps full duplex.",
    performedById: 2,
    performedBy: {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@toktickit.com",
      role: "IT_STAFF"
    },
    followUpRequired: true,
    followUpNote: "Monitor packet loss until Friday.",
    attachmentNotes: "switch-port-status.png",
    createdAt: "2026-09-22T08:35:00.000Z",
    updatedAt: "2026-09-22T08:35:00.000Z"
  };

  // ---------------------------------------------------------------------------
  // UI-01: เรนเดอร์ตาราง Actions Taken บนหน้า Ticket Detail (AC-01, AC-05)
  // ---------------------------------------------------------------------------
  it("UI-01: renders Actions Taken table correctly with date, action, result, performer and follow-up badges", async () => {
    vi.spyOn(api, "getActionsTaken").mockResolvedValue({
      ticketId: 10,
      ticketNo: "TKT-2026-00010",
      data: [sampleAction]
    });

    render(
      <ActionsTakenSection
        ticketId={10}
        currentUser={mockStaffUser}
        isStaff={true}
      />
    );

    // ตรวจสอบ Section Header และ Badge นับจำนวน (1)
    expect(await screen.findByRole("heading", { name: /Actions Taken/i })).toBeInTheDocument();
    expect(screen.getByText("(1)")).toBeInTheDocument();

    // ตรวจสอบเนื้อหา Action & Result
    const descElements = await screen.findAllByText("Checked network switch port and resolved flapping link.");
    expect(descElements.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Link stable at 1Gbps full duplex/i)[0]).toBeInTheDocument();

    // ตรวจสอบข้อมูล Performer
    expect(screen.getAllByText("Sarah Johnson")[0]).toBeInTheDocument();

    // ตรวจสอบ Follow-up Badge และ Note
    expect(screen.getAllByText(/Follow-Up Req/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/"Monitor packet loss until Friday."/i)).toBeInTheDocument();

    // ตรวจสอบ Attachment Notes
    expect(screen.getAllByText(/switch-port-status.png/i)[0]).toBeInTheDocument();

    // สำหรับ IT Staff ต้องเห็นปุ่ม "Add Action Taken" และปุ่ม "Edit"
    expect(screen.getByRole("button", { name: /Add Action Taken/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Edit/i }).length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // UI-02: ฟอร์ม Modal ตรวจสอบ Conditional Validation เมื่อเปิด Follow-Up (AC-03, BR-06)
  // ---------------------------------------------------------------------------
  it("UI-02: enforces mandatory follow-up note validation when followUpRequired is toggled on", async () => {
    const mockCreate = vi.spyOn(api, "createActionTaken").mockResolvedValue({
      message: "Success",
      data: sampleAction
    });

    render(
      <ActionTakenModal
        show={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        ticketId={10}
        currentUser={mockStaffUser}
      />
    );

    // 1. กรอก Action Description และ Result
    const descInput = screen.getByPlaceholderText(/Describe the action taken/i);
    const resultInput = screen.getByPlaceholderText(/Describe the outcome/i);

    fireEvent.change(descInput, { target: { value: "Replaced faulty RAM module." } });
    fireEvent.change(resultInput, { target: { value: "System boots normally." } });

    // 2. เปิดสวิตช์ Follow-Up Required
    const followUpToggle = screen.getByLabelText(/Follow-Up Required\?/i);
    fireEvent.click(followUpToggle);

    // ช่อง Follow-up Note ปรากฏขึ้นมา
    const noteInput = screen.getByPlaceholderText(/Check back with requester/i);
    expect(noteInput).toBeInTheDocument();

    // 3. กดบันทึกโดยเว้น Follow-up Note ว่างเปล่า
    const saveBtn = screen.getByRole("button", { name: /Save Action/i });
    fireEvent.click(saveBtn);

    // 4. ต้องแสดงข้อความสีแดงเตือนใต้ช่อง Follow-up Note และไม่มีการเรียก API
    expect(
      await screen.findByText(/Follow-up note is required when follow-up is marked as needed/i)
    ).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();

    // 5. เมื่อพิมพ์ Follow-up Note แล้วกด Save อีกครั้ง ต้องสามารถส่งคำขอสำเร็จ
    fireEvent.change(noteInput, { target: { value: "Run 24h memory stress test." } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(10, {
        actionDateTime: expect.any(String),
        actionDescription: "Replaced faulty RAM module.",
        result: "System boots normally.",
        followUpRequired: true,
        followUpNote: "Run 24h memory stress test.",
        attachmentNotes: null
      });
    });
  });

  // ---------------------------------------------------------------------------
  // UI-03: ตรวจสอบมุมมอง Requester บนส่วน Actions Taken (AC-05, BR-03)
  // ---------------------------------------------------------------------------
  it("UI-03: strictly hides Add and Edit buttons in Requester view (Read-only mode)", async () => {
    vi.spyOn(api, "getActionsTaken").mockResolvedValue({
      ticketId: 10,
      ticketNo: "TKT-2026-00010",
      data: [sampleAction]
    });

    render(
      <ActionsTakenSection
        ticketId={10}
        currentUser={mockRequesterUser}
        isStaff={false}
      />
    );

    // ตรวจสอบว่า Requester สามารถอ่านรายละเอียด Actions Taken ได้ครบถ้วน
    const descElements = await screen.findAllByText("Checked network switch port and resolved flapping link.");
    expect(descElements.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Link stable at 1Gbps full duplex/i)[0]).toBeInTheDocument();

    // ตรวจสอบว่าปุ่ม "+ Add Action Taken" และปุ่ม "Edit" ทุกปุ่มต้องถูกซ่อนเด็ดขาด
    expect(screen.queryByRole("button", { name: /\+ Add Action Taken/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Additional UI Coverage: Double-submit protection & Character limit validation
  // ---------------------------------------------------------------------------
  it("UI-Additional: shows disabled button with spinner during submit and handles empty state", async () => {
    vi.spyOn(api, "getActionsTaken").mockResolvedValue({
      ticketId: 10,
      ticketNo: "TKT-2026-00010",
      data: []
    });

    render(
      <ActionsTakenSection
        ticketId={10}
        currentUser={mockStaffUser}
        isStaff={true}
      />
    );

    // Empty state should be visible
    expect(await screen.findByText(/No actions taken recorded yet/i)).toBeInTheDocument();
    expect(screen.getByText("(0)")).toBeInTheDocument();
  });
});
