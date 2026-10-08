# TokTickIT

## การตั้งค่าโปรเจกต์ (Project Setup)

### 1. การตั้งค่า Environment Variables (.env)
โปรเจกต์นี้จำเป็นต้องใช้ไฟล์ `.env` ในการรัน:
- เข้าไปที่โฟลเดอร์ `client` และ `server`
- ก๊อปปี้ไฟล์ `.env.example` แล้วเปลี่ยนชื่อเป็น `.env`
- สำหรับฝั่ง `server` ให้ตรวจสอบ `DATABASE_URL` ให้ตรงกับฐานข้อมูลใน Docker

### 2. การติดตั้ง (Installation)
รันคำสั่งนี้ที่โฟลเดอร์หลัก เพื่อติดตั้ง Dependencies ทั้งหมดที่จำเป็น:
```bash
npm install
```

### 3. การเตรียมฐานข้อมูลและ Seed Data
```bash
# รัน Database Migration
npm run prisma:migrate --prefix server

# Seed ข้อมูลเริ่มต้นสำหรับระบบ
npm run prisma:seed --prefix server
```

### 4. การรันโปรแกรม (Run Program)
ระบบแยกส่วนระหว่างหน้าบ้านและหลังบ้าน ให้เปิด Terminal แยกกัน 2 หน้าต่าง:
- **ฝั่ง Server (รันที่พอร์ต 3000):**
  ```bash
  cd server
  npm run dev
  ```
- **ฝั่ง Client (รันที่พอร์ต 5173):**
  ```bash
  cd client
  npm run dev
  ```
เมื่อรันทั้งสองส่วนสำเร็จ เว็บไซต์จะเปิดที่: http://localhost:5173

---

## ฟีเจอร์ที่พัฒนาแล้ว (Features)

### Lab 1: Project Foundation (Issue 1-4)
- **Issue 2:** เพิ่ม API Health Check สำหรับตรวจสอบสถานะเซิร์ฟเวอร์ และแสดงผลผ่านหน้าเว็บ React
- **Issue 3:** จัดเตรียมฐานข้อมูล (Database Preparation) โดยสร้าง Prisma Model สำหรับ `Category` และรัน Migration เพื่อสร้างตารางใน PostgreSQL พร้อมทั้งเขียนสคริปต์ Seed ข้อมูลหมวดหมู่เริ่มต้น 4 หมวดหมู่ (Account and Access, Hardware, Software, Network) โดยเขียนโค้ดป้องกันไม่ให้เกิดข้อมูลซ้ำซ้อนเมื่อรันสคริปต์ซ้ำ
- **Issue 4:** ดึงข้อมูลและแสดงผลหมวดหมู่บนหน้าเว็บ (Category List & UI States) โดยเชื่อมต่อหน้าเว็บ (React) เข้ากับ API เพื่อดึงรายชื่อหมวดหมู่จากฐานข้อมูลมาแสดงผลเป็นลิสต์แบบไดนามิก พร้อมทั้งพัฒนาระบบดักจับข้อผิดพลาด (Error Handling) โดยจะแสดงสถานะ Offline และข้อความแจ้งเตือนสีแดงให้ผู้ใช้ทราบทันทีเมื่อเซิร์ฟเวอร์ล่มหรือไม่สามารถเชื่อมต่อได้

### Lab 2: Ticketing System (Issue 11-16)
- **Mock Login (Requester Selector):** จำลองการล็อกอินเพื่อเลือก Development Requester ใช้เป็นบริบทในการทดสอบระบบ (Context Storage)
- **Ticket Creation:** ระบบสร้างตั๋วปัญหาที่รองรับการอัปโหลดไฟล์แนบหลายไฟล์ (Max 5MB) พร้อม Validation ครบถ้วน
- **My Tickets:** หน้ารายการตั๋วที่ดึงเฉพาะตั๋วของผู้ใช้งานคนปัจจุบัน พร้อมระบบค้นหา, ตัวกรอง (Category, Status, System), เรียงลำดับ, และแบ่งหน้า (Pagination)
- **Ticket Detail & Soft-Delete:** หน้าดูรายละเอียดตั๋ว (Read-only) ที่รองรับการดาวน์โหลดไฟล์แนบ รวมถึงการลบไฟล์แนบของตนเองแบบ Soft-removal (ต้องระบุเหตุผลในการลบ)
- **UI/UX & NFR:** ดีไซน์ด้วยโทนสี Zen Green (#006B3C) รองรับการแสดงผลทุกขนาดหน้าจอ (Responsive) และมี Accessibility Labels ครบถ้วน รวมถึง Error Boundary เพื่อป้องกันหน้าจอขาว

### Lab 3: Users, Roles, IT Staff Ticketing, and Admin Screens (Issue 23-28)
- **Issue 23 (Sprint 3 Engineering Contract & Specs):** กำหนดเอกสารสเปกทางวิศวกรรมครบวงจร ได้แก่ `specification.md`, `api-spec.md`, `ui-spec.md`, และ `tests.md` ในโฟลเดอร์ `docs/lab-03/`
- **Issue 24 (Authentication Foundation & Session Management):** พัฒนาระบบยืนยันตัวตนจริงด้วย Email และ Password (เข้ารหัสด้วย bcryptjs) รองรับ Session ผ่าน HttpOnly Cookie / JWT, ระบบกักตัวเปลี่ยนรหัสผ่านครั้งแรก (Mandatory First-Time Password Change) พร้อม Dynamic Password Complexity Checklist (8+ ตัวอักษร, พิมพ์ใหญ่, พิมพ์เล็ก, ตัวเลข, สัญลักษณ์พิเศษ), และ Route Guard ป้องกันผู้ไม่ได้ล็อกอิน
- **Issue 25 (IT Staff Ticket Queue):** หน้าคิวงานรวมสำหรับเจ้าหน้าที่ไอที รองรับการค้นหาตั๋ว (Ticket No, Summary), ตัวกรองหลายมิติ (Status, Category, IT Priority, Ownership: All / Unassigned / Assigned to Me), การจัดเรียง (Sorting), การแบ่งหน้า (Pagination), และการปรับแสดงผลเป็น Card List View บนหน้าจอมือถือ (Responsive)
- **Issue 26 (IT Staff Ticket Operations & Internal Notes):** หน้ารายละเอียดและจัดการตั๋วสำหรับเจ้าหน้าที่: ระบบเคลมงาน (Claim Ticket), โอนงาน (Reassign), กำหนด IT Priority, ปรับเปลี่ยนสถานะตาม Status Transition Matrix, โพสต์ Public Comments สื่อสารกับผู้แจ้ง, และระบบบันทึกความลับภายใน (Confidential Internal Notes) ที่ซ่อนจาก Requester ทั้งฝั่ง UI และ Server-Side Authorization Guard (403 Forbidden)
- **Issue 27 (Administrator User Management):** หน้าจอจัดการผู้ใช้สำหรับผู้ดูแลระบบ: ตารางแสดงรายชื่อผู้ใช้ ค้นหา กรองตาม Role, สร้างบัญชีผู้ใช้ใหม่พร้อม Initial Password, แก้ไขข้อมูล, รีเซ็ตรหัสผ่าน, เปิด/ปิดการใช้งานบัญชี (Activate/Deactivate) พร้อมกฎความปลอดภัยห้ามปิดบัญชีตนเอง (BR-19) และห้ามปิด Admin คนสุดท้าย (BR-20)
- **Issue 28 (Release Integration & Multi-Device Verification):** การทดสอบระบบรอบด้านแบบ End-to-End ครบทุก Flow และตรวจสอบการแสดงผลแบบ Responsive บน Desktop, Tablet, และ Mobile (Zero Horizontal Scrollbar)

### Lab 4: Actions Taken, Ticket Workflow, Role Dashboards & Hardening (Issue 40-45)
- **Issue 40 (Sprint 4 Engineering Contract & Specs):** กำหนดเอกสารสเปกทางวิศวกรรมครบวงจร ได้แก่ `specification.md`, `api-spec.md`, `ui-spec.md`, และ `tests.md` ในโฟลเดอร์ `docs/lab-04/` ครอบคลุม Business Rules BR-01 ถึง BR-15 และเกณฑ์การยอมรับ AC-01 ถึง AC-16
- **Issue 41 (Actions Taken Model, Prisma Migration, Seed & Backend APIs):** สร้าง Data Model `ActionTaken` เชื่อมโยงแบบ One-to-Many กับ Ticket, รัน Migration โดยคงความสมบูรณ์ของข้อมูลเดิม, Seed ข้อมูลประวัติการปฏิบัติงานเริ่มต้น, และพัฒนา REST APIs รองรับ CRUD พร้อมการผูกมัดผู้บันทึก (`performedById`) จากเซสชันจริงโดยอัตโนมัติ และการบังคับระบุ Follow-up Note เมื่อต้องการการติดตามงาน
- **Issue 42 (Actions Taken Component on Ticket Detail & Form Validation):** พัฒนาคอมโพเนนต์ Actions Taken บนหน้ารายละเอียดตั๋ว รองรับการแสดงผลแบบ Dual Responsive (ตารางแบบละเอียดบน Desktop และการ์ดเรียงซ้อนบน Mobile < 768px ปราศจากแถบเลื่อนแนวนอน), การจำกัดสิทธิ์ Requester ให้ดูได้เฉพาะโหมดอ่านอย่างเดียว (Read-only), ฟอร์ม Modal บันทึก/แก้ไขพร้อมระบบ Conditional Validation และป้องกัน Double-submit
- **Issue 43 (Ticket Workflow, Resolution Gate & Concurrency Backend/UI):** พัฒนาระบบประตูความปลอดภัย **Resolution Gate** บังคับว่าตั๋วต้องมีผู้รับผิดชอบ (Assigned Owner) และมีบันทึก Action Taken อย่างน้อย 1 รายการจึงจะสามารถเปลี่ยนสถานะเป็น `Resolved` ได้, ระบบตรวจสอบวงจรชีวิตตั๋วตาม State Transition Matrix, สัญญาณ Requester Advisory Signal ("Problem Appears Resolved") โดยไม่เปลี่ยนสถานะทางการของตั๋ว, และกลไก Optimistic Concurrency Control (HTTP 409 Conflict) ป้องกันการบันทึกข้อมูลทับซ้อน
- **Issue 44 (IT Staff & Requester Dashboards Backend Metrics & UI):** หน้าแดชบอร์ดตามบทบาท: Requester Dashboard แสดง 4 Metric Cards พร้อมลิงก์ Drill-down นำทางไปยังรายการตั๋วและแยกข้อมูลตามสิทธิ์อย่างเข้มงวด (Strict Data Isolation), IT Staff Dashboard แสดง 6 Metric Cards ครอบคลุมคิวงานทั้งหมด, สรุปตั๋วตามระดับความสำคัญ (IT Priority), ทางลัด Quick Actions, และ Admin Summary Panel แสดงภาพรวมผู้ใช้งานในระบบสำหรับ Administrator
- **Issue 45 (Final Regression Coverage, Accessibility & Release Integration):** ชุดทดสอบ Playwright E2E ครบ 8 โฟลว์สำคัญ (E2E-01 ถึง E2E-08), การันตี Zero Regression 100% สำหรับการทดสอบเดิมทั้งหมดจาก Lab 1 ถึง Lab 3 โดยไม่แก้ไขโค้ดทดสอบเดิม, การรักษาความเข้ากันได้ของระบบนำทาง (Legacy Routing Safeguards), ตรวจสอบ Accessibility WCAG 2.1 AA (Focus rings, Color contrast), และตรวจสอบการแสดงผลบนมือถือขนาด 375px โดยปราศจาก Horizontal Scrollbar 100%

---

## บัญชีผู้ใช้เริ่มต้นสำหรับทดสอบ (Seed Credentials)

รหัสผ่านเริ่มต้นสำหรับทุกบัญชี: **`Toktick2026!`**

| บทบาท (Role) | ชื่อผู้ใช้ | Email | สถานะ / เงื่อนไข |
| :--- | :--- | :--- | :--- |
| **Administrator** | John Smith | `john.smith@toktickit.com` | Active |
| **Administrator** | System Admin | `admin@toktickit.com` | Active |
| **IT Staff** | Sarah Johnson | `sarah.johnson@toktickit.com` | Active |
| **IT Staff** | Michael Brown | `michael.brown@toktickit.com` | Active |
| **IT Staff** | David Lee | `david.lee@toktickit.com` | Active |
| **IT Staff** | Kevin Patel | `kevin.patel@toktickit.com` | **Inactive** (บัญชีถูกปิดการใช้งาน) |
| **Requester** | Requester A | `requester_a@example.com` | Active |
| **Requester** | Jennifer Anderson | `jennifer.anderson@toktickit.com` | Active |
| **Requester** | Requester C | `requester_c@example.com` | **Inactive** (บัญชีถูกปิดการใช้งาน) |
| **Requester** | Requester E | `requester_e@example.com` | **Must Change Password** (ต้องเปลี่ยนรหัสผ่านครั้งแรก) |

---

## การรันคำสั่งทดสอบ (Testing)

ระบบมี Automated Tests ครอบคลุมทั้งฝั่ง Server, Client UI, และ Playwright E2E ผ่านการทดสอบครบ **237/237 tests (100% Pass, 0 Failures, 0 Regression)**:

1. **Server Unit / Integration / API Tests (156 tests):**
   ```bash
   npm run test:api --prefix server
   ```
2. **Client UI Component Tests (60 tests):**
   ```bash
   npm run test:ui --prefix client
   ```
3. **End-to-End (E2E) Tests via Playwright (21 tests across Desktop & Mobile):**
   ```bash
   npx playwright test
   ```
4. **รันเทสทั้งหมดทุกประเภทพร้อมกัน:**
   ```bash
   npm run test:api --prefix server && npm run test:ui --prefix client && npx playwright test
   ```