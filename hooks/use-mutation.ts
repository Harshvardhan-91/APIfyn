"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch } from "@/lib/api/client";
import { useState } from "react";

export function useMutation<TInput, TOutput>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function mutate(input?: TInput) {
    if (!user?.token) {
      throw new Error("Sign in required");
    }

    setLoading(true);
    try {
      return await apiFetch<TOutput>(path, {
        method,
        token: user.token,
        body: input ? JSON.stringify(input) : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return { mutate, loading };
}
