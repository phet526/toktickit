# Lab 3 UI Specification (Zen Green Theme & Application Shell)

## 1. Color Palette, Tokens & Typography

ระบบใน Sprint 3 สานต่อการใช้มาตรฐานการออกแบบ **Zen Green Theme** จาก Lab 2 อย่างเคร่งครัด เพื่อสร้างประสบการณ์ใช้งานที่สะอาดตา เป็นมืออาชีพ และสอดคล้องกันทุกบทบาท (Requester, IT Staff, Administrator):

### 1.1 Color Tokens
- **Primary Green (`#006B3C`):** ใช้สำหรับ Application Header, ปุ่มกดหลัก (Primary Buttons), และสถานะ Active Menu
- **Secondary Green (`#0B7A46`):** ใช้สำหรับสถานะ Hover ของปุ่ม/ลิงก์, แท็บที่กำลังเลือก (Active Tab), และไอคอนนำทาง
- **Soft Green Background (`#EAF6EF` / `#F4FBF7`):** ใช้สำหรับพื้นหลังของข้อความสำเร็จ (Success Banner), การเน้นแถวที่เลือก (Selected Row), และกรอบกล่อง Public Comments
- **Neutral Page Background (`#F5F7F6`):** พื้นหลังหลักของทุกหน้าจอ เพื่อลดแสงสะท้อนและถนอมสายตา
- **Surface / Card Background (`#FFFFFF`):** สีขาวบริสุทธิ์สำหรับ Card, Data Table, Modal Drawer, และ Form Containers
- **Border Neutral (`#E2E8F0` / `#D1D5DB`):** เส้นขอบฟอร์มและเส้นแบ่งตาราง
- **Typography Colors:**
  - Headings / Body Primary: Dark Charcoal (`#1F2937`)
  - Body Secondary / Labels: Slate Gray (`#4B5563`)
  - Placeholder / Disabled Text: Muted Gray (`#9CA3AF`)
- **Feedback & Alert Colors:**
  - **Error / Danger (`#DC2626` / Border `#EF4444` / Light Bg `#FEF2F2`):** ใช้สำหรับ Validation Errors, ข้อความล็อกอินไม่ผ่าน, ปุ่ม Deactivate User
  - **Warning / Security Note (`#D97706` / Border `#F59E0B` / Light Bg `#FFFBEB`):** ใช้สำหรับ **Internal Notes Container** เพื่อเน้นย้ำความปลอดภัยว่าเป็นบันทึกเฉพาะเจ้าหน้าที่ไอทีเท่านั้น
  - **Success (`#16A34A` / Light Bg `#F0FDF4`):** การแจ้งเตือนบันทึกข้อมูลสำเร็จ และเครื่องหมาย Checklist ผ่านเกณฑ์

### 1.2 Typography & Badges
- **Font Family:** ใช้ San-serif มาตรฐานที่รองรับภาษาไทยและภาษาอังกฤษอย่างไร้รอยต่อ (`system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`)
- **Status & Priority Badges Standard:** ป้ายสถานะทุกประเภทต้องแสดง **"สีควบคู่กับข้อความเสมอ" (ห้ามใช้สีสื่อความหมายเพียงอย่างเดียว)**:
  - **Ticket Status:**
    - `New`: Badge สีเทาฟ้า (`#E0F2FE` / ข้อความ `#0369A1`)
    - `Open`: Badge สีน้ำเงินคราม (`#EEF2FF` / ข้อความ `#4338CA`)
    - `In Progress`: Badge สีส้มอำพัน (`#FEF3C7` / ข้อความ `#B45309`)
    - `Waiting for Requester`: Badge สีม่วงอ่อน (`#F3E8FF` / ข้อความ `#6B21A8`)
    - `Resolved`: Badge สีเขียวมรกต (`#DCFCE7` / ข้อความ `#15803D`)
    - `Closed`: Badge สีเทากลาง (`#F3F4F6` / ข้อความ `#4B5563`)
    - `Reopened`: Badge สีเหลืองมัสตาร์ด (`#FEF9C3` / ข้อความ `#854D0E`)
    - `Cancelled`: Badge สีแดงอ่อน (`#FEE2E2` / ข้อความ `#B91C1C`)
  - **Priority Badges (Requested Priority & IT Priority):**
    - `Low`: ป้ายสีเขียวอ่อน (`#DCFCE7` / `#166534`)
    - `Medium`: ป้ายสีเหลืองส้ม (`#FEF3C7` / `#92400E`)
    - `High`: ป้ายสีส้มแดง (`#FFEDD5` / `#C2410C`)
    - `Critical`: ป้ายสีแดงเข้ม (`#FEE2E2` / `#991B1B`)
  - **Role Badges:**
    - `Requester`: ป้ายสีฟ้าอ่อน (`#E0F2FE` / `#0369A1`)
    - `IT Staff`: ป้ายสีเขียวมิ้นต์ (`#D1FAE5` / `#065F46`)
    - `Administrator`: ป้ายสีม่วงเข้ม (`#EDE9FE` / `#5B21B6`)

---

## 2. Application Shell & Role-Based Navigation

Application Shell ทำหน้าที่เป็นกรอบโครงสร้างหลักของแอปพลิเคชันหลังผ่านการยืนยันตัวตน:

1. **Top Navigation Bar (Zen Green `#006B3C`):**
   - **ฝั่งซ้าย:** โลโก้ TokTickIT พร้อมไอคอนตั๋ว สามารถคลิกเพื่อกลับหน้าหลักของแต่ละบทบาท
   - **ตรงกลาง (Role-Based Menu Items):**
     - **Requester:** แสดงเมนู `My Tickets` และ `Create Ticket`
     - **IT Staff:** แสดงเมนู `Ticket Queue`
     - **Administrator:** แสดงเมนู `User Management`
     *(ผู้ใช้จะไม่เห็นเมนูของบทบาทอื่นที่ตนเองไม่ได้รับอนุญาต)*
   - **ฝั่งขวา (User Profile & Actions):**
     - แสดงชื่อผู้ใช้ (Full Name) และป้าย Role Badge
     - เมนู Dropdown: ปุ่ม `Change Password` และปุ่ม `Sign Out (Logout)`
2. **State Protection for Initial Password:**
   - หากผู้ใช้มีสถานะ `mustChangePassword = true` ระบบจะแสดงเฉพาะหน้าจอเปลี่ยนรหัสผ่านบังคับ โดยซ่อนเมนูนำทางหลักทั้งหมด และแสดงเฉพาะปุ่ม Logout เท่านั้น

---

## 3. Screen Specifications

### 3.1 Login & Mandatory Password Change Screens

#### Screen 3.1.1: Sign In Screen
- **โครงสร้าง:** การ์ดสีขาวจัดวางกึ่งกลางหน้าจอ (Centered Card) บนพื้นหลัง `#F5F7F6`
- **องค์ประกอบ:**
  - โลโก้ TokTickIT และหัวข้อ *"Sign in to your account"*
  - ช่องกรอก **Email Address** (มี Placeholder, Auto-focus, ตรวจสอบรูปแบบอีเมล)
  - ช่องกรอก **Password** (Input type password พร้อมปุ่มลูกตา Show/Hide Password)
  - กล่องข้อความแจ้งเตือนข้อผิดพลาด (Safe Failure Banner):
    - รหัสผ่านผิด / ไม่มีบัญชี: *"Invalid email or password. Please try again."*
    - บัญชีถูกปิดการใช้งาน: *"Account is deactivated. Please contact your administrator."*
  - ปุ่ม **Sign In** (สี Primary Green `#006B3C` เต็มความกว้างการ์ด): แสดง Spinner และสถานะ Disabled ขณะกำลังตรวจสอบ (Busy State)

#### Screen 3.1.2: Mandatory Change Password Screen
- **โครงสร้าง:** การ์ดสีขาวกึ่งกลางหน้าจอ พร้อมข้อความระบุเงื่อนไขการบังคับเปลี่ยนรหัสผ่าน
- **องค์ประกอบ:**
  - หัวข้อ *"Change Your Password"* และคำอธิบาย *"You must change your password to continue."*
  - ช่องกรอก **Current (Temporary) Password**
  - ช่องกรอก **New Password**
  - ช่องกรอก **Confirm New Password**
  - **Dynamic Password Rules Checklist:** กล่องแสดงเกณฑ์ความปลอดภัยที่จะเปลี่ยนจากสีเทาเป็นไอคอนเครื่องหมายถูกสีเขียวแบบเรียลไทม์เมื่อผู้ใช้พิมพ์ตรงตามเกณฑ์:
    - [ ] Be at least 8 characters
    - [ ] Include upper and lower case letters
    - [ ] Include a number and a special character
  - ตรวจสอบว่า `Confirm New Password` ตรงกับ `New Password`
  - ปุ่ม **Continue** (ถูก Disabled ไว้จนกว่าจะผ่านเกณฑ์ความปลอดภัยครบทุกข้อ)

---

### 3.2 Requester Extended Screens (Zero Regression)

#### Screen 3.2.1: My Tickets & Create Ticket (Regressed)
- สืบทอดหน้าจอเดิมจาก Lab 2 ทั้งหมด โดยถอดคอมโพเนนต์ `DevelopmentRequesterSelector` ออกอย่างถาวร
- การสร้างตั๋วและการเรียกดูรายการตั๋วจะผูกกับตัวตนปัจจุบันใน Cookie Session อัตโนมัติ

#### Screen 3.2.2: Requester Ticket Detail (Extensions)
- แสดงข้อมูลตั๋วแบบ Read-only ตามมาตรฐาน Lab 2
- **ปุ่ม "Problem Appears Resolved":** แสดงอยู่ด้านบนข้างสถานะตั๋ว (แสดงเฉพาะเมื่อสถานะเป็น `Open`, `In Progress`, หรือ `Waiting for Requester`):
  - เมื่อคลิก จะมี Modal ยืนยันการส่งสัญญาณ
  - เมื่อยืนยัน ระบบจะตั้งแฟล็กและโพสต์ Public Comment อัตโนมัติ โดยเปลี่ยนปุ่มเป็นสถานะ *"Resolution Indicated"* (Disabled)
- **Public Comments Section:**
  - กล่องกรอกข้อความสำหรับโพสต์ความเห็นใหม่ พร้อมปุ่ม *"Post Comment"* (แสดง Busy State ขณะส่ง)
  - ไทม์ไลน์แสดงความคิดเห็นสาธารณะ เรียงลำดับตามเวลา โดยแสดง Avatar อักษรย่อ, ชื่อผู้เขียน, ป้าย Role Badge, วันที่-เวลา, และข้อความ

---

### 3.3 IT Staff Ticket Queue Screen

- **โครงสร้าง:** หน้าจอเต็มความกว้างพร้อม Container ข้อมูลแบบตารางสำหรับ Desktop และแบบ Card List สำหรับ Mobile
- **Header & Filters Bar:**
  - ช่องค้นหา (Search input) ค้นหาเลขตั๋ว (`Ticket No.`) หรือหัวข้อ (`Summary`) พร้อมฟังก์ชัน Debounce
  - Dropdowns ตัวกรอง:
    - **Status:** All, New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled
    - **Category:** All, และรายชื่อหมวดหมู่ที่ดึงมาจากฐานข้อมูล
    - **Priority:** All, Low, Medium, High, Critical
    - **Ownership:** All Tickets, Unassigned, Assigned to Me
- **Data Table Layout (Desktop/Tablet):**
  - คอลัมน์: `Ticket No.`, `Created Date`, `Summary`, `Category`, `Req. Priority`, `IT Priority`, `Current Status`, `Owner`
  - ทุกแถวสามารถคลิกได้เพื่อเปิดหน้า Ticket Detail หรือมีปุ่ม *"View"* กำกับ
- **Pagination & Feedback States:**
  - ส่วนล่างแสดงจำนวนตั๋วทั้งหมด (เช่น *"Showing 1 to 10 of 87 tickets"*) พร้อมตัวเลขหน้าและปุ่ม Previous/Next
  - **Empty State:** แสดงภาพประกอบ/ไอคอนและข้อความ *"No tickets in queue"*
  - **No-Results State:** แสดงข้อความ *"No tickets match your search criteria"* พร้อมปุ่ม Clear Filters

---

### 3.4 IT Staff Ticket Detail Screen

- **โครงสร้าง:** แบ่งออกเป็น 2 คอลัมน์หลักบน Desktop (3:1) และเรียงต่อกันบน Mobile
- **คอลัมน์ซ้าย (Ticket Information & Activity):**
  - **Ticket Summary & Description:** พื้นหลังสีขาว ข้อมูลอ่านได้อย่างเดียว (Read-only)
  - **Attachments Section:** แสดงรายการไฟล์แนบเดิมจาก Lab 2 พร้อมปุ่มดาวน์โหลด
  - **Activity & Discussion Tabs:**
    - **Tab 1: Public Comments:** พื้นหลังขอบสีเขียวอ่อน แสดงข้อความพูดคุยระหว่าง Requester และเจ้าหน้าที่
    - **Tab 2: Internal Notes:** พื้นหลังกล่องข้อความสีเหลืองอำพันอ่อน (`#FFFBEB`) ขอบสีส้มทอง พร้อมป้ายกำกับเด่นชัด `🔒 Internal Note - IT Staff Only` เพื่อป้องกันความสับสนไม่ให้เจ้าหน้าที่โพสต์ข้อมูลลับผิดช่องทาง
- **คอลัมน์ขวา (Operational Controls - Editable by IT Staff):**
  - **Ticket Owner Control:**
    - แสดงชื่อเจ้าหน้าที่ปัจจุบัน หากยังไม่มีเจ้าหน้าที่รับผิดชอบ จะมีปุ่มเด่นชัด **"Claim Ticket"** (กดเพื่อกำหนดตนเองเป็นเจ้าของทันที)
    - Dropdown รายชื่อ IT Staff ที่ Active เพื่อใช้โอนงาน (Reassign)
  - **IT Priority Control:** Dropdown เลือก Low, Medium, High, Critical (แยกต่างหากจาก Requested Priority ซึ่งเป็น Read-only)
  - **Current Status Control:** Dropdown ที่แสดงเฉพาะสถานะที่อนุญาตให้เปลี่ยนได้ตาม Status Transition Matrix พร้อมปุ่มบันทึกหรือบันทึกแบบอัตโนมัติ (Auto-save on change พร้อม Toast Feedback)

---

### 3.5 Administrator User Management Screen

- **โครงสร้าง:** หน้าจอตารางจัดการผู้ใช้แบบเรียบง่าย (Minimalist)
- **Action Bar:**
  - ช่องค้นหาชื่อหรืออีเมลผู้ใช้
  - Dropdown กรองตามบทบาท (All, Requester, IT Staff, Administrator)
  - ปุ่ม **"+ Create User"** (สีเขียว Zen Green) เปิด Slide-over Drawer หรือ Modal
- **User List Table:**
  - คอลัมน์: `Name`, `Email`, `Role` (Badge), `Status` (Active สีเขียว / Inactive สีเทาแดง), `Actions` (ปุ่ม Edit)
- **Create / Edit User Slide-over Modal:**
  - ฟิลด์ **Full Name\*** (Text input, Required)
  - ฟิลด์ **Email Address\*** (Email input, Required, ตรวจสอบความซ้ำซ้อน)
  - ฟิลด์ **Role\*** (Select dropdown: Requester, IT Staff, Administrator)
  - สวิตช์ **Active Status (Yes/No Toggle):**
    - กรณีที่แอดมินแก้ไขบัญชีตนเอง: สวิตช์ Toggle และตัวเลือก Role จะถูก **Disabled** พร้อมคำอธิบาย *"You cannot deactivate or change the role of your own account."*
    - กรณีเป็น Active Administrator คนสุดท้ายของระบบ: สวิตช์ Toggle จะถูก **Disabled** เช่นกัน
  - ฟิลด์ **Initial Password (เฉพาะตอนสร้างผู้ใช้ใหม่):** ช่องกรอกรหัสผ่านเริ่มต้นที่แอดมินกำหนดเอง พร้อมข้อความกำกับ *"User will be required to set a new password on first login."*
  - ปุ่ม **Reset Initial Password (เฉพาะตอนแก้ไขผู้ใช้เดิม):** ปุ่มกดสำหรับตั้งรหัสผ่านเริ่มต้นใหม่ให้ผู้ใช้
  - ปุ่ม **Save User** และปุ่ม **Cancel**

---

## 4. Responsive Layout Requirements

| Viewport | Width | Behavior & Adaptations |
| :--- | :--- | :--- |
| **Desktop** | ≥ 992px | Multi-column layout: เมนูบาร์แนวนอนเต็มรูปแบบ, ตารางแสดงครบทุกคอลัมน์, Ticket Detail แบ่งคอลัมน์ข้อมูลและคอนโทรล (3:1), Admin drawer สไลด์จากขวา |
| **Tablet** | 768px – 991px | ปรับลดขนาด Padding, ยุบคอลัมน์ตารางที่ไม่วิกฤต (เช่น ซ่อน Created Date ย้ายไปไว้ใต้ Summary), ฟอร์มปรับเป็น 2 คอลัมน์สมดุล |
| **Mobile** | < 768px | **กฎเหล็ก: ห้ามมี Horizontal Overflow / Scrollbar แนวนอนเด็ดขาด**<br>- Navigation Bar ปรับเป็น Mobile Menu / Dropdown<br>- ตาราง Ticket Queue และ User List ปรับการแสดงผลจาก Table เป็น **Card View List** เรียงซ้อนกันแนวตั้ง<br>- ปุ่มกดและ Dropdown ขยายเต็มความกว้าง (Full-width) มี Touch target ขนาดไม่ต่ำกว่า 44x44px |

---

## 5. Accessibility (A11y) & Feedback Rules

1. **Keyboard Navigation:** ทุกปุ่ม (Buttons), ฟิลด์กรอก (Inputs), และเมนู (Dropdowns) ต้องสามารถเข้าถึงและใช้งานได้ผ่านปุ่ม `Tab`, `Space`, และ `Enter` โดยมี Focus Outline สีเขียวอ่อน (`ring-2 ring-emerald-500`) ที่มองเห็นได้ชัดเจน
2. **Form Validation Feedback:** ทุกฟิลด์ที่กรอกผิดหรือเว้นว่าง ต้องแสดงข้อความแจ้งเตือนสีแดงใต้ฟิลด์ทันทีหลังเบลอ (On Blur) หรือหลังกด Submit โดยฟิลด์จะมีกรอบสีแดงกำกับ
3. **Button Busy States:** ปุ่ม Submit ทุกปุ่มเมื่อถูกคลิก ต้องเปลี่ยนข้อความเป็นสถานะกำลังประมวลผล (เช่น *"Signing In..."*, *"Saving..."*) แสดง Spinner และมีสถานะ `disabled` ป้องกัน Double-click
4. **Color Contrast:** อัตราส่วนคอนทราสต์ของตัวอักษรและพื้นหลังต้องผ่านเกณฑ์ WCAG AA (อย่างน้อย 4.5:1 สำหรับ Body text และ 3:1 สำหรับตัวอักษรขนาดใหญ่)
5. **Safe Server Error Feedback:** หากเกิดข้อผิดพลาดจากเครือข่ายหรือเซิร์ฟเวอร์ ระบบต้องแสดง Toast หรือ Notification Banner ที่อธิบายปัญหาสุภาพ ไม่เปิดเผยข้อมูลเทคนิคหรือ Stack trace

---

## 6. Visual Inspection Checklist

- [ ] สีหลัก ส่วนหัว และปุ่มต่างๆ ถูกต้องตามรหัสสี Zen Green (`#006B3C`, `#0B7A46`, `#EAF6EF`)
- [ ] Navigation Bar แสดงเมนูตรงตามบทบาทของผู้ใช้ที่ล็อกอินเท่านั้น
- [ ] ป้ายสถานะ (Badges) ทุกประเภทมีทั้งข้อความและสีที่แยกแยะได้อย่างชัดเจน
- [ ] การแสดงผลช่องแก้ไขได้ (Editable) และช่องอ่านอย่างเดียว (Read-only) มีความแตกต่างชัดเจน
- [ ] กล่อง Internal Notes มีการใช้สีและป้ายเตือนความปลอดภัยแยกขาดจาก Public Comments ชัดเจน
- [ ] หน้าจอในขนาด Mobile (< 768px) ไม่มีแถบเลื่อนแนวนอน (No horizontal scrolling)
- [ ] ฟอร์ม Login และ Change Password แสดงสถานะ Busy, Error, และ Dynamic Checklist ถูกต้อง
- [ ] หน้า Admin User Management ป้องกันการปิดการใช้งานตนเองและแอดมินคนสุดท้ายอย่างถูกต้อง
