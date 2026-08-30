# Lab 2 Sprint Engineering Specification
## 1. Sprint Goal
เป้าหมายของ Sprint 2 คือการสร้างระบบสร้างและจัดการตั๋วแจ้งปัญหา (Ticketing System) สำหรับฝั่งผู้ใช้งาน (Requester) แบบทำงานได้จริง (MVP) โดยครอบคลุมตั้งแต่การจำลองการเข้าสู่ระบบ, การสร้างตั๋ว, การดูรายการตั๋วของตนเอง, การดูรายละเอียดตั๋ว, และการจัดการไฟล์แนบอย่างปลอดภัย 
 ## 2. Stakeholder Request Interpretation
แผนก IT ต้องการระบบจำลองการแจ้งปัญหาที่รองรับการแสดงผลทุกขนาดหน้าจอ (Responsive) สำหรับฝั่ง Requester เนื่องจากระบบ Authentication จะตามมาใน Lab ถัดไป จึงต้องมีหน้าเลือกตัวตนผู้ใช้จำลอง (Development Requester Selection) เพื่อใช้เป็นบริบทในการทดสอบ ผู้ใช้งานจะต้องสามารถแจ้งปัญหา แนบไฟล์หลักฐาน ค้นหาและกรองตั๋วของตนเองได้ โดยระบบต้องป้องกันไม่ให้ผู้ใช้เห็นข้อมูลตั๋วของผู้อื่น  
## 3. Scope
### Included
  หน้าจอจำลองการเลือกตัวตนผู้ใช้งาน (Development Requester Selection)     ฟังก์ชันการสร้างตั๋ว (Create Ticket)
  หน้ารายการตั๋ว (My Tickets) พร้อมระบบค้นหา, กรอง, จัดเรียง, และแบ่งหน้า  หน้าดูรายละเอียดตั๋ว (Requester Ticket Detail)  
  ระบบจัดการไฟล์แนบ (อัปโหลด, ดาวน์โหลด, และการลบแบบ Soft-removal)  การป้องกันสิทธิ์การเข้าถึงข้อมูลข้ามผู้ใช้งาน (Ownership protection)  
### Excluded
  ระบบ Authentication และการล็อกอินด้วยรหัสผ่านจริง
  ฟังก์ชันสำหรับฝั่งเจ้าหน้าที่ IT (IT Staff workflow) เช่น การกดรับงาน หรือเปลี่ยนสถานะตั๋ว
  การแสดงความคิดเห็น (Public Comments), บันทึกภายใน (Internal Notes), และ Actions Taken  
## 4. Functional Requirements
FR-01: ระบบจะต้องมีหน้า Development Requester Selection เพื่อให้ผู้ใช้เลือกตัวตนจำลองก่อนเข้าใช้งาน  
FR-02: ระบบจะต้องอนุญาตให้ Requester สร้างตั๋วใหม่ โดยระบุ Category, Related System, Requested Priority, Summary, และ Description ได้  
FR-03: ระบบจะต้องแสดงหน้ารายการตั๋ว (My Tickets) ที่เป็นของ Requester คนนั้นเท่านั้น พร้อมรองรับการค้นหา กรองข้อมูล จัดเรียง และแบ่งหน้าแสดงผล  
FR-04: ระบบจะต้องอนุญาตให้ Requester เปิดดูรายละเอียดตั๋วของตนเองในรูปแบบอ่านได้อย่างเดียว (Read-only)  
FR-05: ระบบจะต้องรองรับการอัปโหลดไฟล์แนบทั้งในขั้นตอนการสร้างตั๋วและหลังจากสร้างตั๋วแล้ว  
FR-06: ระบบจะต้องอนุญาตให้ Requester ลบไฟล์แนบของตนเองได้ (Soft-removal) โดยต้องมีการกดยืนยันและระบุเหตุผลในการลบ 

## 4.5. Non-Functional Requirements (NFR)
NFR-01 (UI/UX): ระบบจะต้องรองรับการแสดงผลแบบ Responsive สำหรับ Desktop (≥ 992px), Tablet (768-991px), และ Mobile (< 768px) โดยที่ Mobile ห้ามมี Scroll แนวนอน
NFR-02 (Design): ระบบจะต้องใช้ชุดสีและรูปแบบตามมาตรฐาน "Zen Green Theme" อย่างเคร่งครัด
NFR-03 (Accessibility): ทุกฟอร์มต้องรองรับการใช้งานผ่านคีย์บอร์ด (Keyboard navigation) และป้ายสถานะต้องใช้ข้อความควบคู่กับสีเสมอ (ห้ามใช้สีสื่อความหมายเพียงอย่างเดียว)
NFR-04 (Performance/UX): ปุ่ม Submit ต้องมีสถานะ Busy (Loading) ป้องกันการกดซ้ำ (Duplicate-submission prevention) ขณะระบบกำลังประมวลผล

 ## 5. Business Rules
 BR-01: ระบบจะต้องสร้างหมายเลขตั๋วอย่างเป็นทางการ (Ticket Number) ที่ไม่ซ้ำกันจากฝั่ง Backend เท่านั้น  
 BR-02: ตั๋วที่ถูกสร้างใหม่จะต้องมีสถานะ (Current Status) เริ่มต้นเป็น "New" เสมอ  BR-03: ระบบเลือกตัวตน (Development Requester) ใช้สำหรับการทดสอบใน Lab 2 เท่านั้น ไม่ใช่ระบบรักษาความปลอดภัย  
 BR-04: Requester จะสามารถเข้าถึงหรือดูข้อมูลตั๋วได้เฉพาะตั๋วที่ตนเองเป็นเจ้าของเท่านั้น  
 BR-05: ไฟล์แนบจะต้องเป็นประเภท JPG, PNG, WEBP, หรือ PDF เท่านั้น ขนาดไม่เกิน 5 MB และมีไฟล์ที่แนบได้สูงสุด 5 ไฟล์ต่อตั๋ว  
 BR-06: ไฟล์แนบที่ถูกลบไปแล้วจะไม่สามารถดาวน์โหลดได้อีก แต่ข้อมูลประวัติการลบจะยังคงแสดงอยู่  
 BR-07: ข้อมูลหัวข้อตั๋ว (Summary) และรายละเอียด (Description) เป็นข้อมูลบังคับที่ต้องกรอก (Required) ในการสร้างตั๋ว  
 BR-08: Requester ไม่สามารถแก้ไขรายละเอียดตั๋ว หรือเปลี่ยนแปลงสถานะตั๋วได้ด้วยตนเองหลังจากสร้างเสร็จแล้ว
 BR-09: รูปแบบของ Ticket Number จะต้องเป็นรหัสที่ประกอบด้วยปีและเลขรันนิ่ง เช่น `TKT-YYYY-XXXXX` (ตัวอย่าง: TKT-2026-00001)
 BR-10: กรณีที่สร้างตั๋วสำเร็จแต่การอัปโหลดไฟล์ล้มเหลว ตั๋วจะยังคงถูกสร้างขึ้น แต่ระบบจะต้องแจ้งเตือนให้ผู้ใช้ทราบว่าไฟล์อัปโหลดไม่สำเร็จ
 ## 6. UI Specification Summary (reference to ui-spec.md)
 Theme & Styling: ใช้ธีม Zen Green โดยมีสี Primary green (#006B3C) สำหรับ Header และปุ่มหลัก, สี Error เป็นสีแดงเข้มพร้อมกรอบ  
 Responsive Layout: รองรับการแสดงผล 3 ขนาด ได้แก่ Desktop (หน้าจอแบ่งคอลัมน์), Tablet (2 คอลัมน์), และ Mobile (ฟิลด์เรียงซ้อนกันแนวตั้งและห้ามมี Scroll แนวนอน)  
 Form & Components: ฟิลด์ที่บังคับกรอกต้องมีเครื่องหมายดอกจันสีแดง (*), ปุ่มกดต้องมีข้อความกำกับเสมอ, แสดงข้อความ Validation error ใต้ช่องกรอกข้อมูลทันที  State Management: ต้องมีสถานะ Loading (ปุ่ม Submit แสดงสถานะกำลังโหลดและถูก Disable), Empty state (เมื่อไม่มีข้อมูล), และ Success state (แสดงหมายเลขตั๋วชัดเจนเมื่อสร้างสำเร็จ)  
 ## 7. Data Changes
ออกแบบโครงสร้างฐานข้อมูล (PostgreSQL) ผ่าน Prisma schema โดยมีความสัมพันธ์ (Relationships) เบื้องต้นดังนี้:  
User (Development Requester): เก็บข้อมูลผู้ใช้จำลอง (id, name, isActive)
Ticket: เก็บข้อมูลตั๋ว (id, ticketNo, summary, description, requestedPriority, currentStatus, timestamps) มี Foreign Key เชื่อมไปยัง Requester, Category, และ RelatedSystem  
Category & RelatedSystem: ตารางอ้างอิง (Reference tables) สำหรับหมวดหมู่และระบบที่เกี่ยวข้อง
Attachment: เก็บข้อมูล Metadata ของไฟล์แนบ (id, ticketId, filename, size, mimeType) และฟิลด์สำหรับการทำ Soft-removal (เช่น deletedAt, deletedReason) 
*(เพิ่มเติม: มีการพิจารณาเรื่อง enums, indexes, and migration decisions ควบคู่กับการออกแบบฐานข้อมูล)*

 ## 7.5 Database Design Justification
 Database-design decision justification: เลือกใช้ `String @db.VarChar(150)` สำหรับ `summary` และ `VarChar(2000)` สำหรับ `description` เพื่อควบคุมขนาดข้อมูลตั้งแต่ระดับ Database ช่วยป้องกันปัญหา Memory exhaustion หากผู้ใช้ส่งข้อความยาวเกินไป

 ## 8. API Contract
REST API endpoints หลักที่จะต้องพัฒนา (อยู่ภายใต้ /api/v1):  
GET /api/tickets: ดึงรายการตั๋วของ Requester ที่กำลังเลือกอยู่ (รองรับ Query parameters: search, category, status, page, limit)  
GET /api/tickets/:id: ดึงรายละเอียดตั๋ว 1 ใบ (ต้องตรวจสอบสิทธิ์ว่า Requester เป็นเจ้าของหรือไม่)  
POST /api/tickets: สร้างตั๋วใหม่ (คืนค่า HTTP 201 พร้อม ticketNo หากสำเร็จ หรือ 400/422 หากข้อมูลไม่ถูกต้อง)  
POST /api/tickets/:id/attachments: อัปโหลดไฟล์แนบเข้าตั๋ว  
DELETE /api/tickets/:id/attachments/:attachmentId: ลบไฟล์แนบ (Soft-removal) โดยรับค่า reason ใน Request body  
GET /api/reference-data: ดึงข้อมูล Categories, Related Systems, และ Active Requesters สำหรับหน้าฟอร์ม  
## 9. Acceptance Criteria
AC-01: เมื่อกรอกฟิลด์บังคับครบถ้วนและกดส่งตั๋ว ระบบจะต้องบันทึกข้อมูลสำเร็จและแสดง Ticket Number บนหน้าจอ  
AC-02: หากไม่ได้เลือก Development Requester เมื่อพยายามเข้าหน้า My Tickets ระบบจะต้องบังคับให้ไปที่หน้าเลือก Requester ก่อน  
AC-03: หากผู้ใช้เลือก Requester A ระบบจะต้องไม่แสดงข้อมูลตั๋วที่เป็นของ Requester B (ป้องกันการเข้าถึงข้ามสิทธิ์)  
AC-04: ในหน้ารายการตั๋ว เมื่อใส่คำค้นหา (Search) หรือกดเปลี่ยนหน้า (Pagination) ระบบจะต้องแสดงรายการตั๋วที่อัปเดตตรงตามเงื่อนไข  
AC-05: เมื่อพยายามอัปโหลดไฟล์ที่ขนาดเกิน 5 MB หรือนามสกุลไม่ถูกต้อง ระบบจะต้องปฏิเสธและแสดงข้อความแจ้งเตือน  
AC-06: เมื่อลบไฟล์แนบ (Soft-removal) พร้อมระบุเหตุผล ไฟล์นั้นจะต้องหายไปจากหน้าจอผู้ใช้และไม่สามารถดาวน์โหลดได้อีก แต่ข้อมูล Metadata ยังต้องอยู่ในระบบ  
## 10. Definition of Done
โค้ดทั้งหมดต้องถูกพัฒนาบน feature branch และผ่านการรีวิว (PR Review) ก่อนรวมเข้า lab2-staging และ main ตามลำดับ  
การทดสอบแบบอัตโนมัติครอบคลุมทั้ง Unit, API, UI Components, และ E2E (Playwright) และต้องผ่าน (Pass) ทุกเคส  
ไม่มีโค้ดทดสอบ (Test) ไหนที่ถูกข้าม (Skipped) หรือถูกคอมเมนต์ทิ้งไว้  
หน้าจอ UI ต้องแสดงผลถูกต้องตามดีไซน์ Zen Green, รองรับ Responsive, และผ่านเกณฑ์ Accessibility (ไม่มีข้อความทับซ้อนหรือตกขอบ)  
เอกสาร specification.md, tests.md, ui-spec.md, และ api-spec.md ถูกอัปเดตและเก็บไว้ใน Repository เรียบร้อย  
## 11. Assumptions and Decisions
Context Storage: การบันทึกตัวตนจำลอง (Development Requester) จะใช้ Local Storage ของเบราว์เซอร์ เพื่อให้บริบทยังคงอยู่แม้มีการรีเฟรชหน้าเว็บ และจะหายไปต่อเมื่อผู้ใช้กดปุ่มเปลี่ยนตัวตน
Pagination Size: กำหนดให้หน้ารายการตั๋วแสดงผลค่าเริ่มต้นที่ 10 รายการต่อ 1 หน้า (Default Limit = 10)
Text Limits: เพื่อป้องกันข้อผิดพลาดของฐานข้อมูล กำหนดให้หัวข้อตั๋ว (Summary) ยาวได้สูงสุด 150 ตัวอักษร และรายละเอียดปัญหา (Description) ยาวสูงสุด 2000 ตัวอักษร
Attachment Failure Strategy: เนื่องจาก API แยกการสร้างตั๋วและการอัปโหลดไฟล์ออกจากกัน หากสร้างตั๋วสำเร็จแต่อัปโหลดไฟล์ล้มเหลว (เช่น เน็ตหลุด) ระบบจะแสดงแจ้งเตือน Error ของไฟล์แนบให้ผู้ใช้ทราบ โดยไม่ยกเลิก (Rollback) การสร้างตั๋ว เพื่อไม่ให้ผู้ใช้ต้องพิมพ์ข้อความใหม่ทั้งหมด
Removal Reason: ระบบบังคับ (Required) ให้ผู้ใช้ต้องกรอกเหตุผล (Reason) ทุกครั้งที่ทำการลบไฟล์แนบ เพื่อเก็บไว้ใน Metadata เป็นหลักฐาน (Audit)
Missing Requesters: ในกรณีที่ไม่มี Active Requester ในฐานข้อมูล หน้าจอจำลองการล็อกอินจะแสดงหน้า Empty State พร้อมคำแนะนำให้รันคำสั่ง Database Seed ใหม่อีกครั้ง  
Attachment Storage: สำหรับ Lab 2 ข้อมูลไฟล์แนบจะถูกจำลองการเก็บไว้ใน Local storage ภายในเซิร์ฟเวอร์ไปก่อน โดยเก็บเฉพาะ Metadata ลง PostgreSQL  