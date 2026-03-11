import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { Panel, SectionHeading, StatusPill } from "@/components/ui";

const supportLanes = [
  {
    title: "Booking issue",
    body: "Late arrival, wrong scope, or incomplete work tied to an active booking.",
  },
  {
    title: "Payment issue",
    body: "Receipts, escrow state, unexpected charges, or refund review.",
  },
  {
    title: "Trust & safety",
    body: "Suspicious profile behavior, abusive chat, or identity concerns.",
  },
];

export default function SupportPage() {
  return (
    <RoleGate allow="hirer">
      <AppShell
        currentPath="/support"
        badge="Support Center"
        title="Resolve booking and payment problems from a dedicated support flow."
        description="Use the support center to handle booking issues, payment problems, and trust or safety concerns."
        primaryAction={{ href: "/bookings", label: "Back to bookings" }}
        secondaryAction={{ href: "/discover", label: "Find another worker" }}
      >
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <SectionHeading
            eyebrow="Support lanes"
            title="Choose the issue type that matches the booking problem."
            description="Choose the support path that best matches the issue so the case can be reviewed faster."
          />
          <div className="mt-8 grid gap-4">
            {supportLanes.map((lane) => (
              <div
                key={lane.title}
                className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5"
              >
                <p className="font-semibold text-[var(--foreground)]">{lane.title}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {lane.body}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="!bg-[linear-gradient(180deg,rgba(55,42,10,0.98),rgba(35,26,4,1))] !text-white">
          <SectionHeading
            eyebrow="Dispute handling"
            title="What BEE should collect before reviewing a case."
            description="Support works better when the user understands what evidence matters."
            invert
          />
          <div className="mt-8 space-y-4">
            <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.12))] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.12)]">
              <StatusPill tone="success">Receipts</StatusPill>
              <p className="mt-4 text-sm leading-7 text-white">
                Price breakdown, materials adjustments, and payment timestamps.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.12))] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.12)]">
              <StatusPill tone="success">Chat history</StatusPill>
              <p className="mt-4 text-sm leading-7 text-white">
                Quotes, schedule changes, and scope agreements linked to the booking.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.12))] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.12)]">
              <StatusPill tone="success">Photos or notes</StatusPill>
              <p className="mt-4 text-sm leading-7 text-white">
                Before-and-after evidence if the problem relates to job quality.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Link
              href="/bookings"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
            >
              Return to booking history
            </Link>
          </div>
        </Panel>
      </section>
      </AppShell>
    </RoleGate>
  );
}
