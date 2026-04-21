import crypto from "node:crypto";
import express, { type Request, type Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { WebhookService } from "../services/webhook.service";
import { createLogger } from "../utils/logger";

const router = express.Router();
const logger = createLogger();

function verifyGitHubSignature(
  payload: Buffer | string,
  signature: string | undefined,
): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(typeof payload === "string" ? payload : payload);
  const expected = `sha256=${hmac.digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

router.post(
  "/github/:workflowId",
  asyncHandler(async (req: Request, res: Response) => {
    const { workflowId } = req.params;

    if (!workflowId) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    if (process.env.GITHUB_WEBHOOK_SECRET && !verifyGitHubSignature(JSON.stringify(req.body), signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    try {
      const githubEvent = req.headers["x-github-event"] as string | undefined;
      const payload = { ...req.body };
      if (githubEvent && !payload._githubEvent) {
        payload._githubEvent = githubEvent;
      }

      const executionId = await WebhookService.enqueueWorkflow(
        workflowId,
        "github-trigger",
        payload,
      );

      return res.status(202).json({
        success: true,
        message: "Webhook accepted",
        executionId,
      });
    } catch (error) {
      logger.error(`GitHub webhook error for ${workflowId}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to process webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
);

// Stripe webhook route for workflow triggers
router.post(
  "/stripe/:workflowId",
  asyncHandler(async (req: Request, res: Response) => {
    const { workflowId } = req.params;

    if (!workflowId) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    const sig = req.headers["stripe-signature"] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && sig) {
      try {
        const crypto = await import("node:crypto");
        const parts: Record<string, string> = {};
        for (const part of sig.split(",")) {
          const idx = part.indexOf("=");
          if (idx > 0) {
            parts[part.slice(0, idx)] = part.slice(idx + 1);
          }
        }
        const signedPayload = `${parts.t}.${JSON.stringify(req.body)}`;
        const expected = crypto
          .createHmac("sha256", webhookSecret)
          .update(signedPayload)
          .digest("hex");
        if (parts.v1 !== expected) {
          logger.warn(`Invalid Stripe signature for workflow ${workflowId}`);
        }
      } catch {
        logger.warn("Stripe signature verification skipped");
      }
    }

    try {
      const executionId = await WebhookService.enqueueWorkflow(
        workflowId,
        "stripe-trigger",
        req.body,
      );

      return res.status(202).json({
        success: true,
        message: "Stripe webhook accepted",
        executionId,
      });
    } catch (error) {
      logger.error(`Stripe webhook error for ${workflowId}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to process Stripe webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
);

// Typeform webhook route
router.post(
  "/typeform/:workflowId",
  asyncHandler(async (req: Request, res: Response) => {
    const { workflowId } = req.params;

    if (!workflowId) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    try {
      const executionId = await WebhookService.enqueueWorkflow(
        workflowId,
        "typeform-trigger",
        req.body,
      );

      return res.status(202).json({
        success: true,
        message: "Typeform webhook accepted",
        executionId,
      });
    } catch (error) {
      logger.error(`Typeform webhook error for ${workflowId}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to process Typeform webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
);

router.post(
  "/inbound/:workflowId",
  asyncHandler(async (req: Request, res: Response) => {
    const { workflowId } = req.params;

    if (!workflowId) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    try {
      const executionId = await WebhookService.enqueueWorkflow(
        workflowId,
        "webhook-trigger",
        req.body,
      );

      return res.status(202).json({
        success: true,
        message: "Webhook accepted",
        executionId,
      });
    } catch (error) {
      logger.error(`Inbound webhook error for ${workflowId}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to process webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
);

router.post(
  "/test/:workflowId",
  asyncHandler(async (req: Request, res: Response) => {
    const { workflowId } = req.params;

    if (!workflowId) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    const testPayload = {
      repository: {
        id: 123456,
        name: "test-repo",
        full_name: "user/test-repo",
        html_url: "https://github.com/user/test-repo",
      },
      pusher: { name: "Test User", email: "test@example.com" },
      head_commit: {
        id: "abc123def456",
        message: "Test commit message",
        author: { name: "Test User", email: "test@example.com" },
        url: "https://github.com/user/test-repo/commit/abc123def456",
        timestamp: new Date().toISOString(),
      },
      commits: [
        {
          id: "abc123def456",
          message: "Test commit message",
          author: { name: "Test User", email: "test@example.com" },
          url: "https://github.com/user/test-repo/commit/abc123def456",
        },
      ],
      ref: "refs/heads/main",
      before: "def456abc789",
      after: "abc123def456",
      compare:
        "https://github.com/user/test-repo/compare/def456abc789...abc123def456",
    };

    try {
      const executionId = await WebhookService.enqueueWorkflow(
        workflowId,
        "github-trigger",
        testPayload,
      );

      return res.status(202).json({
        success: true,
        message: "Test webhook accepted",
        executionId,
        payload: testPayload,
      });
    } catch (error) {
      logger.error(`Test webhook error for ${workflowId}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to process test webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
);

export default router;
