import express, { type Response } from "express";
import { prisma } from "../db";
import {
  type AuthenticatedRequest,
  authenticateFirebaseToken,
} from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { CacheService } from "../services/cache.service";
import { getUserPlanLimits } from "../services/plan.service";
import { encryptSecret, isSecretsEncryptionConfigured } from "../utils/secret-encryption";
import { createLogger } from "../utils/logger";

const router = express.Router();
const logger = createLogger();

const DASHBOARD_CACHE_TTL = 60; // 1 minute

// Get user dashboard data
router.get(
  "/dashboard",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    const cacheKey = `cache:dashboard:${user.id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    try {
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

      await CacheService.set(cacheKey, dashboardData, DASHBOARD_CACHE_TTL);

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

    await CacheService.del(`cache:user:${user.id}`);

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

// Raw SQL analytics — demonstrates SQL proficiency beyond ORM
router.get(
  "/analytics",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    try {
      // Daily execution success rate over last 30 days
      const dailyStats = await prisma.$queryRaw<
        Array<{
          date: string;
          total: bigint;
          succeeded: bigint;
          failed: bigint;
          success_rate: number;
        }>
      >`
        SELECT
          DATE(we."startedAt") AS date,
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE we.status = 'SUCCESS')::bigint AS succeeded,
          COUNT(*) FILTER (WHERE we.status = 'FAILED')::bigint AS failed,
          ROUND(
            COUNT(*) FILTER (WHERE we.status = 'SUCCESS')::numeric
            / NULLIF(COUNT(*), 0) * 100, 1
          ) AS success_rate
        FROM workflow_executions we
        JOIN workflows w ON w.id = we."workflowId"
        WHERE w."userId" = ${user.id}
          AND we."startedAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(we."startedAt")
        ORDER BY date DESC
      `;

      // Average execution duration per workflow
      const avgDurations = await prisma.$queryRaw<
        Array<{
          workflow_id: string;
          workflow_name: string;
          avg_duration_ms: number;
          total_runs: bigint;
        }>
      >`
        SELECT
          w.id AS workflow_id,
          w.name AS workflow_name,
          ROUND(AVG(we.duration)::numeric, 0) AS avg_duration_ms,
          COUNT(*)::bigint AS total_runs
        FROM workflow_executions we
        JOIN workflows w ON w.id = we."workflowId"
        WHERE w."userId" = ${user.id}
          AND we.duration IS NOT NULL
        GROUP BY w.id, w.name
        ORDER BY avg_duration_ms DESC
        LIMIT 10
      `;

      // Peak usage hours (UTC)
      const peakHours = await prisma.$queryRaw<
        Array<{ hour: number; execution_count: bigint }>
      >`
        SELECT
          EXTRACT(HOUR FROM we."startedAt")::int AS hour,
          COUNT(*)::bigint AS execution_count
        FROM workflow_executions we
        JOIN workflows w ON w.id = we."workflowId"
        WHERE w."userId" = ${user.id}
          AND we."startedAt" >= NOW() - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM we."startedAt")
        ORDER BY execution_count DESC
      `;

      const serialize = (rows: any[]) =>
        rows.map((r) => {
          const obj: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(r)) {
            obj[k] = typeof v === "bigint" ? Number(v) : v;
          }
          return obj;
        });

      return res.json({
        success: true,
        analytics: {
          dailyStats: serialize(dailyStats),
          avgDurations: serialize(avgDurations),
          peakHours: serialize(peakHours),
        },
      });
    } catch (error) {
      logger.error("Error fetching analytics:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch analytics",
      });
    }
  }),
);

export default router;
