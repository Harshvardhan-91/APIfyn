export type TemplateBlock = {
  id: string;
  type: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  config: Record<string, string | string[]>;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  apps: string[];
  category: string;
  blocks: TemplateBlock[];
  connections: Array<{ id: string; from: string; to: string }>;
};

export const templateDefinitions: TemplateDefinition[] = [
  {
    id: "github-slack-template",
    name: "GitHub to Slack",
    description:
      "Get instant Slack notifications when code is pushed to your repositories.",
    apps: ["github", "slack"],
    category: "Developer",
    blocks: [
      {
        id: "tpl-gh-trigger",
        type: "github-trigger",
        name: "GitHub Push",
        description: "Triggers on push events",
        position: { x: 100, y: 200 },
        config: { eventTypes: ["push"] },
      },
      {
        id: "tpl-slack-msg",
        type: "slack-send",
        name: "Notify Slack",
        description: "Send push notification to Slack",
        position: { x: 450, y: 200 },
        config: {
          messageTemplate:
            "New push to *{{repository_name}}* by {{author_name}} on `{{branch_name}}`\n> {{commit_message}}",
        },
      },
    ],
    connections: [
      { id: "tpl-conn-1", from: "tpl-gh-trigger", to: "tpl-slack-msg" },
    ],
  },
  {
    id: "stripe-notion-template",
    name: "Stripe to Notion",
    description:
      "Automatically log every payment event as a page in your Notion database.",
    apps: ["stripe", "notion"],
    category: "Finance",
    blocks: [
      {
        id: "tpl-stripe-trigger",
        type: "stripe-trigger",
        name: "Stripe Payment",
        description: "Triggers on payment events",
        position: { x: 100, y: 200 },
        config: { eventTypes: ["payment_intent.succeeded"] },
      },
      {
        id: "tpl-notion-log",
        type: "notion-create",
        name: "Log to Notion",
        description: "Create a page in Notion database",
        position: { x: 450, y: 200 },
        config: {
          title: "Payment {{payment_id}} — {{currency}} {{amount}}",
          content:
            "Customer: {{customer_email}}\nAmount: {{currency}} {{amount}}\nStatus: {{status}}",
          status: "Completed",
          tags: "stripe, payment",
        },
      },
    ],
    connections: [
      {
        id: "tpl-conn-2",
        from: "tpl-stripe-trigger",
        to: "tpl-notion-log",
      },
    ],
  },
  {
    id: "gmail-sheets-template",
    name: "Gmail to Sheets",
    description:
      "Log workflow events to Google Sheets and send email notifications.",
    apps: ["gmail", "sheets"],
    category: "Productivity",
    blocks: [
      {
        id: "tpl-webhook-in",
        type: "webhook-trigger",
        name: "Incoming Data",
        description: "Receives data via webhook",
        position: { x: 100, y: 200 },
        config: {},
      },
      {
        id: "tpl-sheets-log",
        type: "sheets-add",
        name: "Add to Sheets",
        description: "Append row to Google Sheets",
        position: { x: 450, y: 150 },
        config: {
          sheetName: "Sheet1",
          writeMode: "append",
          values: "{{payload.name}}, {{payload.email}}, {{payload.message}}",
        },
      },
      {
        id: "tpl-gmail-notify",
        type: "gmail-send",
        name: "Send Email",
        description: "Send notification email",
        position: { x: 450, y: 350 },
        config: {
          to: "{{payload.email}}",
          subject: "We received your submission",
          body: "Hi {{payload.name}},\n\nThank you for your submission. We'll get back to you soon.\n\nBest regards",
        },
      },
    ],
    connections: [
      { id: "tpl-conn-3a", from: "tpl-webhook-in", to: "tpl-sheets-log" },
      { id: "tpl-conn-3b", from: "tpl-webhook-in", to: "tpl-gmail-notify" },
    ],
  },
  {
    id: "github-discord-template",
    name: "GitHub to Discord",
    description:
      "Post real-time commit and PR updates to your Discord server channels.",
    apps: ["github", "discord"],
    category: "Developer",
    blocks: [
      {
        id: "tpl-gh-trigger-2",
        type: "github-trigger",
        name: "GitHub Events",
        description: "Triggers on push and PR events",
        position: { x: 100, y: 200 },
        config: { eventTypes: ["push", "pull_request"] },
      },
      {
        id: "tpl-discord-msg",
        type: "discord-send",
        name: "Post to Discord",
        description: "Send update to Discord channel",
        position: { x: 450, y: 200 },
        config: {
          message:
            "**{{repository_name}}** — {{event_type}}\nBy: {{author_name}}\n{{commit_message}}",
          botName: "APIfyn Bot",
        },
      },
    ],
    connections: [
      { id: "tpl-conn-4", from: "tpl-gh-trigger-2", to: "tpl-discord-msg" },
    ],
  },
  {
    id: "typeform-slack-template",
    name: "Typeform to Slack",
    description:
      "Notify your team on Slack whenever a new Typeform response is submitted.",
    apps: ["typeform", "slack"],
    category: "Forms",
    blocks: [
      {
        id: "tpl-typeform-trigger",
        type: "typeform-trigger",
        name: "Form Submission",
        description: "Triggers on new Typeform response",
        position: { x: 100, y: 200 },
        config: {},
      },
      {
        id: "tpl-slack-notify",
        type: "slack-send",
        name: "Notify Team",
        description: "Send form response to Slack",
        position: { x: 450, y: 200 },
        config: {
          messageTemplate:
            "New Typeform response received\nForm: *{{form_title}}*\nResponse ID: {{response_id}}\nSubmitted: {{submitted_at}}",
        },
      },
    ],
    connections: [
      {
        id: "tpl-conn-5",
        from: "tpl-typeform-trigger",
        to: "tpl-slack-notify",
      },
    ],
  },
  {
    id: "stripe-gmail-template",
    name: "Stripe to Gmail",
    description:
      "Send a custom follow-up email after every successful Stripe payment.",
    apps: ["stripe", "gmail"],
    category: "Finance",
    blocks: [
      {
        id: "tpl-stripe-trigger-2",
        type: "stripe-trigger",
        name: "Payment Received",
        description: "Triggers on successful payment",
        position: { x: 100, y: 200 },
        config: { eventTypes: ["payment_intent.succeeded"] },
      },
      {
        id: "tpl-gmail-receipt",
        type: "gmail-send",
        name: "Send Receipt",
        description: "Email payment receipt to customer",
        position: { x: 450, y: 200 },
        config: {
          to: "{{customer_email}}",
          subject: "Payment Received — {{currency}} {{amount}}",
          body: "Hi {{customer_name}},\n\nWe've received your payment of {{currency}} {{amount}}.\n\nPayment ID: {{payment_id}}\nStatus: {{status}}\n\nThank you for your business!",
        },
      },
    ],
    connections: [
      {
        id: "tpl-conn-6",
        from: "tpl-stripe-trigger-2",
        to: "tpl-gmail-receipt",
      },
    ],
  },
  {
    id: "razorpay-whatsapp-template",
    name: "Razorpay to WhatsApp",
    description:
      "Send WhatsApp payment confirmations when Razorpay payments succeed.",
    apps: ["razorpay", "whatsapp"],
    category: "India",
    blocks: [
      {
        id: "tpl-rzp-trigger",
        type: "razorpay-trigger",
        name: "Razorpay Payment",
        description: "Triggers on payment captured",
        position: { x: 100, y: 200 },
        config: { eventTypes: ["payment.captured"] },
      },
      {
        id: "tpl-wa-confirm",
        type: "whatsapp-send",
        name: "WhatsApp Confirmation",
        description: "Send payment confirmation via WhatsApp",
        position: { x: 450, y: 200 },
        config: {
          to: "{{customer_contact}}",
          variables: "{{customer_name}}, {{amount}}, {{payment_id}}",
        },
      },
    ],
    connections: [
      { id: "tpl-conn-7", from: "tpl-rzp-trigger", to: "tpl-wa-confirm" },
    ],
  },
  {
    id: "github-slack-notion-template",
    name: "GitHub to Slack + Notion",
    description:
      "Get Slack notifications and auto-log commits to Notion on every push.",
    apps: ["github", "slack", "notion"],
    category: "Developer",
    blocks: [
      {
        id: "tpl-gh-trigger-3",
        type: "github-trigger",
        name: "GitHub Push",
        description: "Triggers on push events",
        position: { x: 100, y: 250 },
        config: { eventTypes: ["push"] },
      },
      {
        id: "tpl-slack-alert",
        type: "slack-send",
        name: "Slack Alert",
        description: "Notify team on Slack",
        position: { x: 450, y: 150 },
        config: {
          messageTemplate:
            "New push to *{{repository_name}}* on `{{branch_name}}` by {{author_name}}",
        },
      },
      {
        id: "tpl-notion-entry",
        type: "notion-create",
        name: "Log to Notion",
        description: "Create commit log entry",
        position: { x: 450, y: 350 },
        config: {
          title: "{{repository_name}} — {{branch_name}}",
          content:
            "Author: {{author_name}}\nMessage: {{commit_message}}\nCommits: {{commits_count}}",
          tags: "github, commits",
        },
      },
    ],
    connections: [
      { id: "tpl-conn-8a", from: "tpl-gh-trigger-3", to: "tpl-slack-alert" },
      {
        id: "tpl-conn-8b",
        from: "tpl-gh-trigger-3",
        to: "tpl-notion-entry",
      },
    ],
  },
];

export function getTemplateById(
  id: string,
): TemplateDefinition | undefined {
  return templateDefinitions.find((t) => t.id === id);
}
