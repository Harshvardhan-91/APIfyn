import express, { type Response } from "express";
import OpenAI from "openai";
import {
  type AuthenticatedRequest,
  authenticateFirebaseToken,
} from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { createLogger } from "../utils/logger";

const router = express.Router();
const logger = createLogger();

const SYSTEM_PROMPT = `You are a workflow builder for APIfyn, a workflow automation platform. Given a user's natural language description, generate a workflow definition.

AVAILABLE BLOCKS:

Triggers (exactly ONE required, must be the first block):
- github-trigger: Fires on GitHub repo events (push, pull_request, issues, release). Config: { repository: "owner/repo", eventType: "push" | "pull_request" | "issues" | "release" }
- stripe-trigger: Fires on Stripe webhook events. Config: { eventTypes: "payment_intent.succeeded" | "charge.failed" | "customer.subscription.created" }
- typeform-trigger: Fires on Typeform submission. Config: { formIdFilter: "optional-form-id" }
- webhook-trigger: Fires on any inbound HTTP POST. Config: {}
- razorpay-trigger: Fires on Razorpay payment events. Config: { eventTypes: "payment.captured" | "payment.failed" | "refund.created" | "subscription.activated" }

Actions:
- slack-send: Send a Slack message. Config: { channel: "#channel-name", message: "text with {{variables}}" }
- gmail-send: Send an email via SMTP. Config: { to: "email@example.com", subject: "Subject with {{variables}}", body: "Body with {{variables}}" }
- sheets-add: Add row to Google Sheets. Config: { spreadsheetUrl: "https://docs.google.com/spreadsheets/d/...", values: "{{field1}}, {{field2}}" }
- notion-create: Create a Notion database page. Config: { databaseId: "notion-db-id", title: "{{variable}}", content: "{{variable}}" }
- webhook-send: Send HTTP request. Config: { url: "https://...", method: "POST", body: "{{json}}" }
- discord-send: Send Discord message. Config: { webhookUrl: "https://discord.com/api/webhooks/...", message: "text with {{variables}}" }
- whatsapp-send: Send WhatsApp message via MSG91. Config: { to: "{{customer.phone}}", templateId: "template-id", variables: "{{var1}}, {{var2}}" }
- openai-action: Call OpenAI chat completion. Config: { useOpenaiAccountKey: true, model: "gpt-4o-mini", systemPrompt: "...", userMessage: "Summarize: {{field}}" } — do not put API keys in config; user sets them in the product UI

Conditions:
- if-condition: Conditional branch. Config: { field: "fieldName", operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than", value: "compareValue" }
- filter: Stop workflow if condition is false. Config: { field: "fieldName", operator: "equals" | "contains", value: "compareValue" }

Utilities:
- delay: Wait before next step. Config: { duration: "5000" } (milliseconds, max 300000)
- formatter: Transform data. Config: { operation: "template" | "json_stringify" | "uppercase" | "lowercase", template: "{{variable}} text" }
- code: Run custom JavaScript. Config: { code: "return { result: input.field }" }
- logger: Log data for debugging. Config: { label: "Step name" }

RULES:
1. Always include exactly one trigger block as the first block.
2. Position blocks left-to-right: first at x:100, then x:400, x:700, etc. y:200 for all.
3. Connect blocks in logical order using connections array.
4. Use template variables like {{event.field}} in config values to reference data from previous steps.
5. Generate a descriptive workflow name.
6. Common variable patterns:
   - GitHub: {{sender.login}}, {{repository.full_name}}, {{commit.message}}, {{pull_request.title}}
   - Stripe: {{payment.amount}}, {{payment.currency}}, {{customer.email}}
   - Razorpay: {{payment.amount}}, {{payment.currency}}, {{customer.contact}}, {{customer.email}}
   - Typeform: {{form.title}}, {{answers}}, {{respondent.email}}

RESPONSE FORMAT (JSON only, no markdown):
{
  "name": "Workflow Name",
  "blocks": [
    {
      "id": "block-1",
      "type": "github-trigger",
      "name": "GitHub Push",
      "description": "Triggers on push events",
      "position": { "x": 100, "y": 200 },
      "config": { "eventType": "push" }
    }
  ],
  "connections": [
    { "id": "conn-1", "from": "block-1", "to": "block-2" }
  ]
}`;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

router.post(
  "/generate",
  authenticateFirebaseToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Please provide a longer description of your workflow.",
      });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({
        success: false,
        error: "AI generation is not configured. Please add OPENAI_API_KEY.",
      });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt.trim() },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({
          success: false,
          error: "AI returned an empty response. Try rephrasing your request.",
        });
      }

      const definition = JSON.parse(content);

      if (!definition.blocks || !Array.isArray(definition.blocks) || definition.blocks.length === 0) {
        return res.status(422).json({
          success: false,
          error: "Could not understand the workflow. Try being more specific about the trigger and actions.",
        });
      }

      logger.info(`AI generated workflow "${definition.name}" with ${definition.blocks.length} blocks for user ${req.user.id}`);

      return res.json({
        success: true,
        definition: {
          name: definition.name || "AI Generated Workflow",
          blocks: definition.blocks,
          connections: definition.connections || [],
        },
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
        },
      });
    } catch (error: any) {
      if (error?.status === 429) {
        return res.status(429).json({
          success: false,
          error: "AI rate limit reached. Please try again in a moment.",
        });
      }
      logger.error("AI generation error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to generate workflow. Please try again.",
      });
    }
  }),
);

export default router;
