# Lab 2 UI Specification (Zen Green Theme)
## 1. Color Palette & Typography
ระบบใช้ธีม "Zen Green" เพื่อความสบายตาและดูเป็นมืออาชีพ  
Primary Green (#006B3C): ใช้สำหรับ App Header, ปุ่มหลัก (Primary actions), และส่วนที่ต้องการเน้นความสำคัญ  
Secondary Green (#0B7A46): ใช้สำหรับแถบ Tab ที่กำลังใช้งาน, ลิงก์, และสถานะเมื่อนำเมาส์ไปชี้ (Hover states)  
Pale Green (#EAF6EF): ใช้สำหรับพื้นหลังเมื่อถูกเลือก (Selected), แจ้งเตือนสำเร็จ (Success), หรือเน้นสัดส่วนแบบบางเบา  
Background (#F5F7F6): สีพื้นหลังของหน้าเว็บ (Page background) เป็นสีขาวหม่นเพื่อลดแสงสะท้อน  
Text & Error: ตัวอักษรใช้สีเทาเข้มอมเขียว (Dark charcoal-green) ส่วนข้อความแจ้งเตือนข้อผิดพลาด (Error) ใช้ตัวอักษรและกรอบสีแดงเข้ม  
## 2. Component Rules & Feedback States
กฎการแสดงผลของคอมโพเนนต์และฟอร์มต่างๆ ต้องเป็นมาตรฐานเดียวกันทั้งแอปพลิเคชัน:  
Form Inputs: ช่องกรอกข้อมูลที่แก้ไขได้จะมีพื้นหลังสีขาวพร้อมกรอบสีกลางๆ ส่วนช่องที่อ่านได้อย่างเดียว (Read-only) จะถูกแรเงาด้วยสีเทาเขียวอ่อนๆ ให้ดูแตกต่างแต่ยังอ่านง่าย  
Validation: ฟิลด์ที่บังคับกรอกต้องมีดอกจันสีแดง (*) กำกับ และหากมีข้อผิดพลาด ข้อความแจ้งเตือน (Validation message) จะต้องแสดงอยู่ใต้ช่องกรอกข้อมูลนั้นๆ ทันที  Buttons: ปุ่มกดต้องมีข้อความกำกับเสมอ ปุ่ม Submit จะต้องแสดงสถานะกำลังโหลด (Busy state) และถูกระงับการใช้งาน (Disabled) ระหว่างที่ระบบกำลังประมวลผล  
Badges: ป้ายสถานะ (Priority และ Status) ต้องใช้สีควบคู่กับข้อความเสมอ ห้ามใช้สีเพียงอย่างเดียวในการสื่อความหมาย  
## 3. Responsive Layout Requirements
การจัดวางเลย์เอาต์ต้องปรับเปลี่ยนตามขนาดหน้าจอ (Viewport) ดังนี้:  
Desktop (≥ 992 px): แสดงผลแบบหลายคอลัมน์ (Multi-column) เนื้อหาอยู่กึ่งกลางและมีการจำกัดความกว้างสูงสุด  
Tablet (768-991 px): แสดงผลแบบ 2 คอลัมน์หากพื้นที่พอ โดยช่อง Summary และ Description ต้องมีความกว้างเพียงพอ  
Mobile (< 768 px): ช่องกรอกข้อมูลจะเรียงซ้อนกันในแนวตั้ง (Stack vertically) ปุ่มกดมีขนาดเหมาะกับการสัมผัส และห้ามมีแถบเลื่อนแนวนอน (No horizontal page scrolling) ปรากฏเด็ดขาด  
## 4. Screen Specifications
Development Requester Selection: หน้าจอจำลองการล็อกอิน มีส่วนหัว TokTickIT, ข้อความอธิบาย, Dropdown เลือกผู้ใช้, และปุ่ม Continue หากไม่มีผู้ใช้ในระบบจะต้องแสดง Empty state  
Create Ticket: ฟอร์มสร้างตั๋ว จัดกลุ่มข้อมูลระบบ (System-generated) ไว้ด้านบนสุด ตามด้วยหมวดหมู่ ช่องกรอกรายละเอียด และส่วนอัปโหลดไฟล์แนบไว้ด้านล่างสุดก่อนปุ่ม Submit  My Tickets: หน้ารายการตั๋ว มีแถบค้นหาและตัวกรองอยู่ด้านบน รายการตั๋วแสดงข้อมูลสำคัญ (เช่น Ticket Number, Summary, Status) รองรับการแบ่งหน้า (Pagination) และมีปุ่ม "Create Ticket"  
Ticket Detail: หน้าแสดงข้อมูลตั๋วแบบอ่านได้อย่างเดียว (Read-only) โดยแยกส่วนข้อมูลตั๋วและส่วนจัดการไฟล์แนบให้เห็นชัดเจน รองรับการดาวน์โหลดและลบไฟล์ (Soft-removal)  

## 5. Accessibility
ทุกองค์ประกอบต้องมี Accessibility labels, keyboard focus ที่ชัดเจน รองรับการนำทางด้วยคีย์บอร์ดทั้งหมด

## 6. Visual Checklist
Visual inspection checklist and screenshot paths:
- [ ] ตรวจสอบ UI ด้วยสายตาเทียบกับสเปค (Visual inspection checklist)
- Screenshot Paths: (รออัปเดตไฟล์ /docs/screenshots/ หลังจากพัฒนาเสร็จสิ้น)