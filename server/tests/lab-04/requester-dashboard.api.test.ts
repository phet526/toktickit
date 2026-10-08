import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 4 — Requester Dashboard API Tests (Issue 5: #44, API-16 & API-17)", () => {
  const prisma = getPrisma();
  let requesterCookie: string;
  let requesterUser: any;
  let otherRequesterCookie: string;
  let otherRequesterUser: any;
  let emptyRequesterCookie: string;
  let emptyRequesterUser: any;

  beforeAll(async () => {
    // 1. Log in as Requester A
    const reqLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "requester_a@example.com",
        password: "Toktick2026!"
      });
    expect(reqLogin.status).toBe(200);
    requesterCookie = reqLogin.headers["set-cookie"][0];
    requesterUser = reqLogin.body.user;

    // 2. Log in as Requester B (for data isolation check)
    const otherLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "requester_b@example.com",
        password: "Toktick2026!"
      });
    expect(otherLogin.status).toBe(200);
    otherRequesterCookie = otherLogin.headers["set-cookie"][0];
    otherRequesterUser = otherLogin.body.user;

    // 3. Create a clean Requester with 0 tickets (for Empty State testing API-17)
    const emptyEmail = `empty.requester.${Date.now()}@example.com`;
    const createdUser = await prisma.user.create({
      data: {
        email: emptyEmail,
        passwordHash: requesterUser ? "$2a$10$wT3x9e9F50Y2v1QzN8Mh/Oa3C6fJkL8k0Bv4t5r6e7w8q9a0b1c2d" : "",
        name: "Empty Requester",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false
      }
    });
    // Set a known password hash for Toktick2026!
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("Toktick2026!", 10);
    await prisma.user.update({
      where: { id: createdUser.id },
      data: { passwordHash: hash }
    });

    const emptyLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: emptyEmail,
        password: "Toktick2026!"
      });
    expect(emptyLogin.status).toBe(200);
    emptyRequesterCookie = emptyLogin.headers["set-cookie"][0];
    emptyRequesterUser = emptyLogin.body.user;
  });

  // ---------------------------------------------------------------------------
  // API-16: Requester Dashboard Retrieval & Data Isolation
  // ---------------------------------------------------------------------------
  describe("API-16: Requester Dashboard Data & Isolation (AC-13, BR-12)", () => {
    it("should return requester dashboard with accurate metrics and recent tickets", async () => {
      const res = await request(app)
        .get("/api/v1/dashboards/requester")
        .set("Cookie", requesterCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("requester");
      expect(res.body.requester.id).toBe(requesterUser.id);
      expect(res.body.requester.name).toBe(requesterUser.name);

      expect(res.body).toHaveProperty("metrics");
      expect(typeof res.body.metrics.openTickets).toBe("number");
      expect(typeof res.body.metrics.inProgressTickets).toBe("number");
      expect(typeof res.body.metrics.waitingForRequesterTickets).toBe("number");
      expect(typeof res.body.metrics.resolvedTickets).toBe("number");
      expect(typeof res.body.metrics.closedTickets).toBe("number");

      expect(res.body).toHaveProperty("recentTickets");
      expect(Array.isArray(res.body.recentTickets)).toBe(true);
      expect(res.body.recentTickets.length).toBeLessThanOrEqual(5);

      if (res.body.recentTickets.length > 0) {
        const first = res.body.recentTickets[0];
        expect(first).toHaveProperty("id");
        expect(first).toHaveProperty("ticketNo");
        expect(first).toHaveProperty("summary");
        expect(first).toHaveProperty("category");
        expect(first).toHaveProperty("requestedPriority");
        expect(first).toHaveProperty("currentStatus");
        expect(first).toHaveProperty("updatedAt");
      }
    });

    it("should strictly isolate data: Requester A should never see Requester B's tickets", async () => {
      // Create a unique ticket for Requester B
      const category = await prisma.category.findFirstOrThrow();
      const system = await prisma.relatedSystem.findFirstOrThrow();
      const uniqueSummary = `Requester B Secret Ticket ${Date.now()}`;
      const ticketB = await prisma.ticket.create({
        data: {
          ticketNo: `TKT-ISO-${Date.now()}`,
          summary: uniqueSummary,
          description: "Confidential ticket",
          requestedPriority: "High",
          itPriority: "High",
          currentStatus: "Open",
          requesterId: otherRequesterUser.id,
          categoryId: category.id,
          relatedSystemId: system.id
        }
      });

      // Requester A fetches their dashboard
      const resA = await request(app)
        .get("/api/v1/dashboards/requester")
        .set("Cookie", requesterCookie);

      expect(resA.status).toBe(200);
      // Ensure ticketB is NOT in Requester A's recent tickets
      const foundInA = resA.body.recentTickets.some((t: any) => t.id === ticketB.id || t.summary === uniqueSummary);
      expect(foundInA).toBe(false);

      // Requester B fetches their dashboard
      const resB = await request(app)
        .get("/api/v1/dashboards/requester")
        .set("Cookie", otherRequesterCookie);

      expect(resB.status).toBe(200);
      const foundInB = resB.body.recentTickets.some((t: any) => t.id === ticketB.id || t.summary === uniqueSummary);
      expect(foundInB).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // API-17: Requester Dashboard Empty State
  // ---------------------------------------------------------------------------
  describe("API-17: Requester Dashboard Empty State (AC-13, FR-11, Section 5.3)", () => {
    it("should return zeros for all metrics and empty array for recentTickets when user has no tickets", async () => {
      const res = await request(app)
        .get("/api/v1/dashboards/requester")
        .set("Cookie", emptyRequesterCookie);

      expect(res.status).toBe(200);
      expect(res.body.requester.id).toBe(emptyRequesterUser.id);
      expect(res.body.metrics).toEqual({
        openTickets: 0,
        inProgressTickets: 0,
        waitingForRequesterTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0
      });
      expect(res.body.recentTickets).toEqual([]);
    });
  });
});
