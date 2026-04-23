"use client";

import { GitHubIcon, OpenAIIcon, SlackIcon } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { IntegrationStatus } from "@/lib/api/types";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Info,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BuilderBlock } from "./types";

type ConfigPanelProps = {
  block: BuilderBlock;
  integrations?: IntegrationStatus;
  repositories: Array<{ id: number; full_name: string; private?: boolean }>;
  channels: Array<{ id: string; name: string; is_private?: boolean }>;
  workflowId?: string;
  onClose: () => void;
  onAuthorize: (provider: "github" | "slack" | "google" | "notion") => void;
  onUpdate: (block: BuilderBlock) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const selectClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100";

/* ── Searchable select dropdown ── */
function SearchableSelect({
  label,
  placeholder,
  searchPlaceholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  searchPlaceholder?: string;
  options: Array<{ value: string; label: string; suffix?: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  return (
    <div>
      <Label>{label}</Label>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          className={`${selectClass} flex items-center justify-between text-left`}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={selectedLabel ? "text-gray-900" : "text-gray-400"}>
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                placeholder={searchPlaceholder ?? "Search..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setQuery("")}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-gray-400">
                  No results for &quot;{query}&quot;
                </p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                      opt.value === value
                        ? "bg-gray-50 font-medium text-gray-900"
                        : "text-gray-700"
                    }`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="truncate">{opt.label}</span>
                    <span className="ml-2 flex items-center gap-1.5">
                      {opt.suffix && (
                        <span className="text-[10px] text-gray-400">
                          {opt.suffix}
                        </span>
                      )}
                      {opt.value === value && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({
  children,
  htmlFor,
}: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      className="mb-1.5 block text-xs font-medium text-gray-600"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-start gap-1 text-[11px] text-gray-400">
      <Info className="mt-0.5 h-3 w-3 shrink-0" />
      {children}
    </p>
  );
}

function WebhookUrlDisplay({ url }: { url: string }) {
  return (
    <div>
      <Label>Webhook URL</Label>
      <div className="flex items-center gap-2">
        <Input value={url} readOnly className="font-mono text-xs" />
        <button
          type="button"
          className="shrink-0 rounded-xl border border-gray-200 p-2.5 transition hover:bg-gray-50"
          onClick={() => navigator.clipboard.writeText(url)}
        >
          <Copy className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <Hint>
        Configure this URL in your external service to receive events.
      </Hint>
    </div>
  );
}

/* ── Checkbox group for multi-select ── */
function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string; desc?: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="space-y-1.5 rounded-xl border border-gray-200 bg-white p-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-start gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-300"
              checked={selected.includes(opt.value)}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, opt.value]);
                else onChange(selected.filter((v) => v !== opt.value));
              }}
            />
            <div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                {opt.label}
              </span>
              {opt.desc && (
                <span className="ml-1 text-[10px] text-gray-400">
                  {opt.desc}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── Variable reference ── */
type VarGroup = {
  source: string;
  description: string;
  vars: Array<{ name: string; desc: string }>;
};

const TRIGGER_VARIABLES: Record<string, VarGroup> = {
  "github-trigger": {
    source: "GitHub Events",
    description: "Variables available from GitHub webhook events",
    vars: [
      { name: "repository_name", desc: "Full repo name (owner/repo)" },
      { name: "branch_name", desc: "Branch name" },
      { name: "author_name", desc: "Name of the committer / PR author" },
      { name: "author_email", desc: "Email of the committer" },
      { name: "commit_message", desc: "Latest commit message or PR title" },
      { name: "commit_url", desc: "URL to the commit on GitHub" },
      { name: "event_type", desc: "push, pull_request, issues, release, etc." },
      { name: "commits_count", desc: "Number of commits in push" },
      { name: "pr_title", desc: "Pull request title (PR events only)" },
      { name: "pr_number", desc: "Pull request number" },
      { name: "pr_action", desc: "opened, closed, merged, etc." },
      { name: "pr_url", desc: "URL to the pull request" },
      { name: "head_branch", desc: "Source branch of PR" },
      { name: "base_branch", desc: "Target branch of PR" },
      { name: "compare_url", desc: "GitHub compare URL (push only)" },
      { name: "issue_title", desc: "Issue title (issue events only)" },
      { name: "issue_number", desc: "Issue number" },
      { name: "release_tag", desc: "Release tag (release events only)" },
      { name: "release_name", desc: "Release name" },
    ],
  },
  "typeform-trigger": {
    source: "Typeform Submission",
    description: "Variables from Typeform form submissions",
    vars: [
      { name: "form_id", desc: "Typeform form ID" },
      { name: "form_title", desc: "Form title" },
      { name: "response_id", desc: "Unique response ID" },
      { name: "submitted_at", desc: "Submission timestamp" },
      { name: "answers", desc: "All answers as JSON" },
    ],
  },
  "stripe-trigger": {
    source: "Stripe Payment",
    description: "Variables from Stripe webhook events",
    vars: [
      { name: "event_type", desc: "e.g. payment_intent.succeeded" },
      { name: "amount", desc: "Payment amount (in cents)" },
      { name: "currency", desc: "Three-letter currency code" },
      { name: "customer_email", desc: "Customer email" },
      { name: "customer_name", desc: "Customer name" },
      { name: "payment_id", desc: "Stripe payment ID" },
    ],
  },
  "razorpay-trigger": {
    source: "Razorpay Payment",
    description: "Variables from Razorpay webhook events",
    vars: [
      { name: "event_type", desc: "e.g. payment.captured, payment.failed" },
      { name: "payment_id", desc: "Razorpay payment ID" },
      { name: "amount", desc: "Payment amount in rupees" },
      { name: "currency", desc: "Currency code (INR)" },
      { name: "status", desc: "Payment status" },
      { name: "method", desc: "Payment method (card, upi, netbanking)" },
      { name: "customer_email", desc: "Customer email" },
      { name: "customer_contact", desc: "Customer phone number" },
      { name: "description", desc: "Payment description" },
      { name: "order_id", desc: "Razorpay order ID" },
    ],
  },
  "webhook-trigger": {
    source: "Webhook",
    description: "Variables from inbound webhook payload",
    vars: [
      { name: "payload", desc: "Full JSON payload" },
      {
        name: "payload.field_name",
        desc: "Access nested fields via dot notation",
      },
    ],
  },
};

function VariableTag({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-600 transition hover:border-gray-200 hover:bg-gray-100 active:scale-95"
      onClick={() => {
        navigator.clipboard.writeText(`{{${name}}}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title={`Click to copy {{${name}}}`}
    >
      {copied ? (
        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
      ) : (
        <Copy className="h-2.5 w-2.5 text-gray-400" />
      )}
      {`{{${name}}}`}
    </button>
  );
}

function AvailableVariables({ triggerIds }: { triggerIds: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const groups = triggerIds.map((id) => TRIGGER_VARIABLES[id]).filter(Boolean);
  if (groups.length === 0) return null;

  return (
    <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-medium text-gray-600 hover:text-gray-900 transition"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        Available Variables
        <span className="ml-auto text-[10px] font-normal text-gray-400">
          Click to copy
        </span>
      </button>
      {expanded && (
        <div className="space-y-4 border-t border-gray-200 px-4 pb-4 pt-3">
          {groups.map((group) => (
            <div key={group.source}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group.source}
              </p>
              <p className="mb-2 text-[10px] text-gray-400">
                {group.description}
              </p>
              <div className="space-y-1.5">
                {group.vars.map((v) => (
                  <div key={v.name} className="flex items-center gap-2">
                    <VariableTag name={v.name} />
                    <span className="text-[10px] text-gray-400 truncate">
                      {v.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Main component ── */
export function ConfigPanel({
  block,
  integrations,
  repositories,
  channels,
  workflowId,
  onClose,
  onAuthorize,
  onUpdate,
}: ConfigPanelProps) {
  const githubConnected = Boolean(integrations?.github.connected);
  const slackConnected = Boolean(integrations?.slack.connected);
  const googleConnected = Boolean(integrations?.google?.connected);
  const notionConnected = Boolean(integrations?.notion?.connected);

  function updateConfig(
    config: Record<string, string | string[] | boolean | undefined>,
  ) {
    onUpdate({
      ...block,
      config: { ...block.config, ...config },
      status: "configured",
      integrationStatus:
        block.id.includes("github") && githubConnected
          ? "connected"
          : block.id.includes("slack") && slackConnected
            ? "connected"
            : block.id === "sheets-add" && googleConnected
              ? "connected"
              : block.id === "notion-create" && notionConnected
                ? "connected"
                : block.integrationStatus,
    });
  }

  function getWebhookUrl(triggerId: string): string {
    if (!workflowId) return "Save the workflow first to generate a webhook URL";
    const routeMap: Record<string, string> = {
      "stripe-trigger": "stripe",
      "typeform-trigger": "typeform",
      "razorpay-trigger": "razorpay",
      "webhook-trigger": "inbound",
      "gmail-trigger": "inbound",
      "calendar-trigger": "inbound",
    };
    const route = routeMap[triggerId] ?? "inbound";
    return `${API_URL}/api/webhooks/${route}/${workflowId}`;
  }

  const webhookUrl = getWebhookUrl(block.id);

  const isTrigger = Object.keys(TRIGGER_VARIABLES).includes(block.id);
  const showVars =
    !isTrigger &&
    !["delay", "if-condition", "filter", "switch", "logger"].includes(block.id);

  return (
    <aside className="h-full w-full shrink-0 border-l border-gray-200 bg-white animate-slide-in-right overflow-hidden flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Configure Block
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">{block.name}</p>
        </div>
        <button
          type="button"
          className="rounded-xl p-2 transition hover:bg-gray-100"
          onClick={onClose}
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        {/* ═══════════════════ GITHUB TRIGGER ═══════════════════ */}
        {block.id === "github-trigger" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24292f]">
                  <GitHubIcon className="h-4.5 w-4.5 text-white" />
                </span>
                <span className="text-sm font-medium text-gray-900">
                  GitHub
                </span>
              </div>
              {githubConnected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              )}
            </div>

            {!githubConnected ? (
              <Button className="w-full" onClick={() => onAuthorize("github")}>
                <ExternalLink className="h-4 w-4" /> Connect GitHub
              </Button>
            ) : (
              <>
                <SearchableSelect
                  label="Repository"
                  placeholder="Select repository"
                  searchPlaceholder="Search repositories..."
                  options={repositories.map((repo) => ({
                    value: repo.full_name,
                    label: repo.full_name,
                    suffix: repo.private ? "Private" : undefined,
                  }))}
                  value={(block.config.repository as string) ?? ""}
                  onChange={(v) => updateConfig({ repository: v })}
                />

                <CheckboxGroup
                  label="Event types"
                  options={[
                    {
                      value: "push",
                      label: "Push",
                      desc: "— code pushed to a branch",
                    },
                    {
                      value: "pull_request",
                      label: "Pull Request",
                      desc: "— opened, closed, merged",
                    },
                    {
                      value: "issues",
                      label: "Issues",
                      desc: "— created, edited, closed",
                    },
                    {
                      value: "release",
                      label: "Release",
                      desc: "— published, drafted",
                    },
                    {
                      value: "star",
                      label: "Star",
                      desc: "— repo starred / unstarred",
                    },
                    { value: "fork", label: "Fork", desc: "— repo forked" },
                    {
                      value: "issue_comment",
                      label: "Comments",
                      desc: "— issue / PR comments",
                    },
                    {
                      value: "create",
                      label: "Branch/Tag created",
                      desc: "— new branch or tag",
                    },
                  ]}
                  selected={
                    ((block.config.eventTypes as string[]) ?? []) as string[]
                  }
                  onChange={(values) => updateConfig({ eventTypes: values })}
                />
                <Hint>Leave empty to receive all event types.</Hint>

                {((block.config.eventTypes as string[]) ?? []).includes(
                  "pull_request",
                ) && (
                  <CheckboxGroup
                    label="PR actions"
                    options={[
                      { value: "opened", label: "Opened" },
                      { value: "closed", label: "Closed" },
                      { value: "reopened", label: "Reopened" },
                      { value: "synchronize", label: "New commits pushed" },
                      { value: "review_requested", label: "Review requested" },
                      { value: "labeled", label: "Label added" },
                    ]}
                    selected={
                      ((block.config.prActions as string[]) ?? []) as string[]
                    }
                    onChange={(values) => updateConfig({ prActions: values })}
                  />
                )}

                <div>
                  <Label>Branch filter</Label>
                  <Input
                    placeholder="main (leave empty for all branches)"
                    value={(block.config.branchFilter as string) ?? ""}
                    onChange={(e) =>
                      updateConfig({ branchFilter: e.target.value })
                    }
                  />
                  <Hint>
                    Only trigger for events on this branch. Use * for all.
                  </Hint>
                </div>
              </>
            )}
          </section>
        )}

        {/* ═══════════════════ SLACK SEND ═══════════════════ */}
        {block.id === "slack-send" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4A154B]">
                  <SlackIcon className="h-4.5 w-4.5 text-white" />
                </span>
                <span className="text-sm font-medium text-gray-900">Slack</span>
              </div>
              {slackConnected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              )}
            </div>

            {!slackConnected ? (
              <Button className="w-full" onClick={() => onAuthorize("slack")}>
                <ExternalLink className="h-4 w-4" /> Connect Slack
              </Button>
            ) : (
              <>
                <SearchableSelect
                  label="Channel"
                  placeholder="Select channel"
                  searchPlaceholder="Search channels..."
                  options={channels.map((ch) => ({
                    value: ch.id,
                    label: `#${ch.name}`,
                    suffix: ch.is_private ? "Private" : undefined,
                  }))}
                  value={(block.config.channel as string) ?? ""}
                  onChange={(v) => updateConfig({ channel: v })}
                />
                <div>
                  <Label>Message template</Label>
                  <Textarea
                    rows={4}
                    placeholder="New push to {{repository_name}} by {{author_name}} on {{branch_name}}"
                    value={(block.config.messageTemplate as string) ?? ""}
                    onChange={(e) =>
                      updateConfig({ messageTemplate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Bot name (optional)</Label>
                  <Input
                    placeholder="APIfyn Bot"
                    value={(block.config.botName as string) ?? ""}
                    onChange={(e) => updateConfig({ botName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Icon emoji (optional)</Label>
                  <Input
                    placeholder=":rocket:"
                    value={(block.config.iconEmoji as string) ?? ""}
                    onChange={(e) =>
                      updateConfig({ iconEmoji: e.target.value })
                    }
                  />
                  <Hint>Use a Slack emoji like :robot_face: or :bell:</Hint>
                </div>
              </>
            )}
          </section>
        )}

        {/* ═══════════════════ WEBHOOK TRIGGER ═══════════════════ */}
        {block.id === "webhook-trigger" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Webhook Trigger
            </h3>
            <WebhookUrlDisplay url={webhookUrl} />
            <Hint>
              Send a POST request with JSON body to this URL to trigger the
              workflow.
            </Hint>
          </section>
        )}

        {/* ═══════════════════ TYPEFORM TRIGGER ═══════════════════ */}
        {block.id === "typeform-trigger" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Typeform</h3>
            <WebhookUrlDisplay url={webhookUrl} />
            <div>
              <Label>Form ID filter (optional)</Label>
              <Input
                placeholder="Leave empty for all forms"
                value={(block.config.formIdFilter as string) ?? ""}
                onChange={(e) => updateConfig({ formIdFilter: e.target.value })}
              />
            </div>
            <Hint>
              In Typeform, go to Connect &gt; Webhooks and paste the URL above.
            </Hint>
          </section>
        )}

        {/* ═══════════════════ STRIPE TRIGGER ═══════════════════ */}
        {block.id === "stripe-trigger" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Stripe</h3>
            <WebhookUrlDisplay url={webhookUrl} />
            <CheckboxGroup
              label="Event types"
              options={[
                {
                  value: "payment_intent.succeeded",
                  label: "Payment succeeded",
                },
                {
                  value: "payment_intent.payment_failed",
                  label: "Payment failed",
                },
                { value: "invoice.paid", label: "Invoice paid" },
                {
                  value: "invoice.payment_failed",
                  label: "Invoice payment failed",
                },
                {
                  value: "customer.subscription.created",
                  label: "Subscription created",
                },
                {
                  value: "customer.subscription.deleted",
                  label: "Subscription cancelled",
                },
                {
                  value: "checkout.session.completed",
                  label: "Checkout completed",
                },
                { value: "charge.refunded", label: "Charge refunded" },
              ]}
              selected={
                ((block.config.eventTypes as string[]) ?? []) as string[]
              }
              onChange={(values) => updateConfig({ eventTypes: values })}
            />
            <Hint>
              Add the webhook URL in Stripe Dashboard &gt; Developers &gt;
              Webhooks and select these events.
            </Hint>
          </section>
        )}

        {/* ═══════════════════ RAZORPAY TRIGGER ═══════════════════ */}
        {block.id === "razorpay-trigger" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Razorpay</h3>
            <WebhookUrlDisplay url={webhookUrl} />
            <CheckboxGroup
              label="Event types"
              options={[
                {
                  value: "payment.captured",
                  label: "Payment captured",
                  desc: "— successful payment",
                },
                {
                  value: "payment.failed",
                  label: "Payment failed",
                },
                {
                  value: "payment.authorized",
                  label: "Payment authorized",
                },
                {
                  value: "refund.created",
                  label: "Refund created",
                },
                {
                  value: "order.paid",
                  label: "Order paid",
                },
                {
                  value: "subscription.activated",
                  label: "Subscription activated",
                },
                {
                  value: "subscription.charged",
                  label: "Subscription charged",
                },
                {
                  value: "subscription.cancelled",
                  label: "Subscription cancelled",
                },
              ]}
              selected={
                ((block.config.eventTypes as string[]) ?? []) as string[]
              }
              onChange={(values) => updateConfig({ eventTypes: values })}
            />
            <Hint>
              Add the webhook URL in Razorpay Dashboard &gt; Settings &gt;
              Webhooks. Select the events you want to receive.
            </Hint>
          </section>
        )}

        {/* ═══════════════════ GMAIL SEND ═══════════════════ */}
        {block.id === "gmail-send" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Send Email</h3>
            <div>
              <Label>To</Label>
              <Input
                placeholder="recipient@example.com"
                value={(block.config.to as string) ?? ""}
                onChange={(e) => updateConfig({ to: e.target.value })}
              />
              <Hint>Supports variables like {"{{author_email}}"}</Hint>
            </div>
            <div>
              <Label>Reply-to (optional)</Label>
              <Input
                placeholder="noreply@yourcompany.com"
                value={(block.config.replyTo as string) ?? ""}
                onChange={(e) => updateConfig({ replyTo: e.target.value })}
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                placeholder="New push to {{repository_name}} on {{branch_name}}"
                value={(block.config.subject as string) ?? ""}
                onChange={(e) => updateConfig({ subject: e.target.value })}
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                rows={6}
                placeholder={
                  "New push to {{repository_name}} on branch {{branch_name}}\n\nAuthor: {{author_name}}\nCommit: {{commit_message}}\n\nView changes: {{compare_url}}"
                }
                value={(block.config.body as string) ?? ""}
                onChange={(e) => updateConfig({ body: e.target.value })}
              />
            </div>
            <Hint>
              Requires SMTP_USER and SMTP_PASS in .env. Use a Gmail App Password
              from myaccount.google.com/apppasswords
            </Hint>
          </section>
        )}

        {/* ═══════════════════ GOOGLE SHEETS ═══════════════════ */}
        {block.id === "sheets-add" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Google Sheets
              </h3>
              {googleConnected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              )}
            </div>

            {!googleConnected ? (
              <>
                <Button
                  className="w-full"
                  onClick={() => onAuthorize("google")}
                >
                  <ExternalLink className="h-4 w-4" /> Connect Google
                </Button>
                <Hint>Required to read/write Google Sheets via API.</Hint>
              </>
            ) : (
              <>
                <div>
                  <Label>Spreadsheet URL or ID</Label>
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={(block.config.spreadsheetUrl as string) ?? ""}
                    onChange={(e) =>
                      updateConfig({ spreadsheetUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Sheet name</Label>
                  <Input
                    placeholder="Sheet1"
                    value={(block.config.sheetName as string) ?? ""}
                    onChange={(e) =>
                      updateConfig({ sheetName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Write mode</Label>
                  <select
                    className={selectClass}
                    value={(block.config.writeMode as string) ?? "append"}
                    onChange={(e) =>
                      updateConfig({ writeMode: e.target.value })
                    }
                  >
                    <option value="append">Append new row</option>
                    <option value="update">Update existing row</option>
                  </select>
                </div>
                <div>
                  <Label>Column values (comma-separated)</Label>
                  <Input
                    placeholder="{{repository_name}}, {{author_name}}, {{commit_message}}, {{branch_name}}"
                    value={(block.config.values as string) ?? ""}
                    onChange={(e) => updateConfig({ values: e.target.value })}
                  />
                  <Hint>
                    Each value maps to a column (A, B, C...) in the sheet.
                  </Hint>
                </div>
              </>
            )}
          </section>
        )}

        {/* ═══════════════════ NOTION ═══════════════════ */}
        {block.id === "notion-create" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Notion Page</h3>
              {notionConnected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              )}
            </div>

            {!notionConnected ? (
              <>
                <Button
                  className="w-full"
                  onClick={() => onAuthorize("notion")}
                >
                  <ExternalLink className="h-4 w-4" /> Connect Notion
                </Button>
                <Hint>Required to create pages in your Notion workspace.</Hint>
              </>
            ) : (
              <>
                <div>
                  <Label>Database ID</Label>
                  <Input
                    placeholder="abc123..."
                    value={(block.config.databaseId as string) ?? ""}
                    onChange={(e) =>
                      updateConfig({ databaseId: e.target.value })
                    }
                  />
                  <Hint>
                    Find this in the Notion database URL after the workspace
                    name.
                  </Hint>
                </div>
                <div>
                  <Label>Title property</Label>
                  <Input
                    placeholder="{{repository_name}} — {{commit_message}}"
                    value={(block.config.title as string) ?? ""}
                    onChange={(e) => updateConfig({ title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    rows={4}
                    placeholder={
                      "Branch: {{branch_name}}\nAuthor: {{author_name}}\nCommit: {{commit_message}}"
                    }
                    value={(block.config.content as string) ?? ""}
                    onChange={(e) => updateConfig({ content: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Status property (optional)</Label>
                  <Input
                    placeholder="To Do"
                    value={(block.config.status as string) ?? ""}
                    onChange={(e) => updateConfig({ status: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tags (comma-separated, optional)</Label>
                  <Input
                    placeholder="github, automation"
                    value={(block.config.tags as string) ?? ""}
                    onChange={(e) => updateConfig({ tags: e.target.value })}
                  />
                </div>
              </>
            )}
          </section>
        )}

        {/* ═══════════════════ WEBHOOK SEND ═══════════════════ */}
        {block.id === "webhook-send" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Send Webhook</h3>
            <div>
              <Label>URL</Label>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={(block.config.url as string) ?? ""}
                onChange={(e) => updateConfig({ url: e.target.value })}
              />
            </div>
            <div>
              <Label>Method</Label>
              <select
                className={selectClass}
                value={(block.config.method as string) ?? "POST"}
                onChange={(e) => updateConfig({ method: e.target.value })}
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="GET">GET</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <Label>Headers (optional, JSON)</Label>
              <Textarea
                rows={2}
                placeholder={'{"Authorization": "Bearer your-token"}'}
                value={(block.config.headersJson as string) ?? ""}
                onChange={(e) => updateConfig({ headersJson: e.target.value })}
              />
            </div>
            <div>
              <Label>Body template</Label>
              <Textarea
                rows={4}
                placeholder={
                  '{"repo": "{{repository_name}}", "message": "{{commit_message}}"}'
                }
                value={(block.config.body as string) ?? ""}
                onChange={(e) => updateConfig({ body: e.target.value })}
              />
              <Hint>
                Leave empty to forward the previous block&apos;s output as JSON.
              </Hint>
            </div>
          </section>
        )}

        {/* ═══════════════════ DISCORD ═══════════════════ */}
        {block.id === "discord-send" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Discord Message
            </h3>
            <div>
              <Label>Webhook URL</Label>
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={(block.config.webhookUrl as string) ?? ""}
                onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
              />
              <Hint>
                Create a webhook in Discord: Server Settings &gt; Integrations
                &gt; Webhooks.
              </Hint>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                rows={4}
                placeholder={
                  "New push to {{repository_name}} by {{author_name}}\nCommit: {{commit_message}}"
                }
                value={(block.config.message as string) ?? ""}
                onChange={(e) => updateConfig({ message: e.target.value })}
              />
            </div>
            <div>
              <Label>Bot name (optional)</Label>
              <Input
                placeholder="APIfyn Bot"
                value={(block.config.botName as string) ?? ""}
                onChange={(e) => updateConfig({ botName: e.target.value })}
              />
            </div>
            <div>
              <Label>Avatar URL (optional)</Label>
              <Input
                placeholder="https://example.com/avatar.png"
                value={(block.config.avatarUrl as string) ?? ""}
                onChange={(e) => updateConfig({ avatarUrl: e.target.value })}
              />
            </div>
          </section>
        )}

        {/* ═══════════════════ WHATSAPP SEND ═══════════════════ */}
        {block.id === "whatsapp-send" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              WhatsApp Message (MSG91)
            </h3>
            <div>
              <Label>Recipient phone number</Label>
              <Input
                placeholder="919876543210 or {{customer_contact}}"
                value={(block.config.to as string) ?? ""}
                onChange={(e) => updateConfig({ to: e.target.value })}
              />
              <Hint>Include country code without + (e.g. 919876543210 for India)</Hint>
            </div>
            <div>
              <Label>MSG91 Template ID</Label>
              <Input
                placeholder="template_name_from_msg91"
                value={(block.config.templateId as string) ?? ""}
                onChange={(e) => updateConfig({ templateId: e.target.value })}
              />
              <Hint>
                Create a WhatsApp template in your MSG91 dashboard first.
                Leave empty to use the default template from .env.
              </Hint>
            </div>
            <div>
              <Label>Template variables (comma-separated)</Label>
              <Input
                placeholder="{{customer_name}}, {{amount}}, {{order_id}}"
                value={(block.config.variables as string) ?? ""}
                onChange={(e) => updateConfig({ variables: e.target.value })}
              />
              <Hint>
                These map to {"{{1}}"}, {"{{2}}"}, {"{{3}}"} etc. in your MSG91 template.
              </Hint>
            </div>
            <div>
              <Label>Language code</Label>
              <select
                className={selectClass}
                value={(block.config.language as string) ?? "en"}
                onChange={(e) => updateConfig({ language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="bn">Bengali</option>
                <option value="gu">Gujarati</option>
                <option value="kn">Kannada</option>
              </select>
            </div>
          </section>
        )}

        {/* ═══════════════════ OPENAI ACTION ═══════════════════ */}
        {block.id === "openai-action" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white">
                <OpenAIIcon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-sm font-medium text-gray-900">OpenAI</h3>
                <p className="text-[11px] text-gray-500">
                  Key is stored encrypted. Default: Settings → OpenAI, or
                  override below.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>API key source</Label>
              <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    className="mt-1 h-3.5 w-3.5"
                    checked={block.config.useOpenaiAccountKey !== false}
                    onChange={() =>
                      updateConfig({
                        useOpenaiAccountKey: true,
                        openaiKeyInput: "",
                        __openaiKeyClear: true,
                        openaiKeyStored: false,
                      })
                    }
                  />
                  <div>
                    <span className="text-xs font-medium text-gray-800">
                      Use my key from Settings
                    </span>
                    <p className="text-[11px] text-gray-500">
                      Set once under Settings; applies to all workflows.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    className="mt-1 h-3.5 w-3.5"
                    checked={block.config.useOpenaiAccountKey === false}
                    onChange={() =>
                      updateConfig({ useOpenaiAccountKey: false })
                    }
                  />
                  <div>
                    <span className="text-xs font-medium text-gray-800">
                      Use a key only for this workflow
                    </span>
                    <p className="text-[11px] text-gray-500">
                      Different billing or org per workflow. Encrypted in our
                      database.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {block.config.useOpenaiAccountKey === false && (
              <div>
                <Label>OpenAI API key (this workflow)</Label>
                {(block.config as { openaiKeyStored?: boolean }).openaiKeyStored && (
                  <p className="mb-1.5 text-[11px] text-emerald-700">
                    A key is already saved. Paste a new one to replace, or
                    remove below.
                  </p>
                )}
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder="sk-…"
                  value={(block.config.openaiKeyInput as string) ?? ""}
                  onChange={(e) =>
                    updateConfig({
                      openaiKeyInput: e.target.value,
                    })
                  }
                />
                {(block.config as { openaiKeyStored?: boolean }).openaiKeyStored && (
                  <button
                    type="button"
                    className="mt-2 text-xs font-medium text-red-600 hover:underline"
                    onClick={() =>
                      updateConfig({
                        useOpenaiAccountKey: true,
                        __openaiKeyClear: true,
                        openaiKeyStored: false,
                        openaiKeyInput: "",
                      })
                    }
                  >
                    Remove workflow key and use Settings
                  </button>
                )}
              </div>
            )}

            <div>
              <Label>Model</Label>
              <select
                className={selectClass}
                value={(block.config.model as string) || "gpt-4o-mini"}
                onChange={(e) => updateConfig({ model: e.target.value })}
              >
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              </select>
            </div>
            <div>
              <Label>System prompt</Label>
              <Textarea
                rows={3}
                value={(block.config.systemPrompt as string) ?? "You are a helpful assistant. Reply concisely."}
                onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
              />
            </div>
            <div>
              <Label>User message</Label>
              <Textarea
                rows={4}
                placeholder="Summarize: {{commit_message}} — author {{author_name}}"
                value={(block.config.userMessage as string) ?? ""}
                onChange={(e) => updateConfig({ userMessage: e.target.value })}
              />
              <Hint>
                Supports trigger variables. Output is in {"{{text}}"} for
                following blocks.
              </Hint>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Temperature</Label>
                <Input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={String(
                    (block.config.temperature as string) ?? "0.3",
                  )}
                  onChange={(e) => updateConfig({ temperature: e.target.value })}
                />
              </div>
              <div>
                <Label>Max tokens</Label>
                <Input
                  type="number"
                  min={1}
                  max={4096}
                  value={String((block.config.maxTokens as string) ?? "1000")}
                  onChange={(e) => updateConfig({ maxTokens: e.target.value })}
                />
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════ DELAY ═══════════════════ */}
        {block.id === "delay" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Delay</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Duration</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="5"
                  value={(block.config.duration as string) ?? ""}
                  onChange={(e) => updateConfig({ duration: e.target.value })}
                />
              </div>
              <div className="w-32">
                <Label>Unit</Label>
                <select
                  className={selectClass}
                  value={(block.config.unit as string) ?? "seconds"}
                  onChange={(e) => updateConfig({ unit: e.target.value })}
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
            </div>
            <Hint>Maximum delay is 5 minutes per block.</Hint>
          </section>
        )}

        {/* ═══════════════════ IF CONDITION ═══════════════════ */}
        {block.id === "if-condition" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Condition</h3>
            <div>
              <Label>Field</Label>
              <Input
                placeholder="e.g. branch_name, event_type, pr_action"
                value={(block.config.field as string) ?? ""}
                onChange={(e) => updateConfig({ field: e.target.value })}
              />
              <Hint>Use a variable name from the trigger block output</Hint>
            </div>
            <div>
              <Label>Operator</Label>
              <select
                className={selectClass}
                value={(block.config.operator as string) ?? "equals"}
                onChange={(e) => updateConfig({ operator: e.target.value })}
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not equals</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Does not contain</option>
                <option value="starts_with">Starts with</option>
                <option value="ends_with">Ends with</option>
              </select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                placeholder="main"
                value={(block.config.value as string) ?? ""}
                onChange={(e) => updateConfig({ value: e.target.value })}
              />
            </div>
          </section>
        )}

        {/* ═══════════════════ FILTER ═══════════════════ */}
        {block.id === "filter" && (
          <section className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Filter</h3>
            <div>
              <Label>Field</Label>
              <Input
                placeholder="e.g. branch_name, event_type, pr_action"
                value={(block.config.field as string) ?? ""}
                onChange={(e) => updateConfig({ field: e.target.value })}
              />
              <Hint>Use a variable name from the trigger block output</Hint>
            </div>
            <div>
              <Label>Operator</Label>
              <select
                className={selectClass}
                value={(block.config.operator as string) ?? "equals"}
                onChange={(e) => updateConfig({ operator: e.target.value })}
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not equals</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Does not contain</option>
              </select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                placeholder="main"
                value={(block.config.value as string) ?? ""}
                onChange={(e) => updateConfig({ value: e.target.value })}
              />
            </div>
            <Hint>Stops the workflow if the condition does not match.</Hint>
          </section>
        )}

        {/* ── Available Variables (for actions) ── */}
        {showVars && (
          <AvailableVariables triggerIds={Object.keys(TRIGGER_VARIABLES)} />
        )}

        {/* ── Output Variables (for triggers) ── */}
        {isTrigger && <AvailableVariables triggerIds={[block.id]} />}

        {/* ── Block name ── */}
        <section>
          <Label htmlFor="builder-block-name">Block name</Label>
          <Input
            id="builder-block-name"
            value={block.name}
            onChange={(e) => onUpdate({ ...block, name: e.target.value })}
          />
        </section>
      </div>
    </aside>
  );
}
