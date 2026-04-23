"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useFetch } from "@/hooks/use-fetch";
import type { ApiResult, Workflow } from "@/lib/api/types";
import { Activity, BarChart3, CheckCircle, Zap } from "lucide-react";

export function AnalyticsPage() {
  const { data } =
    useFetch<ApiResult<{ workflows: Workflow[] }>>("/api/workflow");
  const workflows = data?.workflows ?? [];
  const runs = workflows.reduce(
    (total, workflow) => total + (workflow.totalRuns ?? 0),
    0,
  );
  const active = workflows.filter((w) => w.isActive).length;

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Execution metrics and workflow performance.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Total Executions",
              value: runs,
              icon: Activity,
              bg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              label: "Workflows",
              value: workflows.length,
              icon: Zap,
              bg: "bg-purple-50",
              iconColor: "text-purple-600",
            },
            {
              label: "Active",
              value: active,
              icon: CheckCircle,
              bg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
          ].map((stat) => (
            <Card key={stat.label}>
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
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <BarChart3 className="h-6 w-6 text-gray-400" />
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              Charts coming soon
            </h2>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Execution trends, success rates, and latency charts will appear
              here as you run more workflows.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
