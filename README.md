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
- **Issue 2:** เพิ่ม API Health Check สำหรับตรวจสอบสถานะเซิร์ฟเวอร์ (`GET /api/health`)