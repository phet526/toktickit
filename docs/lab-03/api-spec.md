# Lab 3 REST API Specification: Authentication, RBAC, IT Staff Queue & Admin User Management

## 1. General Guidelines & Architecture

### 1.1 Base URL & Content Type
- **Base Path:** ทุก Endpoint ทำงานภายใต้เส้นทาง `/api/v1` (เช่น `/api/v1/auth/login`, `/api/v1/staff/tickets`)
- **Content Type:** รับส่งข้อมูลในรูปแบบ `application/json; charset=utf-8` เป็นหลัก (ยกเว้นการอัปโหลดไฟล์ที่ใช้ `multipart/form-data`)

### 1.2 Authentication & Session Mechanism
- **HTTP-only Cookie Session:** ระบบใช้การยืนยันตัวตนผ่าน Signed HTTP-only Cookie ในชื่อ `toktick_session` ซึ่งบรรจุ Token (JWT) ที่เข้ารหัสจากฝั่งเซิร์ฟเวอร์
- **Security Attributes:** คุกกี้ถูกกำหนดค่า `HttpOnly = true` (ป้องกันการเข้าถึงจาก JavaScript/XSS), `SameSite = 'Lax'` (ป้องกัน CSRF), และ `Path = '/'`
- **Current User Binding:** ตัวตนของผู้ใช้งาน (User Identity & Role) จะถูกถอดรหัสจากคุกกี้บนเซิร์ฟเวอร์โดยตรง ไคลเอนต์ไม่ต้องและไม่สามารถส่ง `requesterId` หรือ `userId` มาใน Request Body เพื่อปลอมแปลงสิทธิ์ได้อีกต่อไป
- **Authentication Secrets Protection:** ข้อมูลความลับทั้งหมดของระบบยืนยันตัวตน (Authentication secrets เช่น JWT Secret, Session Signing Key, Password Salt/Pepper) จะต้องถูกจัดเก็บและโหลดผ่าน Environment Variables บนฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามเปิดเผยให้ฝั่ง Client ทราบ และห้าม commit เข้าสู่ Source Control (Git) เด็ดขาด

### 1.3 Expected HTTP Status Codes
- `200 OK`: ดึงข้อมูลหรืออัปเดตข้อมูลสำเร็จ
- `201 Created`: สร้าง Resource ใหม่สำเร็จ (เช่น สร้างผู้ใช้, สร้าง Comment, สร้าง Ticket)
- `400 Bad Request`: ข้อมูลที่ส่งมาไม่ถูกต้องตามเงื่อนไข (Validation failure, Password policy violation, Invalid status transition, ห้าม Deactivate ตนเอง)
- `401 Unauthorized`: ยังไม่ได้เข้าสู่ระบบ, เซสชันหมดอายุ, หรือข้อมูลล็อกอินไม่ถูกต้อง
- `403 Forbidden`: ยืนยันตัวตนแล้วแต่ไม่มีสิทธิ์เข้าถึงทรัพยากรดังกล่าว (RBAC violation หรือ Ownership failure)
- `404 Not Found`: ไม่พบ Resource ที่ระบุ (เช่น เลขตั๋วไม่มีในระบบ)
- `409 Conflict`: ข้อมูลขัดแย้งกับฐานข้อมูล (เช่น ใช้อีเมลซ้ำในการสร้างผู้ใช้)
- `500 Internal Server Error`: ข้อผิดพลาดภายในเซิร์ฟเวอร์ที่ไม่ได้คาดคิด โดยจะส่งข้อความที่ปลอดภัยเท่านั้น

### 1.4 Safe Error Response Standard
เพื่อความปลอดภัย ข้อมูลตอบกลับกรณีเกิด Error ทุกกรณีจะต้องอยู่ในรูปแบบ JSON ที่สม่ำเสมอ และ**ห้ามเปิดเผย Stack trace หรือ Sensitive Database Error สู่ภายนอกเด็ดขาด**:
```json
{
  "error": "Descriptive safe error message",
  "code": "ERROR_CODE_IDENTIFIER"
}
```

---

## 2. Authentication Endpoints

### 2.1 Sign In
- **Method & Path:** `POST /api/v1/auth/login`
- **Access:** Public (ไม่ต้องล็อกอิน)
- **Request Body:**
  ```json
  {
    "email": "sarah.johnson@toktickit.com",
    "password": "ValidPassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: เข้าสู่ระบบสำเร็จ บันทึกคุกกี้ `toktick_session` ใน Header `Set-Cookie`
    ```json
    {
      "user": {
        "id": 2,
        "name": "Sarah Johnson",
        "email": "sarah.johnson@toktickit.com",
        "role": "IT_STAFF",
        "mustChangePassword": false
      },
      "message": "Login successful"
    }
    ```
  - `401 Unauthorized`: รหัสผ่านผิด หรืออีเมลไม่มีในระบบ
    ```json
    { "error": "Invalid email or password. Please try again.", "code": "INVALID_CREDENTIALS" }
    ```
  - `403 Forbidden`: บัญชีถูกปิดการใช้งาน (`isActive = false`)
    ```json
    { "error": "Account is deactivated. Please contact your administrator.", "code": "ACCOUNT_DEACTIVATED" }
    ```

### 2.2 Get Current Authenticated User
- **Method & Path:** `GET /api/v1/auth/me`
- **Access:** Authenticated Users (ทุก Role ที่มีคุกกี้เซสชัน)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "user": {
        "id": 2,
        "name": "Sarah Johnson",
        "email": "sarah.johnson@toktickit.com",
        "role": "IT_STAFF",
        "mustChangePassword": false
      }
    }
    ```
  - `401 Unauthorized`: ไม่มีคุกกี้ หรือเซสชันหมดอายุ

### 2.3 Mandatory Change Password
- **Method & Path:** `POST /api/v1/auth/change-password`
- **Access:** Authenticated Users (ใช้ได้ทั้งตอนถูกบังคับเปลี่ยนครั้งแรก หรือเปลี่ยนตามความประสงค์)
- **Request Body:**
  ```json
  {
    "currentPassword": "InitialPassword123!",
    "newPassword": "NewSecurePassword2026!",
    "confirmPassword": "NewSecurePassword2026!"
  }
  ```
- **Responses:**
  - `200 OK`: เปลี่ยนรหัสผ่านสำเร็จ และปลดล็อก `mustChangePassword = false`
    ```json
    { "message": "Password changed successfully", "mustChangePassword": false }
    ```
  - `400 Bad Request`: รหัสผ่านใหม่ไม่ตรงตามเกณฑ์ (ขาดตัวพิมพ์ใหญ่/เล็ก/ตัวเลข/อักขระพิเศษ หรือสั้นกว่า 8 ตัว) หรือรหัสผ่านยืนยันไม่ตรงกัน
  - `401 Unauthorized`: รหัสผ่านปัจจุบัน (Current Password) ไม่ถูกต้อง

### 2.4 Sign Out (Logout)
- **Method & Path:** `POST /api/v1/auth/logout`
- **Access:** Authenticated Users
- **Responses:**
  - `200 OK`: ลบล้างคุกกี้ `toktick_session` ทันที (`Max-Age=0`)
    ```json
    { "message": "Logged out successfully" }
    ```

---

## 3. Requester Endpoints (Secured & Regression)

### 3.1 Create Ticket
- **Method & Path:** `POST /api/v1/tickets`
- **Access:** Authenticated Requester (ดึงตัวตนผู้สร้างจาก Session เบื้องหลัง)
- **Request Body:**
  ```json
  {
    "categoryId": 1,
    "relatedSystemId": 2,
    "summary": "Cannot connect to office VPN from home",
    "description": "VPN connection drops every 5 minutes when connecting from home network.",
    "requestedPriority": "High"
  }
  ```
- **Responses:**
  - `201 Created`: สร้างตั๋วสำเร็จ กำหนด `itPriority = requestedPriority`, `currentStatus = "New"`
    ```json
    {
      "ticketNo": "TKT-2026-00001",
      "message": "Ticket created successfully"
    }
    ```
  - `400 Bad Request`: ฟิลด์บังคับไม่ครบ หรือข้อความยาวเกินเกณฑ์ (Summary > 150, Description > 2000)

### 3.2 View My Tickets
- **Method & Path:** `GET /api/v1/tickets`
- **Access:** Authenticated Requester (กรองเฉพาะตั๋วที่ `requesterId = currentUser.id` เสมอ)
- **Query Parameters:**
  - `search` (Optional): คำค้นหา Ticket No หรือ Summary
  - `category` (Optional): กรองตาม Category ID
  - `status` (Optional): กรองตาม Ticket Status
  - `page` (Optional, Default: 1): หน้าที่ต้องการเรียกดู
  - `limit` (Optional, Default: 10): จำนวนรายการต่อหน้า
- **Responses:**
  - `200 OK`:
    ```json
    {
      "data": [
        {
          "ticketNo": "TKT-2026-00001",
          "summary": "Cannot connect to office VPN from home",
          "category": "Network",
          "relatedSystem": "VPN",
          "requestedPriority": "High",
          "currentStatus": "In Progress",
          "createdAt": "2026-09-08T10:00:00.000Z"
        }
      ],
      "meta": { "totalItems": 1, "currentPage": 1, "totalPages": 1, "limit": 10 }
    }
    ```

### 3.3 View Ticket Detail (Requester View)
- **Method & Path:** `GET /api/v1/tickets/:id`
- **Access:** Authenticated Requester (ต้องเป็นเจ้าของตั๋วเท่านั้น)
- **Responses:**
  - `200 OK`: ข้อมูลตั๋ว, ไฟล์แนบ, และแฟล็ก `problemResolvedReported`
  - `403 Forbidden` หรือ `404 Not Found`: หากไม่ใช่เจ้าของตั๋ว (ไม่เปิดเผยข้อมูลของผู้อื่น)

### 3.4 Indicate Problem Appears Resolved
- **Method & Path:** `POST /api/v1/tickets/:id/resolve-indication`
- **Access:** Authenticated Requester (เฉพาะตั๋วที่เป็นเจ้าของ และสถานะต้องเป็น `Open`, `In Progress`, หรือ `Waiting for Requester`)
- **Responses:**
  - `200 OK`: บันทึกแฟล็ก `problemResolvedReported = true` พร้อมสร้าง Public Comment อัตโนมัติ
    ```json
    {
      "message": "Problem resolution indicated successfully",
      "problemResolvedReported": true
    }
    ```
  - `400 Bad Request`: ตั๋วอยู่ในสถานะที่ไม่สามารถส่งสัญญาณได้ (เช่น New, Resolved, Closed, Cancelled)
  - `403 Forbidden`: ไม่ใช่เจ้าของตั๋ว

### 3.5 Attachments Management (Lab 2 Continuous)

#### 3.5.1 Upload Attachment
- **Method & Path:** `POST /api/v1/tickets/:id/attachments`
- **Access:** Authenticated Requester (เฉพาะเจ้าของตั๋วเท่านั้น)
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `file`: ไฟล์แนบ (รองรับนามสกุล JPG, PNG, WEBP, PDF ขนาดสูงสุดไม่เกิน 5 MB)
- **Responses:**
  - `201 Created`: อัปโหลดและบันทึกไฟล์แนบสำเร็จ
    ```json
    {
      "message": "Attachment uploaded successfully",
      "attachment": {
        "id": 1,
        "filename": "screenshot-issue.png",
        "size": 1048576,
        "mimeType": "image/png",
        "createdAt": "2026-09-10T12:00:00.000Z"
      }
    }
    ```
  - `400 Bad Request`: ไม่มีไฟล์แนบส่งมา, ขนาดเกิน 5 MB, หรือประเภทไฟล์ไม่รองรับ (`"Invalid file type or size exceeds 5MB limit."`)
  - `401 Unauthorized`: ไม่ได้เข้าสู่ระบบ
  - `403 Forbidden`: ผู้ใช้ไม่ใช่เจ้าของตั๋วใบนี้ (`"You do not have permission to attach files to this ticket."`)
  - `404 Not Found`: ไม่พบเลขตั๋วที่ระบุในระบบ

#### 3.5.2 Download Attachment
- **Method & Path:** `GET /api/v1/tickets/:id/attachments/:attachmentId/download`
- **Access:** Authenticated Users (Requester เจ้าของตั๋ว, IT Staff, Administrator)
- **Responses:**
  - `200 OK`: สตรีมข้อมูลไบนารีของไฟล์ (Binary stream) พร้อม Header:
    - `Content-Disposition: attachment; filename="<filename>"`
    - `Content-Type: <mimeType>`
  - `401 Unauthorized`: ไม่ได้เข้าสู่ระบบ
  - `403 Forbidden`: Requester ที่ไม่ใช่เจ้าของตั๋วพยายามดาวน์โหลดไฟล์
  - `404 Not Found`: ไม่พบตั๋ว หรือไฟล์แนบถูกลบไปแล้ว (Soft-deleted)

#### 3.5.3 Remove Attachment (Soft Deletion)
- **Method & Path:** `DELETE /api/v1/tickets/:id/attachments/:attachmentId`
- **Access:** Authenticated Requester (เฉพาะเจ้าของตั๋วเท่านั้น)
- **Request Body:**
  ```json
  {
    "reason": "Uploaded incorrect configuration screenshot"
  }
  ```
- **Responses:**
  - `200 OK`: ซ่อน/ลบไฟล์แบบ Soft-removal สำเร็จ (บันทึก `deletedAt` และ `deletedReason`)
    ```json
    {
      "message": "Attachment removed successfully"
    }
    ```
  - `400 Bad Request`: ไม่ได้ระบุเหตุผลการลบ (`reason` ว่างเปล่า)
  - `401 Unauthorized`: ไม่ได้เข้าสู่ระบบ
  - `403 Forbidden`: ผู้ใช้ไม่ใช่เจ้าของตั๋วใบนี้
  - `404 Not Found`: ไม่พบไฟล์แนบ หรือไฟล์แนบถูกลบไปก่อนหน้านี้แล้ว

---

## 4. IT Staff Ticket Queue & Operational Endpoints

### 4.1 Retrieve IT Staff Ticket Queue
- **Method & Path:** `GET /api/v1/staff/tickets`
- **Access:** IT Staff and Administrator (Requester จะได้ HTTP 403 Forbidden)
- **Query Parameters:**
  - `search` (Optional): ค้นหาจาก Ticket Number หรือ Summary
  - `status` (Optional): กรองสถานะตั๋ว
  - `category` (Optional): กรองตาม Category ID
  - `priority` (Optional): กรองตาม IT Priority (`Low`, `Medium`, `High`, `Critical`)
  - `owner` (Optional): `all`, `unassigned`, หรือ `me` (กรองตั๋วที่ตนเองดูแล)
  - `page` (Optional, Default: 1)
  - `limit` (Optional, Default: 10)
  - `sortBy` (Optional, Default: `createdAt`): `createdAt`, `itPriority`, `ticketNo`
  - `sortOrder` (Optional, Default: `desc`): `asc`, `desc`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "data": [
        {
          "id": 101,
          "ticketNo": "TKT-2026-00001",
          "createdDate": "2026-09-08T10:00:00.000Z",
          "summary": "Cannot connect to office VPN from home",
          "category": "Network",
          "requestedPriority": "High",
          "itPriority": "High",
          "currentStatus": "In Progress",
          "ticketOwner": { "id": 2, "name": "Sarah Johnson" },
          "problemResolvedReported": false
        }
      ],
      "meta": { "totalItems": 45, "currentPage": 1, "totalPages": 5, "limit": 10 }
    }
    ```

### 4.2 Retrieve Ticket Detail (IT Staff & Admin View)
- **Method & Path:** `GET /api/v1/staff/tickets/:id`
- **Access:** IT Staff and Administrator (Requester จะได้ HTTP 403 Forbidden)
- **Responses:**
  - `200 OK`: ข้อมูลตั๋วครบถ้วน, ข้อมูลผู้แจ้ง (Requester Name, Email), เจ้าหน้าที่รับผิดชอบ, Attachments, และสถานะการอนุญาตเปลี่ยน State

### 4.3 Claim / Reassign Ticket Ownership
- **Method & Path:** `PATCH /api/v1/staff/tickets/:id/ownership`
- **Access:** IT Staff and Administrator
- **Request Body:**
  ```json
  {
    "assignedStaffId": 2 // ส่ง ID ของ IT Staff หรือ Administrator
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "message": "Ticket ownership updated successfully",
      "assignedStaff": { "id": 2, "name": "Sarah Johnson" }
    }
    ```
  - `400 Bad Request`: `assignedStaffId` ไม่ถูกต้อง หรือไม่ใช่ผู้ใช้บทบาท IT Staff หรือ Administrator ที่ Active

### 4.4 Update IT Priority
- **Method & Path:** `PATCH /api/v1/staff/tickets/:id/priority`
- **Access:** IT Staff and Administrator
- **Request Body:**
  ```json
  {
    "itPriority": "Critical"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    { "message": "IT Priority updated successfully", "itPriority": "Critical" }
    ```
  - `400 Bad Request`: ค่า Priority ไม่อยู่ในรายการที่อนุญาต (Low, Medium, High, Critical)

### 4.5 Update Ticket Status
- **Method & Path:** `PATCH /api/v1/staff/tickets/:id/status`
- **Access:** IT Staff and Administrator
- **Request Body:**
  ```json
  {
    "status": "Resolved"
  }
  ```
- **Responses:**
  - `200 OK`: ปรับสถานะสำเร็จตาม State Transition Matrix
    ```json
    { "message": "Ticket status updated successfully", "currentStatus": "Resolved" }
    ```
  - `400 Bad Request`: การเปลี่ยนสถานะผิดกฎ State Transition Matrix (เช่น New ข้ามไป Resolved โดยตรง)

---

## 5. Comments & Internal Notes Endpoints

### 5.1 Public Comments
- **Retrieve Comments:** `GET /api/v1/tickets/:id/comments`
  - **Access:** Requester (เฉพาะตั๋วตนเอง), IT Staff, Administrator
  - **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "content": "Thank you for the update. Please let me know if you need more details.",
        "author": { "name": "Jennifer Anderson", "role": "REQUESTER" },
        "createdAt": "2026-09-08T11:45:00.000Z"
      }
    ]
    ```
- **Create Comment:** `POST /api/v1/tickets/:id/comments`
  - **Access:** Requester (เฉพาะตั๋วตนเอง), IT Staff, Administrator
  - **Request Body:**
    ```json
    { "content": "We are looking into this issue right now." }
    ```
  - **Responses:**
    - `201 Created`: บันทึกข้อความสำเร็จ (Append-only)
    - `400 Bad Request`: ข้อความว่างเปล่า หรือยาวเกิน 1,000 ตัวอักษร
    - `403 Forbidden`: ไม่มีสิทธิ์โพสต์ความคิดเห็น

### 5.2 Internal Notes (Confidential)
- **Retrieve Notes:** `GET /api/v1/staff/tickets/:id/notes`
  - **Access:** IT Staff, Administrator (**Requester ตอบกลับ 403 Forbidden**)
  - **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "content": "Checked server logs; switch port 4 had intermittent flaps.",
        "author": { "name": "Sarah Johnson", "role": "IT_STAFF" },
        "createdAt": "2026-09-08T12:00:00.000Z"
      }
    ]
    ```
- **Create Note:** `POST /api/v1/staff/tickets/:id/notes`
  - **Access:** IT Staff, Administrator (**Requester ตอบกลับ 403 Forbidden**)
  - **Request Body:**
    ```json
    { "content": "Coordinating with ISP network engineer." }
    ```
  - **Responses:**
    - `201 Created`: บันทึกข้อความภายในลงระบบสำเร็จ
    - `400 Bad Request`: ข้อความว่างหรือยาวเกิน 1,000 ตัวอักษร
    - `403 Forbidden`: ผู้ใช้ไม่ใช่ IT Staff หรือ Administrator

---

## 6. Administrator User Management Endpoints

### 6.1 Retrieve User List
- **Method & Path:** `GET /api/v1/admin/users`
- **Access:** Administrator Only (Role อื่นได้ 403 Forbidden)
- **Query Parameters:**
  - `search` (Optional): ค้นหาด้วยชื่อหรืออีเมล
  - `role` (Optional): กรองตาม Role (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
- **Responses:**
  - `200 OK`:
    ```json
    [
      {
        "id": 1,
        "name": "John Smith",
        "email": "john.smith@toktickit.com",
        "role": "ADMINISTRATOR",
        "isActive": true,
        "mustChangePassword": false,
        "createdAt": "2026-08-01T00:00:00.000Z"
      }
    ]
    ```
    *(หมายเหตุ: ต้องไม่ส่ง `passwordHash` ออกไปใน Response)*

### 6.2 Create User
- **Method & Path:** `POST /api/v1/admin/users`
- **Access:** Administrator Only
- **Request Body:**
  ```json
  {
    "name": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "isActive": true,
    "initialPassword": "InitialPassword123!"
  }
  ```
- **Responses:**
  - `201 Created`: สร้างผู้ใช้สำเร็จ แฮชรหัสผ่าน และกำหนด `mustChangePassword = true`
    ```json
    {
      "message": "User created successfully",
      "user": { "id": 5, "name": "Alex Thompson", "email": "alex.thompson@toktickit.com", "role": "IT_STAFF" }
    }
    ```
  - `400 Bad Request`: ข้อมูลไม่ครบถ้วน, บทบาทไม่ถูกต้อง, หรือรหัสผ่านเริ่มต้นไม่ผ่านเกณฑ์ความซับซ้อน
  - `409 Conflict`: อีเมลซ้ำกับที่มีอยู่ในระบบ (`"Email already in use."`)

### 6.3 Update User Information
- **Method & Path:** `PATCH /api/v1/admin/users/:id`
- **Access:** Administrator Only
- **Request Body:**
  ```json
  {
    "name": "Alex Thompson Updated",
    "email": "alex.t@toktickit.com",
    "role": "IT_STAFF",
    "isActive": true
  }
  ```
- **Responses:**
  - `200 OK`: อัปเดตข้อมูลสำเร็จ
  - `400 Bad Request`: 
    - ละเมิดกฎความปลอดภัยแอดมิน: พยายาม Deactivate บัญชีตนเอง (`currentUser.id === targetUser.id`)
    - ละเมิดกฎความปลอดภัยแอดมิน: พยายาม Deactivate หรือเปลี่ยน Role ของ Administrator คนสุดท้ายที่ Active
  - `409 Conflict`: อีเมลใหม่ซ้ำกับผู้ใช้อื่น

### 6.4 Reset User Initial Password
- **Method & Path:** `POST /api/v1/admin/users/:id/reset-password`
- **Access:** Administrator Only
- **Request Body:**
  ```json
  {
    "initialPassword": "NewInitialPass2026!"
  }
  ```
- **Responses:**
  - `200 OK`: บันทึกรหัสผ่านเริ่มต้นใหม่ และตั้งแฟล็ก `mustChangePassword = true`
    ```json
    { "message": "Initial password reset successfully" }
    ```
  - `400 Bad Request`: รหัสผ่านเริ่มต้นไม่ผ่านเกณฑ์ความซับซ้อน (อย่างน้อย 8 ตัวอักษร, พิมพ์ใหญ่, พิมพ์เล็ก, ตัวเลข, สัญลักษณ์)

---

## 7. Reference Data Endpoints

- `GET /api/v1/categories`: ดึงรายชื่อหมวดหมู่ปัญหาทั้งหมด
- `GET /api/v1/related-systems`: ดึงรายชื่อระบบที่เกี่ยวข้องทั้งหมด
- `GET /api/v1/staff/active`: ดึงรายชื่อ IT Staff ที่มีสถานะ Active (สำหรับแสดงใน Dropdown เคลมหรือโอนงาน)
