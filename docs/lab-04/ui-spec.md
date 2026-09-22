# Lab 4 UI Specification: Zen Green Dashboards, Actions Taken & Responsive Polish

## 1. Design System & Zen Green Theme Tokens

ระบบใน Sprint 4 สานต่อและยึดมั่นในมาตรฐานการออกแบบ **Zen Green Design Language** จาก Lab 2 และ Lab 3 เพื่อสร้างประสบการณ์ใช้งานที่สะอาดตา มีระเบียบ เป็นมืออาชีพ และสอดคล้องกันทุกหน้าจอ:

### 1.1 Color Palette & Visual Tokens
- **Primary Brand Green (`#006B3C`):** ใช้สำหรับ Application Header, เมนูนำทางหลัก, ปุ่มกด Primary Actions (`Save Action`, `Create Ticket`), และสถานะ Active Menu Indicator
- **Secondary / Hover Green (`#0B7A46`):** สีสถานะ Hover ของปุ่มกดหลัก และแถบเน้นของ Dashboard Cards
- **Soft Green Background (`#EAF6EF` / `#F4FBF7`):** สีพื้นหลังของการ์ดสรุปความสำเร็จ, แบนเนอร์แจ้งเตือนข้อมูล, และกรอบข้อความ Public Comments
- **Neutral Page Canvas (`#F5F7F6`):** สีพื้นหลังหลักของทุกหน้าจอ เพื่อลดความเมื่อยล้าของสายตา
- **Surface / Card Background (`#FFFFFF`):** สีขาวบริสุทธิ์สำหรับ Dashboard Metric Cards, Data Tables, Modals, และ Detail Panels
- **Border & Dividers (`#E2E8F0` / `#D1D5DB`):** เส้นขอบฟอร์ม เส้นแบ่งตาราง และกรอบการ์ดข้อมูล
- **Typography Palette:**
  - Headings / Body Primary: Dark Charcoal (`#1F2937`)
  - Body Secondary / Subtitles: Slate Gray (`#4B5563`)
  - Captions / Muted Labels: Muted Gray (`#6B7280`)
- **Semantic Feedback & Alert Colors:**
  - **Error / Danger (`#DC2626` / Light Bg `#FEF2F2` / Border `#EF4444`):** ใช้สำหรับข้อความเตือนเมื่อไม่ผ่าน Resolution Gate, ฟิลด์ Validation Error, และแจ้งเตือน Concurrency Conflict
  - **Warning / Follow-up Alert (`#D97706` / Light Bg `#FFFBEB` / Border `#F59E0B`):** ใช้สำหรับป้ายเตือนงานที่ต้องติดตามผล (`Follow-Up Required`) และกรอบ Internal Notes
  - **Success (`#16A34A` / Light Bg `#F0FDF4` / Border `#86EFAC`):** การแจ้งเตือนบันทึก Actions Taken สำเร็จ และสถานะตั๋วที่ได้รับการแก้ไขแล้ว (`Resolved`)

### 1.2 Status & Badge Standards
ป้ายสถานะทุกประเภทต้องแสดง **"คู่สีควบคู่กับข้อความที่ชัดเจนเสมอ" (ห้ามใช้สีสื่อความหมายเพียงอย่างเดียว เพื่อรองรับ Accessibility)**:
- **Ticket Status Badges:**
  - `New`: สีเทาฟ้า (`#E0F2FE` / Text `#0369A1`)
  - `Open`: สีน้ำเงินคราม (`#EEF2FF` / Text `#4338CA`)
  - `In Progress`: สีส้มอำพัน (`#FEF3C7` / Text `#B45309`)
  - `Waiting for Requester`: สีม่วงอ่อน (`#F3E8FF` / Text `#6B21A8`)
  - `Resolved`: สีเขียวมรกต (`#DCFCE7` / Text `#15803D`)
  - `Closed`: สีเทากลาง (`#F3F4F6` / Text `#4B5563`)
  - `Reopened`: สีเหลืองมัสตาร์ด (`#FEF9C3` / Text `#854D0E`)
  - `Cancelled`: สีแดงอ่อน (`#FEE2E2` / Text `#B91C1C`)
- **Priority Badges (IT Priority & Requested Priority):**
  - `Low`: ป้ายสีเขียวอ่อน (`#DCFCE7` / `#166534`)
  - `Medium`: ป้ายสีเหลืองส้ม (`#FEF3C7` / `#92400E`)
  - `High`: ป้ายสีส้มแดง (`#FFEDD5` / `#C2410C`)
  - `Critical`: ป้ายสีแดงเข้ม (`#FEE2E2` / `#991B1B`)
- **Follow-up Indicators:**
  - `Follow-up Required`: ป้ายสีเหลืองเตือน (`#FEF3C7` / `#B45309`) พร้อมไอคอนนาฬิกาหรือเครื่องหมายเตือน
  - `No Follow-up`: ป้ายสีเทาสบายตา (`#F3F4F6` / `#6B7280`)

---

## 2. Application Shell & Role-Based Navigation

Application Shell ทำหน้าที่เป็นกรอบโครงสร้างนำทางหลัก โดยใน Sprint 4 จะเพิ่มเมนู **Dashboard** เป็นหน้าแรกเริ่มต้น (Default Landing Page) ของทุกบทบาท:

1. **Top Navigation Bar (Zen Green `#006B3C`):**
   - **ฝั่งซ้าย:** โลโก้ TokTickIT สามารถคลิกเพื่อกลับสู่หน้าแรกตามบทบาทของผู้ใช้
   - **เมนูนำทางตามบทบาท (Role-based Navigation):**
     - **Requester:** `Dashboard` (Active เมื่ออยู่ที่ `/requester/dashboard` หรือ `/`), `My Tickets`, `Create Ticket`
     - **IT Staff:** `Dashboard` (Active เมื่ออยู่ที่ `/staff/dashboard` หรือ `/`), `Ticket Queue`
     - **Administrator:** `Dashboard` (Active เมื่ออยู่ที่ `/staff/dashboard` หรือ `/`), `Ticket Queue`, `User Management`
     *(มีแถบขีดเส้นใต้สีขาวหรือไฮไลต์พื้นหลังสีเขียวเข้มระบุตำแหน่งหน้าปัจจุบันอย่างชัดเจน)*
   - **ฝั่งขวา:** แสดงชื่อเต็มของผู้ใช้, Role Badge, และ Dropdown Menu สำหรับเปลี่ยนรหัสผ่านและออกจากระบบ (Logout)
2. **State Protection:**
   - ผู้ใช้ที่ `mustChangePassword = true` จะถูกกักตัวไว้ที่หน้า Change Password โดยไม่มีแถบเมนูนำทางหลัก จนกว่าจะเปลี่ยนรหัสผ่านสำเร็จ

---

## 3. Screen Specifications

### 3.1 IT Staff Dashboard Screen (Section 8.1)

หน้าจอแดชบอร์ดสรุปงานเชิงปฏิบัติการของเจ้าหน้าที่ไอทีและผู้ดูแลระบบ มุ่งเน้นความกระชับและการเชื่อมโยงข้อมูลสู่การปฏิบัติจริง:

```
+-----------------------------------------------------------------------------------+
| Welcome back, Michael!                                               [⟳ Refresh]  |
| Here's what's happening with your queue today.                                    |
+-----------------------------------------------------------------------------------+
|  [ New ]      [ Open ]      [ In Progress ]  [ Waiting Req ]  [ My Assigned ]     |
|    14            23               18                7               16            |
| +2 from yest  -1 from yest   +4 from yest      +1 from yest    +1 from yest       |
| (View Queue)  (View Queue)   (View Queue)      (View Queue)    (View Queue)       |
+--------------------------------------------------+--------------------------------+
| My Recent Tickets                       View all | Quick Actions                  |
| ------------------------------------------------ | ------------------------------ |
| TKT-2026-000134  [In Progress]  May 12, 09:14 AM | [+] Create Ticket              |
| Laptop battery drains quickly                    | [🔍] Search Tickets            |
|                                                  | [📋] My Queue                  |
| TKT-2026-000130  [Open]         May 10, 02:15 PM | ------------------------------ |
| Printer keeps showing offline                    | Tickets by IT Priority         |
|                                                  | Low: 12  | Medium: 28          |
| TKT-2026-000128  [In Progress]  May 9, 05:22 PM  | High: 17 | Critical: 4         |
| Outlook freezing intermittently                  |                                |
|                                                  | [Admin Summary - If Admin]     |
| TKT-2026-000123  [Open]         May 9, 10:05 AM  | Active Users: 15 (Staff: 5)    |
| Phone not receiving calls                        |                                |
+--------------------------------------------------+--------------------------------+
```

- **Header Banner:**
  - ข้อความทักทาย: *"Welcome back, {User Name}!"* พร้อมข้อความกำกับ *"Here's what's happening with your queue today."*
  - ปุ่ม **Refresh (`⟳`):** สำหรับดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์แบบเรียลไทม์ พร้อมแสดงหมุนติ้วขณะกำลังโหลด
- **Metric Cards Row:**
  - ประกอบด้วย 5 การ์ดหลัก: `New`, `Open`, `In Progress`, `Waiting for Requester`, และ `My Assigned`
  - ภายในแต่ละการ์ด: แสดงชื่อสถานะ, ตัวเลขขนาดใหญ่เด่นชัด (Font Size 28–32px), ข้อความเปรียบเทียบ/สถานะ, และลิงก์ Drill-down
  - **Drill-down Action:** เมื่อคลิกที่การ์ด ระบบจะนำทางไปยังหน้า `/staff/queue` พร้อมแนบ Query Parameter สำหรับกรองข้อมูลสถานะนั้นๆ ทันที
- **Two-Column Operational Layout (Desktop ≥ 992px):**
  - **คอลัมน์ซ้าย (My Recent Tickets):**
    - แสดงรายการตั๋วที่ได้รับมอบหมายล่าสุด 5 รายการ (`updatedAt DESC`)
    - แต่ละแถวแสดง: เลขตั๋ว (คลิกเพื่อเปิดหน้า Ticket Detail ได้ทันที), Status Badge, หัวข้อสรุปย่อ (Summary), และวันเวลาอัปเดตล่าสุด
    - ลิงก์ **"View all":** นำทางไปยัง `/staff/queue?owner=me`
    - Empty State: แสดงไอคอนกล่องว่าง พร้อมข้อความ *"No recent tickets assigned to you."*
  - **คอลัมน์ขวา (Quick Actions & Analytics):**
    - **Quick Actions Panel:** ปุ่มทางลัดขนาดใหญ่ 3 ปุ่ม ได้แก่ `+ Create Ticket` (ไปหน้าสร้างตั๋ว), `🔍 Search Tickets` (ไปหน้า Queue โฟกัสช่องค้นหา), และ `📋 My Queue` (เปิดตั๋วที่ตนเองดูแล)
    - **Tickets by Priority Panel:** แสดงตัวเลขสรุปตั๋วที่ยังเปิดอยู่จำแนกตามความสำคัญ (Low, Medium, High, Critical) พร้อมป้ายสีประจำระดับ
    - **Administrator Summary Extension (เฉพาะ Admin):** แสดงการ์ดสรุปจำนวนผู้ใช้งานในระบบ (`totalActiveUsers`, `activeStaff`, `activeRequesters`, `activeAdmins`) พร้อมปุ่มลิงก์ไปยัง User Management
- **Safe Failure & Loading States:**
  - ระหว่างโหลดข้อมูล: แสดง Skeleton Placeholder หรือ Spinner สีเขียว `#006B3C`
  - หาก API ล้มเหลว: แสดง Error Banner สีแดง พร้อมปุ่ม Retry เพื่อดึงข้อมูลใหม่โดยไม่ทำให้หน้าจอพัง

---

### 3.2 Requester Dashboard Screen (Section 8.2)

หน้าจอแดชบอร์ดสำหรับผู้แจ้งปัญหา มุ่งเน้นการติดตามสถานะคำร้องของตนเองอย่างรวดเร็วและเข้าใจง่าย:

```
+-----------------------------------------------------------------------------------+
| Welcome, Jennifer!                                                                |
| Here's the latest on your requests.                                               |
+-----------------------------------------------------------------------------------+
|  [ My Open Tickets ]    [ In Progress ]       [ Resolved ]        [ Closed ]      |
|           3                    2                    5                 12          |
|       (View all)           (View all)           (View all)        (View all)      |
+--------------------------------------------------+--------------------------------+
| My Recent Tickets                       View all | Quick Actions                  |
| ------------------------------------------------ | ------------------------------ |
| TKT-2026-000134  [In Progress]  May 12, 09:14 AM | [+] Create Ticket              |
| Laptop battery drains quickly                    | Submit a new request           |
|                                                  |                                |
| TKT-2026-000122  [Open]         May 11, 02:30 PM | [📋] View My Tickets           |
| Request software access                          | Track existing requests        |
|                                                  |                                |
| TKT-2026-000121  [Waiting Req]  May 9, 11:05 AM  |                                |
| Need new monitor                                 |                                |
+--------------------------------------------------+--------------------------------+
```

- **Header Banner:** ข้อความทักทาย *"Welcome, {User Name}!"* และ *"Here's the latest on your requests."*
- **Metric Cards Row:**
  - ประกอบด้วย 4 การ์ด: `My Open Tickets`, `In Progress`, `Resolved`, และ `Closed`
  - แต่ละการ์ดมีปุ่ม **"View all"** ที่คลิกแล้วจะนำทางไปยังหน้า `/my-tickets?status=...` เพื่อดูรายละเอียดตั๋วกลุ่มนั้น
- **Two-Column Layout:**
  - **ฝั่งซ้าย (My Recent Tickets):** แสดงตั๋ว 5 รายการล่าสุดของผู้แจ้ง พร้อม Ticket No, Status Badge, วันเวลา และลิงก์คลิกเปิดดู Ticket Detail
  - **ฝั่งขวา (Quick Actions):** ปุ่มกดขนาดใหญ่ 2 ปุ่ม ได้แก่ `+ Create Ticket` (ส่งคำขอใหม่) และ `📋 View My Tickets` (ดูรายการตั๋วทั้งหมด)
- **Data Isolation:** ตั๋วและตัวเลขทั้งหมดถูกจำกัดสิทธิ์เฉพาะบัญชีของตนเองเท่านั้น ไม่มีการแสดงข้อมูลของผู้ใช้อื่น

---

### 3.3 Actions Taken บนหน้า Ticket Detail Screen (Section 8.3)

เพิ่มส่วนแสดงผลและบันทึก Actions Taken ใต้รายละเอียดตั๋วและไฟล์แนบเดิม เพื่อบันทึกประวัติการทำงานจริง:

```
+-----------------------------------------------------------------------------------+
| Actions Taken (2)                                           [+ Add Action Taken]  |
+-----------------------------------------------------------------------------------+
| Date & Time        Action & Result             Performer       Follow-Up & Notes  |
| --------------------------------------------------------------------------------- |
| May 12, 10:30 AM   Checked network switch      Sarah Johnson   [No Follow-up]     |
|                    Result: Port was flapping   (IT Staff)      Att: log-dump.txt  |
|                    and reset successfully.                     [Edit]             |
| --------------------------------------------------------------------------------- |
| May 12, 02:15 PM   Replaced patch cable        Alex Miller     [Follow-Up Req] ⚠  |
|                    Result: User PC connected.  (IT Staff)      Note: Test on Mon  |
|                                                                [Edit]             |
+-----------------------------------------------------------------------------------+
```

- **Section Header:**
  - หัวข้อ "Actions Taken" พร้อม Badge นับจำนวนรายการทั้งหมด เช่น `(2)`
  - ปุ่ม `+ Add Action Taken` (สีเขียว Zen Green `#006B3C`): **แสดงเฉพาะ IT Staff และ Administrator เท่านั้น** (ซ่อนในมุมมองของ Requester)
- **Actions Taken Table / List View:**
  - **Date/Time Column:** แสดงวันและเวลาที่ลงมือปฏิบัติงานในรูปแบบที่อ่านง่าย (`MMM DD, YYYY hh:mm A`)
  - **Action & Result Column:** แสดง Action Description ควบคู่กับ Result อย่างเป็นระเบียบชัดเจน
  - **Performer Column:** แสดงชื่อเจ้าหน้าที่ผู้ลงมือกระทำ พร้อม Role Badge
  - **Follow-Up & Notes Column:**
    - แสดงป้าย `Follow-Up Req` สีส้มอำพัน หากมีงานค้างติดตาม พร้อมข้อความ Follow-up Note
    - หากไม่มีงานค้าง แสดงป้าย `No Follow-up` สีเทา
    - แสดงไอคอนคลิปหนีบกระดาษพร้อมข้อความ Attachment Notes หากมีการอ้างอิงชื่อไฟล์
  - **Action Controls:** ปุ่ม `Edit` (แสดงเฉพาะ IT Staff/Admin)
- **Requester View (Read-Only Mode):**
  - แสดงตารางข้อมูล Actions Taken ทั้งหมดเหมือนกับเจ้าหน้าที่ เพื่อความโปร่งใสในการให้บริการ
  - **ซ่อนปุ่ม `+ Add Action Taken` และปุ่ม `Edit` ทั้งหมด**
- **Empty State:** เมื่อตั๋วยังไม่มีการบันทึก Actions Taken จะแสดงกรอบสีเทาอ่อนพร้อมข้อความ *"No actions taken recorded yet."*

---

### 3.4 Modal / Drawer: Add & Edit Action Taken Form

เมื่อคลิกปุ่ม `+ Add Action Taken` หรือ `Edit` จะเปิด Modal หน้าต่างขึ้นมากลางหน้าจอ:

- **Modal Header:** หัวข้อ *"Add Action Taken"* หรือ *"Edit Action Taken"* พร้อมปุ่มปิด `✕`
- **Form Fields:**
  1. **Action Date & Time:** Input ประเภท DateTime Picker ค่าเริ่มต้นเป็นวันเวลาปัจจุบัน (ปรับเปลี่ยนได้)
  2. **Action Description (*):** Textarea ขนาดความสูง 3–4 แถว, มี Placeholder ตัวอย่าง, จำกัดไม่เกิน 2,000 ตัวอักษร, มีตัวนับจำนวนตัวอักษรด้านล่าง
  3. **Result (*):** Textarea ขนาดความสูง 3–4 แถว, มี Placeholder ตัวอย่าง, จำกัดไม่เกิน 2,000 ตัวอักษร, มีตัวนับตัวอักษร
  4. **Performed By:** Input แบบ Read-only แสดงชื่อและอีเมลของเจ้าหน้าที่ผู้ล็อกอินปัจจุบัน (ไม่สามารถแก้ไขได้ เพื่อความโปร่งใสของ Audit Trail)
  5. **Follow-Up Required?:** กล่อง Checkbox หรือ Toggle Switch สไตล์ Zen Green
  6. **Follow-up Note (*เมื่อเปิด Follow-Up):**
     - หากติ๊ก Follow-Up Required: ช่อง Textarea จะปรากฏขึ้นมาพร้อมเครื่องหมายดอกจันสีแดงบังคับกรอก (Required Validation)
     - หากไม่ติ๊ก: ช่องนี้จะถูกซ่อนหรือปิดการใช้งานอัตโนมัติ
  7. **Attachment Notes:** ช่องกรอกข้อความบรรทัดเดียว (Single-line input) สำหรับระบุชื่อไฟล์อ้างอิง เช่น *"screenshot-vpn-error.png"* (จำกัด 500 ตัวอักษร)
- **Modal Footer Actions:**
  - ปุ่ม **Cancel:** ปิดหน้าต่างโดยไม่บันทึก
  - ปุ่ม **Save Action / Update Action (Primary Green `#006B3C`):**
    - เมื่อกดบันทึก: ปุ่มจะเปลี่ยนเป็นสถานะ Disabled ทันที พร้อมแสดง Spinner หมุนติ้ว (Busy State) เพื่อป้องกัน Double-click
    - หากบันทึกสำเร็จ: หน้าต่างจะปิดลง และรายการ Actions Taken ในหน้าตั๋วจะรีเฟรชข้อมูลล่าสุดทันที

---

### 3.5 Resolution Gate & Concurrency User Feedback (Section 8.4)

#### 3.5.1 Resolution Gate Feedback บน Dropdown สถานะ
- เมื่อเจ้าหน้าที่ IT Staff เปิด Dropdown เปลี่ยนสถานะตั๋วบนหน้า Ticket Detail:
  - หากตั๋ว**ยังไม่มีเจ้าหน้าที่รับผิดชอบ** หรือ**ยังไม่มีบันทึก Actions Taken แม้แต่รายการเดียว**:
    - ตัวเลือกสถานะ `Resolved` จะมีข้อความเตือนกำกับ หรือเมื่อเลือกแล้วกดบันทึก ระบบจะแสดง **Inline Warning Banner สีแดง** ใต้ช่องเลือกสถานะทันที:
      > ⚠️ **Resolution Gate Failed:** ไม่สามารถเปลี่ยนสถานะเป็น Resolved ได้ เนื่องจากตั๋วนี้ต้องมีผู้รับผิดชอบหลักและมีบันทึก Actions Taken อย่างน้อย 1 รายการก่อนปิดงาน
    - การเปลี่ยนสถานะจะไม่ถูกส่งไปทำงาน และตั๋วจะคงสถานะเดิมไว้

#### 3.5.2 Concurrency / Stale Update Alert (409 Conflict)
- หากมีเจ้าหน้าที่คนอื่นแก้ไขข้อมูลตั๋วหรือ Actions Taken ในระหว่างที่ผู้ใช้เปิดหน้านี้ค้างไว้ แล้วผู้ใช้กดบันทึกข้อมูล:
  - ระบบจะแสดง **Conflict Dialog Modal** ขึ้นมาเตือนอย่างปลอดภัย:
    > ⚠️ **Data Out of Date (409 Conflict)**  
    > ตั๋วงานนี้ได้รับการอัปเดตข้อมูลโดยผู้ใช้งานอื่นแล้ว โปรดกดปุ่ม **"Refresh Latest Data"** เพื่อโหลดข้อมูลล่าสุดก่อนดำเนินการใหม่อีกครั้ง
  - ข้อมูลที่ผู้ใช้กรอกค้างไว้ในฟอร์มจะไม่ถูกลบทิ้ง เพื่อให้ผู้ใช้สามารถคัดลอกหรือปรับปรุงต่อได้ (Data Protection after Recoverable Failure)

---

## 4. Responsive Breakpoints & Mobile Optimization Standards

เพื่อให้เป็นไปตามข้อกำหนด **NFR-02 และ Section 8.6** ระบบจะต้องแสดงผลอย่างสมบูรณ์แบบบนทุกอุปกรณ์ และ**ต้องไม่มีแถบเลื่อนแนวนอน (Zero Horizontal Overflow: `scrollWidth === clientWidth`) 100%**:

| Breakpoint | ขนาดหน้าจอ (Viewport Width) | รูปแบบการจัดวาง Layout & UI Components |
| :--- | :--- | :--- |
| **Desktop** | ≥ 992px | • แดชบอร์ดแสดงการ์ดสถิติเรียงแถวแนวนอน 4–5 คอลัมน์<br>• ส่วนแสดงตั๋วล่าสุดและ Quick Actions จัดวาง 2 คอลัมน์ซ้าย-ขวา<br>• Actions Taken แสดงผลเป็น Data Table เต็มความกว้าง |
| **Tablet** | 768px – 991px | • การ์ดสถิติบนแดชบอร์ดปรับเป็น Grid 2 คอลัมน์<br>• ส่วนเนื้อหาปรับการวางคอลัมน์ให้อยู่ในระยะพอดีหน้าจอ<br>• ตาราง Actions Taken แสดงผลแบบ Compact Table |
| **Mobile** | < 768px | • การ์ดสถิติบนแดชบอร์ดปรับเป็นการ์ดแถวเดี่ยวแนวตั้ง (Single Column)<br>• **Actions Taken แปลงจากตารางเป็นการ์ดแนวตั้ง (Stacked Cards View):** แต่ละการ์ดระบุ Date/Time, Description, Result, Performer, และป้าย Follow-Up อย่างชัดเจน<br>• เมนูนำทางพับเก็บเป็น Dropdown Drawer<br>• ป้องกันปัญหา Overflow ด้วย `max-width: 100%` และ `overflow-x: hidden` |

---

## 5. Accessibility (A11y) & Feedback Rules

1. **Keyboard Navigation:** ทุกปุ่ม (Buttons), ฟิลด์กรอก (Inputs), และเมนู (Dropdowns) ต้องสามารถเข้าถึงและใช้งานได้ผ่านปุ่ม `Tab`, `Space`, และ `Enter` โดยมี Focus Outline สีเขียว (`#006B3C` หนา 2px) ที่มองเห็นได้ชัดเจน
2. **Form Validation Feedback:** ทุกฟิลด์ที่กรอกผิดหรือเว้นว่าง ต้องแสดงข้อความแจ้งเตือนสีแดงใต้ฟิลด์ทันทีหลังเบลอ (On Blur) หรือหลังกด Submit โดยฟิลด์จะมีกรอบสีแดงกำกับ (รวมถึงช่อง Follow-up Note เมื่อเปิดสวิตช์ Follow-Up Required)
3. **Button Busy States:** ปุ่ม Submit ทุกปุ่มเมื่อถูกคลิก (เช่น `Save Action`, `Update Status`) ต้องเปลี่ยนข้อความเป็นสถานะกำลังประมวลผล แสดง Spinner และมีสถานะ `disabled` ป้องกัน Double-click
4. **Color Contrast:** อัตราส่วนคอนทราสต์ของตัวอักษรและพื้นหลังต้องผ่านเกณฑ์ WCAG AA (อย่างน้อย 4.5:1 สำหรับ Body text และ 3:1 สำหรับตัวอักษรขนาดใหญ่)
5. **Safe Server Error Feedback:** หากเกิดข้อผิดพลาดจากเครือข่ายหรือเซิร์ฟเวอร์ ระบบต้องแสดง Toast หรือ Notification Banner ที่อธิบายปัญหาสุภาพ ไม่เปิดเผยข้อมูลเทคนิคหรือ Stack trace และแสดง Modal แจ้งเตือนเมื่อเกิด 409 Stale Conflict

---

## 6. Visual Inspection Checklist

- [ ] สีหลัก ส่วนหัว และปุ่มต่างๆ ถูกต้องตามรหัสสี Zen Green (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F4FBF7`)
- [ ] Navigation Bar แสดงเมนูตรงตามบทบาทของผู้ใช้ที่ล็อกอินเท่านั้น พร้อม Active State ชัดเจน
- [ ] ป้ายสถานะ (Badges) ทุกประเภทมีทั้งข้อความและสีที่แยกแยะได้อย่างชัดเจน (Status, Priority, Follow-up)
- [ ] การแสดงผลช่องแก้ไขได้ (Editable) และช่องอ่านอย่างเดียว (Read-only) มีความแตกต่างชัดเจน (รวมถึงการซ่อนปุ่ม Add/Edit Actions Taken สำหรับ Requester)
- [ ] แดชบอร์ดทั้ง Requester และ IT Staff แสดงผลข้อมูลถูกต้องตามบทบาท และลิงก์ Drill-down ใช้งานได้จริงทุกการ์ด
- [ ] ฟอร์ม Modal Actions Taken มีการตรวจสอบความถูกต้องของฟิลด์ และบังคับกรอก Follow-up Note เมื่อเลือก Follow-Up Required
- [ ] มีการแสดงข้อความแจ้งเตือนสีแดงเมื่อไม่ผ่าน Resolution Gate และมี Modal เตือนเมื่อเกิด 409 Conflict
- [ ] หน้าจอในขนาด Mobile (< 768px) ไม่มีแถบเลื่อนแนวนอน (No horizontal scrolling) โดย Actions Taken ปรับเป็นการ์ดแนวตั้ง (Stacked Cards)

