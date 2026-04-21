"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  LayoutDashboard,
  LinkIcon,
  LogOut,
  Settings,
  Workflow,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workflows", href: "/workflows", icon: Workflow },
  { label: "Integrations", href: "/integrations", icon: LinkIcon },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function AuthNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="APIfyn"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="hidden text-base font-semibold text-gray-900 sm:block">
            APIfyn
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-gray-100 sm:flex"
          >
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? "User"}
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                {(user?.displayName ?? user?.email ?? "U")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
            <span className="max-w-32 truncate text-sm text-gray-700">
              {user?.displayName ?? user?.email}
            </span>
          </Link>
          <Button
            variant="ghost"
            className="hidden px-2.5 sm:inline-flex"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="px-2.5" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
