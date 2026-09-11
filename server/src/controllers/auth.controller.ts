import { Request, Response } from "express";
import { AuthService, SESSION_COOKIE_NAME, COOKIE_OPTIONS } from "../services/auth.service.js";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      if (result.status === 200 && result.token) {
        res.cookie(SESSION_COOKIE_NAME, result.token, COOKIE_OPTIONS);
        return res.status(200).json(result.body);
      }

      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "An unexpected error occurred during login", code: "SERVER_ERROR" });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated", code: "UNAUTHORIZED" });
      }

      const user = await AuthService.getCurrentUser(req.user.id);
      if (!user) {
        return res.status(401).json({ error: "User not found or inactive", code: "UNAUTHORIZED" });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ error: "Internal Server Error", code: "SERVER_ERROR" });
    }
  }

  static async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated", code: "UNAUTHORIZED" });
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;
      const result = await AuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
        confirmPassword
      );

      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("Change password error:", error);
      return res.status(500).json({ error: "Internal Server Error", code: "SERVER_ERROR" });
    }
  }

  static async logout(_req: Request, res: Response) {
    try {
      res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ error: "Internal Server Error", code: "SERVER_ERROR" });
    }
  }
}
