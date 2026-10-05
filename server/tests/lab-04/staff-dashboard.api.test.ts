import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 4 — IT Staff & Admin Dashboard API Tests (Issue 5: #44, API-18 to API-20, SMOKE-01)", () => {
  const prisma = getPrisma();
  let itStaffCookie: string;
  let itStaffUser: any;
  let adminCookie: string;
  let adminUser: any;
  let requesterCookie: string;

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
    itStaffUser = staffLogin.body.user;

    // 2. Log in as Administrator
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@toktickit.com",
        password: "Toktick2026!"
      });
    expect(adminLogin.status).toBe(200);
    adminCookie = adminLogin.headers["set-cookie"][0];
    adminUser = adminLogin.body.user;

    // 3. Log in as Requester A
    const reqLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "requester_a@example.com",
        password: "Toktick2026!"
      });
    expect(reqLogin.status).toBe(200);
    requesterCookie = reqLogin.headers["set-cookie"][0];
  });

  // ---------------------------------------------------------------------------
  // API-18: IT Staff Dashboard Retrieval
  // ---------------------------------------------------------------------------
  describe("API-18: IT Staff Dashboard Retrieval (AC-15, FR-12)", () => {
    it("should return complete queue metrics, priority breakdown, and assigned tickets", async () => {
      const res = await request(app)
        .get("/api/v1/dashboards/staff")
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("staff");
      expect(res.body.staff.id).toBe(itStaffUser.id);
      expect(res.body.staff.role).toBe("IT_STAFF");

      // Check all 6 cards (Section 4.6 & 8.1)
      expect(res.body).toHaveProperty("metrics");
      expect(typeof res.body.metrics.newTickets).toBe("number");
      expect(typeof res.body.metrics.openTickets).toBe("number");
      expect(typeof res.body.metrics.inProgressTickets).toBe("number");
      expect(typeof res.body.metrics.waitingForRequesterTickets).toBe("number");
      expect(typeof res.body.metrics.myAssignedTickets).toBe("number");
      expect(typeof res.body.metrics.unassignedTickets).toBe("number");

      // Check trends
      expect(res.body).toHaveProperty("trends");
      expect(res.body.trends).toHaveProperty("newTickets");
      expect(typeof res.body.trends.newTickets).toBe("string");

      // Check ticketsByPriority
      expect(res.body).toHaveProperty("ticketsByPriority");
      expect(typeof res.body.ticketsByPriority.Low).toBe("number");
      expect(typeof res.body.ticketsByPriority.Medium).toBe("number");
      expect(typeof res.body.ticketsByPriority.High).toBe("number");
      expect(typeof res.body.ticketsByPriority.Critical).toBe("number");

      // Check myRecentTickets
      expect(res.body).toHaveProperty("myRecentTickets");
      expect(Array.isArray(res.body.myRecentTickets)).toBe(true);
      expect(res.body.myRecentTickets.length).toBeLessThanOrEqual(5);

      // adminSummary must be null for IT_STAFF
      expect(res.body.adminSummary).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // API-19: Administrator Dashboard with User Account Breakdown
  // ---------------------------------------------------------------------------
  describe("API-19: Administrator Dashboard with adminSummary (AC-15, BR-15, FR-13)", () => {
    it("should return IT dashboard metrics AND adminSummary for Administrator role", async () => {
      const res = await request(app)
        .get("/api/v1/dashboards/staff")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.staff.role).toBe("ADMINISTRATOR");
      expect(res.body.adminSummary).not.toBeNull();
      expect(typeof res.body.adminSummary.totalActiveUsers).toBe("number");
      expect(typeof res.body.adminSummary.activeStaff).toBe("number");
      expect(typeof res.body.adminSummary.activeRequesters).toBe("number");
      expect(typeof res.body.adminSummary.activeAdmins).toBe("number");

      expect(res.body.adminSummary.totalActiveUsers).toBeGreaterThanOrEqual(1);
      expect(res.body.adminSummary.activeAdmins).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // API-20: Authorization Enforcement
  // ---------------------------------------------------------------------------
  describe("API-20: RBAC Authorization on Staff Dashboard (AC-15, FR-12)", () => {
    it("should forbid Requester from accessing IT Staff dashboard with HTTP 403", async () => {
      const res = await request(app)
        .get("/api/v1/dashboards/staff")
        .set("Cookie", requesterCookie);

      expect(res.status).toBe(403);
      expect(res.body.code).toMatch(/FORBIDDEN/);
    });

    it("should reject unauthenticated request with HTTP 401", async () => {
      const res = await request(app)
        .get("/api/v1/dashboards/staff");

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });
  });

  // ---------------------------------------------------------------------------
  // SMOKE-01: Performance Latency Smoke Test
  // ---------------------------------------------------------------------------
  describe("SMOKE-01: Dashboard Performance Response Time (< 200ms) (FR-14, NFR-05)", () => {
    it("should respond within 200ms latency threshold", async () => {
      const start = Date.now();
      const res = await request(app)
        .get("/api/v1/dashboards/staff")
        .set("Cookie", itStaffCookie);
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(200);
    });
  });
});
