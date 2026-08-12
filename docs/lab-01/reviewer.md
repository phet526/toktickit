# Lab 1 — Peer Review Record  (fill this in)

**Author:** นายพชร มัสมี— 67070501066 — GitHub: @phet526
**Peer reviewer:** นายวัทธิกร ศรีประดับทอง — 67070501073 — GitHub: @ILoveSiesta

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
|https://github.com/phet526/toktickit/pull/5| feature/1-project-foundation |Approved  |
|https://github.com/phet526/toktickit/pull/6| feature/2-health-check | Approved |
|https://github.com/phet526/toktickit/pull/7| feature/3-category-seed |  Approved|
|https://github.com/phet526/toktickit/pull/8| feature/4-category-list |  |

Reviewer comment I received: <...>
How I responded: <...>


## Pull Requests I reviewed for my partner
My comment: <...>
Partner's response: <...>

## Pull Requests I authored (reviewed by my partner)

**Reviewer comment I received (Issue 1):** โค้ดรันทั้ง client, server และอื่นๆได้ปกติ แต่แก้ไขไฟล์ README ยังไม่มีคำแนะนำวิธี Setup โปรเจกต์ เช่น คำสั่งติดตั้ง, การรัน dev, การเซ็ต .env เป็นต้น 
**How I responded (Issue 1):** ได้รับทราบปัญหาและทำการแก้ไขไฟล์ README.md โดยเพิ่มขั้นตอนการ Setup โปรเจกต์ จากนั้น Push โค้ดกลับไปให้เพื่อนตรวจอีกครั้งจนผ่านการ Approve 
**Reviewer comment I received (Issue 2):** ฝั่ง Backend รันเทสผ่าน แต่ ฝั่ง Frontend มีจุดต้องแก้ พอกดปุ่ม Check System แล้วมันค้างที่ Loading... ตลอด The React page displays the backend status based on a real API call. A useful error message appears when the backend is unavailable. ยังไม่ผ่าน 2 ข้อนี้ตาม Acceptance criteria 
**How I responded (Issue 2):** แก้โค้ดฝั่งหน้าบ้านเรียบร้อยแล้วจ้าา เพิ่มให้ React ดึง API มาโชว์สถานะ Online / Offline ตาม Acceptance Criteria เป๊ะๆ แล้วก็เขียน Supertest เทสฝั่งเซิร์ฟเวอร์ผ่านหมดแล้วด้วยยย รบกวนตรวจและกด Approve ให้เค้าอีกรอบน้า 🙏 
**Reviewer comment I received (Issue 2):**"Frontend แสดงผล Backend status ว่า Online จากการเรียก API ได้จริง และทดสอบการปิด Server แล้ว แสดงผล Error message แจ้งเตือน"
**How I responded (Issue 3):** ทยอยอัปเดตไฟล์เอกสาร ai_use.md กับ reviewer.md ตามคำแนะนำอาจารย์ และเตรียมโครงของ tests.md ไว้รอใส่ผลเทสตอนจบ Issue 4 เรียบร้อยแล้ว ฝากตรวจและกด Approve Issue 3 ให้ด้วยน้า!"
**Reviewer comment I received (Issue 3):** ตรวจ Issue 3 เรียบร้อย ตาราง Category และไฟล์ Migration สร้างมาถูกต้อง, ทดสอบรันคำสั่ง Seed ซ้ำ 2 รอบแล้วผ่าน ไม่มีข้อมูลเบิ้ล, เช็คแล้ว ไม่มีไฟล์ .env หลุด 

## Pull Requests I reviewed for my partner 
**My comment (Issue 1):** เทสแล้วหน้าเว็บขึ้นตามโจทย์เรียบร้อย Approve 
**Partner's response (Issue 1):** กด approve ไป
**Partner's response (Issue 2):** issue2 + แก้ readme
**My comment (Issue 2):** ทดสอบระบบเรียบร้อยครับ โค้ดทำงานได้สมบูรณ์และตรงตาม Acceptance Criteria ทุกข้อเลย! 👍

ฝั่ง Backend: ตัว API GET /api/health คืนค่า HTTP 200 และส่ง JSON { status: "ok", service: "TokTickIT API" } ได้ถูกต้องตามสเปกครับ รันตัว Supertest ใน health.test.ts ดูแล้วก็ผ่านฉลุย

ฝั่ง Frontend: หน้าเว็บดึงข้อมูลมาแสดงผลตอนที่ระบบรันปกติ (Online) ได้ถูกต้อง และที่ชอบคือทำ Error Handling เอาไว้ดีมากครับ ลองจำลองเคสปิด Backend ทิ้ง หน้าเว็บก็ดักจับ Error ได้และเปลี่ยนเป็นกรอบแจ้งเตือน Offline สีแดงให้ผู้ใช้งานเข้าใจได้ง่ายมากๆ

โค้ดคลีนและเทสผ่าน 100% ครับ Approve ให้เลย กด Merge แล้วลุย Issue ต่อไปได้เลย

**My comment (Issue 3):** ตรวจ Issue 3 เรียบร้อย ตาราง Category และไฟล์ Migration สร้างมาถูกต้อง, ทดสอบรันคำสั่ง Seed ซ้ำ 2 รอบแล้วผ่าน ไม่มีข้อมูลเบิ้ล