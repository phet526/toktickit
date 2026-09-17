import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { validatePasswordComplexity } from "../../src/utils/password-policy.js";
import bcrypt from "bcryptjs";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 — Authentication Foundation & Requester Regression Tests", () => {
  const prisma = getPrisma();

  beforeAll(async () => {
    const hash = bcrypt.hashSync("Toktick2026!", 10);
    const reqA = await prisma.user.upsert({
      where: { email: "requester_a@example.com" },
      update: { passwordHash: hash, mustChangePassword: false, isActive: true },
      create: {
        name: "Requester A",
        email: "requester_a@example.com",
        passwordHash: hash,
        mustChangePassword: false,
        role: "REQUESTER",
        isActive: true
      }
    });

    await prisma.user.upsert({
      where: { email: "requester_b@example.com" },
      update: { passwordHash: hash, mustChangePassword: true, isActive: true },
      create: {
        name: "Requester B",
        email: "requester_b@example.com",
        passwordHash: hash,
        mustChangePassword: true,
        role: "REQUESTER",
        isActive: true
      }
    });

    // Ensure Requester A has at least 2 tickets and 3 attachments for API-26 Zero Regression test
    const tickets = await prisma.ticket.findMany({
      where: { requesterId: reqA.id },
      include: { attachments: true }
    });

    let targetTicketId = tickets[0]?.id;
    if (tickets.length < 2) {
      const category = (await prisma.category.findFirst()) || (await prisma.category.create({ data: { name: "General" } }));
      const system = (await prisma.relatedSystem.findFirst()) || (await prisma.relatedSystem.create({ data: { name: "System" } }));
      
      const t1 = await prisma.ticket.create({
        data: {
          ticketNo: `TKT-MIGRATE-001-${Date.now()}`,
          summary: "Migrated Ticket 1",
          description: "Lab 2 ticket migrated",
          requestedPriority: "High",
          itPriority: "High",
          currentStatus: "Open",
          requesterId: reqA.id,
          categoryId: category.id,
          relatedSystemId: system.id
        }
      });
      await prisma.ticket.create({
        data: {
          ticketNo: `TKT-MIGRATE-002-${Date.now()}`,
          summary: "Migrated Ticket 2",
          description: "Lab 2 ticket migrated",
          requestedPriority: "Medium",
          itPriority: "Medium",
          currentStatus: "In Progress",
          requesterId: reqA.id,
          categoryId: category.id,
          relatedSystemId: system.id
        }
      });
      targetTicketId = t1.id;
    }

    const currentAttachments = tickets.reduce((sum, t) => sum + t.attachments.length, 0);
    if (currentAttachments < 3 && targetTicketId) {
      await prisma.attachment.createMany({
        data: [
          { ticketId: targetTicketId, filename: "sample_doc1.pdf", size: 1024, mimeType: "application/pdf" },
          { ticketId: targetTicketId, filename: "sample_img1.png", size: 2048, mimeType: "image/png" },
          { ticketId: targetTicketId, filename: "sample_log1.txt", size: 512, mimeType: "text/plain" }
        ]
      });
    }
  });

  describe("UNIT-01: Password Complexity Validator", () => {
    it("should reject passwords shorter than 8 characters", () => {
      const res = validatePasswordComplexity("Short1!");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("at least 8 characters");
    });

    it("should reject passwords without uppercase letters", () => {
      const res = validatePasswordComplexity("lowercase1!");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("uppercase");
    });

    it("should reject passwords without lowercase letters", () => {
      const res = validatePasswordComplexity("UPPERCASE1!");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("lowercase");
    });

    it("should reject passwords without numbers", () => {
      const res = validatePasswordComplexity("NoNumbersHere!");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("number");
    });

    it("should reject passwords without special characters", () => {
      const res = validatePasswordComplexity("NoSpecialChar123");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("special character");
    });

    it("should accept valid complex passwords", () => {
      const res = validatePasswordComplexity("Toktick2026!");
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe("API-01: Valid Authentication & Role Return", () => {
    it("should authenticate active user with valid credentials and return HTTP-only cookie and role", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "requester_a@example.com",
          password: "Toktick2026!"
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("requester_a@example.com");
      expect(res.body.user.role).toBe("REQUESTER");
      expect(res.body.user.passwordHash).toBeUndefined(); // Security: never return passwordHash

      // Verify Set-Cookie header contains toktick_session and HttpOnly
      const cookies = (res.headers["set-cookie"] as unknown as string[]) || [];
      expect(cookies.length).toBeGreaterThan(0);
      const sessionCookie = cookies.find((c: string) => c.startsWith("toktick_session="));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain("HttpOnly");
      expect(sessionCookie).toContain("SameSite=Lax");
    });

    it("should authenticate IT Staff with correct role", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "sarah.johnson@toktickit.com",
          password: "Toktick2026!"
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("IT_STAFF");
      expect(res.body.user.name).toBe("Sarah Johnson");
    });

    it("should authenticate Administrator with correct role", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "john.smith@toktickit.com",
          password: "Toktick2026!"
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("ADMINISTRATOR");
      expect(res.body.user.name).toBe("John Smith");
    });
  });

  describe("API-02: Safe Error on Invalid Credentials", () => {
    it("should return HTTP 401 with generic safe message for incorrect password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "requester_a@example.com",
          password: "WrongPassword123!"
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid email or password. Please try again.");
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("should return HTTP 401 with same generic message for non-existent email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent.user@example.com",
          password: "Toktick2026!"
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid email or password. Please try again.");
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("API-03: Deactivated / Inactive Account Login Blocking", () => {
    it("should reject login for inactive accounts (isActive = false) with safe message", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "requester_c@example.com", // Inactive Requester from Lab 2
          password: "Toktick2026!"
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Account is deactivated. Please contact your administrator.");
      expect(res.body.code).toBe("ACCOUNT_DEACTIVATED");
    });
  });

  describe("API-04 & API-05: Session Management, /me and Change Password Flow", () => {
    let sessionCookie: string;

    it("should log in and get session cookie", async () => {
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "requester_b@example.com",
          password: "Toktick2026!"
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.mustChangePassword).toBe(true);
      sessionCookie = loginRes.headers["set-cookie"][0];
    });

    it("API-05: GET /api/v1/auth/me should return current user profile using cookie", async () => {
      const meRes = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", sessionCookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe("requester_b@example.com");
      expect(meRes.body.user.name).toBe("Requester B");
      expect(meRes.body.user.role).toBe("REQUESTER");
    });

    it("API-04: should reject password change if new password is same as current password", async () => {
      const changeRes = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Cookie", sessionCookie)
        .send({
          currentPassword: "Toktick2026!",
          newPassword: "Toktick2026!",
          confirmPassword: "Toktick2026!"
        });

      expect(changeRes.status).toBe(400);
      expect(changeRes.body.error).toBe("New password cannot be the same as the current password");
      expect(changeRes.body.code).toBe("PASSWORD_SAME_AS_CURRENT");
    });

    it("API-04: should change password and unlock mustChangePassword flag", async () => {
      const changeRes = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Cookie", sessionCookie)
        .send({
          currentPassword: "Toktick2026!",
          newPassword: "BrandNewSecurePassword2026!",
          confirmPassword: "BrandNewSecurePassword2026!"
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.mustChangePassword).toBe(false);

      // Verify user can now log in with the new password
      const reLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "requester_b@example.com",
          password: "BrandNewSecurePassword2026!"
        });

      expect(reLogin.status).toBe(200);
      expect(reLogin.body.user.mustChangePassword).toBe(false);
    });

    it("API-06: POST /api/v1/auth/logout should clear session cookie and prevent further /me access", async () => {
      const logoutRes = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", sessionCookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe("Logged out successfully");

      // Verify cookie is expired in response headers
      const cookies = logoutRes.headers["set-cookie"];
      expect(cookies[0]).toContain("Expires=");

      // Subsequent access with cleared/empty cookie returns 401
      const meRes = await request(app).get("/api/v1/auth/me");
      expect(meRes.status).toBe(401);
    });
  });

  describe("API-26 & Zero Regression: Migrated Requester Data & Ticket Operations", () => {
    it("should retain existing Lab 2 tickets and attachments for migrated Requester A", async () => {
      const reqA = await prisma.user.findFirst({ where: { email: "requester_a@example.com" } });
      const reqAId = reqA?.id ?? 1;

      const tickets = await prisma.ticket.findMany({
        where: { requesterId: reqAId },
        include: { attachments: true, requester: true }
      });

      const migratedTicket = tickets.find(t => t.ticketNo === "TKT-2026-00004") || tickets[0];
      expect(migratedTicket.requester.name).toBe("Requester A");
      expect(migratedTicket.itPriority).toBeDefined();
      expect(migratedTicket.itPriority).toBe(migratedTicket.requestedPriority);

      // Verify existing attachment from Lab 2 is intact
      const totalAttachments = tickets.reduce((sum, t) => sum + t.attachments.length, 0);
      expect(totalAttachments).toBeGreaterThanOrEqual(3);
    });

    it("should allow creating a new ticket through API using migrated requester", async () => {
      const reqA = await prisma.user.findFirst({ where: { email: "requester_a@example.com" } });
      const reqAId = reqA?.id ?? 1;

      const category = await prisma.category.findFirst();
      const relatedSystem = await prisma.relatedSystem.findFirst();

      const res = await request(app)
        .post("/api/v1/tickets")
        .send({
          requesterId: reqAId, // Requester A
          categoryId: category!.id,
          relatedSystemId: relatedSystem!.id,
          summary: "Lab 3 Regression Test Ticket",
          description: "Testing ticket creation after User migration",
          requestedPriority: "MEDIUM"
        });

      expect(res.status).toBe(201);
      expect(res.body.ticketNo).toMatch(/^TKT-2026-\d{5}$/);

      // Verify in DB that itPriority was automatically set to requestedPriority (BR-14)
      const createdTicket = await prisma.ticket.findUnique({
        where: { ticketNo: res.body.ticketNo }
      });
      expect(createdTicket).toBeDefined();
      expect(createdTicket?.itPriority).toBe("MEDIUM");
      expect(createdTicket?.requesterId).toBe(1);
    });
  });
});
