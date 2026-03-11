import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { LiveReceiptsPanel } from "@/components/live-receipts-panel";
import { Panel, SectionHeading } from "@/components/ui";
import Link from "next/link";

export default function ReceiptsPage() {
  return (
    <RoleGate allow="hirer">
      <AppShell
        currentPath="/receipts"
        badge="Receipts + vouchers"
        title="Keep every payment voucher in one place."
        description="Finished jobs generate in-app receipts so customers can review service details, total paid, and booking reference without relying on email delivery."
        primaryAction={{ href: "/bookings", label: "Open my bookings" }}
        secondaryAction={{ href: "/discover", label: "Book another job" }}
      >
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <LiveReceiptsPanel />

          <Panel>
            <SectionHeading
              eyebrow="Voucher use"
              title="Your receipt page is the payment proof."
              description="Use this page as the in-app voucher after a worker submits the final fee and you confirm payment."
            />
            <div className="mt-6 grid gap-4">
              <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5">
                <p className="font-semibold text-[var(--foreground)]">Booking reference</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Each receipt includes the booking ID so support can trace the exact service record.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5">
                <p className="font-semibold text-[var(--foreground)]">Final worker fee</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  The voucher uses the final fee submitted by the worker, not only the customer estimate.
                </p>
              </div>
              <Link
                href="/support"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
              >
                Open support with receipt context
              </Link>
            </div>
          </Panel>
        </section>
      </AppShell>
    </RoleGate>
  );
}
