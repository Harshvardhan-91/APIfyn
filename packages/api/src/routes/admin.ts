import crypto from "node:crypto";
import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { asyncHandler } from "../middleware/errorHandler";
import { createLogger } from "../utils/logger";

const router = express.Router();
const logger = createLogger();

const ADMIN_JWT_SECRET =
  process.env.ADMIN_SECRET ?? "apifyn-admin-fallback-secret";

function signAdminToken(): string {
  return jwt.sign({ role: "admin" }, ADMIN_JWT_SECRET, { expiresIn: "4h" });
}

function verifyAdmin(req: Request, res: Response): boolean {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return false;
  }
  try {
    const decoded = jwt.verify(auth.slice(7), ADMIN_JWT_SECRET) as {
      role: string;
    };
    if (decoded.role !== "admin") throw new Error("Not admin");
    return true;
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
    return false;
  }
}

// Admin login — validates against ADMIN_SECRET env var
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { password } = req.body;
    const secret = process.env.ADMIN_SECRET;

    if (!secret) {
      res.status(503).json({ success: false, error: "Admin not configured" });
      return;
    }

    const valid =
      password && crypto.timingSafeEqual(
        Buffer.from(password),
        Buffer.from(secret),
      );

    if (!valid) {
      logger.warn("Failed admin login attempt");
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const token = signAdminToken();
    logger.info("Admin logged in");
    res.json({ success: true, token });
  }),
);

// Stats overview
router.get(
  "/stats",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!verifyAdmin(req, res)) return;

    const [totalUsers, totalWorkflows, totalExecutions, totalIntegrations] =
      await Promise.all([
        prisma.user.count(),
        prisma.workflow.count(),
        prisma.workflowExecution.count(),
        prisma.integration.count(),
      ]);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const activeSubscriptions = await prisma.subscription.count({
      where: { status: "ACTIVE" },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalWorkflows,
        totalExecutions,
        totalIntegrations,
        recentUsers,
        activeSubscriptions,
      },
    });
  }),
);

// List all users with their workflows and plan info
router.get(
  "/users",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!verifyAdmin(req, res)) return;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const search = (req.query.search as string) || "";

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { displayName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          photoURL: true,
          createdAt: true,
          lastLoginAt: true,
          apiCallsUsed: true,
          _count: {
            select: {
              workflows: true,
              executions: true,
              integrations: true,
            },
          },
          subscription: {
            select: {
              status: true,
              plan: { select: { name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }),
);

// Get a specific user's workflows
router.get(
  "/users/:userId/workflows",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!verifyAdmin(req, res)) return;

    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        triggerType: true,
        totalRuns: true,
        lastRunAt: true,
        createdAt: true,
        _count: { select: { executions: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, user, workflows });
  }),
);

export default router;
