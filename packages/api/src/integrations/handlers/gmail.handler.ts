import nodemailer from "nodemailer";
import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";
import { fillTemplate } from "../template";

const logger = createLogger();

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || "587");

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(subject: string, body: string, ctx: BlockContext): string {
  const prev = ctx.previousOutput;
  const eventType = String(prev.event_type ?? "workflow");
  const repo = String(prev.repository_name ?? prev.repository ?? "");
  const branch = String(prev.branch_name ?? prev.branch ?? "");
  const author = String(prev.author_name ?? prev.author ?? "");
  const commitMsg = String(prev.commit_message ?? "");
  const commitUrl = String(prev.commit_url ?? prev.compare_url ?? "");
  const prUrl = String(prev.pr_url ?? "");
  const prTitle = String(prev.pr_title ?? "");
  const prNumber = String(prev.pr_number ?? "");

  const lines = body.split("\n").map((l) => escapeHtml(l)).join("<br>");

  const eventLabel =
    eventType === "pull_request" ? "Pull Request"
    : eventType === "push" ? "Push"
    : eventType === "issues" ? "Issue"
    : eventType === "release" ? "Release"
    : eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const eventColor =
    eventType === "pull_request" ? "#8b5cf6"
    : eventType === "push" ? "#2563eb"
    : eventType === "issues" ? "#f59e0b"
    : eventType === "release" ? "#10b981"
    : "#6b7280";

  const actionUrl = prUrl || commitUrl || "";
  const appUrl = process.env.ALLOWED_ORIGINS || "http://localhost:3000";
  const logoUrl = `${appUrl}/logo.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#18181b;border-radius:12px 12px 0 0;padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <img src="${logoUrl}" alt="APIfyn" width="28" height="28" style="display:inline-block;width:28px;height:28px;border-radius:7px;margin-right:10px;vertical-align:middle;" />
                <span style="font-size:18px;font-weight:700;color:#ffffff;vertical-align:middle;letter-spacing:-0.3px;">APIfyn</span>
              </td>
              <td align="right">
                <span style="display:inline-block;background:${eventColor};color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(eventLabel)}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;">
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#18181b;line-height:1.3;">${escapeHtml(subject)}</h1>

          ${repo ? `<p style="margin:0 0 24px;font-size:13px;color:#71717a;">
            ${escapeHtml(repo)}${branch ? ` &middot; <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:12px;">${escapeHtml(branch)}</code>` : ""}
          </p>` : ""}

          <div style="font-size:14px;color:#3f3f46;line-height:1.7;">
            ${lines}
          </div>

          ${(commitMsg || prTitle) ? `
          <!-- Details card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;">
            <tr><td style="padding:16px 20px;">
              ${prTitle ? `
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Pull Request #${escapeHtml(prNumber)}</p>
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#18181b;">${escapeHtml(prTitle)}</p>
              ` : ""}
              ${commitMsg && !prTitle ? `
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">Latest Commit</p>
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#18181b;">${escapeHtml(commitMsg)}</p>
              ` : ""}
              ${author ? `<p style="margin:0;font-size:12px;color:#71717a;">by ${escapeHtml(author)}</p>` : ""}
            </td></tr>
          </table>
          ` : ""}

          ${actionUrl ? `
          <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr><td style="background:#18181b;border-radius:8px;">
              <a href="${escapeHtml(actionUrl)}" target="_blank" style="display:inline-block;padding:10px 24px;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">View on GitHub &rarr;</a>
            </td></tr>
          </table>
          ` : ""}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#fafafa;border-top:1px solid #e4e4e7;border-radius:0 0 12px 12px;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:11px;color:#a1a1aa;">
                Sent by <strong style="color:#71717a;">APIfyn</strong> &middot; Workflow automation
              </td>
              <td align="right" style="font-size:11px;color:#a1a1aa;">
                ${new Date().toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export class GmailTriggerHandler implements IntegrationHandler {
  blockId = "gmail-trigger";

  async execute(
    _config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    return {
      success: true,
      output: {
        from: String((ctx.triggerPayload as Record<string, unknown>).from ?? ""),
        subject: String((ctx.triggerPayload as Record<string, unknown>).subject ?? ""),
        body: String((ctx.triggerPayload as Record<string, unknown>).body ?? ""),
        date: String((ctx.triggerPayload as Record<string, unknown>).date ?? ""),
        ...ctx.triggerPayload,
      },
    };
  }
}

export class GmailSendHandler implements IntegrationHandler {
  blockId = "gmail-send";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const to = config.to as string | undefined;
    if (!to) {
      return { success: false, output: {}, error: "Recipient email (to) is required" };
    }

    const transporter = getTransporter();
    if (!transporter) {
      return {
        success: false,
        output: {},
        error: "SMTP not configured. Set SMTP_USER and SMTP_PASS in .env (use a Gmail App Password).",
      };
    }

    const subject = fillTemplate((config.subject as string) || "Workflow notification", ctx);
    const body = fillTemplate((config.body as string) || "", ctx);
    const replyTo = config.replyTo as string | undefined;
    const html = buildHtml(subject, body, ctx);

    try {
      const info = await transporter.sendMail({
        from: `APIfyn <${process.env.SMTP_USER}>`,
        to: fillTemplate(to, ctx),
        replyTo,
        subject,
        text: body,
        html,
      });

      logger.info(`Email sent to ${to}: ${info.messageId}`);

      return {
        success: true,
        output: {
          messageId: info.messageId,
          to,
          subject,
          accepted: info.accepted,
        },
      };
    } catch (err) {
      logger.error("Failed to send email:", err);
      return {
        success: false,
        output: {},
        error: err instanceof Error ? err.message : "Failed to send email",
      };
    }
  }
}

IntegrationRegistry.register(new GmailTriggerHandler());
IntegrationRegistry.register(new GmailSendHandler());
