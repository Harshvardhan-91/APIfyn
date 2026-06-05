"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFetch } from "@/hooks/use-fetch";
import type { AnalyticsData, ApiResult, Workflow } from "@/lib/api/types";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle,
  Clock,
  Flame,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  bg,
  iconColor,
  trend,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  bg: string;
  iconColor: string;
  trend?: { value: string; positive: boolean } | null;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bg}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">{label}</p>
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  trend.positive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {trend.positive ? (
                  <ArrowUp className="h-2.5 w-2.5" />
                ) : (
                  <ArrowDown className="h-2.5 w-2.5" />
                )}
                {trend.value}
              </span>
            )}
          </div>
          {subtext && <p className="mt-0.5 text-[10px] text-gray-400">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function BarChartVertical({
  data,
  maxValue,
  labelKey,
  valueKey,
  color = "bg-blue-500",
  formatLabel,
  formatValue,
}: {
  data: Array<Record<string, any>>;
  maxValue: number;
  labelKey: string;
  valueKey: string;
  color?: string;
  formatLabel?: (v: any) => string;
  formatValue?: (v: any) => string;
}) {
  if (!data.length) return null;
  const safeMax = maxValue || 1;

  return (
    <div className="flex items-end gap-[3px] sm:gap-1">
      {data.map((item, i) => {
        const val = item[valueKey] ?? 0;
        const pct = Math.max(2, (val / safeMax) * 100);
        const label = formatLabel
          ? formatLabel(item[labelKey])
          : String(item[labelKey]);
        const display = formatValue ? formatValue(val) : String(val);

        return (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center"
          >
            <div className="relative mb-1.5 w-full" style={{ height: 140 }}>
              <div
                className={`absolute bottom-0 w-full rounded-t-sm ${color} transition-all duration-300 group-hover:opacity-80`}
                style={{ height: `${pct}%`, minHeight: 2 }}
              />
              <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {display}
              </div>
            </div>
            <span className="text-[9px] leading-tight text-gray-400 sm:text-[10px]">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({
  items,
  maxValue,
  color = "bg-purple-500",
}: {
  items: Array<{ label: string; value: number; sublabel?: string }>;
  maxValue: number;
  color?: string;
}) {
  const safeMax = maxValue || 1;

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const pct = Math.max(1, (item.value / safeMax) * 100);
        return (
          <div key={i}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="max-w-[70%] truncate text-xs font-medium text-gray-700">
                {item.label}
              </span>
              <span className="text-xs tabular-nums text-gray-400">
                {item.sublabel ?? item.value}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full ${color} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsPage() {
  const { data: wfData, isLoading: wfLoading } =
    useFetch<ApiResult<{ workflows: Workflow[] }>>("/api/workflow");
  const { data: analyticsData, isLoading: analyticsLoading } =
    useFetch<ApiResult<{ analytics: AnalyticsData }>>("/api/user/analytics");

  const workflows = wfData?.workflows ?? [];
  const analytics = analyticsData?.analytics;
  const isLoading = wfLoading || analyticsLoading;

  const totalRuns = workflows.reduce((s, w) => s + (w.totalRuns ?? 0), 0);
  const activeCount = workflows.filter((w) => w.isActive).length;

  const dailyStats = analytics?.dailyStats ?? [];
  const avgDurations = analytics?.avgDurations ?? [];
  const peakHours = analytics?.peakHours ?? [];

  const successRuns = dailyStats.reduce((s, d) => s + (d.succeeded ?? 0), 0);
  const failedRuns = dailyStats.reduce((s, d) => s + (d.failed ?? 0), 0);
  const analyticsTotal = successRuns + failedRuns;
  const overallSuccessRate =
    analyticsTotal > 0 ? Math.round((successRuns / analyticsTotal) * 100) : 0;

  const avgDurationAll =
    avgDurations.length > 0
      ? Math.round(
          avgDurations.reduce((s, w) => s + w.avg_duration_ms, 0) /
            avgDurations.length,
        )
      : 0;

  const last7Days = dailyStats.slice(0, 7).reverse();
  const maxDaily = Math.max(...last7Days.map((d) => d.total), 1);

  const allHours = Array.from({ length: 24 }, (_, h) => {
    const found = peakHours.find((p) => p.hour === h);
    return { hour: h, execution_count: found?.execution_count ?? 0 };
  });
  const maxHourly = Math.max(...allHours.map((h) => h.execution_count), 1);

  const topWorkflows = avgDurations.slice(0, 5);
  const maxDuration = Math.max(...topWorkflows.map((w) => w.avg_duration_ms), 1);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-500">Loading analytics...</p>
        </div>
      </main>
    );
  }

  const hasData = totalRuns > 0 || dailyStats.length > 0;

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Execution metrics and workflow performance over the last 30 days.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Executions"
            value={totalRuns.toLocaleString()}
            icon={Activity}
            bg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            label="Success Rate"
            value={`${overallSuccessRate}%`}
            subtext={`${successRuns} succeeded, ${failedRuns} failed`}
            icon={CheckCircle}
            bg="bg-emerald-50"
            iconColor="text-emerald-600"
            trend={
              overallSuccessRate > 0
                ? {
                    value: `${overallSuccessRate}%`,
                    positive: overallSuccessRate >= 80,
                  }
                : null
            }
          />
          <StatCard
            label="Avg. Duration"
            value={avgDurationAll ? formatDuration(avgDurationAll) : "--"}
            subtext={avgDurationAll ? "across all workflows" : "No data yet"}
            icon={Clock}
            bg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            label="Active Workflows"
            value={activeCount}
            subtext={`${workflows.length} total`}
            icon={Zap}
            bg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        {!hasData ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </span>
              <h2 className="text-base font-semibold text-gray-900">
                No execution data yet
              </h2>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Run some workflows to see detailed analytics here — daily
                trends, performance breakdowns, and peak usage patterns.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Charts Row 1: Daily Executions + Success/Fail Breakdown */}
            <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_340px]">
              <Card>
                <CardHeader className="flex-row items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Daily Executions
                  </h2>
                  <span className="ml-auto text-[10px] text-gray-400">
                    Last 7 days
                  </span>
                </CardHeader>
                <CardContent>
                  {last7Days.length > 0 ? (
                    <BarChartVertical
                      data={last7Days}
                      maxValue={maxDaily}
                      labelKey="date"
                      valueKey="total"
                      color="bg-blue-500"
                      formatLabel={(d: string) => {
                        const date = new Date(d);
                        return date.toLocaleDateString("en", {
                          weekday: "short",
                        });
                      }}
                      formatValue={(v: number) => `${v} runs`}
                    />
                  ) : (
                    <p className="py-8 text-center text-xs text-gray-400">
                      No daily data available yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Success / Fail Breakdown */}
              <Card>
                <CardHeader className="flex-row items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Execution Results
                  </h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center gap-6 py-2">
                    <div className="text-center">
                      <div className="relative mx-auto mb-2 flex h-20 w-20 items-center justify-center">
                        <svg
                          viewBox="0 0 36 36"
                          className="h-20 w-20 -rotate-90"
                        >
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="3"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeDasharray={`${overallSuccessRate} ${100 - overallSuccessRate}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-lg font-bold text-gray-900">
                          {overallSuccessRate}%
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">Success Rate</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50/60 p-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-700">
                          Succeeded
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-emerald-700">
                        {successRuns.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-red-50/60 p-2.5">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-xs font-medium text-red-700">
                          Failed
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-red-700">
                        {failedRuns.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2: Peak Hours + Workflow Performance */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex-row items-center gap-2">
                  <Flame className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Peak Usage Hours
                  </h2>
                  <span className="ml-auto text-[10px] text-gray-400">
                    UTC · Last 30 days
                  </span>
                </CardHeader>
                <CardContent>
                  {peakHours.length > 0 ? (
                    <BarChartVertical
                      data={allHours}
                      maxValue={maxHourly}
                      labelKey="hour"
                      valueKey="execution_count"
                      color="bg-amber-400"
                      formatLabel={(h: number) =>
                        h % 3 === 0 ? formatHour(h) : ""
                      }
                      formatValue={(v: number) =>
                        `${v} run${v === 1 ? "" : "s"}`
                      }
                    />
                  ) : (
                    <p className="py-8 text-center text-xs text-gray-400">
                      No hourly data available yet
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Workflow Performance
                  </h2>
                  <span className="ml-auto text-[10px] text-gray-400">
                    Avg. duration
                  </span>
                </CardHeader>
                <CardContent>
                  {topWorkflows.length > 0 ? (
                    <HorizontalBar
                      items={topWorkflows.map((w) => ({
                        label: w.workflow_name,
                        value: w.avg_duration_ms,
                        sublabel: `${formatDuration(w.avg_duration_ms)} · ${w.total_runs} runs`,
                      }))}
                      maxValue={maxDuration}
                      color="bg-purple-500"
                    />
                  ) : (
                    <p className="py-8 text-center text-xs text-gray-400">
                      Run workflows to see performance data
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Daily Success Rate Table */}
            {dailyStats.length > 0 && (
              <Card className="mt-6">
                <CardHeader className="flex-row items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Daily Breakdown
                  </h2>
                  <span className="ml-auto text-[10px] text-gray-400">
                    Last 30 days
                  </span>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-2 pr-4 font-medium text-gray-500">
                          Date
                        </th>
                        <th className="pb-2 pr-4 font-medium text-gray-500">
                          Total
                        </th>
                        <th className="pb-2 pr-4 font-medium text-gray-500">
                          Succeeded
                        </th>
                        <th className="pb-2 pr-4 font-medium text-gray-500">
                          Failed
                        </th>
                        <th className="pb-2 font-medium text-gray-500">
                          Success Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyStats.slice(0, 14).map((day) => (
                        <tr
                          key={day.date}
                          className="border-b border-gray-50 transition hover:bg-gray-50/50"
                        >
                          <td className="py-2.5 pr-4 font-medium text-gray-700">
                            {new Date(day.date).toLocaleDateString("en", {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-2.5 pr-4 tabular-nums text-gray-600">
                            {day.total}
                          </td>
                          <td className="py-2.5 pr-4 tabular-nums text-emerald-600">
                            {day.succeeded}
                          </td>
                          <td className="py-2.5 pr-4 tabular-nums text-red-500">
                            {day.failed}
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-gray-100">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    (day.success_rate ?? 0) >= 80
                                      ? "bg-emerald-500"
                                      : (day.success_rate ?? 0) >= 50
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${day.success_rate ?? 0}%`,
                                  }}
                                />
                              </div>
                              <span className="tabular-nums text-gray-500">
                                {day.success_rate ?? 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
