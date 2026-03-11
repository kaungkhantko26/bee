import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import {
  MetricCard,
  Panel,
  SectionHeading,
  StatusPill,
} from "@/components/ui";
import {
  adminMetrics,
  cityPulse,
  disputeQueue,
  verificationQueue,
} from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <RoleGate allow="employer">
      <AppShell
        currentPath="/admin"
        badge="Admin Ops"
        title="Operate trust, quality, and revenue from one control layer."
        description="Monitor verification, disputes, revenue, and city-level activity from one operations dashboard."
        primaryAction={{ href: "/worker", label: "Open worker hub" }}
        secondaryAction={{ href: "/", label: "Back to overview" }}
      >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map((item) => (
          <MetricCard key={item.label} value={item.value} label={item.label} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel>
          <SectionHeading
            eyebrow="Verification queue"
            title="Approve legitimate workers and catch weak applications."
            description="Worker quality is a marketplace input, not a moderation afterthought."
          />
          <div className="mt-6 space-y-4">
            {verificationQueue.map((candidate) => (
              <div
                key={candidate.name}
                className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{candidate.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{candidate.skill}</p>
                  </div>
                  <StatusPill>{candidate.state}</StatusPill>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">{candidate.documents}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Disputes"
            title="Keep booking issues contained before they damage trust."
            description="The dispute layer needs visibility into both money and evidence."
          />
          <div className="mt-6 space-y-4">
            {disputeQueue.map((dispute) => (
              <div
                key={dispute.booking}
                className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{dispute.booking}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{dispute.issue}</p>
                  </div>
                  <StatusPill tone="warning">{dispute.state}</StatusPill>
                </div>
                <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                  Exposure: {dispute.amount}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="!bg-[linear-gradient(180deg,rgba(55,42,10,0.98),rgba(35,26,4,1))] !text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/92">
            Revenue health
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
            Commission depends on trust and completion rate.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/8 p-5">
              <p className="text-sm text-white/90">Completed today</p>
              <p className="mt-2 text-3xl font-semibold text-white">67 jobs</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/8 p-5">
              <p className="text-sm text-white/90">Refund rate</p>
              <p className="mt-2 text-3xl font-semibold text-white">1.8%</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/8 p-5">
              <p className="text-sm text-white/90">Average fee</p>
              <p className="mt-2 text-3xl font-semibold text-white">$27.80</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/8 p-5">
              <p className="text-sm text-white/90">Payout delay</p>
              <p className="mt-2 text-3xl font-semibold text-white">0.6 days</p>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="City operations"
            title="Watch supply and demand zone by zone."
            description="Availability-based search only works if the platform sees where demand spikes and where worker supply thins out."
          />
          <div className="mt-6 space-y-3">
            {cityPulse.map((zone) => (
              <div
                key={zone.zone}
                className="flex flex-col gap-3 rounded-[1.25rem] border border-black/10 bg-[var(--panel)] px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <p className="font-semibold text-[var(--foreground)]">{zone.zone}</p>
                <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                  <p>{zone.liveJobs} live jobs</p>
                  <p>{zone.availableWorkers} available workers</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
      </AppShell>
    </RoleGate>
  );
}
