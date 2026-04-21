"use client";

import { AuthNavbar } from "@/components/layout/auth-navbar";
import { useAuth } from "@/components/providers/auth-provider";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-600">Loading APIfyn...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">
            Sign in required
          </h1>
          <p className="mt-2 text-slate-600">
            Use the homepage sign-in button to access your workspace.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
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
