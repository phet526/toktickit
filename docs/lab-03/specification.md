# Lab 3 Sprint Engineering Specification: Users, Roles, IT Staff Ticketing, and Admin Screens

## 1. Sprint Goal
เป้าหมายของ Sprint 3 คือการยกระดับระบบ TokTickIT จากระบบทดสอบใน Lab 2 สู่ระบบที่รองรับการใช้งานจริง โดยแทนที่ตัวเลือกผู้ใช้จำลอง (Development Requester Selector) ด้วยระบบการยืนยันตัวตน (Authentication) และการกำหนดสิทธิ์ตามบทบาท (Role-Based Access Control: RBAC) ครอบคลุม 3 บทบาทหลัก ได้แก่ Requester, IT Staff, และ Administrator พร้อมเพิ่มระบบคิวงานและการจัดการตั๋วสำหรับ IT Staff (IT Staff Queue & Operations), ระบบสื่อสารผ่าน Public Comments และ Internal Notes, และระบบจัดการผู้ใช้งานแบบ Minimalist สำหรับ Administrator โดยต้องคงความสมบูรณ์ของข้อมูลเดิมจาก Lab 2 (Zero Regression) และยึดมั่นในมาตรฐานการออกแบบ Zen Green Theme

## 2. Stakeholder Request Interpretation
Stakeholder ต้องการนำระบบเข้าสู่สภาพแวดล้อมการทำงานจริง จึงจำเป็นต้องยกเลิก Development Requester Selector และติดตั้งระบบ Login ด้วยอีเมลและรหัสผ่านที่ปลอดภัย โดยกำหนดให้ผู้ใช้ที่มีรหัสผ่านเริ่มต้น (Initial Password) ต้องเปลี่ยนรหัสผ่านทันทีในการเข้าสู่ระบบครั้งแรก (First-Login Password Change)

สำหรับฝั่งผู้ใช้งาน:
- **Requester:** ยังคงใช้งานฟังก์ชันเดิมจาก Lab 2 ได้ทั้งหมด (สร้างตั๋ว, ดูตั๋วของตนเอง, จัดการไฟล์แนบ) ภายใต้ตัวตนที่ผ่านการยืนยันตัวตนจริง และเพิ่มความสามารถในการโพสต์ Public Comments รวมถึงการกดส่งสัญญาณว่าปัญหาได้รับการแก้ไขแล้ว ("Problem Appears Resolved")
- **IT Staff:** ได้รับพื้นที่ทำงานหลักเป็น Ticket Queue ส่วนกลางเพื่อค้นหา กรอง จัดเรียง และเปิดดูตั๋วงาน สามารถกดรับงาน (Claim) หรือโอนงาน (Reassign) กำหนดระดับความสำคัญเชิงเทคนิค (IT Priority) อัปเดตสถานะตั๋วตาม Workflow สื่อสารกับผู้แจ้งผ่าน Public Comments และบันทึกข้อมูลปฏิบัติการผ่าน Internal Notes ที่ปลอดภัยจากการมองเห็นของ Requester
- **Administrator:** ได้รับหน้าจอ User Management ที่เรียบง่าย เพื่อบริหารจัดการผู้ใช้ (ดูรายชื่อ, ค้นหา, กรองตามบทบาท, สร้างบัญชี, กำหนดบทบาท, แก้ไขข้อมูลพื้นฐาน, เปิด/ปิดการใช้งานบัญชี, และตั้งรหัสผ่านเริ่มต้นใหม่) โดยแยกขอบเขตหน้าที่ออกจากงานจัดการตั๋วของ IT Staff อย่างเด็ดขาด

ระบบต้องบังคับใช้การตรวจสอบสิทธิ์ที่ฝั่ง Server-side อย่างเคร่งครัด การซ่อนปุ่มบน UI ถือเป็นเพียง Feedback ไม่ใช่ระบบความปลอดภัย และต้องรักษาความต่อเนื่องของข้อมูลตั๋วและไฟล์แนบจาก Lab 2 ทั้งหมด

## 3. Scope

### Included
1. **Authentication & Session:**
   - หน้าจอ Login ตรวจสอบอีเมลและรหัสผ่าน พร้อมการแฮชรหัสผ่านที่ปลอดภัย (Bcrypt)
   - การจัดการ Session ผ่าน HTTP-only Signed Cookie (JWT) เพื่อป้องกันการรั่วไหลจาก XSS
   - กลไกบังคับเปลี่ยนรหัสผ่านในครั้งแรก (Mandatory First-Login Password Change) ก่อนเข้าสู่ระบบปกติ
   - ระบบ Logout เพื่อยกเลิกและทำลายคุกกี้เซสชัน
   - Application Shell ที่แสดงชื่อและบทบาทของผู้ใช้ปัจจุบัน พร้อม Navigation Bar ที่ปรับเปลี่ยนตามบทบาท (Role-based Navigation)
2. **Requester Regression & Extensions:**
   - การสืบทอดฟังก์ชันทั้งหมดของ Requester จาก Lab 2 (Create Ticket, My Tickets, Ticket Detail, Attachments) โดยผูกกับตัวตนที่แท้จริงจากระบบยืนยันตัวตน
   - เพิ่มการดูและโพสต์ Public Comments บนหน้า Ticket Detail
   - เพิ่มปุ่มแสดงสถานะ "Problem Appears Resolved" โดยบันทึกแฟล็กและเพิ่ม Public Comment อัตโนมัติ โดยไม่เปลี่ยนสถานะทางการเป็น Resolved/Closed โดยตรง
   - การลบ Development Requester Selector และ State ในเครื่องไคลเอนต์ออกอย่างสมบูรณ์
3. **IT Staff Workflows:**
   - หน้า Ticket Queue ส่วนกลาง พร้อมระบบค้นหา (Ticket No, Summary), กรองข้อมูล (Status, Category, Priority, Ownership), จัดเรียง (Sort), และแบ่งหน้า (Pagination)
   - หน้า IT Staff Ticket Detail แสดงข้อมูลแบบอ่านและแก้ไขตามสิทธิ์ (Editable vs Read-only)
   - การเคลมตั๋ว (Claim Ticket) และการเปลี่ยนผู้รับผิดชอบ (Reassign Ticket Owner)
   - การกำหนดและปรับเปลี่ยนระดับความสำคัญของฝ่ายไอที (IT Priority)
   - การเปลี่ยนสถานะตั๋วตาม State Transition Workflow ที่ได้รับอนุญาต
   - ระบบ Public Comments (สื่อสารร่วมกับ Requester) และ Internal Notes (เห็นเฉพาะ IT Staff และ Administrator) แบบ Append-only
4. **Administrator User Management (Minimalist):**
   - หน้ารายการผู้ใช้งาน (User List) แสดง Name, Email, Role, Status และปุ่ม Edit
   - ระบบค้นหาผู้ใช้ตามชื่อหรืออีเมล และตัวกรองบทบาท (Role Filter)
   - ฟอร์มสร้างผู้ใช้ใหม่ กำหนด 1 บทบาท (Requester, IT Staff, Administrator), สถานะเปิดใช้งาน, และ Initial Password ที่ Admin ป้อนเอง
   - ฟอร์มแก้ไขข้อมูลผู้ใช้ (ชื่อ, อีเมล, บทบาท, สถานะ Active/Inactive)
   - ฟังก์ชันตั้งรหัสผ่านเริ่มต้นใหม่ (Reset to Initial Password) โดย Admin ซึ่งบังคับให้ผู้ใช้ต้องเปลี่ยนรหัสผ่านในการล็อกอินครั้งถัดไป
   - กฎความปลอดภัยของแอดมิน: ป้องกันการปิดการใช้งานบัญชีตนเอง และป้องกันไม่ให้ระบบขาดแคลน Active Administrator
5. **Data Migration & Integrity:**
   - พัฒนา Schema จาก Lab 2 สู่โมเดล `User` และความสัมพันธ์ใหม่ โดยคงข้อมูลตั๋วและไฟล์แนบเดิมไว้ครบถ้วน
   - การ Seed ข้อมูลแบบ Idempotent ครอบคลุมผู้ใช้ทุกบทบาท (Active/Inactive), ตั๋วหลากหลายสถานะ, Public Comments และ Internal Notes โดยใช้รหัสผ่านเริ่มต้นเฉพาะในสภาพแวดล้อม Local/Dev (`Toktick2026!`)

### Excluded
- การส่งอีเมลจริงทุกรูปแบบ (Email invitations, Password-reset email, Verification email)
- การยืนยันตัวตนแบบหลายปัจจัย (MFA), Social Login, Single Sign-On (SSO)
- ระบบลงทะเบียนด้วยตนเองของผู้ใช้งานทั่วไป (Self-registration)
- ระบบ Actions Taken ของเจ้าหน้าที่ไอที (ยกยอดไปทำใน Lab 4 ตามข้อกำหนด)
- การคำนวณ SLA ทางการ, กฎ Escalation อัตโนมัติ, และระบบ Notification Services
- หน้า Dashboard วิเคราะห์สถิติและ KPI ขั้นสูง (อนุญาตเฉพาะตัวเลขนับจำนวนตั๋วบนคิวงาน)
- โครงสร้างแบบหลายองค์กร (Multi-tenant) และการแบ่งแผนก/ฝ่าย (Departments)
- การลบผู้ใช้แบบถาวร (User Deletion), การจัดการผู้ใช้แบบกลุ่ม (Bulk operations), การ Import/Export ข้อมูล
- การกำหนดหลายบทบาทให้ผู้ใช้คนเดียว (Multiple roles per user)
- ฟังก์ชันจัดการบัญชีขั้นสูง เช่น ประวัติการเปลี่ยนบทบาท (Role history), บันทึก Audit log ละเอียด, และระบบปลดล็อกบัญชีอัตโนมัติ

---

## 4. Functional Requirements (FR)

### Authentication & Session Management
- **FR-01:** ระบบจะต้องมีหน้า Login สำหรับตรวจสอบอีเมลและรหัสผ่าน โดยรองรับเฉพาะผู้ใช้งานที่มีสถานะ Active เท่านั้น
- **FR-02:** ผู้ใช้งานที่มีสถานะต้องเปลี่ยนรหัสผ่านเริ่มต้น (`mustChangePassword = true`) จะต้องถูกนำทางไปยังหน้า Change Password บังคับ และไม่สามารถเข้าถึงหน้าจออื่นของระบบได้จนกว่าจะเปลี่ยนรหัสผ่านสำเร็จ
- **FR-03:** ระบบจะต้องมี Endpoint สำหรับตรวจสอบข้อมูลตัวตนของผู้ใช้งานปัจจุบัน (Current User Identity & Role) เพื่อให้ Frontend ใช้กำหนดสิทธิ์การแสดงผล
- **FR-04:** ระบบจะต้องมีปุ่มและ Endpoint สำหรับ Logout เพื่อยกเลิกเซสชันของผู้ใช้ และป้องกันการเข้าถึงหน้าจอที่ต้องล็อกอินทันทีหลังออกจากระบบ
- **FR-05:** Application Shell จะต้องแสดงชื่อ-นามสกุลและบทบาทของผู้ใช้งานที่ล็อกอินอยู่บน Navigation Bar เสมอ

### Requester Regression & Operations
- **FR-06:** ระบบจะต้องยกเลิก Development Requester Selector และผูกการสร้างตั๋ว (Create Ticket) รวมถึงการเรียกดูตั๋ว (My Tickets) เข้ากับบัญชีผู้ใช้ที่ล็อกอินอยู่โดยอัตโนมัติ
- **FR-07:** Requester จะต้องสามารถเปิดดู Ticket Detail ของตั๋วที่ตนเองเป็นเจ้าของ พร้อมอ่านและโพสต์ Public Comments บนตั๋วดังกล่าวได้
- **FR-08:** Requester จะต้องสามารถกดส่งสัญญาณระบุว่าปัญหาได้รับการแก้ไขแล้ว ("Problem Appears Resolved") เพื่อบันทึกแฟล็ก `problemResolvedReported = true` พร้อมสร้าง Public Comment แจ้งความคืบหน้าให้ IT Staff ทราบโดยอัตโนมัติ

### IT Staff Ticket Queue & Detail Operations
- **FR-09:** ระบบจะต้องมีหน้า IT Staff Ticket Queue ที่แสดงตั๋วทั้งหมดในระบบ พร้อมแสดง Ticket No, Created Date, Summary, Category, Requested Priority, IT Priority, Status, และ Ticket Owner
- **FR-10:** Ticket Queue จะต้องรองรับการค้นหาข้อความ (Ticket No หรือ Summary), การกรอง (Status, Category, Priority, Owner), การจัดเรียงลำดับ (Sort), และการแบ่งหน้า (Pagination)
- **FR-11:** IT Staff จะต้องสามารถกดเคลมตั๋วที่ยังไม่มีเจ้าของ (Claim Ownership) เพื่อกำหนดให้ตนเองเป็น Ticket Owner ได้
- **FR-12:** IT Staff จะต้องสามารถโอนเปลี่ยนผู้รับผิดชอบตั๋ว (Reassign Ownership) ไปยัง IT Staff ท่านอื่นที่ Active อยู่ได้
- **FR-13:** IT Staff จะต้องสามารถปรับเปลี่ยนระดับความสำคัญของฝ่ายไอที (IT Priority) โดยที่ค่า Requested Priority ดั้งเดิมของผู้แจ้งยังคงเดิม
- **FR-14:** IT Staff จะต้องสามารถปรับเปลี่ยนสถานะตั๋ว (Ticket Status) ได้ตาม Status Transition Matrix ที่กำหนด
- **FR-15:** IT Staff จะต้องสามารถอ่านและสร้าง Internal Notes บนตั๋วงานได้ โดยบันทึกชื่อผู้เขียนและเวลาที่สร้างอัตโนมัติ

### Administrator User Management
- **FR-16:** ระบบจะต้องมีหน้า User Management แสดงรายชื่อผู้ใช้ทั้งหมด พร้อมระบุ Name, Email, Role, Status (Active/Inactive) และปุ่ม Edit
- **FR-17:** Administrator จะต้องสามารถค้นหาผู้ใช้ด้วยชื่อหรืออีเมล และสามารถกรองรายชื่อผู้ใช้ตามบทบาท (Role) ได้
- **FR-18:** Administrator จะต้องสามารถสร้างบัญชีผู้ใช้ใหม่ โดยกำหนด Full Name, Email, Role (1 บทบาท: Requester, IT Staff, Administrator), สถานะ Active/Inactive, และ Initial Password
- **FR-19:** Administrator จะต้องสามารถแก้ไขข้อมูลผู้ใช้ ได้แก่ ชื่อ, อีเมล, บทบาท, และสถานะการเปิดใช้งาน (Active/Inactive)
- **FR-20:** Administrator จะต้องสามารถรีเซ็ตรหัสผ่านของผู้ใช้เป็นรหัสผ่านเริ่มต้นใหม่ที่ Admin ป้อนเอง ซึ่งจะบังคับให้ผู้ใช้เปลี่ยนรหัสผ่านในครั้งแรกที่เข้าใช้งานครั้งถัดไป

---

## 4.5. Non-Functional Requirements (NFR)
- **NFR-01 (UI/UX - Zen Green):** ทุกหน้าจอใหม่และส่วนขยายต้องใช้โทนสี แบบอักษร รูปแบบ Card, Badge, และ Button ตามมาตรฐาน Zen Green Design System ของ Lab 2 อย่างเคร่งครัด
- **NFR-02 (Responsive & Layout):** ทุกหน้าจอต้องแสดงผลสมบูรณ์บน Desktop (≥ 992px), Tablet (768–991px), และ Mobile (< 768px) โดยบนหน้าจอมือถือจะต้องไม่มี Scroll แนวนอน (No horizontal overflow)
- **NFR-03 (Accessibility):** ทุก Input และปุ่มกดต้องรองรับ Keyboard Navigation, มี Focus rings ที่ชัดเจน, ฟิลด์ที่มี Error ต้องมีข้อความและกรอบสีแดงแจ้งเตือน, และ Badge สถานะต้องมีข้อความกำกับเสมอ
- **NFR-04 (Security & Safe Errors):** รหัสผ่านต้องถูกแฮชด้วยอัลกอริทึมมาตรฐาน (Bcrypt) ก่อนบันทึกลงฐานข้อมูล ห้ามเปิดเผยข้อมูลว่ามีทรัพยากรอยู่หรือไม่กรณีเข้าถึงโดยไม่ได้รับอนุญาต (Safe Failure/Forbidden Handling) และห้ามเปิดเผย Stack trace หรือ Sensitive error สู่ภายนอก
- **NFR-05 (Performance & States):** ปุ่ม Action ทุกปุ่มต้องมีสถานะ Busy/Loading เพื่อป้องกันการกดซ้ำซ้อน (Double-submit prevention) และทุกตาราง/ลิสต์ต้องมี Empty state และ No-results state ที่สื่อความหมายชัดเจน

---

## 5. Business Rules (BR)

### Authentication & Account Rules
- **BR-01 (Active Account Authentication):** เฉพาะผู้ใช้งานที่มีสถานะ Active (`isActive = true`) และระบุ Credential ถูกต้องเท่านั้นที่สามารถล็อกอินเข้าสู่ระบบได้
- **BR-02 (Inactive Account Shielding):** หากบัญชีมีสถานะ Inactive ระบบจะต้องปฏิเสธการเข้าสู่ระบบด้วยข้อความที่ปลอดภัย ("Account is deactivated. Please contact your administrator.") โดยไม่เปิดเผยข้อมูลภายในอื่น
- **BR-03 (Mandatory First-Login Password Change):** ผู้ใช้ที่มีค่าแฟล็ก `mustChangePassword = true` จะถูกจำกัดสิทธิ์ให้อยู่ในหน้าเปลี่ยนรหัสผ่านเท่านั้น และไม่สามารถเรียก API หรือเข้าถึงหน้าจออื่นจนกว่าจะตั้งรหัสผ่านใหม่ที่ถูกต้อง
- **BR-04 (Password Complexity Policy):** รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร ประกอบด้วยอักษรตัวพิมพ์ใหญ่ (A-Z), ตัวพิมพ์เล็ก (a-z), ตัวเลข (0-9), และอักขระพิเศษอย่างน้อย 1 ตัว และรหัสผ่านยืนยันต้องตรงกันทุกประการ
- **BR-05 (Session Invalidation on Logout):** เมื่อผู้ใช้สั่ง Logout เซสชันใน HTTP-only Cookie จะต้องถูกทำลายทันที และการพยายามเข้าถึงทรัพยากรที่ต้องยืนยันตัวตนหลังจากนั้นจะต้องถูกปฏิเสธ (HTTP 401 Unauthorized)

### Ownership & Role Separation Rules
- **BR-06 (Requester Identity Binding):** ตัวตนของ Requester จะต้องถูกดึงมาจาก Session/Token ที่ได้รับการรับรองจาก Backend เท่านั้น ห้ามรับ `requesterId` จาก Client Request body เพื่อป้องกันการปลอมแปลงสิทธิ์
- **BR-07 (Requester Data Isolation):** Requester สามารถดู ค้นหา และเข้าถึงตั๋วและไฟล์แนบได้เฉพาะตั๋วที่ตนเองเป็นผู้สร้าง (`requesterId = currentUser.id`) เท่านั้น การพยายามเข้าถึงตั๋วของผู้อื่นจะต้องได้ผลลัพธ์เป็น HTTP 403 Forbidden หรือ 404 Not Found
- **BR-08 (Role Single Responsibility):** ผู้ใช้งาน 1 คนจะมีบทบาทได้เพียง 1 บทบาทเท่านั้นจาก 3 บทบาท: `REQUESTER`, `IT_STAFF`, หรือ `ADMINISTRATOR`
- **BR-09 (Admin Strict Role Separation):** Administrator มีหน้าที่หลักในการจัดการบัญชีผู้ใช้ (User Management) ไม่มีสิทธิ์เข้าถึง Ticket Queue ส่วนกลาง, เคลมตั๋ว, ปรับ IT Priority, เปลี่ยนสถานะตั๋ว หรือสร้าง/เขียน Comments และ Notes แต่สามารถเข้าถึงเพื่ออ่าน (View-only) Public Comments และ Internal Notes บนตั๋วได้ตามกฎ BR-04 ของโจทย์ Lab 3

### Comments & Notes Rules
- **BR-10 (Public Comments Visibility & Append-Only):** Public Comments สามารถอ่าน (View) ได้โดย Requester เจ้าของตั๋ว, IT Staff, และ Administrator ส่วนการสร้าง/เขียน (Create) สามารถทำได้โดย Requester เจ้าของตั๋ว และ IT Staff เท่านั้น ข้อมูลเป็นแบบ Append-only (ห้ามแก้ไขหรือลบ)
- **BR-11 (Internal Notes Visibility & Append-Only):** Internal Notes เป็นข้อมูลความลับเชิงปฏิบัติการ สามารถอ่าน (View) ได้เฉพาะ IT Staff และ Administrator เท่านั้น ส่วนการสร้าง/เขียน (Create) สามารถทำได้เฉพาะ IT Staff ข้อมูลเป็นแบบ Append-only และ Requester ต้องไม่สามารถอ่านหรือรับรู้การมีอยู่ของ Internal Notes ได้ (คืนค่า 403 Forbidden)
- **BR-12 (Content Validation):** ข้อความใน Comments และ Notes ต้องไม่เป็นค่าว่างหรือมีเพียงช่องว่าง (Whitespace-only) และต้องมีความยาวไม่เกิน 1,000 ตัวอักษร โดยบันทึก Author และ Timestamp อัตโนมัติจากฝั่ง Backend

### Ticket Ownership, Priority, and Status Rules
- **BR-13 (Ticket Assignment):** ตั๋วแต่ละใบสามารถมี Ticket Owner ได้ไม่เกิน 1 คน โดยผู้ที่จะเป็น Ticket Owner จะต้องเป็น Active IT Staff เท่านั้น
- **BR-14 (IT Priority Default & Independence):** เมื่อตั๋วถูกสร้างขึ้น ค่า `itPriority` จะถูกกำหนดค่าเริ่มต้นให้เหมือนกับ `requestedPriority` โดยอัตโนมัติ และหลังจากนั้นจะมีเพียง IT Staff เท่านั้นที่สามารถแก้ไขค่า `itPriority` ได้
- **BR-15 (Permitted Ticket Statuses):** สถานะของตั๋วในระบบต้องมีค่าที่เป็นไปได้ 8 สถานะเท่านั้น ได้แก่: `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, และ `Cancelled`
- **BR-16 (Status Transition Governance):** การเปลี่ยนสถานะตั๋วต้องเป็นไปตาม Status Transition Matrix โดย IT Staff เป็นผู้มีอำนาจในการเปลี่ยนสถานะอย่างเป็นทางการ Requester ไม่สามารถเปลี่ยนสถานะตั๋วเป็น Resolved หรือ Closed ได้ด้วยตนเอง
- **BR-17 (Problem Appears Resolved Signal):** Requester สามารถส่งสัญญาณ "Problem Appears Resolved" ได้เฉพาะเมื่อตั๋วอยู่ในสถานะ `Open`, `In Progress`, หรือ `Waiting for Requester` โดยระบบจะตั้งค่า `problemResolvedReported = true` พร้อมบันทึก Public Comment อัตโนมัติว่า `"[Requester Update] The requester indicated that the problem appears resolved."` เพื่อแจ้งเตือน IT Staff โดยไม่เปลี่ยนสถานะทางการของตั๋ว

### Administrator Safety Rules
- **BR-18 (Unique Email Constraint):** อีเมลของผู้ใช้งานต้องไม่ซ้ำกันในระบบ (Case-insensitive unique check)
- **BR-19 (Prevent Self-Deactivation):** Administrator ไม่สามารถปิดการใช้งาน (Deactivate) บัญชีของตนเองได้
- **BR-20 (Last Active Administrator Protection):** ระบบต้องไม่อนุญาตให้ปิดการใช้งาน (Deactivate) หรือเปลี่ยนบทบาทของ Administrator คนสุดท้ายที่มีสถานะ Active ในระบบ
- **BR-21 (Soft Deactivation over Deletion):** ระบบไม่อนุญาตให้ลบข้อมูลผู้ใช้งาน (No User Deletion) ให้ใช้วิธีเปลี่ยนสถานะเป็น Inactive (`isActive = false`) แทน เพื่อรักษาความสมบูรณ์ของความสัมพันธ์เชิงข้อมูล (Referential Integrity) กับตั๋วและข้อความย้อนหลัง

---

## 6. Status Transition Matrix

| Current Status | Permitted Next Status | Permitted Roles | Conditions / Notes |
| :--- | :--- | :--- | :--- |
| **New** | Open, In Progress, Cancelled | IT Staff | เปลี่ยนเป็น Open เมื่อ Claim/Assign หรือเริ่มพิจารณา, เปลี่ยนเป็น Cancelled หากเป็นตั๋วซ้ำหรือไม่ถูกต้อง |
| **Open** | In Progress, Waiting for Requester, Resolved, Cancelled | IT Staff | เปลี่ยนเป็น In Progress เมื่อเริ่มดำเนินการ |
| **In Progress** | Waiting for Requester, Resolved, Cancelled | IT Staff | เปลี่ยนเป็น Waiting for Requester เมื่อต้องการข้อมูลเพิ่มจาก Requester |
| **Waiting for Requester** | In Progress, Resolved, Cancelled | IT Staff | เปลี่ยนกลับเป็น In Progress เมื่อได้รับข้อมูลจาก Requester แล้ว |
| **Resolved** | Closed, Reopened | IT Staff | ปิดงานสมบูรณ์ (Closed) หรือเปิดใหม่อีกครั้งหากปัญหายังไม่หาย (Reopened) |
| **Closed** | Reopened | IT Staff | เปิดงานใหม่อีกครั้งกรณีพบปัญหาเดิมต่อเนื่อง |
| **Reopened** | In Progress, Waiting for Requester, Resolved, Cancelled | IT Staff | กลับเข้าสู่ลูปการแก้ไขปัญหา |
| **Cancelled** | Reopened | IT Staff | สามารถกู้คืนตั๋วได้กรณีจำเป็น |

*(หมายเหตุ: Requester สามารถกดปุ่ม "Problem Appears Resolved" เพื่อแจ้งให้ IT Staff ทราบผ่านแฟล็กและ Public Comment อัตโนมัติ แต่สถานะตั๋วจะยังคงเดิมจนกว่า IT Staff จะตรวจสอบและกดยืนยันเปลี่ยนสถานะ)*

---

## 7. Authorization Matrix

| Operations / Resources | Requester (Owner) | Requester (Non-owner) | IT Staff | Administrator | Anonymous / Unauthenticated |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Auth: Login** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Auth: Get Current User (`/me`)** | ✅ | ✅ | ✅ | ✅ | ❌ (401) |
| **Auth: Change Password** | ✅ (Own) | ❌ | ✅ (Own) | ✅ (Own) | ❌ (401) |
| **Auth: Logout** | ✅ | ✅ | ✅ | ✅ | ❌ (401) |
| **Requester: Create Ticket** | ✅ | ❌ | ❌ | ❌ | ❌ (401) |
| **Requester: View My Tickets** | ✅ (Own only) | ❌ (Forbidden) | ❌ | ❌ | ❌ (401) |
| **Requester: View Ticket Detail** | ✅ (Own only) | ❌ (403/404) | ❌ (ใช้ IT Detail) | ❌ | ❌ (401) |
| **Requester: Upload/Delete Attachment** | ✅ (Own ticket) | ❌ (Forbidden) | ❌ | ❌ | ❌ (401) |
| **Requester: Indicate Problem Resolved** | ✅ (Own ticket) | ❌ (Forbidden) | ❌ | ❌ | ❌ (401) |
| **Public Comments: View** | ✅ (Own ticket) | ❌ (Forbidden) | ✅ (All tickets) | ✅ (All tickets) | ❌ (401) |
| **Public Comments: Create** | ✅ (Own ticket) | ❌ (Forbidden) | ✅ (All tickets) | ❌ (403 Forbidden) | ❌ (401) |
| **Internal Notes: View** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ (All tickets) | ✅ (All tickets) | ❌ (401) |
| **Internal Notes: Create** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ (All tickets) | ❌ (403 Forbidden) | ❌ (401) |
| **IT Queue: View / Search / Filter** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | ❌ (403 Forbidden) | ❌ (401) |
| **IT Ticket: View Detail** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | ❌ (403 Forbidden) | ❌ (401) |
| **IT Ticket: Claim / Reassign Owner** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | ❌ (403 Forbidden) | ❌ (401) |
| **IT Ticket: Update IT Priority** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | ❌ (403 Forbidden) | ❌ (401) |
| **IT Ticket: Update Ticket Status** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ (ตาม Matrix) | ❌ (403 Forbidden) | ❌ (401) |
| **Admin: View User List** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | ❌ (401) |
| **Admin: Create User** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | ❌ (401) |
| **Admin: Edit User Profile / Role** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | ❌ (401) |
| **Admin: Deactivate User** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ (ยกเว้นตนเอง/Admin คนสุดท้าย) | ❌ (401) |
| **Admin: Reset Initial Password** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | ❌ (401) |

---

## 8. UI Specification Summary (Reference to `ui-spec.md`)

- **Design Standard:** ยึดถือ Zen Green Theme อย่างเคร่งครัด โดยใช้ Primary Green (`#006B3C`), Soft background (`#F4FBF7`), Neutral borders (`#E2E8F0`), และ Status Badges ที่ระบุทั้งสีและข้อความชัดเจน
- **Navigation Shell:** 
  - ส่วนหัว (Header) แสดงโลโก้ TokTickIT, เมนูนำทางตามบทบาท (Role-based Nav), และ Profile Dropdown แสดงชื่อผู้ใช้ บทบาท และปุ่ม Logout
  - Requester เมนู: `My Tickets`, `Create Ticket`
  - IT Staff เมนู: `Ticket Queue`
  - Administrator เมนู: `User Management`
- **Login & Change Password Screen:**
  - Login Card ตรงกลางหน้าจอ ฟิลด์ Email, Password, ปุ่ม Sign In, ข้อความ Safe Error เมื่อกรอกผิดหรือถูกระงับบัญชี
  - Change Password Card: แสดงเงื่อนไขความปลอดภัยของรหัสผ่านแบบไดนามิก (ความยาว, ตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, ตัวเลข, สัญลักษณ์) พร้อมปุ่ม Continue ซึ่งจะเปิดใช้งานเมื่อข้อมูลผ่าน Validation ครบถ้วน
- **IT Staff Ticket Queue Screen:**
  - Search bar ค้นหาเลขตั๋วหรือหัวข้อปัญหาแบบ Real-time/Debounce
  - Filter bar: Dropdown เลือก Status, Category, Priority, และ Ownership (All, Unassigned, Assigned to Me)
  - Data Table: คอลัมน์ Ticket No, Created Date, Summary, Category, Req. Priority, IT Priority, Status, Owner และปุ่ม View Detail
  - Pagination Control: แสดงจำนวนรายการทั้งหมด ตัวเลือกหน้าก่อนหน้า/ถัดไป และตัวเลขหน้า
  - Responsive Card List สำหรับมุมมองหน้าจอ Mobile
- **IT Staff Ticket Detail Screen:**
  - การจัดกลุ่มข้อมูลชัดเจน: ข้อมูลผู้ขอ (Requester Info), ข้อมูลตั๋ว (Ticket Attributes), และส่วนสรุปปัญหา (Summary & Description)
  - คอนโทรลที่แก้ไขได้เฉพาะ IT Staff: Ticket Owner (Dropdown รายชื่อ IT Staff), IT Priority (Dropdown), และ Current Status (Dropdown ที่แสดงเฉพาะสถานะที่อนุญาตให้เปลี่ยนได้)
  - แท็บหรือส่วนแยกชัดเจนระหว่าง **Public Comments** (กรอบสีเขียวอ่อนสำหรับสื่อสารกับผู้แจ้ง) และ **Internal Notes** (กรอบสีเหลืองอำพัน/เตือนความปลอดภัยสำหรับบันทึกงานภายใน)
- **Administrator User Management Screen:**
  - Header พร้อมปุ่ม `+ Create User`
  - กล่องค้นหาผู้ใช้ และตัวกรอง Role
  - ตารางรายชื่อผู้ใช้: Name, Email, Role Badge, Status Badge (Active/Inactive), และปุ่ม Action (Edit)
  - Slide-over Drawer หรือ Modal สำหรับ Create / Edit User พร้อมช่องระบุ Initial Password, Toggle สวิตช์สำหรับ Active/Inactive และปุ่ม Reset Password

---

## 9. Data Changes & Migration Strategy

### 9.1 Database Schema (Prisma PostgreSQL)

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMINISTRATOR
}

model User {
  id                 Int           @id @default(autoincrement())
  name               String
  email              String        @unique
  passwordHash       String
  role               Role          @default(REQUESTER)
  isActive           Boolean       @default(true)
  mustChangePassword Boolean       @default(true)
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  // Relationships
  requestedTickets   Ticket[]      @relation("RequesterTickets")
  assignedTickets    Ticket[]      @relation("AssignedStaffTickets")
  comments           Comment[]
  notes              InternalNote[]
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  createdAt DateTime @default(now())
  
  tickets   Ticket[]
}

model RelatedSystem {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  
  tickets  Ticket[]
}

model Ticket {
  id                     Int            @id @default(autoincrement())
  ticketNo               String         @unique
  summary                String         @db.VarChar(150)
  description            String         @db.VarChar(2000)
  requestedPriority      String
  itPriority             String         // ค่าเริ่มต้นคัดลอกจาก requestedPriority
  currentStatus          String         @default("New")
  problemResolvedReported Boolean       @default(false) // ผู้แจ้งระบุว่าปัญหาได้รับการแก้ไขแล้ว
  createdAt              DateTime       @default(now())
  updatedAt              DateTime       @updatedAt

  requesterId            Int
  requester              User           @relation("RequesterTickets", fields: [requesterId], references: [id])
  
  assignedStaffId        Int?           // Nullable สำหรับตั๋วที่ยังไม่มีผู้รับผิดชอบ
  assignedStaff          User?          @relation("AssignedStaffTickets", fields: [assignedStaffId], references: [id])

  categoryId             Int
  category               Category       @relation(fields: [categoryId], references: [id])
  
  relatedSystemId        Int
  relatedSystem          RelatedSystem  @relation(fields: [relatedSystemId], references: [id])

  attachments            Attachment[]
  comments               Comment[]
  internalNotes          InternalNote[]
}

model Attachment {
  id            Int       @id @default(autoincrement())
  filename      String
  size          Int
  mimeType      String
  deletedAt     DateTime?
  deletedReason String?

  ticketId      Int
  ticket        Ticket    @relation(fields: [ticketId], references: [id])
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String   @db.VarChar(1000)
  createdAt DateTime @default(now())

  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id])

  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
}

model InternalNote {
  id        Int      @id @default(autoincrement())
  content   String   @db.VarChar(1000)
  createdAt DateTime @default(now())

  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id])

  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
}
```

### 9.2 Migration Plan from Lab 2 (Zero Regression Strategy)
1. **การรักษาข้อมูลเดิม (Preserving Existing Data):**
   - ตาราง `DevelopmentRequester` จะถูกแปลงโครงสร้างเป็นตาราง `User` โดยคงค่า `id` และข้อมูลเดิม (`name`, `email`, `isActive`) ไว้ครบถ้วน 100%
   - เพิ่มคอลัมน์ `passwordHash`, `role` (กำหนดค่าเริ่มต้นเป็น `REQUESTER`), `mustChangePassword` (กำหนดค่าเป็น `true`), และ `updatedAt`
   - กำหนด Default Initial Password ให้กับบัญชีเดิมที่ถูก Migrate โดยใช้แฮชของ `Toktick2026!`
   - ตาราง `Ticket.requesterId` จะเชื่อมโยงไปยัง `User.id` เดิมอย่างถูกต้องโดยไม่มีการสูญหายของ Foreign Key และข้อมูล Attachments ทั้งหมดยังคงอยู่ครบถ้วน
2. **การเพิ่มคอลัมน์ใหม่ใน Ticket:**
   - เพิ่มคอลัมน์ `itPriority` โดยรัน SQL Data Migration ให้ค่า `itPriority = requestedPriority` สำหรับตั๋วเดิมทุกใบ
   - เพิ่มคอลัมน์ `assignedStaffId` เป็น `NULL`
   - เพิ่มคอลัมน์ `problemResolvedReported` เป็น `false`
3. **การลบ State เก่าออกจาก Frontend:**
   - ลบคอมโพเนนต์ `DevelopmentRequesterSelector`
   - ลบการจัดเก็บ `currentRequesterId` ใน `localStorage` และแทนที่ด้วย Authentication Context ที่จัดการ Session ผ่าน HTTP-only Cookie

### 9.3 Seed Data Requirements (Idempotent)
ระบบเตรียมสคริปต์ Database Seed ที่ปลอดภัยสำหรับการรันซ้ำ (`upsert`) โดยใช้รหัสผ่านสำหรับสภาพแวดล้อม Local Development เท่านั้น (`Toktick2026!`):
1. **Requester Accounts:**
   - Active Requester อย่างน้อย 4 บัญชี (รวมข้อมูลเดิมที่ Migrate มา)
   - Inactive Requester อย่างน้อย 1 บัญชี (เพื่อทดสอบ Inactive Blocking)
2. **IT Staff Accounts:**
   - Active IT Staff อย่างน้อย 3 บัญชี
   - Inactive IT Staff อย่างน้อย 1 บัญชี
3. **Administrator Accounts:**
   - Active Administrator อย่างน้อย 1 บัญชี (สำหรับทดสอบ User Management)
4. **Tickets Data:**
   - ตั๋วที่มีสถานะกระจายครบทุกสถานะ (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`)
   - ตั๋วที่มีเจ้าหน้าที่รับผิดชอบและยังไม่ได้รับผิดชอบ
   - ตัวอย่าง Public Comments และ Internal Notes

---

## 10. API Contract Summary (Reference to `api-spec.md`)

### Authentication Endpoints
- `POST /api/v1/auth/login`: ตรวจสอบ Email และ Password ส่งคืน HTTP-only Cookie พร้อมข้อมูลผู้ใช้และสถานะ `mustChangePassword`
- `POST /api/v1/auth/change-password`: เปลี่ยนรหัสผ่านใหม่ (ต้องระบุรหัสเดิมและรหัสใหม่ที่ตรงตามนโยบายความปลอดภัย) และปลดล็อก `mustChangePassword = false`
- `GET /api/v1/auth/me`: ดึงข้อมูลตัวตนและบทบาทของผู้ใช้ปัจจุบันจาก Cookie Session
- `POST /api/v1/auth/logout`: ลบล้าง HTTP-only Cookie เซสชัน

### Requester Endpoints (Regressed & Secured)
- `GET /api/v1/tickets`: ดึงรายการตั๋วของ Requester ปัจจุบันเท่านั้น (Query: search, category, status, page, limit)
- `POST /api/v1/tickets`: สร้างตั๋วใหม่ (ดึงตัวตนผู้สร้างจาก Session เบื้องหลัง)
- `GET /api/v1/tickets/:id`: ดึงรายละเอียดตั๋ว (ตรวจสอบสิทธิ์ว่าต้องเป็นของตนเอง)
- `POST /api/v1/tickets/:id/resolve-indication`: ส่งสัญญาณแจ้งว่าปัญหาได้รับการแก้ไขแล้ว (ตั้งแฟล็กและเพิ่มข้อความอัตโนมัติ)
- `POST /api/v1/tickets/:id/attachments`: อัปโหลดไฟล์แนบเข้าตั๋วของตนเอง
- `DELETE /api/v1/tickets/:id/attachments/:attachmentId`: ลบไฟล์แนบ (Soft-removal)

### IT Staff Queue & Detail Endpoints
- `GET /api/v1/staff/tickets`: ดึงรายการตั๋วในคิวงาน (Query: search, status, category, priority, owner, page, limit, sortBy, sortOrder)
- `GET /api/v1/staff/tickets/:id`: ดึงรายละเอียดตั๋วสำหรับงานไอที (รวมประวัติและสิทธิ์การแก้ไข)
- `PATCH /api/v1/staff/tickets/:id/ownership`: เคลมตั๋ว (Claim) หรือโอนงาน (Reassign) โดยรับ `assignedStaffId`
- `PATCH /api/v1/staff/tickets/:id/priority`: ปรับปรุงระดับ `itPriority`
- `PATCH /api/v1/staff/tickets/:id/status`: ปรับปรุงสถานะตั๋วตาม State Transition Matrix

### Comments & Notes Endpoints
- `GET /api/v1/tickets/:id/comments`: ดึงรายการ Public Comments (อนุญาต: Requester เจ้าของตั๋ว, IT Staff)
- `POST /api/v1/tickets/:id/comments`: สร้าง Public Comment ใหม่
- `GET /api/v1/staff/tickets/:id/notes`: ดึงรายการ Internal Notes (อนุญาต: IT Staff เท่านั้น - Requester และ Admin ห้ามเข้าถึง)
- `POST /api/v1/staff/tickets/:id/notes`: สร้าง Internal Note ใหม่

### Administrator User Management Endpoints
- `GET /api/v1/admin/users`: ดึงรายชื่อผู้ใช้ทั้งหมด (Query: search, role)
- `POST /api/v1/admin/users`: สร้างบัญชีผู้ใช้ใหม่ พร้อมกำหนด Initial Password
- `PATCH /api/v1/admin/users/:id`: แก้ไขข้อมูลผู้ใช้ (Name, Email, Role, isActive)
- `POST /api/v1/admin/users/:id/reset-password`: ตั้งรหัสผ่านเริ่มต้นใหม่ และกำหนด `mustChangePassword = true`

---

## 11. Acceptance Criteria (AC)

- **AC-01 (Valid Authentication):** เมื่อผู้ใช้ที่มีสถานะ Active กรอกอีเมลและรหัสผ่านที่ถูกต้อง ระบบจะต้องสร้าง HTTP-only Session Cookie สำเร็จ และส่งคืนข้อมูลตัวตนพร้อมบทบาทของผู้ใช้
- **AC-02 (Mandatory Password Change):** เมื่อผู้ใช้ที่มีสถานะ `mustChangePassword = true` เข้าสู่ระบบสำเร็จ ระบบจะต้องไม่อนุญาตให้เข้าสู่หน้าจอทำงานปกติ และต้องบังคับให้อยู่ในหน้า Change Password จนกว่าจะตั้งรหัสผ่านใหม่ที่ผ่านเกณฑ์ความปลอดภัย
- **AC-03 (Requester Ownership Protection):** เมื่อผู้ใช้ที่เป็น Requester เรียกดูรายการตั๋วหรือรายละเอียดตั๋ว ระบบจะต้องแสดงเฉพาะตั๋วที่ตนเองเป็นเจ้าของเท่านั้น แม้จะมีการระบุ `requesterId` ของผู้อื่นใน Request ระบบจะต้องปฏิเสธหรือเพิกเฉย
- **AC-04 (Internal Notes Confidentiality):** เมื่อบัญชี Requester หรือผู้ไม่มีสิทธิ์ พยายามเรียกดูหรือสร้างข้อมูลผ่าน Endpoint ของ Internal Notes ระบบจะต้องตอบกลับด้วย HTTP 403 Forbidden โดยไม่เปิดเผยข้อมูลหรือเนื้อหาของโน้ต
- **AC-05 (Inactive User Blocking):** เมื่อพยายามเข้าสู่ระบบด้วยบัญชีที่ถูกระงับการใช้งาน (`isActive = false`) ระบบจะต้องปฏิเสธการเข้าสู่ระบบและแสดงข้อความแจ้งเตือนที่ปลอดภัย
- **AC-06 (IT Queue Search and Filtering):** เมื่อ IT Staff ใช้ระบบค้นหาหรือกรองข้อมูลในหน้ารายการคิวงาน ผลลัพธ์ในตารางจะต้องอัปเดตตรงตามเงื่อนไขค้นหา และแบ่งหน้าแสดงผลได้อย่างถูกต้อง
- **AC-07 (Ticket Ownership Claim & Reassign):** เมื่อ IT Staff กดเคลมตั๋วที่ยังไม่มีผู้รับผิดชอบ ระบบจะต้องอัปเดตให้ IT Staff คนนั้นเป็นเจ้าของตั๋วทันที และสามารถโอนตั๋วไปยัง IT Staff คนอื่นที่ Active อยู่ได้
- **AC-08 (IT Priority and Status Updates):** เมื่อ IT Staff ปรับปรุงระดับ `itPriority` หรือสถานะตั๋วตาม State Transition Matrix ระบบจะต้องบันทึกข้อมูลสำเร็จและอัปเดตข้อมูลบนหน้าจอให้สอดคล้องกัน
- **AC-09 (Requester Problem Resolution Signal):** เมื่อ Requester กดปุ่ม "Problem Appears Resolved" ระบบจะต้องอัปเดตค่า `problemResolvedReported = true` พร้อมบันทึก Public Comment แจ้งความคืบหน้าอัตโนมัติ โดยที่สถานะทางการของตั๋วจะยังไม่เปลี่ยนเป็น Resolved
- **AC-10 (Admin User Management & Validation):** เมื่อ Administrator สร้างหรือแก้ไขบัญชีผู้ใช้ ระบบจะต้องตรวจสอบความถูกต้องของอีเมล (ห้ามซ้ำ) และบันทึกข้อมูลสำเร็จ
- **AC-11 (Admin Safety Restrictions):** เมื่อ Administrator พยายามปิดการใช้งาน (Deactivate) บัญชีของตนเอง หรือพยายามปิดการใช้งาน Administrator คนสุดท้ายที่ Active อยู่ ระบบจะต้องปฏิเสธการทำรายการและแสดงข้อความแจ้งเตือนข้อผิดพลาด
- **AC-12 (Lab 2 Zero Regression):** ฟังก์ชันการสร้างตั๋ว การดูรายการตั๋ว การดูรายละเอียดตั๋ว และการจัดการไฟล์แนบเดิมของ Lab 2 ต้องทำงานได้ตามปกติอย่างสมบูรณ์ภายใต้ระบบการยืนยันตัวตนใหม่

---

## 12. Product Definition of Done (DoD)

1. **Version Control & Git Workflow:**
   - โค้ดทั้งหมดได้รับการพัฒนาแยกตาม Feature branches และผ่านการเปิด Pull Request (PR) พร้อมการรีวิว (Peer Review) ที่บันทึกไว้ใน `docs/lab-03/reviewer.md` ก่อนรวมเข้า `lab3-staging` และ `main`
   - Issue ทั้งหมดใน GitHub Project / Kanban อยู่ในสถานะ "Done"
2. **Automated Testing & Coverage:**
   - มีชุดทดสอบอัตโนมัติครบทุกประเภท: Unit Tests, API/Integration Tests, Client Component Tests, และ Playwright E2E Tests ตามโครงสร้างที่กำหนดใน Lab 3
   - การทดสอบทั้งหมดต้องรันผ่าน 100% (Pass) บน Branch `main` โดยไม่มีการ Skip หรือปิดคอมเมนต์ชุดทดสอบใด ๆ
3. **Data Integrity & Migration:**
   - ข้อมูลเดิมจาก Lab 2 (Tickets, Attachments, Reference Data) ได้รับการ Migrate มายังโมเดลใหม่อย่างครบถ้วน 100% ไม่สูญหาย
   - มีสคริปต์ Database Seed ที่เป็นแบบ Idempotent สามารถรันซ้ำได้ปลอดภัย และสร้างบัญชีทดสอบครบตามเกณฑ์
4. **Security & Authorization Enforcement:**
   - มีการตรวจสอบสิทธิ์การเข้าถึง (Authorization) ที่ฝั่ง Backend API ทุก Endpoint
   - รหัสผ่านได้รับการแฮชอย่างปลอดภัย และไม่มี Credential หรือ Secret หลุดเข้าไปใน Source Code
5. **Zen Green Design & Responsiveness:**
   - ส่วนติดต่อผู้ใช้ทั้งหมดสร้างขึ้นตามมาตรฐาน Zen Green Design System
   - ผ่านการทดสอบ Responsive บนขนาดหน้าจอ Desktop (≥992px), Tablet (768–991px), และ Mobile (<768px) โดยไม่มีปัญหา Horizontal Scrollbar
   - มีการจัดการสถานะ Loading, Empty, No-results, Validation Errors, และ Safe Failure ครบถ้วน
6. **Documentation & Deliverables:**
   - เอกสารครบถ้วนในโฟลเดอร์ `docs/lab-03/` ได้แก่ `specification.md`, `tests.md`, `ui-spec.md`, `api-spec.md`, `reviewer.md`, และ `ai-use.md`
   - รวบรวมหลักฐานและภาพถ่ายหน้าจอตามที่กำหนดในหัวข้อ 14 ของโจทย์ Lab 3

---

## 13. Assumptions and Technical Decisions

1. **Authentication Mechanism:** เลือกใช้ Signed HTTP-only Cookie เก็บ JWT Token เพื่อความปลอดภัยสูงสุดในการป้องกันการโจรกรรมโทเคนผ่าน XSS และป้องกันปัญหาการจัดการโทเคนฝั่ง Client
2. **Password Hashing:** เลือกใช้ไลบรารี `bcrypt` (หรือ `bcryptjs`) ที่มี Salt Round มาตรฐาน (Cost factor 10)
3. **Default Initial Password Policy:** ผู้ใช้ใหม่หรือบัญชีเดิมที่ถูก Migrate จะได้รับ Initial Password รูปแบบ `Toktick2026!` สำหรับ Local Development โดยมีแฟล็ก `mustChangePassword = true` กำกับเสมอ
4. **Admin vs IT Staff Separation:** Administrator มีหน้าที่เฉพาะ User Management เท่านั้น และไม่ได้รับอนุญาตให้จัดการตั๋วหรือบันทึกข้อมูลในคิวงานของ IT Staff
5. **Pagination Defaults:** หน้ารายการ Ticket Queue กำหนดค่าเริ่มต้นการแบ่งหน้าที่ 10 รายการต่อหน้า (Default Limit = 10)
6. **Safe Error Responses:** ในการร้องขอที่ไม่ได้รับสิทธิ์ หรือการพยายามเข้าถึงทรัพยากรที่ตนเองไม่ใช่เจ้าของ ระบบจะตอบกลับด้วย HTTP 403 Forbidden หรือ 404 Not Found ในรูปแบบ JSON มาตรฐานที่มีโครงสร้างสม่ำเสมอ โดยไม่เปิดเผยข้อมูลความลับหรือ Stack trace
