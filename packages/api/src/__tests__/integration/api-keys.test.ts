import { prismaMock, resetAllMocks } from "../mocks/prisma";

const mockEnqueue = jest.fn();

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
    enqueueWorkflow: mockEnqueue,
  },
}));

import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../../index";
import { hashApiKey } from "../../services/api-key.service";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const API_KEY = "apf_test-key-0123456789abcdefghijklmnop";

const mockUser = {
  id: "user-test-1",
  googleId: "google-123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
  emailVerified: true,
  firstName: "Test",
  lastName: "User",
  company: null,
  jobTitle: null,
  apiCallsUsed: 0,
  apiCallsResetAt: new Date(),
  workflowsUsed: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
  openaiKeyEnc: null,
};

function sessionToken() {
  return jwt.sign({ userId: mockUser.id, email: mockUser.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function mockValidApiKey() {
  prismaMock.apiKey.findUnique.mockResolvedValue({
    id: "key-1",
    name: "Cursor",
    prefix: API_KEY.slice(0, 12),
    keyHash: hashApiKey(API_KEY),
    lastUsedAt: null,
    createdAt: new Date(),
    userId: mockUser.id,
    user: mockUser,
  });
  prismaMock.apiKey.update.mockResolvedValue({});
}

beforeEach(() => {
  resetAllMocks();
  mockEnqueue.mockReset();
  prismaMock.user.findUnique.mockResolvedValue(mockUser);
});

describe("API key authentication", () => {
  it("authenticates a request with a valid API key", async () => {
    mockValidApiKey();
    prismaMock.workflow.findMany.mockResolvedValue([]);
    prismaMock.workflowExecution.groupBy.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/workflow")
      .set("Authorization", `Bearer ${API_KEY}`);

    expect(res.status).toBe(200);
    expect(prismaMock.apiKey.findUnique).toHaveBeenCalledWith({
      where: { keyHash: hashApiKey(API_KEY) },
      include: { user: true },
    });
    expect(prismaMock.apiKey.update).toHaveBeenCalled();
  });

  it("rejects an unknown API key", async () => {
    prismaMock.apiKey.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/workflow")
      .set("Authorization", `Bearer ${API_KEY}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid API key");
  });

  it("does not let an API key delete the account", async () => {
    mockValidApiKey();

    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", `Bearer ${API_KEY}`);

    expect(res.status).toBe(403);
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });
});

describe("/api/api-keys", () => {
  it("creates a key, returns the plaintext once and stores only its hash", async () => {
    prismaMock.apiKey.count.mockResolvedValue(0);
    prismaMock.apiKey.create.mockImplementation(async ({ data }: any) => ({
      id: "key-new",
      name: data.name,
      prefix: data.prefix,
      lastUsedAt: null,
      createdAt: new Date(),
    }));

    const res = await request(app)
      .post("/api/api-keys")
      .set("Authorization", `Bearer ${sessionToken()}`)
      .send({ name: "Cursor laptop" });

    expect(res.status).toBe(201);
    expect(res.body.key).toMatch(/^apf_/);

    const stored = prismaMock.apiKey.create.mock.calls[0][0].data;
    expect(stored.keyHash).toBe(hashApiKey(res.body.key));
    expect(JSON.stringify(stored)).not.toContain(res.body.key);
    expect(res.body.key.startsWith(stored.prefix)).toBe(true);
  });

  it("rejects a missing name", async () => {
    const res = await request(app)
      .post("/api/api-keys")
      .set("Authorization", `Bearer ${sessionToken()}`)
      .send({ name: "  " });

    expect(res.status).toBe(400);
    expect(prismaMock.apiKey.create).not.toHaveBeenCalled();
  });

  it("enforces the per-user key limit", async () => {
    prismaMock.apiKey.count.mockResolvedValue(10);

    const res = await request(app)
      .post("/api/api-keys")
      .set("Authorization", `Bearer ${sessionToken()}`)
      .send({ name: "One too many" });

    expect(res.status).toBe(400);
    expect(prismaMock.apiKey.create).not.toHaveBeenCalled();
  });

  it("does not let an API key create more keys", async () => {
    mockValidApiKey();

    const res = await request(app)
      .post("/api/api-keys")
      .set("Authorization", `Bearer ${API_KEY}`)
      .send({ name: "Escalation" });

    expect(res.status).toBe(403);
    expect(prismaMock.apiKey.create).not.toHaveBeenCalled();
  });

  it("only revokes keys owned by the caller", async () => {
    prismaMock.apiKey.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .delete("/api/api-keys/someone-elses-key")
      .set("Authorization", `Bearer ${sessionToken()}`);

    expect(res.status).toBe(404);
    expect(prismaMock.apiKey.deleteMany).toHaveBeenCalledWith({
      where: { id: "someone-elses-key", userId: mockUser.id },
    });
  });
});

describe("POST /api/workflow/:id/run", () => {
  it("queues a run of an active workflow with the given payload", async () => {
    mockValidApiKey();
    prismaMock.workflow.findFirst.mockResolvedValue({ id: "wf-1", isActive: true });
    mockEnqueue.mockResolvedValue("exec-1");

    const res = await request(app)
      .post("/api/workflow/wf-1/run")
      .set("Authorization", `Bearer ${API_KEY}`)
      .send({ payload: { customer: { email: "a@b.com" } } });

    expect(res.status).toBe(202);
    expect(res.body.executionId).toBe("exec-1");
    expect(prismaMock.workflow.findFirst).toHaveBeenCalledWith({
      where: { id: "wf-1", userId: mockUser.id },
      select: { id: true, isActive: true },
    });
    expect(mockEnqueue).toHaveBeenCalledWith("wf-1", "manual", {
      customer: { email: "a@b.com" },
    });
  });

  it("returns 404 for a workflow the user does not own", async () => {
    prismaMock.workflow.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/workflow/wf-other/run")
      .set("Authorization", `Bearer ${sessionToken()}`);

    expect(res.status).toBe(404);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("returns 409 for a paused workflow", async () => {
    prismaMock.workflow.findFirst.mockResolvedValue({ id: "wf-1", isActive: false });

    const res = await request(app)
      .post("/api/workflow/wf-1/run")
      .set("Authorization", `Bearer ${sessionToken()}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("WORKFLOW_INACTIVE");
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("rejects a non-object payload", async () => {
    const res = await request(app)
      .post("/api/workflow/wf-1/run")
      .set("Authorization", `Bearer ${sessionToken()}`)
      .send({ payload: [1, 2, 3] });

    expect(res.status).toBe(400);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });
});

describe("GET /api/workflow/:id/executions/:executionId", () => {
  it("scopes the lookup to the caller", async () => {
    prismaMock.workflowExecution.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/workflow/wf-1/executions/exec-1")
      .set("Authorization", `Bearer ${sessionToken()}`);

    expect(res.status).toBe(404);
    expect(prismaMock.workflowExecution.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "exec-1", workflowId: "wf-1", userId: mockUser.id },
      }),
    );
  });
});
