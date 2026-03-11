"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { employerNav, hirerNav, publicNav } from "@/lib/mock-data";
import { cn } from "@/components/ui";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { WorkerPresenceControl } from "@/components/worker-presence-control";
import { BrandLogo } from "@/components/brand-logo";

type Action = {
  href: string;
  label: string;
};

export function AppShell({
  currentPath,
  badge,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: {
  currentPath: string;
  badge: string;
  title: string;
  description: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  children: ReactNode;
}) {
  const router = useRouter();
  const { configured, loading, session, profile } = useAuthProfile();
  const { copy } = useLanguage();
  const lastScrollY = useRef(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  const navItems =
    configured && !loading && profile
      ? profile.role === "employer"
        ? employerNav
        : hirerNav
      : publicNav;

  async function handleSignOut() {
    if (!configured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 24) {
        setHeaderVisible(true);
      } else if (delta > 8) {
        setHeaderVisible(false);
      } else if (delta < -8) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    }

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <main className="min-h-screen">
      <header
        className={cn(
          "sticky top-0 z-40 px-4 pt-4 transition-transform duration-300 ease-out sm:px-6 lg:px-8",
          headerVisible ? "translate-y-0" : "-translate-y-[calc(100%+1.5rem)]",
        )}
      >
        <div className="mx-auto max-w-7xl rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,247,216,0.84))] px-4 py-3 shadow-[0_26px_60px_rgba(94,74,0,0.14),0_10px_24px_rgba(94,74,0,0.08),inset_0_1px_0_rgba(255,255,255,0.94)] backdrop-blur-xl sm:px-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <BrandLogo imageClassName="object-cover" tagline={copy.brandTagline} />

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
                {session && profile?.role === "employer" ? <WorkerPresenceControl /> : null}
                <LanguageSwitcher />
                <Link
                  href={session ? (profile?.role === "employer" ? "/worker" : "/discover") : "/auth"}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(255,252,232,0.98),rgba(255,236,156,0.94))] px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_28px_rgba(94,74,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  {session ? copy.common.myWorkspace : copy.common.signInUp}
                </Link>
              </div>
            </div>

            <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
              <nav className="grid min-w-0 w-full grid-cols-2 gap-2 rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,248,214,0.98),rgba(255,236,156,0.8))] p-2 shadow-[0_18px_34px_rgba(94,74,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] sm:grid-cols-3 xl:grid-cols-6 xl:rounded-full xl:p-1.5">
                {navItems.map((item) => {
                  const active = item.href === currentPath;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex min-h-11 min-w-0 items-center justify-center rounded-full px-4 py-2.5 text-center text-sm font-medium leading-tight transition",
                        active
                          ? "bg-[linear-gradient(180deg,rgba(255,236,122,1),rgba(244,196,3,0.95))] text-[var(--foreground)] shadow-[0_16px_30px_rgba(244,196,3,0.22),inset_0_1px_0_rgba(255,255,255,0.72)]"
                          : "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,214,0.9))] text-[var(--foreground)] shadow-[0_10px_22px_rgba(94,74,0,0.08),inset_0_1px_0_rgba(255,255,255,0.92)] hover:text-[var(--accent-strong)]",
                      )}
                    >
                      {copy.nav[item.labelKey]}
                    </Link>
                  );
                })}
              </nav>

              {(secondaryAction || primaryAction) ? (
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
                  {secondaryAction ? (
                    <Link
                      href={secondaryAction.href}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,216,0.94))] px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_28px_rgba(94,74,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:-translate-y-0.5 sm:min-w-[10.5rem] sm:w-auto"
                  >
                    {secondaryAction.label}
                  </Link>
                  ) : null}
                  {primaryAction ? (
                    <Link
                      href={primaryAction.href}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full !bg-[linear-gradient(180deg,rgba(255,236,122,1),rgba(244,196,3,0.95))] px-5 py-2 text-sm font-semibold !text-[var(--foreground)] shadow-[0_18px_34px_rgba(244,196,3,0.24),inset_0_1px_0_rgba(255,255,255,0.76)] transition hover:-translate-y-0.5 hover:brightness-[1.02] sm:min-w-[11rem] sm:w-auto"
                  >
                    {primaryAction.label}
                  </Link>
                  ) : null}
                  {configured && session ? (
                    <button
                      type="button"
                      onClick={() => {
                        void handleSignOut();
                      }}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,216,0.94))] px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_28px_rgba(94,74,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:-translate-y-0.5 sm:min-w-[9rem] sm:w-auto"
                    >
                      {copy.common.signOut}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 sm:px-8 sm:pt-24 lg:px-10">
        <section className="grid gap-8 pb-10 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div>
            <p className="inline-flex rounded-full border border-[var(--accent)]/35 bg-[var(--accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)] shadow-[0_8px_20px_rgba(245,196,0,0.12)]">
              {badge}
            </p>
            <h1 className="mt-6 max-w-4xl pr-2 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--foreground)] sm:mt-7 sm:pr-4 sm:text-5xl xl:text-[4.5rem]">
              {title}
            </h1>
          </div>
          <div className="rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,216,0.82))] p-6 shadow-[0_24px_70px_rgba(94,74,0,0.12),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Product summary
            </p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              {description}
            </p>
          </div>
        </section>
        {children}
      </div>
    </main>
  );
}
