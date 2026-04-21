"use client";

import { apiFetch } from "@/lib/api/client";
import { type ReactNode, createContext, useContext, useState } from "react";
import { useAuth } from "./auth-provider";

type PaymentContextValue = {
  isLoading: boolean;
  error: string | null;
  currentPlan: unknown;
  initiatePayment: (
    planId: string,
    interval: "monthly" | "yearly",
  ) => Promise<void>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
};

const PaymentContext = createContext<PaymentContextValue | null>(null);

export function usePayment() {
  const value = useContext(PaymentContext);
  if (!value) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return value;
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    if ((window as typeof window & { Razorpay?: unknown }).Razorpay) {
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
  const { user, refreshToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<unknown>(null);

  async function initiatePayment(
    planId: string,
    interval: "monthly" | "yearly",
  ) {
    setIsLoading(true);
    setError(null);

    try {
      await loadRazorpay();
      const token = await refreshToken();
      const data = await apiFetch<{
        subscription: { razorpaySubId: string; plan: { name: string } };
        razorpayKey: string;
      }>("/api/subscriptions/create", {
        method: "POST",
        token,
        body: JSON.stringify({ planId, interval }),
      });

      setCurrentPlan(data.subscription.plan);
    } catch (paymentError) {
      setError(
        paymentError instanceof Error ? paymentError.message : "Payment failed",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function cancelSubscription(subscriptionId: string) {
    if (!user?.token) {
      throw new Error("Sign in required");
    }

    setIsLoading(true);
    setError(null);
    try {
      await apiFetch("/api/subscriptions/cancel", {
        method: "POST",
        token: user.token,
        body: JSON.stringify({ subscriptionId }),
      });
      setCurrentPlan(null);
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
        currentPlan,
        initiatePayment,
        cancelSubscription,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}
