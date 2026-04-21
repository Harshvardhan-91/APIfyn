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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFetch } from "@/hooks/use-fetch";
import { apiFetch } from "@/lib/api/client";
import type { ApiResult, IntegrationStatus } from "@/lib/api/types";
import type { ComponentType } from "react";

type ProviderConfig = {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  available: boolean;
};

const providers: ProviderConfig[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Trigger workflows from pushes, PRs, and repository events.",
    icon: GitHubIcon,
    bg: "bg-[#24292f]",
    text: "text-white",
    available: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send formatted messages and alerts to your team channels.",
    icon: SlackIcon,
    bg: "bg-[#4A154B]",
    text: "text-white",
    available: true,
  },
  {
    id: "discord",
    name: "Discord",
    description: "Post messages to Discord channels and servers.",
    icon: DiscordIcon,
    bg: "bg-[#5865F2]",
    text: "text-white",
    available: false,
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Read incoming emails and send automated replies.",
    icon: GmailIcon,
    bg: "bg-red-50",
    text: "text-red-600",
    available: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Create pages and update databases in your workspace.",
    icon: NotionIcon,
    bg: "bg-black",
    text: "text-white",
    available: false,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    description: "Read and write data to Google Spreadsheets.",
    icon: GoogleSheetsIcon,
    bg: "bg-green-50",
    text: "text-green-700",
    available: false,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Listen for payments, subscriptions, and billing events.",
    icon: StripeIcon,
    bg: "bg-[#635BFF]",
    text: "text-white",
    available: false,
  },
  {
    id: "typeform",
    name: "Typeform",
    description: "Trigger workflows when new form responses arrive.",
    icon: TypeformIcon,
    bg: "bg-[#262627]",
    text: "text-white",
    available: false,
  },
];

export function IntegrationsPage() {
  const { user } = useAuth();
  const { data, mutate } = useFetch<
    ApiResult<{ integrations: IntegrationStatus }>
  >("/api/integrations/status");

  async function connect(provider: string) {
    if (!user?.token) return;
    const result = await apiFetch<ApiResult<{ authUrl: string }>>(
      `/api/integrations/${provider}/auth`,
      {
        method: "POST",
        token: user.token,
      },
    );
    window.open(result.authUrl, "_blank", "width=600,height=700");
  }

  async function disconnect(provider: string) {
    if (!user?.token) return;
    await apiFetch(`/api/integrations/${provider}/disconnect`, {
      method: "DELETE",
      token: user.token,
    });
    await mutate();
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Integrations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect the services your workflows depend on.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => {
            const isConnectable =
              provider.id === "github" || provider.id === "slack";
            const connected = Boolean(
              isConnectable &&
                data?.integrations?.[provider.id as keyof IntegrationStatus]
                  ?.connected,
            );
            return (
              <Card key={provider.id} className="group">
                <CardContent>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${provider.bg} border border-black/5`}
                      >
                        <provider.icon className={`h-6 w-6 ${provider.text}`} />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">
                          {provider.name}
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {connected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {provider.available ? "Not connected" : "Coming soon"}
                      </span>
                    )}
                    {provider.available ? (
                      <Button
                        variant={connected ? "danger" : "secondary"}
                        className="text-xs"
                        onClick={() =>
                          connected
                            ? disconnect(provider.id)
                            : connect(provider.id)
                        }
                      >
                        {connected ? "Disconnect" : "Connect"}
                      </Button>
                    ) : (
                      <Button variant="ghost" className="text-xs" disabled>
                        Coming soon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
