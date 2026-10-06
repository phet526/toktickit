# Lab 4 Evidence & Screenshot Catalog

เอกสารรวบรวมหลักฐานภาพหน้าจอ (Screenshots) ทั้งหมดสำหรับจัดทำรายงานสรุปผลการดำเนินงาน **Sprint 4 / Lab 4**

---

## 1. Actions Taken & Work History (`screenshots/actions-taken/`)

| รูปภาพ | รายละเอียดและสิ่งที่แสดง | เกณฑ์ / Test ID ที่เกี่ยวข้อง |
| :--- | :--- | :--- |
| `01-actions-taken-empty-state.png` | สถานะตั๋วที่ยังไม่มีประวัติการทำงาน (Empty State) | AC-01, UI-01 |
| `02-add-action-taken-modal.png` | ฟอร์ม Modal สำหรับ IT Staff บันทึก Action Taken พร้อมสวิตช์ Follow-Up | AC-01, AC-03, UI-01 |
| `03-action-taken-form-validation-errors.png` | การตรวจสอบความถูกต้องของฟอร์ม (Validation Error เมื่อเปิด Follow-Up แต่ไม่ใส่โน้ต) | AC-03, BR-06, UI-02 |
| `04-actions-taken-table-view-staff.png` | ตาราง Actions Taken แสดงผลฝั่ง IT Staff (ปุ่มแก้ไข, วันที่, ผู้ปฏิบัติงาน, ผลลัพธ์) | AC-01, AC-04, UI-01 |
| `05-edit-action-taken-modal.png` | โมดอลแก้ไข Action Taken เดิม โดยคง `performedById` เดิมไว้ | AC-04, FR-05 |
| `06-ticket-detail-desktop-overview.png` | ภาพรวมหน้า Ticket Detail บน Desktop พร้อมประวัติการทำงานครบถ้วน | AC-01, AC-05 |
| `07-action-taken-modal-responsive-mobile.png` | โมดอลบันทึก Action Taken บนหน้าจอมือถือ (375px) ไม่ล้น ไม่ตกขอบ | NFR-02, Responsive |
| `08-actions-taken-requester-read-only.png` | มุมมอง Requester: เห็นรายการ Actions Taken ครบถ้วนในโหมด Read-Only (ไม่มีปุ่มแก้ไข/เพิ่ม) | AC-05, BR-03, UI-03 |
| `09-mobile-hamburger-nav-menu.png` | การเปิดเมนู Hamburger บนมือถือ (<768px) พร้อมลิงก์เมนู, โปรไฟล์ผู้ใช้ และปุ่ม Sign Out | NFR-02, Responsive |
| `10-mobile-stacked-card-followup.png` | การแสดงผล Actions Taken แบบ Stacked Card บนมือถือ (375px) พร้อมแถบสี Follow-up สีส้ม | NFR-02, E2E-08b |
| `11-actions-taken-requester-read-only.png` | ตรวจสอบมุมมอง Read-only ของ Requester บนตั๋วงานของตนเอง | AC-05, E2E-03 |

---

## 2. Ticket Workflow & Resolution Gate (`screenshots/ticket-workflow/`)

| รูปภาพ | รายละเอียดและสิ่งที่แสดง | เกณฑ์ / Test ID ที่เกี่ยวข้อง |
| :--- | :--- | :--- |
| `01-resolution-gate-blocked-warning.png` | Inline Warning Banner แจ้งเตือนเมื่อพยายามปรับเป็น Resolved โดยยังไม่มี Actions Taken หรือไม่มี Owner | AC-08, BR-08, UI-04 |
| `02-concurrency-conflict-409-modal.png` | Modal แจ้งเตือนข้อขัดแย้ง 409 Conflict (Optimistic Concurrency Control) พร้อมปุ่ม Refresh | AC-11, BR-11, UI-05 |
| `03-state-transition-reopened-options.png` | ตัวเลือกสถานะที่อนุญาตตาม State Transition Matrix เมื่อตั๋วอยู่ในสถานะ Reopened | AC-10, BR-10 |
| `04-ticket-status-resolved-success.png` | ตั๋วถูกปรับเป็นสถานะ Resolved สำเร็จหลังผ่านเงื่อนไข Resolution Gate ครบถ้วน | AC-09, BR-08, E2E-04 |
| `05-state-transition-resolved-options.png` | ตัวเลือกสถานะถัดไปจากสถานะ Resolved (สามารถ Closed หรือ Reopened ได้) | AC-10, BR-10, E2E-05 |
| `06-resolution-gate-blocked-warning.png` | ตรวจสอบ Banner ข้อความเตือน Resolution Gate บนมุมมองต่าง ๆ | AC-08, UI-04 |
| `07-ticket-status-resolved-success.png` | บันทึกประวัติสถานะ Resolved พร้อมความถูกต้องของข้อมูล | AC-09, E2E-04 |

---

## 3. Role Dashboards & Metrics Drill-Down (`screenshots/requester-dashboard/` & `screenshots/staff-dashboard/`)

### Requester Dashboard (`screenshots/requester-dashboard/`)
| รูปภาพ | รายละเอียดและสิ่งที่แสดง | เกณฑ์ / Test ID ที่เกี่ยวข้อง |
| :--- | :--- | :--- |
| `01-requester-dashboard-overview.png` | ภาพรวมแดชบอร์ด Requester แสดงตัวเลขสรุป 4 การ์ด (Open, In Progress, Resolved, Closed) และตั๋วล่าสุด | AC-13, UI-06, E2E-06 |
| `02-drilldown-open-tickets.png` | การกด Drill-down จากการ์ด Open ไปยังหน้า My Tickets พร้อมฟิลเตอร์ `status=OPEN` | AC-14, UI-06 |
| `03-drilldown-in-progress.png` | การกด Drill-down ไปยังหน้า My Tickets พร้อมฟิลเตอร์ `status=IN_PROGRESS` | AC-14, UI-06 |
| `04-drilldown-resolved.png` | การกด Drill-down ไปยังหน้า My Tickets พร้อมฟิลเตอร์ `status=RESOLVED` | AC-14, UI-06 |
| `05-drilldown-closed.png` | การกด Drill-down ไปยังหน้า My Tickets พร้อมฟิลเตอร์ `status=CLOSED` | AC-14, UI-06 |
| `06-requester-dashboard-realtime-resolved.png` | แดชบอร์ดอัปเดตตัวเลข Resolved ทันทีเมื่อตั๋วงานได้รับการแก้ไขสำเร็จ | AC-13, E2E-06 |

### IT Staff & Admin Dashboard (`screenshots/staff-dashboard/`)
| รูปภาพ | รายละเอียดและสิ่งที่แสดง | เกณฑ์ / Test ID ที่เกี่ยวข้อง |
| :--- | :--- | :--- |
| `01-staff-dashboard-overview.png` | ภาพรวมแดชบอร์ด IT Staff แสดง 6 การ์ดสถานะคิวงาน, กราฟแจกแจงตาม Priority และ Quick Actions | AC-15, UI-07, E2E-07 |
| `02-drilldown-unassigned-tickets.png` | การกด Drill-down จากการ์ด Unassigned ไปยังหน้า Staff Queue ที่กรองเฉพาะตั๋วที่ยังไม่มีผู้รับผิดชอบ | AC-15, FR-12 |
| `03-drilldown-new-tickets.png` | การกด Drill-down ไปยังคิวงานตั๋วใหม่ (`status=NEW`) | AC-15, UI-07 |
| `04-admin-dashboard-summary-overview.png` | แดชบอร์ดมุมมอง Administrator พร้อมแผงสรุปจำนวนบัญชีผู้ใช้งานทั้งระบบ (Admin Summary) | AC-15, BR-15, E2E-07b |
| `05-admin-drilldown-new-tickets.png` | ผู้ดูแลระบบกด Drill-down ตรวจสอบตั๋วเข้าใหม่ | AC-15, BR-15 |
| `06-admin-drilldown-waiting-requester.png` | การกด Drill-down ตรวจสอบตั๋วที่อยู่ในสถานะรอผู้แจ้งตอบกลับ (Waiting Requester) | AC-15, BR-15 |
| `07-staff-dashboard-mobile-responsive.png` | แดชบอร์ด IT Staff บนหน้าจอมือถือ (375px) จัดเรียงแบบ 1 คอลัมน์ ไร้ Horizontal Scrollbar | NFR-02, E2E-08a |
| `08-admin-summary-panel-mobile.png` | แผงสรุปสถิติผู้ดูแลระบบบนหน้าจอมือถือ รองรับ Responsive สมบูรณ์ | NFR-02, E2E-08a |
