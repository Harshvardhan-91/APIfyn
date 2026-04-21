"use client";

import { apiFetch } from "@/lib/api/client";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./auth-provider";

type PlanInfo = {
  id: string;
  name: string;
  slug: string;
  workflowsLimit: number;
  apiCallsLimit: number;
};

type UsageInfo = {
  workflows: number;
  apiCalls: number;
};

type SubscriptionInfo = {
  id: string;
  status: string;
  interval: string;
  currentPeriodEnd: string | null;
} | null;

type PaymentContextValue = {
  isLoading: boolean;
  error: string | null;
  plan: PlanInfo | null;
  usage: UsageInfo | null;
  subscription: SubscriptionInfo;
  initiatePayment: (
    planSlug: string,
    interval: "monthly" | "yearly",
  ) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshPlan: () => Promise<void>;
};

const PaymentContext = createContext<PaymentContextValue | null>(null);

export function usePayment() {
  const value = useContext(PaymentContext);
  if (!value) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return value;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: () => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(null);

  const refreshPlan = useCallback(async () => {
    if (!user?.token) return;
    try {
      const data = await apiFetch<{
        plan: PlanInfo | null;
        usage: UsageInfo;
        subscription: SubscriptionInfo;
      }>("/api/subscriptions", { token: user.token });
      setPlan(data.plan);
      setUsage(data.usage);
      setSubscription(data.subscription);
    } catch {
      // Silently fail — user stays on inferred free plan
    }
  }, [user?.token]);

  useEffect(() => {
    refreshPlan();
  }, [refreshPlan]);

  async function initiatePayment(
    planSlug: string,
    interval: "monthly" | "yearly",
  ) {
    if (!user?.token) {
      setError("Please sign in first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadRazorpayScript();

      const data = await apiFetch<{
        subscriptionId: string;
        razorpayKey: string;
      }>("/api/subscriptions/create", {
        method: "POST",
        token: user.token,
        body: JSON.stringify({ planSlug, interval }),
      });

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: data.razorpayKey,
          subscription_id: data.subscriptionId,
          name: "APIfyn",
          description: `${planSlug.charAt(0).toUpperCase() + planSlug.slice(1)} Plan (${interval})`,
          theme: { color: "#111827" },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_subscription_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await apiFetch("/api/subscriptions/verify", {
                method: "POST",
                token: user.token,
                body: JSON.stringify(response),
              });
              await refreshPlan();
              resolve();
            } catch (verifyError) {
              reject(verifyError);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled"));
            },
          },
          prefill: {
            email: user.email ?? undefined,
            name: user.displayName ?? undefined,
          },
        });
        rzp.open();
      });
    } catch (paymentError) {
      const msg =
        paymentError instanceof Error
          ? paymentError.message
          : "Payment failed";
      if (msg !== "Payment cancelled") {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function cancelSubscription() {
    if (!user?.token) return;
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch("/api/subscriptions/cancel", {
        method: "POST",
        token: user.token,
      });
      await refreshPlan();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Failed to cancel subscription",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PaymentContext.Provider
      value={{
        isLoading,
        error,
        plan,
        usage,
        subscription,
        initiatePayment,
        cancelSubscription,
        refreshPlan,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}
