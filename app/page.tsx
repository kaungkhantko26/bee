"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Panel, SectionHeading, StatusPill } from "@/components/ui";
import { useLanguage } from "@/components/language-provider";
import { useWorkerDirectory } from "@/components/use-worker-directory";
import { serviceCategories } from "@/lib/mock-data";

const arrivalOptions = [
  "Within 30 minutes",
  "Within 1 hour",
  "This afternoon",
  "Tonight",
  "Tomorrow morning",
];

export default function Home() {
  const { copy } = useLanguage();
  const { workers, loading: workersLoading } = useWorkerDirectory();
  const [selectedService, setSelectedService] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [arrivalWindow, setArrivalWindow] = useState(arrivalOptions[1]);
  const [problem, setProblem] = useState("");

  const activeWorkers = useMemo(
    () =>
      workers.filter((worker) =>
        worker.availability_status.toLowerCase().includes("available"),
      ),
    [workers],
  );

  const fastestWorkers = useMemo(
    () =>
      [...workers]
        .sort((left, right) => {
          if (left.eta_minutes !== right.eta_minutes) {
            return left.eta_minutes - right.eta_minutes;
          }
          return right.rating - left.rating;
        })
        .slice(0, 4),
    [workers],
  );

  const requestHref = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedService) {
      params.set("service", selectedService);
    }
    if (selectedLocation) {
      params.set("location", selectedLocation);
    }
    if (arrivalWindow) {
      params.set("time", arrivalWindow);
    }
    if (problem.trim()) {
      params.set("q", problem.trim());
    }

    const query = params.toString();
    return query ? `/request?${query}` : "/request";
  }, [arrivalWindow, problem, selectedLocation, selectedService]);

  const discoverHref = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedService) {
      params.set("service", selectedService);
    }
    if (selectedLocation) {
      params.set("location", selectedLocation);
    }
    if (problem.trim()) {
      params.set("q", problem.trim());
    }

    const query = params.toString();
    return query ? `/discover?${query}` : "/discover";
  }, [problem, selectedLocation, selectedService]);

  const serviceOptions = useMemo(
    () => [...new Set(workers.map((worker) => worker.profession))].slice(0, 12),
    [workers],
  );
  const locationOptions = useMemo(
    () => [...new Set(workers.map((worker) => worker.area))].slice(0, 12),
    [workers],
  );

  return (
    <AppShell
      currentPath="/"
      badge="On-demand home services"
      title="Book a nearby worker the moment you need help."
      description="Request home services the way people book rides: create one job, let BEE match the nearest realistic worker, then track acceptance, travel, completion, payment, and review in one app."
      primaryAction={{ href: requestHref, label: "Request now" }}
      secondaryAction={{ href: "/auth", label: copy.home.secondary }}
    >
      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <Panel className="bg-[linear-gradient(135deg,rgba(255,244,181,0.98),rgba(255,255,255,0.96))]">
          <SectionHeading
            eyebrow="Instant booking"
            title="Tell BEE the job. We route it to workers who can take it now."
            description="This flow is built for urgent home service, not long browsing. Pick the service, add the area, choose the arrival window, and send one request into the dispatch system."
          />
          <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-black/8 bg-white/92 p-4 sm:rounded-[1.75rem] xl:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Service needed
              </span>
              <select
                value={selectedService}
                onChange={(event) => setSelectedService(event.target.value)}
                className="min-h-12 rounded-[1rem] border border-black/10 bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              >
                <option value="">Choose a service</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Service area
              </span>
              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                className="min-h-12 rounded-[1rem] border border-black/10 bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              >
                <option value="">Choose your area</option>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Arrival time
              </span>
              <select
                value={arrivalWindow}
                onChange={(event) => setArrivalWindow(event.target.value)}
                className="min-h-12 rounded-[1rem] border border-black/10 bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              >
                {arrivalOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Problem
              </span>
              <input
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
                placeholder="Power outage, leaking pipe, AC not cooling"
                className="min-h-12 rounded-[1rem] border border-black/10 bg-white px-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={requestHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
            >
              Send instant request
            </Link>
            <Link
              href={discoverHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
            >
              See nearby workers first
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {serviceCategories.slice(0, 6).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedService(category)}
                className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--accent-soft)]"
              >
                {category}
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="!bg-[linear-gradient(180deg,rgba(55,42,10,0.98),rgba(35,26,4,1))] !text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/92">
                Live dispatch
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
                See who can reach the job fastest.
              </h2>
            </div>
            <StatusPill tone="success">
              {workersLoading ? "Loading" : `${activeWorkers.length} ready now`}
            </StatusPill>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.1))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.16)]">
              <p className="text-sm font-semibold text-white">Fastest ETA</p>
              <p className="mt-2 text-4xl font-semibold text-white">
                {workersLoading ? "--" : `${fastestWorkers[0]?.eta_minutes ?? 0} min`}
              </p>
              <p className="mt-2 text-sm leading-7 text-white/95">
                BEE ranks available workers by ETA, service fit, and readiness so the first acceptance can happen quickly.
              </p>
            </div>

            {fastestWorkers.map((worker) => (
              <div
                key={worker.worker_id}
                className="rounded-[1.25rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.1))] px-4 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.16)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{worker.display_name}</p>
                    <p className="mt-1 text-sm text-white/95">
                      {worker.profession} · {worker.area}
                    </p>
                  </div>
                  <StatusPill
                    tone={
                      worker.availability_status.toLowerCase().includes("available")
                        ? "success"
                        : "warning"
                    }
                  >
                    {worker.availability_status}
                  </StatusPill>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-white">
                  <p>{worker.eta_minutes} min</p>
                  <p>${worker.hourly_rate}/hr</p>
                  <p>{worker.rating.toFixed(1)} rating</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <Panel>
          <SectionHeading
            eyebrow="How it works"
            title="More like dispatch, less like browsing."
            description="BEE should feel immediate. The customer posts the job, workers get live availability context, and the booking moves into tracking."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-[var(--panel)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                1. Request
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                Enter the service, address, problem, and preferred arrival window.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--panel)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                2. Match
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                BEE highlights workers with the best ETA and current availability.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--panel)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                3. Track
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                The booking, chat, and payment all stay attached to the same live job.
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Why this is better"
            title="The user gets help, not just profiles."
            description="The main outcome is not reading cards. It is quickly reaching a real worker who can solve the problem today."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">Urgency-first flow</p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                The request journey starts from the problem and time pressure, not endless marketplace browsing.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">ETA matters</p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                Nearby availability and arrival speed become visible, which is critical for home service.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">Cleaner worker side</p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                Workers manage live status, time slots, and incoming jobs more like an operator queue.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--panel)] p-5">
              <p className="font-semibold text-[var(--foreground)]">One job thread</p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                Booking, support, receipts, and chat remain tied to the same service request from start to finish.
              </p>
            </div>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
