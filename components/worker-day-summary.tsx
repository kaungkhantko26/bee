"use client";

import Link from "next/link";
import { Panel, SectionHeading, StatusPill } from "@/components/ui";
import { useLiveWorkerBoard } from "@/components/use-live-worker-board";

export function WorkerDaySummary() {
  const { board, loading, error, summary } = useLiveWorkerBoard();

  return (
    <Panel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          eyebrow="Today"
          title="Today&apos;s jobs and free times"
          description="Keep the main page simple. Open the jobs board only when you need to add or edit time slots."
        />
        <div className="flex w-full flex-col items-start gap-3 sm:w-auto">
          <StatusPill tone={summary.tone}>{summary.status}</StatusPill>
          <Link
            href="/worker/jobs"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 sm:w-auto"
          >
            Open jobs board
          </Link>
        </div>
      </div>

      {error ? <p className="mt-6 text-sm text-[var(--muted)]">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-[var(--muted)]">Loading today&apos;s work...</p> : null}
      {!loading && board.schedule.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No jobs or free times added yet. Use the jobs board to post today&apos;s schedule.
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {board.schedule.slice(0, 3).map((slot) => (
          <div
            key={slot.id}
            className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-[var(--foreground)]">{slot.time}</p>
              <StatusPill
                tone={
                  slot.state === "On job"
                    ? "warning"
                    : slot.state === "Available"
                      ? "success"
                      : "neutral"
                }
              >
                {slot.state}
              </StatusPill>
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
              {slot.title || "Untitled job"}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {slot.customer || "No customer assigned"}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
