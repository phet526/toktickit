import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 — IT Staff Ticket Queue API Tests (API-11)", () => {
  const prisma = getPrisma();
  let itStaffCookie: string;
  let adminCookie: string;
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

    // 2. Log in as Administrator (John Smith)
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "john.smith@toktickit.com",
        password: "Toktick2026!"
      });
    expect(adminLogin.status).toBe(200);
    adminCookie = adminLogin.headers["set-cookie"][0];

    // 3. Log in as Requester (Requester A)
    const reqLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "requester_a@example.com",
        password: "Toktick2026!"
      });
    expect(reqLogin.status).toBe(200);
    requesterCookie = reqLogin.headers["set-cookie"][0];
  });

  describe("Authorization & Role Restrictions", () => {
    it("should return HTTP 401 Unauthorized if accessed without session cookie", async () => {
      const res = await request(app).get("/api/v1/staff/tickets");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should return HTTP 403 Forbidden if accessed by Requester role", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets")
        .set("Cookie", requesterCookie);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("should allow access (HTTP 200) for IT Staff", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets")
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it("should allow access (HTTP 200) for Administrator", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe("API-11: IT Staff Ticket Queue Retrieval & Pagination", () => {
    it("should return tickets with correct schema properties matching api-spec", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets")
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      const first = res.body.data[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("ticketNo");
      expect(first).toHaveProperty("createdDate");
      expect(first).toHaveProperty("summary");
      expect(first).toHaveProperty("category");
      expect(first).toHaveProperty("requestedPriority");
      expect(first).toHaveProperty("itPriority");
      expect(first).toHaveProperty("currentStatus");
      expect(first).toHaveProperty("ticketOwner");
      expect(first).toHaveProperty("problemResolvedReported");
    });

    it("should support pagination parameters (page, limit) and return metadata", async () => {
      const limit = 3;
      const res = await request(app)
        .get(`/api/v1/staff/tickets?page=1&limit=${limit}`)
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(limit);
      expect(res.body.meta.currentPage).toBe(1);
      expect(res.body.meta.limit).toBe(limit);
      expect(res.body.meta.totalItems).toBeGreaterThan(0);
      expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Search & Filtering", () => {
    it("should search tickets by ticketNo or summary substring", async () => {
      // Find an existing ticket summary
      const sample = await prisma.ticket.findFirst();
      const searchKeyword = sample?.ticketNo || "VPN";

      const res = await request(app)
        .get(`/api/v1/staff/tickets?search=${encodeURIComponent(searchKeyword)}`)
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const matches = res.body.data.every(
        (t: any) =>
          t.ticketNo.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          t.summary.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      expect(matches).toBe(true);
    });

    it("should filter tickets by status", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets?status=New")
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      for (const t of res.body.data) {
        expect(t.currentStatus.toLowerCase()).toBe("new");
      }
    });

    it("should filter tickets by category name", async () => {
      const category = await prisma.category.findFirst();
      if (!category) return;

      const res = await request(app)
        .get(`/api/v1/staff/tickets?category=${encodeURIComponent(category.name)}`)
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      for (const t of res.body.data) {
        expect(t.category.toLowerCase()).toBe(category.name.toLowerCase());
      }
    });

    it("should filter tickets by priority", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets?priority=High")
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      for (const t of res.body.data) {
        expect(t.itPriority.toLowerCase()).toBe("high");
      }
    });

    it("should filter unassigned tickets (owner=unassigned)", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets?owner=unassigned")
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      for (const t of res.body.data) {
        expect(t.ticketOwner).toBeNull();
      }
    });

    it("should filter tickets assigned to current staff (owner=me)", async () => {
      const res = await request(app)
        .get("/api/v1/staff/tickets?owner=me")
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      for (const t of res.body.data) {
        expect(t.ticketOwner).not.toBeNull();
        expect(t.ticketOwner.name).toBe("Sarah Johnson");
      }
    });
  });

  describe("Sorting", () => {
    it("should sort tickets by createdAt asc and desc", async () => {
      const resDesc = await request(app)
        .get("/api/v1/staff/tickets?sortBy=createdAt&sortOrder=desc&limit=5")
        .set("Cookie", itStaffCookie);

      const resAsc = await request(app)
        .get("/api/v1/staff/tickets?sortBy=createdAt&sortOrder=asc&limit=5")
        .set("Cookie", itStaffCookie);

      expect(resDesc.status).toBe(200);
      expect(resAsc.status).toBe(200);

      if (resDesc.body.data.length >= 2) {
        const d1 = new Date(resDesc.body.data[0].createdDate).getTime();
        const d2 = new Date(resDesc.body.data[1].createdDate).getTime();
        expect(d1).toBeGreaterThanOrEqual(d2);
      }

      if (resAsc.body.data.length >= 2) {
        const a1 = new Date(resAsc.body.data[0].createdDate).getTime();
        const a2 = new Date(resAsc.body.data[1].createdDate).getTime();
        expect(a1).toBeLessThanOrEqual(a2);
      }
    });
  });
});
