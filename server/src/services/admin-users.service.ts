import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { validatePasswordComplexity } from "../utils/password-policy.js";

export interface UserFilter {
  search?: string;
  role?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  initialPassword: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export class AdminUsersService {
  /**
   * 6.1 Retrieve User List
   * Supports search (name/email) and role filtering. Excludes passwordHash.
   */
  static async getUsers(filter: UserFilter) {
    const prisma = getPrisma();
    const where: any = {};

    if (filter.role && Object.values(Role).includes(filter.role as Role)) {
      where.role = filter.role as Role;
    }

    if (filter.search && filter.search.trim().length > 0) {
      const term = filter.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { id: "asc" }
    });

    return users;
  }

  /**
   * 6.2 Create User
   * Creates a new user with hashed initial password, sets mustChangePassword = true.
   * Checks for duplicate email (409) and password complexity (400).
   */
  static async createUser(data: CreateUserData) {
    const prisma = getPrisma();

    if (!data.name || !data.name.trim()) {
      const error: any = new Error("Name is required");
      error.status = 400;
      throw error;
    }

    if (!data.email || !data.email.trim()) {
      const error: any = new Error("Email is required");
      error.status = 400;
      throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      const error: any = new Error("Invalid email format");
      error.status = 400;
      throw error;
    }

    if (!data.role || !Object.values(Role).includes(data.role as Role)) {
      const error: any = new Error("Valid role is required (REQUESTER, IT_STAFF, ADMINISTRATOR)");
      error.status = 400;
      throw error;
    }

    if (!data.initialPassword) {
      const error: any = new Error("Initial password is required");
      error.status = 400;
      throw error;
    }

    const complexity = validatePasswordComplexity(data.initialPassword);
    if (!complexity.isValid) {
      const error: any = new Error(complexity.error || "Initial password does not meet complexity requirements");
      error.status = 400;
      throw error;
    }

    // Check duplicate email (case-insensitive)
    const existing = await prisma.user.findFirst({
      where: { email: { equals: data.email.trim(), mode: "insensitive" } }
    });
    if (existing) {
      const error: any = new Error("Email already in use.");
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.initialPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role as Role,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        passwordHash,
        mustChangePassword: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true
      }
    });

    return {
      message: "User created successfully",
      user
    };
  }

  /**
   * 6.3 Update User Information
   * Admin Safety Rules:
   * - BR-19: Prevent self-deactivation and self-role demotion
   * - BR-20: Prevent deactivating or demoting the last active administrator
   * - Check duplicate email on change (409)
   */
  static async updateUser(targetId: number, currentAdminId: number, data: UpdateUserData) {
    const prisma = getPrisma();

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!targetUser) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // BR-19: Self protection
    if (targetId === currentAdminId) {
      if (data.isActive === false) {
        const error: any = new Error("Cannot deactivate your own administrator account.");
        error.status = 400;
        throw error;
      }
      if (data.role !== undefined && data.role !== "ADMINISTRATOR") {
        const error: any = new Error("Cannot change the role of your own administrator account.");
        error.status = 400;
        throw error;
      }
    }

    // BR-20: Last active admin protection
    if (targetUser.role === Role.ADMINISTRATOR && targetUser.isActive) {
      const isDeactivating = data.isActive === false;
      const isDemoting = data.role !== undefined && data.role !== Role.ADMINISTRATOR;

      if (isDeactivating || isDemoting) {
        const activeAdminCount = await prisma.user.count({
          where: { role: Role.ADMINISTRATOR, isActive: true }
        });

        if (activeAdminCount <= 1) {
          const error: any = new Error("Cannot deactivate or demote the last active administrator.");
          error.status = 400;
          throw error;
        }
      }
    }

    // Role validation if specified
    if (data.role !== undefined && !Object.values(Role).includes(data.role as Role)) {
      const error: any = new Error("Valid role is required (REQUESTER, IT_STAFF, ADMINISTRATOR)");
      error.status = 400;
      throw error;
    }

    // Duplicate email check
    if (data.email && data.email.trim().toLowerCase() !== targetUser.email.toLowerCase()) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email: { equals: data.email.trim(), mode: "insensitive" },
          id: { not: targetId }
        }
      });
      if (duplicate) {
        const error: any = new Error("Email already in use.");
        error.status = 409;
        throw error;
      }
    }

    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.email !== undefined) updatePayload.email = data.email.trim().toLowerCase();
    if (data.role !== undefined) updatePayload.role = data.role as Role;
    if (data.isActive !== undefined) updatePayload.isActive = Boolean(data.isActive);

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      message: "User updated successfully",
      user: updatedUser
    };
  }

  /**
   * 6.4 Reset User Initial Password
   * Sets new initial password and flags mustChangePassword = true.
   */
  static async resetPassword(targetId: number, initialPassword: string) {
    const prisma = getPrisma();

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!targetUser) {
      const error: any = new Error("User not found");
      error.status = 404;
      throw error;
    }

    if (!initialPassword) {
      const error: any = new Error("Initial password is required");
      error.status = 400;
      throw error;
    }

    const complexity = validatePasswordComplexity(initialPassword);
    if (!complexity.isValid) {
      const error: any = new Error(complexity.error || "Password does not meet complexity requirements");
      error.status = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    await prisma.user.update({
      where: { id: targetId },
      data: {
        passwordHash,
        mustChangePassword: true
      }
    });

    return {
      message: "Initial password reset successfully"
    };
  }
}
