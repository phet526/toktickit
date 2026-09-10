import { Request, Response, NextFunction } from "express";
import { AuthService, SESSION_COOKIE_NAME, TokenPayload } from "../services/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
    return;
  }

  const payload = AuthService.verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Session expired or invalid. Please sign in again.", code: "INVALID_SESSION" });
    return;
  }

  req.user = payload;
  next();
}

export function requireRole(...permittedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
      return;
    }

    if (!permittedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Access denied. Insufficient permissions.", code: "FORBIDDEN" });
      return;
    }

    next();
  };
}
