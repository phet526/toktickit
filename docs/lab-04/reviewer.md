# Lab 4 — Peer Review Record

**Author:** นายพชร มัสมี — 67070501066 — GitHub: @phet526  
**Peer reviewer:** นายวัทธิกร ศรีประดับทอง — 67070501073 — GitHub: @ILoveSiesta  

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|:---|:-------|:-----------------|
| [#46](https://github.com/phet526/toktickit/pull/46) | feat/lab4-specs | Pending |
| | feat/lab4-actions-taken-foundation | Pending |
| | feat/lab4-actions-taken-ui | Pending |
| | feat/lab4-ticket-workflow | Pending |
| | feat/lab4-dashboards | Pending |
| | feat/lab4-hardening-regression | Pending |
| | release/lab-04-integration | Pending |

### Reviewer comments & responses:
- **PR #46 (feat/lab4-specs):**
  - **Reviewer comment received (โดย @ILoveSiesta):** ระบุข้อสังเกตและส่วนที่ตกหล่น 6 จุด:
    1. ขาด `performance-smoke` และ `migration` ในตาราง Planned Tests (`tests.md`) ตาม Section 10
    2. ข้อขัดแย้งเรื่อง "Recently Resolved Tickets" ระหว่าง `specification.md` (BR-14) กับ `api-spec.md`
    3. ขาดการแสดงผลการ์ด Unassigned Tickets บนโครงสร้างหน้าจอ IT Staff Dashboard UI (`ui-spec.md`)
    4. ขาดการระบุ Time Zone และ Date Boundaries ในสัญญา Dashboard (`api-spec.md`) ตาม Section 6.2
    5. ตกหล่น Endpoint `GET /api/health` ในรายการ Preserved Endpoints (`api-spec.md`)
    6. ข้อควรระวังสำหรับการตรวจรายงาน Part 6 (Rubric หน้า 11) เกี่ยวกับ Ticket Lifecycle (assign, status transition, complete, cancel, inactive-assignee rejection) บนหน้าจอ Ticket Detail
  - **How I responded:**
    - **เห็นด้วย 100% ทั้ง 6 จุด** เนื่องจากตรงตามข้อกำหนดในเอกสารโจทย์ `SE Lab 4.pdf` ทุกประการ และได้ดำเนินการปรับปรุงแก้ไขเอกสารทันที:
      1. เพิ่มประเภทการทดสอบใน Section 1 และเพิ่มเคส `MIGR-01` (Migration / Legacy Data Integrity) และ `SMOKE-01` (Performance Smoke Test) ลงในตาราง Planned Tests, Traceability Matrix, และ Final Results Summary ใน `tests.md`
      2. ปรับปรุงกฎ BR-14 ใน `specification.md` และ Section 5.1 ใน `api-spec.md` ให้ชัดเจนว่า "Recently Updated Tickets" คือลิสต์ตั๋ว 5 รายการล่าสุด (`recentTickets`) ส่วน "Recently Resolved Tickets" คือตัวเลขสถิติรวม (`metrics.resolvedTickets`) พร้อมระบบ Drill-down `/my-tickets?status=Resolved`
      3. ปรับ ASCII Wireframe และรายละเอียดของ IT Staff Dashboard ใน `ui-spec.md` และ `specification.md` ให้แสดงครบถ้วนทั้ง 6 การ์ดรวมถึง `Unassigned Tickets` พร้อมลิงก์ Drill-down `/staff/queue?owner=unassigned`
      4. เพิ่มหัวข้อ Section 5.3 ใน `api-spec.md` และข้อ 6–7 ใน `specification.md` ระบุ Time Zone ระบบเป็น `Asia/Bangkok (UTC+7)`, รูปแบบการส่งข้อมูล ISO-8601 UTC, ขอบเขตวันปฏิทิน (`00:00:00.000`–`23:59:59.999`), และนิยามค่าเปรียบเทียบ "from yesterday"
      5. เพิ่ม `GET /api/health` ภายใต้หมวด System Health & Readiness ใน Section 8 ของ `api-spec.md`
      6. เพิ่มคำอธิบายการบูรณาการ Ticket Lifecycle Controls (Assign Owner, Inactive-assignee validation, Complete/Resolved ผ่าน Gate, Cancel) บนหน้าจอ Ticket Detail ร่วมกับ Actions Taken ใน `specification.md` และ `ui-spec.md` เพื่อรองรับเกณฑ์ Rubric Part 6 (10 คะแนน) ครบถ้วน

---

## Pull Requests I reviewed (authored by my partner)
| PR | Branch | Reviewer verdict |
|:---|:-------|:-----------------|
| | | |

### Comments provided to partner:
- **My comment:** <To be filled upon reviewing partner's PR>
- **Partner's response:** <Partner's response>
