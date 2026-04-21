"use client";

import { AppIcon } from "@/components/icons/brand-icons";
import { usePayment } from "@/components/providers/payment-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFetch } from "@/hooks/use-fetch";
import type { ApiResult, Workflow } from "@/lib/api/types";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ProcessedWorkflow = Workflow & {
  status: "active" | "paused";
  executionCount: number;
  lastRun: string;
  apps: string[];
  created: string;
};

const appNameFromBlock = (type?: string) => {
  if (type?.includes("github")) return "GitHub";
  if (type?.includes("gmail")) return "Gmail";
  if (type?.includes("slack")) return "Slack";
  if (type?.includes("discord")) return "Discord";
  if (type?.includes("typeform")) return "Typeform";
  if (type?.includes("sheets")) return "Google Sheets";
  if (type?.includes("notion")) return "Notion";
  if (type?.includes("webhook")) return "Webhook";
  if (type?.includes("stripe")) return "Stripe";
  if (type?.includes("calendar")) return "Calendar";
  return "Custom";
};

export function WorkflowsPage() {
  const router = useRouter();
  const { plan, usage } = usePayment();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">(
    "all",
  );
  const { data, isLoading } =
    useFetch<ApiResult<{ workflows: Workflow[] }>>("/api/workflow");

  const atWorkflowLimit =
    plan &&
    usage &&
    plan.workflowsLimit !== -1 &&
    usage.workflows >= plan.workflowsLimit;

  const workflows = useMemo<ProcessedWorkflow[]>(() => {
    const list = data?.workflows ?? [];
    return list.map((workflow) => {
      const apps = Array.from(
        new Set(
          workflow.definition?.blocks?.map((block) =>
            appNameFromBlock(block.type),
          ) ?? [],
        ),
      );
      return {
        ...workflow,
        status: workflow.isActive ? "active" : "paused",
        executionCount: workflow.totalRuns ?? 0,
        lastRun: workflow.lastRunAt
          ? new Date(workflow.lastRunAt).toLocaleDateString()
          : "Never",
        description: workflow.description ?? "No description available",
        apps,
        created: workflow.createdAt
          ? new Date(workflow.createdAt).toLocaleDateString()
          : "Unknown",
      };
    });
  }, [data?.workflows]);

  const filteredWorkflows = workflows.filter((workflow) => {
    const haystack =
      `${workflow.name} ${workflow.description ?? ""}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || workflow.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-500">Loading workflows...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Workflows
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and monitor your automation workflows
            </p>
          </div>
          <Button
            onClick={() =>
              router.push(atWorkflowLimit ? "/pricing" : "/workflows/create")
            }
            variant={atWorkflowLimit ? "secondary" : "primary"}
          >
            {atWorkflowLimit ? (
              <>
                <ArrowUpRight className="h-4 w-4" />
                Upgrade Plan
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                New Workflow
              </>
            )}
          </Button>
        </div>

        {atWorkflowLimit ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              You&apos;ve reached the {plan.workflowsLimit}-workflow limit on
              the <span className="font-semibold">{plan.name}</span> plan.{" "}
              <button
                type="button"
                className="font-semibold underline hover:no-underline"
                onClick={() => router.push("/pricing")}
              >
                Upgrade to create more.
              </button>
            </p>
          </div>
        ) : null}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="h-11 pl-10"
              placeholder="Search workflows..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "paused"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  filterStatus === status
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredWorkflows.length ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredWorkflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:border-gray-300/60 active:scale-[0.99]"
                onClick={() => router.push(`/workflows/${workflow.id}`)}
              >
                <CardContent>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
                        <Zap className="h-5 w-5 text-gray-600" />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">
                          {workflow.name}
                        </h2>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            workflow.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {workflow.status === "active" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Pause className="h-3 w-3" />
                          )}
                          {workflow.status}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="px-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>

                  <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-gray-500">
                    {workflow.description}
                  </p>

                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {workflow.executionCount}
                      </p>
                      <p className="text-[11px] text-gray-400">Executions</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {workflow.lastRun}
                      </p>
                      <p className="text-[11px] text-gray-400">Last run</p>
                    </div>
                  </div>

                  {/* App logos */}
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {workflow.apps.slice(0, 4).map((app) => (
                        <AppIcon key={app} app={app} size="sm" />
                      ))}
                    </div>
                    {workflow.apps.length > 4 ? (
                      <span className="text-xs text-gray-400">
                        +{workflow.apps.length - 4}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {workflow.created}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-1 transition hover:bg-gray-100"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Play className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-1 transition hover:bg-gray-100"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Pause className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                {search || filterStatus !== "all" ? (
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                ) : (
                  <Zap className="h-6 w-6 text-gray-400" />
                )}
              </span>
              <h2 className="text-base font-semibold text-gray-900">
                {search || filterStatus !== "all"
                  ? "No matching workflows"
                  : "No workflows yet"}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {search || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first workflow to start automating"}
              </p>
              <Button
                className="mt-6"
                onClick={() => router.push("/workflows/create")}
              >
                <Plus className="h-4 w-4" />
                Create Workflow
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
