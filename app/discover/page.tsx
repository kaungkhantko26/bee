"use client";

import { Suspense, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { LiveHirerMetrics } from "@/components/live-hirer-metrics";
import { LiveWorkerList } from "@/components/live-worker-list";
import {
  Panel,
  SectionHeading,
  StatusPill,
} from "@/components/ui";

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverPageFallback />}>
      <DiscoverPageContent />
    </Suspense>
  );
}

function DiscoverPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = useMemo(
    () =>
      [
        searchParams.get("service"),
        searchParams.get("location"),
        searchParams.get("q"),
      ]
        .filter(Boolean)
        .join(" ")
        .trim(),
    [searchParams],
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  return (
    <RoleGate allow="hirer">
      <AppShell
        currentPath="/discover"
        badge="Live worker matching"
        title="See who can take the job now."
        description="Discover is the live dispatch layer: compare ETA, availability, and worker readiness before sending or repeating a request."
        primaryAction={{ href: "/request", label: "Send instant request" }}
        secondaryAction={{ href: "/bookings", label: "Open my bookings" }}
      >
        <LiveHirerMetrics />

      <section className="mt-6 grid gap-6">
        <Panel>
          <SectionHeading
            eyebrow="Dispatch search"
            title={searchQuery.trim() ? `Workers for "${searchQuery.trim()}"` : "Find the fastest available worker"}
            description="Filter by service, location, or problem. This page is optimized for nearby availability and quick dispatch decisions, not long profile browsing."
          />
          <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-4">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Plumber in Sanchaung, AC repair, urgent electrical..."
              className="min-h-14 w-full rounded-full border border-black/10 bg-white px-5 py-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/12"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {["within 30 minutes", "plumber", "electrician", "urgent cleaning"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSearchQuery(filter)}
                  className="appearance-none border-0 bg-transparent p-0"
                >
                  <StatusPill>{filter}</StatusPill>
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-6">
        <LiveWorkerList searchQuery={deferredSearchQuery} />
      </section>
      </AppShell>
    </RoleGate>
  );
}

function DiscoverPageFallback() {
  return (
    <RoleGate allow="hirer">
      <AppShell
        currentPath="/discover"
        badge="Customer App"
        title="Search, compare, chat, and book without leaving the same flow."
        description="Find nearby workers, compare availability, send urgent requests, and keep every conversation in one place."
        primaryAction={{ href: "/bookings", label: "Open my bookings" }}
        secondaryAction={{ href: "/", label: "Back to overview" }}
      >
        <section className="mt-6">
          <Panel>
            <p className="text-sm text-[var(--muted)]">Loading live worker matching...</p>
          </Panel>
        </section>
      </AppShell>
    </RoleGate>
  );
}
