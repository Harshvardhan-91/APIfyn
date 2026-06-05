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

import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../index";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "apifyn-admin-fallback-secret";

function makeAdminToken() {
  return jwt.sign({ role: "admin" }, ADMIN_SECRET, { expiresIn: "4h" });
}

beforeEach(() => {
  resetAllMocks();
});

describe("POST /api/admin/login", () => {
  it("returns admin token with correct password", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: ADMIN_SECRET });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it("returns 401 with wrong password", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: "wrong-password-definitely" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/admin/stats", () => {
  it("returns platform stats with admin token", async () => {
    prismaMock.user.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(15);
    prismaMock.workflow.count.mockResolvedValue(50);
    prismaMock.workflowExecution.count.mockResolvedValue(500);
    prismaMock.integration.count.mockResolvedValue(30);
    prismaMock.subscription.count.mockResolvedValue(10);

    const token = makeAdminToken();
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.stats.totalUsers).toBe(100);
    expect(res.body.stats.totalWorkflows).toBe(50);
    expect(res.body.stats.totalExecutions).toBe(500);
  });

  it("returns 401 without admin token", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("returns 401 with non-admin JWT", async () => {
    const userToken = jwt.sign(
      { userId: "u1", email: "u@test.com" },
      "dev-secret",
    );
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/users", () => {
  it("returns paginated user list", async () => {
    const users = [
      {
        id: "u-1",
        email: "user1@test.com",
        displayName: "User 1",
        photoURL: null,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        apiCallsUsed: 10,
        _count: { workflows: 2, executions: 5, integrations: 1 },
        subscription: null,
      },
    ];

    prismaMock.user.findMany.mockResolvedValue(users);
    prismaMock.user.count.mockResolvedValue(1);

    const token = makeAdminToken();
    const res = await request(app)
      .get("/api/admin/users?page=1&limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.pagination.page).toBe(1);
  });
});

describe("GET /api/admin/users/:userId/workflows", () => {
  it("returns user workflows", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u-1",
      email: "user1@test.com",
      displayName: "User 1",
    });
    prismaMock.workflow.findMany.mockResolvedValue([
      {
        id: "wf-1",
        name: "WF 1",
        isActive: true,
        triggerType: "MANUAL",
        totalRuns: 3,
        createdAt: new Date(),
        _count: { executions: 3 },
      },
    ]);

    const token = makeAdminToken();
    const res = await request(app)
      .get("/api/admin/users/u-1/workflows")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.workflows).toHaveLength(1);
    expect(res.body.user.email).toBe("user1@test.com");
  });

  it("returns 404 for non-existent user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const token = makeAdminToken();
    const res = await request(app)
      .get("/api/admin/users/non-existent/workflows")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
