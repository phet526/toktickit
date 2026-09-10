# Lab 3 — AI Use and Reflection

**LLM/agent used:** Gemini 3.8 Flash (High)

## Selected Key Prompts

| Prompt Name | Actual Prompt Text |
| :--- | :--- |
| **Spec Engineering & Requirements Analysis** | "เรากำลังเริ่มต้นทำ Issue 1: Sprint 3 Engineering Contract สำหรับโปรเจกต์ Tok TickIT (Lab 3)... กฎเหล็กที่ต้องปฏิบัติตามอย่างเคร่งครัด: ห้ามทำ Lab 2 พังเด็ดขาด... ร่างเนื้อหา docs/lab-03/specification.md"<br>**My Reflection:** AI ช่วยวิเคราะห์ Requirement จากเอกสาร PDF และ Schema เดิมของ Lab 2 ได้อย่างละเอียด ช่วยวาง Data Migration Strategy เพื่อแปลง DevelopmentRequester ไปเป็น User ได้โดยไม่กระทบ Ticket และ Attachment เดิม |
| **Architectural Ambiguity Resolution** | "คำถามที่ 1: รูปแบบของ Authentication Session & Token... คำถามที่ 2: ขอบเขตสิทธิ์ของ Administrator กับตั๋วงาน IT Staff..."<br>**My Reflection:** กระบวนการถาม-ตอบข้อคลุมเครือช่วยปิดช่องว่างของข้อสันนิษฐาน (No Assumptions) ทำให้ได้ฉันทามติเรื่อง Signed HTTP-only Cookie และการแยกบทบาท Admin กับ IT Staff อย่างชัดเจน |
| **Test Planning & Traceability** | "รีวิวเนื้อหา tests.md เทียบกับโจทย์ Lab 3 (โดยเฉพาะหัวข้อ 10) ว่า Test Cases ครอบคลุมเงื่อนไขทั้งหมดหรือไม่"<br>**My Reflection:** ได้ตาราง Test Cases ครอบคลุม Unit, API, RBAC Authorization, UI Components, Responsive, และ E2E โดยเชื่อมโยงกลับไปยัง Acceptance Criteria ทุกข้ออย่างเป็นระบบ |
| **UI Specification & Responsive Safeguards** | "รีวิวเนื้อหา ui-spec.md ว่าครอบคลุมโจทย์ Lab 3 หัวข้อ 7 และ 8 ครบไหม... ยึด Zen Green Theme และ Responsive: ห้ามมีหน้าจอไหนที่เกิดแถบเลื่อนแนวนอน"<br>**My Reflection:** AI ช่วยกลั่นกรองคอมโพเนนต์ส่วนเกินที่อยู่นอกขอบเขตออก และกำหนดให้ตารางปรับเป็น Card View List บนมือถือเพื่อป้องกัน Horizontal Overflow 100% |
| **REST API Contract Finalization** | "Self-Review สำหรับ api-spec.md: ครบถ้วนและสอดคล้อง... ห้ามคิดเอง... ข้อมูลตอบกลับที่ปลอดภัย"<br>**My Reflection:** ได้ข้อกำหนด API Contract ที่รัดกุม มีสถานะ HTTP และโครงสร้าง Error ปลอดภัย ไม่รั่วไหลข้อมูลส่วนตัวหรือ Stack trace |
