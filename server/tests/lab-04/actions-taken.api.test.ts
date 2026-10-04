import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { AuthService, SESSION_COOKIE_NAME } from "../../src/services/auth.service.js";
import { validateActionTakenInput } from "../../src/controllers/actions-taken.controller.js";

describe("Lab 4 — Actions Taken API & Model Tests (Issue 2: #41)", () => {
  const prisma = getPrisma();
  let itStaffCookie: string;
  let requesterACookie: string;
  let requesterAId: number;
  let ticketAId: number;
  let ticketBId: number;
  let inactiveStaffToken: string;

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

    // 2. Log in as Requester A
    const reqALogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "requester_a@example.com",
        password: "Toktick2026!"
      });
    expect(reqALogin.status).toBe(200);
    requesterACookie = reqALogin.headers["set-cookie"][0];
    requesterAId = reqALogin.body.user.id;

    // 3. Find Ticket A (owned by Requester A) and Ticket B (owned by Jennifer / someone else)
    const ticketA = await prisma.ticket.findFirst({
      where: {
        ticketNo: "TKT-2026-00004",
        requester: { email: "requester_a@example.com" }
      }
    });
    const ticketB = await prisma.ticket.findFirst({
      where: {
        ticketNo: "TKT-2026-00003",
        requester: { email: "jennifer.anderson@toktickit.com" }
      }
    });

    expect(ticketA).toBeTruthy();
    expect(ticketB).toBeTruthy();
    ticketAId = ticketA!.id;
    ticketBId = ticketB!.id;

    // 6. Setup Inactive IT Staff user & session token
    let inactiveStaff = await prisma.user.findFirst({
      where: { email: "kevin.patel@toktickit.com" }
    });
    if (!inactiveStaff) {
      inactiveStaff = await prisma.user.create({
        data: {
          name: "Kevin Patel",
          email: "kevin.patel@toktickit.com",
          passwordHash: "$2b$10$abcdefghijklmnopqrstuu",
          role: "IT_STAFF",
          isActive: false
        }
      });
    } else if (inactiveStaff.isActive) {
      inactiveStaff = await prisma.user.update({
        where: { id: inactiveStaff.id },
        data: { isActive: false }
      });
    }

    inactiveStaffToken = AuthService.signToken({
      id: inactiveStaff.id,
      email: inactiveStaff.email,
      role: inactiveStaff.role,
      name: inactiveStaff.name
    });
  });

  // ---------------------------------------------------------------------------
  // UNIT-01: Follow-up Note Validation Logic
  // ---------------------------------------------------------------------------
  describe("UNIT-01: Follow-up Note Validation Logic (BR-06, AC-03)", () => {
    it("should return invalid when followUpRequired is true but followUpNote is missing or empty", () => {
      const res1 = validateActionTakenInput({
        actionDescription: "Diagnostic step",
        result: "Passed",
        followUpRequired: true,
        followUpNote: ""
      });
      expect(res1.isValid).toBe(false);
      expect(res1.code).toBe("FOLLOW_UP_NOTE_REQUIRED");

      const res2 = validateActionTakenInput({
        actionDescription: "Diagnostic step",
        result: "Passed",
        followUpRequired: true,
        followUpNote: null
      });
      expect(res2.isValid).toBe(false);
      expect(res2.code).toBe("FOLLOW_UP_NOTE_REQUIRED");
    });

    it("should return valid when followUpRequired is true and followUpNote is provided", () => {
      const res = validateActionTakenInput({
        actionDescription: "Diagnostic step",
        result: "Passed",
        followUpRequired: true,
        followUpNote: "Check back on Monday"
      });
      expect(res.isValid).toBe(true);
    });

    it("should return valid when followUpRequired is false with null followUpNote", () => {
      const res = validateActionTakenInput({
        actionDescription: "Diagnostic step",
        result: "Passed",
        followUpRequired: false,
        followUpNote: null
      });
      expect(res.isValid).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // API-01: Create Action Taken by IT Staff (Valid Data)
  // ---------------------------------------------------------------------------
  describe("API-01: IT Staff creates valid Action Taken (AC-01, FR-01, BR-01)", () => {
    it("should record Action Taken successfully and bind performedBy from session", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/actions`)
        .set("Cookie", itStaffCookie)
        .send({
          actionDescription: "Inspected network cable and replaced damaged RJ45 connector.",
          result: "Link connectivity established with 1Gbps full duplex.",
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: "network-test-results.txt"
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("successfully");
      expect(res.body.data).toBeDefined();
      expect(res.body.data.ticketId).toBe(ticketAId);
      expect(res.body.data.actionDescription).toBe("Inspected network cable and replaced damaged RJ45 connector.");
      expect(res.body.data.result).toBe("Link connectivity established with 1Gbps full duplex.");
      expect(res.body.data.performedBy).toBeDefined();
      expect(res.body.data.performedBy.email).toBe("sarah.johnson@toktickit.com");
      expect(res.body.data.followUpRequired).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // API-02: Spoofed performedById in Request Body
  // ---------------------------------------------------------------------------
  describe("API-02: Client sends spoofed performedById in Request Body (AC-02, BR-05)", () => {
    it("should ignore spoofed performedById and use authenticated user ID from session", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/actions`)
        .set("Cookie", itStaffCookie)
        .send({
          actionDescription: "Rebooted local network switch on floor 3.",
          result: "Switch rebooted cleanly.",
          followUpRequired: false,
          performedById: 99999 // Spoofed ID
        });

      expect(res.status).toBe(201);
      expect(res.body.data.performedBy.id).not.toBe(99999);
      expect(res.body.data.performedBy.email).toBe("sarah.johnson@toktickit.com");
    });
  });

  // ---------------------------------------------------------------------------
  // API-03: Mandatory Follow-up Note Validation
  // ---------------------------------------------------------------------------
  describe("API-03: followUpRequired=true without followUpNote (AC-03, BR-06)", () => {
    it("should reject creation with HTTP 400 and FOLLOW_UP_NOTE_REQUIRED error code", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/actions`)
        .set("Cookie", itStaffCookie)
        .send({
          actionDescription: "Ordered replacement hard drive.",
          result: "Waiting for delivery.",
          followUpRequired: true,
          followUpNote: "" // Missing required note
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("FOLLOW_UP_NOTE_REQUIRED");
      expect(res.body.error).toContain("Follow-up note is required");
    });
  });

  // ---------------------------------------------------------------------------
  // API-04: Update Existing Action Taken
  // ---------------------------------------------------------------------------
  describe("API-04: IT Staff updates existing Action Taken (AC-04, FR-05)", () => {
    it("should update content successfully and keep original performedById immutable (BR-05)", async () => {
      // 1. Create an action first
      const createRes = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/actions`)
        .set("Cookie", itStaffCookie)
        .send({
          actionDescription: "Initial investigation.",
          result: "Pending diagnostics.",
          followUpRequired: false
        });
      expect(createRes.status).toBe(201);
      const actionId = createRes.body.data.id;
      const initialUpdatedAt = createRes.body.data.updatedAt;

      // 2. IT Staff updates the action
      const updateRes = await request(app)
        .put(`/api/v1/tickets/${ticketAId}/actions/${actionId}`)
        .set("Cookie", itStaffCookie)
        .send({
          actionDescription: "Updated investigation by IT staff.",
          result: "Diagnostics completed successfully.",
          followUpRequired: true,
          followUpNote: "Verify customer satisfaction next week.",
          updatedAt: initialUpdatedAt
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.actionDescription).toBe("Updated investigation by IT staff.");
      expect(updateRes.body.data.result).toBe("Diagnostics completed successfully.");
      expect(updateRes.body.data.followUpRequired).toBe(true);
      expect(updateRes.body.data.followUpNote).toBe("Verify customer satisfaction next week.");
      // Original performer remains Sarah Johnson (BR-05)
      expect(updateRes.body.data.performedBy.email).toBe("sarah.johnson@toktickit.com");
    });
  });

  // ---------------------------------------------------------------------------
  // API-05: Requester Views Actions Taken on Own Ticket
  // ---------------------------------------------------------------------------
  describe("API-05: Requester views Actions Taken on their own ticket (AC-05, BR-03)", () => {
    it("should return HTTP 200 with list of Actions Taken for owner", async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticketAId}/actions`)
        .set("Cookie", requesterACookie);

      expect(res.status).toBe(200);
      expect(res.body.ticketId).toBe(ticketAId);
      expect(res.body.ticketNo).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty("actionDescription");
      expect(res.body.data[0]).toHaveProperty("result");
      expect(res.body.data[0]).toHaveProperty("performedBy");
    });
  });

  // ---------------------------------------------------------------------------
  // API-06: Requester Isolation (Cross-ticket View Rejection)
  // ---------------------------------------------------------------------------
  describe("API-06: Requester attempts to view Actions on another's ticket (AC-05, BR-03)", () => {
    it("should reject with HTTP 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticketBId}/actions`)
        .set("Cookie", requesterACookie);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN_ACTION");
    });
  });

  // ---------------------------------------------------------------------------
  // API-07: Requester Action Creation Rejection
  // ---------------------------------------------------------------------------
  describe("API-07: Requester attempts to create Action Taken (AC-06, BR-03)", () => {
    it("should reject Requester POST request with HTTP 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/actions`)
        .set("Cookie", requesterACookie)
        .send({
          actionDescription: "Requester trying to add action.",
          result: "Should fail.",
          followUpRequired: false
        });

      expect(res.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // API-08: Inactive Staff Rejection
  // ---------------------------------------------------------------------------
  describe("API-08: Inactive IT Staff attempts to record Action Taken (AC-07, BR-04)", () => {
    it("should reject inactive IT Staff with HTTP 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/actions`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${inactiveStaffToken}`)
        .send({
          actionDescription: "Inactive staff trying to record action.",
          result: "Should fail.",
          followUpRequired: false
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN_ACTION");
      expect(res.body.error).toContain("Only active IT Staff");
    });
  });

  // ---------------------------------------------------------------------------
  // API-14: Optimistic Concurrency Stale Update (409 Conflict)
  // ---------------------------------------------------------------------------
  describe("API-14: Concurrency Conflict Detection (AC-11, BR-11, Section 6.1)", () => {
    it("should return HTTP 409 Conflict when updating with stale updatedAt timestamp", async () => {
      // 1. Create an action
      const createRes = await request(app)
        .post(`/api/v1/tickets/${ticketAId}/actions`)
        .set("Cookie", itStaffCookie)
        .send({
          actionDescription: "Concurrency test baseline.",
          result: "Baseline established.",
          followUpRequired: false
        });
      const actionId = createRes.body.data.id;

      // 2. Perform a first update (advancing the updatedAt timestamp in DB)
      const firstUpdate = await request(app)
        .put(`/api/v1/tickets/${ticketAId}/actions/${actionId}`)
        .set("Cookie", itStaffCookie)
        .send({
          actionDescription: "First concurrent update.",
          result: "Updated successfully.",
          followUpRequired: false
        });
      expect(firstUpdate.status).toBe(200);

      // 3. Perform a second update using the OLD (stale) timestamp
      const staleTimestamp = new Date(Date.now() - 60000).toISOString();
      const staleUpdateRes = await request(app)
        .put(`/api/v1/tickets/${ticketAId}/actions/${actionId}`)
        .set("Cookie", itStaffCookie)
        .send({
          actionDescription: "Second update with stale timestamp.",
          result: "Should cause conflict.",
          followUpRequired: false,
          updatedAt: staleTimestamp
        });

      expect(staleUpdateRes.status).toBe(409);
      expect(staleUpdateRes.body.code).toBe("STALE_RECORD_CONFLICT");
      expect(staleUpdateRes.body.error).toContain("modified by another user");
    });
  });

  // ---------------------------------------------------------------------------
  // MIGR-01: Legacy Tickets & Data Integrity Verification
  // ---------------------------------------------------------------------------
  describe("MIGR-01: Legacy Tickets Data Integrity (AC-16, Section 5.2)", () => {
    it("should safely return empty array for legacy tickets with 0 Actions Taken", async () => {
      // Find ticket with 0 actions (e.g., TKT-2026-00008)
      const legacyTicket = await prisma.ticket.findFirst({
        where: { ticketNo: "TKT-2026-00008" }
      });
      expect(legacyTicket).toBeTruthy();

      const res = await request(app)
        .get(`/api/v1/tickets/${legacyTicket!.id}/actions`)
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      expect(res.body.ticketId).toBe(legacyTicket!.id);
      expect(res.body.ticketNo).toBe(legacyTicket!.ticketNo);
      expect(res.body.data).toEqual([]);
    });

    it("should support alias endpoint /api/v1/tickets/:id/actions-taken", async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${ticketAId}/actions-taken`)
        .set("Cookie", itStaffCookie);

      expect(res.status).toBe(200);
      expect(res.body.ticketId).toBe(ticketAId);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
