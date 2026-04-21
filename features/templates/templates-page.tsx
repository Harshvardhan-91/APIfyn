"use client";

import { AppIcon } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const templates = [
  {
    id: "github-slack-template",
    name: "GitHub to Slack",
    description:
      "Get instant Slack notifications when code is pushed to your repositories.",
    apps: ["github", "slack"],
    category: "Developer",
  },
  {
    id: "stripe-notion-template",
    name: "Stripe to Notion",
    description:
      "Automatically log every payment event as a page in your Notion database.",
    apps: ["stripe", "notion"],
    category: "Finance",
  },
  {
    id: "gmail-sheets-template",
    name: "Gmail to Sheets",
    description:
      "Parse incoming emails and append structured data to Google Sheets.",
    apps: ["gmail", "sheets"],
    category: "Productivity",
  },
  {
    id: "github-discord-template",
    name: "GitHub to Discord",
    description:
      "Post real-time commit and PR updates to your Discord server channels.",
    apps: ["github", "discord"],
    category: "Developer",
  },
  {
    id: "typeform-slack-template",
    name: "Typeform to Slack",
    description:
      "Notify your team on Slack whenever a new Typeform response is submitted.",
    apps: ["typeform", "slack"],
    category: "Forms",
  },
  {
    id: "stripe-gmail-template",
    name: "Stripe to Gmail",
    description:
      "Send a custom follow-up email after every successful Stripe payment.",
    apps: ["stripe", "gmail"],
    category: "Finance",
  },
];

export function TemplatesPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Templates
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Pre-built workflows to get you started in seconds.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="group">
              <CardContent>
                <div className="mb-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    {template.category}
                  </span>
                </div>
                <div className="mb-4 flex gap-2">
                  {template.apps.map((app) => (
                    <AppIcon key={app} app={app} />
                  ))}
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {template.name}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                  {template.description}
                </p>
                <Button
                  className="mt-5 w-full"
                  variant="secondary"
                  onClick={() =>
                    router.push(`/workflows/create?template=${template.id}`)
                  }
                >
                  Use Template
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
