import nodemailer from "nodemailer";
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

function sendWelcomeEmail(email: string, name: string) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || "587");

  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const firstName = (name || "there").split(" ")[0];
  const appUrl = process.env.ALLOWED_ORIGINS || "http://localhost:3000";
  const logoUrl = `${appUrl}/logo.png`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="background:#18181b;border-radius:12px 12px 0 0;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <img src="${logoUrl}" alt="APIfyn" width="28" height="28" style="display:inline-block;width:28px;height:28px;border-radius:7px;margin-right:10px;vertical-align:middle;" />
                <span style="font-size:18px;font-weight:700;color:#ffffff;vertical-align:middle;letter-spacing:-0.3px;">APIfyn</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="background:#ffffff;padding:36px 32px;">
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#18181b;line-height:1.3;">
            Welcome to APIfyn, ${firstName}
          </h1>
          <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.7;">
            Your account is ready. APIfyn lets you connect your tools and automate workflows without writing code.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.7;">
            Here's how to get started:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:12px 16px;background:#fafafa;border:1px solid #e4e4e7;border-radius:10px 10px 0 0;border-bottom:none;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:24px;font-size:13px;font-weight:700;color:#18181b;">1.</td>
                <td style="font-size:14px;color:#3f3f46;"><strong style="color:#18181b;">Connect your apps</strong> &mdash; GitHub, Slack, Discord, Notion, and more</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:12px 16px;background:#fafafa;border:1px solid #e4e4e7;border-bottom:none;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:24px;font-size:13px;font-weight:700;color:#18181b;">2.</td>
                <td style="font-size:14px;color:#3f3f46;"><strong style="color:#18181b;">Build a workflow</strong> &mdash; drag triggers and actions onto the visual builder</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:12px 16px;background:#fafafa;border:1px solid #e4e4e7;border-radius:0 0 10px 10px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:24px;font-size:13px;font-weight:700;color:#18181b;">3.</td>
                <td style="font-size:14px;color:#3f3f46;"><strong style="color:#18181b;">Activate and relax</strong> &mdash; events fire, actions run, logs stream in real time</td>
              </tr></table>
            </td></tr>
          </table>

          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#18181b;border-radius:8px;">
              <a href="${appUrl}/dashboard" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Go to Dashboard</a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
            Your free plan includes 2 workflows and 100 API calls per month. Need more? You can upgrade anytime from your settings.
          </p>
        </td></tr>

        <tr><td style="background:#fafafa;border-top:1px solid #e4e4e7;border-radius:0 0 12px 12px;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:11px;color:#a1a1aa;">
                Sent by <strong style="color:#71717a;">APIfyn</strong> &middot; Workflow automation
              </td>
              <td align="right" style="font-size:11px;color:#a1a1aa;">
                ${new Date().toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  transporter
    .sendMail({
      from: `APIfyn <${user}>`,
      to: email,
      subject: `Welcome to APIfyn, ${firstName}`,
      text: `Welcome to APIfyn, ${firstName}!\n\nYour account is ready. Head to ${appUrl}/dashboard to create your first workflow.\n\nFree plan: 2 workflows, 100 API calls/month.`,
      html,
    })
    .then(() => logger.info(`Welcome email sent to ${email}`))
    .catch((err) => logger.error(`Failed to send welcome email to ${email}:`, err));
}

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
        sendWelcomeEmail(user.email, user.displayName ?? "");
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
