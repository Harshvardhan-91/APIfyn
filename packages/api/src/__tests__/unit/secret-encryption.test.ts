import crypto from "node:crypto";

const TEST_KEY = crypto.randomBytes(32).toString("hex");

beforeAll(() => {
  process.env.SECRETS_ENCRYPTION_KEY = TEST_KEY;
});

afterAll(() => {
  delete process.env.SECRETS_ENCRYPTION_KEY;
});

describe("secret-encryption", () => {
  let encryptSecret: typeof import("../../utils/secret-encryption").encryptSecret;
  let decryptSecret: typeof import("../../utils/secret-encryption").decryptSecret;
  let isSecretsEncryptionConfigured: typeof import("../../utils/secret-encryption").isSecretsEncryptionConfigured;
  let keyHint: typeof import("../../utils/secret-encryption").keyHint;

  beforeAll(async () => {
    const mod = await import("../../utils/secret-encryption");
    encryptSecret = mod.encryptSecret;
    decryptSecret = mod.decryptSecret;
    isSecretsEncryptionConfigured = mod.isSecretsEncryptionConfigured;
    keyHint = mod.keyHint;
  });

  it("isSecretsEncryptionConfigured returns true with valid key", () => {
    expect(isSecretsEncryptionConfigured()).toBe(true);
  });

  it("encrypt/decrypt round-trip preserves plaintext", () => {
    const secrets = [
      "sk-proj-abc123def456",
      "short",
      "a".repeat(1000),
      "special chars: 🔑 ñ ü",
    ];

    for (const secret of secrets) {
      const encrypted = encryptSecret(secret);
      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(secret);
    }
  });

  it("each encryption produces different ciphertext (random IV)", () => {
    const plain = "sk-test-key-12345";
    const enc1 = encryptSecret(plain);
    const enc2 = encryptSecret(plain);
    expect(enc1).not.toBe(enc2);

    expect(decryptSecret(enc1)).toBe(plain);
    expect(decryptSecret(enc2)).toBe(plain);
  });

  it("decryptSecret throws on tampered ciphertext", () => {
    const encrypted = encryptSecret("sk-test-valid");
    const buf = Buffer.from(encrypted, "base64");
    buf[buf.length - 1] ^= 0xff;
    const tampered = buf.toString("base64");

    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("decryptSecret throws on too-short payload", () => {
    const tooShort = Buffer.from("short").toString("base64");
    expect(() => decryptSecret(tooShort)).toThrow("Invalid encrypted payload");
  });

  describe("keyHint", () => {
    it("returns 'Not set' for null/undefined", () => {
      expect(keyHint(null)).toBe("Not set");
      expect(keyHint(undefined)).toBe("Not set");
      expect(keyHint("")).toBe("Not set");
    });

    it("returns dots for short keys", () => {
      expect(keyHint("12345678")).toBe("••••••••");
    });

    it("shows last 4 characters for longer keys", () => {
      expect(keyHint("sk-proj-abcdef1234")).toBe("sk-…1234");
    });
  });
});
