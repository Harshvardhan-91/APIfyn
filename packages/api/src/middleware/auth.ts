import type { User } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { findUserByApiKey, isApiKey } from "../services/api-key.service";
import { CacheService } from "../services/cache.service";

export type AuthMethod = "session" | "api_key";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      authMethod?: AuthMethod;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const USER_CACHE_TTL = 300; // 5 minutes

export function signJwt(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Accepts either a session JWT (browser) or an `apf_` API key (MCP server, scripts)
 * in the `Authorization: Bearer` header.
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No valid authorization token provided" });
      return;
    }

    const token = authHeader.substring(7);

    if (isApiKey(token)) {
      const user = await findUserByApiKey(token);
      if (!user) {
        res.status(401).json({ error: "Invalid API key" });
        return;
      }
      req.user = user;
      req.authMethod = "api_key";
      next();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const cacheKey = `cache:user:${decoded.userId}`;
    let user = await CacheService.get<User>(cacheKey);

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (user) {
        await CacheService.set(cacheKey, user, USER_CACHE_TTL);
      }
    }

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = user;
    req.authMethod = "session";
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      error: "Invalid authentication token",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/** Use after `authenticateToken` on routes an API key must not reach (e.g. minting new keys). */
export const requireSessionAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.authMethod !== "session") {
    res.status(403).json({
      success: false,
      error: "This action requires signing in to APIfyn; API keys are not allowed.",
    });
    return;
  }
  next();
};

// Keep backward-compatible alias for existing route imports
export const authenticateFirebaseToken = authenticateToken;
