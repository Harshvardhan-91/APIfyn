import crypto from "node:crypto";
import type { User } from "@prisma/client";
import { prisma } from "../db";

export const API_KEY_PREFIX = "apf_";
export const MAX_API_KEYS_PER_USER = 10;
const PREFIX_DISPLAY_LENGTH = 12;
const LAST_USED_WRITE_INTERVAL_MS = 60_000;

export function isApiKey(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX);
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${crypto.randomBytes(32).toString("base64url")}`;
}

export async function createApiKey(userId: string, name: string) {
  const key = generateApiKey();
  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      prefix: key.slice(0, PREFIX_DISPLAY_LENGTH),
      keyHash: hashApiKey(key),
      userId,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
  return { key, apiKey };
}

export async function findUserByApiKey(key: string): Promise<User | null> {
  const record = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(key) },
    include: { user: true },
  });
  if (!record) return null;

  const now = Date.now();
  if (
    !record.lastUsedAt ||
    now - record.lastUsedAt.getTime() > LAST_USED_WRITE_INTERVAL_MS
  ) {
    await prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date(now) },
    });
  }

  return record.user;
}
