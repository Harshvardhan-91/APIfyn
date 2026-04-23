"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { usePayment } from "@/components/providers/payment-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFetch } from "@/hooks/use-fetch";
import type { ApiResult, Workflow as WorkflowType } from "@/lib/api/types";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Crown,
  Sparkles,
  Star,
  Workflow,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const PLAN_BADGE: Record<
  string,
  { label: string; icon: LucideIcon; bg: string; text: string }
> = {
  starter: {
    label: "Free",
    icon: Zap,
    bg: "bg-gray-700",
    text: "text-gray-200",
  },
  professional: {
    label: "Pro",
    icon: Crown,
    bg: "bg-amber-500",
    text: "text-white",
  },
  enterprise: {
    label: "Enterprise",
    icon: Sparkles,
    bg: "bg-violet-600",
    text: "text-white",
  },
};

export function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { plan, usage } = usePayment();
  const { data } =
    useFetch<ApiResult<{ workflows: WorkflowType[] }>>("/api/workflow");
  const workflows = data?.workflows ?? [];
  const totalRuns = workflows.reduce(
    (total, workflow) => total + (workflow.totalRuns ?? 0),
    0,
  );

  const badge = PLAN_BADGE[plan?.slug ?? "starter"] ?? PLAN_BADGE.starter;
  const BadgeIcon = badge.icon;
  const isFree = !plan || plan.slug === "starter";

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-20 sm:px-6 lg:px-8">
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
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold">
                  {user?.displayName ?? "APIfyn User"}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text}`}
                >
                  <BadgeIcon className="h-3 w-3" />
                  {badge.label}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-gray-300">{user?.email}</p>
              {user?.createdAt ? (
                <p className="mt-0.5 text-xs text-gray-400">
                  Member since{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              ) : null}
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

      {/* Plan usage card */}
      {plan && usage ? (
        <Card className="mt-5">
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">
                  {plan.name} Plan
                </h3>
              </div>
              {isFree ? (
                <Button
                  variant="secondary"
                  className="text-xs"
                  onClick={() => router.push("/pricing")}
                >
                  Upgrade <ArrowUpRight className="h-3 w-3" />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <UsageBar
                label="Workflows"
                used={usage.workflows}
                limit={plan.workflowsLimit}
              />
              <UsageBar
                label="API Calls / month"
                used={usage.apiCalls}
                limit={plan.apiCallsLimit}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
      </div>
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

function UsageBar({
  label,
  used,
  limit,
}: { label: string; used: number; limit: number }) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-medium text-gray-600">{label}</span>
        <span className="text-gray-400">
          {used} / {unlimited ? "\u221e" : limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200">
        <div
          className={`h-1.5 rounded-full transition-all ${
            pct >= 100
              ? "bg-red-500"
              : pct >= 80
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
