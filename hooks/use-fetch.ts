"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch } from "@/lib/api/client";
import useSWR from "swr";

export function useFetch<T>(path: string | null) {
  const { user } = useAuth();

  return useSWR<T>(
    path && user?.token ? [path, user.token] : null,
    ([url, token]: [string, string]) => apiFetch<T>(url, { token }),
  );
}
