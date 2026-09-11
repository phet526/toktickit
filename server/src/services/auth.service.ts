import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPrisma } from "../prisma.js";
import { validatePasswordComplexity } from "../utils/password-policy.js";

const JWT_SECRET = process.env.JWT_SECRET || "toktickit_jwt_secret_local_dev_key_2026";
export const SESSION_COOKIE_NAME = "toktick_session";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === "production"
};

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  name: string;
}

export class AuthService {
  static signToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }

  static async login(email?: string, password?: string) {
    if (!email || !password) {
      return {
        status: 400,
        body: { error: "Email and password are required", code: "MISSING_CREDENTIALS" }
      };
    }

    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } }
    });

    if (!user) {
      return {
        status: 401,
        body: { error: "Invalid email or password. Please try again.", code: "INVALID_CREDENTIALS" }
      };
    }

    if (!user.isActive) {
      return {
        status: 403,
        body: { error: "Account is deactivated. Please contact your administrator.", code: "ACCOUNT_DEACTIVATED" }
      };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return {
        status: 401,
        body: { error: "Invalid email or password. Please try again.", code: "INVALID_CREDENTIALS" }
      };
    }

    const token = this.signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    return {
      status: 200,
      token,
      body: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword
        },
        message: "Login successful"
      }
    };
  }

  static async changePassword(
    userId: number,
    currentPassword?: string,
    newPassword?: string,
    confirmPassword?: string
  ) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return {
        status: 400,
        body: { error: "Current password, new password, and confirmation are required", code: "MISSING_FIELDS" }
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        status: 400,
        body: { error: "New password and confirmation do not match", code: "PASSWORD_MISMATCH" }
      };
    }

    const complexity = validatePasswordComplexity(newPassword);
    if (!complexity.isValid) {
      return {
        status: 400,
        body: { error: complexity.error, code: "PASSWORD_TOO_WEAK" }
      };
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return {
        status: 404,
        body: { error: "User not found", code: "USER_NOT_FOUND" }
      };
    }

    const isCurrentMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentMatch) {
      return {
        status: 401,
        body: { error: "Current password is incorrect", code: "INVALID_CURRENT_PASSWORD" }
      };
    }

    if (currentPassword === newPassword || await bcrypt.compare(newPassword, user.passwordHash)) {
      return {
        status: 400,
        body: { error: "New password cannot be the same as the current password", code: "PASSWORD_SAME_AS_CURRENT" }
      };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false
      }
    });

    return {
      status: 200,
      body: { message: "Password changed successfully", mustChangePassword: false }
    };
  }

  static async getCurrentUser(userId: number) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }
}
