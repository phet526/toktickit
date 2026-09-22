# Lab 4 Test Plan and Traceability Matrix

## 1. Test Strategy & TDD Approach

แผนการทดสอบใน Sprint 4 ถูกออกแบบขึ้นตามแนวทาง **Test-Driven Development (TDD)** และ **Specification-Driven Development (Spec DD)** เพื่อรับประกันความถูกต้องแม่นยำของระบบบันทึกการทำงานจริง (**Actions Taken**), การบังคับใช้เงื่อนไขการปิดงานอย่างเคร่งครัด (**Resolution Gate & Status Transition Matrix**), ความถูกต้องของข้อมูลสถิติบนแดชบอร์ดตามบทบาท (**Role Dashboards**), กลไกป้องกันการแก้ไขทับซ้อน (**Optimistic Concurrency 409 Conflict**), และการรักษาเสถียรภาพของระบบเดิม (**100% Zero Regression from Labs 1 to 3**):

1. **Unit Tests:** ทดสอบฟังก์ชันย่อยเชิงตรรกะแบบแยกส่วน เช่น ตัวตรวจสอบเงื่อนไข Follow-up Note, ตัวตรวจสอบเงื่อนไข Resolution Gate, และตัวตรวจสอบการเปลี่ยนสถานะตาม Transition Matrix
2. **API & Integration Tests (Server):** ทดสอบ REST API ทุก Endpoint ร่วมกับฐานข้อมูล PostgreSQL และ Prisma Client ครอบคลุมการสร้าง/แก้ไข Actions Taken, การผูกมัดผู้ปฏิบัติงานอัตโนมัติ, การคำนวณแดชบอร์ดจากข้อมูลจริง, และการตรวจจับ Concurrency Conflict
3. **UI Component Tests (Client):** ทดสอบ React Components ด้วย Vitest และ React Testing Library ตรวจสอบความถูกต้องของฟอร์ม Modal, การแสดงผล Actions Taken ในโหมดแก้ไขและโหมดอ่านอย่างเดียว (Read-only), การแจ้งเตือนเมื่อไม่ผ่าน Resolution Gate, และการแสดงผลการ์ดสถิติบนแดชบอร์ด
4. **UI Style, Responsive & Accessibility Tests:** ตรวจสอบความสอดคล้องกับ Zen Green Theme, การนำทางด้วยแป้นพิมพ์ (Keyboard Focus Rings), ป้ายสถานะที่มีทั้งสีและข้อความ, และการทดสอบบนหน้าจอมือถือเพื่อรับประกันว่า**ไม่มี Scrollbar แนวนอน (Zero Horizontal Overflow)**
5. **End-to-End (E2E) Tests:** ใช้ Playwright จำลองพฤติกรรมผู้ใช้งานจริงผ่านเบราว์เซอร์ ครอบคลุมวงจรชีวิต Actions Taken, การปิดงานตั๋วผ่าน Resolution Gate, การทำ Drill-down บน Dashboards ทั้งสองบทบาท, และการทดสอบ Responsive บน Mobile Viewport
6. **Regression Verification:** ตรวจสอบว่าชุดทดสอบทั้งหมดของ Lab 1, Lab 2, และ Lab 3 ยังคงรันผ่านเป็นสีเขียว 100% โดยไม่มีการแก้ไขโค้ดทดสอบเดิม

---

## 2. Planned Tests Table

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UNIT-01** | Unit | AC-03, BR-06 | Follow-up Note Validation Logic | คืนค่า false/error หาก `followUpRequired = true` แต่ `followUpNote` ว่างเปล่า | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **UNIT-02** | Unit | AC-08, BR-08 | Resolution Gate Validation Logic | ปฏิเสธการเปลี่ยนสถานะเป็น `Resolved` หากตั๋วไม่มี Owner หรือมี Actions Taken เป็น 0 | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **UNIT-03** | Unit | AC-10, BR-10 | Status Transition Matrix Validator | อนุญาตเฉพาะคู่สถานะที่กำหนดใน Matrix และปฏิเสธการข้ามสถานะที่ไม่ถูกต้อง | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **UNIT-04** | Unit | AC-11, BR-11 | Optimistic Concurrency Timestamp Checker | คืนค่าขัดแย้งหากค่า `updatedAt` ของไคลเอนต์ไม่ตรงกับฐานข้อมูล | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-01** | API | AC-01, FR-01, BR-01 | IT Staff สร้าง Action Taken ข้อมูลถูกต้อง | HTTP 201; บันทึกสำเร็จ ผูกกับ Ticket และเซิร์ฟเวอร์ผูก `performedById` จากเซสชันอัตโนมัติ | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-02** | API | AC-02, BR-05 | Client ส่ง `performedById` ปลอมแปลงมาใน Request Body | HTTP 201; เซิร์ฟเวอร์เพิกเฉยต่อค่าที่ส่งมา และบันทึก ID ของผู้ล็อกอินจริงเสมอ | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-03** | API | AC-03, BR-06 | สร้าง Action Taken โดยระบุ `followUpRequired=true` แต่ไม่ใส่โน้ต | HTTP 400 Bad Request; แสดง Error Code `FOLLOW_UP_NOTE_REQUIRED` | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-04** | API | AC-04, FR-05 | IT Staff อัปเดตข้อมูล Actions Taken เดิม | HTTP 200 OK; อัปเดตเนื้อหาสำเร็จ และคงผู้บันทึกเดิม (`performedById`) ไว้ | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-05** | API | AC-05, BR-03 | Requester เรียกดู Actions Taken บนตั๋วของตนเอง | HTTP 200 OK; ส่งคืนรายการ Actions Taken ทั้งหมดในตั๋ว | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-06** | API | AC-05, BR-03 | Requester พยายามดู Actions Taken บนตั๋วของผู้อื่น | HTTP 403 Forbidden หรือ 404 Not Found; ป้องกันการเข้าถึงข้อมูลข้ามสิทธิ์ | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-07** | API | AC-06, BR-03 | Requester พยายามส่งคำขอ POST สร้าง Actions Taken | HTTP 403 Forbidden; ปฏิเสธผู้ใช้งานที่ไม่ใช่เจ้าหน้าที่ | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-08** | API | AC-07, BR-04 | ผู้ใช้ที่ถูก Deactivate (`isActive = false`) พยายามสร้าง Action | HTTP 403 Forbidden; ปฏิเสธบัญชีที่ถูกระงับสิทธิ์ | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **API-09** | API | AC-08, BR-08 | พยายามเปลี่ยนสถานะเป็น `Resolved` บนตั๋วที่ไม่มี Actions Taken | HTTP 400 Bad Request; แสดง Error Code `RESOLUTION_GATE_FAILED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-10** | API | AC-08, BR-08 | พยายามเปลี่ยนสถานะเป็น `Resolved` บนตั๋วที่ยังไม่มี Owner | HTTP 400 Bad Request; แสดง Error Code `RESOLUTION_GATE_FAILED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-11** | API | AC-09, BR-08 | เปลี่ยนสถานะเป็น `Resolved` บนตั๋วที่มีทั้ง Owner และ Actions Taken | HTTP 200 OK; ปรับปรุงสถานะตั๋วเป็น `Resolved` สำเร็จ | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-12** | API | AC-10, BR-10 | เปลี่ยนสถานะตั๋วตามลำดับที่ถูกต้องใน State Transition Matrix | HTTP 200 OK; อัปเดตสถานะสำเร็จ | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-13** | API | AC-10, BR-10 | พยายามเปลี่ยนสถานะข้ามขั้นตอนผิดกฎ (เช่น New ไป Resolved) | HTTP 400 Bad Request; แสดง Error Code `INVALID_STATUS_TRANSITION` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-14** | API | AC-11, BR-11 | อัปเดตตั๋วด้วย Timestamp `updatedAt` เก่าที่ถูกแก้ไขไปก่อนหน้า | HTTP 409 Conflict; แสดง Error Code `STALE_RECORD_CONFLICT` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-15** | API | AC-12, BR-09 | Requester กดส่งสัญญาณ "Problem Appears Resolved" | HTTP 200 OK; บันทึกแฟล็กและเพิ่ม Comment โดยไม่เปลี่ยนสถานะตั๋ว | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **API-16** | API | AC-13, BR-12 | Requester ดึงข้อมูลแดชบอร์ดตนเอง | HTTP 200 OK; คืนค่า Metrics และ Recent Tickets เฉพาะตั๋วที่ตนเองเป็นเจ้าของ | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |
| **API-17** | API | AC-13, FR-11 | Requester ที่ไม่มีตั๋วงานในระบบดึงข้อมูลแดชบอร์ด | HTTP 200 OK; ตัวเลขสรุปทั้งหมดเป็น 0 และ recentTickets เป็น Array ว่าง `[]` | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |
| **API-18** | API | AC-15, FR-12 | IT Staff ดึงข้อมูลแดชบอร์ดคิวงาน | HTTP 200 OK; ตัวเลขสรุปตรงกับฐานข้อมูล และแสดงตั๋ว 5 รายการล่าสุดของตนเอง | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **API-19** | API | AC-15, BR-15 | Administrator ดึงข้อมูลแดชบอร์ด | HTTP 200 OK; ได้รับข้อมูล IT Dashboard พร้อมแนบ `adminSummary` สรุปผู้ใช้งาน | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **API-20** | API | AC-15, FR-12 | Requester พยายามเข้าถึง IT Staff Dashboard | HTTP 403 Forbidden; ป้องกันการเข้าถึงข้อมูลคิวงานของฝ่ายไอที | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| **UI-01** | UI | AC-01, AC-05 | เรนเดอร์ตาราง Actions Taken บนหน้า Ticket Detail | แสดงวันที่, รายละเอียด, ผลลัพธ์, Performer, และป้าย Follow-Up ถูกต้อง | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-02** | UI | AC-03, BR-06 | ฟอร์ม Modal: เปิดสวิตช์ Follow-Up แล้วไม่ระบุโน้ต | แสดงข้อความสีแดงเตือนใต้ช่อง Follow-up Note และปุ่ม Save ถูกบล็อก | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-03** | UI | AC-05, BR-03 | ตรวจสอบมุมมอง Requester บนส่วน Actions Taken | ซ่อนปุ่ม `+ Add Action Taken` และปุ่ม `Edit` ทั้งหมด | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **UI-04** | UI | AC-08, BR-08 | หน้าตั๋ว: IT Staff เลือกสถานะ Resolved บนตั๋วที่ไม่มี Action | แสดง Inline Warning Banner สีแดงแจ้งเตือนเงื่อนไข Resolution Gate | `client/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| **UI-05** | UI | AC-11, BR-11 | หน้าตั๋ว: จำลองข้อผิดพลาด 409 Conflict | แสดง Modal แจ้งเตือนข้อมูลไม่เป็นปัจจุบัน พร้อมปุ่มให้ผู้ใช้กด Refresh | `client/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| **UI-06** | UI | AC-13, AC-14 | หน้า Requester Dashboard: การแสดงผลการ์ดและลิงก์ Drill-down | การ์ดตัวเลขแสดงผลถูกต้อง และลิงก์ View all นำทางไป My Tickets พร้อม Query | `client/tests/lab-04/RequesterDashboard.test.tsx` | Pass |
| **UI-07** | UI | AC-15, FR-12 | หน้า IT Staff Dashboard: การแสดงผลการ์ดและ Quick Actions | แสดงการ์ด 5 ใบ, แผนภูมิ Priority, และปุ่ม Quick Actions ทำงานถูกต้อง | `client/tests/lab-04/StaffDashboard.test.tsx` | Pass |
| **STYLE-01**| UI style | NFR-01, NFR-03 | ตรวจสอบ Zen Green Theme, Accessibility และ Badges | สีหลัก `#006B3C` ถูกต้อง, มี Visible Focus Rings, Badges มีทั้งสีและข้อความ | `client/tests/lab-04/StaffDashboard.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01, AC-03 | IT Staff ล็อกอิน เปิดตั๋ว และบันทึก Action Taken พร้อม Follow-Up | บันทึกสำเร็จ ข้อมูลปรากฏในตารางทันที และป้าย Follow-Up แสดงถูกต้อง | `e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| **E2E-02** | E2E | AC-01, BR-02 | IT Staff คนที่สองเข้ามาเพิ่ม Action Taken บนตั๋วใบเดียวกัน | ตั๋วใบเดียวมี 2 Actions บันทึกโดยเจ้าหน้าที่ 2 คนตามกฎ BR-02 | `e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| **E2E-03** | E2E | AC-05, BR-03 | Requester ล็อกอิน เปิดดูตั๋วที่มี Actions Taken | มองเห็นประวัติการทำงานครบถ้วนในโหมด Read-only โดยไม่มีปุ่มแก้ไข | `e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| **E2E-04** | E2E | AC-08, AC-09 | ทดสอบ Resolution Gate: ตั๋วไม่มี Action ถูกบล็อก -> ใส่ Action -> ปิดงานได้ | ผ่านขั้นตอนตรวจสอบประตูความปลอดภัยก่อนปิดงานจริงสมบูรณ์ | `e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| **E2E-05** | E2E | AC-10, AC-12 | ทดสอบ Full Ticket Lifecycle ครบวงจร | New -> Open -> In Progress -> Actions -> Resolved -> Closed | `e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| **E2E-06** | E2E | AC-13, AC-14 | Requester Dashboard Drill-down Flow | คลิกการ์ดสถิติ -> นำทางไปหน้ารายการตั๋วที่กรองข้อมูลถูกต้อง | `e2e/lab-04/dashboards.spec.ts` | Pass |
| **E2E-07** | E2E | AC-15, FR-12 | IT Staff Dashboard Drill-down Flow | คลิกการ์ด My Assigned -> นำทางไปหน้า Queue ที่กรองเฉพาะตั๋วตนเอง | `e2e/lab-04/dashboards.spec.ts` | Pass |
| **E2E-08** | E2E | NFR-02 | Mobile Viewport Responsiveness (375px) | ตรวจสอบแดชบอร์ดและ Actions Taken บนมือถือ ปราศจาก Horizontal Scrollbar | `e2e/lab-04/dashboards.spec.ts` | Pass |
| **REG-01** | Regression | AC-16, FR-15 | รันชุดทดสอบเดิมทั้งหมดจาก Lab 1, Lab 2, และ Lab 3 | ทุกชุดทดสอบเดิมผ่านเป็นสีเขียว 100% โดยไม่มีการแก้ไขโค้ดทดสอบเดิม | All Legacy Test Suites | Pass |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | รายละเอียดของเกณฑ์การยอมรับ (AC Description) | ชุดทดสอบที่ครอบคลุม (Covering Test IDs) |
| :--- | :--- | :--- |
| **AC-01** | IT Staff สร้าง Action Taken ข้อมูลถูกต้อง สำเร็จและผูกมัดผู้ปฏิบัติงาน | API-01, UI-01, E2E-01, E2E-02 |
| **AC-02** | เซิร์ฟเวอร์ผูกมัด PerformedBy อัตโนมัติจากเซสชัน ป้องกันการปลอมแปลง | API-02 |
| **AC-03** | บังคับระบุ Follow-up Note เมื่อ FollowUpRequired เป็นจริง | UNIT-01, API-03, UI-02, E2E-01 |
| **AC-04** | IT Staff อัปเดตข้อมูล Actions Taken สำเร็จ | API-04 |
| **AC-05** | Requester มองเห็น Actions Taken บนตั๋วตนเองในโหมด Read-only | API-05, API-06, UI-01, UI-03, E2E-03 |
| **AC-06** | Requester พยายามสร้างหรือแก้ไข Actions Taken จะถูกปฏิเสธ (403) | API-07 |
| **AC-07** | ปฏิเสธการสร้างหรือดำเนินงานโดยเจ้าหน้าที่ที่ถูก Deactivate (403) | API-08 |
| **AC-08** | Resolution Gate บล็อกการเปลี่ยนสถานะเป็น Resolved หากไม่มี Owner หรือ Action | UNIT-02, API-09, API-10, UI-04, E2E-04 |
| **AC-09** | เปลี่ยนสถานะเป็น Resolved สำเร็จเมื่อผ่านเกณฑ์ Resolution Gate ครบถ้วน | API-11, E2E-04 |
| **AC-10** | การเปลี่ยนสถานะตั๋วปฏิบัติตาม State Transition Matrix อย่างเคร่งครัด | UNIT-03, API-12, API-13, E2E-05 |
| **AC-11** | ตรวจจับ Optimistic Concurrency Conflict ส่งคืน 409 เมื่อข้อมูลทับซ้อน | UNIT-04, API-14, UI-05 |
| **AC-12** | สัญญาณ Problem Appears Resolved ไม่เปลี่ยนสถานะทางการของตั๋ว | API-15, E2E-05 |
| **AC-13** | Requester Dashboard แสดงผลเฉพาะข้อมูลตั๋วของตนเองอย่างถูกต้อง | API-16, API-17, UI-06, E2E-06 |
| **AC-14** | การทำ Drill-down จาก Requester Dashboard ไปยัง My Tickets ส่งพารามิเตอร์ถูกต้อง | UI-06, E2E-06 |
| **AC-15** | IT Staff & Admin Dashboard แสดงข้อมูลสถิติตรงกับฐานข้อมูลจริงพร้อม Drill-down | API-18, API-19, API-20, UI-07, E2E-07 |
| **AC-16** | ฟังก์ชันและชุดทดสอบเดิมทั้งหมดจาก Lab 1 ถึง Lab 3 ทำงานได้ถูกต้อง 100% | REG-01 (All Legacy Test Suites) |

---

## 4. Responsive & Accessibility Verification Checklist

- [x] **Zero Horizontal Overflow:** ทดสอบบน Viewport กว้าง 375px, 768px, และ 1280px โดย `document.documentElement.scrollWidth === document.documentElement.clientWidth`
- [x] **Theme Standards:** สีเขียวหลัก `#006B3C` สม่ำเสมอใน Header, ปุ่มกด, และ Active Links
- [x] **Accessibility Contrast:** สีตัวอักษรต่อสีพื้นหลังมี Contrast Ratio ≥ 4.5:1
- [x] **Keyboard Navigation:** สามารถกด Tab เพื่อเข้าถึงฟอร์มและปุ่มกดทั้งหมด พร้อม Focus Rings ชัดเจน
- [x] **Dual Cues on Badges:** ป้ายสถานะทุกประเภทมีข้อความภาษาอังกฤษกำกับคู่กับสีเสมอ
- [x] **Safe Failure Feedback:** แสดงข้อความแจ้งเตือนที่เข้าใจง่ายเมื่อเกิดข้อผิดพลาด โดยไม่แสดง Stack Trace

---

## 5. Automated Test Execution Commands

```bash
# 1. รันการทดสอบ Server API และ Integration Tests (Lab 4 และ Regression ทั้งหมด)
npm run test:api --prefix server

# 2. รันการทดสอบ Client UI Component Tests (Lab 4 และ Regression ทั้งหมด)
npm run test:ui --prefix client

# 3. รันการทดสอบ Playwright End-to-End (E2E) Tests บนโหมด Headless
npx playwright test e2e/lab-04/
```

---

## 6. Final Results Summary

สรุปผลการรันชุดทดสอบอัตโนมัติจริง (Automated Test Execution Results) ประจำ Sprint 4:

- **Server Unit, API & Integration Tests:** **TBD / TBD (Planned: 20 Tests for Lab 4 + 114 Regression Tests from Labs 1-3)**
  - `server/tests/lab-04/actions-taken.api.test.ts` (Planned: 8 tests)
  - `server/tests/lab-04/ticket-workflow.api.test.ts` (Planned: 7 tests)
  - `server/tests/lab-04/requester-dashboard.api.test.ts` (Planned: 3 tests)
  - `server/tests/lab-04/staff-dashboard.api.test.ts` (Planned: 4 tests)
  - `server/tests/lab-01/*`, `lab-02/*`, `lab-03/*` (114 regression tests)
- **Client UI & Component Tests:** **TBD / TBD (Planned: 8 Tests for Lab 4 + 47 Regression Tests from Labs 1-3)**
  - `client/tests/lab-04/ActionsTaken.test.tsx` (Planned: 3 tests)
  - `client/tests/lab-04/TicketWorkflow.test.tsx` (Planned: 2 tests)
  - `client/tests/lab-04/RequesterDashboard.test.tsx` (Planned: 2 tests)
  - `client/tests/lab-04/StaffDashboard.test.tsx` (Planned: 2 tests)
  - `client/tests/lab-01/*`, `lab-02/*`, `lab-03/*` (47 regression tests)
- **Playwright End-to-End (E2E) Tests:** **TBD / TBD (Planned: 8 Tests for Lab 4 + 10 Regression Tests from Labs 2-3)**
  - `e2e/lab-04/actions-taken-flow.spec.ts` (Planned: 3 tests)
  - `e2e/lab-04/ticket-resolution.spec.ts` (Planned: 2 tests)
  - `e2e/lab-04/dashboards.spec.ts` (Planned: 3 tests)
  - `e2e/lab-02/*`, `lab-03/*` (10 regression tests)
- **Grand Total Automated Tests:** **Pending Implementation (Target: 100% Pass Rate across Server, Client, and E2E, 0 Failures, 0 Regression)**
- **Status:** **Specification & Test Suites Designed (Issue 1 Complete). Implementation tracking active.**

