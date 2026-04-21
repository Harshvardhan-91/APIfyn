"use client";

import {
  DiscordIcon,
  GitHubIcon,
  GmailIcon,
  GoogleSheetsIcon,
  NotionIcon,
  SlackIcon,
  StripeIcon,
  TypeformIcon,
} from "@/components/icons/brand-icons";
import { useAuth } from "@/components/providers/auth-provider";
import { useFetch } from "@/hooks/use-fetch";
import { apiFetch } from "@/lib/api/client";
import type { ApiResult, IntegrationStatus } from "@/lib/api/types";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plug,
  RefreshCw,
  Unplug,
  Zap,
} from "lucide-react";
import { type ComponentType, useEffect, useRef, useState } from "react";

type ProviderConfig = {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  ring: string;
  connectType: "oauth" | "config";
  statusKey?: keyof IntegrationStatus;
  docsUrl?: string;
  authMethod: string;
};

const providers: ProviderConfig[] = [
  {
    id: "github",
    name: "GitHub",
    description:
      "Trigger workflows from pushes, PRs, issues, and releases. Filter by branch, event type, and PR action.",
    icon: GitHubIcon,
    bg: "bg-[#24292f]",
    text: "text-white",
    ring: "ring-gray-900/20",
    connectType: "oauth",
    statusKey: "github",
    docsUrl: "https://docs.github.com/en/webhooks",
    authMethod: "OAuth",
  },
  {
    id: "slack",
    name: "Slack",
    description:
      "Send formatted messages and alerts to any channel. Custom bot name, threads, and emoji support.",
    icon: SlackIcon,
    bg: "bg-[#4A154B]",
    text: "text-white",
    ring: "ring-purple-900/20",
    connectType: "oauth",
    statusKey: "slack",
    docsUrl: "https://api.slack.com",
    authMethod: "OAuth",
  },
  {
    id: "notion",
    name: "Notion",
    description:
      "Create pages and update databases. Add status badges, tags, and structured content.",
    icon: NotionIcon,
    bg: "bg-black",
    text: "text-white",
    ring: "ring-gray-900/20",
    connectType: "oauth",
    statusKey: "notion",
    authMethod: "OAuth",
  },
  {
    id: "google",
    name: "Google Sheets",
    description:
      "Read and write data to Google Spreadsheets. Append rows or overwrite existing data.",
    icon: GoogleSheetsIcon,
    bg: "bg-green-50",
    text: "text-green-700",
    ring: "ring-green-500/20",
    connectType: "oauth",
    statusKey: "google",
    authMethod: "OAuth",
  },
  {
    id: "discord",
    name: "Discord",
    description:
      "Post messages to channels via webhook URL. Custom bot name and avatar support.",
    icon: DiscordIcon,
    bg: "bg-[#5865F2]",
    text: "text-white",
    ring: "ring-indigo-500/20",
    connectType: "config",
    authMethod: "Webhook URL",
  },
  {
    id: "gmail",
    name: "Gmail",
    description:
      "Send branded HTML emails with dynamic template variables. Professional formatting built-in.",
    icon: GmailIcon,
    bg: "bg-red-50",
    text: "text-red-600",
    ring: "ring-red-500/20",
    connectType: "config",
    authMethod: "SMTP",
  },
  {
    id: "stripe",
    name: "Stripe",
    description:
      "Listen for payments, subscriptions, refunds, and billing events in real time.",
    icon: StripeIcon,
    bg: "bg-[#635BFF]",
    text: "text-white",
    ring: "ring-violet-500/20",
    connectType: "config",
    authMethod: "Webhook",
  },
  {
    id: "typeform",
    name: "Typeform",
    description:
      "Trigger workflows when new form responses arrive. Access all form fields as variables.",
    icon: TypeformIcon,
    bg: "bg-[#262627]",
    text: "text-white",
    ring: "ring-gray-900/20",
    connectType: "config",
    authMethod: "Webhook",
  },
];

export function IntegrationsPage() {
  const { user } = useAuth();
  const { data, mutate, isLoading } = useFetch<
    ApiResult<{ integrations: IntegrationStatus }>
  >("/api/integrations/status");

  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const { type } = event.data ?? {};
      if (
        typeof type === "string" &&
        type.endsWith("_auth_success")
      ) {
        mutate();
        setLoadingProvider(null);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mutate]);

  async function connect(provider: string) {
    if (!user?.token) return;
    setLoadingProvider(provider);
    try {
      const result = await apiFetch<ApiResult<{ authUrl: string }>>(
        `/api/integrations/${provider}/auth`,
        { method: "POST", token: user.token },
      );
      const popup = window.open(
        result.authUrl,
        "_blank",
        "width=600,height=700",
      );
      popupRef.current = popup;
      const poll = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(poll);
          popupRef.current = null;
          mutate();
          setLoadingProvider(null);
        }
      }, 500);
    } catch {
      setLoadingProvider(null);
    }
  }

  async function disconnect(provider: string) {
    if (!user?.token) return;
    setLoadingProvider(provider);
    try {
      await apiFetch(`/api/integrations/${provider}/disconnect`, {
        method: "DELETE",
        token: user.token,
      });
      await mutate();
    } finally {
      setLoadingProvider(null);
    }
  }

  function isConnected(provider: ProviderConfig): boolean {
    if (!provider.statusKey || !data?.integrations) return false;
    const status = data.integrations[provider.statusKey];
    return Boolean(status?.connected);
  }

  const connectedCount = providers.filter((p) => isConnected(p)).length;

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900">
                <Plug className="h-4.5 w-4.5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Integrations
              </h1>
            </div>
            <p className="text-sm text-gray-500">
              Connect the services your workflows depend on. {providers.length}{" "}
              integrations supported
              {connectedCount > 0 ? `, ${connectedCount} connected` : ""}.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            onClick={() => mutate()}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => {
            const hasOAuth = provider.connectType === "oauth";
            const connected = isConnected(provider);
            const isActionLoading = loadingProvider === provider.id;

            return (
              <div
                key={provider.id}
                className={`group relative rounded-2xl border bg-white p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                  connected
                    ? "border-emerald-200 shadow-sm shadow-emerald-100/50"
                    : "border-gray-150 hover:border-gray-300"
                }`}
              >
                {connected && (
                  <div className="absolute -top-2 right-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      Connected
                    </span>
                  </div>
                )}

                <div className="mb-5 flex items-start gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${provider.bg} border border-black/5 ring-4 ${provider.ring} transition-transform duration-300 group-hover:scale-105`}
                  >
                    <provider.icon className={`h-6 w-6 ${provider.text}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-900">
                        {provider.name}
                      </h2>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        {provider.authMethod}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {provider.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-1.5">
                    {connected ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      </>
                    ) : hasOAuth ? (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-gray-300" />
                        <span className="text-xs text-gray-400">
                          Not connected
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-xs text-gray-500">Available</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {provider.docsUrl && (
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        title="Documentation"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {hasOAuth ? (
                      connected ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                          onClick={() => disconnect(provider.id)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Unplug className="h-3 w-3" />
                          )}
                          Disconnect
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
                          onClick={() => connect(provider.id)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3" />
                          )}
                          Connect
                        </button>
                      )
                    ) : (
                      <span className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500">
                        Configure in builder
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
