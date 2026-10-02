# Lab 4 — AI Use and Reflection

**LLM/agent used:** Gemini 3.8 Flash (High) / Antigravity AI

## Selected Key Prompts

| Prompt Name | Actual Prompt Text |
| :--- | :--- |
| **Sprint 4 Engineering Contract & Requirements Analysis** | "ตอนนี้เรากำลังทำโปรเจกต์ TokTickIT Lab 4 ซึ่งเป็นการพัฒนาต่อยอดมาจาก TokTickIT Lab 3... เป้าหมายของงานในตอนนี้คือ ดำเนินการทำ Issue 1 ให้ครบถ้วนและสมบูรณ์... จัดทำแผนการดำเนินงานและโครงสร้างเนื้อหาอย่างละเอียด... docs/lab-04/specification.md"<br>**My Reflection:** AI ช่วยวิเคราะห์ข้อกำหนดใน SE Lab 4.pdf ได้อย่างละเอียดรอบด้าน ช่วยกำหนด Business Rules สำคัญ เช่น BR-01 (ความสัมพันธ์ 1:N), BR-02 (การร่วมปฏิบัติงานของทีมไอที), และกฎ Resolution Gate พร้อมวางโครงสร้างข้อมูลที่ป้องกันการถดถอย (Zero Regression) ของ Lab 1–3 ได้อย่างสมบูรณ์ |
| **REST API Contract & Concurrency Architecture** | "จัดทำ docs/lab-04/api-spec.md: นิยาม REST endpoints สำหรับ Actions Taken, Ticket Workflow, Requester Dashboard และ IT Staff Dashboard... ระบุกลไก Concurrency / Stale update handling (409 Conflict) และ Resolution Gate"<br>**My Reflection:** ได้ข้อกำหนด API Contract ที่รัดกุม มีการใช้ `updatedAt` สำหรับ Optimistic Concurrency Control ป้องกันการบันทึกข้อมูลทับซ้อน และมี Safe Error Codes กำกับทุกเงื่อนไขความผิดพลาดอย่างชัดเจน |
| **Zen Green Dashboards & UI Specification** | "จัดทำ docs/lab-04/ui-spec.md: โครงสร้างหน้า IT Staff Dashboard, Requester Dashboard และส่วน Actions Taken บน Ticket Detail... รายละเอียด Zen Green theme, Responsive rules (ห้ามมี Horizontal Scrollbar บนมือถือ) และ Accessibility checklist"<br>**My Reflection:** ช่วยออกแบบ Layout สองบทบาทที่สอดคล้องกับภาพในโจทย์ และวางแผนการปรับตาราง Actions Taken ให้เป็นการ์ดแนวตั้งบนหน้าจอมือถือ (< 768px) เพื่อแก้ปัญหา Horizontal Overflow ได้ 100% |
| **Test Planning & Traceability Design** | "จัดทำ docs/lab-04/tests.md: กำหนด Traceability Matrix แมปจาก AC-01 ถึง AC-16 ไปยัง Test ID และชื่อไฟล์ทดสอบจริง (Unit, API, UI, E2E, Regression)"<br>**My Reflection:** ทำให้ได้แผนการทดสอบแบบ TDD ที่รัดกุม ครอบคลุมทั้งกรณีปกติ (Happy Path), กรณีละเมิดสิทธิ์ (Forbidden), การตรวจสอบ Resolution Gate, และการการันตีว่าเทสต์เดิมของ Lab 1–3 จะต้องผ่านครบถ้วน |
| **Actions Taken Foundation Implementation** | "ตอนนี้เรากำลังจะเริ่มทำ Issue 2: [Lab 4] Actions Taken Model, Prisma Migration, Seed & Backend APIs (#41) บนกิ่ง feat/lab4-actions-taken-foundation... ออกแบบ Model, Migration, Seed และ Backend APIs พร้อมชุดทดสอบ"<br>**My Reflection:** AI ช่วยสร้าง Data Model `ActionTaken` และ Schema Migration ที่ไม่กระทบโครงสร้างเดิมจาก Lab 1-3 พร้อมทั้งพัฒนา Backend APIs ที่บังคับใช้ RBAC และ Optimistic Concurrency 409 Conflict ตามสัญญาระบุได้อย่างสมบูรณ์ รัน Seed ซ้ำได้อย่างปลอดภัย และชุดทดสอบ Server ผ่าน 100% |
| **Actions Taken UI Implementation** | "ตอนนี้เรากำลังจะเริ่มทำ Issue 3: [Lab 4] Actions Taken Component on Ticket Detail & Form Validation (#42) บนกิ่ง feat/lab4-actions-taken-ui... พัฒนาส่วนแสดงผลและบันทึก Actions Taken บนหน้ารายละเอียดตั๋ว"<br>**My Reflection:** AI ช่วยสร้างคอมโพเนนต์แบบ Dual Responsive (Desktop Table vs Mobile Stacked Cards) ที่ป้องกันปัญหา Horizontal Overflow ได้ 100% ควบคุมสิทธิ์การมองเห็นสำหรับ Requester ให้เป็น Read-only และมี Conditional Form Validation บังคับกรอก Follow-up Note พร้อมระบบป้องกัน Double-submit อย่างมีประสิทธิภาพ |
| **Ticket Workflow & Resolution Gate Implementation** | *(To be populated during Issue 4 development)*<br>**My Reflection:** *(To be updated upon completion)* |
| **Role Dashboards Implementation** | *(To be populated during Issue 5 development)*<br>**My Reflection:** *(To be updated upon completion)* |
| **Final Regression, Hardening & Release Integration** | *(To be populated during Issue 6 development)*<br>**My Reflection:** *(To be updated upon completion)* |

---

