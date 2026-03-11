"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type WorkerProfileRecord,
} from "@/lib/supabase";

export function RequestSubmitButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();
  const { profile, session } = useAuthProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [service, setService] = useState("");
  const [budget, setBudget] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    const nextService = searchParams.get("service");
    const nextTime = searchParams.get("time");
    const nextLocation = searchParams.get("location");
    const nextProblem = searchParams.get("q");

    if (nextService) {
      setService(nextService);
    }
    if (nextTime) {
      setTimeWindow(nextTime);
    }
    if (nextLocation) {
      setAddress(nextLocation);
    }
    if (nextProblem) {
      setDetails(nextProblem);
    }
  }, [searchParams]);

  async function handleSubmit() {
    if (!configured || !session?.user || !profile || profile.role !== "hirer") {
      router.push("/auth?next=/request");
      return;
    }

    if (!service.trim() || !budget.trim() || !timeWindow.trim() || !address.trim()) {
      setError("Please fill in the service, budget, time, and address.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: workers, error: workerError } = await supabase
        .from("worker_profiles")
        .select("*")
        .order("eta_minutes", { ascending: true })
        .limit(24);

      const workerPool = (workers as WorkerProfileRecord[] | null) ?? [];

      if (workerError) {
        throw workerError;
      }

      const workerRecord =
        [...workerPool]
          .sort((left, right) => {
            const serviceNeedle = service.trim().toLowerCase();
            const addressNeedle = address.trim().toLowerCase();

            const leftAvailable = left.availability_status.toLowerCase().includes("available");
            const rightAvailable = right.availability_status.toLowerCase().includes("available");
            if (leftAvailable !== rightAvailable) {
              return rightAvailable ? 1 : -1;
            }

            const leftServiceMatch =
              left.profession.toLowerCase().includes(serviceNeedle) ||
              left.tags.some((tag) => tag.toLowerCase().includes(serviceNeedle));
            const rightServiceMatch =
              right.profession.toLowerCase().includes(serviceNeedle) ||
              right.tags.some((tag) => tag.toLowerCase().includes(serviceNeedle));
            if (leftServiceMatch !== rightServiceMatch) {
              return rightServiceMatch ? 1 : -1;
            }

            const leftAreaMatch = addressNeedle
              ? addressNeedle.includes(left.area.toLowerCase())
              : false;
            const rightAreaMatch = addressNeedle
              ? addressNeedle.includes(right.area.toLowerCase())
              : false;
            if (leftAreaMatch !== rightAreaMatch) {
              return rightAreaMatch ? 1 : -1;
            }

            if (left.eta_minutes !== right.eta_minutes) {
              return left.eta_minutes - right.eta_minutes;
            }

            return right.rating - left.rating;
          })
          .at(0) ?? null;

      if (!workerRecord) {
        throw new Error("No workers are available yet.");
      }

      const { error: bookingError } = await supabase.from("bookings").insert({
        hirer_id: profile.id,
        worker_id: workerRecord.worker_id,
        service: service.trim(),
        scheduled_for: timeWindow.trim(),
        status: "Request sent",
        address: address.trim(),
        price: budget.trim(),
        payment_status: "Pending worker total",
      });

      if (bookingError) {
        throw bookingError;
      }

      const { error: messageError } = await supabase.from("chat_messages").insert({
        worker_id: workerRecord.worker_id,
        hirer_id: profile.id,
        sender_id: profile.id,
        sender_role: "hirer",
        author_name: profile.full_name,
        body:
          details.trim() ||
          `Dispatch request for ${service.trim()} at ${address.trim()}. Requested arrival: ${timeWindow.trim()}.`,
      });

      if (messageError) {
        throw messageError;
      }

      router.push("/bookings");
      router.refresh();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Unable to create the request.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Service needed
        </span>
        <input
          value={service}
          onChange={(event) => setService(event.target.value)}
          placeholder="Pipe repair, electrical issue, deep cleaning..."
          className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Budget estimate
          </span>
          <input
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            placeholder="$40 - $70 estimate"
            className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Arrival window
          </span>
          <input
            value={timeWindow}
            onChange={(event) => setTimeWindow(event.target.value)}
            placeholder="Within 30 minutes / Today at 5 PM"
            className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Service address
        </span>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Where should the worker come?"
          className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Problem details
        </span>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Describe the issue, urgency, building access, and anything the worker should prepare for."
          rows={5}
          className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
      </label>

      <button
        type="button"
        onClick={() => {
          void handleSubmit();
        }}
        disabled={busy}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Finding nearest worker..." : "Request now"}
      </button>
      {error ? <p className="text-sm text-[var(--muted)]">{error}</p> : null}
    </div>
  );
}
