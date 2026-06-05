import { prismaMock, resetAllMocks } from "../mocks/prisma";
import {
  canCreateWorkflow,
  canExecuteWorkflow,
  getUserPlanLimits,
  incrementApiCalls,
  type PlanLimits,
} from "../../services/plan.service";

beforeEach(() => {
  resetAllMocks();
});

describe("canCreateWorkflow", () => {
  it("returns true when under limit", () => {
    const limits: PlanLimits = {
      planName: "Free",
      planSlug: "starter",
      workflowsLimit: 5,
      apiCallsLimit: 500,
      workflowsUsed: 2,
      apiCallsUsed: 0,
    };
    expect(canCreateWorkflow(limits)).toBe(true);
  });

  it("returns false when at limit", () => {
    const limits: PlanLimits = {
      planName: "Free",
      planSlug: "starter",
      workflowsLimit: 5,
      apiCallsLimit: 500,
      workflowsUsed: 5,
      apiCallsUsed: 0,
    };
    expect(canCreateWorkflow(limits)).toBe(false);
  });

  it("returns false when over limit", () => {
    const limits: PlanLimits = {
      planName: "Free",
      planSlug: "starter",
      workflowsLimit: 5,
      apiCallsLimit: 500,
      workflowsUsed: 10,
      apiCallsUsed: 0,
    };
    expect(canCreateWorkflow(limits)).toBe(false);
  });

  it("returns true when limit is -1 (unlimited)", () => {
    const limits: PlanLimits = {
      planName: "Business",
      planSlug: "enterprise",
      workflowsLimit: -1,
      apiCallsLimit: 50000,
      workflowsUsed: 9999,
      apiCallsUsed: 0,
    };
    expect(canCreateWorkflow(limits)).toBe(true);
  });
});

describe("canExecuteWorkflow", () => {
  it("returns true when under API call limit", () => {
    const limits: PlanLimits = {
      planName: "Pro",
      planSlug: "professional",
      workflowsLimit: 25,
      apiCallsLimit: 10000,
      workflowsUsed: 5,
      apiCallsUsed: 100,
    };
    expect(canExecuteWorkflow(limits)).toBe(true);
  });

  it("returns false when at API call limit", () => {
    const limits: PlanLimits = {
      planName: "Free",
      planSlug: "starter",
      workflowsLimit: 5,
      apiCallsLimit: 500,
      workflowsUsed: 2,
      apiCallsUsed: 500,
    };
    expect(canExecuteWorkflow(limits)).toBe(false);
  });

  it("returns true when API call limit is -1 (unlimited)", () => {
    const limits: PlanLimits = {
      planName: "Business",
      planSlug: "enterprise",
      workflowsLimit: -1,
      apiCallsLimit: -1,
      workflowsUsed: 100,
      apiCallsUsed: 999999,
    };
    expect(canExecuteWorkflow(limits)).toBe(true);
  });
});

describe("getUserPlanLimits", () => {
  it("returns free plan limits when user has no subscription", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    prismaMock.plan.findUnique.mockResolvedValue({
      id: "free-plan",
      name: "Free",
      slug: "starter",
      workflowsLimit: 5,
      apiCallsLimit: 500,
    });
    prismaMock.workflow.count.mockResolvedValue(2);
    prismaMock.user.findUnique.mockResolvedValue({
      apiCallsUsed: 50,
      apiCallsResetAt: new Date(Date.now() + 86400000),
    });

    const limits = await getUserPlanLimits("user-123");

    expect(limits.planName).toBe("Free");
    expect(limits.planSlug).toBe("starter");
    expect(limits.workflowsLimit).toBe(5);
    expect(limits.apiCallsLimit).toBe(500);
    expect(limits.workflowsUsed).toBe(2);
    expect(limits.apiCallsUsed).toBe(50);
  });

  it("returns paid plan limits when user has active subscription", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      id: "sub-1",
      status: "ACTIVE",
      plan: {
        name: "Pro",
        slug: "professional",
        workflowsLimit: 25,
        apiCallsLimit: 10000,
      },
    });
    prismaMock.workflow.count.mockResolvedValue(10);
    prismaMock.user.findUnique.mockResolvedValue({
      apiCallsUsed: 200,
      apiCallsResetAt: new Date(Date.now() + 86400000),
    });

    const limits = await getUserPlanLimits("user-456");

    expect(limits.planName).toBe("Pro");
    expect(limits.planSlug).toBe("professional");
    expect(limits.workflowsLimit).toBe(25);
    expect(limits.apiCallsLimit).toBe(10000);
  });

  it("resets API calls when past reset date", async () => {
    const pastDate = new Date(Date.now() - 86400000);
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    prismaMock.plan.findUnique.mockResolvedValue({
      name: "Free",
      slug: "starter",
      workflowsLimit: 5,
      apiCallsLimit: 500,
    });
    prismaMock.workflow.count.mockResolvedValue(1);
    prismaMock.user.findUnique.mockResolvedValue({
      apiCallsUsed: 450,
      apiCallsResetAt: pastDate,
    });
    prismaMock.user.update.mockResolvedValue({});

    const limits = await getUserPlanLimits("user-789");

    expect(limits.apiCallsUsed).toBe(0);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-789" },
        data: expect.objectContaining({ apiCallsUsed: 0 }),
      }),
    );
  });

  it("returns fallback defaults when plan not found", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    prismaMock.plan.findUnique.mockResolvedValue(null);
    prismaMock.workflow.count.mockResolvedValue(0);
    prismaMock.user.findUnique.mockResolvedValue({
      apiCallsUsed: 0,
      apiCallsResetAt: new Date(Date.now() + 86400000),
    });

    const limits = await getUserPlanLimits("user-new");

    expect(limits.planName).toBe("Starter");
    expect(limits.workflowsLimit).toBe(2);
    expect(limits.apiCallsLimit).toBe(100);
  });
});

describe("incrementApiCalls", () => {
  it("increments API call counter for user", async () => {
    prismaMock.user.update.mockResolvedValue({});

    await incrementApiCalls("user-123");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-123" },
      data: { apiCallsUsed: { increment: 1 } },
    });
  });
});
