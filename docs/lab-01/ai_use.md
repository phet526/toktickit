# Lab 1 — AI Use and Reflection  (fill this in)

**LLM/agent used:** Gemini 3.1 Pro (High)

## Selected Key Prompts

| Prompt Name | Actual Prompt Text |
| :--- | :--- |
| **Project Setup & Git Branch** | "ต้องเช็ค PostgreSQL ใน Docker ตรงไหน เปิดยังไง และถ้าจะเริ่มทำ Issue 1 ต้องสลับ Branch ด้วยคำสั่งอะไร"<br>**My Reflection:** ทำให้ผมทำความเข้าใจขั้นตอนเริ่มต้นและคำสั่งสร้าง Branch ได้ในรอบเดียว |
| **Git Push & Upstream** | "ตอนดันโค้ดขึ้น GitHub ทำไมคำสั่งที่ให้มาถึงมี `-u origin` มันต่างจาก push ปกติยังไง"<br>**My Reflection:** ผมได้เรียนรู้เรื่องการผูก Local Branch กับ Remote Branch บน GitHub |
| **Git Pull Sync** | "พอสร้างกิ่งใหม่แล้วไฟล์ README.md ที่เคยแก้ไว้หายไปหมดเลย ต้องดึงโค้ดเก่ามารวมยังไง"<br>**My Reflection:** ช่วยผมแก้ปัญหาโค้ดหายตอนที่หาreadmeไม่เจอโดยใช้คำสั่งดึงข้อมูลล่าสุดจากกิ่งกลางมาประสานกัน |
| **API Health Check** | "Issue 2 ต้องทำ API health check ขอสเตปการเขียนฝั่ง Backend ให้คืนค่า status ok และเทส Supertest ผ่าน"<br>**My Reflection:** ได้รู้แนวทางการเขียน Route และโครงสร้างเทสเบื้องต้น สามารถนำไปปรับใช้ผ่านได้ทันที |
| **Port Conflict Fix** | "รัน Backend ไม่ได้ Terminal ฟ้อง Error EADDRINUSE: address already in use :::3000 แก้ยังไง"<br>**My Reflection:** รู้คำสั่งและวิธีใช้คำสั่งเคลียร์พอร์ตที่ค้างอยู่เบื้องหลังได้อย่างรวดเร็ว ทำให้สะดวกมากเพราะเกิดขึ้นบ่อย |
| **Frontend Error Handling** | "หน้าบ้าน React ตอนดึง API ต้องเขียนดักจับ Error ยังไง ให้หน้าเว็บขึ้นกรอบสีแดงเวลาที่เซิร์ฟเวอร์ล่ม"<br>**My Reflection:** ช่วยให้ได้โค้ดจัดการสถานะตอน API ล่มมาปรับใช้กับ UI ได้ตรงตาม Requirement ทำให้ผ่านissue2ไปได้ |
| **Prisma Upsert Seed** | "เริ่ม Issue 3 ต้องเขียน Prisma schema ของตาราง Category และสร้างไฟล์ Seed ข้อมูล ขอวิธีเขียนที่ไม่ทำให้ข้อมูลซ้ำเวลารันใหม่"<br>**My Reflection:** ทำให้ทำissue3ได้ราบลื่นมากเเละรู้จักการใช้ฟังก์ชัน `upsert` เพื่อป้องกันข้อมูลซ้ำซ้อนเวลาสั่งรัน Seed ซ้ำ |
| **Test Fix & Type Match** | "รันเทสพัง ฟ้องว่า expected 'Account and Access' to be 'Account' แก้ยังไง และแก้ Type Error ระหว่าง SystemStatus กับ Category[]"<br>**My Reflection:** จุดนี้ทำให้ผมเห็นว่าต้องคอยตรวจสอบโค้ดที่ AI ให้มาเทียบกับฐานข้อมูลจริง และปรับปรุง Type ให้ตรงกัน |
| **Frontend Mock Testing** | "รันเทสฝั่งหน้าบ้านแล้วขึ้น [skipped] 2 ข้อ ต้องแก้ไฟล์ App.test.tsx อย่างไร"<br>**My Reflection:** ทำให้รู้ว่าต้องใช้ `vi.spyOn` จำลองการทำงานของ API เพื่อจำลองสถานะ Online/Offline จนสามารถรันเทส Issue 4 ผ่านทั้งหมดได้ ทำให้จบจบด้วยดี |