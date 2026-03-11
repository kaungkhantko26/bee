"use client";

import Link from "next/link";
import { useDeferredValue, useMemo } from "react";
import { Panel, SectionHeading, StatusPill } from "@/components/ui";
import { useWorkerDirectory } from "@/components/use-worker-directory";

export function LiveWorkerList({
  searchQuery = "",
}: {
  searchQuery?: string;
}) {
  const { loading, workers, error } = useWorkerDirectory();
  const deferredQuery = useDeferredValue(searchQuery);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredWorkers = useMemo(() => {
    if (!normalizedQuery) {
      return workers;
    }

    return workers.filter((worker) => {
      const searchable = [
        worker.display_name,
        worker.profession,
        worker.area,
        worker.bio,
        worker.availability_status,
        worker.availability_note,
        ...worker.tags,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [normalizedQuery, workers]);

  return (
    <Panel>
      <SectionHeading
        eyebrow="Ready nearby"
        title="Available workers sorted for urgent decisions."
        description="Availability, ETA, and service fit matter more here than long descriptions. The goal is to help the user send the job into dispatch quickly."
      />
      {error ? (
        <p className="mt-6 text-sm text-[var(--muted)]">{error}</p>
      ) : null}
      {loading ? (
        <p className="mt-6 text-sm text-[var(--muted)]">Loading workers...</p>
      ) : null}
      {!loading && workers.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No workers are available yet. Create a worker account to appear here.
        </p>
      ) : null}
      {!loading && workers.length > 0 && filteredWorkers.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No workers match that search yet. Try a skill, area, or simpler keyword.
        </p>
      ) : null}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[...filteredWorkers]
          .sort((left, right) => {
            const leftAvailable = left.availability_status.toLowerCase().includes("available");
            const rightAvailable = right.availability_status.toLowerCase().includes("available");

            if (leftAvailable !== rightAvailable) {
              return rightAvailable ? 1 : -1;
            }

            if (left.eta_minutes !== right.eta_minutes) {
              return left.eta_minutes - right.eta_minutes;
            }

            return right.rating - left.rating;
          })
          .map((worker) => {
          return (
            <article
              key={worker.worker_id}
              className="rounded-[1.5rem] border border-black/8 bg-[var(--panel)]/72 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link
                    href={`/workers/${worker.worker_id}`}
                    className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--foreground)] underline-offset-4 transition hover:text-[var(--accent-strong)] hover:underline"
                  >
                    {worker.display_name}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--muted)]">{worker.profession}</p>
                </div>
                <StatusPill
                  tone={
                    worker.availability_status.toLowerCase().includes("job")
                      ? "warning"
                      : worker.availability_status.toLowerCase().includes("available")
                        ? "success"
                        : "neutral"
                  }
                >
                  {worker.availability_status}
                </StatusPill>
              </div>
              <div className="mt-5 grid gap-2 text-sm text-[var(--foreground)] sm:grid-cols-3 sm:gap-3">
                <p>${worker.hourly_rate}/hr</p>
                <p>{worker.eta_minutes} min away</p>
                <p>{worker.rating.toFixed(1)} stars · {worker.completed_jobs} jobs</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {worker.tags.map((tag) => (
                  <StatusPill key={tag}>{tag}</StatusPill>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                {worker.availability_note}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/request?service=${encodeURIComponent(worker.profession)}&location=${encodeURIComponent(worker.area)}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
                >
                  Dispatch this service
                </Link>
                <Link
                  href={`/workers/${worker.worker_id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
                >
                  View full profile
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
