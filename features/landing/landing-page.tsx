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
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  GitBranch,
  Globe,
  Lock,
  Mail,
  MessageSquare,
  MousePointerClick,
  Play,
  Settings2,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/* ── scroll-triggered visibility hook ────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── animated counter ────────────────────────────────────────── */
function AnimatedNumber({
  target,
  suffix = "",
}: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView(0.3);
  useEffect(() => {
    if (!visible) return;
    let frame: number;
    const duration = 1600;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - (1 - t) ** 3;
      setCount(Math.round(ease * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, target]);
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ── data ────────────────────────────────────────────────────── */
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

const features = [
  {
    icon: Workflow,
    title: "Visual Workflow Builder",
    text: "Drag-and-drop canvas to design automations. Connect triggers to actions — no code, no YAML, no config files.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "group-hover:border-blue-200",
  },
  {
    icon: Zap,
    title: "Real-time Webhooks",
    text: "GitHub pushes, Stripe payments, Typeform submissions — events fire instantly and your workflows respond in milliseconds.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "group-hover:border-amber-200",
  },
  {
    icon: MessageSquare,
    title: "Multi-channel Actions",
    text: "Send Slack messages, Discord alerts, Gmail notifications, log to Sheets — all from a single workflow.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "group-hover:border-purple-200",
  },
  {
    icon: Code2,
    title: "Template Variables",
    text: "Use {{commit.message}}, {{sender.name}}, {{pr.title}} in your messages. Data flows between every step automatically.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "group-hover:border-emerald-200",
  },
  {
    icon: GitBranch,
    title: "Smart Filtering",
    text: "Filter by event type, branch name, PR action, or any payload field. Only trigger when the conditions actually match.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "group-hover:border-rose-200",
  },
  {
    icon: Lock,
    title: "Secure by Default",
    text: "OAuth token storage, webhook signature verification, JWT auth, and encrypted credentials. Enterprise-grade from day one.",
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "group-hover:border-slate-300",
  },
];

const howItWorks = [
  {
    step: "01",
    icon: MousePointerClick,
    title: "Connect your tools",
    text: "One-click OAuth for GitHub, Slack, and more. Paste a webhook URL for Discord. Done in seconds.",
  },
  {
    step: "02",
    icon: Settings2,
    title: "Build your workflow",
    text: "Drag a trigger block, add action blocks, configure each with smart variable suggestions.",
  },
  {
    step: "03",
    icon: Zap,
    title: "Activate & relax",
    text: "Toggle it live. Events fire, blocks execute in order, and results stream to your execution log.",
  },
];

const templates = [
  {
    title: "GitHub → Slack",
    description:
      "Notify your team channel on every push, PR, or issue. Branch and event filtering included.",
    apps: ["github", "slack"],
    badge: "Most Popular",
  },
  {
    title: "GitHub → Gmail",
    description:
      "Receive professional branded emails for each code change with commit details and links.",
    apps: ["github", "gmail"],
    badge: "New",
  },
  {
    title: "Stripe → Discord",
    description:
      "Post payment alerts and subscription events to your Discord server automatically.",
    apps: ["stripe", "discord"],
    badge: null,
  },
  {
    title: "GitHub → Discord",
    description:
      "Keep your open-source community updated with automated push and PR notifications.",
    apps: ["github", "discord"],
    badge: null,
  },
];

const stats = [
  { value: 12, suffix: "+", label: "Integrations" },
  { value: 50, suffix: "ms", label: "Avg. Latency" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 0, suffix: "", label: "Cost to Start", display: "Free" },
];

/* ── hero live demo steps ────────────────────────────────────── */
const demoSteps = [
  {
    icon: GitBranch,
    app: "github",
    label: "Push to main",
    detail: "3 commits · feat/auth-flow",
    status: "complete" as const,
  },
  {
    icon: Settings2,
    app: "github",
    label: "Filter: push events only",
    detail: "Branch: main",
    status: "complete" as const,
  },
  {
    icon: MessageSquare,
    app: "slack",
    label: "Slack → #engineering",
    detail: '"New push by {{sender.name}}"',
    status: "complete" as const,
  },
  {
    icon: Mail,
    app: "gmail",
    label: "Email summary sent",
    detail: "team@company.com · 240ms",
    status: "complete" as const,
  },
];

/* ═══════════════════════════════════════════════════════════════ */
export function LandingPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [activeDemoStep, setActiveDemoStep] = useState(-1);

  async function start() {
    if (!user) await login();
    router.push("/dashboard");
  }

  /* auto-play demo steps */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setActiveDemoStep(0), 800));
    timers.push(setTimeout(() => setActiveDemoStep(1), 1800));
    timers.push(setTimeout(() => setActiveDemoStep(2), 2800));
    timers.push(setTimeout(() => setActiveDemoStep(3), 3800));
    return () => timers.forEach(clearTimeout);
  }, []);

  /* section visibility */
  const integrations = useInView(0.2);
  const featuresSection = useInView(0.1);
  const howSection = useInView(0.15);
  const templatesSection = useInView(0.1);
  const statsSection = useInView(0.2);
  const ctaSection = useInView(0.2);

  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_60%)]" />
          <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
          <div className="absolute top-48 -left-24 h-72 w-72 rounded-full bg-purple-100/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            {/* copy */}
            <div className="animate-slide-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:shadow-md">
                <Sparkles className="h-4 w-4 text-amber-500" />
                No-code API automation
              </div>
              <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-gray-900 lg:text-[3.5rem]">
                Automate your APIs.
                <br />
                Ship faster.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600">
                Connect GitHub, Slack, Gmail, Discord, and more with a visual
                workflow builder. Build reliable automations in minutes, not
                days.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-12 px-6 text-base shadow-lg shadow-gray-900/10 transition-all hover:shadow-xl hover:shadow-gray-900/15"
                  onClick={start}
                >
                  Start Building Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="secondary" className="h-12 px-6 text-base">
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Button>
              </div>
              <div className="mt-10 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                {[
                  "Visual drag-and-drop builder",
                  "GitHub, Slack, Discord webhooks",
                  "Smart event filtering",
                  "Branded email templates",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* live demo card */}
            <div className="animate-slide-up stagger-2">
              <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-2xl shadow-gray-200/50">
                <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <AppIcon app="github" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        GitHub → Slack + Gmail
                      </p>
                      <p className="text-xs text-gray-500">
                        Live workflow execution
                      </p>
                    </div>
                  </div>
                  <span className="relative flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Running
                  </span>
                </div>
                <div className="grid gap-1.5">
                  {demoSteps.map((step, i) => {
                    const isActive = i <= activeDemoStep;
                    const isCurrent = i === activeDemoStep;
                    return (
                      <div key={step.label}>
                        <div
                          className={`flex items-center gap-4 rounded-xl p-4 transition-all duration-500 ${
                            isActive
                              ? isCurrent
                                ? "bg-blue-50/80 shadow-sm ring-1 ring-blue-100"
                                : "bg-gray-50"
                              : "bg-gray-50/50 opacity-40"
                          }`}
                        >
                          <AppIcon app={step.app} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium transition-colors duration-300 ${isActive ? "text-gray-900" : "text-gray-400"}`}
                            >
                              {step.label}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {step.detail}
                            </p>
                          </div>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full transition-all duration-500 ${
                              isActive
                                ? "bg-emerald-500 scale-100"
                                : "bg-gray-200 scale-75"
                            }`}
                          >
                            {isActive && (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                        {i < demoSteps.length - 1 && (
                          <div
                            className={`ml-[1.875rem] h-4 border-l-2 transition-colors duration-500 ${
                              i < activeDemoStep
                                ? "border-emerald-300"
                                : "border-dashed border-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div
                  className={`mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2.5 transition-all duration-500 ${
                    activeDemoStep >= 3
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Workflow complete
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <Clock className="h-3 w-3" />
                    342ms total
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Integration logos (marquee-like) ─────────────────── */}
      <section
        ref={integrations.ref}
        className={`border-y border-gray-100 bg-gray-50/50 py-14 transition-all duration-700 ${
          integrations.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 text-center text-sm font-medium tracking-wide text-gray-400 uppercase">
            Connects with the tools you already use
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {integrationLogos.map((integration, i) => (
              <div
                key={integration.label}
                className="group flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-200"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${integration.bg} border border-black/5 transition-transform duration-300 group-hover:scale-110`}
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

      {/* ── Stats ────────────────────────────────────────────── */}
      <section
        ref={statsSection.ref}
        className={`py-16 transition-all duration-700 ${
          statsSection.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
      >
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {stat.display ?? (
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                )}
              </p>
              <p className="mt-1.5 text-sm font-medium text-gray-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section
        id="features"
        ref={featuresSection.ref}
        className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
      >
        <div
          className={`mb-16 max-w-2xl transition-all duration-700 ${
            featuresSection.visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <p className="mb-3 text-sm font-semibold tracking-wide text-blue-600 uppercase">
            Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need for API automation
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            From webhook triggers to multi-channel notifications, APIfyn handles
            the full automation pipeline so you can focus on building.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${feature.border} ${
                featuresSection.visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: featuresSection.visible
                  ? `${i * 80}ms`
                  : "0ms",
              }}
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg} transition-transform duration-300 group-hover:scale-110`}
              >
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────── */}
      <section ref={howSection.ref} className="bg-gray-50/80 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={`mb-16 max-w-2xl transition-all duration-700 ${
              howSection.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <p className="mb-3 text-sm font-semibold tracking-wide text-blue-600 uppercase">
              How it works
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Three steps to automation
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Go from zero to a live workflow in under two minutes. No code
              required.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {howItWorks.map((item, i) => (
              <div
                key={item.step}
                className={`group relative rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
                  howSection.visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: howSection.visible ? `${i * 120}ms` : "0ms",
                }}
              >
                <span className="absolute -top-4 left-6 rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
                  {item.step}
                </span>
                <div className="mb-5 mt-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Templates ────────────────────────────────────────── */}
      <section id="templates" ref={templatesSection.ref} className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={`mb-16 max-w-2xl transition-all duration-700 ${
              templatesSection.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <p className="mb-3 text-sm font-semibold tracking-wide text-blue-600 uppercase">
              Templates
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Start from a template
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Pre-built workflows to get you running in seconds. Clone,
              customize, and go live.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((template, i) => (
              <div
                key={template.title}
                className={`group relative rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 hover:border-gray-200 ${
                  templatesSection.visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: templatesSection.visible
                    ? `${i * 80}ms`
                    : "0ms",
                }}
              >
                {template.badge && (
                  <span
                    className={`absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      template.badge === "New"
                        ? "bg-blue-600 text-white"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {template.badge}
                  </span>
                )}
                <div className="mb-5 flex gap-2.5">
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
                <button
                  type="button"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100 hover:border-gray-300 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900"
                  onClick={start}
                >
                  Use Template
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section
        ref={ctaSection.ref}
        className={`py-24 transition-all duration-700 ${
          ctaSection.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-16 text-center sm:px-16">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to automate your workflows?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-gray-400">
                Join teams using APIfyn to connect their tools and ship faster.
                Free to start — no credit card required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  className="h-12 px-8 text-base bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                  onClick={start}
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                No credit card · Free forever plan · Setup in 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} APIfyn. All rights reserved.
              </p>
              <a
                href="/admin"
                className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-300/60 transition-colors hover:bg-gray-400"
                aria-label="Admin"
              >
                <span className="sr-only">Admin</span>
              </a>
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              <a
                href="/privacy-policy"
                className="transition hover:text-gray-900"
              >
                Privacy
              </a>
              <a
                href="/terms-and-conditions"
                className="transition hover:text-gray-900"
              >
                Terms
              </a>
              <a href="/contact-us" className="transition hover:text-gray-900">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
