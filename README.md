# TokTickIT
## การตั้งค่าโปรเจกต์ (Project Setup)
1. การตั้งค่า Environment Variables (.env)
โปรเจกต์นี้จำเป็นต้องใช้ไฟล์ .env ในการรัน

เข้าไปที่โฟลเดอร์ client และ server

ก๊อปปี้ไฟล์ .env.example แล้วเปลี่ยนชื่อเป็น .env

สำหรับฝั่ง server ให้ตรวจสอบ DATABASE_URL ให้ตรงกับฐานข้อมูลใน Docker

2. การติดตั้ง (Installation)
รันคำสั่งนี้ที่โฟลเดอร์หลัก เพื่อติดตั้ง Dependencies ทั้งหมดที่จำเป็น:

Bash
npm install 
ระบบแยกส่วนระหว่างหน้าบ้านและหลังบ้าน ให้เปิด Terminal แยกกัน 2 หน้าต่าง

3. การรันโปรแกรม (Run Program)
ฝั่ง Server (รันที่พอร์ต 3000):

Bash
cd server
npm run dev
ฝั่ง Client (รันที่พอร์ต 5173):

Bash
cd client
npm run dev
เมื่อรันทั้งสองส่วนสำเร็จ เว็บไซต์จะเปิดอัตโนมัติที่: http://localhost:5173

### 4. ฟีเจอร์ที่พัฒนาแล้ว (Features)
- **Issue 2:** เพิ่ม API Health Check สำหรับตรวจสอบสถานะเซิร์ฟเวอร์ และแสดงผลผ่านหน้าเว็บ React
- **Issue 3:** จัดเตรียมฐานข้อมูล (Database Preparation) โดยสร้าง Prisma Model สำหรับ `Category` และรัน Migration เพื่อสร้างตารางใน PostgreSQL พร้อมทั้งเขียนสคริปต์ Seed ข้อมูลหมวดหมู่เริ่มต้น 4 หมวดหมู่ (Account and Access, Hardware, Software, Network) โดยเขียนโค้ดป้องกันไม่ให้เกิดข้อมูลซ้ำซ้อนเมื่อรันสคริปต์ซ้ำ
- **Issue 4:** ดึงข้อมูลและแสดงผลหมวดหมู่บนหน้าเว็บ (Category List & UI States) โดยเชื่อมต่อหน้าเว็บ (React) เข้ากับ API เพื่อดึงรายชื่อหมวดหมู่จากฐานข้อมูลมาแสดงผลเป็นลิสต์แบบไดนามิก พร้อมทั้งพัฒนาระบบดักจับข้อผิดพลาด (Error Handling) โดยจะแสดงสถานะ Offline และข้อความแจ้งเตือนสีแดงให้ผู้ใช้ทราบทันทีเมื่อเซิร์ฟเวอร์ล่มหรือไม่สามารถเชื่อมต่อได้

### 5. ฟีเจอร์ที่พัฒนาแล้วใน Lab 2 (Ticketing System - Issue 11-16)
- **Mock Login (Requester Selector):** จำลองการล็อกอินเพื่อเลือก Development Requester ใช้เป็นบริบทในการทดสอบระบบ (Context Storage)
- **Ticket Creation:** ระบบสร้างตั๋วปัญหาที่รองรับการอัปโหลดไฟล์แนบหลายไฟล์ (Max 5MB) พร้อม Validation ครบถ้วน
- **My Tickets:** หน้ารายการตั๋วที่ดึงเฉพาะตั๋วของผู้ใช้งานคนปัจจุบัน พร้อมระบบค้นหา, ตัวกรอง (Category, Status, System), เรียงลำดับ, และแบ่งหน้า (Pagination)
- **Ticket Detail & Soft-Delete:** หน้าดูรายละเอียดตั๋ว (Read-only) ที่รองรับการดาวน์โหลดไฟล์แนบ รวมถึงการลบไฟล์แนบของตนเองแบบ Soft-removal (ต้องระบุเหตุผลในการลบ)
- **UI/UX & NFR:** ดีไซน์ด้วยโทนสี Zen Green (#006B3C) รองรับการแสดงผลทุกขนาดหน้าจอ (Responsive) และมี Accessibility Labels ครบถ้วน รวมถึง Error Boundary เพื่อป้องกันหน้าจอขาว

### 6. การรันคำสั่งทดสอบ (Testing)
ระบบมีการเขียน Automated Tests ครอบคลุมทั้งฝั่ง Server และ Client สามารถรันคำสั่งได้ดังนี้:
- **Unit/API Tests (Server):** 
  ```bash
  cd server
  npm run test:api
  ```
- **UI Component Tests (Client):**
  ```bash
  cd client
  npm run test:ui
  ```
- **E2E Tests (Playwright):**
  ```bash
  npx playwright test
  ```