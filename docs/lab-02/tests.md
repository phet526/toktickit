# Lab 2 Test Plan and Results
## 1. Test Strategy
กลยุทธ์การทดสอบใน Sprint 2 จะครอบคลุม 4 ระดับหลัก เพื่อให้มั่นใจว่าฟังก์ชันการจำลองผู้ใช้งานและระบบตั๋วทำงานได้อย่างถูกต้อง:  
Unit Tests: ทดสอบฟังก์ชันย่อย เช่น การสร้าง Ticket Number และการตรวจสอบนามสกุลไฟล์API Tests: ทดสอบ REST API endpoints ควบคู่กับ PostgreSQL (ผ่าน Prisma) เพื่อยืนยันการทำงานของระบบฐานข้อมูล, HTTP Status Codes, และการป้องกันสิทธิ์ (Authorization)
UI Component Tests: ทดสอบหน้าจอ React (Zen Green Theme) เพื่อดูสถานะ Loading, Validation errors, และ Empty states
End-to-End (E2E) Tests: ใช้ Playwright จำลองการใช้งานจริงผ่านเบราว์เซอร์ ตั้งแต่เลือก Requester, สร้างตั๋ว, และตรวจสอบในหน้ารายการตั๋ว  
**## 2. Planned Tests**
| Test ID | Type | Requirement (FR/BR/AC) | What It Tests | Expected Result | Automated Test File | Final |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UNIT-01 | Unit | BR-09 | ทดสอบฟังก์ชัน Ticket Number generator | คืนค่ารหัสรูปแบบ TKT-YYYY-XXXXX ได้ถูกต้อง | `server/tests/lab-02/ticket-utils.test.ts` | TBD |
| UI-03 | UI style | NFR-02 | ทดสอบ Zen Green Theme (UI style) | ตรวจสอบว่าสี Primary Green ถูกใช้งานอย่างถูกต้องและไม่มีข้อความทับซ้อน | `client/.../lab-02_tests/style.test.tsx` | TBD |
| API-01 | API | AC-01, FR-02, BR-01, BR-09 | สร้างตั๋วใหม่ด้วยข้อมูลที่ถูกต้องสมบูรณ์ | HTTP 201; บันทึกตั๋วลง DB สำเร็จ และคืนค่า Ticket Number ทรง TKT-YYYY-XXXXX กลับมา | `server/tests/lab-02/tickets.api.test.ts` | TBD |
| UI-01 | UI | AC-01, NFR-04 | กด Submit ฟอร์มสร้างตั๋ว | ปุ่ม Submit จะต้องแสดงสถานะ Busy (กำลังโหลด) และถูก Disable ไว้ | `client/.../lab-02_tests/CreateTicket.test.tsx` | TBD |
| UI-02 | UI | AC-02, FR-01, BR-03 | พยายามเข้าหน้า My Tickets โดยที่ยังไม่เลือก Development Requester | ระบบ Redirect กลับไปที่หน้า Development Requester Selection ทันที | `client/.../lab-02_tests/MyTickets.test.tsx` | TBD |
| API-02 | API | AC-03, BR-04 | ตรวจสอบสิทธิ์การเรียกดูตั๋ว (Ownership) | API ต้องไม่คืนค่าข้อมูลตั๋วของ Requester A หากคนที่กำลังใช้งานคือ Requester B | `server/tests/lab-02/my-tickets.api.test.ts` | TBD |
| API-03 | API | AC-05, BR-05 | พยายามอัปโหลดไฟล์ที่มีขนาด 6 MB (เกินกำหนด) | HTTP 400; API ต้องปฏิเสธไฟล์และแจ้งข้อความเตือนเรื่องขนาด | `server/tests/lab-02/attachments.api.test.ts` | TBD |
| API-04 | API | AC-06, BR-06 | ทำการ Soft-remove ไฟล์แนบ พร้อมแนบเหตุผล | HTTP 200; Metadata อัปเดตสถานะเป็นถูกลบ และไฟล์ดาวน์โหลดไม่ได้อีก | `server/tests/lab-02/attachments.api.test.ts` | TBD |
| API-05 | API | AC-04, FR-03 | เรียกดูรายการตั๋วพร้อมใส่ Search และ Pagination Limit | HTTP 200; คืนค่ารายการตั๋วที่ตรงเงื่อนไขพร้อม Metadata สำหรับแบ่งหน้า | `server/tests/lab-02/my-tickets.api.test.ts` | TBD |
| API-06 | API | BR-10, FR-05 | อัปโหลดไฟล์ล้มเหลวหลังจากสร้างตั๋วสำเร็จ | HTTP 400 (สำหรับไฟล์); แต่เมื่อเรียกดูตั๋วใบนั้นจะพบว่ายังคงอยู่ ไม่โดน Rollback | `server/tests/lab-02/attachments.api.test.ts` | TBD |
| API-07 | API | AC-06, BR-06 | จำลองการพยายามดาวน์โหลดไฟล์ที่ถูก Soft-remove ไปแล้ว | HTTP 403 (หรือ 404); ระบบต้อง Block และแสดง Error ปฏิเสธการดาวน์โหลด | `server/tests/lab-02/attachments.api.test.ts` | TBD |
| E2E-01 | E2E | AC-01, AC-04, NFR-01, NFR-02 | จำลองผู้ใช้งานตั้งแต่สร้างตั๋ว ค้นหาตั๋ว และตรวจสอบ Responsive | สร้างตั๋วสำเร็จ และเมื่อลดขนาดจอ Mobile จะต้องไม่เกิด Scroll แนวนอน | `e2e/lab-02/requester-ticket-flow.spec.ts` | TBD |
## 3. Acceptance-Criterion Traceability
Requirement / AC | Covering Test IDs
--- | ---
AC-01, FR-02, BR-01, BR-09 (สร้างตั๋วและแสดง Ticket No) | API-01, UI-01, E2E-01
AC-02, FR-01, BR-03 (บังคับให้เลือก Requester ก่อน) | UI-02
AC-03, BR-04 (ป้องกันการเข้าถึงตั๋วข้ามคน) | API-02
AC-04, FR-03 (ค้นหาและแบ่งหน้าตั๋ว) | API-05, E2E-01
AC-05, BR-05 (การตรวจสอบไฟล์แนบ) | API-03
AC-06, BR-06 (การลบไฟล์แบบ Soft-removal) | API-04, API-07
BR-10, FR-05 (สร้างตั๋วผ่านแต่อัปโหลดล้มเหลว) | API-06
NFR-01, NFR-02 (Responsive & Theme) | E2E-01
NFR-04 (Loading State) | UI-01
## 4. Responsive and Visual Checklist
[ ] สีและสไตล์อิงตามโทน Zen Green อย่างถูกต้อง (Primary: #006B3C)  
[ ] ไม่มีข้อความที่ซ้อนทับกัน (Overlap) หรือปุ่มกดที่โดนบัง  
[ ] ไม่มี Scrollbar แนวนอนโผล่มาในหน้าจอขนาด Mobile  
[ ] ป้ายสถานะ (Badges) ใช้สีที่สื่อความหมายชัดเจน และมีข้อความกำกับ (ห้ามใช้สีอย่างเดียว)  
[ ] เมื่อไม่มีข้อมูลในระบบ หน้าจอแสดง Empty State อย่างเหมาะสมและเข้าใจง่าย  
## 5. Test Commands
คำสั่งสำหรับรันเทส (อัปเดตหลังจากพัฒนาเสร็จ):
Unit & API: npm run test:api
UI: npm run test:ui
E2E: npx playwright test
## 6. Final Results
รอสรุปผลหลังจากรันเทสทั้งหมดในขั้นตอนการทำ PR (Pull Request)
## 7. Known Limitations or Deferred Tests
การเก็บไฟล์จำลองไว้ในเครื่อง (Local Storage) อาจทำให้การทดสอบบางเคสไม่ได้สะท้อนการทำงานของ Cloud Storage จริงๆ แต่ยอมรับได้สำหรับขอบเขตของ Lab 2  