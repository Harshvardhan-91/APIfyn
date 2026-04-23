"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import type { ApiResult, IntegrationStatus, Workflow } from "@/lib/api/types";
import { getTemplateById } from "@/lib/templates/definitions";
import {
  ArrowLeft,
  Loader2,
  PanelLeft,
  PanelLeftClose,
  Save,
  Send,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { blockLibrary } from "./block-library";
import { BuilderCanvas } from "./builder-canvas";
import { BuilderSidebar } from "./builder-sidebar";
import { ConfigPanel } from "./config-panel";
import type {
  BuilderBlock,
  BuilderBlockDefinition,
  BuilderConnection,
} from "./types";

const providerFromBlockId = (id: string) => {
  if (id.includes("github")) return "github";
  if (id.includes("slack")) return "slack";
  return "";
};

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const allBlockDefinitions = [
  ...blockLibrary.triggers,
  ...blockLibrary.actions,
  ...blockLibrary.conditions,
  ...blockLibrary.utilities,
];

function findDefinition(type: string) {
  return allBlockDefinitions.find((block) => block.id === type);
}

export function WorkflowBuilderPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const workflowId = params?.id;
  const templateId = searchParams?.get("template");
  const { user } = useAuth();
  const [workflowName, setWorkflowName] = useState("");
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [connections, setConnections] = useState<BuilderConnection[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>();
  const [integrations, setIntegrations] = useState<IntegrationStatus>();
  const [repositories, setRepositories] = useState<
    Array<{ id: number; full_name: string; private?: boolean }>
  >([]);
  const [channels, setChannels] = useState<
    Array<{ id: string; name: string; is_private?: boolean }>
  >([]);
  const [message, setMessage] = useState<string>();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const selectedBlock = blocks.find(
    (block) => block.instanceId === selectedBlockId,
  );

  const connectedProviders = useMemo(() => {
    const providers = new Set<string>();
    if (integrations?.github.connected) providers.add("github");
    if (integrations?.slack.connected) providers.add("slack");
    return providers;
  }, [integrations]);

  const loadIntegrations = useCallback(async () => {
    if (!user?.token) return;
    const status = await apiFetch<
      ApiResult<{ integrations: IntegrationStatus }>
    >("/api/integrations/status", { token: user.token });
    setIntegrations(status.integrations);
  }, [user?.token]);

  const loadProviderData = useCallback(async () => {
    if (!user?.token) return;
    if (integrations?.github.connected) {
      const data = await apiFetch<
        ApiResult<{
          repositories: Array<{
            id: number;
            full_name: string;
            private?: boolean;
          }>;
        }>
      >("/api/integrations/github/repositories", { token: user.token });
      setRepositories(data.repositories);
    }
    if (integrations?.slack.connected) {
      const data = await apiFetch<
        ApiResult<{
          channels: Array<{ id: string; name: string; is_private?: boolean }>;
        }>
      >("/api/integrations/slack/channels", { token: user.token });
      setChannels(data.channels);
    }
  }, [
    integrations?.github.connected,
    integrations?.slack.connected,
    user?.token,
  ]);

  useEffect(() => {
    loadIntegrations().catch(() => undefined);
  }, [loadIntegrations]);

  useEffect(() => {
    loadProviderData().catch(() => undefined);
  }, [loadProviderData]);

  useEffect(() => {
    async function loadWorkflow() {
      if (!workflowId || !user?.token) return;
      const data = await apiFetch<ApiResult<{ workflow: Workflow }>>(
        `/api/workflow/${workflowId}`,
        { token: user.token },
      );
      setWorkflowName(data.workflow.name);
      const loadedBlocks = (data.workflow.definition?.blocks ?? []).map(
        (block, index) => {
          const definition = findDefinition(block.type);
          const provider = providerFromBlockId(block.type);
          return {
            ...(definition ?? blockLibrary.actions[0]),
            instanceId: block.id,
            position: block.position ?? { x: 120 + index * 260, y: 160 },
            config: (block.config as Record<string, string | string[]>) ?? {},
            status:
              block.status === "configured" ? "configured" : "not-configured",
            integrationStatus: connectedProviders.has(provider)
              ? "connected"
              : "not-connected",
          } satisfies BuilderBlock;
        },
      );
      setBlocks(loadedBlocks);
      setConnections(data.workflow.definition?.connections ?? []);
    }

    loadWorkflow().catch((error) =>
      setMessage(
        error instanceof Error ? error.message : "Failed to load workflow",
      ),
    );
  }, [connectedProviders, user?.token, workflowId]);

  useEffect(() => {
    if (!templateId || workflowId || blocks.length > 0) return;
    const template = getTemplateById(templateId);
    if (!template) return;

    setWorkflowName(template.name);
    const newBlocks: BuilderBlock[] = template.blocks.map((block) => {
      const def = findDefinition(block.type);
      const provider = providerFromBlockId(block.type);
      return {
        id: def?.id ?? block.type,
        name: def?.name ?? block.name,
        description: def?.description ?? block.description,
        category: def?.category ?? "General",
        integrationRequired: def?.integrationRequired ?? false,
        icon: def?.icon ?? blockLibrary.actions[0].icon,
        instanceId: block.id,
        position: block.position,
        config: block.config,
        status: Object.keys(block.config).length > 0
          ? "configured" as const
          : "not-configured" as const,
        integrationStatus: connectedProviders.has(provider)
          ? "connected" as const
          : "not-connected" as const,
      };
    });
    setBlocks(newBlocks);
    setConnections(template.connections);
  }, [templateId, workflowId, connectedProviders, blocks.length]);

  function addBlock(definition: BuilderBlockDefinition) {
    const provider = providerFromBlockId(definition.id);
    const index = blocks.length;
    setBlocks((previous) => [
      ...previous,
      {
        ...definition,
        instanceId: makeId("block"),
        position: { x: 120 + index * 260, y: 180 + (index % 2) * 120 },
        config: {},
        status: definition.integrationRequired
          ? "requires-integration"
          : "not-configured",
        integrationStatus: connectedProviders.has(provider)
          ? "connected"
          : "not-connected",
      },
    ]);
  }

  function connect(from: string, to: string) {
    setConnections((previous) =>
      previous.some(
        (connection) => connection.from === from && connection.to === to,
      )
        ? previous
        : [...previous, { id: makeId("connection"), from, to }],
    );
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const { type } = event.data ?? {};
      if (
        type === "github_auth_success" ||
        type === "slack_auth_success" ||
        type === "google_auth_success" ||
        type === "notion_auth_success"
      ) {
        loadIntegrations().catch(() => undefined);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [loadIntegrations]);

  async function authorize(provider: "github" | "slack" | "google" | "notion") {
    if (!user?.token) return;
    const data = await apiFetch<ApiResult<{ authUrl: string }>>(
      `/api/integrations/${provider}/auth`,
      {
        method: "POST",
        token: user.token,
      },
    );
    const popup = window.open(data.authUrl, "_blank", "width=600,height=700");
    popupRef.current = popup;

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (!popupRef.current || popupRef.current.closed) {
        clearInterval(pollRef.current);
        popupRef.current = null;
        loadIntegrations().catch(() => undefined);
      }
    }, 500);
  }

  async function saveWorkflow() {
    if (!user?.token) return;
    if (!workflowName.trim()) {
      setMessage("Please enter a workflow name.");
      return;
    }

    const definition = {
      blocks: blocks.map((block) => {
        const config: Record<string, string | string[] | boolean | undefined> =
          {
            ...block.config,
          };
        if (block.id === "openai-action") {
          const useAcc = config.useOpenaiAccountKey !== false;
          const hasStored = Boolean(
            (config as { openaiKeyStored?: boolean }).openaiKeyStored,
          );
          const input = String(
            (config as { openaiKeyInput?: string }).openaiKeyInput || "",
          ).trim();
          if (!useAcc && hasStored && !input) {
            (config as { __openaiUnchanged?: boolean }).__openaiUnchanged =
              true;
          }
        }
        return {
        id: block.instanceId,
        type: block.id,
        name: block.name,
        description: block.description,
        position: block.position,
        config,
        status: block.status,
        integrationRequired: block.integrationRequired,
        integrationStatus: block.integrationStatus,
        };
      }),
      connections,
      canvas: { zoom: 1, position: { x: 0, y: 0 } },
    };

    const path = workflowId ? `/api/workflow/${workflowId}` : "/api/workflow";
    const method = workflowId ? "PUT" : "POST";

    try {
      await apiFetch(path, {
        method,
        token: user.token,
        body: JSON.stringify({
          name: workflowName.trim(),
          description: `Workflow with ${blocks.length} blocks and ${connections.length} connections`,
          definition,
          category: "general",
          triggerType: "MANUAL",
          isActive: true,
        }),
      });

      router.push("/workflows");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save workflow";
      if (msg.includes("workflow limit") || msg.includes("Upgrade")) {
        setMessage(msg);
      } else {
        setMessage(msg);
      }
    }
  }

  async function generateWithAI() {
    if (!user?.token || !aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setMessage(undefined);
    try {
      const data = await apiFetch<{
        success: boolean;
        definition: {
          name: string;
          blocks: Array<{
            id: string;
            type: string;
            name: string;
            description: string;
            position: { x: number; y: number };
            config: Record<string, string | string[]>;
          }>;
          connections: BuilderConnection[];
        };
        error?: string;
      }>("/api/ai/generate", {
        method: "POST",
        token: user.token,
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });

      if (!data.success || !data.definition) {
        setMessage(data.error || "Failed to generate workflow.");
        return;
      }

      const { definition } = data;

      if (definition.name) {
        setWorkflowName(definition.name);
      }

      const newBlocks: BuilderBlock[] = definition.blocks.map((block) => {
        const def = findDefinition(block.type);
        const provider = providerFromBlockId(block.type);
        return {
          id: def?.id ?? block.type,
          name: def?.name ?? block.name,
          description: def?.description ?? block.description,
          category: def?.category ?? "General",
          integrationRequired: def?.integrationRequired ?? false,
          icon: def?.icon ?? blockLibrary.actions[0].icon,
          instanceId: block.id,
          position: block.position ?? { x: 100, y: 200 },
          config: (block.config as Record<string, string | string[]>) ?? {},
          status: Object.keys(block.config || {}).length > 0
            ? "configured" as const
            : "not-configured" as const,
          integrationStatus: connectedProviders.has(provider)
            ? "connected" as const
            : "not-connected" as const,
        };
      });

      setBlocks(newBlocks);
      setConnections(definition.connections ?? []);
      setAiPrompt("");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to generate workflow.",
      );
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-gray-50 pt-14">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            className="px-2 shrink-0"
            onClick={() => router.push("/workflows")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 transition hover:bg-gray-100"
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? "Hide blocks panel" : "Show blocks panel"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4 text-gray-600" />
            ) : (
              <PanelLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>
          <div className="hidden sm:block h-5 w-px bg-gray-200 shrink-0" />
          <Input
            className="w-40 sm:w-72 border-transparent bg-transparent text-sm font-semibold focus:border-gray-200 focus:bg-white"
            placeholder="Untitled workflow"
            value={workflowName}
            onChange={(event) => setWorkflowName(event.target.value)}
          />
          <span className="hidden sm:inline text-xs text-gray-400 shrink-0">
            {blocks.length} blocks &middot; {connections.length} connections
          </span>
        </div>
        <Button onClick={saveWorkflow} className="shrink-0">
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
      </div>

      {/* AI generation bar */}
      {!workflowId && blocks.length === 0 ? (
        <div className="border-b border-gray-200 bg-white px-3 py-2.5 sm:px-5">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <span className="shrink-0 font-mono text-sm text-gray-300">&gt;</span>
            <input
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
              placeholder="Describe your workflow in plain English..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateWithAI();
                }
              }}
              disabled={aiLoading}
            />
            <button
              type="button"
              className="shrink-0 rounded-lg bg-gray-900 p-1.5 text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              onClick={generateWithAI}
              disabled={aiLoading || aiPrompt.trim().length < 10}
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-800">
          {message}
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1">
        {/* Sidebar */}
        <div
          className={`
            shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden border-r border-gray-200
            ${sidebarOpen ? "w-72 sm:w-80" : "w-0 border-r-0"}
          `}
        >
          <div className="h-full w-72 sm:w-80">
            <BuilderSidebar
              onAddBlock={addBlock}
              connectedProviders={connectedProviders}
            />
          </div>
        </div>

        <BuilderCanvas
          blocks={blocks}
          connections={connections}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onDeleteBlock={(id) => {
            setBlocks((previous) =>
              previous.filter((block) => block.instanceId !== id),
            );
            setConnections((previous) =>
              previous.filter(
                (connection) => connection.from !== id && connection.to !== id,
              ),
            );
          }}
          onConnect={connect}
          onMoveBlock={(id, position) => {
            setBlocks((previous) =>
              previous.map((block) =>
                block.instanceId === id ? { ...block, position } : block,
              ),
            );
          }}
        />

        {/* Config panel */}
        {selectedBlock ? (
          <div className="fixed inset-y-0 right-0 z-40 w-[min(420px,100vw)] pt-[calc(3.5rem+3.5rem)] lg:relative lg:inset-auto lg:z-auto lg:w-[420px] lg:pt-0">
            <ConfigPanel
              block={selectedBlock}
              integrations={integrations}
              repositories={repositories}
              channels={channels}
              workflowId={workflowId}
              onClose={() => setSelectedBlockId(undefined)}
              onAuthorize={authorize}
              onUpdate={(updated) => {
                setBlocks((previous) =>
                  previous.map((block) =>
                    block.instanceId === updated.instanceId ? updated : block,
                  ),
                );
              }}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
