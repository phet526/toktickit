# Lab 4 REST API Specification: Actions Taken, Ticket Lifecycle & Role Dashboards

## 1. General Guidelines & Architecture

### 1.1 Base URL & Content Type
- **Base Path:** ทุก Endpoint ทำงานภายใต้เส้นทาง `/api/v1` (เช่น `/api/v1/tickets/:ticketId/actions`, `/api/v1/dashboards/staff`)
- **Content Type:** รับส่งข้อมูลในรูปแบบ `application/json; charset=utf-8` เป็นหลัก (ยกเว้นการดาวน์โหลดและอัปโหลดไฟล์แนบเดิมที่ใช้ `multipart/form-data`)

### 1.2 Authentication & Session Binding
- **HTTP-only Cookie Session:** ยืนยันตัวตนผ่าน Signed HTTP-only Cookie ในชื่อ `toktick_session` ซึ่งบรรจุ Signed Session Token (JWT) จากเซิร์ฟเวอร์
- **Current User Binding:** ตัวตนของผู้ใช้งาน (User ID, Role, Status) จะถูกถอดรหัสจากคุกกี้บนเซิร์ฟเวอร์โดยตรง ไคลเอนต์ไม่สามารถส่งหรือปลอมแปลง `performedById`, `requesterId`, หรือ `assignedStaffId` ผ่าน Request Body ได้
- **Active Account Check:** ทุก Endpoint ที่ต้องผ่านการยืนยันตัวตนจะตรวจสอบสถานะ `isActive = true` เสมอ หากบัญชีถูกระงับสิทธิ์จะส่งคืน `403 Forbidden` พร้อมโค้ด `ACCOUNT_DEACTIVATED`

### 1.3 Expected HTTP Status Codes
- `200 OK`: ดึงข้อมูลหรืออัปเดตข้อมูลสำเร็จ
- `201 Created`: สร้าง Resource ใหม่สำเร็จ (เช่น สร้าง Action Taken, สร้าง Comment)
- `400 Bad Request`: ข้อมูลไม่ถูกต้องตาม Validation, ไม่ผ่านเงื่อนไข Resolution Gate, หรือการเปลี่ยนสถานะผิดกฎ State Transition Matrix
- `401 Unauthorized`: ไม่ได้เข้าสู่ระบบ หรือเซสชันหมดอายุ
- `403 Forbidden`: ไม่มีสิทธิ์เข้าถึงทรัพยากร (เช่น Requester พยายามสร้าง Action Taken หรือเรียกดูแดชบอร์ดของเจ้าหน้าที่ไอที)
- `404 Not Found`: ไม่พบ Resource ในระบบ (เช่น เลขตั๋ว หรือรหัส Action Taken ไม่มีอยู่จริง)
- `409 Conflict`: ข้อมูลเกิดข้อขัดแย้งเนื่องจากมีการแก้ไขทับซ้อน (Optimistic Concurrency / Stale Update)
- `500 Internal Server Error`: ข้อผิดพลาดภายในเซิร์ฟเวอร์ โดยส่งเฉพาะข้อความปลอดภัย (Safe Generic Error)

### 1.4 Safe Error Response Standard
ข้อมูลตอบกลับกรณีเกิด Error ทุกกรณีจะต้องอยู่ในรูปแบบ JSON ที่สม่ำเสมอ และ**ห้ามเปิดเผย Stack Trace หรือ Internal Database Queries สู่ภายนอกเด็ดขาด**:
```json
{
  "error": "Descriptive safe error message",
  "code": "ERROR_CODE_IDENTIFIER"
}
```

---

## 2. Concurrency Control & Stale Update Handling (Section 6.1)

เพื่อป้องกันปัญหาการแก้ไขข้อมูลทับซ้อน (Lost Update Problem) เมื่อมีเจ้าหน้าที่ไอทีหลายท่านเปิดดูและแก้ไขตั๋วงานหรือ Actions Taken รายการเดียวกันในเวลาใกล้เคียงกัน ระบบจะใช้กลไก **Optimistic Concurrency Control**:

1. **Client Responsibility:** เมื่อไคลเอนต์ดึงข้อมูลตั๋วหรือ Actions Taken มาแสดงผล จะได้รับฟิลด์ `updatedAt` (ISO-8601 String) และเมื่อส่งคำขอปรับปรุงข้อมูล (`PATCH` หรือ `PUT`) ไคลเอนต์จะต้องแนบฟิลด์ `updatedAt` ล่าสุดที่ตนเองถืออยู่ส่งกลับมาด้วย
2. **Server Verification:** เซิร์ฟเวอร์จะเปรียบเทียบค่า `updatedAt` ที่ส่งมากับค่าปัจจุบันในฐานข้อมูล
   - หากเวลาตรงกัน: ดำเนินการอัปเดตข้อมูล และอัปเดต `updatedAt` เป็นเวลาปัจจุบัน
   - หากเวลาไม่ตรงกัน (มีผู้อื่นบันทึกข้อมูลไปก่อนหน้า): เซิร์ฟเวอร์จะปฏิเสธคำขอและตอบกลับด้วย `409 Conflict`
3. **Response on Conflict (409 Conflict):**
   ```json
   {
     "error": "This record has been updated by another user. Please refresh and review the latest changes.",
     "code": "STALE_RECORD_CONFLICT",
     "currentUpdatedAt": "2026-09-22T10:15:30.123Z"
   }
   ```

---

## 3. Actions Taken Endpoints

### 3.1 List Actions Taken for Ticket
- **Method & Path:** `GET /api/v1/tickets/:ticketId/actions`
- **Access Control:**
  - `REQUESTER`: อนุญาตเฉพาะตั๋วที่ตนเองเป็นเจ้าของ (`ticket.requesterId = currentUser.id`)
  - `IT_STAFF` / `ADMINISTRATOR`: อนุญาตทุกตั๋ว
- **Parameters:**
  - Path: `ticketId` (Integer) — รหัสของตั๋วงาน
- **Responses:**
  - `200 OK`: คืนรายการ Actions Taken ทั้งหมด เรียงตามวันเวลาที่กระทำ (`actionDateTime ASC`)
    ```json
    {
      "ticketId": 12,
      "ticketNo": "TKT-2026-00012",
      "data": [
        {
          "id": 1,
          "ticketId": 12,
          "actionDateTime": "2026-09-22T08:30:00.000Z",
          "actionDescription": "Checked VPN gateway logs and found certificate mismatch on client device.",
          "result": "Identified root cause. Need to issue a new profile certificate.",
          "performedBy": {
            "id": 2,
            "name": "Sarah Johnson",
            "email": "sarah.johnson@toktickit.com"
          },
          "followUpRequired": true,
          "followUpNote": "Regenerate client certificate and send installation instructions.",
          "attachmentNotes": "Refer to screenshot vpn-error-log.png",
          "createdAt": "2026-09-22T08:35:00.000Z",
          "updatedAt": "2026-09-22T08:35:00.000Z"
        }
      ]
    }
    ```
  - `403 Forbidden`: Requester พยายามเข้าถึงตั๋วของผู้อื่น (`"You do not have permission to access actions for this ticket."`)
  - `404 Not Found`: ไม่พบเลขตั๋วที่ระบุในระบบ

---

### 3.2 Create Action Taken
- **Method & Path:** `POST /api/v1/tickets/:ticketId/actions`
- **Access Control:** เฉพาะ Active `IT_STAFF` และ `ADMINISTRATOR` เท่านั้น (Requester ห้ามเข้าถึง)
- **Parameters:**
  - Path: `ticketId` (Integer)
- **Request Body:**
  ```json
  {
    "actionDateTime": "2026-09-22T08:30:00.000Z",
    "actionDescription": "Replaced faulty RAM module on workstation and ran 30-minute memory diagnostic test.",
    "result": "Diagnostic test passed with 0 errors. System stability restored.",
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "hardware-diagnostic-report.pdf"
  }
  ```
- **Validation Rules:**
  - `actionDateTime`: Optional ISO DateTime (หากไม่ระบุ ให้ใช้เวลาปัจจุบันของเซิร์ฟเวอร์ `DateTime.now()`)
  - `actionDescription`: Mandatory string, ความยาว 1 ถึง 2,000 ตัวอักษร, ห้ามมีเฉพาะ Whitespace
  - `result`: Mandatory string, ความยาว 1 ถึง 2,000 ตัวอักษร, ห้ามมีเฉพาะ Whitespace
  - `followUpRequired`: Mandatory boolean
  - `followUpNote`:
    - หาก `followUpRequired = true`: บังคับกรอก (Mandatory), ความยาว 1 ถึง 1,000 ตัวอักษร
    - หาก `followUpRequired = false`: อนุญาตให้เป็น null หรือเว้นว่างได้
  - `attachmentNotes`: Optional string, ความยาวไม่เกิน 500 ตัวอักษร
- **Server Processing:**
  - ดึง `currentUser.id` จากเซสชันคุกกี้ และกำหนดเป็น `performedById` อัตโนมัติ (เพิกเฉยต่อค่าที่ส่งมาใน Body)
- **Responses:**
  - `201 Created`: สร้างรายการสำเร็จ
    ```json
    {
      "message": "Action Taken recorded successfully",
      "data": {
        "id": 2,
        "ticketId": 12,
        "actionDateTime": "2026-09-22T08:30:00.000Z",
        "actionDescription": "Replaced faulty RAM module on workstation and ran 30-minute memory diagnostic test.",
        "result": "Diagnostic test passed with 0 errors. System stability restored.",
        "performedBy": {
          "id": 3,
          "name": "Alex Miller",
          "email": "alex.miller@toktickit.com"
        },
        "followUpRequired": false,
        "followUpNote": null,
        "attachmentNotes": "hardware-diagnostic-report.pdf",
        "createdAt": "2026-09-22T08:40:00.000Z",
        "updatedAt": "2026-09-22T08:40:00.000Z"
      }
    }
    ```
  - `400 Bad Request`: ข้อมูลไม่ถูกต้อง หรือไม่ได้กรอก `followUpNote` ทั้งที่เลือก `followUpRequired = true`
    ```json
    { "error": "Follow-up note is required when follow-up is marked as needed.", "code": "FOLLOW_UP_NOTE_REQUIRED" }
    ```
  - `403 Forbidden`: ผู้ใช้ไม่ใช่ IT Staff / Admin หรือบัญชีมีสถานะ Inactive
    ```json
    { "error": "Only active IT Staff and Administrators can record actions taken.", "code": "FORBIDDEN_ACTION" }
    ```
  - `404 Not Found`: ไม่พบตั๋วงานที่ระบุ

---

### 3.3 Update Action Taken
- **Method & Path:** `PUT /api/v1/tickets/:ticketId/actions/:actionId`
- **Access Control:** เฉพาะ Active `IT_STAFF` และ `ADMINISTRATOR` เท่านั้น
- **Parameters:**
  - Path: `ticketId` (Integer), `actionId` (Integer)
- **Request Body:**
  ```json
  {
    "actionDateTime": "2026-09-22T08:30:00.000Z",
    "actionDescription": "Updated action description with additional technical details.",
    "result": "Updated result details.",
    "followUpRequired": true,
    "followUpNote": "Schedule follow-up call with user next Monday.",
    "attachmentNotes": "hardware-diagnostic-report-v2.pdf",
    "updatedAt": "2026-09-22T08:40:00.000Z"
  }
  ```
- **Validation & Concurrency:**
  - ตรวจสอบ `updatedAt` เพื่อป้องกัน Stale Update (คืน 409 หากขัดแย้ง)
  - `performedById` เดิมของผู้สร้างจะถูกคงไว้เสมอ ไม่มีการเปลี่ยนผู้บันทึกเริ่มต้น
- **Responses:**
  - `200 OK`: อัปเดตข้อมูลสำเร็จ
    ```json
    {
      "message": "Action Taken updated successfully",
      "data": {
        "id": 2,
        "ticketId": 12,
        "actionDateTime": "2026-09-22T08:30:00.000Z",
        "actionDescription": "Updated action description with additional technical details.",
        "result": "Updated result details.",
        "performedBy": {
          "id": 3,
          "name": "Alex Miller",
          "email": "alex.miller@toktickit.com"
        },
        "followUpRequired": true,
        "followUpNote": "Schedule follow-up call with user next Monday.",
        "attachmentNotes": "hardware-diagnostic-report-v2.pdf",
        "createdAt": "2026-09-22T08:40:00.000Z",
        "updatedAt": "2026-09-22T09:00:00.000Z"
      }
    }
    ```
  - `400 Bad Request`: ข้อมูล Validation ไม่ผ่าน
  - `403 Forbidden`: ไม่มีสิทธิ์แก้ไข
  - `404 Not Found`: ไม่พบ Action Taken หรือ Action ไม่ได้สังกัดตั๋วใบนี้
  - `409 Conflict`: ข้อมูลถูกอัปเดตไปก่อนหน้า (`code: STALE_RECORD_CONFLICT`)

---

## 4. Ticket Lifecycle & Resolution Gate Endpoints

### 4.1 Update Ticket Status (with Resolution Gate & Concurrency)
- **Method & Path:** `PATCH /api/v1/staff/tickets/:id/status`
- **Access Control:** เฉพาะ Active `IT_STAFF` และ `ADMINISTRATOR` เท่านั้น
- **Parameters:**
  - Path: `id` (Integer) — รหัสตั๋ว
- **Request Body:**
  ```json
  {
    "status": "Resolved",
    "updatedAt": "2026-09-22T08:40:00.000Z"
  }
  ```
- **Business Logic & Gate Enforcement:**
  1. **Concurrency Check:** ตรวจสอบ `updatedAt` หากไม่ตรงกับใน DB ส่งคืน `409 Conflict`
  2. **Transition Matrix Check:** ตรวจสอบสถานะปัจจุบันกับสถานะเป้าหมายตาม State Transition Matrix หากไม่อนุญาต ส่งคืน `400 Bad Request` (`code: INVALID_STATUS_TRANSITION`)
  3. **Resolution Gate Enforcement (เมื่อ status = "Resolved"):**
     - ตรวจสอบว่า `assignedStaffId != null` หรือไม่
     - ตรวจสอบว่าตั๋วมี Actions Taken อย่างน้อย 1 รายการหรือไม่ (`actionsCount >= 1`)
     - หากขาดข้อใดข้อหนึ่ง ปฏิเสธการเปลี่ยนสถานะ ส่งคืน `400 Bad Request` พร้อมโค้ด `RESOLUTION_GATE_FAILED`
- **Responses:**
  - `200 OK`: ปรับปรุงสถานะตั๋วสำเร็จ
    ```json
    {
      "message": "Ticket status updated to Resolved successfully",
      "data": {
        "id": 12,
        "ticketNo": "TKT-2026-00012",
        "currentStatus": "Resolved",
        "updatedAt": "2026-09-22T09:15:00.000Z"
      }
    }
    ```
  - `400 Bad Request (Resolution Gate Failed):`
    ```json
    {
      "error": "Cannot resolve ticket without an assigned owner and at least one Action Taken record.",
      "code": "RESOLUTION_GATE_FAILED",
      "details": {
        "hasOwner": true,
        "actionsCount": 0
      }
    }
    ```
  - `400 Bad Request (Invalid Transition):`
    ```json
    {
      "error": "Transition from New to Resolved is not permitted.",
      "code": "INVALID_STATUS_TRANSITION"
    }
    ```
  - `409 Conflict (Stale Update):`
    ```json
    {
      "error": "Ticket has been modified by another user. Please refresh and try again.",
      "code": "STALE_RECORD_CONFLICT"
    }
    ```

---

### 4.2 Indicate Problem Appears Resolved (Requester Advisory Signal)
- **Method & Path:** `POST /api/v1/tickets/:id/resolve-indication`
- **Access Control:** Authenticated Requester (เฉพาะตั๋วที่ตนเองเป็นเจ้าของ และสถานะต้องเป็น `Open`, `In Progress`, หรือ `Waiting for Requester`)
- **Responses:**
  - `200 OK`: บันทึกแฟล็ก `problemResolvedReported = true` พร้อมสร้าง Public Comment อัตโนมัติ โดยไม่เปลี่ยนสถานะทางการของตั๋ว
    ```json
    {
      "message": "Resolution indication recorded. An IT staff member will review and update the ticket.",
      "problemResolvedReported": true,
      "currentStatus": "In Progress"
    }
    ```

---

## 5. Role-Appropriate Dashboard Endpoints (Section 6.2)

### 5.1 Requester Dashboard Data
- **Method & Path:** `GET /api/v1/dashboards/requester`
- **Access Control:** เฉพาะ Authenticated `REQUESTER` เท่านั้น (กรองข้อมูลเฉพาะ `requesterId = currentUser.id` 100%)
- **Calculation Rules:**
  - `metrics.openTickets`: จำนวนตั๋วที่เป็นของตนเอง และสถานะอยู่ในกลุ่มเปิดงาน (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Reopened`)
  - `metrics.inProgressTickets`: จำนวนตั๋วที่เป็นของตนเอง และสถานะเป็น `In Progress`
  - `metrics.waitingForRequesterTickets`: จำนวนตั๋วที่เป็นของตนเอง และสถานะเป็น `Waiting for Requester`
  - `metrics.resolvedTickets`: จำนวนตั๋วที่เป็นของตนเอง และสถานะเป็น `Resolved`
  - `metrics.closedTickets`: จำนวนตั๋วที่เป็นของตนเอง และสถานะเป็น `Closed`
  - `recentTickets`: รายการตั๋วของตนเอง 5 รายการล่าสุด เรียงตาม `updatedAt DESC`
- **Empty State Behavior:** หากผู้ใช้ยังไม่มีตั๋ว ค่าตัวเลขทั้งหมดจะเป็น `0` และ `recentTickets` จะเป็น Array ว่าง `[]`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "requester": {
        "id": 1,
        "name": "Jennifer Miller"
      },
      "metrics": {
        "openTickets": 3,
        "inProgressTickets": 2,
        "waitingForRequesterTickets": 1,
        "resolvedTickets": 5,
        "closedTickets": 12
      },
      "recentTickets": [
        {
          "id": 134,
          "ticketNo": "TKT-2026-000134",
          "summary": "Laptop battery drains quickly",
          "category": "Hardware",
          "requestedPriority": "Medium",
          "currentStatus": "In Progress",
          "updatedAt": "2026-09-22T07:14:00.000Z"
        }
      ]
    }
    ```
  - `403 Forbidden`: ผู้ใช้ไม่ใช่ Requester (เช่น IT Staff หรือ Admin เรียกใช้นี้)

---

### 5.2 IT Staff & Administrator Dashboard Data
- **Method & Path:** `GET /api/v1/dashboards/staff`
- **Access Control:** เฉพาะ Authenticated `IT_STAFF` และ `ADMINISTRATOR` เท่านั้น
- **Calculation Rules:**
  - `metrics.newTickets`: จำนวนตั๋วทั้งหมดในระบบที่มีสถานะ `New`
  - `metrics.openTickets`: จำนวนตั๋วทั้งหมดในระบบที่มีสถานะ `Open`
  - `metrics.inProgressTickets`: จำนวนตั๋วทั้งหมดในระบบที่มีสถานะ `In Progress`
  - `metrics.waitingForRequesterTickets`: จำนวนตั๋วทั้งหมดในระบบที่มีสถานะ `Waiting for Requester`
  - `metrics.myAssignedTickets`: จำนวนตั๋วที่มี `assignedStaffId = currentUser.id` และสถานะไม่อยู่ใน `Closed` หรือ `Cancelled`
  - `metrics.unassignedTickets`: จำนวนตั๋วที่ยังไม่มีผู้รับผิดชอบ (`assignedStaffId IS NULL`) และสถานะไม่อยู่ใน `Closed` หรือ `Cancelled`
  - `ticketsByPriority`: การแจกแจงจำนวนตั๋วที่ยังเปิดอยู่ตามระดับ `itPriority` (`Low`, `Medium`, `High`, `Critical`)
  - `myRecentTickets`: รายการตั๋วที่มอบหมายให้ตนเอง 5 รายการล่าสุด เรียงตาม `updatedAt DESC`
  - `adminSummary` (แนบเฉพาะเมื่อ `currentUser.role === 'ADMINISTRATOR'`):
    - `totalActiveUsers`: จำนวนผู้ใช้ทั้งหมดที่ `isActive = true`
    - `activeStaff`: จำนวน `IT_STAFF` ที่ Active
    - `activeRequesters`: จำนวน `REQUESTER` ที่ Active
    - `activeAdmins`: จำนวน `ADMINISTRATOR` ที่ Active
- **Responses:**
  - `200 OK`:
    ```json
    {
      "staff": {
        "id": 2,
        "name": "Michael Chang",
        "role": "IT_STAFF"
      },
      "metrics": {
        "newTickets": 14,
        "openTickets": 23,
        "inProgressTickets": 18,
        "waitingForRequesterTickets": 7,
        "myAssignedTickets": 16,
        "unassignedTickets": 8
      },
      "ticketsByPriority": {
        "Low": 12,
        "Medium": 28,
        "High": 17,
        "Critical": 4
      },
      "myRecentTickets": [
        {
          "id": 134,
          "ticketNo": "TKT-2026-000134",
          "summary": "Laptop battery drains quickly",
          "category": "Hardware",
          "itPriority": "High",
          "currentStatus": "In Progress",
          "updatedAt": "2026-09-22T07:14:00.000Z"
        }
      ],
      "adminSummary": null
    }
    ```
  - `403 Forbidden`: Requester พยายามเข้าถึงแดชบอร์ดของเจ้าหน้าที่ไอที

---

## 6. Dashboard Drill-down Query Parameters Standard

เพื่อให้การคลิกการ์ดสถิติบน Dashboard เชื่อมต่อไปยังหน้ารายการตั๋ว (Drill-down Destinations) ได้อย่างราบรื่นตามข้อกำหนด Section 4.6 และ 8:

| แดชบอร์ดและบัตรสถิติ (Dashboard Card) | เส้นทางปลายทาง (Drill-down URL) | ผลลัพธ์ที่ตารางต้องกรองแสดง |
| :--- | :--- | :--- |
| **Requester: My Open Tickets** | `/my-tickets?status=Open` | แสดงตั๋วของตนเองที่เป็นสถานะ Open |
| **Requester: In Progress** | `/my-tickets?status=In%20Progress` | แสดงตั๋วของตนเองที่เป็นสถานะ In Progress |
| **Requester: Resolved** | `/my-tickets?status=Resolved` | แสดงตั๋วของตนเองที่เป็นสถานะ Resolved |
| **Requester: Closed** | `/my-tickets?status=Closed` | แสดงตั๋วของตนเองที่เป็นสถานะ Closed |
| **IT Staff: New Tickets** | `/staff/queue?status=New` | แสดงคิวตั๋วใหม่ทั้งหมด |
| **IT Staff: Open Tickets** | `/staff/queue?status=Open` | แสดงคิวตั๋วสถานะ Open |
| **IT Staff: In Progress** | `/staff/queue?status=In%20Progress` | แสดงคิวตั๋วที่กำลังดำเนินการ |
| **IT Staff: Waiting for Requester** | `/staff/queue?status=Waiting%20for%20Requester` | แสดงคิวตั๋วที่รอข้อมูลจากผู้แจ้ง |
| **IT Staff: My Assigned Tickets** | `/staff/queue?owner=me` | แสดงตั๋วทั้งหมดที่มอบหมายให้ตนเอง |
| **IT Staff: Unassigned Tickets** | `/staff/queue?owner=unassigned` | แสดงตั๋วที่ยังไม่มีเจ้าหน้าที่รับผิดชอบ |

---

## 7. Error Code Catalog

| Error Code | HTTP Status | คำอธิบายและสาเหตุ |
| :--- | :---: | :--- |
| `UNAUTHORIZED` | 401 | ยังไม่ได้เข้าสู่ระบบ หรือเซสชันหมดอายุ |
| `FORBIDDEN_ACTION` | 403 | บทบาทของผู้ใช้ไม่ได้รับสิทธิ์ในการกระทำนี้ |
| `ACCOUNT_DEACTIVATED` | 403 | บัญชีถูกปิดการใช้งาน (`isActive = false`) |
| `NOT_FOUND` | 404 | ไม่พบข้อมูลตั๋ว หรือ Actions Taken ที่ระบุ |
| `FOLLOW_UP_NOTE_REQUIRED` | 400 | ระบุ `followUpRequired = true` แต่ไม่ได้กรอก `followUpNote` |
| `RESOLUTION_GATE_FAILED` | 400 | พยายามเปลี่ยนสถานะเป็น Resolved โดยไม่มี Owner หรือไม่มี Actions Taken |
| `INVALID_STATUS_TRANSITION`| 400 | เปลี่ยนสถานะตั๋วผิดกฎ State Transition Matrix |
| `STALE_RECORD_CONFLICT` | 409 | ข้อมูลถูกบันทึกทับซ้อนโดยผู้ใช้อื่น (Optimistic Concurrency Conflict) |
| `VALIDATION_ERROR` | 400 | ข้อมูลที่ส่งมาไม่ถูกต้องตามประเภทหรือความยาวที่กำหนด |
| `INTERNAL_SERVER_ERROR` | 500 | ข้อผิดพลาดภายในเซิร์ฟเวอร์ที่ไม่คาดคิด |

---

## 8. Preserved Endpoints from Labs 1–3 (Strict Regression)

ระบบยังคงสนับสนุนและรักษาพฤติกรรมการทำงานของ REST API เดิมจาก Lab 1 ถึง Lab 3 ทั้งหมด 100%:
- **Authentication Endpoints:** `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/change-password`, `POST /api/v1/auth/logout`
- **Requester Ticket Endpoints:** `POST /api/v1/tickets`, `GET /api/v1/tickets`, `GET /api/v1/tickets/:id`, `POST /api/v1/tickets/:id/attachments`, `GET /api/v1/tickets/:id/attachments/:attachmentId/download`, `DELETE /api/v1/tickets/:id/attachments/:attachmentId`
- **IT Staff Queue Endpoints:** `GET /api/v1/staff/tickets`, `GET /api/v1/staff/tickets/:id`, `PATCH /api/v1/staff/tickets/:id/ownership`, `PATCH /api/v1/staff/tickets/:id/priority`
- **Communication Endpoints:** `GET/POST /api/v1/tickets/:id/comments`, `GET/POST /api/v1/staff/tickets/:id/notes`
- **Administrator User Management Endpoints:** `GET /api/v1/admin/users`, `POST /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id`, `POST /api/v1/admin/users/:id/reset-password`
