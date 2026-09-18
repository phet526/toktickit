import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import {
  isValidStatusTransition,
  getPermittedStatusTransitions,
  isValidITPriority
} from "../../src/utils/status-transition.validator.js";

describe("Lab 3 — Staff Ticket Detail & Operations Tests (UNIT-02, API-12, API-13, API-14, API-15)", () => {
  const prisma = getPrisma();
  let staffCookie: string;
  let adminCookie: string;
  let requesterCookie: string;
  let staffUserId: number;
  let anotherStaffId: number;
  let testTicketId: number;

  beforeAll(async () => {
    // 1. Log in as IT Staff (Sarah Johnson)
    const staffLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "sarah.johnson@toktickit.com",
        password: "Toktick2026!"
      });
    expect(staffLogin.status).toBe(200);
    staffCookie = staffLogin.headers["set-cookie"][0];
    staffUserId = staffLogin.body.user.id;

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

    // 4. Find or create another active IT Staff member for reassign tests
    let anotherStaff = await prisma.user.findFirst({
      where: {
        role: "IT_STAFF",
        isActive: true,
        id: { not: staffUserId }
      }
    });

    if (!anotherStaff) {
      anotherStaff = await prisma.user.create({
        data: {
          name: "Michael Chang",
          email: "michael.chang@toktickit.com",
          passwordHash: "$2b$10$abcdefghijklmnopqrstuu",
          role: "IT_STAFF",
          isActive: true,
          mustChangePassword: false
        }
      });
    }
    anotherStaffId = anotherStaff.id;

    // 5. Create a fresh ticket for operations testing
    const category = await prisma.category.findFirstOrThrow();
    const system = await prisma.relatedSystem.findFirstOrThrow();
    const requester = await prisma.user.findFirstOrThrow({ where: { role: "REQUESTER" } });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-${Date.now().toString().slice(-5)}`,
        summary: "Staff Operations Test Ticket",
        description: "Testing claim, reassign, priority, and status transitions",
        requestedPriority: "Medium",
        itPriority: "Medium",
        currentStatus: "New",
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        assignedStaffId: null
      }
    });
    testTicketId = ticket.id;
  });

  describe("UNIT-02: Ticket Status Transition Rules & Priority Validator", () => {
    it("should allow valid next transitions according to Status Transition Matrix", () => {
      expect(isValidStatusTransition("New", "Open")).toBe(true);
      expect(isValidStatusTransition("New", "In Progress")).toBe(true);
      expect(isValidStatusTransition("New", "Cancelled")).toBe(true);

      expect(isValidStatusTransition("Open", "In Progress")).toBe(true);
      expect(isValidStatusTransition("Open", "Waiting for Requester")).toBe(true);
      expect(isValidStatusTransition("Open", "Resolved")).toBe(true);
      expect(isValidStatusTransition("Open", "Cancelled")).toBe(true);

      expect(isValidStatusTransition("In Progress", "Waiting for Requester")).toBe(true);
      expect(isValidStatusTransition("In Progress", "Resolved")).toBe(true);
      expect(isValidStatusTransition("In Progress", "Cancelled")).toBe(true);

      expect(isValidStatusTransition("Waiting for Requester", "In Progress")).toBe(true);
      expect(isValidStatusTransition("Waiting for Requester", "Resolved")).toBe(true);
      expect(isValidStatusTransition("Waiting for Requester", "Cancelled")).toBe(true);

      expect(isValidStatusTransition("Resolved", "Closed")).toBe(true);
      expect(isValidStatusTransition("Resolved", "Reopened")).toBe(true);

      expect(isValidStatusTransition("Closed", "Reopened")).toBe(true);

      expect(isValidStatusTransition("Reopened", "In Progress")).toBe(true);
      expect(isValidStatusTransition("Reopened", "Waiting for Requester")).toBe(true);
      expect(isValidStatusTransition("Reopened", "Resolved")).toBe(true);
      expect(isValidStatusTransition("Reopened", "Cancelled")).toBe(true);

      expect(isValidStatusTransition("Cancelled", "Reopened")).toBe(true);
    });

    it("should reject invalid transitions (e.g. New -> Resolved or Closed -> In Progress)", () => {
      expect(isValidStatusTransition("New", "Resolved")).toBe(false);
      expect(isValidStatusTransition("New", "Closed")).toBe(false);
      expect(isValidStatusTransition("Closed", "In Progress")).toBe(false);
      expect(isValidStatusTransition("Resolved", "Open")).toBe(false);
      expect(isValidStatusTransition("Cancelled", "Resolved")).toBe(false);
    });

    it("should validate IT priorities properly", () => {
      expect(isValidITPriority("Low")).toBe(true);
      expect(isValidITPriority("Medium")).toBe(true);
      expect(isValidITPriority("High")).toBe(true);
      expect(isValidITPriority("Critical")).toBe(true);
      expect(isValidITPriority("Urgent")).toBe(false);
      expect(isValidITPriority("")).toBe(false);
    });

    it("should return correct permitted status transitions array for a given status", () => {
      const transitions = getPermittedStatusTransitions("New");
      expect(transitions).toEqual(["Open", "In Progress", "Cancelled"]);
    });
  });

  describe("API-12: IT Staff Claim Ticket Ownership", () => {
    it("should allow IT Staff to claim an unassigned ticket", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/ownership`)
        .set("Cookie", staffCookie)
        .send({ assignedStaffId: staffUserId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ticket ownership updated successfully");
      expect(res.body.assignedStaff.id).toBe(staffUserId);

      // Verify in DB
      const dbTicket = await prisma.ticket.findUnique({ where: { id: testTicketId } });
      expect(dbTicket?.assignedStaffId).toBe(staffUserId);
    });

    it("should block Requester from claiming ticket with HTTP 403", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/ownership`)
        .set("Cookie", requesterCookie)
        .send({ assignedStaffId: staffUserId });

      expect(res.status).toBe(403);
    });

    it("should allow Administrator to claim ticket with HTTP 200 (Superuser)", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/ownership`)
        .set("Cookie", adminCookie)
        .send({ assignedStaffId: staffUserId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ticket ownership updated successfully");
    });
  });

  describe("API-13: IT Staff Reassign Ticket Ownership", () => {
    it("should allow IT Staff to reassign ticket to another active IT Staff member", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/ownership`)
        .set("Cookie", staffCookie)
        .send({ assignedStaffId: anotherStaffId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ticket ownership updated successfully");
      expect(res.body.assignedStaff.id).toBe(anotherStaffId);

      // Verify in DB
      const dbTicket = await prisma.ticket.findUnique({ where: { id: testTicketId } });
      expect(dbTicket?.assignedStaffId).toBe(anotherStaffId);
    });

    it("should return HTTP 400 Bad Request when reassigning to a non-staff user", async () => {
      const requesterUser = await prisma.user.findFirstOrThrow({ where: { role: "REQUESTER" } });
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/ownership`)
        .set("Cookie", staffCookie)
        .send({ assignedStaffId: requesterUser.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("active IT Staff");
    });

    it("should allow Administrator to reassign ticket with HTTP 200 (Superuser)", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/ownership`)
        .set("Cookie", adminCookie)
        .send({ assignedStaffId: anotherStaffId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ticket ownership updated successfully");
    });
  });

  describe("API-14: Update IT Priority", () => {
    it("should update itPriority while keeping requestedPriority unchanged", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/priority`)
        .set("Cookie", staffCookie)
        .send({ itPriority: "Critical" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("IT Priority updated successfully");
      expect(res.body.itPriority).toBe("Critical");

      // Verify DB
      const dbTicket = await prisma.ticket.findUnique({ where: { id: testTicketId } });
      expect(dbTicket?.itPriority).toBe("Critical");
      expect(dbTicket?.requestedPriority).toBe("Medium"); // Untouched!
    });

    it("should return HTTP 400 Bad Request for invalid priority values", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/priority`)
        .set("Cookie", staffCookie)
        .send({ itPriority: "SuperUrgent" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid IT Priority");
    });

    it("should block Requester from updating IT priority with HTTP 403", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/priority`)
        .set("Cookie", requesterCookie)
        .send({ itPriority: "Low" });

      expect(res.status).toBe(403);
    });

    it("should allow Administrator to update IT priority with HTTP 200 (Superuser)", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/priority`)
        .set("Cookie", adminCookie)
        .send({ itPriority: "Critical" });

      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe("Critical");
    });
  });

  describe("API-15: Update Ticket Status (State Transition Matrix)", () => {
    it("should reject invalid transition (New -> Resolved) with HTTP 400", async () => {
      // Current ticket status is "New"
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "Resolved" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid status transition");
    });

    it("should successfully transition New -> Open", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "Open" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Open");
    });

    it("should successfully transition Open -> In Progress", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "In Progress" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("In Progress");
    });

    it("should successfully transition In Progress -> Resolved", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
        .set("Cookie", staffCookie)
        .send({ status: "Resolved" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Resolved");
    });

    it("should block Requester from updating status with HTTP 403", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${testTicketId}/status`)
        .set("Cookie", requesterCookie)
        .send({ status: "Closed" });

      expect(res.status).toBe(403);
    });

    it("should allow Administrator to update ticket status with HTTP 200 (Superuser)", async () => {
      const category = await prisma.category.findFirstOrThrow();
      const system = await prisma.relatedSystem.findFirstOrThrow();
      const requester = await prisma.user.findFirstOrThrow({ where: { role: "REQUESTER" } });
      const adminTestTicket = await prisma.ticket.create({
        data: {
          ticketNo: `TKT-ADMIN-${Date.now().toString().slice(-5)}`,
          summary: "Admin Status Test Ticket",
          description: "Testing admin status update",
          requestedPriority: "Medium",
          currentStatus: "New",
          requesterId: requester.id,
          categoryId: category.id,
          relatedSystemId: system.id
        }
      });

      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${adminTestTicket.id}/status`)
        .set("Cookie", adminCookie)
        .send({ status: "Open" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Open");
    });
  });

  describe("Ticket Detail Endpoint (GET /api/v1/staff/tickets/:id)", () => {
    it("should return full ticket details and permittedStatusTransitions for IT Staff", async () => {
      const res = await request(app)
        .get(`/api/v1/staff/tickets/${testTicketId}`)
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testTicketId);
      expect(res.body.summary).toBe("Staff Operations Test Ticket");
      expect(res.body.currentStatus).toBe("Resolved");
      expect(res.body.itPriority).toBe("Critical");
      expect(res.body.category).toHaveProperty("name");
      expect(res.body.requester).toHaveProperty("email");
      expect(res.body.assignedStaff).toHaveProperty("name");
      expect(Array.isArray(res.body.permittedStatusTransitions)).toBe(true);
      // Resolved allows Closed, Reopened
      expect(res.body.permittedStatusTransitions).toEqual(["Closed", "Reopened"]);
    });

    it("should allow Administrator to view staff ticket detail with HTTP 200 (view-only)", async () => {
      const res = await request(app)
        .get(`/api/v1/staff/tickets/${testTicketId}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testTicketId);
    });

    it("should block Requester from viewing staff ticket detail with HTTP 403", async () => {
      const res = await request(app)
        .get(`/api/v1/staff/tickets/${testTicketId}`)
        .set("Cookie", requesterCookie);

      expect(res.status).toBe(403);
    });
  });

  describe("Active Staff List Endpoint (GET /api/v1/staff/active)", () => {
    it("should return list of active IT Staff users for Reassign dropdown", async () => {
      const res = await request(app)
        .get("/api/v1/staff/active")
        .set("Cookie", staffCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("id");
      expect(res.body[0]).toHaveProperty("name");
      expect(res.body[0]).toHaveProperty("email");
    });
  });
});
