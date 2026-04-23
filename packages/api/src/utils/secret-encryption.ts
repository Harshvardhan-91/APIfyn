import crypto from "node:crypto";

const IV_LEN = 16;
const AUTH_TAG_LEN = 16;
const ALGO = "aes-256-gcm";

function getKeyBuffer(): Buffer | null {
  const hex = process.env.SECRETS_ENCRYPTION_KEY?.trim();
  if (!hex || hex.length < 64) return null;
  try {
    return Buffer.from(hex, "hex");
  } catch {
    return null;
  }
}

export function isSecretsEncryptionConfigured(): boolean {
  const k = getKeyBuffer();
  return k !== null && k.length === 32;
}

function requireKeyBuffer(): Buffer {
  const k = getKeyBuffer();
  if (!k || k.length !== 32) {
    throw new Error(
      "SECRETS_ENCRYPTION_KEY must be set to 64 hex characters (32 bytes) for API key storage.",
    );
  }
  return k;
}

/**
 * Deterministic storage format: base64(iv(16) + tag(16) + ciphertext)
 */
export function encryptSecret(plain: string): string {
  const key = requireKeyBuffer();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(blob: string): string {
  const key = requireKeyBuffer();
  const buf = Buffer.from(blob, "base64");
  if (buf.length < IV_LEN + AUTH_TAG_LEN + 1) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
  const data = buf.subarray(IV_LEN + AUTH_TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

export function keyHint(plain: string | null | undefined): string {
  if (!plain) return "Not set";
  if (plain.length <= 8) return "••••••••";
  return `sk-…${plain.slice(-4)}`;
}
