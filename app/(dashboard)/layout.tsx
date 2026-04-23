"use client";

import { AuthNavbar } from "@/components/layout/auth-navbar";
import { useAuth } from "@/components/providers/auth-provider";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">
            Sign in required
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Use the homepage sign-in button to access your workspace.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Go home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <AuthNavbar />
      {children}
    </div>
  );
}
