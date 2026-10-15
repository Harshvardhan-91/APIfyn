import express, { type Response } from "express";
import { prisma } from "../db";
import {
  type AuthenticatedRequest,
  authenticateToken,
  requireSessionAuth,
} from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  MAX_API_KEYS_PER_USER,
  createApiKey,
} from "../services/api-key.service";
import { createLogger } from "../utils/logger";

const router = express.Router();
const logger = createLogger();

router.use(authenticateToken, requireSessionAuth);

router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
    return res.json({ success: true, apiKeys });
  }),
);

router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const rawName = req.body?.name;
    const name = typeof rawName === "string" ? rawName.trim() : "";
    if (!name || name.length > 60) {
      return res.status(400).json({
        success: false,
        error: "Give the key a name between 1 and 60 characters.",
      });
    }

    const existing = await prisma.apiKey.count({
      where: { userId: req.user.id },
    });
    if (existing >= MAX_API_KEYS_PER_USER) {
      return res.status(400).json({
        success: false,
        error: `You can have at most ${MAX_API_KEYS_PER_USER} API keys. Revoke one first.`,
      });
    }

    const { key, apiKey } = await createApiKey(req.user.id, name);
    logger.info(`API key ${apiKey.id} created for user ${req.user.id}`);

    return res.status(201).json({ success: true, key, apiKey });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await prisma.apiKey.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (result.count === 0) {
      return res.status(404).json({ success: false, error: "API key not found" });
    }
    logger.info(`API key ${req.params.id} revoked by user ${req.user.id}`);
    return res.json({ success: true });
  }),
);

export default router;
