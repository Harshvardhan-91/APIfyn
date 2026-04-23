import {
  DiscordIcon,
  GitHubIcon,
  GmailIcon,
  GoogleSheetsIcon,
  NotionIcon,
  OpenAIIcon,
  RazorpayIcon,
  SlackIcon,
  StripeIcon,
  TypeformIcon,
  WebhookIcon,
  WhatsAppIcon,
} from "@/components/icons/brand-icons";
import { Clock, Code, Database, Filter, GitBranch, Zap } from "lucide-react";
import type { BuilderBlockDefinition } from "./types";

export const triggerBlocks: BuilderBlockDefinition[] = [
  {
    id: "github-trigger",
    name: "GitHub Events",
    description: "Triggered by repository push and pull request events.",
    category: "Developer Tools",
    integrationRequired: true,
    icon: GitHubIcon,
  },
  {
    id: "stripe-trigger",
    name: "Stripe Payment",
    description: "Triggered by Stripe payment and subscription events.",
    category: "Payments",
    integrationRequired: false,
    icon: StripeIcon,
  },
  {
    id: "typeform-trigger",
    name: "Typeform Submission",
    description: "Triggered when a new form is submitted.",
    category: "Forms",
    integrationRequired: false,
    icon: TypeformIcon,
  },
  {
    id: "razorpay-trigger",
    name: "Razorpay Payment",
    description: "Triggered by Razorpay payment and subscription events.",
    category: "Payments",
    integrationRequired: false,
    icon: RazorpayIcon,
  },
  {
    id: "webhook-trigger",
    name: "Webhook",
    description: "Triggered when a webhook receives data.",
    category: "API",
    integrationRequired: false,
    icon: WebhookIcon,
  },
];

export const actionBlocks: BuilderBlockDefinition[] = [
  {
    id: "slack-send",
    name: "Send Slack Message",
    description: "Send a formatted message to a Slack channel.",
    category: "Communication",
    integrationRequired: true,
    icon: SlackIcon,
  },
  {
    id: "gmail-send",
    name: "Send Email",
    description: "Send a branded email notification via SMTP.",
    category: "Email",
    integrationRequired: false,
    icon: GmailIcon,
  },
  {
    id: "sheets-add",
    name: "Add to Google Sheets",
    description: "Add a row to Google Sheets.",
    category: "Productivity",
    integrationRequired: true,
    icon: GoogleSheetsIcon,
  },
  {
    id: "notion-create",
    name: "Create Notion Page",
    description: "Create a new page in a Notion database.",
    category: "Productivity",
    integrationRequired: true,
    icon: NotionIcon,
  },
  {
    id: "webhook-send",
    name: "Send Webhook",
    description: "Send data to an external webhook URL.",
    category: "API",
    integrationRequired: false,
    icon: WebhookIcon,
  },
  {
    id: "discord-send",
    name: "Send Discord Message",
    description: "Send a message to a Discord channel.",
    category: "Communication",
    integrationRequired: true,
    icon: DiscordIcon,
  },
  {
    id: "whatsapp-send",
    name: "Send WhatsApp Message",
    description: "Send a WhatsApp template message via MSG91.",
    category: "Communication",
    integrationRequired: false,
    icon: WhatsAppIcon,
  },
  {
    id: "openai-action",
    name: "OpenAI",
    description:
      "Run a chat completion; uses your key from Settings or a per-workflow key.",
    category: "AI",
    integrationRequired: false,
    icon: OpenAIIcon,
  },
];

export const conditionBlocks: BuilderBlockDefinition[] = [
  {
    id: "if-condition",
    name: "If/Then",
    description: "Add conditional logic to route a workflow.",
    category: "Logic",
    integrationRequired: false,
    icon: GitBranch,
  },
  {
    id: "filter",
    name: "Filter",
    description: "Continue only when incoming data matches rules.",
    category: "Logic",
    integrationRequired: false,
    icon: Filter,
  },
  {
    id: "switch",
    name: "Switch",
    description: "Route data across multiple branches.",
    category: "Logic",
    integrationRequired: false,
    icon: Zap,
  },
];

export const utilityBlocks: BuilderBlockDefinition[] = [
  {
    id: "delay",
    name: "Delay",
    description: "Wait before running the next action.",
    category: "Utilities",
    integrationRequired: false,
    icon: Clock,
  },
  {
    id: "formatter",
    name: "Format Data",
    description: "Transform and normalize workflow data.",
    category: "Utilities",
    integrationRequired: false,
    icon: Code,
  },
  {
    id: "code",
    name: "Custom Code",
    description: "Execute a custom JavaScript step.",
    category: "Utilities",
    integrationRequired: false,
    icon: Code,
  },
  {
    id: "logger",
    name: "Log Data",
    description: "Log workflow data for debugging.",
    category: "Utilities",
    integrationRequired: false,
    icon: Database,
  },
];

export const blockLibrary = {
  triggers: triggerBlocks,
  actions: actionBlocks,
  conditions: conditionBlocks,
  utilities: utilityBlocks,
};
