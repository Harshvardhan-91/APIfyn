"use client";

import {
  AppIcon,
  GitHubIcon,
  GmailIcon,
  GoogleSheetsIcon,
  NotionIcon,
  SlackIcon,
} from "@/components/icons/brand-icons";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFetch } from "@/hooks/use-fetch";
import type { ApiResult, DashboardData } from "@/lib/api/types";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  Layers,
  Link2,
  Plus,
  Settings,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { useRouter } from "next/navigation";

const usagePercent = (used = 0, limit = 0) => {
  if (!limit || limit >= 999999) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
};

const usageColor = (percent: number) => {
  if (percent >= 100) return "bg-red-500";
  if (percent >= 80) return "bg-amber-500";
  return "bg-emerald-500";
};

const connectedApps = [
  { name: "Slack", icon: SlackIcon, bg: "bg-[#4A154B]", text: "text-white" },
  { name: "GitHub", icon: GitHubIcon, bg: "bg-[#24292f]", text: "text-white" },
  { name: "Gmail", icon: GmailIcon, bg: "bg-red-50", text: "text-red-600" },
  { name: "Notion", icon: NotionIcon, bg: "bg-black", text: "text-white" },
  {
    name: "Google Sheets",
    icon: GoogleSheetsIcon,
    bg: "bg-green-50",
    text: "text-green-700",
  },
];

export function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = useFetch<ApiResult<{ data: DashboardData }>>(
    "/api/user/dashboard",
  );
  const dashboard = data?.data;
  const firstName =
    user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  const workflowUsage = usagePercent(
    dashboard?.plan?.workflowsUsed,
    dashboard?.plan?.workflowsLimit,
  );
  const apiUsage = usagePercent(
    dashboard?.plan?.apiCallsUsed,
    dashboard?.plan?.apiCallsLimit,
  );

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              You have{" "}
              <span className="font-medium text-gray-900">
                {dashboard?.totalWorkflows ?? 0} workflows
              </span>{" "}
              running
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="px-3"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button onClick={() => router.push("/workflows/create")}>
              <Plus className="h-4 w-4" />
              Create Workflow
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Active Workflows",
              value: dashboard?.totalWorkflows ?? 0,
              icon: Workflow,
              bg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              label: "Executions Today",
              value: dashboard?.executionsToday ?? 0,
              icon: CheckCircle,
              bg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
            {
              label: "Connected Apps",
              value: dashboard?.connectedApps ?? 0,
              icon: Layers,
              bg: "bg-purple-50",
              iconColor: "text-purple-600",
            },
            {
              label: "This Week",
              value: dashboard?.thisWeek ?? 0,
              icon: BarChart3,
              bg: "bg-amber-50",
              iconColor: "text-amber-600",
            },
          ].map((stat) => (
            <Card key={stat.label} className="hover:shadow-sm">
              <CardContent className="flex items-center gap-4">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.bg}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </span>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plan card */}
        {dashboard?.plan ? (
          <Card className="mb-6 border-gray-200/60 bg-gradient-to-r from-gray-50 to-white">
            <CardContent>
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {dashboard.plan.name} Plan
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {dashboard.plan.subscriptionStatus === "active" &&
                    dashboard.plan.subscriptionEndDate
                      ? `Active until ${new Date(dashboard.plan.subscriptionEndDate).toLocaleDateString()}`
                      : "Free plan with limited features"}
                  </p>
                </div>
                {dashboard.plan.type === "FREE" ? (
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/pricing")}
                  >
                    Upgrade
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    label: "Workflows",
                    used: dashboard.plan.workflowsUsed,
                    limit: dashboard.plan.workflowsLimit,
                    percent: workflowUsage,
                  },
                  {
                    label: "API Calls",
                    used: dashboard.plan.apiCallsUsed,
                    limit: dashboard.plan.apiCallsLimit,
                    percent: apiUsage,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-white p-4 border border-gray-100"
                  >
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="font-medium text-gray-600">
                        {item.label}
                      </span>
                      <span className="text-gray-400">
                        {item.used} /{" "}
                        {item.limit >= 999999 ? "\u221e" : item.limit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full transition-all ${usageColor(item.percent)}`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Activity + Sidebar */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Recent Activity
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => router.push("/analytics")}
                >
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {dashboard?.recentActivity?.length ? (
                  <div className="space-y-1">
                    {dashboard.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-gray-50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                          {activity.status === "failed" ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : activity.type === "app_connection" ? (
                            <Link2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {activity.name ??
                              activity.description ??
                              "Workflow activity"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(activity.timestamp).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            activity.status === "failed"
                              ? "bg-red-50 text-red-600"
                              : activity.status === "success"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {activity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-40 flex-col items-center justify-center text-center">
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                      <Activity className="h-5 w-5 text-gray-400" />
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900">
                      No activity yet
                    </h3>
                    <p className="mt-1 max-w-xs text-xs text-gray-500">
                      Create a workflow and trigger it to see activity here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "New Workflow",
                  desc: "Build from scratch",
                  icon: Plus,
                  bg: "bg-blue-50",
                  iconColor: "text-blue-600",
                  href: "/workflows/create",
                },
                {
                  title: "Templates",
                  desc: "Start from a template",
                  icon: Layers,
                  bg: "bg-purple-50",
                  iconColor: "text-purple-600",
                  href: "/templates",
                },
                {
                  title: "Connect App",
                  desc: "Add an integration",
                  icon: Link2,
                  bg: "bg-emerald-50",
                  iconColor: "text-emerald-600",
                  href: "/integrations",
                },
              ].map((action) => (
                <button
                  key={action.title}
                  type="button"
                  className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:shadow-sm active:scale-[0.98]"
                  onClick={() => router.push(action.href)}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.bg}`}
                  >
                    <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {action.title}
                    </p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex-row items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Performance
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {["Success Rate", "Avg. Execution Time"].map((label) => (
                  <div key={label}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-400">--</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div className="h-1.5 w-0 rounded-full bg-gray-200" />
                    </div>
                  </div>
                ))}
                <p className="text-center text-xs text-gray-400">
                  Run workflows to see metrics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  Connected Apps
                </h2>
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => router.push("/integrations")}
                >
                  Manage
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {connectedApps.map((app) => (
                  <div
                    key={app.name}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-gray-50"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${app.bg} border border-black/5`}
                    >
                      <app.icon className={`h-4 w-4 ${app.text}`} />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {app.name}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      Not connected
                    </span>
                  </div>
                ))}
                <Button
                  className="mt-2 w-full"
                  variant="secondary"
                  onClick={() => router.push("/integrations")}
                >
                  <Plus className="h-4 w-4" />
                  Connect Apps
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
