"use client";

import { GoogleIcon } from "@/components/icons/brand-icons";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "Templates", href: "/#templates" },
  { label: "Pricing", href: "/pricing" },
];

export function PublicNavbar() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleGetStarted() {
    if (user) {
      router.push("/dashboard");
      return;
    }
    setIsLoggingIn(true);
    try {
      await login();
      router.push("/dashboard");
    } finally {
      setIsLoggingIn(false);
    }
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
          <span className="text-base font-semibold text-gray-900">APIfyn</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button
                variant="ghost"
                className="text-sm"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
              <Button
                className="text-sm"
                onClick={() => router.push("/dashboard")}
              >
                Open App
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow disabled:opacity-50"
              onClick={handleGetStarted}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              {isLoggingIn ? "Signing in..." : "Sign in with Google"}
            </button>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-3 text-sm text-gray-600"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Button
              className="mt-3 w-full text-sm"
              onClick={() => router.push("/dashboard")}
            >
              Open App <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <button
              type="button"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              onClick={handleGetStarted}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              {isLoggingIn ? "Signing in..." : "Sign in with Google"}
            </button>
          )}
        </div>
      ) : null}
    </header>
  );
}
