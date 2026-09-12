import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 — Comments & Internal Notes API Tests (API-08, API-08b, API-16, API-17, API-18)", () => {
  const prisma = getPrisma();
  let itStaffCookie: string;
  let adminCookie: string;
  let requesterACookie: string;
  let requesterBCookie: string;
  let ticketAId: number;
  let ticketBId: number;
  let requesterAId: number;
  let requesterBId: number;

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

    // 4. Ensure Requester B exists and log in
    let reqB = await prisma.user.findFirst({
      where: { email: "requester_b@example.com" }
    });
    if (!reqB) {
      reqB = await prisma.user.create({
        data: {
          name: "Requester B",
          email: "requester_b@example.com",
          passwordHash: "$2b$10$abcdefghijklmnopqrstuu",
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false
        }
      });
    }
    requesterBId = reqB.id;

    const reqBLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "requester_b@example.com",
        password: "Toktick2026!"
      });
    expect(reqBLogin.status).toBe(200);
    requesterBCookie = reqBLogin.headers["set-cookie"][0];

    // 5. Create Ticket A owned by Requester A
    const category = await prisma.category.findFirstOrThrow();
    const system = await prisma.relatedSystem.findFirstOrThrow();

    const tA = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-COMM-A-${Date.now().toString().slice(-4)}`,
        summary: "Comments Test Ticket A",
        description: "Testing comments and notes flow on ticket A",
        requestedPriority: "High",
        itPriority: "High",
        currentStatus: "Open",
        requesterId: requesterAId,
        categoryId: category.id,
        relatedSystemId: system.id
      }
    });
    ticketAId = tA.id;

    // 6. Create Ticket B owned by Requester B
    const tB = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-COMM-B-${Date.now().toString().slice(-4)}`,
        summary: "Comments Test Ticket B",
        description: "Testing comments and notes flow on ticket B",
        requestedPriority: "Low",
        itPriority: "Low",
        currentStatus: "New",
        requesterId: requesterBId,
        categoryId: category.id,
        relatedSystemId: system.id
      }
    });
    ticketBId = tB.id;
  });

  describe("API-16: Public Comments Flow", () => {
    it("should allow Requester A to post a public comment on Ticket A", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/comments`)
        .set("Cookie", requesterACookie)
        .send({ content: "Hello IT, here is additional context for my issue." });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Hello IT, here is additional context for my issue.");
      expect(res.body.author.name).toBe("Requester A");
      expect(res.body.author.role).toBe("REQUESTER");
      expect(res.body).toHaveProperty("createdAt");
    });

    it("should allow IT Staff to reply with a public comment on Ticket A", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/comments`)
        .set("Cookie", itStaffCookie)
        .send({ content: "We are investigating the router switch now." });

      expect(res.status).toBe(201);
      expect(res.body.author.role).toBe("IT_STAFF");
    });

    it("should allow Requester A to retrieve comments on Ticket A", async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticketAId}/comments`)
        .set("Cookie", requesterACookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].content).toContain("Hello IT");
      expect(res.body[1].content).toContain("We are investigating");
    });

    it("should block Requester B from reading or posting comments on Ticket A with HTTP 403", async () => {
      const getRes = await request(app)
        .get(`/api/v1/tickets/${ticketAId}/comments`)
        .set("Cookie", requesterBCookie);
      expect(getRes.status).toBe(403);

      const postRes = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/comments`)
        .set("Cookie", requesterBCookie)
        .send({ content: "Unauthorized intrusion comment" });
      expect(postRes.status).toBe(403);
    });

    it("should block Administrator from creating public comments with HTTP 403 (BR-09, BR-10)", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/comments`)
        .set("Cookie", adminCookie)
        .send({ content: "Admin attempting to comment" });

      expect(res.status).toBe(403);
    });

    it("should allow Administrator to view public comments on any ticket (HTTP 200)", async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticketAId}/comments`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it("should reject empty or whitespace-only comments with HTTP 400", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/comments`)
        .set("Cookie", requesterACookie)
        .send({ content: "    " });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("cannot be empty");
    });

    it("should reject comments exceeding 1000 characters with HTTP 400", async () => {
      const longText = "a".repeat(1001);
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/comments`)
        .set("Cookie", requesterACookie)
        .send({ content: longText });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("exceed 1000");
    });
  });

  describe("API-08, API-08b & API-17: Confidential Internal Notes Flow (BR-04, BR-11)", () => {
    it("should allow IT Staff to post an internal note on Ticket A (API-17)", async () => {
      const res = await request(app)
        .post(`/api/v1/staff/tickets/${ticketAId}/notes`)
        .set("Cookie", itStaffCookie)
        .send({ content: "Confidential note: VLAN 20 is dropping packets." });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Confidential note: VLAN 20 is dropping packets.");
      expect(res.body.author.role).toBe("IT_STAFF");
      expect(res.body).toHaveProperty("createdAt");
    });

    it("should allow IT Staff to view internal notes (HTTP 200)", async () => {
      const res = await request(app)
        .get(`/api/v1/staff/tickets/${ticketAId}/notes`)
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].content).toContain("Confidential note");
    });

    it("API-08: should strictly BLOCK Requester from viewing internal notes with HTTP 403", async () => {
      const res = await request(app)
        .get(`/api/v1/staff/tickets/${ticketAId}/notes`)
        .set("Cookie", requesterACookie);

      expect(res.status).toBe(403);
    });

    it("API-08: should strictly BLOCK Requester from creating internal notes with HTTP 403", async () => {
      const res = await request(app)
        .post(`/api/v1/staff/tickets/${ticketAId}/notes`)
        .set("Cookie", requesterACookie)
        .send({ content: "Requester trying to create note" });

      expect(res.status).toBe(403);
    });

    it("API-08b: should allow Administrator to VIEW internal notes (HTTP 200)", async () => {
      const res = await request(app)
        .get(`/api/v1/staff/tickets/${ticketAId}/notes`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].content).toContain("VLAN 20 is dropping packets.");
    });

    it("should BLOCK Administrator from creating internal notes with HTTP 403 (BR-09, BR-11)", async () => {
      const res = await request(app)
        .post(`/api/v1/staff/tickets/${ticketAId}/notes`)
        .set("Cookie", adminCookie)
        .send({ content: "Admin trying to write note" });

      expect(res.status).toBe(403);
    });
  });

  describe("API-18: Indicate Problem Appears Resolved (AC-09, FR-08, BR-17)", () => {
    it("should allow ticket owner to indicate problem resolved when status is Open", async () => {
      // Current ticketA status is Open
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/resolve-indication`)
        .set("Cookie", requesterACookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Problem resolution indicated successfully");
      expect(res.body.problemResolvedReported).toBe(true);

      // Verify DB ticket flag is true but official currentStatus is still "Open"
      const dbTicket = await prisma.ticket.findUnique({ where: { id: ticketAId } });
      expect(dbTicket?.problemResolvedReported).toBe(true);
      expect(dbTicket?.currentStatus).toBe("Open"); // Official status unchanged!

      // Verify Auto Public Comment was created
      const comments = await prisma.comment.findMany({
        where: { ticketId: ticketAId },
        orderBy: { createdAt: "desc" }
      });
      expect(comments[0].content).toBe(
        "[Requester Update] The requester indicated that the problem appears resolved."
      );
      expect(comments[0].authorId).toBe(requesterAId);
    });

    it("should reject resolution indication when ticket is in New status with HTTP 400", async () => {
      // ticketB is in "New" status
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketBId}/resolve-indication`)
        .set("Cookie", requesterBCookie);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Open, In Progress, or Waiting for Requester");
    });

    it("should block non-owner from indicating problem resolved with HTTP 403", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/resolve-indication`)
        .set("Cookie", requesterBCookie);

      expect(res.status).toBe(403);
    });
  });
});
