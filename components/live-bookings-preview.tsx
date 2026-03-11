"use client";

import { BookingStatusTrack } from "@/components/booking-status-track";
import { useEffect, useState } from "react";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { Panel, SectionHeading, StatusPill } from "@/components/ui";
import { getSupabaseBrowserClient, isSupabaseConfigured, type BookingRecord } from "@/lib/supabase";
import { getBookingStatusDescription, getBookingStatusTone } from "@/lib/booking-status";
import { getBookingDisplayedFee } from "@/lib/booking-fee";

export function LiveBookingsPreview() {
  const configured = isSupabaseConfigured();
  const { loading: authLoading, profile } = useAuthProfile();
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState(configured ? "" : "Supabase is not configured.");
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  useEffect(() => {
    if (!configured) {
      return;
    }

    if (authLoading || !profile || profile.role !== "hirer") {
      return;
    }

    let active = true;
    const hirerProfile = profile;
    const supabase = getSupabaseBrowserClient();

    async function loadPreview() {
      const { data, error: nextError } = await supabase
        .from("bookings")
        .select("*")
        .eq("hirer_id", hirerProfile.id)
        .order("updated_at", { ascending: false })
        .limit(3);

      if (!active) {
        return;
      }

      if (nextError) {
        setError(nextError.message);
        setLoading(false);
        return;
      }

      setBookings((data as BookingRecord[] | null) ?? []);
      setLoading(false);
      setError("");
    }

    void loadPreview();
    const interval = window.setInterval(() => {
      void loadPreview();
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authLoading, configured, profile]);

  return (
    <Panel>
      <SectionHeading
        eyebrow="Upcoming"
        title="My active bookings"
        description="Bookings remain linked to chat, receipts, and support so the user never loses context."
      />
      {error ? <p className="mt-6 text-sm text-[var(--muted)]">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-[var(--muted)]">Loading bookings...</p> : null}
      {!loading && bookings.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No active bookings yet. Send a request to get started.
        </p>
      ) : null}
      <div className="mt-6 space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-[var(--foreground)]">{booking.service}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{booking.address}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone={getBookingStatusTone(booking.status)}>{booking.status}</StatusPill>
                <p className="break-words text-sm font-semibold text-[var(--foreground)]">
                  {getBookingDisplayedFee(booking)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">{booking.scheduled_for}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {getBookingStatusDescription(booking.status)}
            </p>
            <BookingStatusTrack status={booking.status} />
          </div>
        ))}
      </div>
    </Panel>
  );
}
