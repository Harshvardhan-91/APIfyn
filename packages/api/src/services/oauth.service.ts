import { prisma } from "../db";
import { createLogger } from "../utils/logger";

const logger = createLogger();

// Type definitions for OAuth responses
export interface GitHubTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
}

export interface GitHubUserResponse {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email: string;
}

export interface SlackTokenResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  team: {
    id: string;
    name: string;
  };
  authed_user: {
    id: string;
  };
  error?: string;
}

export interface SlackChannelsResponse {
  ok: boolean;
  channels: Array<{
    id: string;
    name: string;
    is_private: boolean;
    is_channel: boolean;
    is_group: boolean;
  }>;
  error?: string;
}

export class OAuthService {
  // GitHub OAuth methods
  static generateGitHubAuthUrl(userId: string): string {
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    if (!githubClientId) {
      throw new Error("GitHub OAuth not configured");
    }

    const state = `${userId}_${Date.now()}`;
    const scope = "repo,read:user";

    return `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=${scope}&state=${state}`;
  }

  static async exchangeGitHubCode(code: string): Promise<GitHubTokenResponse> {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;

    if (tokenData.error) {
      throw new Error(
        tokenData.error_description || "Failed to get access token",
      );
    }

    return tokenData;
  }

  static async getGitHubUser(accessToken: string): Promise<GitHubUserResponse> {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch GitHub user");
    }

    return (await userResponse.json()) as GitHubUserResponse;
  }

  static async saveGitHubIntegration(
    userId: string,
    tokenData: GitHubTokenResponse,
    userData: GitHubUserResponse,
  ) {
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        userId,
        type: "GITHUB",
      },
    });

    const integrationData = {
      name: `${userData.login}'s GitHub`,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      config: {
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        id: userData.id,
      },
      tokenExpiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
    };

    if (existingIntegration) {
      return await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: integrationData,
      });
    } else {
      return await prisma.integration.create({
        data: {
          userId,
          type: "GITHUB",
          ...integrationData,
        },
      });
    }
  }

  // Slack OAuth methods
  static generateSlackAuthUrl(userId: string): string {
    const slackClientId = process.env.SLACK_CLIENT_ID;
    if (!slackClientId) {
      throw new Error("Slack OAuth not configured");
    }

    const state = `${userId}_${Date.now()}`;
    // Updated scope to include all necessary permissions
    const scope =
      "channels:read,groups:read,im:read,mpim:read,chat:write,chat:write.public,users:read,team:read";
    return `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=${scope}&state=${state}`;
  }

  static async exchangeSlackCode(code: string): Promise<SlackTokenResponse> {
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as SlackTokenResponse;

    if (!tokenData.ok) {
      throw new Error(tokenData.error || "Failed to get access token");
    }

    return tokenData;
  }

  static async saveSlackIntegration(
    userId: string,
    tokenData: SlackTokenResponse,
  ) {
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        userId,
        type: "SLACK",
      },
    });

    const integrationData = {
      name: `${tokenData.team.name} Slack`,
      accessToken: tokenData.access_token,
      config: {
        team: tokenData.team,
        authed_user: tokenData.authed_user,
        scope: tokenData.scope,
      },
    };

    if (existingIntegration) {
      return await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: integrationData,
      });
    } else {
      return await prisma.integration.create({
        data: {
          userId,
          type: "SLACK",
          ...integrationData,
        },
      });
    }
  }

  // ─── Google OAuth (Sheets / Calendar) ───────────────────────

  static generateGoogleAuthUrl(userId: string): string {
    const clientId = process.env.GOOGLE_API_CLIENT_ID;
    if (!clientId) throw new Error("Google API OAuth not configured");

    const redirectUri =
      process.env.GOOGLE_API_REDIRECT_URI ??
      `${process.env.BASE_URL}/api/integrations/google/callback`;
    const state = `${userId}_${Date.now()}`;
    const scope = [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" ");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  static async exchangeGoogleCode(
    code: string,
  ): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const redirectUri =
      process.env.GOOGLE_API_REDIRECT_URI ??
      `${process.env.BASE_URL}/api/integrations/google/callback`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_API_CLIENT_ID!,
        client_secret: process.env.GOOGLE_API_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (data.error || !data.access_token) {
      throw new Error(data.error_description ?? data.error ?? "Token exchange failed");
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? "",
      expires_in: data.expires_in ?? 3600,
    };
  }

  static async saveGoogleIntegration(
    userId: string,
    tokens: { access_token: string; refresh_token: string; expires_in: number },
  ) {
    const integrationData = {
      name: "Google (Sheets & Calendar)",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      config: { scope: "spreadsheets,calendar" },
    };

    const existing = await prisma.integration.findFirst({
      where: { userId, type: "GOOGLE_SHEETS" },
    });

    if (existing) {
      return await prisma.integration.update({
        where: { id: existing.id },
        data: integrationData,
      });
    }

    return await prisma.integration.create({
      data: { userId, type: "GOOGLE_SHEETS", ...integrationData },
    });
  }

  // ─── Notion OAuth ─────────────────────────────────────────

  static generateNotionAuthUrl(userId: string): string {
    const clientId = process.env.NOTION_CLIENT_ID;
    if (!clientId) throw new Error("Notion OAuth not configured");

    const redirectUri =
      process.env.NOTION_REDIRECT_URI ??
      `${process.env.BASE_URL}/api/integrations/notion/callback`;
    const state = `${userId}_${Date.now()}`;

    return `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  static async exchangeNotionCode(
    code: string,
  ): Promise<{ access_token: string; workspace_name: string; workspace_id: string }> {
    const redirectUri =
      process.env.NOTION_REDIRECT_URI ??
      `${process.env.BASE_URL}/api/integrations/notion/callback`;
    const encoded = Buffer.from(
      `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`,
    ).toString("base64");

    const res = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = (await res.json()) as {
      access_token?: string;
      workspace_name?: string;
      workspace_id?: string;
      error?: string;
      message?: string;
    };

    if (data.error || !data.access_token) {
      throw new Error(data.message ?? data.error ?? "Notion token exchange failed");
    }

    return {
      access_token: data.access_token,
      workspace_name: data.workspace_name ?? "Notion Workspace",
      workspace_id: data.workspace_id ?? "",
    };
  }

  static async saveNotionIntegration(
    userId: string,
    tokens: { access_token: string; workspace_name: string; workspace_id: string },
  ) {
    const integrationData = {
      name: `${tokens.workspace_name} (Notion)`,
      accessToken: tokens.access_token,
      config: {
        workspace_name: tokens.workspace_name,
        workspace_id: tokens.workspace_id,
      },
    };

    const existing = await prisma.integration.findFirst({
      where: { userId, type: "NOTION" },
    });

    if (existing) {
      return await prisma.integration.update({
        where: { id: existing.id },
        data: integrationData,
      });
    }

    return await prisma.integration.create({
      data: { userId, type: "NOTION", ...integrationData },
    });
  }

  // Get repositories from GitHub
  static async getGitHubRepositories(accessToken: string) {
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!reposResponse.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repositories = (await reposResponse.json()) as any[];
    return repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      description: repo.description,
      html_url: repo.html_url,
      updated_at: repo.updated_at,
    }));
  }

  // Get channels from Slack
  static async getSlackChannels(accessToken: string) {
    try {
      const channelsResponse = await fetch(
        "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=100",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const channelsData =
        (await channelsResponse.json()) as SlackChannelsResponse;

      if (!channelsData.ok) {
        if (channelsData.error === "missing_scope") {
          throw new Error(
            "Slack integration needs to be re-authorized with updated permissions. Please disconnect and reconnect your Slack account.",
          );
        }
        throw new Error(channelsData.error || "Failed to fetch channels");
      }

      return channelsData.channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
        is_channel: channel.is_channel,
        is_group: channel.is_group,
      }));
    } catch (error) {
      logger.error("Error fetching Slack channels:", error);
      throw error;
    }
  }
}
