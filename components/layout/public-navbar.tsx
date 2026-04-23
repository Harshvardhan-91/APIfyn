"use client";

import { GoogleIcon } from "@/components/icons/brand-icons";
import { useAuth } from "@/components/providers/auth-provider";
import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export const LANDING_SECTION_SCROLL_KEY = "apifyn-landing-section";

const navItems: Array<
  { label: string; type: "section"; sectionId: "features" | "templates" } | { label: string; type: "route"; href: string }
> = [
  { label: "Features", type: "section", sectionId: "features" },
  { label: "Templates", type: "section", sectionId: "templates" },
  { label: "Pricing", type: "route", href: "/pricing" },
];

export function PublicNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, login } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  function scrollToSection(sectionId: "features" | "templates") {
    if (pathname === "/") {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", "/");
      }
    } else {
      sessionStorage.setItem(LANDING_SECTION_SCROLL_KEY, sectionId);
      router.push("/");
    }
  }

  function onLogoClick() {
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

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
        <Link
          href="/"
          onClick={onLogoClick}
          className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          title="APIfyn — home"
        >
          <Image
            src="/logo.png"
            alt="APIfyn"
            width={32}
            height={32}
            className="shrink-0 rounded-lg"
            priority
          />
          <span className="text-base font-semibold tracking-tight text-gray-900">
            APIfyn
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {navItems.map((item) =>
            item.type === "section" ? (
              <button
                key={item.sectionId}
                type="button"
                onClick={() => scrollToSection(item.sectionId)}
                className="rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              Open dashboard
              <ArrowRight className="h-3.5 w-3.5 text-gray-500" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
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
          {navItems.map((item) =>
            item.type === "section" ? (
              <button
                key={item.sectionId}
                type="button"
                className="block w-full rounded-lg px-3 py-3 text-left text-sm text-gray-600 hover:bg-gray-50"
                onClick={() => {
                  scrollToSection(item.sectionId);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-3 text-sm text-gray-600 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
          {user ? (
            <Link
              href="/dashboard"
              className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Open dashboard
              <ArrowRight className="h-3.5 w-3.5 text-gray-500" />
            </Link>
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
