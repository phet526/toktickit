# Lab 2 — AI Use and Reflection  (fill this in)

**LLM/agent used:** Gemini 3.1 Pro (High)

## Selected Key Prompts

| Prompt Name | Actual Prompt Text |
| :--- | :--- |
| **Spec Analysis** | "สมมติว่าผมเป็นนักศึกษาวิศวกรรมซอฟต์แวร์... โปรดอ่านข้อกำหนดเหล่านี้และถามคำถามเกี่ยวกับส่วนต่างๆ... ช่วยร่าง FR, BR, และ Acceptance Criteria สำหรับหน้า Create Ticket และ My Tickets"<br>**My Reflection:** ทำให้ได้ข้อกำหนดที่แบ่งหมวดหมู่ชัดเจน ครอบคลุมจุดที่คลุมเครือ และนำไปใส่ใน `specification.md` ได้อย่างรัดกุม |
| **UI Design Spec** | "ช่วยออกแบบหน้าตา UI เบื้องต้น และเขียน UI Specification ที่สอดคล้องกับ Zen Green Theme ตามสไลด์นี้"<br>**My Reflection:** ได้เอกสาร `ui-spec.md` ที่เป็นมาตรฐานชัดเจน เรื่องสีและการจัดวาง (Responsive Layout) สำหรับฝั่ง Frontend |
| **Test Planning** | "จากเอกสาร Specification ที่เรามี ช่วยเขียน Test Plan สำหรับ Unit, API, UI และ E2E Test ให้ครอบคลุมทุก AC"<br>**My Reflection:** ช่วยวางแผนการทดสอบแบบ TDD ได้ครบถ้วน ได้ไฟล์ `tests.md` ที่อ้างอิงกลับไปยัง Acceptance Criteria ทุกข้อ |
| **API Contract Design** | "ช่วยออกแบบ REST API Contract สำหรับระบบตั๋ว โดยอ้างอิงจาก Database Schema และ UI ที่วางไว้"<br>**My Reflection:** ทำให้ได้ไฟล์ `api-spec.md` ที่มี Endpoint, Parameters และ Response Status ชัดเจน ง่ายต่อการพัฒนา Backend |
| **Implementation QA** | "สวมบทบาทเป็น QA Lead และ Release Manager ผู้เข้มงวดที่สุด... ดำเนินการตรวจสอบและทำตาม Checklist"<br>**My Reflection:** AI ช่วยออดิตโค้ด เติม `aria-label` และเพิ่ม `index.css` เพื่อรับประกันว่า UI และ E2E Pass 100% ตามสเปค |
| **Final Sanity Check** | "สวมบทบาทเป็น ผู้ช่วยสอน (TA) และผู้ตรวจประเมินโค้ดขั้นสูงสุด... ช่วยทำ Final Sanity Check & Submission Audit"<br>**My Reflection:** ช่วยสร้างความมั่นใจก่อนส่งงาน โดยช่วยแนะจุดที่ควร Manual Test และยืนยันว่าโค้ดไม่มีไฟล์ขยะ |
