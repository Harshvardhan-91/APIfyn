"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/hooks/use-fetch";
import { apiFetch } from "@/lib/api/client";
import type { ApiResult, Workflow } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit,
  Pause,
  Play,
  Trash2,
  Webhook,
  XCircle,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const executionIcon = (status: string) => {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "FAILED":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "RUNNING":
      return <Activity className="h-4 w-4 animate-pulse text-blue-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const executionStyle = (status: string) => {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "bg-red-50 text-red-700";
    case "RUNNING":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const workflowId = params.id;
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data, isLoading, mutate } = useFetch<
    ApiResult<{ workflow: Workflow }>
  >(`/api/workflow/${workflowId}`);
  const workflow = data?.workflow;

  async function toggleStatus() {
    if (!user?.token || !workflow || toggling) return;
    setToggling(true);
    try {
      await apiFetch(`/api/workflow/${workflowId}`, {
        method: "PATCH",
        token: user.token,
        body: JSON.stringify({ isActive: !workflow.isActive }),
      });
      await mutate();
    } finally {
      setToggling(false);
    }
  }

  async function testWorkflow() {
    if (!user?.token || testing) return;
    setTesting(true);
    toast("Running test...", "info");
    try {
      await apiFetch(`/api/webhooks/test/${workflowId}`, {
        method: "POST",
        token: user.token,
      });

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await mutate();
        if (attempts >= 10) {
          clearInterval(poll);
          toast("Test completed", "success");
          setTesting(false);
        }
      }, 1500);

      setTimeout(async () => {
        clearInterval(poll);
        await mutate();
        setTesting(false);
        toast("Test workflow completed", "success");
      }, 8000);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Test failed", "error");
      setTesting(false);
    }
  }

  async function deleteWorkflow() {
    if (!user?.token || deleting) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/workflow/${workflowId}`, {
        method: "DELETE",
        token: user.token,
      });
      toast("Workflow deleted", "success");
      router.push("/workflows");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to delete", "error");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-500">Loading workflow...</p>
        </div>
      </main>
    );
  }

  if (!workflow) {
    return (
      <main className="min-h-screen pt-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <AlertCircle className="h-6 w-6 text-gray-400" />
          </span>
          <h1 className="text-base font-semibold text-gray-900">
            Workflow not found
          </h1>
          <p className="mb-6 mt-2 text-sm text-gray-500">
            This workflow could not be loaded.
          </p>
          <Button variant="secondary" onClick={() => router.push("/workflows")}>
            Back to Workflows
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <Button
              variant="ghost"
              className="px-2"
              onClick={() => router.push("/workflows")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
                <Zap className="h-5 w-5 text-gray-600" />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                  {workflow.name}
                </h1>
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    workflow.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {workflow.isActive ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                  {workflow.isActive ? "Active" : "Paused"}
                </span>
              </div>
            </div>
          </div>

          <p className="mb-5 text-sm text-gray-500">
            {workflow.description ?? "No description available"}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={workflow.isActive ? "secondary" : "primary"}
              onClick={toggleStatus}
              disabled={toggling}
            >
              {toggling ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : workflow.isActive ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {workflow.isActive ? "Pause" : "Activate"}
            </Button>
            <Button
              variant="secondary"
              onClick={testWorkflow}
              disabled={testing}
            >
              {testing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              {testing ? "Running..." : "Test"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push(`/workflows/${workflowId}/edit`)}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            {confirmDelete ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5">
                <span className="text-xs text-red-700">Delete this workflow?</span>
                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  onClick={deleteWorkflow}
                  disabled={deleting}
                >
                  {deleting ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    "Confirm"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="px-2 py-1.5 text-xs"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="danger"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            {
              label: "Total Runs",
              value: workflow.totalRuns ?? 0,
              icon: Activity,
              bg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              label: "Successful",
              value: workflow.successfulRuns ?? 0,
              icon: CheckCircle,
              bg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
            {
              label: "Failed",
              value: workflow.failedRuns ?? 0,
              icon: XCircle,
              bg: "bg-red-50",
              iconColor: "text-red-600",
            },
            {
              label: "Avg Time",
              value: workflow.avgExecutionTime
                ? `${workflow.avgExecutionTime}ms`
                : "N/A",
              icon: Clock,
              bg: "bg-gray-100",
              iconColor: "text-gray-600",
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${stat.bg}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </span>
                <div>
                  <p className="text-xl font-bold tracking-tight text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">
                Recent Executions
              </h2>
            </CardHeader>
            <CardContent>
              {workflow.executions?.length ? (
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {workflow.executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        {executionIcon(execution.status)}
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${executionStyle(execution.status)}`}
                          >
                            {execution.status}
                          </span>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(execution.startedAt)}
                          </p>
                        </div>
                      </div>
                      {execution.errorMessage ? (
                        <p className="max-w-sm text-right text-xs text-red-500">
                          {execution.errorMessage}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                    <Activity className="h-5 w-5 text-gray-400" />
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900">
                    No executions yet
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Test this workflow or trigger its webhook to see runs here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Webhook className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                Webhook Setup
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                Use this endpoint for GitHub webhooks or backend tests.
              </p>
              <div className="mt-4 break-all rounded-xl bg-gray-50 p-3 font-mono text-xs text-gray-600">
                /api/webhooks/github/{workflow.id}
              </div>
              <Button
                className="mt-4 w-full"
                variant="secondary"
                onClick={testWorkflow}
                disabled={testing}
              >
                {testing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                {testing ? "Running..." : "Test Workflow"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
