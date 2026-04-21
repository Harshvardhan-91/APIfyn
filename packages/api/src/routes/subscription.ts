import crypto from "node:crypto";
import express, { type Request, type Response } from "express";
import Razorpay from "razorpay";
import { prisma } from "../db";
import {
  type AuthenticatedRequest,
  authenticateFirebaseToken,
} from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { createLogger } from "../utils/logger";

const router = express.Router();
const logger = createLogger();

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Get current subscription + plan info for the authenticated user
router.get(
  "/",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    });

    const starterPlan = await prisma.plan.findUnique({
      where: { slug: "starter" },
    });

    const workflowCount = await prisma.workflow.count({
      where: { userId: user.id },
    });

    // Reset API call counter if we're past the reset date
    const now = new Date();
    if (user.apiCallsResetAt && now > user.apiCallsResetAt) {
      const nextReset = new Date(user.apiCallsResetAt);
      while (nextReset < now) nextReset.setMonth(nextReset.getMonth() + 1);
      await prisma.user.update({
        where: { id: user.id },
        data: { apiCallsUsed: 0, apiCallsResetAt: nextReset },
      });
      user.apiCallsUsed = 0;
    }

    const activePlan =
      subscription && ["ACTIVE", "AUTHENTICATED"].includes(subscription.status)
        ? subscription.plan
        : starterPlan;

    res.json({
      success: true,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            interval: subscription.interval,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
      plan: activePlan
        ? {
            id: activePlan.id,
            name: activePlan.name,
            slug: activePlan.slug,
            workflowsLimit: activePlan.workflowsLimit,
            apiCallsLimit: activePlan.apiCallsLimit,
          }
        : null,
      usage: {
        workflows: workflowCount,
        apiCalls: user.apiCallsUsed,
      },
    });
  }),
);

// Create a new Razorpay subscription
router.post(
  "/create",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user;
    const { planSlug, interval = "monthly" } = req.body;

    if (!planSlug) {
      res.status(400).json({ success: false, error: "planSlug is required" });
      return;
    }

    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      res.status(404).json({ success: false, error: "Plan not found" });
      return;
    }

    if (plan.monthlyPrice === 0) {
      res.status(400).json({
        success: false,
        error: "Cannot subscribe to a free plan via payment",
      });
      return;
    }

    const razorpayPlanId =
      interval === "yearly" ? plan.razorpayPlanIdY : plan.razorpayPlanIdM;

    if (!razorpayPlanId) {
      res.status(400).json({
        success: false,
        error: "Razorpay plan not configured for this tier. Contact support.",
      });
      return;
    }

    // Cancel any existing subscription first
    const existing = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existing && ["ACTIVE", "AUTHENTICATED"].includes(existing.status)) {
      try {
        const rz = getRazorpay();
        await (rz.subscriptions as any).cancel(existing.razorpaySubId);
      } catch (e) {
        logger.warn("Could not cancel old subscription:", e);
      }
      await prisma.subscription.delete({ where: { id: existing.id } });
    }

    const rz = getRazorpay();

    const rzSub = await rz.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: interval === "yearly" ? 10 : 120,
      quantity: 1,
      notes: { userId: user.id, planSlug: plan.slug },
    } as any);

    await prisma.subscription.create({
      data: {
        razorpaySubId: rzSub.id,
        status: "CREATED",
        interval,
        userId: user.id,
        planId: plan.id,
      },
    });

    logger.info(
      `Razorpay subscription created: ${rzSub.id} for user ${user.id}, plan ${plan.slug}`,
    );

    res.json({
      success: true,
      subscriptionId: rzSub.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  }),
);

// Verify payment after Razorpay checkout completes
router.post(
  "/verify",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      res.status(400).json({
        success: false,
        error: "Missing payment verification fields",
      });
      return;
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      res.status(500).json({
        success: false,
        error: "Payment verification not configured",
      });
      return;
    }

    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      logger.warn(
        `Payment verification failed for sub ${razorpay_subscription_id}`,
      );
      res.status(400).json({
        success: false,
        error: "Payment verification failed",
      });
      return;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { razorpaySubId: razorpay_subscription_id },
      include: { plan: true },
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
      return;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (subscription.interval === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Reset API call counter on plan upgrade
    await prisma.user.update({
      where: { id: subscription.userId },
      data: { apiCallsUsed: 0, apiCallsResetAt: periodEnd },
    });

    logger.info(
      `Subscription activated: ${subscription.razorpaySubId}, plan: ${subscription.plan.name}`,
    );

    res.json({
      success: true,
      message: "Payment verified and subscription activated",
      plan: {
        name: subscription.plan.name,
        slug: subscription.plan.slug,
      },
    });
  }),
);

// Cancel subscription
router.post(
  "/cancel",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: "No active subscription found",
      });
      return;
    }

    try {
      const rz = getRazorpay();
      await (rz.subscriptions as any).cancel(subscription.razorpaySubId);
    } catch (e) {
      logger.warn("Razorpay cancel API error (continuing):", e);
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED" },
    });

    logger.info(
      `Subscription cancelled: ${subscription.razorpaySubId} for user ${user.id}`,
    );

    res.json({
      success: true,
      message: "Subscription cancelled. You'll remain on the current plan until the period ends.",
    });
  }),
);

// Razorpay webhook (no auth — uses signature verification)
router.post(
  "/webhook",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("RAZORPAY_WEBHOOK_SECRET not set");
      res.status(500).json({ error: "Webhook not configured" });
      return;
    }

    const signature = req.headers["x-razorpay-signature"] as string;
    if (!signature) {
      res.status(400).json({ error: "Missing signature" });
      return;
    }

    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSig !== signature) {
      logger.warn("Razorpay webhook signature mismatch");
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const event = req.body.event as string;
    const payload = req.body.payload;

    logger.info(`Razorpay webhook: ${event}`);

    if (
      event === "subscription.activated" ||
      event === "subscription.charged"
    ) {
      const rzSubId = payload?.subscription?.entity?.id;
      if (rzSubId) {
        const sub = await prisma.subscription.findUnique({
          where: { razorpaySubId: rzSubId },
        });
        if (sub) {
          const now = new Date();
          const periodEnd = new Date(now);
          if (sub.interval === "yearly") {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: "ACTIVE",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });

          // Reset monthly API calls on renewal
          await prisma.user.update({
            where: { id: sub.userId },
            data: { apiCallsUsed: 0, apiCallsResetAt: periodEnd },
          });

          logger.info(`Subscription ${rzSubId} activated/renewed via webhook`);
        }
      }
    } else if (
      event === "subscription.halted" ||
      event === "subscription.cancelled"
    ) {
      const rzSubId = payload?.subscription?.entity?.id;
      if (rzSubId) {
        const status = event === "subscription.halted" ? "HALTED" : "CANCELLED";
        await prisma.subscription.updateMany({
          where: { razorpaySubId: rzSubId },
          data: { status },
        });
        logger.info(`Subscription ${rzSubId} ${status.toLowerCase()} via webhook`);
      }
    }

    res.json({ success: true });
  }),
);

export default router;
