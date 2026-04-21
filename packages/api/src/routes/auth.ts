import express, { type Request, type Response } from "express";
import { prisma } from "../db";
import {
  type AuthenticatedRequest,
  authenticateToken,
  signJwt,
} from "../middleware/auth";
import { CustomError, asyncHandler } from "../middleware/errorHandler";
import { createLogger } from "../utils/logger";

const router = express.Router();
const logger = createLogger();

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

router.post(
  "/google",
  asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body;

    if (!credential) {
      throw new CustomError("Google access token is required", 400);
    }

    const infoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${credential}` } },
    );

    if (!infoRes.ok) {
      throw new CustomError("Invalid Google token", 401);
    }

    const payload = (await infoRes.json()) as GoogleUserInfo;

    if (!payload.sub || !payload.email) {
      throw new CustomError("Could not retrieve Google profile", 401);
    }

    let user = await prisma.user.findUnique({
      where: { googleId: payload.sub },
    });

    if (!user) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (existingEmail) {
        user = await prisma.user.update({
          where: { email: payload.email },
          data: {
            googleId: payload.sub,
            displayName: payload.name ?? existingEmail.displayName,
            photoURL: payload.picture ?? existingEmail.photoURL,
            emailVerified: payload.email_verified ?? existingEmail.emailVerified,
            lastLoginAt: new Date(),
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            googleId: payload.sub,
            email: payload.email,
            displayName: payload.name ?? null,
            photoURL: payload.picture ?? null,
            emailVerified: payload.email_verified ?? false,
            lastLoginAt: new Date(),
          },
        });
        logger.info(`New user created: ${user.email}`);
      }
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          displayName: payload.name ?? user.displayName,
          photoURL: payload.picture ?? user.photoURL,
          emailVerified: payload.email_verified ?? user.emailVerified,
          lastLoginAt: new Date(),
        },
      });
    }

    const token = signJwt({ userId: user.id, email: user.email });

    const { googleId, ...userData } = user;

    res.json({
      success: true,
      token,
      user: userData,
    });
  }),
);

router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userWithStats = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        _count: {
          select: {
            workflows: true,
            executions: true,
            integrations: true,
          },
        },
      },
    });

    if (!userWithStats) {
      throw new CustomError("User not found", 404);
    }

    const { googleId, ...userData } = userWithStats;

    res.json({
      success: true,
      user: userData,
    });
  }),
);

router.post(
  "/signout",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    logger.info(`User signed out: ${req.user.email}`);
    res.json({ success: true, message: "Successfully signed out" });
  }),
);

router.delete(
  "/delete-account",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    await prisma.user.delete({
      where: { id: user.id },
    });

    logger.info(`User account deleted: ${user.email}`);

    res.json({
      success: true,
      message: "Account successfully deleted",
    });
  }),
);

export default router;
