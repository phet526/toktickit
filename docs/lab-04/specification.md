# Lab 4 Sprint Engineering Specification: Actions Taken, Ticket Workflow, Dashboards, and Final Regression

## 1. Sprint Goal
เป้าหมายของ Sprint 4 คือการพัฒนา TokTickIT ให้เสร็จสมบูรณ์ในระดับระบบบริหารจัดการงานบริการไอที (IT Service Desk) ที่พร้อมใช้งานจริง โดยเพิ่มระบบบันทึกและติดตามการปฏิบัติงานจริงของเจ้าหน้าที่ (**Actions Taken**) ภายใต้ตั๋วแต่ละใบ, บังคับใช้กฎวงจรชีวิตตั๋วและเงื่อนไขการปิดงาน (**Ticket Status Rules & Resolution Gate**), จัดทำแดชบอร์ดสรุปข้อมูลเชิงปฏิบัติการที่ตรงตามบทบาท (**Role-Appropriate Dashboards**) สำหรับ Requester, IT Staff, และ Administrator, วางระบบตรวจจับและป้องกันการแก้ไขข้อมูลทับซ้อน (**Optimistic Concurrency & Stale Update Handling**), และทำการทดสอบความเข้ากันได้ย้อนหลังอย่างสมบูรณ์แบบ (**100% Zero Regression**) เพื่อให้ฟังก์ชันทั้งหมดจาก Lab 1 ถึง Lab 3 ทำงานร่วมกับฟีเจอร์ใหม่ได้อย่างไร้รอยต่อภายใต้มาตรฐานการออกแบบ Zen Green Design Language

---

## 2. Stakeholder Request Interpretation
Stakeholder ได้ระบุความต้องการอย่างชัดเจนว่า แม้ปัจจุบันระบบจะสามารถรับแจ้งตั๋วและสื่อสารระหว่างผู้แจ้งกับเจ้าหน้าที่ได้แล้ว แต่ยังขาดกลไกที่เชื่อถือได้ในการวางแผน บันทึก และติดตามผลการลงมือแก้ไขปัญหาจริง (Actual Work Done) จึงต้องการให้เพิ่มส่วน **Actions Taken** ภายใต้ตั๋วแต่ละใบ โดยแต่ละรายการต้องเก็บข้อมูล: วันและเวลาที่ปฏิบัติงาน (Action Date/Time), รายละเอียดสิ่งที่ได้กระทำ (Action Description), ผลลัพธ์ที่ได้ (Result), ผู้ปฏิบัติงานที่บันทึกโดยระบบอัตโนมัติ (Performed by [auto]), ตัวบ่งชี้ว่าจำเป็นต้องมีงานติดตามผลหรือไม่ (Follow-Up Required?), บันทึกรายละเอียดการติดตามผล (Follow-up Note ซึ่งบังคับระบุเมื่อต้องติดตามผล), และข้อความอ้างอิงไฟล์แนบ (Attachment Notes สำหรับระบุชื่อไฟล์ภาพหรือเอกสารที่เกี่ยวข้อง)

ในแง่การบริหารจัดการ ตั๋วแต่ละใบยังคงมี **Ticket Owner** เพียงคนเดียวเป็นผู้รับผิดชอบหลักในการประสานงาน แต่เจ้าหน้าที่ IT Staff ท่านอื่นสามารถเข้ามาร่วมปฏิบัติงานและบันทึก Actions Taken ได้ การส่งสัญญาณของผู้แจ้งว่าปัญหาได้รับการแก้ไขแล้ว ("Problem Appears Resolved") ยังคงเป็นเพียงการให้ข้อมูลคำแนะนำ (Advisory) และไม่เปลี่ยนสถานะตั๋วเป็น Resolved โดยตรง แต่เจ้าหน้าที่ IT Staff จะต้องเข้ามาตรวจสอบการทำงานจริงและเป็นผู้ปรับเปลี่ยนสถานะตั๋วอย่างเป็นทางการเท่านั้น

นอกจากนี้ Stakeholder ต้องการให้มี **Dashboards** ที่มีประโยชน์ กระชับ และเชื่อมโยงไปยังหน้ารายการตั๋วอย่างเหมาะสมสำหรับทั้ง Requester และ IT Staff พร้อมทั้งขัดเกลาและเสริมความแข็งแกร่ง (Polish and Harden) ให้ทุกฟังก์ชันจากแล็บก่อนหน้าทำงานได้อย่างถูกต้อง สอดคล้อง และปลอดภัยภายใต้ธีม Zen Green

---

## 3. Scope

### 3.1 Included in Sprint 4
1. **Actions Taken Data Model & Operations:**
   - โมเดลข้อมูล `ActionTaken` ใน PostgreSQL ผ่าน Prisma เชื่อมโยงแบบ One-to-Many กับ `Ticket` และผูกกับ `User` (PerformedBy)
   - ฟอร์มและอินเทอร์เฟซสำหรับสร้าง (Create) และแก้ไข (Update) Actions Taken บนหน้า IT Staff Ticket Detail
   - การผูกมัดตัวตนผู้ปฏิบัติงาน (`performedBy`) อัตโนมัติจากเซสชันของผู้ใช้ที่ล็อกอินอยู่เบื้องหลัง โดยไคลเอนต์ไม่สามารถส่งค่าปลอมแปลงได้
   - การตรวจสอบความถูกต้องของข้อมูล (Validation): ตรวจสอบความยาวตัวอักษร และบังคับระบุ `followUpNote` ทันทีเมื่อเลือก `followUpRequired = true`
   - การแสดงผล Actions Taken สำหรับ Requester ในรูปแบบอ่านอย่างเดียว (Read-only View) บนตั๋วที่ตนเองเป็นเจ้าของ
2. **Ticket Workflow, Status Rules & Resolution Gate:**
   - การบังคับใช้ State Transition Matrix ที่สมบูรณ์ ครอบคลุม 8 สถานะ: `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, และ `Cancelled`
   - การบังคับใช้กฎ **Resolution Gate** ที่ฝั่ง Backend API: ตั๋วจะเปลี่ยนสถานะเป็น `Resolved` ได้ก็ต่อเมื่อ (1) มีผู้รับผิดชอบตั๋ว (`assignedStaffId` ไม่เป็น null) และ (2) มีบันทึก Actions Taken อย่างน้อย 1 รายการ
   - การคงอยู่ของสัญญาณ "Problem Appears Resolved" จาก Requester โดยเป็นเพียง Advisory Signal ที่ไม่เปลี่ยนสถานะทางการของตั๋ว
   - การป้องกันการแก้ไขข้อมูลทับซ้อน (Optimistic Concurrency / Stale-Update Protection) โดยตรวจสอบค่า `updatedAt` เพื่อส่งคืน HTTP 409 Conflict หากมีผู้ใช้อื่นปรับปรุงตั๋วไปก่อนหน้า
3. **Role-Appropriate Dashboards:**
   - **Requester Dashboard:** สรุปตัวเลข Total Open Tickets, Tickets Waiting for Requester, Recently Updated Tickets, Recently Resolved Tickets พร้อมตาราง My Recent Tickets และปุ่ม Quick Actions (Create Ticket, View My Tickets) พร้อมระบบ Drill-down ไปยังหน้ารายการตั๋วที่กรองข้อมูลตรงกัน
   - **IT Staff Dashboard:** สรุปตัวเลข Unassigned Tickets, Tickets Owned by Current User, การกระจายตัวของตั๋วตามสถานะและ IT Priority, ตาราง Recent Tickets ในคิวงาน และปุ่ม Quick Actions
   - **Administrator Dashboard:** ต่อยอดและนำส่วนแสดงผลของ IT Staff Dashboard มาใช้ร่วมกับส่วนสรุปจำนวนบัญชีผู้ใช้งานระบบ (User Account Summary)
   - ตัวเลขสถิติทั้งหมดต้องคำนวณและประมวลผลจาก Backend ด้วย Authoritative Database Queries
4. **Final Regression & Hardening:**
   - การสืบทอดฟังก์ชันทั้งหมดจาก Lab 1 ถึง Lab 3 (Authentication, Mandatory Password Change, RBAC, Ticket Creation, My Tickets, Attachments Soft-removal, Public Comments, Internal Notes, Admin User Management) โดยไม่มีข้อผิดพลาด (Zero Regression)
   - ความสอดคล้องของ State Feedback: Loading Spinners, Empty States, Validation Errors, 403 Forbidden, 404 Not Found, 409 Conflict, และ Safe API Failure Handling
   - การป้องกันการส่งคำสั่งซ้ำซ้อน (Double-submit prevention) บนปุ่มการกระทำทั้งหมด
   - Responsive Design บน Desktop (≥ 992px), Tablet (768–991px), และ Mobile (< 768px) โดยปราศจาก Scrollbar แนวนอน (Zero Horizontal Overflow) 100%

### 3.2 Explicitly Excluded from Sprint 4 (ตาม Section 4.2)
- ระบบนาฬิกาคำนวณ SLA อัตโนมัติ (Automatic SLA Clocks), กลไก Escalation อัตโนมัติ, ระบบจัดตารางเวร On-call, และระบบแจ้งเตือนการผิดข้อตกลง (Breach Notifications)
- บริการส่งข้อความแจ้งเตือนภายนอกระบบทุกชนิด เช่น Email, SMS, LINE Notify, หรือ Push Notifications
- การจัดการคลังพัสดุและตัดสต็อกอะไหล่ (Inventory consumption), การจัดซื้อ (Purchasing), หรือการคิดต้นทุนบริการ (Cost accounting)
- ระบบบันทึกเวลาทำงานเพื่อคิดค่าจ้างหรือคิดเงินตามเวลา (Time-sheet billing, Payroll, Labor-cost calculation)
- กระบวนการขออนุมัติงานหลายระดับขั้น (Multi-level approval workflows) และระบบลายเซ็นอิเล็กทรอนิกส์ (Electronic signatures)
- เครื่องมือวิเคราะห์ข้อมูลเชิงลึกขั้นสูง (Advanced BI Tools), ระบบสร้างรายงานแบบกำหนดเอง (Custom report builders), และคลังข้อมูลภายนอก (Data warehouses)
- สถาปัตยกรรมแบบหลายองค์กร (Multi-tenant organizations) และการดูแลระบบคลาวด์ระดับโปรดักชันขนาดใหญ่
- ฟีเจอร์ใหม่ใดๆ ที่ไม่ได้รับอนุมัติในสัญญาทางวิศวกรรมของ Sprint 4

---

## 4. Functional Requirements (FR)

### 4.1 Actions Taken Requirements
- **FR-01:** เจ้าหน้าที่ IT Staff และ Administrator ที่มีสถานะ Active จะต้องสามารถสร้างรายการ Actions Taken ใหม่ภายใต้ตั๋วที่ได้รับอนุญาตได้ โดยต้องระบุ Action Description และ Result
- **FR-02:** ระบบจะต้องผูกมัดผู้ปฏิบัติงาน (`performedBy`) เข้ากับบัญชีผู้ใช้ที่ล็อกอินอยู่โดยอัตโนมัติจากเซสชันของเซิร์ฟเวอร์ โดยไม่อนุญาตให้ไคลเอนต์ระบุหรือแก้ไขตัวตนผู้กระทำเอง
- **FR-03:** เจ้าหน้าที่ IT Staff และ Administrator จะต้องสามารถเลือกกำหนดตัวบ่งชี้การติดตามผล (`followUpRequired`) ได้ และหากเลือกเป็นจริง ระบบจะต้องบังคับให้กรอกบันทึกการติดตามผล (`followUpNote`)
- **FR-04:** เจ้าหน้าที่ IT Staff และ Administrator จะต้องสามารถกรอกข้อความอ้างอิงไฟล์แนบ (`attachmentNotes`) เพื่อระบุชื่อไฟล์ภาพหรือเอกสารในตั๋วที่ใช้ประกอบการปฏิบัติงานได้
- **FR-05:** เจ้าหน้าที่ IT Staff และ Administrator จะต้องสามารถแก้ไขข้อมูล Actions Taken เดิมที่มีอยู่ได้ (ยกเว้นผู้สร้างเริ่มต้นที่จะถูกคงไว้เพื่อเป็น Audit Trail)
- **FR-06:** ผู้ใช้งานที่เป็น Requester จะต้องสามารถเปิดดูรายการ Actions Taken ทั้งหมดบนตั๋วที่ตนเองเป็นเจ้าของในรูปแบบอ่านอย่างเดียว (Read-only) โดยไม่มีปุ่มหรือฟังก์ชันสำหรับเพิ่ม แก้ไข หรือลบข้อมูล

### 4.2 Ticket Lifecycle, Workflow & Resolution Gate
- **FR-07:** ระบบจะต้องรองรับและบังคับใช้สถานะของตั๋วทั้ง 8 สถานะ ได้แก่ `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, และ `Cancelled` ตาม State Transition Matrix
- **FR-08 (Resolution Gate):** เซิร์ฟเวอร์จะต้องตรวจสอบเงื่อนไขก่อนอนุญาตให้เปลี่ยนสถานะตั๋วเป็น `Resolved` โดยตั๋วต้องมี Ticket Owner ที่ถูกมอบหมายแล้ว (`assignedStaffId != null`) และมีบันทึก Actions Taken อย่างน้อย 1 รายการ หากไม่ผ่านเกณฑ์ ระบบจะต้องปฏิเสธการทำรายการด้วยรหัสข้อผิดพลาดที่ชัดเจน
- **FR-09:** การส่งสัญญาณแจ้งว่าปัญหาได้รับการแก้ไขแล้วจาก Requester ("Problem Appears Resolved") จะต้องเป็นเพียงคำแนะนำ โดยระบบจะอัปเดตแฟล็กและสร้าง Public Comment แจ้งเตือน แต่จะไม่เปลี่ยนสถานะทางการของตั๋วเป็น `Resolved`
- **FR-10 (Optimistic Concurrency):** ระบบจะต้องตรวจจับการอัปเดตข้อมูลตั๋วหรือ Actions Taken ที่ขัดแย้งกัน (Stale Updates) โดยหากค่า Timestamp (`updatedAt`) ที่ส่งมาจากไคลเอนต์ไม่ตรงกับค่าล่าสุดในฐานข้อมูล ระบบจะต้องตอบกลับด้วย HTTP 409 Conflict เพื่อป้องกันการบันทึกทับข้อมูลของผู้อื่น

### 4.3 Role-Appropriate Dashboards
- **FR-11 (Requester Dashboard):** ระบบจะต้องมีหน้าแดชบอร์ดสำหรับ Requester ซึ่งแสดงผลตัวเลขสรุปตั๋วของตนเอง (Open, Waiting for Requester, Recently Updated, Recently Resolved), รายการตั๋วที่อัปเดตล่าสุด 5 รายการ, และปุ่ม Quick Actions พร้อมลิงก์ Drill-down ไปยังหน้ารายการตั๋วที่กรองตามสถานะที่เลือก
- **FR-12 (IT Staff Dashboard):** ระบบจะต้องมีหน้าแดชบอร์ดสำหรับ IT Staff ซึ่งแสดงตัวเลขสรุปคิวงาน (New, Open, In Progress, Waiting for Requester, My Assigned, Unassigned), แผนภูมิ/ตัวเลขจำแนกตาม IT Priority, รายการตั๋วที่ได้รับมอบหมายล่าสุด 5 รายการ, และปุ่ม Quick Actions พร้อมลิงก์ Drill-down ไปยัง Queue ตามสถานะหรือสิทธิ์ความเป็นเจ้าของ
- **FR-13 (Administrator Dashboard):** ระบบจะต้องอนุญาตให้ Administrator เข้าถึง IT Staff Dashboard ได้ พร้อมทั้งแสดงการ์ดสรุปจำนวนบัญชีผู้ใช้งานระบบ (User Account Counts) เพิ่มเติม
- **FR-14 (Authoritative Calculations):** ข้อมูลตัวเลขทางสถิติทั้งหมดบนแดชบอร์ดจะต้องประมวลผลและคำนวณจากฐานข้อมูลโดยตรงผ่าน Backend API เพื่อรับประกันความถูกต้องแม่นยำ

### 4.4 Final Hardening & Zero Regression
- **FR-15:** ระบบจะต้องรักษาความถูกต้องและการทำงานที่สมบูรณ์ 100% ของฟังก์ชันเดิมจาก Lab 1 ถึง Lab 3 (Authentication, RBAC, Ticket CRUD, File Attachments & Soft Deletion, Public Comments, Internal Notes, Admin User Management)
- **FR-16:** อินเทอร์เฟซผู้ใช้ทุกหน้าจอจะต้องมีสถานะ Loading, Empty State, Error Banner, และการป้องกันการคลิกซ้ำที่ได้มาตรฐานเดียวกัน และต้องรองรับการใช้งานบนทุกขนาดหน้าจอโดยไม่มีการล้นออกนอกแนวนอน

---

## 5. Business Rules (BR)

### 5.1 Actions Taken Rules
- **BR-01 (Single Ticket Ownership):** ข้อมูล Action Taken แต่ละรายการต้องสังกัดอยู่ภายใต้ตั๋วงานเพียงใบเดียวเท่านั้น (`ticketId` เป็นความสัมพันธ์แบบ 1-to-N)
- **BR-02 (Collaborative Action Recording):** ตั๋วงานมี Ticket Owner เป็นผู้ประสานงานหลักเพียงคนเดียว แต่เจ้าหน้าที่ IT Staff หรือ Administrator คนอื่นๆ ที่มีสถานะ Active สามารถเข้ามาลงมือปฏิบัติงานและบันทึก Actions Taken ภายใต้ตั๋วใบนั้นได้
- **BR-03 (Requester Read-Only Access):** Requester มีสิทธิ์เปิดดูรายการ Actions Taken ได้เฉพาะตั๋วที่ตนเองเป็นเจ้าของ (`ticket.requesterId = currentUser.id`) ในรูปแบบอ่านอย่างเดียว (Read-only) เท่านั้น การพยายามสร้าง แก้ไข หรือลบ Actions Taken โดย Requester จะต้องถูกปฏิเสธด้วย HTTP 403 Forbidden
- **BR-04 (Active Staff Authorization):** เฉพาะผู้ใช้ที่มีบทบาทเป็น `IT_STAFF` หรือ `ADMINISTRATOR` และมีสถานะเปิดใช้งาน (`isActive = true`) เท่านั้นที่สามารถสร้างหรือแก้ไข Actions Taken ได้ บัญชีที่ถูกระงับสิทธิ์ (`isActive = false`) จะไม่สามารถบันทึกหรือถูกระบุเป็นผู้กระทำได้
- **BR-05 (Immutable Performer Binding):** ฟิลด์ผู้ปฏิบัติงาน (`performedBy`) จะถูกดึงและบันทึกจากเซสชันของผู้ใช้ที่ทำการสร้างรายการโดยอัตโนมัติ และจะไม่มีการเปลี่ยนแปลงผู้บันทึกเดิมเมื่อมีการแก้ไขข้อมูลในภายหลัง เพื่อรักษาความโปร่งใสของ Audit Trail
- **BR-06 (Mandatory Follow-up Note Rule):** หากผู้ใช้กำหนดค่า `followUpRequired = true` ระบบจะต้องบังคับให้ระบุ `followUpNote` ที่มีความยาวไม่เกิน 1,000 ตัวอักษรและห้ามเป็นค่าว่าง หาก `followUpRequired = false` ฟิลด์นี้สามารถเป็นค่าว่างหรือ null ได้
- **BR-07 (Attachment Notes Limit):** ข้อความอ้างอิงไฟล์แนบ (`attachmentNotes`) ต้องมีความยาวไม่เกิน 500 ตัวอักษร ใช้สำหรับบันทึกชื่อไฟล์หรือคำอธิบายประกอบที่เชื่อมโยงกับ Attachments ของตั๋ว

### 5.2 Ticket Lifecycle & Resolution Gate Rules
- **BR-08 (Resolution Gate Enforcement):** ตั๋วงานจะไม่สามารถเปลี่ยนสถานะเป็น `Resolved` ได้ เว้นแต่จะผ่านเงื่อนไขครบทั้ง 2 ข้อ:
  1. ตั๋วมีเจ้าหน้าที่ผู้รับผิดชอบหลักที่แน่นอนแล้ว (`assignedStaffId != null`)
  2. ตั๋วมีประวัติการบันทึก Actions Taken อย่างน้อย 1 รายการ (`actionsCount >= 1`)
  หากฝ่าฝืน Backend จะต้องปฏิเสธด้วย HTTP 400 Bad Request พร้อม Error Code `RESOLUTION_GATE_FAILED`
- **BR-09 (Advisory Nature of Requester Resolution):** การกดปุ่ม "Problem Appears Resolved" ของ Requester มีผลเพียงการบันทึกแฟล็ก `problemResolvedReported = true` และเพิ่ม Public Comment อัตโนมัติเท่านั้น จะไม่มีผลทำให้สถานะทางการของตั๋วเปลี่ยนเป็น `Resolved` จนกว่า IT Staff จะเป็นผู้ตรวจสอบและเปลี่ยนสถานะ
- **BR-10 (State Transition Matrix Compliance):** การปรับปรุงสถานะตั๋วต้องเป็นไปตาม Status Transition Matrix ที่กำหนดไว้อย่างเคร่งครัด การข้ามสถานะที่ไม่ได้รับอนุญาต (เช่น จาก `New` ไปเป็น `Resolved` โดยไม่ผ่านขั้นตอนตรวจสอบ) จะต้องถูกปฏิเสธด้วย HTTP 400 Bad Request
- **BR-11 (Optimistic Concurrency & Stale Updates):** การแก้ไขสถานะตั๋วหรือ Actions Taken จะต้องส่งค่า Timestamp `updatedAt` ล่าสุดของระเบียนข้อมูลมาตรวจสอบเสมอ หากข้อมูลในระบบถูกปรับปรุงโดยผู้ใช้อื่นไปก่อนหน้า ระบบจะต้องปฏิเสธด้วย HTTP 409 Conflict และแจ้งให้ผู้ใช้โหลดข้อมูลล่าสุดก่อนทำรายการใหม่

### 5.3 Dashboard Calculation & Isolation Rules
- **BR-12 (Requester Dashboard Data Isolation):** ข้อมูลสถิติและรายการตั๋วบน Requester Dashboard จะต้องถูกคำนวณและกรองเฉพาะตั๋วที่ `requesterId = currentUser.id` เท่านั้น ผู้แจ้งต้องไม่สามารถมองเห็นข้อมูลสถิติหรือตั๋วของผู้แจ้งท่านอื่น
- **BR-13 (Authoritative Backend Metrics):** ค่าสถิติทั้งหมดบนแดชบอร์ด (เช่น จำนวนตั๋วในแต่ละสถานะ, การจัดกลุ่มตาม Priority) จะต้องคำนวณด้วยฟังก์ชันรวม (Aggregation) บนฐานข้อมูล PostgreSQL ผ่าน Backend API ห้ามทำการนับหรือกรองข้อมูลเฉพาะส่วนที่แสดงผลบนหน้าจอไคลเอนต์
- **BR-14 (Dashboard Metric Boundaries):** การแสดงผล "Recently Updated Tickets" และ "Recently Resolved Tickets" จะดึงตั๋วที่มีการอัปเดตล่าสุดไม่เกิน 5 รายการ โดยเรียงลำดับจาก `updatedAt` จากใหม่ไปเก่า
- **BR-15 (Administrator Operational & Analytical Privileges):** Administrator มีสิทธิ์เข้าถึงหน้า IT Staff Dashboard ได้อย่างสมบูรณ์ และมีสิทธิ์เรียกดูข้อมูลสรุปจำนวนผู้ใช้งานระบบแยกตามบทบาทและสถานะการเปิดใช้งาน

---

## 6. Ticket Status Transition Matrix

| สถานะปัจจุบัน (Current Status) | สถานะถัดไปที่อนุญาต (Permitted Next Status) | บทบาทที่ได้รับอนุญาต (Permitted Roles) | เงื่อนไขเพิ่มเติมและข้อกำหนด (Conditions / Rules) |
| :--- | :--- | :--- | :--- |
| **New** | Open, In Progress, Cancelled | IT Staff, Admin | เปลี่ยนเป็น `Open` เมื่อ Claim/Assign เจ้าของตั๋ว, เปลี่ยนเป็น `Cancelled` หากเป็นตั๋วซ้ำหรือไม่ถูกต้อง |
| **Open** | In Progress, Waiting for Requester, Resolved, Cancelled | IT Staff, Admin | เปลี่ยนเป็น `In Progress` เมื่อเริ่มปฏิบัติงาน, เปลี่ยนเป็น `Resolved` ได้เมื่อผ่าน **Resolution Gate (BR-08)** |
| **In Progress** | Waiting for Requester, Resolved, Cancelled | IT Staff, Admin | เปลี่ยนเป็น `Waiting for Requester` เมื่อรอข้อมูล, เปลี่ยนเป็น `Resolved` ได้เมื่อผ่าน **Resolution Gate (BR-08)** |
| **Waiting for Requester** | In Progress, Resolved, Cancelled | IT Staff, Admin | เปลี่ยนกลับเป็น `In Progress` เมื่อได้ข้อมูลครบ, หรือเปลี่ยนเป็น `Resolved` เมื่อผ่าน **Resolution Gate (BR-08)** |
| **Resolved** | Closed, Reopened | IT Staff, Admin | เปลี่ยนเป็น `Closed` เมื่อการแก้ปัญหาเสร็จสมบูรณ์, เปลี่ยนเป็น `Reopened` หากผู้แจ้งพบว่าปัญหายังคงอยู่ |
| **Closed** | Reopened | IT Staff, Admin | เปิดตั๋วซ้ำกรณีปัญหาเดิมเกิดขึ้นอีก |
| **Reopened** | In Progress, Waiting for Requester, Resolved, Cancelled | IT Staff, Admin | นำตั๋วกลับเข้าสู่กระบวนการแก้ไขปัญหา |
| **Cancelled** | Reopened | IT Staff, Admin | กู้คืนตั๋วที่ถูกยกเลิกกลับเข้าสู่กระบวนการ |

*(หมายเหตุ: Requester ไม่มีสิทธิ์เปลี่ยนสถานะตั๋วใน Matrix นี้โดยตรง ทำได้เพียงส่งสัญญาณแจ้งผ่านฟังก์ชัน "Problem Appears Resolved" ตามกฎ BR-09)*

---

## 7. Authorization Matrix

| สิทธิ์และฟังก์ชันการทำงาน (Operation / Resource) | Requester (เจ้าของตั๋ว) | Requester (ไม่ใช่เจ้าของ) | IT Staff | Administrator | ผู้ใช้ที่ไม่ล็อกอิน (Anonymous) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Actions Taken: เรียกดูรายการ (View Actions)** | ✅ (Read-only) | ❌ (403/404) | ✅ | ✅ | ❌ (401) |
| **Actions Taken: สร้างรายการใหม่ (Create Action)** | ❌ (403) | ❌ (403) | ✅ | ✅ | ❌ (401) |
| **Actions Taken: แก้ไขรายการเดิม (Update Action)** | ❌ (403) | ❌ (403) | ✅ | ✅ | ❌ (401) |
| **Actions Taken: ลบรายการ (Delete Action)** | ❌ (403) | ❌ (403) | ❌ (ห้ามลบ) | ❌ (ห้ามลบ) | ❌ (401) |
| **Ticket Status: เปลี่ยนเป็น Resolved** | ❌ (403) | ❌ (403) | ✅ (ผ่าน Gate) | ✅ (ผ่าน Gate) | ❌ (401) |
| **Ticket Status: เปลี่ยนสถานะอื่นๆ ตาม Matrix** | ❌ (403) | ❌ (403) | ✅ | ✅ | ❌ (401) |
| **Requester Dashboard: เข้าถึงและดูข้อมูล** | ✅ (เฉพาะตนเอง) | ❌ | ❌ (ใช้ Staff Dash) | ❌ (ใช้ Staff Dash) | ❌ (401) |
| **IT Staff Dashboard: เข้าถึงและดูข้อมูล** | ❌ (403) | ❌ (403) | ✅ | ✅ | ❌ (401) |
| **Administrator User Management (Lab 3)** | ❌ (403) | ❌ (403) | ❌ (403) | ✅ | ❌ (401) |
| **Ticket CRUD & Attachments (Lab 1-3 Regression)**| ✅ (เฉพาะตนเอง) | ❌ (403/404) | ✅ | ✅ | ❌ (401) |
| **Public Comments / Internal Notes (Lab 3)** | ✅ (เฉพาะ Public) | ❌ (403/404) | ✅ (ทั้งสองส่วน) | ✅ (ทั้งสองส่วน) | ❌ (401) |

---

## 8. UI Specification Summary (อ้างอิง `ui-spec.md`)

- **Design Standard & Tokens:** สืบทอดมาตรฐาน **Zen Green Theme** อย่างเคร่งครัด ใช้สี Primary Green (`#006B3C`), Secondary Green (`#0B7A46`), พื้นหลังสว่างสบายตา (`#F4FBF7` / `#F5F7F6`), และเส้นขอบละมุน (`#E2E8F0`)
- **Navigation Shell & Active State:**
  - Requester: เมนู `Dashboard` (หน้าแรกเริ่มต้น) และ `My Tickets`, `Create Ticket`
  - IT Staff: เมนู `Dashboard` (หน้าแรกเริ่มต้น) และ `Ticket Queue`
  - Administrator: เมนู `Dashboard` (หน้าแรกเริ่มต้น), `Ticket Queue`, และ `User Management`
  - ทุกเมนูมีเส้นใต้หรือแถบไฮไลต์สีเขียวระบุสถานะ Active ชัดเจน
- **IT Staff Dashboard:**
  - ส่วนหัวต้อนรับ: "Welcome back, {Name}!" พร้อมปุ่ม Refresh ข้อมูล
  - แถวการ์ดตัวเลขสรุป (Metric Cards): New, Open, In Progress, Waiting for Requester, และ My Assigned พร้อมแสดงการเปรียบเทียบหรือลิงก์ Drill-down คลิกเพื่อเปิด Queue ตามฟิลเตอร์นั้นๆ ทันที
  - ส่วนจัดวาง 2 คอลัมน์บน Desktop: ด้านซ้ายแสดงตาราง My Recent Tickets (5 รายการล่าสุดที่ตนเองรับผิดชอบ) และด้านขวาแสดง Quick Actions (Create Ticket, Search Tickets, My Queue) ร่วมกับสรุปจำนวนตั๋วตามระดับ Priority
  - ส่วนแสดงผลพิเศษสำหรับ Administrator: การ์ดสรุปจำนวนผู้ใช้งานระบบ (Total Active Users, Staff, Requesters, Admins)
- **Requester Dashboard:**
  - ส่วนหัวต้อนรับ: "Welcome, {Name}!"
  - แถวการ์ดตัวเลขสรุป 4 ใบ: My Open Tickets, In Progress, Resolved, และ Closed พร้อมปุ่ม "View all" ลิงก์ตรงไปยัง `/my-tickets?status=...`
  - ส่วนแสดงรายการ My Recent Tickets (5 รายการล่าสุดของผู้แจ้ง) และกล่อง Quick Actions
- **Actions Taken UI บนหน้า Ticket Detail:**
  - จัดวางเป็นเซกชันเด่นชัดต่อจากส่วนสรุปรายละเอียดปัญหาและไฟล์แนบ
  - ส่วนหัวระบุ "Actions Taken" พร้อม Badge แสดงจำนวนรายการทั้งหมด และปุ่ม `+ Add Action Taken` (แสดงเฉพาะ IT Staff และ Admin)
  - รายการ Actions Taken: แสดง Date/Time, Description, Result, Performed By Badge, Follow-Up Badge (สีส้มเมื่อมีงานติดตามผล พร้อมแสดง Follow-up Note), และไอคอนแสดง Attachment Notes
  - ในมุมมองของ Requester: แสดงรายการทั้งหมดอย่างครบถ้วนเพื่อความโปร่งใส แต่แสดงผลเป็นโหมดอ่านอย่างเดียว (Read-only) โดยซ่อนปุ่ม Add และ Edit
  - Modal/Drawer สำหรับเพิ่มและแก้ไข Action Taken: มีฟิลด์กรอกข้อมูลครบถ้วน, สวิตช์เปิด-ปิด Follow-Up Required ซึ่งจะแสดงช่องกรอก Follow-up Note แบบบังคับเมื่อเปิดสวิตช์, ช่องระบุ Attachment Notes, และปุ่ม Save Action พร้อม Loading Spinner ป้องกันการคลิกซ้ำ
- **Resolution Gate & Concurrency Feedback:**
  - หากเจ้าหน้าที่พยายามเปลี่ยนสถานะเป็น `Resolved` บนตั๋วที่ยังไม่มีบันทึก Actions Taken หรือยังไม่มีเจ้าของ ระบบจะแสดงข้อความเตือนสีแดงชัดเจนและไม่อนุญาตให้บันทึก
  - หากเกิด Concurrency Conflict (HTTP 409) จะมี Modal แจ้งเตือน: *"ตั๋วนี้ได้รับการอัปเดตโดยผู้ใช้อื่นแล้ว โปรดรีเฟรชข้อมูลล่าสุด"*
- **Responsive & Accessibility Safeguards:**
  - รองรับ Desktop (≥992px), Tablet (768–991px), และ Mobile (<768px)
  - บนหน้าจอมือถือ ตาราง Actions Taken จะแปลงเป็นการ์ดแนวตั้ง (Stacked Cards) เพื่อป้องกันปัญหาหน้าจอล้นแนวนอน (No horizontal overflow: `scrollWidth === clientWidth`)
  - รองรับ Keyboard Focus Rings, มี ARIA Labels สำหรับปุ่มไอคอน, และป้ายสถานะมีข้อความกำกับคู่กับสีเสมอ

---

## 9. Data Changes & Migration Strategy

### 9.1 Database Schema (Prisma PostgreSQL Increment)

ต่อยอดจาก Schema เดิมของ Lab 3 โดยเพิ่มโมเดล `ActionTaken` และเชื่อมโยงความสัมพันธ์ไปยัง `Ticket` และ `User`:

```prisma
model ActionTaken {
  id                Int      @id @default(autoincrement())
  ticketId          Int
  ticket            Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  actionDateTime    DateTime @default(now())
  actionDescription String   @db.VarChar(2000)
  result            String   @db.VarChar(2000)
  
  performedById     Int
  performedBy       User     @relation("StaffActionsTaken", fields: [performedById], references: [id])
  
  followUpRequired  Boolean  @default(false)
  followUpNote      String?  @db.VarChar(1000)
  attachmentNotes   String?  @db.VarChar(500)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([ticketId])
  @@index([performedById])
}
```

และเพิ่มความสัมพันธ์ย้อนกลับ (Reverse Relations) ในโมเดลเดิม:
- ในโมเดล `User`: เพิ่ม `actionsTaken ActionTaken[] @relation("StaffActionsTaken")`
- ในโมเดล `Ticket`: เพิ่ม `actionsTaken ActionTaken[]`

### 9.2 Justification of Database Design Decisions (ตามข้อกำหนด Section 5.1 อย่างน้อย 2 ข้อ)

1. **การออกแบบความสัมพันธ์ Parent-Child (1:N) ระหว่าง Ticket และ ActionTaken พร้อม Indexing:**
   - *เหตุผล:* สอดคล้องกับข้อกำหนด BR-01 และ BR-02 ที่ตั๋ว 1 ใบอาจต้องผ่านการแก้ไขหลายขั้นตอนโดยเจ้าหน้าที่หลายคน การแยกตารางช่วยรักษา First Normal Form (1NF), ความสมบูรณ์เชิงสัมพันธ์ (Referential Integrity) และประวัติการทำงานย้อนหลัง (Auditability) โดยไม่จำกัดจำนวนรายการ
   - *ประสิทธิภาพ:* การสร้างดัชนี (Index) บนคอลัมน์ `ticketId` และ `performedById` ช่วยให้การสืบค้นรายการ Actions ภายใต้ตั๋ว และการคำนวณสถิติ Actions ของเจ้าหน้าที่แต่ละคนบน Dashboard ทำงานได้อย่างรวดเร็วในระดับ $O(\log N)$
2. **การแยกฟิลด์ `followUpRequired` (Boolean) และ `followUpNote` (Nullable VarChar):**
   - *เหตุผล:* การใช้ฟิลด์แบบมีโครงสร้าง (Structured Fields) แทนการรวมข้อความทั้งหมดไว้ใน Description เพียงช่องเดียว ช่วยให้ระบบสามารถบังคับใช้ Business Rule (BR-06) ในระดับ Data Integrity และเปิดโอกาสให้ Backend สามารถเขียน Query เพื่อคัดกรองตั๋วที่มีงานค้างต้องติดตามผล (`WHERE followUpRequired = true`) นำไปแสดงผลบน Dashboard หรือ Queue ได้อย่างมีประสิทธิภาพโดยไม่ต้องใช้ Full-text search
3. **การใช้ Timestamp `updatedAt` เป็น Concurrency Token:**
   - *เหตุผล:* เพื่อตอบสนองข้อกำหนด Section 6.1 ในการตรวจจับ Stale Updates โดยไม่ต้องเพิ่มคอลัมน์ version พิเศษ การเปรียบเทียบค่า `updatedAt` ระหว่างไคลเอนต์และเซิร์ฟเวอร์ช่วยป้องกันปัญหาการเขียนข้อมูลทับซ้อน (Lost Update Problem) เมื่อมีเจ้าหน้าที่เปิดตั๋วใบเดียวกันพร้อมกัน

### 9.3 Migration, Backfill & Rollback Plan (ตาม Section 5.2)
- **Preservation of Existing Data:** การเพิ่มตาราง `ActionTaken` เป็นการต่อขยายแบบ Additive ไม่มีการลบหรือดัดแปลงโครงสร้างตารางเดิม ข้อมูลตั๋ว, ผู้ใช้งาน, ไฟล์แนบ, คอมเมนต์ และโน้ตจาก Lab 1-3 จะยังคงอยู่ครบถ้วน 100%
- **Legacy Tickets Behavior:** ตั๋วเดิมที่มีอยู่ก่อนหน้าจะมีจำนวน Actions Taken เท่ากับ 0 รายการ ซึ่งระบบยังคงแสดงผลได้ตามปกติ แต่หากเจ้าหน้าที่จะทำการเปลี่ยนสถานะตั๋วเดิมเป็น `Resolved` จะต้องปฏิบัติตามกฎ Resolution Gate โดยบันทึก Action Taken ก่อนอย่างน้อย 1 รายการ
- **Dashboard Treatment of Existing Records:** ฟังก์ชันการนับสถิติบน Dashboard จะนับรวมตั๋วเดิมและตั๋วใหม่ตามสถานะและความเป็นเจ้าของได้อย่างถูกต้องโดยไม่มีข้อผิดพลาด
- **Rollback Approach:** หากเกิดปัญหา สามารถ Rollback Migration ได้ด้วยคำสั่ง `npx prisma migrate resolve` หรือดรอปเฉพาะตาราง `ActionTaken` โดยไม่กระทบต่อข้อมูลหลักของระบบ

### 9.4 Seed Data Requirements (Idempotent - ตาม Section 5.3)
- ปรับปรุงสคริปต์ `server/prisma/seed.ts` ให้รันซ้ำได้อย่างปลอดภัย (Idempotent ด้วยคำสั่ง `upsert`)
- สร้างข้อมูลตั๋วที่ครอบคลุมสถานะหลักทั้งหมด (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`)
- สร้างข้อมูลตั๋วที่มีทั้งแบบมีผู้รับผิดชอบ (Assigned) และไม่มีผู้รับผิดชอบ (Unassigned)
- สร้างข้อมูลตั๋วที่มีบันทึก Actions Taken หลากหลายรูปแบบ:
  - ตั๋วที่มี 0 Actions Taken (เพื่อทดสอบ Resolution Gate Blocking)
  - ตั๋วที่มี 1 Action Taken
  - ตั๋วที่มีมากกว่า 1 Actions Taken และบันทึกโดยเจ้าหน้าที่ต่างคนกัน (เพื่อทดสอบ BR-02)
  - ตั๋วที่มี `followUpRequired = true` พร้อมโน้ตติดตามผล
- จัดเตรียมข้อมูลให้เพียงพอสำหรับการทดสอบทั้งกรณีที่ Dashboard แสดงค่าตัวเลขเป็น 0 และค่ามากกว่า 0

---

## 10. API Contract Summary (อ้างอิง `api-spec.md`)

### 10.1 Actions Taken Endpoints
- `GET /api/v1/tickets/:ticketId/actions`: ดึงรายการ Actions Taken ภายใต้ตั๋ว (Requester เข้าถึงได้เฉพาะตั๋วตนเองแบบ Read-only, IT Staff/Admin เข้าถึงได้ทุกตั๋ว)
- `POST /api/v1/tickets/:ticketId/actions`: สร้าง Action Taken ใหม่ (อนุญาตเฉพาะ Active IT Staff/Admin; ผูก `performedById` จากเซสชันอัตโนมัติ; บังคับกรอก `followUpNote` หาก `followUpRequired = true`)
- `PUT /api/v1/tickets/:ticketId/actions/:actionId`: ปรับปรุง Action Taken (อนุญาตเฉพาะ Active IT Staff/Admin; มีการตรวจสอบ Concurrency Timestamp)

### 10.2 Workflow, Resolution Gate & Conflict Handling
- `PATCH /api/v1/staff/tickets/:id/status`: ปรับปรุงสถานะตั๋วงาน
  - บังคับใช้ State Transition Matrix
  - ตรวจสอบเงื่อนไข **Resolution Gate**: หากขอเปลี่ยนเป็น `Resolved` แต่ตั๋วไม่มี `assignedStaffId` หรือมี Actions Taken เป็น 0 จะตอบกลับด้วย HTTP 400 Bad Request (`RESOLUTION_GATE_FAILED`)
  - ตรวจสอบ Concurrency: หากค่า `updatedAt` ไม่ตรงกับฐานข้อมูล ตอบกลับด้วย HTTP 409 Conflict (`STALE_RECORD_CONFLICT`)
- `POST /api/v1/tickets/:id/resolve-indication`: Requester ส่งสัญญาณว่าปัญหาได้รับการแก้ไขแล้ว (คงฟังก์ชันเดิมจาก Lab 3: ปรับแฟล็กและสร้าง Public Comment โดยไม่เปลี่ยนสถานะทางการ)

### 10.3 Dashboard Endpoints
- `GET /api/v1/dashboards/requester`: ดึงข้อมูลสรุปสำหรับ Requester (Metrics: Open, In Progress, Waiting for Requester, Resolved, Closed; RecentTickets 5 รายการ; กรองเฉพาะ `requesterId = currentUser.id`)
- `GET /api/v1/dashboards/staff`: ดึงข้อมูลสรุปสำหรับ IT Staff และ Admin (Metrics: New, Open, In Progress, Waiting for Requester, My Assigned, Unassigned; Tickets by Priority; My Recent Tickets 5 รายการ; และหากเป็น Admin จะมีฟิลด์ `adminSummary` สรุปจำนวนบัญชีผู้ใช้เพิ่มเติม)

---

## 11. Acceptance Criteria (AC)

- **AC-01 (Create Action Taken Success):** Given ผู้ใช้ที่มีสิทธิ์เป็น IT Staff หรือ Administrator และข้อมูล Action Taken ที่ถูกต้อง When ทำการสร้าง Action Taken ภายใต้ตั๋ว Then ข้อมูลจะถูกบันทึกสำเร็จลงฐานข้อมูล โดยผูกกับตั๋วที่ถูกต้อง และระบบกำหนด `performedBy` เป็นตัวตนของผู้สร้างจากเซสชันอัตโนมัติ
- **AC-02 (Immutable Performer Binding):** Given คำขอสร้างหรือแก้ไข Action Taken จากไคลเอนต์ที่มีการแนบ `performedById` ปลอมแปลงมาใน Request Body When เซิร์ฟเวอร์ประมวลผลคำขอ Then เซิร์ฟเวอร์จะต้องเพิกเฉยต่อค่าที่ส่งมา และใช้ ID ของผู้ใช้ปัจจุบันจากเซสชันเท่านั้น
- **AC-03 (Conditional Follow-up Note Validation):** Given เจ้าหน้าที่กำลังสร้างหรือแก้ไข Action Taken โดยกำหนด `followUpRequired = true` When ไม่ได้ระบุ `followUpNote` หรือระบุเป็นค่าว่าง Then ระบบจะต้องปฏิเสธคำขอด้วย HTTP 400 Bad Request พร้อมข้อความแจ้งเตือนข้อผิดพลาด
- **AC-04 (Update Action Taken):** Given เจ้าหน้าที่ IT Staff หรือ Administrator ที่มีสถานะ Active และ Action Taken ที่มีอยู่จริง When ส่งคำขอปรับปรุงข้อมูล Description หรือ Result พร้อมค่า Timestamp ที่ถูกต้อง Then ข้อมูลจะถูกอัปเดตลงฐานข้อมูลสำเร็จ และค่า `updatedAt` ถูกปรับเป็นเวลาปัจจุบัน
- **AC-05 (Requester Read-Only Visibility):** Given ผู้ใช้ที่เป็น Requester เข้าดูหน้ารายละเอียดตั๋วที่ตนเองเป็นเจ้าของ When ตั๋วใบนั้นมีรายการ Actions Taken บันทึกอยู่ Then ผู้ใช้จะต้องสามารถมองเห็นรายการ Actions Taken ทั้งหมดได้ แต่ต้องไม่มีปุ่มหรือเครื่องมือสำหรับสร้าง แก้ไข หรือลบ Actions Taken ปรากฏบนหน้าจอ
- **AC-06 (Requester Action Creation Rejection):** Given ผู้ใช้ที่เป็น Requester พยายามส่งคำขอ POST หรือ PUT ไปยัง Endpoint ของ Actions Taken When คำขอส่งมาถึงเซิร์ฟเวอร์ Then เซิร์ฟเวอร์จะต้องปฏิเสธด้วย HTTP 403 Forbidden
- **AC-07 (Inactive Staff Rejection):** Given ผู้ใช้ที่มีบทบาท IT Staff แต่มีสถานะถูกระงับการใช้งาน (`isActive = false`) When พยายามสร้างหรือแก้ไข Actions Taken หรือถูกระบุในการดำเนินงาน Then ระบบจะต้องปฏิเสธการทำรายการด้วย HTTP 403 Forbidden
- **AC-08 (Resolution Gate Enforcement):** Given ตั๋วงานที่ยังไม่มีผู้รับผิดชอบหลัก (`assignedStaffId = null`) หรือยังไม่มีบันทึก Actions Taken (`actionsCount = 0`) When เจ้าหน้าที่ IT Staff พยายามปรับสถานะตั๋วเป็น `Resolved` Then เซิร์ฟเวอร์จะต้องปฏิเสธการทำรายการด้วย HTTP 400 Bad Request และตั๋วจะต้องคงสถานะเดิมไว้
- **AC-09 (Successful Ticket Resolution):** Given ตั๋วงานที่มีผู้รับผิดชอบหลักเรียบร้อยแล้วและมีบันทึก Actions Taken อย่างน้อย 1 รายการ When เจ้าหน้าที่ IT Staff ส่งคำขอเปลี่ยนสถานะตั๋วเป็น `Resolved` Then ระบบจะต้องอัปเดตสถานะตั๋วเป็น `Resolved` สำเร็จ
- **AC-10 (State Transition Matrix Compliance):** Given ตั๋วงานที่อยู่ในสถานะใดๆ When มีการส่งคำขอเปลี่ยนสถานะที่ไม่ได้รับอนุญาตตาม Matrix (เช่น จาก `New` ไปเป็น `Resolved` โดยตรง) Then ระบบจะต้องปฏิเสธการทำรายการด้วย HTTP 400 Bad Request
- **AC-11 (Optimistic Concurrency & Stale Update Conflict):** Given ผู้ใช้เปิดดูตั๋วหรือ Action Taken และมีผู้ใช้อื่นเข้ามาแก้ไขข้อมูลนั้นในฐานข้อมูลไปก่อนหน้า When ผู้ใช้คนแรกพยายามส่งคำขออัปเดตด้วย Timestamp เดิม Then เซิร์ฟเวอร์จะต้องส่งคืน HTTP 409 Conflict และระบบจะต้องแสดงข้อความแจ้งเตือนให้รีเฟรชข้อมูล
- **AC-12 (Advisory Problem Resolution Signal):** Given Requester กดส่งสัญญาณ "Problem Appears Resolved" บนตั๋วของตนเอง When เซิร์ฟเวอร์ประมวลผลคำขอ Then ระบบจะบันทึกแฟล็ก `problemResolvedReported = true` และสร้าง Public Comment อัตโนมัติ โดยที่สถานะทางการของตั๋วจะยังไม่เปลี่ยนเป็น `Resolved`
- **AC-13 (Requester Dashboard Data Isolation):** Given ผู้ใช้ที่เป็น Requester เข้าสู่หน้า Dashboard When ระบบโหลดข้อมูลสถิติและรายการตั๋วล่าสุด Then ระบบจะต้องแสดงผลเฉพาะตัวเลขและรายชื่อตั๋วที่ผู้ใช้เป็นเจ้าของเท่านั้น
- **AC-14 (Requester Dashboard Drill-down):** Given ผู้ใช้อยู่บนหน้า Requester Dashboard When ผู้ใช้คลิกการ์ดตัวเลขสรุปหรือลิงก์ "View all" Then ระบบจะต้องนำทางไปยังหน้า `/my-tickets` พร้อมแนบ Query Parameter สำหรับกรองสถานะที่ถูกต้อง
- **AC-15 (IT Staff & Admin Dashboard Accuracy):** Given เจ้าหน้าที่ IT Staff หรือ Administrator เข้าสู่หน้า Dashboard When ระบบดึงข้อมูลสรุป Then ตัวเลขในแต่ละการ์ด (New, Open, In Progress, Waiting for Requester, My Assigned, Unassigned) จะต้องตรงกับจำนวนข้อมูลจริงในฐานข้อมูล และมีปุ่ม Quick Actions ที่ทำงานได้ถูกต้อง
- **AC-16 (Zero Regression across Labs 1 to 3):** Given ระบบที่ได้รับการอัปเกรดฟีเจอร์ของ Lab 4 ครบถ้วนแล้ว When ดำเนินการทดสอบฟังก์ชันทั้งหมดจาก Lab 1 ถึง Lab 3 (Authentication, RBAC, Ticket CRUD, Attachments, Comments, Notes, Admin User Management) Then ทุกฟังก์ชันและชุดทดสอบเดิมทั้งหมดจะต้องทำงานได้ถูกต้อง 100% โดยไม่มีข้อผิดพลาด

---

## 12. Product Definition of Done (DoD)

1. **Engineering Contract & Documentation:**
   - เอกสารครบถ้วนในไดเรกทอรี `docs/lab-04/` ได้แก่ `specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, `reviewer.md`, และ `ai-use.md`
   - ข้อกำหนดได้รับการจัดทำและผ่านการอนุมัติก่อนเริ่มการพัฒนาโค้ดส่วนฟังก์ชันจริง
2. **Git Workflow & Peer Review:**
   - การพัฒนาโค้ดถูกแบ่งเป็น Feature Branches ตามแต่ละ Issue อย่างชัดเจน
   - มีการเปิด Pull Request (PR) พร้อมบันทึกหลักฐานการ Review และคำติชมใน `docs/lab-04/reviewer.md` ก่อนรวมเข้ากิ่ง `lab4-staging` และรวมเข้าสู่ `main`
   - ทุก Issue บนกระดาน GitHub Projects / Kanban ถูกย้ายเข้าสู่สถานะ "Done" ครบถ้วน
3. **Automated Testing & Full Coverage:**
   - มีชุดทดสอบอัตโนมัติครบทุกระดับ: Unit Tests, API/Integration Tests, Client Component Tests, และ Playwright E2E Tests ตามโครงสร้าง Section 12 ของเอกสารแล็บ
   - ชุดทดสอบทั้งหมด 100% ต้องรันผ่านเป็นสีเขียว (Pass) บนกิ่ง `main` โดยไม่มีการ Skip หรือแก้ไขผลลัพธ์เพื่อหลบเลี่ยงการตรวจสอบ
4. **Data Integrity & Idempotent Seeding:**
   - ฐานข้อมูล PostgreSQL ได้รับการขยายโครงสร้างด้วย Prisma Migration อย่างถูกต้องโดยไม่สูญเสียข้อมูลเดิมจาก Lab 1-3
   - สคริปต์ `seed.ts` เป็นแบบ Idempotent สามารถรันซ้ำได้ปลอดภัย และสร้างข้อมูลทดสอบครบทุกเงื่อนไข
5. **Security, Authorization & Concurrency:**
   - Backend API บังคับใช้การตรวจสอบสิทธิ์ (Authorization) ครบทุก Endpoint โดยไม่พึ่งพาเพียงการซ่อนปุ่มบน UI
   - มีกลไกป้องกัน Stale Update ด้วย HTTP 409 Conflict
   - ไม่มีการเปิดเผย Sensitive Data หรือ Stack Trace สู่ภายนอก
6. **Zen Green UI & Accessibility:**
   - ส่วนติดต่อผู้ใช้สร้างตามแนวทาง Zen Green Theme อย่างกลมกลืน
   - ผ่านการทดสอบ Responsive บน Desktop, Tablet, และ Mobile โดย**ไม่มีแถบเลื่อนแนวนอน (No Horizontal Scrollbar)** โดยเด็ดขาด
   - ป้ายสถานะมีทั้งสีและข้อความประกอบ และรองรับการนำทางด้วย Keyboard
7. **Submission Evidence Readiness:**
   - รวบรวมภาพถ่ายหน้าจอหลักฐานครบถ้วนในโฟลเดอร์ `artifacts/lab-04/screenshots/`
   - จัดเตรียมเนื้อหารายงาน 9 ส่วน (Answer Part 1 ถึง Part 9) ตามข้อกำหนดใน Section 14 สำหรับการจัดทำเล่มรายงานฉบับสมบูรณ์

---

## 13. Assumptions and Technical Decisions

1. **Resolution Gate Rule Definition:** ตั๋วจะถูกระงับไม่ให้เปลี่ยนสถานะเป็น `Resolved` เว้นแต่จะมี Ticket Owner และมี Actions Taken บันทึกไว้อย่างน้อย 1 รายการ เพื่อรับประกันว่าปัญหาได้รับการตรวจสอบและลงมือแก้ไขจริงก่อนปิดงาน
2. **Optimistic Concurrency Strategy:** เลือกใช้วิธีการส่งและตรวจสอบฟิลด์ `updatedAt` ในระดับ Record เพื่อป้องกันปัญหา Stale Overwrite ซึ่งเป็นแนวทางมาตรฐานที่มีประสิทธิภาพสูง ไม่ต้องสร้างคอลัมน์ Version พิเศษ และรองรับการทำงานร่วมกับ Prisma ได้ทันที
3. **Recent Tickets Boundary:** กำหนดให้ส่วน Recent Tickets บนทั้ง Requester Dashboard และ IT Staff Dashboard แสดงรายการตั๋วล่าสุดจำนวน 5 รายการ โดยเรียงลำดับจาก `updatedAt DESC` เพื่อความกระชับและไม่ทำให้หน้าจอแสดงผลรกเกินไป
4. **Administrator Dashboard Structure:** เพื่อให้สอดคล้องกับแนวคิด Minimalist และความต้องการของระบบ Admin Dashboard จะนำคอมโพเนนต์ IT Staff Dashboard มาใช้เป็นแกนหลัก และเสริมการ์ดสรุปจำนวนผู้ใช้งานระบบ (User Account Summary) เข้าไป เพื่อให้แอดมินสามารถติดตามทั้งงานบริการไอทีและงานบริหารผู้ใช้ได้ในหน้าเดียว
5. **Mobile Layout for Actions Taken:** เพื่อป้องกันการเกิด Scrollbar แนวนอนบนหน้าจอมือถือ (< 768px) รายการ Actions Taken จะถูกสลับการแสดงผลจากตาราง (Table View) มาเป็นการ์ดแนวตั้ง (Stacked Card View) ที่จัดวางข้อมูล Date/Time, Description, Result, และ Badges อย่างเป็นระเบียบ
