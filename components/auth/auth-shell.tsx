"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Panel, StatusPill } from "@/components/ui";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BrandLogoLink } from "@/components/brand-logo";

export function AuthShell({ children }: { children: ReactNode }) {
  const { copy } = useLanguage();

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col overflow-hidden rounded-[2.25rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,247,216,0.82))] shadow-[0_32px_120px_rgba(90,72,0,0.14),inset_0_1px_0_rgba(255,255,255,0.94)] backdrop-blur">
        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <BrandLogoLink href="/" tagline={copy.brandTagline} />
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <LanguageSwitcher />
            <Link
              href="/"
              className="rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,216,0.94))] px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_28px_rgba(94,74,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:-translate-y-0.5"
            >
              {copy.common.backToWebsite}
            </Link>
          </div>
        </div>

        <div className="grid flex-1 gap-0 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="relative overflow-hidden bg-[linear-gradient(160deg,rgba(255,244,181,0.92),rgba(255,255,255,0.76))] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
            <div className="absolute right-[-4rem] top-16 h-56 w-56 rounded-full bg-[var(--accent)]/22 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[var(--accent-soft)]/70 blur-3xl" />

            <StatusPill>{copy.auth.shellBadge}</StatusPill>
            <h1 className="relative mt-6 max-w-xl font-[family-name:var(--font-display)] text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-[var(--foreground)] sm:text-6xl">
              {copy.auth.shellTitle}
            </h1>
            <p className="relative mt-6 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              {copy.auth.shellBody}
            </p>

            <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
              <Panel className="bg-white/78">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  {copy.auth.hirer}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {copy.auth.hirerBody}
                </p>
              </Panel>
              <Panel className="bg-white/78">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  {copy.auth.employer}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {copy.auth.employerBody}
                </p>
              </Panel>
              <Panel className="bg-white/78">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  {copy.auth.supabase}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {copy.auth.supabaseBody}
                </p>
              </Panel>
            </div>
          </section>

          <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,247,216,0.74))] px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
