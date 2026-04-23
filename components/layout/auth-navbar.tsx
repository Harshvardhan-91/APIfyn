"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  LayoutDashboard,
  LinkIcon,
  LogOut,
  Menu,
  Settings,
  User,
  Workflow,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/80 bg-white">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="APIfyn"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="hidden text-sm font-semibold text-gray-900 sm:block">
              APIfyn
            </span>
          </Link>

          <div className="hidden h-5 w-px bg-gray-200 lg:block" />

          <nav className="hidden items-center gap-0.5 lg:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            className="hidden px-2 lg:inline-flex"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-4 w-4 text-gray-500" />
          </Button>

          {/* Profile dropdown */}
          <div className="relative hidden lg:block" ref={profileRef}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-gray-50"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName ?? "User"}
                  width={26}
                  height={26}
                  className="rounded-full"
                />
              ) : (
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white">
                  {(user?.displayName ?? user?.email ?? "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
              <span className="max-w-[120px] truncate text-[13px] font-medium text-gray-700">
                {user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0]}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user?.displayName ?? "APIfyn User"}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {user?.email}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/profile");
                  }}
                >
                  <User className="h-3.5 w-3.5" />
                  Profile
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/settings");
                  }}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="rounded-lg p-2 transition hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="my-2 border-t border-gray-100" />
            <Link
              href="/profile"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
