import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";

export type AuthRequest = Request & { user?: JwtPayload };

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return sendError(res, 401, "Please login to continue", { code: "UNAUTHORIZED" });
  }
  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    return sendError(res, 401, "Your session has expired. Please login again.", {
      code: "TOKEN_EXPIRED",
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, "Please login to continue", { code: "UNAUTHORIZED" });
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, "You do not have permission to access this resource", {
        code: "FORBIDDEN",
      });
    }
    next();
  };
}
