"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { usePayment } from "@/components/providers/payment-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { OpenAIIcon } from "@/components/icons/brand-icons";
import { apiFetch } from "@/lib/api/client";
import {
  ArrowUpRight,
  Bell,
  Copy,
  CreditCard,
  Globe,
  KeyRound,
  Loader2,
  Shield,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";

const defaultSettings = {
  email: true,
  workflowFailures: true,
  weeklyReports: true,
  profilePublic: false,
};

function OpenAIKeySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [configured, setConfigured] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<{ success: boolean; configured: boolean }>(
      "/api/user/openai-key",
      { token: user.token },
    )
      .then((r) => {
        if (!cancelled) setConfigured(r.configured);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.token]);

  async function saveKey() {
    if (!user?.token || !draft.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/api/user/openai-key", {
        method: "PUT",
        token: user.token,
        body: JSON.stringify({ openaiKey: draft.trim() }),
      });
      setDraft("");
      setConfigured(true);
      toast("OpenAI key saved", "success");
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Failed to save key",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function clearKey() {
    if (!user?.token) return;
    setSaving(true);
    try {
      await apiFetch("/api/user/openai-key", {
        method: "PUT",
        token: user.token,
        body: JSON.stringify({ openaiKey: null }),
      });
      setConfigured(false);
      toast("OpenAI key removed", "info");
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Failed to remove key",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsSection icon={OpenAIIcon} title="OpenAI (workflow blocks)">
      <p className="text-sm text-gray-500">
        Default API key for <strong>OpenAI</strong> action blocks. Stored
        encrypted. Per-workflow keys are optional in each block.
      </p>
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : configured ? (
        <p className="text-xs text-emerald-700">
          A key is on file. Paste a new key to replace it.
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <span className="text-xs text-gray-600">API key</span>
          <Input
            type="password"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="sk-…"
            className="mt-1"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={saveKey}
            disabled={saving || !draft.trim()}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save key"
            )}
          </Button>
          {configured && (
            <Button
              type="button"
              variant="secondary"
              onClick={clearKey}
              disabled={saving}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}

type ApiKeySummary = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

function ApiKeySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<{ success: boolean; apiKeys: ApiKeySummary[] }>("/api/api-keys", {
      token: user.token,
    })
      .then((r) => {
        if (!cancelled) setKeys(r.apiKeys);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.token]);

  async function createKey() {
    if (!user?.token || !name.trim()) return;
    setCreating(true);
    try {
      const r = await apiFetch<{ key: string; apiKey: ApiKeySummary }>(
        "/api/api-keys",
        {
          method: "POST",
          token: user.token,
          body: JSON.stringify({ name: name.trim() }),
        },
      );
      setKeys((prev) => [r.apiKey, ...prev]);
      setNewKey(r.key);
      setName("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to create key", "error");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!user?.token) return;
    try {
      await apiFetch(`/api/api-keys/${id}`, {
        method: "DELETE",
        token: user.token,
      });
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast("API key revoked", "info");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to revoke key", "error");
    }
  }

  async function copyNewKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    toast("Copied to clipboard", "success");
  }

  return (
    <SettingsSection icon={KeyRound} title="API keys">
      <p className="text-sm text-gray-500">
        Use an API key to connect the <strong>APIfyn MCP server</strong> to
        Claude, Cursor or ChatGPT, or to call the API from your own scripts. A
        key has the same access as your account, except it can't create other
        keys or delete your account.
      </p>

      {newKey ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-800">
            Copy this key now. You won't be able to see it again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2 py-1.5 font-mono text-xs text-gray-900">
              {newKey}
            </code>
            <Button type="button" variant="secondary" onClick={copyNewKey}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button type="button" variant="ghost" onClick={() => setNewKey(null)}>
              Done
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <span className="text-xs text-gray-600">Key name</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cursor on my laptop"
            maxLength={60}
            className="mt-1"
          />
        </div>
        <Button
          type="button"
          onClick={createKey}
          disabled={creating || !name.trim()}
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create key"}
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-xs text-gray-400">No API keys yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {k.name}
                </p>
                <p className="text-xs text-gray-500">
                  <code className="font-mono">{k.prefix}…</code> · created{" "}
                  {new Date(k.createdAt).toLocaleDateString()} ·{" "}
                  {k.lastUsedAt
                    ? `last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                    : "never used"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => revokeKey(k.id)}
                aria-label={`Revoke ${k.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SettingsSection>
  );
}

export function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const {
    plan,
    usage,
    subscription,
    cancelSubscription,
    isLoading: paymentLoading,
  } = usePayment();

  const isFree =
    !subscription || !["ACTIVE", "AUTHENTICATED"].includes(subscription.status);

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-20 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your plan, notifications, and workspace settings.
        </p>
      </div>
      <div className="space-y-5">
        <SettingsSection icon={CreditCard} title="Plan & Billing">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {plan?.name ?? "Starter"} Plan
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {isFree
                  ? "Free plan with limited features"
                  : `Active until ${subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "—"}`}
              </p>
            </div>
            <div className="flex gap-2">
              {isFree ? (
                <Button
                  variant="secondary"
                  onClick={() => router.push("/pricing")}
                >
                  Upgrade <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              ) : confirmCancel ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5">
                  <span className="text-xs text-red-700">Cancel subscription?</span>
                  <Button
                    variant="danger"
                    className="px-3 py-1.5 text-xs"
                    disabled={paymentLoading}
                    onClick={() => {
                      cancelSubscription();
                      setConfirmCancel(false);
                      toast("Subscription cancelled", "success");
                    }}
                  >
                    {paymentLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2 py-1.5 text-xs"
                    onClick={() => setConfirmCancel(false)}
                  >
                    No
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
          {plan && usage ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Workflows",
                  used: usage.workflows,
                  limit: plan.workflowsLimit,
                },
                {
                  label: "API Calls",
                  used: usage.apiCalls,
                  limit: plan.apiCallsLimit,
                },
              ].map((item) => {
                const unlimited = item.limit === -1;
                const pct = unlimited
                  ? 0
                  : Math.min(100, Math.round((item.used / item.limit) * 100));
                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="font-medium text-gray-600">
                        {item.label}
                      </span>
                      <span className="text-gray-400">
                        {item.used} / {unlimited ? "\u221e" : item.limit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          pct >= 100
                            ? "bg-red-500"
                            : pct >= 80
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </SettingsSection>

        <SettingsSection icon={Bell} title="Notifications">
          <Toggle
            label="Email notifications"
            description="Receive email updates about your workflows"
            checked={settings.email}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, email: value }))
            }
          />
          <Toggle
            label="Workflow failure alerts"
            description="Get notified when a workflow execution fails"
            checked={settings.workflowFailures}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, workflowFailures: value }))
            }
          />
          <Toggle
            label="Weekly reports"
            description="Receive a weekly summary of your automation activity"
            checked={settings.weeklyReports}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, weeklyReports: value }))
            }
          />
        </SettingsSection>
        <OpenAIKeySettings />
        <ApiKeySettings />
        <SettingsSection icon={Shield} title="Privacy">
          <Toggle
            label="Public profile"
            description="Allow others to view your profile and workflows"
            checked={settings.profilePublic}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, profilePublic: value }))
            }
          />
        </SettingsSection>
        <SettingsSection icon={Globe} title="Workspace">
          <p className="text-sm text-gray-500">
            Timezone and language settings will be available soon.
          </p>
        </SettingsSection>
        <Button onClick={() => toast("Settings saved", "success")}>
          Save Settings
        </Button>
      </div>
      </div>
    </main>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  children,
}: { icon: ComponentType<{ className?: string }>; title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
            <Icon className="h-5 w-5 text-gray-600" />
          </span>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl p-2 transition hover:bg-gray-50 cursor-pointer">
      <div>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description ? (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-gray-900" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
