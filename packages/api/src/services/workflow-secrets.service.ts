import {
  encryptSecret,
  isSecretsEncryptionConfigured,
} from "../utils/secret-encryption";
import { createLogger } from "../utils/logger";

const logger = createLogger();

type DefBlock = {
  id: string;
  type: string;
  config?: Record<string, unknown>;
};

type WorkflowDef = {
  blocks: DefBlock[];
  connections?: unknown;
  [key: string]: unknown;
};

/**
 * Strips sensitive fields before sending workflow JSON to the client.
 */
export function redactWorkflowDefinitionForClient(
  raw: unknown,
): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const def = raw as WorkflowDef;
  if (!Array.isArray(def.blocks)) return raw;
  return {
    ...def,
    blocks: def.blocks.map((block) => {
      if (block.type !== "openai-action" || !block.config) return block;
      const c = { ...block.config } as Record<string, unknown>;
      if (c.openaiKeyEnc) {
        c.openaiKeyStored = true;
        delete c.openaiKeyEnc;
      }
      delete c.openaiKeyInput;
      delete c.__openaiUnchanged;
      delete c.__openaiKeyClear;
      if (c.useOpenaiAccountKey === undefined) c.useOpenaiAccountKey = true;
      return { ...block, config: c };
    }),
  };
}

/**
 * Merges & encrypts OpenAI key fields for workflow create/update.
 */
export function processOpenaiSecretsOnSave(
  definition: unknown,
  previous: unknown,
): unknown {
  if (!isSecretsEncryptionConfigured()) {
    if (containsOpenaiKeyInput(definition)) {
      throw new Error(
        "SECRETS_ENCRYPTION_KEY is not configured (64 hex chars); cannot store OpenAI API keys.",
      );
    }
    return stripOpenaiClientOnlyFields(definition);
  }

  if (!definition || typeof definition !== "object") return definition;
  const def = JSON.parse(JSON.stringify(definition)) as WorkflowDef;
  if (!Array.isArray(def.blocks)) return definition;

  const prevBlocks = (
    (previous as WorkflowDef | null)?.blocks
  ) as DefBlock[] | undefined;
  const prevById = new Map(
    (prevBlocks ?? []).map((b) => [b.id, b.config ?? {}]),
  );

  for (const block of def.blocks) {
    if (block.type !== "openai-action") continue;
    const c: Record<string, unknown> = { ...(block.config || {}) };
    const prior = (prevById.get(block.id) || {}) as Record<string, unknown>;

    const useAccount = c.useOpenaiAccountKey !== false;
    const keyInput =
      typeof c.openaiKeyInput === "string" ? c.openaiKeyInput.trim() : "";
    const unchanged = c.__openaiUnchanged === true;
    const clear = c.__openaiKeyClear === true;

    delete c.openaiKeyInput;
    delete c.__openaiUnchanged;
    delete c.__openaiKeyClear;
    delete c.openaiKeyStored;

    if (clear) {
      delete c.openaiKeyEnc;
    } else if (useAccount) {
      delete c.openaiKeyEnc;
    } else if (keyInput) {
      c.openaiKeyEnc = encryptSecret(keyInput);
    } else if (unchanged && prior.openaiKeyEnc) {
      c.openaiKeyEnc = prior.openaiKeyEnc;
    } else if (!useAccount && !c.openaiKeyEnc && !keyInput) {
      logger.warn(
        `openai-action block ${block.id}: per-workflow key selected but no key set`,
      );
    }

    c.useOpenaiAccountKey = useAccount;
    block.config = c;
  }

  return def;
}

function containsOpenaiKeyInput(def: unknown): boolean {
  const def2 = def as WorkflowDef;
  if (!def2?.blocks) return false;
  return def2.blocks.some(
    (b) =>
      b.type === "openai-action" &&
      typeof b.config?.openaiKeyInput === "string" &&
      b.config.openaiKeyInput.trim().length > 0,
  );
}

function stripOpenaiClientOnlyFields(def: unknown): unknown {
  if (!def || typeof def !== "object") return def;
  const d = JSON.parse(JSON.stringify(def)) as WorkflowDef;
  if (!Array.isArray(d.blocks)) return def;
  for (const block of d.blocks) {
    if (block.type !== "openai-action" || !block.config) continue;
    const c = { ...(block.config as Record<string, unknown>) };
    delete c.openaiKeyInput;
    delete c.__openaiUnchanged;
    delete c.__openaiKeyClear;
    delete c.openaiKeyStored;
    block.config = c;
  }
  return d;
}
