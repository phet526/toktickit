# Lab 1 — AI Use and Reflection  (fill this in)

**LLM/agent used:** Gemini 3.1 Pro (High)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | "ต้องเช็ค PostgreSQL ใน Docker ตรงไหน เปิดยังไง และถ้าจะเริ่มทำ Issue 1 ต้องสลับ Branch ด้วยคำสั่งอะไร" | เข้าไปสตาร์ทคอนเทนเนอร์ใน Docker Desktop และใช้ `git checkout -b` เพื่อสร้างกิ่งใหม่ตั้งต้นโปรเจกต์ |
| 2 | "ตอนดันโค้ดขึ้น GitHub ทำไมคำสั่งที่ให้มาถึงมี `-u origin` มันต่างจาก push ปกติยังไง" | ทำให้เข้าใจว่าต้องใช้คำสั่งนี้เพื่อผูก Local Branch กับ Remote Branch บน GitHub ในการ Push ครั้งแรก |
| 3 | "พอสร้างกิ่งใหม่แล้วไฟล์ README.md ที่เคยแก้ไว้หายไปหมดเลย ต้องดึงโค้ดเก่ามารวมยังไง" | รันคำสั่ง `git pull origin lab1-staging` เพื่ออัปเดตโค้ดล่าสุดจากกิ่งหลักมาทำงานต่อ ป้องกันงานเก่าหาย |
| 4 | "Issue 2 ต้องทำ API health check ขอสเตปการเขียนฝั่ง Backend ให้คืนค่า status ok และเทส Supertest ผ่าน" | นำสคริปต์ไปเขียน Route `GET /api/health` และรัน Vitest เพื่อตรวจสอบผลลัพธ์ว่าตรงตามโจทย์ |
| 5 | "รัน Backend ไม่ได้ Terminal ฟ้อง Error EADDRINUSE: address already in use :::3000 แก้ยังไง" | รันคำสั่ง `npx kill-port 3000` เพื่อปิดโปรเซสที่แอบรันค้างอยู่เบื้องหลัง ทำให้สตาร์ทเซิร์ฟเวอร์ใหม่ได้สำเร็จ |
| 6 | "หน้าบ้าน React ตอนดึง API ต้องเขียนดักจับ Error ยังไง ให้หน้าเว็บขึ้นกรอบสีแดงเวลาที่เซิร์ฟเวอร์ล่ม" | นำโค้ด Error Handling ไปปรับใช้กับหน้า UI เพื่อให้แสดงสถานะ Offline ตอนที่จำลองปิดเซิร์ฟเวอร์ |
| 7 | "เริ่ม Issue 3 ต้องเขียน Prisma schema ของตาราง Category และสร้างไฟล์ Seed ข้อมูล ขอวิธีเขียนที่ไม่ทำให้ข้อมูลซ้ำเวลารันใหม่" | นำโครงสร้างตารางไปใช้ และเรียนรู้วิธีใช้ฟังก์ชัน `upsert` ใน Prisma เพื่อเช็คข้อมูลก่อนเพิ่มลงฐานข้อมูล |
| 8 | "รันคำสั่ง Seed ข้อมูลไม่ผ่าน Terminal ฟ้องว่า Can't reach database server เกิดจากอะไร" | ตรวจสอบ Docker Desktop ตามคำแนะนำ พบว่าคอนเทนเนอร์ฐานข้อมูลหยุดทำงาน จึงกด Play เพื่อสตาร์ทใหม่ |
| 9 | "ไฟใน Docker เขียวแล้ว แต่พอกดเข้า Prisma Studio หน้าเว็บยังแตกและดึงข้อมูลไม่ได้ ต้องแก้ตรงไหนอีก" | ทำการปิด Prisma Studio ใน Terminal (Ctrl+C) และรันคำสั่งเปิดใหม่ เพื่อให้ระบบเชื่อมต่อฐานข้อมูลใหม่อีกครั้ง |
| 10 | "เพื่อนส่ง PR ของ Issue 2 มาให้ตรวจ ต้องพิมพ์คำสั่งอะไรบ้างเพื่อดึงโค้ดเพื่อนลงมาเทสในเครื่องตัวเอง" | ใช้ `git fetch` และสลับกิ่งไปรันเทสระบบของเพื่อนตามสเปก ก่อนตัดสินใจเข้าไปกด Approve ใน GitHub |
## Reflection
Two or three sentences: what made your prompts better, and one place you had to
correct or reject what the agent produced.
