import type { Integration } from "@prisma/client";
import express, { type Request, type Response } from "express";
import { prisma } from "../db";
import {
  type AuthenticatedRequest,
  authenticateToken,
} from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { OAuthService } from "../services/oauth.service";
import { createLogger } from "../utils/logger";

const router = express.Router();
const logger = createLogger();

// Get integration status for user
router.get(
  "/status",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    try {
      // Get user's integrations from database
      const userIntegrations = await prisma.integration.findMany({
        where: {
          userId: user.id,
        },
      });

      const integrations = {
        github: {
          connected: userIntegrations.some(
            (i: Integration) => i.type === "GITHUB" && i.accessToken,
          ),
          user:
            userIntegrations.find((i: Integration) => i.type === "GITHUB")
              ?.config || null,
          loading: false,
        },
        slack: {
          connected: userIntegrations.some(
            (i: Integration) => i.type === "SLACK" && i.accessToken,
          ),
          workspaces:
            userIntegrations
              .filter((i: Integration) => i.type === "SLACK" && i.accessToken)
              .map((i: Integration) => i.config) || [],
          loading: false,
        },
        google: {
          connected: userIntegrations.some(
            (i: Integration) => i.type === "GOOGLE_SHEETS" && (i.accessToken || i.refreshToken),
          ),
          loading: false,
        },
        notion: {
          connected: userIntegrations.some(
            (i: Integration) => i.type === "NOTION" && i.accessToken,
          ),
          config:
            userIntegrations.find((i: Integration) => i.type === "NOTION")
              ?.config || null,
          loading: false,
        },
      };

      res.json({
        success: true,
        integrations,
      });
    } catch (error) {
      logger.error("Error fetching integration status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch integration status",
      });
    }
  }),
);

// GitHub OAuth Routes
router.post(
  "/github/auth",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUrl = OAuthService.generateGitHubAuthUrl(req.user.id);
      res.json({
        success: true,
        authUrl,
      });
    } catch (error) {
      logger.error("GitHub auth error:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to initiate GitHub authentication",
      });
    }
  }),
);

router.get(
  "/github/callback",
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: "Missing code or state parameter",
      });
    }

    try {
      const [userId] = (state as string).split("_");

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const tokenData = await OAuthService.exchangeGitHubCode(code as string);

      // Get user info from GitHub
      const userData = await OAuthService.getGitHubUser(tokenData.access_token);

      // Save integration
      await OAuthService.saveGitHubIntegration(user.id, tokenData, userData);

      return res.type("html").send(
        `<html><body><script>
          try { if (window.opener) window.opener.postMessage({ type: 'github_auth_success' }, '*'); } catch(e) {}
          window.close();
        </script><p>Connected! You can close this window.</p></body></html>`,
      );
    } catch (error) {
      logger.error("GitHub OAuth callback error:", error);
      const msg = error instanceof Error ? error.message.replace(/'/g, "\\'") : "Unknown error";
      return res.type("html").send(
        `<html><body><script>
          try { if (window.opener) window.opener.postMessage({ type: 'github_auth_error', error: '${msg}' }, '*'); } catch(e) {}
          window.close();
        </script><p>Error: ${msg}. You can close this window.</p></body></html>`,
      );
    }
  }),
);

router.get(
  "/github/repositories",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    try {
      const integration = await prisma.integration.findFirst({
        where: {
          userId: user.id,
          type: "GITHUB",
        },
      });

      if (!integration || !integration.accessToken) {
        return res.status(401).json({
          success: false,
          message: "GitHub not connected",
        });
      }

      const repositories = await OAuthService.getGitHubRepositories(
        integration.accessToken,
      );

      return res.json({
        success: true,
        repositories,
      });
    } catch (error) {
      logger.error("Error fetching GitHub repositories:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch repositories",
      });
    }
  }),
);

// Slack OAuth Routes
router.post(
  "/slack/auth",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUrl = OAuthService.generateSlackAuthUrl(req.user.id);
      res.json({
        success: true,
        authUrl,
      });
    } catch (error) {
      logger.error("Slack auth error:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to initiate Slack authentication",
      });
    }
  }),
);

router.get(
  "/slack/callback",
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: "Missing code or state parameter",
      });
    }

    try {
      const [userId] = (state as string).split("_");

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const tokenData = await OAuthService.exchangeSlackCode(code as string);

      // Save integration
      await OAuthService.saveSlackIntegration(user.id, tokenData);

      return res.type("html").send(
        `<html><body><script>
          try { if (window.opener) window.opener.postMessage({ type: 'slack_auth_success' }, '*'); } catch(e) {}
          window.close();
        </script><p>Connected! You can close this window.</p></body></html>`,
      );
    } catch (error) {
      logger.error("Slack OAuth callback error:", error);
      const msg = error instanceof Error ? error.message.replace(/'/g, "\\'") : "Unknown error";
      return res.type("html").send(
        `<html><body><script>
          try { if (window.opener) window.opener.postMessage({ type: 'slack_auth_error', error: '${msg}' }, '*'); } catch(e) {}
          window.close();
        </script><p>Error: ${msg}. You can close this window.</p></body></html>`,
      );
    }
  }),
);

router.get(
  "/slack/channels",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    try {
      const integration = await prisma.integration.findFirst({
        where: {
          userId: user.id,
          type: "SLACK",
        },
      });

      if (!integration || !integration.accessToken) {
        return res.status(401).json({
          success: false,
          message: "Slack not connected",
        });
      }

      const channels = await OAuthService.getSlackChannels(
        integration.accessToken,
      );

      return res.json({
        success: true,
        channels,
      });
    } catch (error) {
      logger.error("Error fetching Slack channels:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch channels",
      });
    }
  }),
);

// ─── Google OAuth (Sheets + Calendar) ─────────────────────────

router.post(
  "/google/auth",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUrl = OAuthService.generateGoogleAuthUrl(req.user.id);
      res.json({ success: true, authUrl });
    } catch (error) {
      logger.error("Google auth error:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to initiate Google authentication",
      });
    }
  }),
);

router.get(
  "/google/callback",
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ success: false, message: "Missing code or state" });
    }

    try {
      const [userId] = (state as string).split("_");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const tokens = await OAuthService.exchangeGoogleCode(code as string);
      await OAuthService.saveGoogleIntegration(user.id, tokens);

      return res.type("html").send(
        `<html><body><script>
          try { if (window.opener) window.opener.postMessage({ type: 'google_auth_success' }, '*'); } catch(e) {}
          window.close();
        </script><p>Connected! You can close this window.</p></body></html>`,
      );
    } catch (error) {
      logger.error("Google OAuth callback error:", error);
      const msg = error instanceof Error ? error.message.replace(/'/g, "\\'") : "Unknown error";
      return res.type("html").send(
        `<html><body><script>
          try { if (window.opener) window.opener.postMessage({ type: 'google_auth_error', error: '${msg}' }, '*'); } catch(e) {}
          window.close();
        </script><p>Error: ${msg}. You can close this window.</p></body></html>`,
      );
    }
  }),
);

// ─── Notion OAuth ─────────────────────────────────────────────

router.post(
  "/notion/auth",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUrl = OAuthService.generateNotionAuthUrl(req.user.id);
      res.json({ success: true, authUrl });
    } catch (error) {
      logger.error("Notion auth error:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to initiate Notion authentication",
      });
    }
  }),
);

router.get(
  "/notion/callback",
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ success: false, message: "Missing code or state" });
    }

    try {
      const [userId] = (state as string).split("_");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const tokens = await OAuthService.exchangeNotionCode(code as string);
      await OAuthService.saveNotionIntegration(user.id, tokens);

      return res.type("html").send(
        `<html><body><script>
          try { if (window.opener) window.opener.postMessage({ type: 'notion_auth_success' }, '*'); } catch(e) {}
          window.close();
        </script><p>Connected! You can close this window.</p></body></html>`,
      );
    } catch (error) {
      logger.error("Notion OAuth callback error:", error);
      const msg = error instanceof Error ? error.message.replace(/'/g, "\\'") : "Unknown error";
      return res.type("html").send(
        `<html><body><script>
          try { if (window.opener) window.opener.postMessage({ type: 'notion_auth_error', error: '${msg}' }, '*'); } catch(e) {}
          window.close();
        </script><p>Error: ${msg}. You can close this window.</p></body></html>`,
      );
    }
  }),
);

// Disconnect integration
router.delete(
  "/:provider/disconnect",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { provider } = req.params;

    try {
      const integrationTypes: Record<string, string> = {
        github: "GITHUB",
        slack: "SLACK",
        google: "GOOGLE_SHEETS",
        notion: "NOTION",
      };

      const integrationType =
        integrationTypes[provider as keyof typeof integrationTypes];
      if (!integrationType) {
        return res.status(400).json({
          success: false,
          message: "Invalid integration provider",
        });
      }

      await prisma.integration.deleteMany({
        where: {
          userId: user.id,
          type: integrationType as any,
        },
      });

      return res.json({
        success: true,
        message: `${provider} integration disconnected successfully`,
      });
    } catch (error) {
      logger.error(`Error disconnecting ${provider} integration:`, error);
      return res.status(500).json({
        success: false,
        message: `Failed to disconnect ${provider} integration`,
      });
    }
  }),
);

export default router;
