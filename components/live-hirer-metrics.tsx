"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { MetricCard } from "@/components/ui";
import { getSupabaseBrowserClient, isSupabaseConfigured, type BookingRecord, type WorkerProfileRecord } from "@/lib/supabase";
import { getBookingDisplayedFee, parseBookingAmount } from "@/lib/booking-fee";

type HirerMetricsState = {
  loading: boolean;
  error: string;
  bookings: BookingRecord[];
  workers: WorkerProfileRecord[];
};

export function LiveHirerMetrics() {
  const configured = isSupabaseConfigured();
  const { loading: authLoading, profile } = useAuthProfile();
  const [state, setState] = useState<HirerMetricsState>({
    loading: configured,
    error: configured ? "" : "Supabase is not configured.",
    bookings: [],
    workers: [],
  });

  useEffect(() => {
    if (!configured || authLoading || !profile || profile.role !== "hirer") {
      return;
    }

    let active = true;
    const supabase = getSupabaseBrowserClient();
    const hirerProfile = profile;

    async function loadMetrics() {
      const [{ data: bookings, error: bookingsError }, { data: workers, error: workersError }] =
        await Promise.all([
          supabase
            .from("bookings")
            .select("*")
            .eq("hirer_id", hirerProfile.id),
          supabase
            .from("worker_profiles")
            .select("*"),
        ]);

      if (!active) {
        return;
      }

      const nextError = bookingsError?.message || workersError?.message || "";

      setState({
        loading: false,
        error: nextError,
        bookings: (bookings as BookingRecord[] | null) ?? [],
        workers: (workers as WorkerProfileRecord[] | null) ?? [],
      });
    }

    void loadMetrics();

    return () => {
      active = false;
    };
  }, [authLoading, configured, profile]);

  const metrics = useMemo(() => {
    const availableWorkers = state.workers.filter((worker) =>
      worker.availability_status.toLowerCase().includes("available"),
    ).length;
    const totalSpend = state.bookings.reduce((sum, booking) => {
      return sum + parseBookingAmount(getBookingDisplayedFee(booking));
    }, 0);

    return [
      { label: "Available workers", value: String(availableWorkers) },
      { label: "My bookings", value: String(state.bookings.length) },
      { label: "Total spend", value: `$${totalSpend.toFixed(0)}` },
    ];
  }, [state.bookings, state.workers]);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((item) => (
        <MetricCard key={item.label} value={state.loading ? "..." : item.value} label={item.label} />
      ))}
      {state.error ? (
        <p className="sm:col-span-2 xl:col-span-4 text-sm text-[var(--muted)]">{state.error}</p>
      ) : null}
    </section>
  );
}
