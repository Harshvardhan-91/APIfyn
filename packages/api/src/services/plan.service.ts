import { prisma } from "../db";
import { CacheService } from "./cache.service";
import { createLogger } from "../utils/logger";

const logger = createLogger();

const PLAN_LIMITS_TTL = 120; // 2 minutes
const STARTER_PLAN_TTL = 3600; // 1 hour

export type PlanLimits = {
  planName: string;
  planSlug: string;
  workflowsLimit: number; // -1 = unlimited
  apiCallsLimit: number;  // -1 = unlimited
  workflowsUsed: number;
  apiCallsUsed: number;
};

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const cacheKey = `cache:plan-limits:${userId}`;
  const cached = await CacheService.get<PlanLimits>(cacheKey);
  if (cached) return cached;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  const hasPaidPlan =
    subscription &&
    ["ACTIVE", "AUTHENTICATED"].includes(subscription.status);

  let plan = hasPaidPlan ? subscription.plan : null;

  if (!plan) {
    plan = await CacheService.get<typeof plan>(`cache:plan:starter`);
    if (!plan) {
      plan = await prisma.plan.findUnique({ where: { slug: "starter" } });
      if (plan) {
        await CacheService.set("cache:plan:starter", plan, STARTER_PLAN_TTL);
      }
    }
  }

  const workflowsUsed = await prisma.workflow.count({ where: { userId } });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiCallsUsed: true, apiCallsResetAt: true },
  });

  let apiCallsUsed = user?.apiCallsUsed ?? 0;
  if (user?.apiCallsResetAt && new Date() > user.apiCallsResetAt) {
    const nextReset = new Date(user.apiCallsResetAt);
    while (nextReset < new Date()) nextReset.setMonth(nextReset.getMonth() + 1);
    await prisma.user.update({
      where: { id: userId },
      data: { apiCallsUsed: 0, apiCallsResetAt: nextReset },
    });
    apiCallsUsed = 0;
  }

  const limits: PlanLimits = {
    planName: plan?.name ?? "Starter",
    planSlug: plan?.slug ?? "starter",
    workflowsLimit: plan?.workflowsLimit ?? 2,
    apiCallsLimit: plan?.apiCallsLimit ?? 100,
    workflowsUsed,
    apiCallsUsed,
  };

  await CacheService.set(cacheKey, limits, PLAN_LIMITS_TTL);
  return limits;
}

export function canCreateWorkflow(limits: PlanLimits): boolean {
  if (limits.workflowsLimit === -1) return true;
  return limits.workflowsUsed < limits.workflowsLimit;
}

export function canExecuteWorkflow(limits: PlanLimits): boolean {
  if (limits.apiCallsLimit === -1) return true;
  return limits.apiCallsUsed < limits.apiCallsLimit;
}

export async function incrementApiCalls(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { apiCallsUsed: { increment: 1 } },
  });
}
