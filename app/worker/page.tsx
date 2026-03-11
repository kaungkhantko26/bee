import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { LiveWorkerMetrics } from "@/components/live-worker-metrics";
import { WorkerDaySummary } from "@/components/worker-day-summary";
import {
  Panel,
  SectionHeading,
} from "@/components/ui";
import { WorkerLeadsPanel } from "@/components/worker-leads-panel";
import { WorkerJobHistory } from "@/components/worker-job-history";
import Link from "next/link";

export default function WorkerPage() {
  return (
    <RoleGate allow="employer">
      <AppShell
        currentPath="/worker"
        badge="Worker Hub"
        title="Run your dispatches like an on-demand service worker."
        description="Accept nearby jobs, start the trip, mark arrival, finish the work, and keep customer communication tied to the same live booking."
        primaryAction={{ href: "/worker/jobs", label: "Open jobs board" }}
      >
      <LiveWorkerMetrics />

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <WorkerDaySummary />

        <div className="grid gap-6">
          <WorkerLeadsPanel />

          <Panel>
            <SectionHeading
              eyebrow="Inbox"
              title="Customer chat is in a separate inbox."
              description="Open your inbox to reply to customers without mixing chat into the main worker page."
            />
            <Link
              href="/worker/inbox"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
            >
              Open worker inbox
            </Link>
          </Panel>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <Panel>
          <SectionHeading
            eyebrow="Dispatch flow"
            title="Your side of the job should move fast."
            description="Workers should not manage abstract status lists. They should get one clear next action per job."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">Accept fast</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                New requests are most valuable when you accept immediately and lock the job before another worker does.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">Update travel status</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Moving the booking to `On the way` and `Arrived` reduces customer anxiety and support follow-up.
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Quality"
            title="Customer trust is built after the trip, not before it."
            description="Good service quality shows up when the customer can pay confidently and leave a verified review tied to a completed job."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">Complete the job clearly</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Only mark a job complete when the work is genuinely done, because that unlocks payment on the customer side.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">Keep the chat useful</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Use the inbox for arrival updates, access questions, and final confirmation so the booking history stays clean.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,240,168,0.78))] p-5 md:col-span-2">
              <p className="font-semibold text-[var(--foreground)]">Profile tip</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Keep your availability, ETA, service area, and profession accurate so BEE can route you better quality jobs.
              </p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-6">
        <WorkerJobHistory />
      </section>
      </AppShell>
    </RoleGate>
  );
}
