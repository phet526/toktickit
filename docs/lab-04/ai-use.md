# Lab 4 — AI Use and Reflection

**LLM/agent used:** Gemini 3.8 Flash (High) / Antigravity AI

## Selected Key Prompts

| Prompt Name | Actual Prompt Text |
| :--- | :--- |
| **Sprint 4 Engineering Contract & Requirements Analysis** | "ตอนนี้เรากำลังทำโปรเจกต์ TokTickIT Lab 4 ซึ่งเป็นการพัฒนาต่อยอดมาจาก TokTickIT Lab 3... เป้าหมายของงานในตอนนี้คือ ดำเนินการทำ Issue 1 ให้ครบถ้วนและสมบูรณ์... จัดทำแผนการดำเนินงานและโครงสร้างเนื้อหาอย่างละเอียด... docs/lab-04/specification.md"<br>**My Reflection:** AI ช่วยวิเคราะห์ข้อกำหนดใน SE Lab 4.pdf ได้อย่างละเอียดรอบด้าน ช่วยกำหนด Business Rules สำคัญ เช่น BR-01 (ความสัมพันธ์ 1:N), BR-02 (การร่วมปฏิบัติงานของทีมไอที), และกฎ Resolution Gate พร้อมวางโครงสร้างข้อมูลที่ป้องกันการถดถอย (Zero Regression) ของ Lab 1–3 ได้อย่างสมบูรณ์ |
| **REST API Contract & Concurrency Architecture** | "จัดทำ docs/lab-04/api-spec.md: นิยาม REST endpoints สำหรับ Actions Taken, Ticket Workflow, Requester Dashboard และ IT Staff Dashboard... ระบุกลไก Concurrency / Stale update handling (409 Conflict) และ Resolution Gate"<br>**My Reflection:** ได้ข้อกำหนด API Contract ที่รัดกุม มีการใช้ `updatedAt` สำหรับ Optimistic Concurrency Control ป้องกันการบันทึกข้อมูลทับซ้อน และมี Safe Error Codes กำกับทุกเงื่อนไขความผิดพลาดอย่างชัดเจน |
| **Zen Green Dashboards & UI Specification** | "จัดทำ docs/lab-04/ui-spec.md: โครงสร้างหน้า IT Staff Dashboard, Requester Dashboard และส่วน Actions Taken บน Ticket Detail... รายละเอียด Zen Green theme, Responsive rules (ห้ามมี Horizontal Scrollbar บนมือถือ) และ Accessibility checklist"<br>**My Reflection:** ช่วยออกแบบ Layout สองบทบาทที่สอดคล้องกับภาพในโจทย์ และวางแผนการปรับตาราง Actions Taken ให้เป็นการ์ดแนวตั้งบนหน้าจอมือถือ (< 768px) เพื่อแก้ปัญหา Horizontal Overflow ได้ 100% |
| **Test Planning & Traceability Design** | "จัดทำ docs/lab-04/tests.md: กำหนด Traceability Matrix แมปจาก AC-01 ถึง AC-16 ไปยัง Test ID และชื่อไฟล์ทดสอบจริง (Unit, API, UI, E2E, Regression)"<br>**My Reflection:** ทำให้ได้แผนการทดสอบแบบ TDD ที่รัดกุม ครอบคลุมทั้งกรณีปกติ (Happy Path), กรณีละเมิดสิทธิ์ (Forbidden), การตรวจสอบ Resolution Gate, และการการันตีว่าเทสต์เดิมของ Lab 1–3 จะต้องผ่านครบถ้วน |
| **Actions Taken Foundation Implementation** | *(To be populated during Issue 2 development)*<br>**My Reflection:** *(To be updated upon completion)* |
| **Actions Taken UI Implementation** | *(To be populated during Issue 3 development)*<br>**My Reflection:** *(To be updated upon completion)* |
| **Ticket Workflow & Resolution Gate Implementation** | *(To be populated during Issue 4 development)*<br>**My Reflection:** *(To be updated upon completion)* |
| **Role Dashboards Implementation** | *(To be populated during Issue 5 development)*<br>**My Reflection:** *(To be updated upon completion)* |
| **Final Regression, Hardening & Release Integration** | *(To be populated during Issue 6 development)*<br>**My Reflection:** *(To be updated upon completion)* |

---

