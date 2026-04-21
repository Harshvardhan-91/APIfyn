"use client";

import {
  AppIcon,
  DiscordIcon,
  GitHubIcon,
  GmailIcon,
  GoogleSheetsIcon,
  NotionIcon,
  SlackIcon,
  StripeIcon,
} from "@/components/icons/brand-icons";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: Workflow,
    title: "Visual Workflow Builder",
    text: "Design automations with a drag-and-drop canvas. Connect triggers to actions without writing code.",
    gradient: "from-blue-500/10 to-indigo-500/10",
  },
  {
    icon: Zap,
    title: "Real-time Webhooks",
    text: "GitHub events trigger instant workflow executions. Every push, PR, and commit is captured.",
    gradient: "from-amber-500/10 to-orange-500/10",
  },
  {
    icon: SlackIcon,
    title: "Slack Notifications",
    text: "Send rich, templated messages to any channel. Keep your team in sync automatically.",
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    icon: Lock,
    title: "Secure by Default",
    text: "Firebase authentication, OAuth integrations, and encrypted tokens. Enterprise-grade security.",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
];

const integrationLogos = [
  { icon: GitHubIcon, label: "GitHub", bg: "bg-[#24292f]", text: "text-white" },
  { icon: SlackIcon, label: "Slack", bg: "bg-[#4A154B]", text: "text-white" },
  { icon: GmailIcon, label: "Gmail", bg: "bg-red-50", text: "text-red-600" },
  { icon: NotionIcon, label: "Notion", bg: "bg-black", text: "text-white" },
  {
    icon: GoogleSheetsIcon,
    label: "Sheets",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  { icon: StripeIcon, label: "Stripe", bg: "bg-[#635BFF]", text: "text-white" },
  {
    icon: DiscordIcon,
    label: "Discord",
    bg: "bg-[#5865F2]",
    text: "text-white",
  },
];

const templates = [
  {
    title: "GitHub to Slack",
    description:
      "Notify a Slack channel whenever code is pushed to any branch.",
    apps: ["github", "slack"],
  },
  {
    title: "Stripe to Notion",
    description: "Log every successful payment as a new Notion database entry.",
    apps: ["stripe", "notion"],
  },
  {
    title: "Gmail to Sheets",
    description:
      "Extract data from incoming emails and append rows to a spreadsheet.",
    apps: ["gmail", "sheets"],
  },
];

export function LandingPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  async function start() {
    if (!user) {
      await login();
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div className="animate-slide-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                <Sparkles className="h-4 w-4 text-amber-500" />
                No-code API automation
              </div>
              <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 lg:text-6xl">
                Automate APIs.
                <br />
                <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 bg-clip-text text-transparent">
                  Ship faster.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600">
                Connect services like GitHub and Slack with a visual workflow
                builder. Build reliable automations in minutes, not days.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="h-12 px-6 text-base" onClick={start}>
                  Start Building Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="secondary" className="h-12 px-6 text-base">
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                {[
                  "Visual drag-and-drop builder",
                  "GitHub webhook triggers",
                  "Slack & Discord actions",
                  "Execution history & logs",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero card */}
            <div className="animate-slide-up stagger-2">
              <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-xl shadow-gray-200/40">
                <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <AppIcon app="github" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        GitHub to Slack
                      </p>
                      <p className="text-xs text-gray-500">Active workflow</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Live
                  </span>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                    <AppIcon app="github" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        GitHub push received
                      </p>
                      <p className="text-xs text-gray-500">
                        main branch &middot; 3 commits
                      </p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="ml-7 h-8 border-l-2 border-dashed border-gray-200" />
                  <div className="flex items-center gap-4 rounded-xl bg-purple-50/50 p-4">
                    <AppIcon app="slack" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Slack message sent
                      </p>
                      <p className="text-xs text-gray-500">
                        #engineering &middot; 240ms
                      </p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations bar */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-6 text-center text-sm font-medium text-gray-400">
            Connects with the tools you already use
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {integrationLogos.map((integration) => (
              <div
                key={integration.label}
                className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${integration.bg} border border-black/5`}
                >
                  <integration.icon className={`h-4 w-4 ${integration.text}`} />
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {integration.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mb-14 max-w-2xl">
          <p className="mb-2 text-sm font-semibold text-gray-900">Features</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Everything you need for API automation
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From webhook triggers to Slack notifications, APIfyn handles the
            full automation pipeline.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className={`animate-slide-up stagger-${i + 1} group border-0 shadow-none hover:shadow-md`}
            >
              <CardContent>
                <div
                  className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}
                >
                  <feature.icon className="h-5 w-5 text-gray-700" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {feature.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="bg-gray-50/80 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <p className="mb-2 text-sm font-semibold text-gray-900">
              Templates
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Start from a template
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Pre-built workflow templates to get you up and running in seconds.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.title} className="group">
                <CardContent>
                  <div className="mb-5 flex gap-3">
                    {template.apps.map((app) => (
                      <AppIcon key={app} app={app} />
                    ))}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {template.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {template.description}
                  </p>
                  <Button
                    className="mt-6 w-full"
                    variant="secondary"
                    onClick={start}
                  >
                    Use Template
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Ready to automate your API workflows?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-gray-600">
            Join teams using APIfyn to connect their tools and ship faster. Free
            to start, no credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button className="h-12 px-8 text-base" onClick={start}>
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} APIfyn. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="/privacy-policy" className="hover:text-gray-900">
                Privacy
              </a>
              <a href="/terms-and-conditions" className="hover:text-gray-900">
                Terms
              </a>
              <a href="/contact-us" className="hover:text-gray-900">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
