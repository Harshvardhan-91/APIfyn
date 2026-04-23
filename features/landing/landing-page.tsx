"use client";

import {
  AppIcon,
  DiscordIcon,
  GitHubIcon,
  GmailIcon,
  GoogleSheetsIcon,
  NotionIcon,
  OpenAIIcon,
  RazorpayIcon,
  SlackIcon,
  StripeIcon,
  TypeformIcon,
  WebhookIcon,
  WhatsAppIcon,
} from "@/components/icons/brand-icons";
import {
  LANDING_SECTION_SCROLL_KEY,
  PublicNavbar,
} from "@/components/layout/public-navbar";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe,
  Play,
  Send,
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

/* ── typing animation hook ───────────────────────────────────── */
function useTypingAnimation(texts: string[], speed = 40, pause = 2000) {
  const [displayed, setDisplayed] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && charIndex < currentText.length) {
      timeout = setTimeout(() => {
        setDisplayed(currentText.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, speed);
    } else if (!isDeleting && charIndex === currentText.length) {
      timeout = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setDisplayed(currentText.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, speed / 2);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex((textIndex + 1) % texts.length);
    }

    return () => clearTimeout(timeout);
  }, [texts, textIndex, charIndex, isDeleting, speed, pause]);

  return displayed;
}

/* ── data ────────────────────────────────────────────────────── */
const integrationLogos = [
  { icon: GitHubIcon, label: "GitHub", bg: "bg-[#24292f]", text: "text-white" },
  { icon: SlackIcon, label: "Slack", bg: "bg-[#4A154B]", text: "text-white" },
  { icon: OpenAIIcon, label: "OpenAI", bg: "bg-[#10A37F]", text: "text-white" },
  { icon: NotionIcon, label: "Notion", bg: "bg-black", text: "text-white" },
  { icon: GoogleSheetsIcon, label: "Sheets", bg: "bg-green-50", text: "text-green-700" },
  { icon: GmailIcon, label: "Gmail", bg: "bg-red-50", text: "text-red-600" },
  { icon: StripeIcon, label: "Stripe", bg: "bg-[#635BFF]", text: "text-white" },
  { icon: RazorpayIcon, label: "Razorpay", bg: "bg-[#0C2451]", text: "text-[#3395FF]" },
  { icon: TypeformIcon, label: "Typeform", bg: "bg-[#262627]", text: "text-white" },
  { icon: WhatsAppIcon, label: "WhatsApp", bg: "bg-[#25D366]", text: "text-white" },
  { icon: DiscordIcon, label: "Discord", bg: "bg-[#5865F2]", text: "text-white" },
  { icon: WebhookIcon, label: "Webhooks", bg: "bg-blue-50", text: "text-blue-600" },
];

const aiPromptExamples = [
  "When someone pays on Razorpay, send a WhatsApp confirmation and log to Notion",
  "When a GitHub PR is merged, notify #engineering on Slack and send email summary",
  "When a Typeform response comes in, add a row to Google Sheets and message on Discord",
  "When Stripe payment fails, send a WhatsApp reminder and create a Notion task",
];

const features = [
  {
    title: "Natural language builder",
    text: "Describe what you want. The AI picks the right triggers, actions, and config. You just review and activate.",
    badge: "New",
  },
  {
    title: "Visual drag-and-drop canvas",
    text: "Wire triggers to actions on a real canvas. Connect blocks, set conditions, add delays — no code, no YAML.",
    badge: null,
  },
  {
    title: "Real-time webhook execution",
    text: "GitHub pushes, Stripe payments, Razorpay transactions, Typeform responses — events fire and workflows respond in milliseconds.",
    badge: null,
  },
  {
    title: "Multi-channel delivery",
    text: "Slack, WhatsApp, Discord, Gmail, Google Sheets, Notion — reach every channel from a single workflow.",
    badge: null,
  },
  {
    title: "Variables, conditions, and code",
    text: "Use {{payment.amount}} in messages. Branch with if/else. Filter events. Run custom JavaScript. Full control when you need it.",
    badge: null,
  },
  {
    title: "Secure by default",
    text: "OAuth token storage, webhook signature verification, JWT auth, encrypted credentials. Enterprise-grade from day one.",
    badge: null,
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Describe what you need",
    text: '"When someone pays on Razorpay, send a WhatsApp confirmation and log it to Notion." That\'s it. Plain English.',
  },
  {
    step: "2",
    title: "Review the workflow",
    text: "Blocks appear on the canvas with connections and pre-filled config. Tweak anything, connect your accounts, or just leave it.",
  },
  {
    step: "3",
    title: "Go live",
    text: "Toggle it on. Events fire, blocks execute, results stream to your log. Monitor everything in real-time.",
  },
];

const templates = [
  {
    title: "Razorpay → WhatsApp + Notion",
    description: "Payment received? Auto-send WhatsApp confirmation and log the transaction to Notion.",
    apps: ["razorpay", "whatsapp", "notion"],
    badge: "India",
  },
  {
    title: "GitHub → Slack + Gmail",
    description: "Notify your team on Slack and send branded emails for every push, PR, or release.",
    apps: ["github", "slack", "gmail"],
    badge: "Popular",
  },
  {
    title: "Stripe → Discord + Sheets",
    description: "Post payment alerts to Discord and log every transaction to Google Sheets automatically.",
    apps: ["stripe", "discord", "sheets"],
    badge: null,
  },
  {
    title: "Typeform → Slack + Notion",
    description: "New form submission? Notify your team on Slack and create a Notion task instantly.",
    apps: ["typeform", "slack", "notion"],
    badge: "New",
  },
];

const stats = [
  { value: 20, suffix: "+", label: "Integrations" },
  { value: 50, suffix: "ms", label: "Avg. Latency" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 0, suffix: "", label: "Cost to Start", display: "Free" },
];

/* ── AI demo simulation data ─────────────────────────────────── */
const aiDemoBlocks = [
  { type: "razorpay-trigger", name: "Razorpay Payment", app: "razorpay", config: "Event: payment.captured" },
  { type: "whatsapp-send", name: "WhatsApp Message", app: "whatsapp", config: "To: {{customer.phone}}" },
  { type: "notion-create", name: "Log to Notion", app: "notion", config: "Database: Payments" },
];

/* ═══════════════════════════════════════════════════════════════ */
export function LandingPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [aiDemoPhase, setAiDemoPhase] = useState<"typing" | "generating" | "done">("typing");
  const [visibleBlocks, setVisibleBlocks] = useState(0);

  const typingText = useTypingAnimation(aiPromptExamples, 35, 3000);

  async function start() {
    if (!user) await login();
    router.push("/dashboard");
  }

  const startDemo = useCallback(() => {
    setAiDemoPhase("generating");
    setVisibleBlocks(0);
    const t1 = setTimeout(() => setVisibleBlocks(1), 600);
    const t2 = setTimeout(() => setVisibleBlocks(2), 1200);
    const t3 = setTimeout(() => {
      setVisibleBlocks(3);
      setAiDemoPhase("done");
    }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (aiDemoPhase === "typing") {
      const timer = setTimeout(startDemo, 2500);
      return () => clearTimeout(timer);
    }
    if (aiDemoPhase === "done") {
      const timer = setTimeout(() => {
        setAiDemoPhase("typing");
        setVisibleBlocks(0);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [aiDemoPhase, startDemo]);

  useEffect(() => {
    const fromStorage = sessionStorage.getItem(LANDING_SECTION_SCROLL_KEY);
    if (fromStorage) {
      sessionStorage.removeItem(LANDING_SECTION_SCROLL_KEY);
      const id = fromStorage;
      const t = window.setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", "/");
      }, 80);
      return () => window.clearTimeout(t);
    }

    const hash = window.location.hash.slice(1);
    if (hash) {
      const t = window.setTimeout(() => {
        document
          .getElementById(hash)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", "/");
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, []);

  const integrations = useInView(0.2);
  const featuresSection = useInView(0.1);
  const howSection = useInView(0.15);
  const aiDemoSection = useInView(0.15);
  const templatesSection = useInView(0.1);
  const statsSection = useInView(0.2);
  const indiaSection = useInView(0.15);
  const ctaSection = useInView(0.2);

  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.05),transparent_60%)]" />
          <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-blue-100/30 blur-3xl" />
          <div className="absolute top-48 -left-24 h-72 w-72 rounded-full bg-slate-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="animate-slide-up">
              <p className="mb-6 text-sm font-medium tracking-wide text-gray-400 uppercase">
                Workflow automation, reimagined
              </p>
              <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-gray-900 sm:text-6xl lg:text-[3.5rem]">
                Automate your APIs
                <br />
                with a single sentence.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
                Tell APIfyn what you want in plain English. Our AI builds the
                workflow, connects the apps, and you&apos;re live in seconds not hours.
              </p>
            </div>

            {/* AI input demo */}
            <div className="animate-slide-up stagger-2 mx-auto mt-10 max-w-2xl">
              <div className="group relative rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-200/50 transition-shadow hover:shadow-2xl">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3.5">
                  <span className="shrink-0 font-mono text-sm text-gray-300">&gt;</span>
                  <span className="flex-1 text-left text-sm text-gray-500 sm:text-base">
                    {typingText}
                    <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-gray-900" />
                  </span>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg bg-gray-900 p-2 text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg"
                    onClick={start}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Try it free — no credit card required
              </p>
            </div>

            {/* CTA buttons */}
            <div className="animate-slide-up stagger-3 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                className="h-12 px-6 text-base shadow-lg shadow-gray-900/10 transition-all hover:shadow-xl hover:shadow-gray-900/15"
                onClick={start}
              >
                Start Building Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" className="h-12 px-6 text-base" onClick={start}>
                <Play className="h-4 w-4" />
                See it in Action
              </Button>
            </div>

            <div className="animate-slide-up stagger-4 mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-400">
              {[
                "20+ app connectors",
                "OpenAI, WhatsApp, Razorpay, Stripe",
                "Free forever plan",
              ].map((item, i) => (
                <span key={item} className="flex items-center gap-2">
                  {i > 0 && <span className="text-gray-300">·</span>}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Integration logos ─────────────────────────────────── */}
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
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
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

      {/* ── AI Demo Section ──────────────────────────────────── */}
      <section
        ref={aiDemoSection.ref}
        className={`py-24 transition-all duration-700 ${
          aiDemoSection.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              From a sentence to a live workflow
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-500">
              Type what you need. The AI builds it. You tweak and go live.
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              {/* prompt bar */}
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 font-mono text-sm text-gray-300">&gt;</span>
                  <p className="text-sm text-gray-600">
                    &quot;When someone pays on Razorpay, send a WhatsApp confirmation and log to Notion&quot;
                  </p>
                </div>
              </div>

              {/* generated blocks */}
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                    aiDemoPhase === "generating" ? "bg-amber-400 animate-pulse" : aiDemoPhase === "done" ? "bg-emerald-500" : "bg-gray-300"
                  }`} />
                  <p className="text-xs font-medium text-gray-500">
                    {aiDemoPhase === "typing" ? "Waiting for prompt..." : aiDemoPhase === "generating" ? "Generating workflow..." : "Workflow ready"}
                  </p>
                </div>

                <div className="space-y-3">
                  {aiDemoBlocks.map((block, i) => (
                    <div
                      key={block.type}
                      className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-500 ${
                        i < visibleBlocks
                          ? "border-gray-200 bg-white opacity-100 translate-x-0"
                          : "border-transparent bg-gray-50 opacity-0 translate-x-4"
                      }`}
                    >
                      <AppIcon app={block.app} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{block.name}</p>
                        <p className="text-xs text-gray-500">{block.config}</p>
                      </div>
                      {i < visibleBlocks && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                      )}
                    </div>
                  ))}
                </div>

                {/* connections visualization */}
                {visibleBlocks >= 2 && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <span className="font-medium">Connected & configured</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  </div>
                )}
              </div>

              {/* footer */}
              <div className={`border-t border-gray-100 bg-emerald-50 px-6 py-3 transition-all duration-500 ${
                aiDemoPhase === "done" ? "opacity-100" : "opacity-0"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    3 blocks generated, ready to activate
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <Clock className="h-3 w-3" />
                    1.2s
                  </div>
                </div>
              </div>
            </div>
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
          className={`mb-14 transition-all duration-700 ${
            featuresSection.visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to automate
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-500">
            From natural language input to multi-channel execution.
          </p>
        </div>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`transition-all duration-500 ${
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
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
                {feature.title}
                {feature.badge && (
                  <span className="rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {feature.badge}
                  </span>
                )}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────── */}
      <section ref={howSection.ref} className="border-y border-gray-100 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={`mb-14 transition-all duration-700 ${
              howSection.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
          </div>
          <div className="grid gap-12 lg:grid-cols-3">
            {howItWorks.map((item, i) => (
              <div
                key={item.step}
                className={`transition-all duration-500 ${
                  howSection.visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: howSection.visible
                    ? `${i * 120}ms`
                    : "0ms",
                }}
              >
                <p className="mb-3 font-mono text-4xl font-bold text-gray-200">
                  {item.step}
                </p>
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

      {/* ── India-First Section ──────────────────────────────── */}
      <section
        ref={indiaSection.ref}
        className={`py-24 transition-all duration-700 ${
          indiaSection.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-4 text-sm font-medium tracking-wide text-gray-400 uppercase">
                Built for Indian businesses
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                The first automation platform that speaks your stack
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Razorpay payments, WhatsApp Business messages, MSG91 notifications —
                integrations that global platforms ignore but your business depends on.
              </p>
              <div className="mt-8 space-y-5">
                {[
                  {
                    title: "Razorpay triggers",
                    text: "Auto-trigger workflows on payment captured, failed, or refunded events.",
                  },
                  {
                    title: "WhatsApp notifications",
                    text: "Send template messages via WhatsApp Business to customers instantly.",
                  },
                  {
                    title: "INR pricing",
                    text: "Affordable plans designed for Indian startups and SMBs. Pay with Razorpay.",
                  },
                ].map((item) => (
                  <div key={item.title}>
                    <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* demo workflow card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <AppIcon app="razorpay" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Payment Confirmation Flow
                    </p>
                    <p className="text-xs text-gray-500">
                      Razorpay → WhatsApp + Notion
                    </p>
                  </div>
                </div>
                <span className="relative flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Active
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { app: "razorpay", label: "Payment captured", detail: "Amount: {{payment.amount}} INR", done: true },
                  { app: "whatsapp", label: "WhatsApp sent", detail: "To: {{customer.contact}}", done: true },
                  { app: "notion", label: "Notion page created", detail: "Database: Payment Log", done: true },
                ].map((step, i) => (
                  <div key={step.label}>
                    <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                      <AppIcon app={step.app} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{step.label}</p>
                        <p className="text-xs text-gray-500">{step.detail}</p>
                      </div>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    {i < 2 && (
                      <div className="ml-[1.875rem] h-3 border-l-2 border-emerald-300" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Workflow complete
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <Clock className="h-3 w-3" />
                  280ms
                </div>
              </div>
            </div>
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
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Start from a template
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-500">
              Pre-built workflows for common use cases. Clone, customize, and go live.
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
                      template.badge === "India"
                        ? "bg-orange-500 text-white"
                        : template.badge === "New"
                          ? "bg-blue-600 text-white"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {template.badge}
                  </span>
                )}
                <div className="mb-5 flex gap-2">
                  {template.apps.map((app) => (
                    <AppIcon key={app} app={app} size="sm" />
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
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-slate-500/20 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Stop clicking. Start describing.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-gray-400">
                Join the first AI-native workflow platform. Describe what you need,
                and let APIfyn handle the rest. Free to start.
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
                No credit card · Free forever plan · Setup in 60 seconds
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
