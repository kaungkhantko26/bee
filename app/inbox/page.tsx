import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { LiveChatPanel } from "@/components/live-chat-panel";

export default function HirerInboxPage() {
  return (
    <RoleGate allow="hirer">
      <AppShell
        currentPath="/inbox"
        badge="Inbox"
        title="Chat with workers from one place."
        description="Your inbox keeps booking-related conversations in a separate space so the rest of the customer flow stays clean."
        primaryAction={{ href: "/bookings", label: "Open bookings" }}
        secondaryAction={{ href: "/discover", label: "Find workers" }}
      >
        <LiveChatPanel
          mode="hirer"
          title="Worker inbox"
          subtitle="Chat is available only after you book a worker."
          showHistory
        />
      </AppShell>
    </RoleGate>
  );
}
