"use client";

import { useEffect, useState } from "react";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { Panel, SectionHeading, StatusPill } from "@/components/ui";
import { getSupabaseBrowserClient, isSupabaseConfigured, type BookingRecord } from "@/lib/supabase";
import { getBookingStatusTone, isClosedBookingStatus } from "@/lib/booking-status";
import { getBookingDisplayedFee } from "@/lib/booking-fee";

type WorkerHistoryState = {
  loading: boolean;
  error: string;
  bookings: BookingRecord[];
};

export function WorkerJobHistory() {
  const configured = isSupabaseConfigured();
  const { loading: authLoading, profile } = useAuthProfile();
  const [state, setState] = useState<WorkerHistoryState>({
    loading: configured,
    error: configured ? "" : "Supabase is not configured.",
    bookings: [],
  });

  useEffect(() => {
    if (!configured || authLoading || !profile || profile.role !== "employer") {
      return;
    }

    let active = true;
    const supabase = getSupabaseBrowserClient();
    const workerProfile = profile;

    async function loadHistory() {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("worker_id", workerProfile.id)
        .order("updated_at", { ascending: false });

      if (!active) {
        return;
      }

      if (error) {
        setState({
          loading: false,
          error: error.message,
          bookings: [],
        });
        return;
      }

      const closedBookings = ((data as BookingRecord[] | null) ?? []).filter((booking) =>
        isClosedBookingStatus(booking.status),
      );

      setState({
        loading: false,
        error: "",
        bookings: closedBookings,
      });
    }

    void loadHistory();
    const interval = window.setInterval(() => {
      void loadHistory();
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authLoading, configured, profile]);

  return (
    <Panel>
      <SectionHeading
        eyebrow="History"
        title="Completed job history"
        description="Keep a record of jobs that reached completion, payment, or review so you can track finished work."
      />
      {state.error ? <p className="mt-6 text-sm text-[var(--muted)]">{state.error}</p> : null}
      {state.loading ? <p className="mt-6 text-sm text-[var(--muted)]">Loading job history...</p> : null}
      {!state.loading && state.bookings.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No finished jobs yet. Completed work will appear here.
        </p>
      ) : null}
      <div className="mt-6 space-y-4">
        {state.bookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-[var(--foreground)]">{booking.service}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{booking.address}</p>
              </div>
              <StatusPill tone={getBookingStatusTone(booking.status)}>{booking.status}</StatusPill>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-3">
              <p>Schedule: {booking.scheduled_for}</p>
              <p>Final fee: {getBookingDisplayedFee(booking)}</p>
              <p>Payment: {booking.payment_status}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
