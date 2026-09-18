import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 — RBAC Authorization & Data Isolation API Tests (API-07, API-08, API-08b, API-09, API-10)", () => {
  const prisma = getPrisma();
  let itStaffCookie: string;
  let adminCookie: string;
  let requesterACookie: string;
  let requesterBCookie: string;
  let requesterAId: number;
  let requesterBId: number;
  let ticketAId: number;
  let ticketBId: number;

  beforeAll(async () => {
    // 1. Log in as IT Staff (Sarah Johnson)
    const staffLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "sarah.johnson@toktickit.com",
        password: "Toktick2026!"
      });
    expect(staffLogin.status).toBe(200);
    itStaffCookie = staffLogin.headers["set-cookie"][0];

    // 2. Log in as Administrator (John Smith)
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "john.smith@toktickit.com",
        password: "Toktick2026!"
      });
    expect(adminLogin.status).toBe(200);
    adminCookie = adminLogin.headers["set-cookie"][0];

    // 3. Log in as Requester A
    const reqALogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "requester_a@example.com",
        password: "Toktick2026!"
      });
    expect(reqALogin.status).toBe(200);
    requesterACookie = reqALogin.headers["set-cookie"][0];
    requesterAId = reqALogin.body.user.id;

    // 4. Log in as Requester B
    const reqBLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "requester_b@example.com",
        password: "Toktick2026!"
      });
    expect(reqBLogin.status).toBe(200);
    requesterBCookie = reqBLogin.headers["set-cookie"][0];
    requesterBId = reqBLogin.body.user.id;

    // Find tickets belonging to Requester A and B for data isolation tests
    const ticketA = await prisma.ticket.findFirst({
      where: { requester: { email: "requester_a@example.com" } }
    });
    const ticketB = await prisma.ticket.findFirst({
      where: { requester: { email: "requester_b@example.com" } }
    });

    ticketAId = ticketA!.id;
    ticketBId = ticketB!.id;
  });

  describe("API-07: Requester Cross-Ticket Data Isolation (BR-07, AC-03)", () => {
    it("should allow Requester A to access their own Ticket A (HTTP 200)", async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticketAId}?requesterId=${requesterAId}`)
        .set("Cookie", requesterACookie);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ticketAId);
    });

    it("should strictly forbid Requester A from viewing Ticket B belonging to Requester B (HTTP 403)", async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticketBId}?requesterId=${requesterAId}`)
        .set("Cookie", requesterACookie);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });
  });

  describe("API-08 & API-08b: Role-Restricted Internal Notes Authorization (BR-04, BR-11, AC-04)", () => {
    it("API-08: should reject Requester A from retrieving Internal Notes on Ticket A with HTTP 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/v1/staff/tickets/${ticketAId}/notes`)
        .set("Cookie", requesterACookie);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("API-08: should reject Requester A from posting an Internal Note with HTTP 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/v1/staff/tickets/${ticketAId}/notes`)
        .set("Cookie", requesterACookie)
        .send({ content: "Malicious requester note" });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("API-08b: should allow Administrator to read Internal Notes on a ticket with HTTP 200", async () => {
      const res = await request(app)
        .get(`/api/v1/staff/tickets/${ticketAId}/notes`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("API-09: IT Staff Queue Role Restriction (BR-09)", () => {
    it("should reject unauthenticated access to IT Staff Queue with HTTP 401", async () => {
      const res = await request(app).get("/api/v1/staff/tickets");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should strictly forbid Requester role from accessing IT Staff Queue with HTTP 403", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets")
        .set("Cookie", requesterACookie);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("should allow IT Staff to access IT Staff Queue with HTTP 200", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets")
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe("API-10: Administrator User Management Access Enforcement (BR-09)", () => {
    it("should reject unauthenticated access to Admin User Management with HTTP 401", async () => {
      const res = await request(app).get("/api/v1/admin/users");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should forbid IT Staff from accessing Admin User Management with HTTP 403", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("should forbid Requester from accessing Admin User Management with HTTP 403", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Cookie", requesterACookie);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("should allow Administrator to access Admin User Management with HTTP 200", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
