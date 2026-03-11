"use client";

import { useEffect, useState } from "react";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { Panel, SectionHeading, StatusPill } from "@/components/ui";
import { getSupabaseBrowserClient, isSupabaseConfigured, type BookingRecord } from "@/lib/supabase";
import { canConfirmBookingClose, getBookingStatusTone, isClosedBookingStatus } from "@/lib/booking-status";
type ReceiptsState = {
  loading: boolean;
  error: string;
  bookings: BookingRecord[];
};
import { getBookingDisplayedFee, parseBookingAmount } from "@/lib/booking-fee";

export function LiveReceiptsPanel() {
  const configured = isSupabaseConfigured();
  const { loading: authLoading, profile } = useAuthProfile();
  const [state, setState] = useState<ReceiptsState>({
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

    async function loadReceipts() {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("hirer_id", hirerProfile.id)
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

      const receiptBookings = ((data as BookingRecord[] | null) ?? []).filter(
        (booking) =>
          booking.payment_status === "Paid" ||
          isClosedBookingStatus(booking.status) ||
          canConfirmBookingClose(booking.status, booking.payment_status),
      );

      setState({
        loading: false,
        error: "",
        bookings: receiptBookings,
      });
    }

    void loadReceipts();
    const interval = window.setInterval(() => {
      void loadReceipts();
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authLoading, configured, profile]);

  return (
    <Panel>
      <SectionHeading
        eyebrow="Receipts"
        title="Paid job receipts"
        description="Every finished job should leave the customer with a simple receipt tied to the booking."
      />
      {state.error ? <p className="mt-6 text-sm text-[var(--muted)]">{state.error}</p> : null}
      {state.loading ? <p className="mt-6 text-sm text-[var(--muted)]">Loading receipts...</p> : null}
      {!state.loading && state.bookings.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No receipts yet. Paid or completed jobs will appear here.
        </p>
      ) : null}
      <div className="mt-6 space-y-4">
        {state.bookings.map((booking) => {
          const total = parseBookingAmount(getBookingDisplayedFee(booking));

          return (
            <div
              key={booking.id}
              className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{booking.service}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Receipt #{booking.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <StatusPill tone={getBookingStatusTone(booking.status)}>{booking.status}</StatusPill>
              </div>
              <div className="mt-5 grid gap-3 rounded-[1.25rem] bg-white/80 p-4 text-sm text-[var(--foreground)]">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[var(--muted)]">Service address</p>
                  <p className="text-right font-medium">{booking.address}</p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[var(--muted)]">Arrival window</p>
                  <p className="text-right font-medium">{booking.scheduled_for}</p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[var(--muted)]">Payment status</p>
                  <p className="text-right font-medium">{booking.payment_status}</p>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-black/10 pt-3">
                  <p className="font-semibold text-[var(--foreground)]">Total</p>
                  <p className="font-semibold text-[var(--foreground)]">
                    {total > 0 ? `$${total.toFixed(2)}` : getBookingDisplayedFee(booking)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Voucher receipt is stored in-app for this booking.
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
