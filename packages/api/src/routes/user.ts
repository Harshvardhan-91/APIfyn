import express, { type Response } from "express";
import { prisma } from "../db";
import {
  type AuthenticatedRequest,
  authenticateFirebaseToken,
} from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { getUserPlanLimits } from "../services/plan.service";
import { encryptSecret, isSecretsEncryptionConfigured } from "../utils/secret-encryption";
import { createLogger } from "../utils/logger";

const router = express.Router();
const logger = createLogger();

// Get user dashboard data
router.get(
  "/dashboard",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    try {
      // Get actual workflow statistics from database
      const totalWorkflows = await prisma.workflow.count({
        where: { userId: user.id },
      });

      const activeWorkflows = await prisma.workflow.count({
        where: {
          userId: user.id,
          isActive: true,
        },
      });

      const totalExecutions = await prisma.workflowExecution.count({
        where: {
          workflow: {
            userId: user.id,
          },
        },
      });

      const totalIntegrations = await prisma.integration.count({
        where: { userId: user.id },
      });

      // Get executions today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const executionsToday = await prisma.workflowExecution.count({
        where: {
          workflow: {
            userId: user.id,
          },
          startedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Get executions this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const executionsThisWeek = await prisma.workflowExecution.count({
        where: {
          workflow: {
            userId: user.id,
          },
          startedAt: {
            gte: startOfWeek,
          },
        },
      });

      // Get recent workflow executions
      const recentActivity = await prisma.workflowExecution.findMany({
        where: {
          workflow: {
            userId: user.id,
          },
        },
        include: {
          workflow: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startedAt: "desc",
        },
        take: 5,
      });

      const limits = await getUserPlanLimits(user.id);

      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      const dashboardData = {
        totalWorkflows,
        executionsToday,
        connectedApps: totalIntegrations,
        thisWeek: executionsThisWeek,
        plan: {
          name: limits.planName,
          slug: limits.planSlug,
          type: limits.planSlug === "starter" ? "FREE" : "PAID",
          workflowsUsed: limits.workflowsUsed,
          workflowsLimit: limits.workflowsLimit === -1 ? 999999 : limits.workflowsLimit,
          apiCallsUsed: limits.apiCallsUsed,
          apiCallsLimit: limits.apiCallsLimit === -1 ? 999999 : limits.apiCallsLimit,
          subscriptionStatus: subscription?.status?.toLowerCase() ?? null,
          subscriptionEndDate: subscription?.currentPeriodEnd?.toISOString() ?? null,
        },
        recentActivity: recentActivity.map((execution) => ({
          id: execution.id,
          type: "workflow_execution",
          description: `Workflow "${execution.workflow.name}" executed`,
          status: execution.status.toLowerCase(),
          timestamp: execution.startedAt.toISOString(),
        })),
      };

      return res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      logger.error("Error fetching dashboard data:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard data",
      });
    }
  }),
);

// Get user profile
router.get(
  "/profile",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        jobTitle: user.jobTitle,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  }),
);

// OpenAI key (encrypted at rest) — used as default for openai-action blocks
router.get(
  "/openai-key",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { openaiKeyEnc: true },
    });
    return res.json({
      success: true,
      configured: Boolean(user?.openaiKeyEnc),
    });
  }),
);

router.put(
  "/openai-key",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!isSecretsEncryptionConfigured()) {
      return res.status(503).json({
        success: false,
        error:
          "Key storage is not configured (set SECRETS_ENCRYPTION_KEY to 64 hex characters).",
      });
    }
    const key = req.body?.openaiKey;
    if (key === null || key === "") {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { openaiKeyEnc: null },
      });
      return res.json({ success: true, configured: false });
    }
    if (typeof key !== "string" || !key.trim().startsWith("sk-")) {
      return res.status(400).json({
        success: false,
        error: "Invalid key format. Paste a valid OpenAI API key (starts with sk-).",
      });
    }
    const enc = encryptSecret(key.trim());
    await prisma.user.update({
      where: { id: req.user.id },
      data: { openaiKeyEnc: enc },
    });
    return res.json({ success: true, configured: true });
  }),
);

// Update user profile
router.put(
  "/profile",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { firstName, lastName, company, jobTitle } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        company,
        jobTitle,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        company: updatedUser.company,
        jobTitle: updatedUser.jobTitle,
      },
    });
  }),
);

export default router;
