import OpenAI from "openai";
import { prisma } from "../../db";
import { createLogger } from "../../utils/logger";
import { decryptSecret, isSecretsEncryptionConfigured } from "../../utils/secret-encryption";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";
import { fillTemplate } from "../template";

const logger = createLogger();

function resolveApiKey(
  config: Record<string, unknown>,
  userKeyEnc: string | null,
): string | null {
  const useAccount = config.useOpenaiAccountKey !== false;
  if (useAccount) {
    if (userKeyEnc && isSecretsEncryptionConfigured()) {
      try {
        return decryptSecret(userKeyEnc);
      } catch (e) {
        logger.error("Failed to decrypt user OpenAI key", e);
        return null;
      }
    }
    return process.env.OPENAI_API_KEY?.trim() || null;
  }
  const blockEnc = config.openaiKeyEnc as string | undefined;
  if (blockEnc && isSecretsEncryptionConfigured()) {
    try {
      return decryptSecret(blockEnc);
    } catch (e) {
      logger.error("Failed to decrypt workflow OpenAI key", e);
      return null;
    }
  }
  return process.env.OPENAI_API_KEY?.trim() || null;
}

export class OpenAIActionHandler implements IntegrationHandler {
  blockId = "openai-action";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { openaiKeyEnc: true },
    });

    const apiKey = resolveApiKey(config, user?.openaiKeyEnc ?? null);
    if (!apiKey) {
      return {
        success: false,
        output: {},
        error:
          "No OpenAI API key: add one in Settings, set a per-workflow key on this block, or configure OPENAI_API_KEY on the server.",
      };
    }

    const model = (config.model as string) || "gpt-4o-mini";
    const systemPrompt = fillTemplate(
      String(config.systemPrompt ?? "You are a helpful assistant."),
      ctx,
    );
    const userMessage = fillTemplate(
      String(config.userMessage ?? "Summarize: {{commit_message}}"),
      ctx,
    );

    if (!userMessage.trim()) {
      return {
        success: false,
        output: {},
        error: "User message is empty after template resolution.",
      };
    }

    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: Math.min(2, Math.max(0, Number(config.temperature) || 0.3)),
        max_tokens: Math.min(4096, Math.max(1, Number(config.maxTokens) || 1000)),
      });

      const text = completion.choices[0]?.message?.content?.trim() ?? "";
      return {
        success: true,
        output: {
          text,
          openaiModel: model,
          usage: {
            promptTokens: completion.usage?.prompt_tokens,
            completionTokens: completion.usage?.completion_tokens,
          },
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OpenAI request failed";
      logger.error("openai-action error:", e);
      return { success: false, output: {}, error: msg };
    }
  }
}

IntegrationRegistry.register(new OpenAIActionHandler());
