# Lab 2 AI Use with Reflection

**LLM Used:** Gemini 3.1 Pro (ผ่าน Web Interface และ Antigravity IDE)

## 1. Selected Key Prompts

| No. | Prompt / Request | Intent / Purpose | Result / Adjustment |
| :--- | :--- | :--- | :--- |
| 1 | "สมมติว่าผมเป็นนักศึกษาวิศวกรรมซอฟต์แวร์... โปรดอ่านข้อกำหนดเหล่านี้และถามคำถามเกี่ยวกับส่วนต่างๆ..." | เพื่อให้ AI ช่วยวิเคราะห์ Requirement พื้นฐานของระบบ TokTickIT และชี้จุดที่ยังคลุมเครือก่อนร่างเอกสารจริง | AI ช่วยถามคำถามเกี่ยวกับ Format รหัสตั๋ว, การบันทึก Context, และ Error handling ทำให้เห็นภาพกว้างขึ้น |
| 2 | "ช่วยร่าง FR, BR, และ Acceptance Criteria สำหรับหน้า Create Ticket และ My Tickets ตามข้อกำหนดนี้..." | เพื่อสร้าง Engineering Specification เบื้องต้นสำหรับใช้ทำ Spec-Driven Development | ได้ข้อกำหนดที่แบ่งหมวดหมู่ชัดเจนและนำไปใส่ใน `specification.md` ได้ทันที |
| 3 | "ช่วยออกแบบหน้าตา UI เบื้องต้น และเขียน UI Specification ที่สอดคล้องกับ Zen Green Theme ตามสไลด์นี้" | แปลงข้อกำหนดด้านการออกแบบ (Design Specs) เป็นเอกสารอ้างอิงสำหรับพัฒนา Frontend | ได้เอกสาร `ui-spec.md` ที่ครอบคลุมเรื่องสี Component และ Responsive Layout |
| 4 | "จากเอกสาร Specification ที่เรามี ช่วยเขียน Test Plan สำหรับ Unit, API, UI และ E2E Test ให้ครอบคลุมทุก AC" | เพื่อวางแผนการทดสอบแบบ TDD ตามข้อบังคับของ Lab ที่ต้องมี Test ก่อนเขียนโค้ด | ได้ตาราง Planned Tests ในไฟล์ `tests.md` ที่ชี้เป้าหมายไปที่ Acceptance Criteria แต่ละตัวอย่างชัดเจน |
| 5 | "ช่วยออกแบบ REST API Contract สำหรับระบบตั๋ว โดยอ้างอิงจาก Database Schema และ UI ที่วางไว้" | เพื่อกำหนดรูปแบบ Request/Response สำหรับเชื่อมต่อระหว่าง Frontend และ Backend | ได้ `api-spec.md` ที่ระบุ Endpoint, Parameters และ HTTP Status อย่างครบถ้วน |
| 6 | "จากคำถามที่คุณถามมา... รหัสตั๋วใช้ TKT-YYYY-XXXXX, เก็บ Context ใน Local Storage, บังคับใส่เหตุผลตอนลบไฟล์ ช่วยอัปเดต Spec ให้ที" | เพื่อตัดสินใจประเด็นที่คลุมเครือ (Assumptions & Decisions) และให้ AI นำไปอัปเดตลงในเอกสาร | ทำให้เอกสาร Specification รัดกุมขึ้น มีข้อกำหนด BR และ NFR ที่ชัดเจนก่อนส่งให้ Agent เขียนโค้ด |

## 2. My Reflection

**ประสบการณ์และความรู้สึกที่ได้จากการใช้ AI เป็นผู้ช่วย (AI Specification Agent):**

การใช้ AI ช่วยร่างเอกสารทางวิศวกรรมซอฟต์แวร์ (Spec-Driven Development) ช่วยประหยัดเวลาได้มาก โดยเฉพาะการแปลงความต้องการแบบคร่าวๆ จาก Stakeholder ให้กลายเป็นข้อกำหนดที่มีโครงสร้างชัดเจน (FR, BR, AC) อย่างไรก็ตาม AI ไม่สามารถตัดสินใจทิศทางของระบบแทนเราได้ทั้งหมด ในหลายๆ ครั้งเราจำเป็นต้องเข้าไปควบคุม (Control) และตัดสินใจ (Make Decisions) ในจุดที่คลุมเครือ เช่น การจัดการ Error หรือการเก็บข้อมูล Context 

สิ่งที่เรียนรู้ที่สำคัญที่สุดคือ **"Prompt ที่ดีเริ่มต้นจากการให้บริบทและบังคับให้ AI สอบถามเรากลับ แทนที่จะให้ AI มโนคำตอบไปเอง"** ซึ่งทำให้ผลลัพธ์ที่ได้มีความแม่นยำและตอบโจทย์ระบบ TokTickIT ของ Lab 2 ได้อย่างสมบูรณ์แบบ
