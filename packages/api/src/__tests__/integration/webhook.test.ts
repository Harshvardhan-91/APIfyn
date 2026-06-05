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

import request from "supertest";
import { app } from "../../index";

beforeEach(() => {
  resetAllMocks();
  mockEnqueue.mockReset();
});

describe("POST /api/webhooks/test/:workflowId", () => {
  it("enqueues a test workflow execution and returns 202", async () => {
    mockEnqueue.mockResolvedValue("exec-test-123");

    const res = await request(app).post("/api/webhooks/test/wf-123");

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.executionId).toBe("exec-test-123");
    expect(res.body.payload).toBeDefined();
    expect(res.body.payload.repository.name).toBe("test-repo");
    expect(mockEnqueue).toHaveBeenCalledWith(
      "wf-123",
      "github-trigger",
      expect.objectContaining({ ref: "refs/heads/main" }),
    );
  });

  it("returns 500 when enqueue fails", async () => {
    mockEnqueue.mockRejectedValue(new Error("Workflow not found or inactive"));

    const res = await request(app).post("/api/webhooks/test/bad-wf");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/webhooks/github/:workflowId", () => {
  it("accepts a GitHub webhook payload", async () => {
    mockEnqueue.mockResolvedValue("exec-gh-1");

    const res = await request(app)
      .post("/api/webhooks/github/wf-gh")
      .set("x-github-event", "push")
      .send({
        ref: "refs/heads/main",
        repository: { full_name: "org/repo" },
      });

    expect(res.status).toBe(202);
    expect(res.body.executionId).toBe("exec-gh-1");
    expect(mockEnqueue).toHaveBeenCalledWith(
      "wf-gh",
      "github-trigger",
      expect.objectContaining({
        ref: "refs/heads/main",
        _githubEvent: "push",
      }),
    );
  });
});

describe("POST /api/webhooks/inbound/:workflowId", () => {
  it("accepts a generic inbound webhook", async () => {
    mockEnqueue.mockResolvedValue("exec-inbound-1");

    const res = await request(app)
      .post("/api/webhooks/inbound/wf-generic")
      .send({ data: "custom-payload" });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(mockEnqueue).toHaveBeenCalledWith(
      "wf-generic",
      "webhook-trigger",
      expect.objectContaining({ data: "custom-payload" }),
    );
  });
});

describe("POST /api/webhooks/typeform/:workflowId", () => {
  it("accepts a Typeform webhook", async () => {
    mockEnqueue.mockResolvedValue("exec-tf-1");

    const res = await request(app)
      .post("/api/webhooks/typeform/wf-tf")
      .send({ form_response: { answers: [] } });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
  });
});
