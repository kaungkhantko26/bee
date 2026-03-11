"use client";

import { useEffect, useState } from "react";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { MetricCard } from "@/components/ui";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type BookingRecord,
} from "@/lib/supabase";
import { isClosedBookingStatus } from "@/lib/booking-status";
import { getBookingDisplayedFee, parseBookingAmount } from "@/lib/booking-fee";

type BookingMetricsState = {
  loading: boolean;
  error: string;
  bookings: BookingRecord[];
};

export function LiveBookingMetrics() {
  const configured = isSupabaseConfigured();
  const { loading: authLoading, profile } = useAuthProfile();
  const [state, setState] = useState<BookingMetricsState>({
    loading: configured,
    error: configured ? "" : "Supabase is not configured.",
    bookings: [],
  });

  useEffect(() => {
    if (!configured || authLoading || !profile || profile.role !== "hirer") {
      return;
    }

    let active = true;
    const supabase = getSupabaseBrowserClient();
    const hirerProfile = profile;

    async function loadBookings() {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("hirer_id", hirerProfile.id)
        .order("created_at", { ascending: false });

      if (!active) {
        return;
      }

      setState({
        loading: false,
        error: error?.message ?? "",
        bookings: (data as BookingRecord[] | null) ?? [],
      });
    }

    void loadBookings();
    const interval = window.setInterval(() => {
      void loadBookings();
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authLoading, configured, profile]);

  const activeTrips = state.bookings.filter(
    (booking) => !isClosedBookingStatus(booking.status),
  ).length;
  const paidJobs = state.bookings.filter(
    (booking) => booking.payment_status.toLowerCase() === "paid",
  ).length;
  const pendingPayments = state.bookings.filter(
    (booking) => booking.status === "Job completed" && booking.payment_status.toLowerCase() !== "paid",
  ).length;
  const reviewsLeft = state.bookings.filter(
    (booking) => booking.status === "Review left",
  ).length;
  const totalSpent = state.bookings.reduce(
    (sum, booking) => sum + parseBookingAmount(getBookingDisplayedFee(booking)),
    0,
  );

  const metrics = [
    { label: "Active trips", value: String(activeTrips) },
    { label: "Paid bookings", value: String(paidJobs) },
    { label: "Awaiting payment", value: String(pendingPayments) },
    { label: "Reviews left", value: String(reviewsLeft) },
    { label: "Total spent", value: `$${totalSpent.toFixed(0)}` },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((item) => (
        <MetricCard
          key={item.label}
          value={state.loading ? "..." : item.value}
          label={item.label}
        />
      ))}
      {state.error ? (
        <p className="text-sm text-[var(--muted)] sm:col-span-2 xl:col-span-4">
          {state.error}
        </p>
      ) : null}
    </section>
  );
}
