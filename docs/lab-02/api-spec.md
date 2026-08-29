# Lab 2 REST API Contract
## 1. General Guidelines

Base Path: API ทั้งหมดจะอยู่ภายใต้เส้นทาง /api/v1 (เช่น /api/v1/tickets)

Content Type: รับส่งข้อมูลในรูปแบบ application/json เป็นหลัก (ยกเว้นการอัปโหลดและดาวน์โหลดไฟล์)

Authentication: ใน Lab 2 จะจำลองการยืนยันตัวตนโดยใช้ requesterId ส่งมาเป็นตัวอ้างอิงแทน Token ชั่วคราว

## 2. Expected HTTP Status Codes

200 OK: ดึงข้อมูลหรือทำรายการสำเร็จ

201 Created: สร้าง Resource ใหม่สำเร็จ (เช่น สร้างตั๋ว)

400 Bad Request: ข้อมูลที่ส่งมาไม่ถูกต้อง (Invalid input) หรือไฟล์แนบผิดประเภท/ขนาดเกิน

403 Forbidden: ไม่มีสิทธิ์เข้าถึง (Ownership failure) เช่น พยายามดูตั๋วของคนอื่น

404 Not Found: ไม่พบ Resource ที่ต้องการ (Missing resource)

500 Internal Server Error: ข้อผิดพลาดจากฝั่งเซิร์ฟเวอร์ที่ไม่ได้คาดคิด (Safe unexpected-error)

## 3. Endpoints Specification

**3.1. Reference Data (ข้อมูลอ้างอิง)**
GET /api/v1/requesters/active

 Purpose: ดึงรายชื่อ Development Requesters ที่มีสถานะ Active สำหรับหน้าจำลองการเข้าสู่ระบบ

 Response (200): Array ของ object { id, name, email }

GET /api/v1/categories

 Purpose: ดึงหมวดหมู่ปัญหาทั้งหมดที่เปิดใช้งาน

 Response (200): Array ของ object { id, name }

GET /api/v1/related-systems

 Purpose: ดึงรายชื่อระบบที่เกี่ยวข้อง (Related Systems)

 Response (200): Array ของ object { id, name }
**3.2. Ticket Management (การจัดการตั๋ว)**
POST /api/v1/tickets

 Purpose: สร้างตั๋วแจ้งปัญหาใหม่

 Request Body:
 {
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 3,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual even when idle.",
  "requestedPriority": "MEDIUM"
}
Responses:

 201 Created: { "ticketNo": "TKT-2026-00001", "message": "Ticket created successfully" }

 400 Bad Request: ส่งฟิลด์บังคับไม่ครบ หรือค่าไม่ถูกต้อง

GET /api/v1/tickets

 Purpose: ดึงรายการตั๋วของ Requester ปัจจุบัน พร้อมรองรับการค้นหาและแบ่งหน้า

 Query Parameters:

  requesterId (Required): ID ของผู้ใช้ปัจจุบัน

  search (Optional): คำค้นหาจาก Ticket Number หรือ Summary

  page (Optional): หมายเลขหน้า (Default: 1)

  limit (Optional): จำนวนรายการต่อหน้า (Default: 10)

  sort (Optional): ฟิลด์สำหรับจัดเรียง (เช่น createdAt:desc)

 Response (200): 
  {
  "data": [
    { "ticketNo": "TKT-2026-00001", "summary": "...", "status": "New", "createdAt": "..." }
  ],
  "meta": { "totalItems": 42, "currentPage": 1, "totalPages": 5 }
}
GET /api/v1/tickets/:id

 Purpose: ดึงรายละเอียดของตั๋ว 1 ใบ

 Query Parameter: requesterId (เพื่อตรวจสอบสิทธิ์ความเป็นเจ้าของ)

 Responses:

  200 OK: ข้อมูลตั๋วทั้งหมดรวมถึงรายชื่อไฟล์แนบ

  403 Forbidden: หากพยายามเรียกดูตั๋วที่ไม่ได้เป็นคนสร้าง
**3.3. Attachment Management (การจัดการไฟล์แนบ)**
POST /api/v1/tickets/:id/attachments

 Purpose: อัปโหลดไฟล์แนบเข้าตั๋วที่ระบุ

 Request: multipart/form-data บรรจุไฟล์ (สูงสุด 5 MB, ประเภท JPG, PNG, WEBP, PDF)

 Responses: 201 Created (สำเร็จ), 400 Bad Request (ไฟล์ผิดประเภทหรือใหญ่เกินไป)

GET /api/v1/tickets/:id/attachments/:attachmentId

 Purpose: ดึงข้อมูล Metadata ของไฟล์แนบ (retrieve Attachment metadata)

 Responses: 200 OK (คืนค่า Metadata), 404 Not Found (ไม่พบไฟล์)

GET /api/v1/tickets/:id/attachments/:attachmentId/download

 Purpose: ดาวน์โหลดไฟล์แนบ (download an active Attachment)

 Responses: 200 OK (Stream ไฟล์กลับไปให้ผู้ใช้), 403/404 (หากไฟล์ถูก Soft-remove ไปแล้ว)

DELETE /api/v1/tickets/:id/attachments/:attachmentId

 Purpose: ลบไฟล์แนบแบบ Soft-removal

 Request Body: { "requesterId": 1, "reason": "Uploaded the wrong screenshot" }

 Responses:

  200 OK: อัปเดตข้อมูล Metadata เป็นสถานะลบสำเร็จ

  403 Forbidden: ไม่มีสิทธิ์ลบไฟล์ หรือไม่ได้ส่งเหตุผลการลบ