"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Crown,
  Eye,
  Link2,
  Loader2,
  Lock,
  Search,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Stats = {
  totalUsers: number;
  totalWorkflows: number;
  totalExecutions: number;
  totalIntegrations: number;
  recentUsers: number;
  activeSubscriptions: number;
};

type UserRow = {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  apiCallsUsed: number;
  _count: { workflows: number; executions: number; integrations: number };
  subscription: { status: string; plan: { name: string; slug: string } } | null;
};

type UserWorkflow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: string;
  totalRuns: number;
  lastRunAt: string | null;
  createdAt: string;
  _count: { executions: number };
};

const TOKEN_KEY = "apifyn_admin_token";

export function AdminPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const data = await apiFetch<{ token: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8">
            <div className="mb-6 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900">
                <Lock className="h-5 w-5 text-white" />
              </span>
              <h1 className="text-lg font-bold text-gray-900">Admin Access</h1>
              <p className="mt-1 text-xs text-gray-500">
                Enter your admin credentials
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Admin secret"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {loginError ? (
                <p className="text-xs text-red-600">{loginError}</p>
              ) : null}
              <Button className="w-full" disabled={loginLoading || !password}>
                {loginLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <AdminDashboard token={token} onLogout={handleLogout} />;
}

function AdminDashboard({
  token,
  onLogout,
}: { token: string; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        apiFetch<{ stats: Stats }>("/api/admin/stats", { token }),
        apiFetch<{
          users: UserRow[];
          pagination: { total: number };
        }>(
          `/api/admin/users?page=${page}&limit=50&search=${encodeURIComponent(search)}`,
          {
            token,
          },
        ),
      ]);
      setStats(statsData.stats);
      setUsers(usersData.users);
      setTotal(usersData.pagination.total);
    } catch {
      onLogout();
    } finally {
      setLoading(false);
    }
  }, [token, page, search, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  if (selectedUser) {
    return (
      <UserDetail
        userId={selectedUser}
        token={token}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Admin Panel
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor users, workflows, and platform health
            </p>
          </div>
          <Button variant="ghost" onClick={onLogout}>
            Logout
          </Button>
        </div>

        {/* Stats */}
        {stats ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              {
                label: "Users",
                value: stats.totalUsers,
                icon: Users,
                color: "bg-blue-50 text-blue-600",
              },
              {
                label: "Workflows",
                value: stats.totalWorkflows,
                icon: Workflow,
                color: "bg-purple-50 text-purple-600",
              },
              {
                label: "Executions",
                value: stats.totalExecutions,
                icon: Activity,
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                label: "Integrations",
                value: stats.totalIntegrations,
                icon: Link2,
                color: "bg-amber-50 text-amber-600",
              },
              {
                label: "New (7d)",
                value: stats.recentUsers,
                icon: Sparkles,
                color: "bg-pink-50 text-pink-600",
              },
              {
                label: "Paid Subs",
                value: stats.activeSubscriptions,
                icon: Crown,
                color: "bg-violet-50 text-violet-600",
              },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-3 py-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.color}`}
                  >
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-[11px] text-gray-500">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Users table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Users ({total})
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="h-9 pl-9 text-sm"
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : users.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">
                No users found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium text-center">
                        Workflows
                      </th>
                      <th className="pb-3 font-medium text-center">
                        Executions
                      </th>
                      <th className="pb-3 font-medium text-center">
                        API Calls
                      </th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 font-medium">Last Login</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const planSlug = u.subscription?.plan?.slug ?? "starter";
                      const planName = u.subscription?.plan?.name ?? "Starter";
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-gray-50 transition hover:bg-gray-50/50"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              {u.photoURL ? (
                                <Image
                                  src={u.photoURL}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                                  {(u.displayName ?? u.email)
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {u.displayName ?? "—"}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                planSlug === "enterprise"
                                  ? "bg-violet-100 text-violet-700"
                                  : planSlug === "professional"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {planSlug === "enterprise" ? (
                                <Sparkles className="h-3 w-3" />
                              ) : planSlug === "professional" ? (
                                <Crown className="h-3 w-3" />
                              ) : (
                                <Zap className="h-3 w-3" />
                              )}
                              {planName}
                            </span>
                          </td>
                          <td className="py-3 text-center text-gray-700">
                            {u._count.workflows}
                          </td>
                          <td className="py-3 text-center text-gray-700">
                            {u._count.executions}
                          </td>
                          <td className="py-3 text-center text-gray-700">
                            {u.apiCallsUsed}
                          </td>
                          <td className="py-3 pr-4 text-xs text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 pr-4 text-xs text-gray-500">
                            {u.lastLoginAt
                              ? new Date(u.lastLoginAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              className="rounded-lg p-1.5 transition hover:bg-gray-100"
                              onClick={() => setSelectedUser(u.id)}
                              title="View workflows"
                            >
                              <Eye className="h-4 w-4 text-gray-400" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {total > 50 ? (
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <Button
                  variant="ghost"
                  className="text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-gray-400">
                  Page {page} of {Math.ceil(total / 50)}
                </span>
                <Button
                  variant="ghost"
                  className="text-xs"
                  disabled={page * 50 >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function UserDetail({
  userId,
  token,
  onBack,
}: { userId: string; token: string; onBack: () => void }) {
  const [data, setData] = useState<{
    user: { id: string; email: string; displayName: string | null };
    workflows: UserWorkflow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{
      user: { id: string; email: string; displayName: string | null };
      workflows: UserWorkflow[];
    }>(`/api/admin/users/${userId}/workflows`, { token })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, token]);

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-900"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : data ? (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">
                {data.user.displayName ?? data.user.email}
              </h1>
              <p className="text-sm text-gray-500">{data.user.email}</p>
            </div>
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-900">
                  Workflows ({data.workflows.length})
                </h2>
              </CardHeader>
              <CardContent>
                {data.workflows.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">
                    No workflows
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.workflows.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                            <Workflow className="h-4 w-4 text-gray-500" />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {w.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {w.triggerType} &middot; {w.totalRuns} runs
                              &middot; Created{" "}
                              {new Date(w.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              w.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {w.isActive ? "Active" : "Paused"}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-center text-sm text-gray-400">User not found</p>
        )}
      </div>
    </main>
  );
}
