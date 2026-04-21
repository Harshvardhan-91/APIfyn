"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { useFetch } from "@/hooks/use-fetch";
import type { ApiResult, Workflow as WorkflowType } from "@/lib/api/types";
import type { LucideIcon } from "lucide-react";
import { Activity, CheckCircle2, Workflow } from "lucide-react";
import Image from "next/image";

export function ProfilePage() {
  const { user } = useAuth();
  const { data } =
    useFetch<ApiResult<{ workflows: WorkflowType[] }>>("/api/workflow");
  const workflows = data?.workflows ?? [];
  const totalRuns = workflows.reduce(
    (total, workflow) => total + (workflow.totalRuns ?? 0),
    0,
  );

  return (
    <main className="mx-auto max-w-4xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Profile
      </h1>
      <Card className="mt-6 overflow-hidden">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
          <div className="flex items-center gap-5">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? "User"}
                width={72}
                height={72}
                className="rounded-2xl border-4 border-white/20"
              />
            ) : (
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-4 border-white/20 bg-white/10 text-2xl font-bold">
                {(user?.displayName ?? user?.email ?? "U")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
            <div>
              <h2 className="text-xl font-bold">
                {user?.displayName ?? "APIfyn User"}
              </h2>
              <p className="mt-0.5 text-sm text-gray-300">{user?.email}</p>
            </div>
          </div>
        </div>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat
              label="Total Workflows"
              value={workflows.length}
              icon={Workflow}
            />
            <Stat label="Total Executions" value={totalRuns} icon={Activity} />
            <Stat
              label="Active Workflows"
              value={workflows.filter((workflow) => workflow.isActive).length}
              icon={CheckCircle2}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <Icon className="mb-3 h-5 w-5 text-gray-500" />
      <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
