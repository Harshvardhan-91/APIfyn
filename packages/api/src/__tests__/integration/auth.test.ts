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

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

function makeToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });
}

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

beforeEach(() => {
  resetAllMocks();
  prismaMock.user.findUnique.mockResolvedValue(mockUser);
});

describe("GET /api/auth/me", () => {
  it("returns user data with valid token", async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce({
        ...mockUser,
        _count: { workflows: 3, executions: 10, integrations: 2 },
      });

    const token = makeToken(mockUser.id, mockUser.email);
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe("test@example.com");
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token-abc");

    expect(res.status).toBe(401);
  });

  it("returns 401 when user not found in DB", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const token = makeToken("non-existent-user", "ghost@test.com");
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/signout", () => {
  it("returns success with valid token", async () => {
    const token = makeToken(mockUser.id, mockUser.email);
    const res = await request(app)
      .post("/api/auth/signout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("DELETE /api/auth/delete-account", () => {
  it("deletes account and returns success", async () => {
    prismaMock.user.delete.mockResolvedValue(mockUser);

    const token = makeToken(mockUser.id, mockUser.email);
    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: mockUser.id },
    });
  });
});

describe("POST /api/auth/google", () => {
  it("returns 400 when credential is missing", async () => {
    const res = await request(app).post("/api/auth/google").send({});

    expect(res.status).toBe(400);
  });
});
