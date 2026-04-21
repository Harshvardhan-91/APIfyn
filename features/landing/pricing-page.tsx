"use client";

import { PublicNavbar } from "@/components/layout/public-navbar";
import { usePayment } from "@/components/providers/payment-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    description: "Perfect for trying out APIfyn.",
    features: [
      "100 API calls / month",
      "5 workflows",
      "GitHub & Slack integrations",
      "Community support",
    ],
    highlighted: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "$20",
    description: "For growing teams that need more power.",
    features: [
      "10,000 API calls / month",
      "Unlimited workflows",
      "All integrations",
      "Priority support",
      "Execution logs",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
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
  const { initiatePayment, isLoading } = usePayment();

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
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative",
                plan.highlighted &&
                  "border-gray-900 ring-1 ring-gray-900 shadow-lg",
              )}
            >
              {plan.highlighted ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </div>
              ) : null}
              <CardContent className="pt-8">
                <h2 className="text-base font-semibold text-gray-900">
                  {plan.name}
                </h2>
                <p className="mt-1 text-xs text-gray-500">{plan.description}</p>
                <p className="mt-5">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-sm text-gray-500">/mo</span>
                </p>
                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
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
                  className={cn("mt-8 w-full", plan.highlighted ? "" : "")}
                  variant={plan.highlighted ? "primary" : "secondary"}
                  disabled={isLoading}
                  onClick={() => initiatePayment(plan.id, "monthly")}
                >
                  {plan.price === "$0" ? "Start Free" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
