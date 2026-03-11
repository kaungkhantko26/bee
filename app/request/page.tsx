import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { RequestSubmitButton } from "@/components/request-submit-button";
import { Panel, SectionHeading, StatusPill } from "@/components/ui";

const requestSteps = [
  "You create the job request with the service, address, budget, and urgency.",
  "BEE ranks nearby available workers and sends the job to the fastest realistic match.",
  "The first worker who accepts becomes the assigned worker for that job.",
  "The booking then moves into travel, arrival, completion, payment, and review.",
];

export default function RequestPage() {
  return (
    <RoleGate allow="hirer">
      <AppShell
        currentPath="/request"
        badge="Instant dispatch"
        title="Create a request and let BEE dispatch the nearest available worker."
        description="This flow is built like an on-demand service app: one request, nearest-worker matching, fast acceptance, live trip progress, payment, and review in the same job record."
        primaryAction={{ href: "/bookings", label: "View active requests" }}
        secondaryAction={{ href: "/discover", label: "Back to discover" }}
      >
      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Panel>
          <SectionHeading
            eyebrow="Job request"
            title="Post a dispatch-ready home service request."
            description="A good request gives the worker enough context to accept fast: what happened, where to go, when to arrive, and the expected budget."
          />
          <div className="mt-8">
            <RequestSubmitButton />
          </div>
        </Panel>

        <Panel className="!bg-[linear-gradient(180deg,rgba(55,42,10,0.98),rgba(35,26,4,1))] !text-white">
          <SectionHeading
            eyebrow="How this works"
            title="The request becomes a full service trip."
            description="Once you send it, BEE keeps the job in one flow from dispatch and worker travel through payment and review."
            invert
          />
          <div className="mt-8 space-y-4">
            {requestSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.12))] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.12)]"
              >
                <StatusPill tone="success">Step {index + 1}</StatusPill>
                <p className="mt-4 text-sm leading-7 text-white">{step}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
      </AppShell>
    </RoleGate>
  );
}
