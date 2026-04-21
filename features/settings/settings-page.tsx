"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bell, Globe, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

const defaultSettings = {
  email: true,
  workflowFailures: true,
  weeklyReports: true,
  profilePublic: false,
};

export function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your notification preferences and workspace settings.
        </p>
      </div>
      <div className="space-y-5">
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
        <Button onClick={() => alert("Settings saved locally")}>
          Save Settings
        </Button>
      </div>
    </main>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  children,
}: { icon: typeof Bell; title: string; children: ReactNode }) {
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
    <label className="flex items-center justify-between gap-4 rounded-xl p-2 transition hover:bg-gray-50 cursor-pointer">
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
    </label>
  );
}
