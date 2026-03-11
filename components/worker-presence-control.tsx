"use client";

import { useTransition } from "react";
import { StatusPill } from "@/components/ui";
import {
  useLiveWorkerBoard,
  workerPresenceOptions,
} from "@/components/use-live-worker-board";

export function WorkerPresenceControl() {
  const { summary, updatePresence, loading } = useLiveWorkerBoard();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
        Worker status
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <StatusPill tone={summary.tone}>{summary.status}</StatusPill>
        <div className="relative w-full sm:w-auto">
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,232,132,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-2px_0_rgba(139,97,0,0.16),0_14px_26px_rgba(94,74,0,0.12)]" />
          <select
            value={summary.status}
            disabled={loading || pending}
            onChange={(event) => {
              const nextStatus = event.target.value;
              startTransition(() => {
                void updatePresence(nextStatus);
              });
            }}
            className="relative min-h-11 w-full appearance-none rounded-full border border-[rgba(139,97,0,0.16)] bg-transparent px-4 pr-11 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--accent-strong)] focus:ring-4 focus:ring-[var(--accent)]/15 disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[11rem]"
          >
            {workerPresenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(255,255,255,0.7)] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_10px_rgba(94,74,0,0.12)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 7 5 5 5-5" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
