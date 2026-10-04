import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import {
  checkResolutionGate,
  isValidStatusTransition,
  getPermittedStatusTransitions,
  isTimestampStale,
  STATUS_TRANSITIONS
} from "../../src/utils/status-transition.validator.js";

describe("Lab 4 — Ticket State Transition Matrix & Resolution Gate Tests (Issue 4: #43)", () => {
  const prisma = getPrisma();
  let itStaffCookie: string;
  let requesterCookie: string;
  let itStaffUser: any;
  let requesterUser: any;
  let category: any;
  let relatedSystem: any;

  // Dedicated test tickets
  let ticketNoOwnerNoAction: any;
  let ticketWithOwnerNoAction: any;
  let ticketReadyToResolve: any;
  let ticketForTransitions: any;
  let ticketForAdvisory: any;

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

    // 2. Log in as Requester A
    const reqLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "requester_a@example.com",
        password: "Toktick2026!"
      });
    expect(reqLogin.status).toBe(200);
    requesterCookie = reqLogin.headers["set-cookie"][0];
    requesterUser = reqLogin.body.user;

    // 3. Find base Category & System
    category = await prisma.category.findFirst();
    relatedSystem = await prisma.relatedSystem.findFirst();

    // 4. Create dedicated tickets for test isolation
    const timestamp = Date.now();

    // Ticket 1: No owner, 0 actions (Status: Open)
    ticketNoOwnerNoAction = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-GATE1-${timestamp}`,
        summary: "Test Gate 1: No Owner, No Actions",
        description: "Testing Resolution Gate with no owner",
        requestedPriority: "Medium",
        itPriority: "Medium",
        currentStatus: "Open",
        requesterId: requesterUser.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem?.id
      }
    });

    // Ticket 2: With owner (Sarah), 0 actions (Status: In Progress)
    ticketWithOwnerNoAction = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-GATE2-${timestamp}`,
        summary: "Test Gate 2: Has Owner, No Actions",
        description: "Testing Resolution Gate with owner but 0 actions",
        requestedPriority: "High",
        itPriority: "High",
        currentStatus: "In Progress",
        requesterId: requesterUser.id,
        assignedStaffId: itStaffUser.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem?.id
      }
    });

    // Ticket 3: With owner (Sarah), has 1 Action Taken (Status: In Progress)
    ticketReadyToResolve = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-GATE3-${timestamp}`,
        summary: "Test Gate 3: Ready to Resolve",
        description: "Testing Resolution Gate with owner and action taken",
        requestedPriority: "High",
        itPriority: "High",
        currentStatus: "In Progress",
        requesterId: requesterUser.id,
        assignedStaffId: itStaffUser.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem?.id
      }
    });

    // Create Action Taken for Ticket 3
    await prisma.actionTaken.create({
      data: {
        ticketId: ticketReadyToResolve.id,
        actionDescription: "Replaced faulty switch port and verified ping.",
        result: "Latency normalized to 1ms.",
        performedById: itStaffUser.id,
        followUpRequired: false
      }
    });

    // Ticket 4: For Transition Matrix and Concurrency Testing (Status: New)
    ticketForTransitions = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-TRANS-${timestamp}`,
        summary: "Test State Transitions Matrix",
        description: "Testing transitions from New -> Open -> In Progress",
        requestedPriority: "Low",
        itPriority: "Low",
        currentStatus: "New",
        requesterId: requesterUser.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem?.id
      }
    });

    // Ticket 5: For Requester Advisory Signal (Status: Open)
    ticketForAdvisory = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-ADV-${timestamp}`,
        summary: "Test Requester Advisory Signal",
        description: "Testing problem appears resolved advisory",
        requestedPriority: "Medium",
        itPriority: "Medium",
        currentStatus: "Open",
        requesterId: requesterUser.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem?.id
      }
    });
  });

  // ---------------------------------------------------------------------------
  // UNIT-02: Resolution Gate Logic
  // ---------------------------------------------------------------------------
  describe("UNIT-02: Resolution Gate Validation Logic (BR-08, AC-08)", () => {
    it("should reject resolution when owner is missing, even if actionsCount >= 1", () => {
      const res = checkResolutionGate(null, 2);
      expect(res.canResolve).toBe(false);
      expect(res.hasOwner).toBe(false);
      expect(res.actionsCount).toBe(2);
    });

    it("should reject resolution when actionsCount is 0, even if owner exists", () => {
      const res = checkResolutionGate(5, 0);
      expect(res.canResolve).toBe(false);
      expect(res.hasOwner).toBe(true);
      expect(res.actionsCount).toBe(0);
    });

    it("should reject resolution when both owner is missing and actionsCount is 0", () => {
      const res = checkResolutionGate(undefined, 0);
      expect(res.canResolve).toBe(false);
      expect(res.hasOwner).toBe(false);
      expect(res.actionsCount).toBe(0);
    });

    it("should permit resolution when both owner is assigned and actionsCount >= 1", () => {
      const res = checkResolutionGate(10, 1);
      expect(res.canResolve).toBe(true);
      expect(res.hasOwner).toBe(true);
      expect(res.actionsCount).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // UNIT-03: Status Transition Matrix Validator
  // ---------------------------------------------------------------------------
  describe("UNIT-03: Status Transition Matrix Validator (BR-10, AC-10)", () => {
    it("should permit valid next statuses according to the 8-state matrix", () => {
      expect(isValidStatusTransition("New", "Open")).toBe(true);
      expect(isValidStatusTransition("New", "In Progress")).toBe(true);
      expect(isValidStatusTransition("New", "Cancelled")).toBe(true);
      expect(isValidStatusTransition("Open", "In Progress")).toBe(true);
      expect(isValidStatusTransition("Open", "Waiting for Requester")).toBe(true);
      expect(isValidStatusTransition("Open", "Resolved")).toBe(true);
      expect(isValidStatusTransition("In Progress", "Resolved")).toBe(true);
      expect(isValidStatusTransition("Resolved", "Closed")).toBe(true);
      expect(isValidStatusTransition("Resolved", "Reopened")).toBe(true);
      expect(isValidStatusTransition("Closed", "Reopened")).toBe(true);
      expect(isValidStatusTransition("Cancelled", "Reopened")).toBe(true);
    });

    it("should reject invalid/skipped status transitions", () => {
      expect(isValidStatusTransition("New", "Resolved")).toBe(false);
      expect(isValidStatusTransition("New", "Closed")).toBe(false);
      expect(isValidStatusTransition("Closed", "Resolved")).toBe(false);
      expect(isValidStatusTransition("Cancelled", "Open")).toBe(false);
    });

    it("should return the exact permitted next status list for each of the 8 states", () => {
      expect(getPermittedStatusTransitions("New")).toEqual(["Open", "In Progress", "Cancelled"]);
      expect(getPermittedStatusTransitions("Resolved")).toEqual(["Closed", "Reopened"]);
      expect(getPermittedStatusTransitions("Closed")).toEqual(["Reopened"]);
      expect(getPermittedStatusTransitions("Cancelled")).toEqual(["Reopened"]);
    });
  });

  // ---------------------------------------------------------------------------
  // UNIT-04: Optimistic Concurrency Timestamp Checker
  // ---------------------------------------------------------------------------
  describe("UNIT-04: Optimistic Concurrency Timestamp Checker (BR-11, AC-11)", () => {
    it("should return false (not stale) when client timestamp matches DB timestamp", () => {
      const now = new Date();
      expect(isTimestampStale(now.toISOString(), now)).toBe(false);
    });

    it("should return true (stale) when client timestamp differs from DB timestamp", () => {
      const dbDate = new Date("2026-10-04T12:00:00.000Z");
      const clientDate = new Date("2026-10-04T11:00:00.000Z");
      expect(isTimestampStale(clientDate.toISOString(), dbDate)).toBe(true);
    });

    it("should return false when client timestamp is not provided", () => {
      const dbDate = new Date();
      expect(isTimestampStale(undefined, dbDate)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // API-09: Resolution Gate Rejection (0 Actions Taken)
  // ---------------------------------------------------------------------------
  describe("API-09: Resolution Gate - Block Resolved with 0 Actions (BR-08, AC-08)", () => {
    it("should return HTTP 400 with RESOLUTION_GATE_FAILED when ticket has owner but 0 actions", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${ticketWithOwnerNoAction.id}/status`)
        .set("Cookie", itStaffCookie)
        .send({ status: "Resolved" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("RESOLUTION_GATE_FAILED");
      expect(res.body.error).toContain("Cannot resolve ticket without an assigned owner and at least one Action Taken record");
      expect(res.body.details).toBeDefined();
      expect(res.body.details.hasOwner).toBe(true);
      expect(res.body.details.actionsCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // API-10: Resolution Gate Rejection (Unassigned Owner)
  // ---------------------------------------------------------------------------
  describe("API-10: Resolution Gate - Block Resolved with No Owner (BR-08, AC-08)", () => {
    it("should return HTTP 400 with RESOLUTION_GATE_FAILED when ticket has no owner", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${ticketNoOwnerNoAction.id}/status`)
        .set("Cookie", itStaffCookie)
        .send({ status: "Resolved" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("RESOLUTION_GATE_FAILED");
      expect(res.body.details.hasOwner).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // API-11: Resolution Gate Success
  // ---------------------------------------------------------------------------
  describe("API-11: Resolution Gate - Successfully Resolve with Owner & Action (BR-08, AC-09)", () => {
    it("should return HTTP 200 and update status to Resolved when gate conditions are met", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${ticketReadyToResolve.id}/status`)
        .set("Cookie", itStaffCookie)
        .send({ status: "Resolved" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Resolved successfully");
      expect(res.body.currentStatus).toBe("Resolved");
      expect(res.body.data.currentStatus).toBe("Resolved");
    });
  });

  // ---------------------------------------------------------------------------
  // API-12: Permitted Status Transitions
  // ---------------------------------------------------------------------------
  describe("API-12: Valid Status Transitions according to Matrix (BR-10, AC-10)", () => {
    it("should successfully transition New -> Open", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${ticketForTransitions.id}/status`)
        .set("Cookie", itStaffCookie)
        .send({ status: "Open" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Open");
    });

    it("should successfully transition Open -> In Progress", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${ticketForTransitions.id}/status`)
        .set("Cookie", itStaffCookie)
        .send({ status: "In Progress" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("In Progress");
    });

    it("should successfully transition In Progress -> Waiting for Requester", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${ticketForTransitions.id}/status`)
        .set("Cookie", itStaffCookie)
        .send({ status: "Waiting for Requester" });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("Waiting for Requester");
    });
  });

  // ---------------------------------------------------------------------------
  // API-13: Forbidden Status Transition Rejection
  // ---------------------------------------------------------------------------
  describe("API-13: Reject Invalid Status Transition (BR-10, AC-10)", () => {
    it("should return HTTP 400 with INVALID_STATUS_TRANSITION when attempting illegal jump", async () => {
      // Create a fresh New ticket
      const newTicket = await prisma.ticket.create({
        data: {
          ticketNo: `TKT-TEST-ILLEGAL-${Date.now()}`,
          summary: "Illegal Jump Test",
          description: "Attempting New -> Resolved jump",
          requestedPriority: "Low",
          itPriority: "Low",
          currentStatus: "New",
          requesterId: requesterUser.id,
          categoryId: category.id,
          relatedSystemId: relatedSystem?.id
        }
      });

      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${newTicket.id}/status`)
        .set("Cookie", itStaffCookie)
        .send({ status: "Resolved" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_STATUS_TRANSITION");
      expect(res.body.error).toContain("Transition from New to Resolved is not permitted");
    });
  });

  // ---------------------------------------------------------------------------
  // API-14: Optimistic Concurrency Conflict (409 Conflict)
  // ---------------------------------------------------------------------------
  describe("API-14: Optimistic Concurrency Stale Update Detection (BR-11, AC-11)", () => {
    it("should return HTTP 409 Conflict with STALE_RECORD_CONFLICT when updatedAt is stale", async () => {
      const staleTimestamp = new Date(Date.now() - 3600000).toISOString();

      const res = await request(app)
        .patch(`/api/v1/staff/tickets/${ticketForTransitions.id}/status`)
        .set("Cookie", itStaffCookie)
        .send({
          status: "In Progress",
          updatedAt: staleTimestamp
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("STALE_RECORD_CONFLICT");
      expect(res.body.error).toContain("modified by another user");
    });
  });

  // ---------------------------------------------------------------------------
  // API-15: Requester Advisory Signal ("Problem Appears Resolved")
  // ---------------------------------------------------------------------------
  describe("API-15: Requester Advisory Signal (BR-09, AC-12)", () => {
    it("should record advisory flag and comment without changing official status", async () => {
      const initialStatus = ticketForAdvisory.currentStatus;

      const res = await request(app)
        .post(`/api/v1/tickets/${ticketForAdvisory.id}/resolve-indication`)
        .set("Cookie", requesterCookie);

      expect(res.status).toBe(200);
      expect(res.body.problemResolvedReported).toBe(true);
      expect(res.body.currentStatus).toBe(initialStatus);

      // Verify DB ticket flag was updated while official status remained unchanged
      const dbTicket = await prisma.ticket.findUnique({
        where: { id: ticketForAdvisory.id }
      });
      expect(dbTicket?.problemResolvedReported).toBe(true);
      expect(dbTicket?.currentStatus).toBe(initialStatus);

      // Verify automated Public Comment was created
      const comments = await prisma.comment.findMany({
        where: { ticketId: ticketForAdvisory.id }
      });
      const autoComment = comments.find((c) => c.content.includes("problem appears resolved"));
      expect(autoComment).toBeDefined();
    });

    it("should reject non-owner requester from indicating resolution", async () => {
      // Jennifer Anderson
      const jenniferLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "jennifer.anderson@toktickit.com",
          password: "Toktick2026!"
        });
      const jenniferCookie = jenniferLogin.headers["set-cookie"][0];

      const res = await request(app)
        .post(`/api/v1/tickets/${ticketForAdvisory.id}/resolve-indication`)
        .set("Cookie", jenniferCookie);

      expect(res.status).toBe(403);
    });
  });
});
