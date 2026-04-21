import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

export class TypeformTriggerHandler implements IntegrationHandler {
  blockId = "typeform-trigger";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const payload = ctx.triggerPayload;

    const formDef = payload.form_response as Record<string, unknown> | undefined;
    const definition = formDef?.definition as Record<string, unknown> | undefined;

    const formId = String(
      (formDef as Record<string, unknown>)?.form_id ??
        (definition as Record<string, unknown>)?.id ??
        payload.form_id ??
        "",
    );

    const filterFormId = config.formIdFilter as string;
    if (filterFormId && formId && formId !== filterFormId) {
      return {
        success: true,
        output: {
          skipped: true,
          reason: `Form ID "${formId}" does not match filter "${filterFormId}"`,
        },
      };
    }

    const answers = (formDef?.answers ?? payload.answers ?? []) as unknown[];
    const submittedAt = String(
      formDef?.submitted_at ?? payload.submitted_at ?? "",
    );
    const responseId = String(
      formDef?.token ?? payload.response_id ?? "",
    );
    const formTitle = String(definition?.title ?? payload.form_title ?? "");

    return {
      success: true,
      output: {
        form_id: formId,
        form_title: formTitle,
        response_id: responseId,
        submitted_at: submittedAt,
        answers: JSON.stringify(answers),
        ...payload,
      },
    };
  }
}

IntegrationRegistry.register(new TypeformTriggerHandler());
