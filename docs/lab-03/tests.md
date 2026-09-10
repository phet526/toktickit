# Lab 3 Test Plan and Traceability

## 1. Test Strategy
แผนการทดสอบใน Sprint 3 ถูกออกแบบขึ้นตามแนวทาง Test-Driven Development (TDD) และ Spec DD เพื่อรับประกันความถูกต้อง ความปลอดภัยของระบบยืนยันตัวตนและการจำแนกสิทธิ์ (RBAC) การทำงานของ IT Staff Queue และ Admin User Management รวมถึงการรักษาความสมบูรณ์ของฟังก์ชันเดิมจาก Lab 2 (Zero Regression) โดยแบ่งออกเป็น 5 ระดับการทดสอบ:

1. **Unit Tests:** ทดสอบฟังก์ชันย่อยเชิงตรรกะ เช่น การตรวจสอบความซับซ้อนของรหัสผ่าน (Password Policy Validator), การตรวจสอบความถูกต้องของการเปลี่ยนสถานะตั๋ว (Status Transition Validator), และฟังก์ชันช่วยจัดการ Query/Pagination
2. **API & Integration Tests (Server):** ทดสอบ REST API ทุก Endpoint ร่วมกับ PostgreSQL และ Prisma ในการตรวจสอบความถูกต้องของข้อมูล, การแฮชรหัสผ่าน, Cookie Session, การบังคับสิทธิ์การเข้าถึง (RBAC Authorization), ป้องกันการเข้าถึงข้อมูลข้ามสิทธิ์, และ Safe Error Handling
3. **UI Component Tests (Client):** ทดสอบ React Components และแบบฟอร์มต่าง ๆ ด้วย Vitest และ React Testing Library เพื่อตรวจสอบสถานะ Busy/Loading, Validation Feedback ใต้ช่องกรอก, Dynamic Password Checklist, และการแสดงผลตามบทบาท
4. **UI Style, Accessibility & Responsive Tests:** ตรวจสอบความสอดคล้องกับ Zen Green Theme, การรองรับ Keyboard Navigation, Focus Rings, ป้ายสถานะ (Badges) ที่มีทั้งสีและข้อความ, และการแสดงผลบนหน้าจอ Desktop, Tablet, และ Mobile (ห้ามมี Horizontal Overflow)
5. **End-to-End (E2E) Tests:** ใช้ Playwright จำลองพฤติกรรมผู้ใช้จริงผ่านเบราว์เซอร์ ครอบคลุมวงจรชีวิตของการล็อกอินครั้งแรก (First-Login Password Change), การปฏิบัติงานตั๋วของ IT Staff, การจัดการผู้ใช้ของ Administrator, และการทดสอบถดถอยของ Requester (Regression Flow)

---

## 2. Planned Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UNIT-01** | Unit | BR-04 | Password Complexity Validator | รหัสผ่านที่ขาดตัวพิมพ์ใหญ่/เล็ก/ตัวเลข/สัญลักษณ์ หรือสั้นกว่า 8 ตัว จะต้องถูกปฏิเสธ | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **UNIT-02** | Unit | BR-15, BR-16 | Ticket Status Transition Rules | ตรวจสอบว่าการเปลี่ยนสถานะที่ไม่ได้รับอนุญาต (เช่น New ไป Resolved ทันที) จะถูกปฏิเสธ | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-01** | API | AC-01, FR-01, BR-01 | ผู้ใช้ Active ล็อกอินด้วย Email/Password ถูกต้อง | HTTP 200; สร้าง HTTP-only Cookie สำเร็จ และคืนค่าข้อมูลผู้ใช้พร้อมบทบาท | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-02** | API | AC-01, BR-01 | ล็อกอินด้วย Password ผิด หรือ Email ที่ไม่มีในระบบ | HTTP 401; แสดง Safe Generic Error Message ("Invalid email or password") | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-03** | API | AC-05, FR-01, BR-02 | พยายามล็อกอินด้วยบัญชีที่ถูก Deactivate (`isActive = false`) | HTTP 401 หรือ 403; แสดงข้อความปลอดภัยปฏิเสธการเข้าถึงโดยไม่รั่วไหลข้อมูลส่วนตัว | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-04** | API | AC-02, FR-02, BR-03 | ผู้ใช้ที่ `mustChangePassword = true` เรียกเปลี่ยนรหัสผ่าน | HTTP 200; อัปเดตรหัสผ่านใหม่ที่แฮชแล้ว และปลดล็อก `mustChangePassword = false` | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-05** | API | FR-03, BR-06 | เรียก Endpoint `/api/v1/auth/me` พร้อม Session Cookie | HTTP 200; คืนค่าข้อมูลตัวตนและบทบาทของผู้ใช้ปัจจุบันอย่างถูกต้อง | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-06** | API | FR-04, BR-05 | ผู้ใช้สั่ง Logout | HTTP 200; เคลียร์คุกกี้เซสชัน และไม่สามารถเรียก Endpoint ที่ต้องยืนยันตัวตนได้อีก (401) | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **API-07** | API | AC-03, BR-07 | Requester พยายามดูหรือจัดการตั๋วที่ไม่ใช่ของตนเอง | HTTP 403 หรือ 404; ไม่เปิดเผยข้อมูลตั๋วของผู้อื่น | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-08** | API | AC-04, BR-11 | Requester พยายามเรียกดูหรือสร้าง Internal Notes | HTTP 403 Forbidden; ไม่เปิดเผยข้อมูลโน้ตลับภายใน | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-08b** | API | AC-04, BR-04, BR-11 | Administrator เรียกดู Internal Notes บนตั๋ว | HTTP 200; Administrator สามารถเข้าถึงเพื่ออ่าน Internal Notes ได้จริงตามกฎ BR-04 | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-09** | API | BR-09 | Requester หรือ Admin พยายามเข้าถึง IT Staff Queue | HTTP 403 Forbidden; ปฏิเสธผู้ใช้งานที่ไม่มีบทบาท IT Staff | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-10** | API | BR-09 | IT Staff หรือ Requester พยายามเข้าถึง Admin User Management | HTTP 403 Forbidden; ปฏิเสธการเข้าถึงหน้าจอจัดการผู้ใช้ | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| **API-11** | API | AC-06, FR-09, FR-10 | IT Staff เรียกดู Ticket Queue พร้อม Search, Filters, Sort และ Pagination | HTTP 200; คืนค่ารายการตั๋วพร้อม Metadata แบ่งหน้า (totalItems, totalPages) | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| **API-12** | API | AC-07, FR-11, BR-13 | IT Staff กดเคลมตั๋วที่ยังไม่มีผู้รับผิดชอบ (Claim Ticket) | HTTP 200; บันทึก `assignedStaffId = currentUser.id` ลงฐานข้อมูล | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-13** | API | AC-07, FR-12, BR-13 | IT Staff โอนตั๋ว (Reassign) ไปให้ IT Staff คนอื่นที่ Active | HTTP 200; อัปเดต `assignedStaffId` เป็นเจ้าหน้าที่คนใหม่สำเร็จ | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-14** | API | AC-08, FR-13, BR-14 | IT Staff อัปเดตระดับ `itPriority` | HTTP 200; อัปเดตค่า `itPriority` ใหม่ โดยที่ `requestedPriority` เดิมยังคงอยู่ | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-15** | API | AC-08, FR-14, BR-16 | IT Staff ปรับสถานะตั๋วตาม State Transition Matrix | HTTP 200; ปรับสถานะตั๋วสำเร็จตามลำดับที่อนุญาต | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass |
| **API-16** | API | BR-10, BR-12 | Requester หรือ IT Staff โพสต์ Public Comment บนตั๋ว | HTTP 201; บันทึกข้อความพร้อม Author และ Timestamp แบบ Append-only | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-17** | API | BR-11, BR-12 | IT Staff บันทึก Internal Note บนตั๋ว | HTTP 201; บันทึกข้อความภายในลงระบบสำเร็จ | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-18** | API | AC-09, FR-08, BR-17 | Requester กดส่งสัญญาณ "Problem Appears Resolved" | HTTP 200; ตั้งค่า `problemResolvedReported = true` และสร้าง Auto Public Comment | `server/tests/lab-03/comments-notes.api.test.ts` | Pass |
| **API-19** | API | AC-10, FR-16, FR-17 | Admin เรียกดู User List พร้อมค้นหาชื่อ/อีเมล และกรองตาม Role | HTTP 200; ส่งคืนรายชื่อผู้ใช้ที่ตรงตามเงื่อนไข (ไม่ส่ง passwordHash) | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-20** | API | AC-10, FR-18, BR-18 | Admin สร้างบัญชีผู้ใช้ใหม่ด้วยข้อมูลที่ถูกต้องและรหัสผ่านเริ่มต้น | HTTP 201; บันทึกผู้ใช้ใหม่ พร้อมแฮชรหัสผ่าน และตั้ง `mustChangePassword = true` | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-21** | API | AC-10, BR-18 | Admin พยายามสร้างผู้ใช้ด้วย Email ที่ซ้ำกับในระบบ | HTTP 400 หรือ 409 Conflict; ปฏิเสธการสร้างพร้อมข้อความเตือน Email ซ้ำ | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-22** | API | AC-10, FR-19 | Admin แก้ไขข้อมูลผู้ใช้ (ชื่อ, บทบาท, สถานะ Active/Inactive) | HTTP 200; อัปเดตข้อมูลผู้ใช้ลงฐานข้อมูลสำเร็จ | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-23** | API | AC-11, BR-19 | Admin พยายามปิดการใช้งาน (Deactivate) บัญชีของตนเอง | HTTP 400 Bad Request; ปฏิเสธการดำเนินการเพื่อความปลอดภัย | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-24** | API | AC-11, BR-20 | Admin พยายาม Deactivate Administrator คนสุดท้ายที่มีสถานะ Active | HTTP 400 Bad Request; ระบบป้องกันไม่ให้ขาดแคลน Active Admin | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-25** | API | FR-20, BR-03 | Admin รีเซ็ตรหัสผ่านเริ่มต้นให้ผู้ใช้งาน | HTTP 200; อัปเดต Hash รหัสใหม่ และกำหนด `mustChangePassword = true` | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| **API-26** | API | AC-12, FR-06 | Requester เดิมจาก Lab 2 ทำการสร้างตั๋วและแนบไฟล์ | HTTP 201; ตั๋วผูกกับ Requester จาก Session สำเร็จ ข้อมูล Lab 2 ทำงานได้ปกติ | `server/tests/lab-03/auth.api.test.ts` | Pass |
| **UI-01** | UI | AC-01, NFR-05 | หน้า Login: การตรวจสอบฟิลด์, สถานะปุ่ม Busy, และการแสดง Error | ปุ่มแสดง Spinner ขณะกด Submit และแสดง Error ชัดเจนเมื่อข้อมูลไม่ถูกต้อง | `client/tests/lab-03/Login.test.tsx` | Pass |
| **UI-02** | UI | AC-02, BR-04 | หน้า Change Password: Dynamic Rules Checklist และยืนยันรหัสผ่าน | แสดงเครื่องหมายถูกสีเขียวตามเงื่อนไขที่ผ่าน และปุ่ม Continue ถูก Enable เมื่อครบ | `client/tests/lab-03/ChangePassword.test.tsx` | Pass |
| **UI-03** | UI | AC-06, FR-10 | หน้า Staff Ticket Queue: การแสดงผลตาราง, ตัวกรอง, และการค้นหา | ค้นหาและกรองข้อมูลได้ถูกต้อง แสดง Empty State เมื่อไม่พบข้อมูล | `client/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| **UI-04** | UI | AC-07, AC-08 | หน้า Staff Ticket Detail: เคลมตั๋ว, ปรับ IT Priority, และสลับแท็บ Comments/Notes | คอนโทรลตอบสนองถูกต้อง และกล่อง Internal Note แสดงสีเตือนความปลอดภัย | `client/tests/lab-03/StaffTicketDetail.test.tsx` | Pass |
| **UI-05** | UI | AC-10, AC-11 | หน้า Admin User Management: รายชื่อผู้ใช้, โมดอลสร้าง/แก้ไข, สวิตช์ Active | Toggle ปิดการใช้งานตนเองถูก Disabled และฟอร์มดักจับอีเมลซ้ำ | `client/tests/lab-03/UserManagement.test.tsx` | Pass |
| **UI-06** | UI style | NFR-01, NFR-03 | ตรวจสอบ Zen Green Theme, Accessibility Focus Rings, และ Status Badges | สีหลัก #006B3C ถูกต้อง, ทุกปุ่มมี Focus outline และ Badge มีตัวหนังสือควบคู่สี | `client/tests/lab-03/StaffTicketQueue.test.tsx` | Pass |
| **E2E-01** | E2E | AC-01, FR-04 | ทดสอบ Authentication Flow: ล็อกอินสำเร็จ, แสดงชื่อบน Header, และกด Logout | ล็อกอินเข้าสู่แดชบอร์ดตามสิทธิ์ และเมื่อออกจากระบบแล้วเข้าหน้านั้นไม่ได้อีก | `e2e/lab-03/authentication.spec.ts` | Pass |
| **E2E-02** | E2E | AC-02, BR-03 | ผู้ใช้ที่มี Initial Password ล็อกอินครั้งแรกแล้วถูกบังคับเปลี่ยนรหัสผ่าน | ถูกกักตัวอยู่ในหน้า Change Password จนกว่าจะตั้งรหัสผ่านใหม่สำเร็จจึงเข้าแอปได้ | `e2e/lab-03/authentication.spec.ts` | Pass |
| **E2E-03** | E2E | AC-06, AC-07, AC-08 | IT Staff เข้าคิวงาน ค้นหาตั๋ว เปิดตั๋ว เคลมงาน ปรับ Priority และสถานะ | วงจรการทำงานของฝ่ายไอทีทำงานสมบูรณ์ ข้อมูลอัปเดตแบบเรียลไทม์ | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |
| **E2E-04** | E2E | AC-10, AC-11 | Admin สร้างผู้ใช้ใหม่ ค้นหาผู้ใช้ แก้ไขสิทธิ์ และตรวจสอบการป้องกันตนเอง | บัญชีถูกสร้างจริงในระบบ และแอดมินไม่สามารถ Deactivate ตัวเองได้ | `e2e/lab-03/user-administration.spec.ts` | Pass |
| **E2E-05** | E2E | AC-09, AC-12 | Requester สร้างตั๋ว แนบไฟล์ ดูตั๋วตนเอง และกด "Problem Appears Resolved" | ตั๋วและไฟล์แนบเดิมทำงานได้ 100% พร้อมขึ้น Public Comment แจ้งปัญหาได้รับการแก้ไข | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Covering Test IDs |
| :--- | :--- | :--- |
| **AC-01** | Valid Authentication & Role Return | API-01, API-02, UI-01, E2E-01 |
| **AC-02** | Mandatory First-Login Password Change | API-04, UI-02, E2E-02 |
| **AC-03** | Requester Data Isolation & Ownership Protection | API-07, E2E-05 |
| **AC-04** | Internal Notes Confidentiality & Access (Hidden from Requester, Visible to IT Staff & Admin) | API-08, API-08b |
| **AC-05** | Deactivated/Inactive Account Login Blocking | API-03 |
| **AC-06** | IT Ticket Queue Search, Filter, Sort, Pagination | API-11, UI-03, E2E-03 |
| **AC-07** | Ticket Ownership Claim & Reassign | API-12, API-13, UI-04, E2E-03 |
| **AC-08** | IT Priority & Permitted Status Transition Updates | UNIT-02, API-14, API-15, UI-04, E2E-03 |
| **AC-09** | Requester "Problem Appears Resolved" Signal | API-18, E2E-05 |
| **AC-10** | Admin User Management (List, Search, Create, Edit) | API-19, API-20, API-21, API-22, UI-05, E2E-04 |
| **AC-11** | Admin Safety Rules (Prevent Self/Last Admin Deactivation) | API-23, API-24, UI-05, E2E-04 |
| **AC-12** | Lab 2 Requester Zero Regression (Tickets & Attachments) | API-26, E2E-05 |

---

## 4. Responsive and Visual Design Checklist

- [x] **Theme Consistency:** สีหลักคงไว้ที่ Zen Green (`#006B3C`), พื้นหลังโทนสว่างสบายตา (`#F4FBF7`), สีแจ้งเตือน Error และ Safety Notes ชัดเจน
- [x] **Responsive Adaptation:**
  - **Desktop (≥ 992px):** ตารางข้อมูลแสดงครบทุกคอลัมน์ ฟอร์มแบ่งคอลัมน์สวยงาม
  - **Tablet (768–991px):** คอลัมน์ตารางปรับกระชับ ฟอร์มยุบเป็นสัดส่วนพอดีหน้าจอ
  - **Mobile (< 768px):** ตาราง Ticket Queue ปรับเป็น Card List View, เมนูนำทางพับเก็บเป็น Hamburger / Drawer, **ไม่มี Scrollbar แนวนอนเด็ดขาด**
- [x] **Accessible Controls:** ป้ายสถานะ (Status / Priority / Role Badges) มีสีคู่กับข้อความกำกับเสมอ, ป้อนรหัสผ่านมีปุ่ม Show/Hide พร้อม Keyboard focus ชัดเจน
- [x] **Feedback & State Management:** ปุ่ม Submit ทุกปุ่มแสดง Spinner/Busy state ขณะกำลังบันทึก, มี Empty state เมื่อไม่มีตั๋วในคิว, และมี No-results state เมื่อค้นหาไม่พบ

---

## 5. Automated Test Execution Commands

```bash
# 1. รันการทดสอบ Server Unit, API, และ Authorization Tests ทั้งหมด
npm run test:api --prefix server

# 2. รันการทดสอบ Client Component, Form Validation, และ Theme Tests ทั้งหมด
npm run test:ui --prefix client

# 3. รันการทดสอบ End-to-End ผ่าน Playwright บนเบราว์เซอร์จริง
npx playwright test
```

---

## 6. Final Results Summary
*(หมายเหตุ: ส่วนนี้จะได้รับการอัปเดตเป็นผลการรันจริงเมื่อดำเนินการพัฒนาโค้ดเสร็จสิ้นสมบูรณ์)*

- **Unit & API Tests:** 27/27 Planned (Pending Implementation)
- **UI Component Tests:** 6/6 Planned (Pending Implementation)
- **E2E Integration Tests:** 5/5 Planned (Pending Implementation)
- **Status:** Test plan approved. Ready to proceed with UI Specification and API Specification.
