"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Panel, SectionHeading, StatusPill } from "@/components/ui";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type WorkerAvailabilityRecord,
  type WorkerProfileRecord,
} from "@/lib/supabase";

type WorkerProfileState = {
  loading: boolean;
  error: string;
  worker: WorkerProfileRecord | null;
  availability: WorkerAvailabilityRecord[];
};

export default function WorkerProfilePage() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId") ?? "";
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<WorkerProfileState>({
    loading: true,
    error: configured ? "" : "Supabase is not configured.",
    worker: null,
    availability: [],
  });

  useEffect(() => {
    if (!configured) {
      return;
    }

    if (!workerId) {
      setState((current) => ({
        ...current,
        loading: false,
        error: "Worker not found.",
      }));
      return;
    }

    let active = true;
    const supabase = getSupabaseBrowserClient();

    async function loadWorkerProfile() {
      setState((current) => ({
        ...current,
        loading: true,
        error: "",
      }));

      const [
        { data: worker, error: workerError },
        { data: availability, error: availabilityError },
      ] = await Promise.all([
        supabase
          .from("worker_profiles")
          .select("*")
          .eq("worker_id", workerId)
          .maybeSingle(),
        supabase
          .from("worker_availability")
          .select("*")
          .eq("worker_id", workerId)
          .order("sort_order", { ascending: true }),
      ]);

      if (!active) {
        return;
      }

      const nextError = workerError?.message || availabilityError?.message || "";

      setState({
        loading: false,
        error: nextError,
        worker: (worker as WorkerProfileRecord | null) ?? null,
        availability: (availability as WorkerAvailabilityRecord[] | null) ?? [],
      });
    }

    void loadWorkerProfile();

    return () => {
      active = false;
    };
  }, [configured, workerId]);

  const worker = state.worker;

  return (
    <AppShell
      currentPath=""
      badge="Worker Profile"
      title={worker ? `${worker.display_name}` : "Worker profile"}
      description={
        worker
          ? "Review the worker's service area, rate, availability, and profile details before booking."
          : "Loading worker details."
      }
      primaryAction={{ href: "/discover", label: "Back to discover" }}
      secondaryAction={{ href: "/request", label: "Request a job" }}
    >
      {state.error ? (
        <Panel>
          <p className="text-sm text-[var(--muted)]">{state.error}</p>
        </Panel>
      ) : null}

      {state.loading ? (
        <Panel>
          <p className="text-sm text-[var(--muted)]">Loading worker profile...</p>
        </Panel>
      ) : null}

      {!state.loading && !worker ? (
        <Panel>
          <SectionHeading
            eyebrow="Worker"
            title="Worker not found"
            description="This worker profile is not available anymore."
          />
          <Link
            href="/discover"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
          >
            Go back to discover
          </Link>
        </Panel>
      ) : null}

      {worker ? (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                  {worker.profession}
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
                  {worker.display_name}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                  {worker.bio}
                </p>
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

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-black/8 bg-[var(--panel)] p-5">
                <p className="text-sm text-[var(--muted)]">Area</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{worker.area}</p>
              </div>
              <div className="rounded-[1.5rem] border border-black/8 bg-[var(--panel)] p-5">
                <p className="text-sm text-[var(--muted)]">Hourly rate</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  ${worker.hourly_rate}/hr
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-black/8 bg-[var(--panel)] p-5">
                <p className="text-sm text-[var(--muted)]">ETA</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {worker.eta_minutes} minutes away
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-black/8 bg-[var(--panel)] p-5">
                <p className="text-sm text-[var(--muted)]">Rating</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {worker.rating.toFixed(1)} stars · {worker.completed_jobs} jobs
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {worker.tags.map((tag) => (
                <StatusPill key={tag}>{tag}</StatusPill>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6">
            <Panel>
              <SectionHeading
                eyebrow="Availability"
                title="Weekly schedule"
                description={
                  worker.availability_note || "Check when this worker is usually available."
                }
              />
              {state.availability.length === 0 ? (
                <p className="mt-6 text-sm text-[var(--muted)]">
                  No schedule posted yet.
                </p>
              ) : (
                <div className="mt-6 space-y-3">
                  {state.availability.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-col gap-2 rounded-[1.25rem] border border-black/10 bg-[var(--panel)] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <p className="font-semibold text-[var(--foreground)]">{slot.day_label}</p>
                      <p className="text-sm text-[var(--muted)]">{slot.hours}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel className="!bg-[linear-gradient(180deg,rgba(55,42,10,0.98),rgba(35,26,4,1))] !text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/92">
                Ready to book?
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
                Send your job request from BEE.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/88">
                Add your problem, address, budget, and preferred time. The request will create the booking and unlock chat after booking.
              </p>
              <Link
                href="/request"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
              >
                Request this kind of service
              </Link>
            </Panel>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
