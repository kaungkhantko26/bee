"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { MetricCard } from "@/components/ui";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type BookingRecord,
  type ChatMessageRecord,
  type WorkerProfileRecord,
  type WorkerScheduleSlotRecord,
} from "@/lib/supabase";
import { getBookingDisplayedFee, parseBookingAmount } from "@/lib/booking-fee";

type WorkerMetricsState = {
  loading: boolean;
  error: string;
  bookings: BookingRecord[];
  messages: ChatMessageRecord[];
  schedule: WorkerScheduleSlotRecord[];
  workerProfile: WorkerProfileRecord | null;
};

export function LiveWorkerMetrics() {
  const configured = isSupabaseConfigured();
  const { loading: authLoading, profile } = useAuthProfile();
  const [state, setState] = useState<WorkerMetricsState>({
    loading: configured,
    error: configured ? "" : "Supabase is not configured.",
    bookings: [],
    messages: [],
    schedule: [],
    workerProfile: null,
  });

  useEffect(() => {
    if (!configured || authLoading || !profile || profile.role !== "employer") {
      return;
    }

    let active = true;
    const supabase = getSupabaseBrowserClient();
    const workerProfile = profile;

    async function loadMetrics() {
      const [{ data: bookings, error: bookingsError }, { data: messages, error: messagesError }, { data: schedule, error: scheduleError }, { data: workerRecord, error: workerError }] =
        await Promise.all([
          supabase
            .from("bookings")
            .select("*")
            .eq("worker_id", workerProfile.id),
          supabase
            .from("chat_messages")
            .select("*")
            .eq("worker_id", workerProfile.id),
          supabase
            .from("worker_schedule_slots")
            .select("*")
            .eq("worker_id", workerProfile.id),
          supabase
            .from("worker_profiles")
            .select("*")
            .eq("worker_id", workerProfile.id)
            .maybeSingle(),
        ]);

      if (!active) {
        return;
      }

      const nextError =
        bookingsError?.message ||
        messagesError?.message ||
        scheduleError?.message ||
        workerError?.message ||
        "";

      setState({
        loading: false,
        error: nextError,
        bookings: (bookings as BookingRecord[] | null) ?? [],
        messages: (messages as ChatMessageRecord[] | null) ?? [],
        schedule: (schedule as WorkerScheduleSlotRecord[] | null) ?? [],
        workerProfile: (workerRecord as WorkerProfileRecord | null) ?? null,
      });
    }

    void loadMetrics();

    return () => {
      active = false;
    };
  }, [authLoading, configured, profile]);

  const metrics = useMemo(() => {
    const jobsToday = state.schedule.filter((slot) =>
      slot.state === "On job" || slot.state === "Confirmed",
    ).length;
    const totalEarnings = state.bookings.reduce((sum, booking) => {
      return sum + parseBookingAmount(getBookingDisplayedFee(booking));
    }, 0);

    return [
      { label: "Jobs today", value: String(jobsToday) },
      { label: "Customer chats", value: String(state.messages.length) },
      { label: "Total earnings", value: `$${totalEarnings.toFixed(0)}` },
      {
        label: "Rating",
        value: state.workerProfile ? state.workerProfile.rating.toFixed(1) : "0.0",
      },
    ];
  }, [state.bookings, state.messages, state.schedule, state.workerProfile]);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item) => (
        <MetricCard key={item.label} value={state.loading ? "..." : item.value} label={item.label} />
      ))}
      {state.error ? (
        <p className="sm:col-span-2 xl:col-span-4 text-sm text-[var(--muted)]">{state.error}</p>
      ) : null}
    </section>
  );
}
