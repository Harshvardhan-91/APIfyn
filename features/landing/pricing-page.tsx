"use client";

import { PublicNavbar } from "@/components/layout/public-navbar";
import { useAuth } from "@/components/providers/auth-provider";
import { usePayment } from "@/components/providers/payment-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const plans = [
  {
    slug: "starter",
    name: "Free",
    price: "$0",
    period: "",
    description: "Get started with workflow automation.",
    features: [
      "500 workflow runs / month",
      "5 workflows",
      "Core integrations (GitHub, Slack, Discord)",
      "AI workflow builder (10 / month)",
      "Community support",
    ],
    highlighted: false,
    cta: "Start Free",
  },
  {
    slug: "professional",
    name: "Pro",
    price: "$15",
    period: "/mo",
    description: "For teams that automate daily.",
    features: [
      "10,000 workflow runs / month",
      "25 workflows",
      "All integrations",
      "AI workflow builder (50 / month)",
      "Priority support",
      "Execution logs & analytics",
    ],
    highlighted: true,
    cta: "Upgrade to Pro",
  },
  {
    slug: "enterprise",
    name: "Business",
    price: "$49",
    period: "/mo",
    description: "For growing businesses with complex workflows.",
    features: [
      "50,000 workflow runs / month",
      "Unlimited workflows",
      "All integrations + priority access",
      "AI workflow builder (200 / month)",
      "Advanced analytics",
      "Priority support",
    ],
    highlighted: false,
    cta: "Upgrade to Business",
  },
];

export function PricingPage() {
  const { user } = useAuth();
  const { initiatePayment, isLoading, plan: currentPlan } = usePayment();
  const router = useRouter();
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  async function handlePlanClick(slug: string) {
    if (slug === "starter") {
      router.push("/dashboard");
      return;
    }

    if (!user) {
      router.push("/dashboard");
      return;
    }

    if (currentPlan?.slug === slug) return;

    setLoadingSlug(slug);
    try {
      await initiatePayment(slug, "monthly");
    } finally {
      setLoadingSlug(null);
    }
  }

  function getButtonLabel(plan: (typeof plans)[number]) {
    if (!user) return plan.slug === "starter" ? "Start Free" : "Get Started";
    if (currentPlan?.slug === plan.slug) return "Current Plan";
    return plan.cta;
  }

  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-gray-500">
            Start free. Upgrade when you need more power. No surprises.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = currentPlan?.slug === p.slug;
            const busy = isLoading && loadingSlug === p.slug;

            return (
              <Card
                key={p.slug}
                className={cn(
                  "relative",
                  p.highlighted &&
                    "border-gray-900 ring-1 ring-gray-900 shadow-lg",
                  isCurrent && "ring-2 ring-emerald-500 border-emerald-500",
                )}
              >
                {p.highlighted && !isCurrent ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                    Most popular
                  </div>
                ) : null}
                {isCurrent ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">
                    Current plan
                  </div>
                ) : null}
                <CardContent className="pt-8">
                  <h2 className="text-base font-semibold text-gray-900">
                    {p.name}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">{p.description}</p>
                  <p className="mt-5">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      {p.price}
                    </span>
                    {p.period && (
                      <span className="text-sm text-gray-500">{p.period}</span>
                    )}
                  </p>
                  <div className="mt-6 space-y-3">
                    {p.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button
                    className={cn("mt-8 w-full")}
                    variant={p.highlighted ? "primary" : "secondary"}
                    disabled={busy || isCurrent}
                    onClick={() => handlePlanClick(p.slug)}
                  >
                    {busy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {getButtonLabel(p)}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm text-gray-400">
            Need custom limits, SLA, or SSO?{" "}
            <a href="/contact-us" className="text-gray-600 underline underline-offset-2 transition hover:text-gray-900">
              Contact us
            </a>{" "}
            for Enterprise pricing.
          </p>
        </div>
      </section>
    </main>
  );
}
