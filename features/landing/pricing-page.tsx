"use client";

import { PublicNavbar } from "@/components/layout/public-navbar";
import { usePayment } from "@/components/providers/payment-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const plans = [
  {
    slug: "starter",
    name: "Starter",
    price: "$0",
    description: "Perfect for trying out APIfyn.",
    features: [
      "100 API calls / month",
      "2 workflows",
      "GitHub & Slack integrations",
      "Community support",
    ],
    highlighted: false,
  },
  {
    slug: "professional",
    name: "Professional",
    price: "$20",
    description: "For growing teams that need more power.",
    features: [
      "10,000 API calls / month",
      "20 workflows",
      "All integrations",
      "Priority support",
      "Execution logs",
    ],
    highlighted: true,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    price: "$30",
    description: "For organizations with advanced needs.",
    features: [
      "Unlimited API calls",
      "Unlimited workflows",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated support",
      "SSO & SAML",
    ],
    highlighted: false,
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

  function getButtonLabel(slug: string) {
    if (!user) return slug === "starter" ? "Start Free" : "Get Started";
    if (currentPlan?.slug === slug) return "Current Plan";
    if (slug === "starter") return "Start Free";
    return "Upgrade";
  }

  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-gray-600">
            Start free. Upgrade when you need more power.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
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
                    <span className="text-sm text-gray-500">/mo</span>
                  </p>
                  <div className="mt-6 space-y-3">
                    {p.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
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
                    {getButtonLabel(p.slug)}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
