import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { LiveBookingMetrics } from "@/components/live-booking-metrics";
import { LiveBookingsOverview } from "@/components/live-bookings-overview";
import {
  Panel,
  SectionHeading,
} from "@/components/ui";
import Link from "next/link";

export default function BookingsPage() {
  return (
    <RoleGate allow="hirer">
      <AppShell
        currentPath="/bookings"
        badge="Bookings + Inbox"
        title="Track each job from dispatch to payment and review."
        description="This is the customer trip center: see worker progress, confirm payment after completion, and leave verified feedback without losing the booking context."
        primaryAction={{ href: "/discover", label: "Book another job" }}
        secondaryAction={{ href: "/", label: "Back to overview" }}
      >
      <LiveBookingMetrics />

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <LiveBookingsOverview />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <SectionHeading
            eyebrow="Receipts"
            title="Payment vouchers live in the receipts page."
            description="Open the receipts page to review voucher details after you confirm the worker's final fee."
          />
          <Link
            href="/receipts"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
          >
            Open receipts
          </Link>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Inbox"
            title="Chat lives in your inbox now."
            description="Open the inbox when you need to message a worker you already booked."
          />
          <Link
            href="/inbox"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
          >
            Open inbox
          </Link>
        </Panel>
      </section>

      <section className="mt-6">
        <Panel>
          <SectionHeading
            eyebrow="Experience layer"
            title="A real service app closes the loop after the work is done."
            description="Dispatch, payment, and review should feel like one continuous flow instead of separate disconnected pages."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">Dispatch record</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Every booking keeps the request, assigned worker, arrival status, and completion state in one thread.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">Payment unlock</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Payment becomes the next clear action only after the worker marks the job complete.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">Verified review</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Reviews are prompted only after payment is processed, which makes the feedback more trustworthy.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">Support continuity</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                If something goes wrong, support still has the request, trip, chat, and payment history in the same place.
              </p>
            </div>
          </div>
        </Panel>
      </section>
      </AppShell>
    </RoleGate>
  );
}
