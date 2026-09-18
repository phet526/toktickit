import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 — Administrator User Management API Tests (API-19 to API-25 & RBAC)", () => {
  const prisma = getPrisma();
  let adminCookie: string;
  let adminId: number;
  let itStaffCookie: string;
  let requesterCookie: string;
  let testUserId: number;

  beforeAll(async () => {
    // 1. Log in as Administrator (John Smith)
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "john.smith@toktickit.com",
        password: "Toktick2026!"
      });
    expect(adminLogin.status).toBe(200);
    adminCookie = adminLogin.headers["set-cookie"][0];
    adminId = adminLogin.body.user.id;

    // 2. Log in as IT Staff (Sarah Johnson)
    const staffLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "sarah.johnson@toktickit.com",
        password: "Toktick2026!"
      });
    expect(staffLogin.status).toBe(200);
    itStaffCookie = staffLogin.headers["set-cookie"][0];

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

  describe("RBAC: Administrator-only Access Enforcement", () => {
    it("returns 401 Unauthorized for unauthenticated requests", async () => {
      const res = await request(app).get("/api/v1/admin/users");
      expect(res.status).toBe(401);
    });

    it("returns 403 Forbidden when Requester accesses user listing", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Cookie", requesterCookie);
      expect(res.status).toBe(403);
    });

    it("returns 403 Forbidden when IT Staff accesses user listing", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Cookie", itStaffCookie);
      expect(res.status).toBe(403);
    });

    it("returns 403 Forbidden when IT Staff attempts to create a user", async () => {
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Cookie", itStaffCookie)
        .send({
          name: "Unauthorized User",
          email: "unauth@example.com",
          role: "REQUESTER",
          initialPassword: "Pass1234!Valid"
        });
      expect(res.status).toBe(403);
    });
  });

  describe("API-19: Retrieve User List with Search & Role Filtering", () => {
    it("returns all users and ensures passwordHash is omitted", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      for (const user of res.body) {
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("role");
        expect(user).toHaveProperty("isActive");
        expect(user.passwordHash).toBeUndefined();
      }
    });

    it("filters users by role correctly", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users?role=ADMINISTRATOR")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      for (const user of res.body) {
        expect(user.role).toBe("ADMINISTRATOR");
      }
    });

    it("filters users by search term in name or email", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users?search=sarah")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      const matched = res.body.some((u: any) =>
        u.name.toLowerCase().includes("sarah") || u.email.toLowerCase().includes("sarah")
      );
      expect(matched).toBe(true);
    });
  });

  describe("API-20: Create User with Initial Password", () => {
    it("rejects user creation if initial password does not meet complexity rules", async () => {
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Weak Password User",
          email: "weak.pass@example.com",
          role: "IT_STAFF",
          initialPassword: "weak"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("creates a new user successfully with hashed initial password and mustChangePassword = true", async () => {
      const testEmail = `alex.thompson.${Date.now()}@toktickit.com`;
      const initialPassword = "InitialPassword123!";

      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Alex Thompson",
          email: testEmail,
          role: "IT_STAFF",
          isActive: true,
          initialPassword
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User created successfully");
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe("Alex Thompson");
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.user.role).toBe("IT_STAFF");
      expect(res.body.user.passwordHash).toBeUndefined();

      testUserId = res.body.user.id;

      // Verify in Database
      const dbUser = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(dbUser).not.toBeNull();
      expect(dbUser!.mustChangePassword).toBe(true);
      expect(bcrypt.compareSync(initialPassword, dbUser!.passwordHash)).toBe(true);
    });
  });

  describe("API-21: Prevent Duplicate Email Registration", () => {
    it("returns 409 Conflict when creating a user with an already registered email", async () => {
      const res = await request(app)
        .post("/api/v1/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Duplicate John",
          email: "JOHN.SMITH@toktickit.com", // case-insensitive duplicate
          role: "REQUESTER",
          initialPassword: "InitialPassword123!"
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Email already in use.");
    });
  });

  describe("API-22: Update User Profile & Active Status", () => {
    it("updates user name, role, and active status successfully", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${testUserId}`)
        .set("Cookie", adminCookie)
        .send({
          name: "Alex Thompson Updated",
          role: "REQUESTER",
          isActive: false
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("User updated successfully");
      expect(res.body.user.name).toBe("Alex Thompson Updated");
      expect(res.body.user.role).toBe("REQUESTER");
      expect(res.body.user.isActive).toBe(false);

      const dbUser = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(dbUser!.name).toBe("Alex Thompson Updated");
      expect(dbUser!.role).toBe("REQUESTER");
      expect(dbUser!.isActive).toBe(false);
    });

    it("returns 409 Conflict when updating email to one that already exists", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${testUserId}`)
        .set("Cookie", adminCookie)
        .send({
          email: "sarah.johnson@toktickit.com"
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("Email already in use.");
    });
  });

  describe("API-23: Prevent Self-Deactivation & Self-Role Demotion (BR-19)", () => {
    it("returns 400 Bad Request when admin attempts to deactivate their own account", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminId}`)
        .set("Cookie", adminCookie)
        .send({
          isActive: false
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot deactivate your own administrator account.");
    });

    it("returns 400 Bad Request when admin attempts to change their own role", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminId}`)
        .set("Cookie", adminCookie)
        .send({
          role: "IT_STAFF"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot change the role of your own administrator account.");
    });
  });

  describe("API-24: Last Active Administrator Protection (BR-20)", () => {
    it("prevents deactivating or demoting the last active administrator", async () => {
      // Find all active admins
      const activeAdmins = await prisma.user.findMany({
        where: { role: "ADMINISTRATOR", isActive: true }
      });

      // Ensure we have a second admin for testing, or create temporary second admin
      let secondAdmin = activeAdmins.find(a => a.id !== adminId);
      if (!secondAdmin) {
        secondAdmin = await prisma.user.create({
          data: {
            name: "Temp Second Admin",
            email: `second.admin.${Date.now()}@toktickit.com`,
            passwordHash: "$2b$10$abcdefghijklmnopqrstuu",
            role: "ADMINISTRATOR",
            isActive: true,
            mustChangePassword: false
          }
        });
      }

      // Deactivate all OTHER admins except secondAdmin
      const otherAdmins = await prisma.user.findMany({
        where: {
          role: "ADMINISTRATOR",
          isActive: true,
          id: { not: secondAdmin.id }
        }
      });

      // Temporarily mark them inactive
      for (const a of otherAdmins) {
        await prisma.user.update({
          where: { id: a.id },
          data: { isActive: false }
        });
      }

      // Now secondAdmin is the sole active administrator in DB
      // Log in as secondAdmin or use adminCookie to demote secondAdmin
      const soleCount = await prisma.user.count({
        where: { role: "ADMINISTRATOR", isActive: true }
      });
      expect(soleCount).toBe(1);

      // Attempt to deactivate the last active admin
      const res = await request(app)
        .patch(`/api/v1/admin/users/${secondAdmin.id}`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot deactivate or demote the last active administrator.");

      // Attempt to demote the last active admin
      const demoteRes = await request(app)
        .patch(`/api/v1/admin/users/${secondAdmin.id}`)
        .set("Cookie", adminCookie)
        .send({ role: "REQUESTER" });

      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.error).toBe("Cannot deactivate or demote the last active administrator.");

      // Restore other admins to active
      for (const a of otherAdmins) {
        await prisma.user.update({
          where: { id: a.id },
          data: { isActive: true }
        });
      }
    });
  });

  describe("API-25: Reset User Initial Password", () => {
    it("returns 400 if reset initial password does not meet complexity", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${testUserId}/reset-password`)
        .set("Cookie", adminCookie)
        .send({
          initialPassword: "short"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("resets password successfully and sets mustChangePassword = true", async () => {
      const newPassword = "NewInitialPass2026!";

      const res = await request(app)
        .post(`/api/v1/admin/users/${testUserId}/reset-password`)
        .set("Cookie", adminCookie)
        .send({
          initialPassword: newPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Initial password reset successfully");

      const dbUser = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(dbUser!.mustChangePassword).toBe(true);
      expect(bcrypt.compareSync(newPassword, dbUser!.passwordHash)).toBe(true);
    });
  });
});
