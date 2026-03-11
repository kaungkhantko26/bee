import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { LiveChatPanel } from "@/components/live-chat-panel";

export default function WorkerInboxPage() {
  return (
    <RoleGate allow="employer">
      <AppShell
        currentPath="/worker/inbox"
        badge="Worker Inbox"
        title="Reply to customer messages in one place."
        description="Your worker inbox keeps customer chat separate from the jobs board so the daily workflow is easier to scan."
        primaryAction={{ href: "/worker", label: "Back to worker home" }}
        secondaryAction={{ href: "/worker/jobs", label: "Open jobs board" }}
      >
        <LiveChatPanel
          mode="employer"
          title="Customer inbox"
          subtitle="Reply to customers who already booked you."
          showHistory
        />
      </AppShell>
    </RoleGate>
  );
}
