import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

const logger = createLogger();

export class GitHubTriggerHandler implements IntegrationHandler {
  blockId = "github-trigger";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const payload = ctx.triggerPayload;

    const eventType = detectEventType(payload);

    const allowedEvents = config.eventTypes as string[] | undefined;
    if (allowedEvents?.length && !allowedEvents.includes(eventType)) {
      logger.info(`Skipping GitHub event "${eventType}" — not in allowed list: ${allowedEvents.join(", ")}`);
      return {
        success: true,
        output: { skipped: true, reason: `Event type "${eventType}" not selected`, event_type: eventType },
      };
    }

    const branchFilter = config.branchFilter as string | undefined;
    const branch = extractBranch(payload, eventType);
    if (branchFilter && branch && branch !== branchFilter && branchFilter !== "*") {
      logger.info(`Skipping GitHub event on branch "${branch}" — filter is "${branchFilter}"`);
      return {
        success: true,
        output: { skipped: true, reason: `Branch "${branch}" doesn't match filter "${branchFilter}"`, event_type: eventType },
      };
    }

    const prAction = config.prActions as string[] | undefined;
    if (eventType === "pull_request" && prAction?.length) {
      const action = (payload.action as string) || "";
      if (!prAction.includes(action)) {
        return {
          success: true,
          output: { skipped: true, reason: `PR action "${action}" not in filter`, event_type: eventType },
        };
      }
    }

    return {
      success: true,
      output: buildOutput(payload, eventType, branch),
    };
  }
}

function detectEventType(payload: Record<string, unknown>): string {
  if (payload.pull_request) return "pull_request";
  if (payload.issue) return "issues";
  if (payload.release) return "release";
  if (payload.action === "created" && payload.comment) return "issue_comment";
  if (payload.ref && payload.commits) return "push";
  if (payload.ref_type) return "create";
  if (payload.forkee) return "fork";
  if (payload.starred_at !== undefined) return "star";
  return "push";
}

function extractBranch(payload: Record<string, unknown>, eventType: string): string {
  if (eventType === "push" && typeof payload.ref === "string") {
    return payload.ref.replace("refs/heads/", "");
  }
  if (eventType === "pull_request") {
    const pr = payload.pull_request as Record<string, unknown> | undefined;
    const head = pr?.head as Record<string, unknown> | undefined;
    return (head?.ref as string) || "";
  }
  return "";
}

function buildOutput(payload: Record<string, unknown>, eventType: string, branch: string): Record<string, unknown> {
  const repo = payload.repository as Record<string, unknown> | undefined;
  const sender = payload.sender as Record<string, unknown> | undefined;

  const base: Record<string, unknown> = {
    event_type: eventType,
    repository_name: repo?.full_name ?? "",
    repository_url: repo?.html_url ?? "",
    branch_name: branch,
    sender_name: sender?.login ?? "",
    sender_avatar: sender?.avatar_url ?? "",
    raw: payload,
  };

  if (eventType === "push") {
    const headCommit = payload.head_commit as Record<string, unknown> | undefined;
    const pusher = payload.pusher as Record<string, unknown> | undefined;
    const commits = payload.commits as Array<Record<string, unknown>> | undefined;
    base.author_name = pusher?.name ?? sender?.login ?? "";
    base.author_email = pusher?.email ?? "";
    base.commit_message = headCommit?.message ?? "";
    base.commit_url = headCommit?.url ?? "";
    base.commits_count = commits?.length ?? 0;
    base.compare_url = payload.compare ?? "";
    base.repository = repo?.full_name ?? "";
    base.branch = branch;
    base.author = pusher?.name ?? sender?.login ?? "";
  }

  if (eventType === "pull_request") {
    const pr = payload.pull_request as Record<string, unknown> | undefined;
    const head = pr?.head as Record<string, unknown> | undefined;
    const prBase = pr?.base as Record<string, unknown> | undefined;
    const prUser = pr?.user as Record<string, unknown> | undefined;
    base.pr_title = pr?.title ?? "";
    base.pr_number = pr?.number ?? "";
    base.pr_action = payload.action ?? "";
    base.pr_body = pr?.body ?? "";
    base.pr_url = pr?.html_url ?? "";
    base.pr_state = pr?.state ?? "";
    base.pr_merged = pr?.merged ?? false;
    base.head_branch = head?.ref ?? "";
    base.base_branch = prBase?.ref ?? "";
    base.author_name = prUser?.login ?? "";
    base.commit_message = pr?.title ?? "";
    base.repository = repo?.full_name ?? "";
    base.author = prUser?.login ?? "";
  }

  if (eventType === "issues") {
    const issue = payload.issue as Record<string, unknown> | undefined;
    base.issue_title = issue?.title ?? "";
    base.issue_number = issue?.number ?? "";
    base.issue_action = payload.action ?? "";
    base.issue_body = issue?.body ?? "";
    base.issue_url = issue?.html_url ?? "";
    base.author_name = (issue?.user as Record<string, unknown>)?.login ?? "";
  }

  if (eventType === "release") {
    const release = payload.release as Record<string, unknown> | undefined;
    base.release_tag = release?.tag_name ?? "";
    base.release_name = release?.name ?? "";
    base.release_body = release?.body ?? "";
    base.release_url = release?.html_url ?? "";
    base.release_draft = release?.draft ?? false;
    base.release_prerelease = release?.prerelease ?? false;
    base.author_name = (release?.author as Record<string, unknown>)?.login ?? "";
  }

  if (eventType === "star") {
    base.star_action = payload.action ?? "";
    base.author_name = sender?.login ?? "";
  }

  if (eventType === "fork") {
    const forkee = payload.forkee as Record<string, unknown> | undefined;
    base.fork_name = forkee?.full_name ?? "";
    base.fork_url = forkee?.html_url ?? "";
    base.author_name = sender?.login ?? "";
  }

  return base;
}

IntegrationRegistry.register(new GitHubTriggerHandler());
