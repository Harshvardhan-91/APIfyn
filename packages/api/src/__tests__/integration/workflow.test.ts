import { prismaMock, resetAllMocks } from "../mocks/prisma";

jest.mock("../../queue/worker", () => ({
  createWorkflowWorker: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock("../../services/keepAlive.service", () => ({
  KeepAliveService: {
    start: jest.fn(),
    stop: jest.fn(),
    getStatus: jest.fn(() => ({ running: false, interval: 600000 })),
  },
}));

jest.mock("../../queue/connection", () => ({
  getRedisConnection: jest.fn(() => ({
    on: jest.fn(),
    quit: jest.fn(),
  })),
  closeRedis: jest.fn(),
}));

jest.mock("../../services/webhook.service", () => ({
  WebhookService: {
    createGitHubWebhook: jest.fn(),
    enqueueWorkflow: jest.fn(),
  },
}));

jest.mock("../../services/workflow-secrets.service", () => ({
  processOpenaiSecretsOnSave: jest.fn((def: any) => def),
  redactWorkflowDefinitionForClient: jest.fn((def: any) => def),
}));

import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../index";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

function makeToken(userId: string) {
  return jwt.sign({ userId, email: "test@test.com" }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

const mockUser = {
  id: "user-wf-1",
  googleId: "g-1",
  email: "wf@test.com",
  displayName: "WF User",
  photoURL: null,
  emailVerified: true,
  firstName: null,
  lastName: null,
  company: null,
  jobTitle: null,
  apiCallsUsed: 0,
  apiCallsResetAt: new Date(Date.now() + 86400000),
  workflowsUsed: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
  openaiKeyEnc: null,
};

const token = makeToken(mockUser.id);

beforeEach(() => {
  resetAllMocks();
  prismaMock.user.findUnique.mockResolvedValue(mockUser);
});

describe("GET /api/workflow", () => {
  it("returns workflows for authenticated user", async () => {
    const workflows = [
      {
        id: "wf-1",
        name: "Test Workflow",
        description: "A test",
        definition: { blocks: [], connections: [] },
        category: "general",
        triggerType: "MANUAL",
        isActive: true,
        isPublic: false,
        status: "DRAFT",
        tags: [],
        totalRuns: 0,
        lastRunAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
      },
    ];

    prismaMock.workflow.findMany.mockResolvedValue(workflows);
    prismaMock.workflowExecution.groupBy.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/workflow")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.workflows).toHaveLength(1);
    expect(res.body.workflows[0].name).toBe("Test Workflow");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/workflow");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/workflow", () => {
  it("creates a workflow with valid data", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    prismaMock.plan.findUnique.mockResolvedValue({
      name: "Free",
      slug: "starter",
      workflowsLimit: 5,
      apiCallsLimit: 500,
    });
    prismaMock.workflow.count.mockResolvedValue(1);

    const created = {
      id: "wf-new",
      name: "New Workflow",
      description: "Created via test",
      definition: { blocks: [], connections: [] },
      category: "general",
      triggerType: "MANUAL",
      isActive: true,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: mockUser.id,
    };
    prismaMock.workflow.create.mockResolvedValue(created);

    const res = await request(app)
      .post("/api/workflow")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "New Workflow",
        description: "Created via test",
        definition: { blocks: [], connections: [] },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.workflow.name).toBe("New Workflow");
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/workflow")
      .set("Authorization", `Bearer ${token}`)
      .send({ definition: {} });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 403 when workflow limit reached", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    prismaMock.plan.findUnique.mockResolvedValue({
      name: "Free",
      slug: "starter",
      workflowsLimit: 5,
      apiCallsLimit: 500,
    });
    prismaMock.workflow.count.mockResolvedValue(5);

    const res = await request(app)
      .post("/api/workflow")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Over Limit",
        definition: { blocks: [] },
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("WORKFLOW_LIMIT_REACHED");
  });
});

describe("GET /api/workflow/:id", () => {
  it("returns workflow with execution stats", async () => {
    const workflow = {
      id: "wf-detail",
      name: "Detail Workflow",
      description: "",
      definition: { blocks: [], connections: [] },
      category: "general",
      triggerType: "MANUAL",
      isActive: true,
      isPublic: false,
      tags: [],
      totalRuns: 5,
      lastRunAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: mockUser.id,
    };

    prismaMock.workflow.findFirst.mockResolvedValue(workflow);
    prismaMock.workflowExecution.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2);
    prismaMock.workflowExecution.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/workflow/wf-detail")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.workflow.totalRuns).toBe(10);
    expect(res.body.workflow.successfulRuns).toBe(8);
    expect(res.body.workflow.failedRuns).toBe(2);
  });

  it("returns 404 for non-existent workflow", async () => {
    prismaMock.workflow.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/workflow/non-existent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/workflow/:id", () => {
  it("deletes a workflow", async () => {
    prismaMock.workflow.deleteMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .delete("/api/workflow/wf-del")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 404 when workflow not found", async () => {
    prismaMock.workflow.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .delete("/api/workflow/non-existent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/workflow/:id", () => {
  it("toggles workflow active status", async () => {
    prismaMock.workflow.updateMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .patch("/api/workflow/wf-toggle")
      .set("Authorization", `Bearer ${token}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("paused");
  });
});
