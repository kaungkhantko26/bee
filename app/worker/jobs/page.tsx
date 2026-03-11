import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { WorkerScheduleBoard } from "@/components/worker-schedule-board";

export default function WorkerJobsPage() {
  return (
    <RoleGate allow="employer">
      <AppShell
        currentPath="/worker"
        badge="Jobs Board"
        title="Add and edit today's jobs in one place."
        description="Use this page to post your working hours, add jobs, and mark when you are free or busy."
        primaryAction={{ href: "/worker", label: "Back to worker home" }}
      >
        <WorkerScheduleBoard />
      </AppShell>
    </RoleGate>
  );
}
