"use client";

import { BookingStatusTrack } from "@/components/booking-status-track";
import { Panel, SectionHeading, StatusPill } from "@/components/ui";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { confirmBookingClose } from "@/lib/booking-close";
import { getSupabaseBrowserClient, isSupabaseConfigured, type BookingRecord } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import {
  canConfirmBookingClose,
  getBookingStatusDescription,
  getBookingStatusTone,
  getCustomerNextAction,
  isArchivedBooking,
  isClosedBookingStatus,
} from "@/lib/booking-status";
import { getBookingDisplayedFee, parseBookingAmount } from "@/lib/booking-fee";

type BookingsState = {
  loading: boolean;
  error: string;
  bookings: BookingRecord[];
};

export function LiveBookingsOverview() {
  const configured = isSupabaseConfigured();
  const { loading: authLoading, profile } = useAuthProfile();
  const [state, setState] = useState<BookingsState>({
    loading: configured,
    error: configured ? "" : "Supabase is not configured.",
    bookings: [],
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

    async function loadBookings() {
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

      setState({
        loading: false,
        error: "",
        bookings: (data as BookingRecord[] | null) ?? [],
      });
    }

    void loadBookings();
    const interval = window.setInterval(() => {
      void loadBookings();
    }, 500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authLoading, configured, profile]);

  const bookingMetrics = useMemo(
    () => ({
      total: state.bookings.length,
      paid: state.bookings.filter((booking) => booking.payment_status === "Paid").length,
      inProgress: state.bookings.filter(
        (booking) => !isClosedBookingStatus(booking.status) && !isArchivedBooking(booking),
      ).length,
      reviewLeft: state.bookings.filter((booking) => booking.status === "Review left").length,
      totalSpend: state.bookings.reduce((sum, booking) => {
        return sum + parseBookingAmount(getBookingDisplayedFee(booking));
      }, 0),
    }),
    [state.bookings],
  );

  const activeBookings = useMemo(
    () => state.bookings.filter((booking) => !isArchivedBooking(booking)),
    [state.bookings],
  );

  async function runCustomerAction(booking: BookingRecord) {
    const nextAction = getCustomerNextAction(
      booking.status,
      booking.payment_status,
      Boolean(booking.worker_total_fee?.trim()),
    );

    if (!configured || !profile || profile.role !== "hirer" || !nextAction) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setUpdatingId(booking.id);

    const { error } = await supabase
      .from("bookings")
      .update({
        status: nextAction.nextStatus,
        payment_status: nextAction.nextPaymentStatus,
      })
      .eq("id", booking.id)
      .eq("hirer_id", profile.id);

    if (error) {
      setState((current) => ({
        ...current,
        error: error.message,
      }));
      setUpdatingId(null);
      return;
    }

    setState((current) => ({
      ...current,
      error: "",
      bookings: current.bookings.map((currentBooking) =>
        currentBooking.id === booking.id
          ? {
              ...currentBooking,
              status: nextAction.nextStatus,
              payment_status: nextAction.nextPaymentStatus,
            }
          : currentBooking,
      ),
    }));
    setUpdatingId(null);
  }

  async function handleCloseConfirmation(booking: BookingRecord) {
    if (!configured || !profile || profile.role !== "hirer") {
      return;
    }

    setUpdatingId(booking.id);

    try {
      const result = await confirmBookingClose(booking, "hirer");

      setState((current) => ({
        ...current,
        error: "",
        bookings: result.deleted
          ? current.bookings.filter((currentBooking) => currentBooking.id !== booking.id)
          : current.bookings.map((currentBooking) =>
              currentBooking.id === booking.id ? result.booking : currentBooking,
            ),
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : "Unable to confirm close for this booking.",
      }));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Panel>
        <SectionHeading
          eyebrow="Timeline"
          title="Track every job like a live service trip"
          description="Requests, worker movement, payment, and reviews stay inside the same booking so the customer never loses context."
        />
        {state.error ? (
          <p className="mt-6 text-sm text-[var(--muted)]">{state.error}</p>
        ) : null}
        {state.loading ? (
          <p className="mt-6 text-sm text-[var(--muted)]">Loading bookings...</p>
        ) : null}
        {!state.loading && activeBookings.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--muted)]">
            No bookings yet. Send a request to create your first job.
          </p>
        ) : null}
        <div className="mt-6 space-y-4">
          {activeBookings.map((booking) => (
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
              <div className="mt-4 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
                <p>{booking.scheduled_for}</p>
                <p className="break-words sm:text-right">
                  {booking.worker_total_fee ? `Final fee ${booking.worker_total_fee}` : `Budget ${booking.price}`}
                </p>
              </div>
              {booking.worker_total_fee ? (
                <p className="mt-2 text-sm text-[var(--foreground)]">
                  Worker submitted total: {booking.worker_total_fee}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Waiting for the worker to submit the final total fee.
                </p>
              )}
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                {getBookingStatusDescription(booking.status)}
              </p>
              <BookingStatusTrack status={booking.status} />
              {getCustomerNextAction(
                booking.status,
                booking.payment_status,
                Boolean(booking.worker_total_fee?.trim()),
              ) ? (
                <div className="mt-4 rounded-[1.25rem] bg-[var(--panel)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                    Customer action
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {getCustomerNextAction(
                      booking.status,
                      booking.payment_status,
                      Boolean(booking.worker_total_fee?.trim()),
                    )?.description}
                  </p>
                  <button
                    type="button"
                    disabled={updatingId === booking.id}
                    onClick={() => {
                      void runCustomerAction(booking);
                    }}
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingId === booking.id
                      ? "Updating..."
                      : getCustomerNextAction(
                          booking.status,
                          booking.payment_status,
                          Boolean(booking.worker_total_fee?.trim()),
                        )?.label}
                  </button>
                </div>
              ) : null}
              {canConfirmBookingClose(booking.status, booking.payment_status) ? (
                <div className="mt-4 rounded-[1.25rem] bg-[var(--panel)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                    Close booking
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Once both you and the worker confirm, this booking leaves the active trip list but stays in receipts and history.
                  </p>
                  <button
                    type="button"
                    disabled={updatingId === booking.id || booking.hirer_close_confirmed}
                    onClick={() => {
                      void handleCloseConfirmation(booking);
                    }}
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {booking.hirer_close_confirmed
                      ? booking.worker_close_confirmed
                        ? "Closing..."
                        : "Waiting for worker confirmation"
                      : updatingId === booking.id
                        ? "Confirming..."
                        : "Confirm close"}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6">
        <Panel>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
            Wallet
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[1.25rem] border border-black/10 bg-[var(--panel)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-[var(--foreground)]">Total requests</p>
                <p className="font-semibold text-[var(--foreground)]">{bookingMetrics.total}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Every dispatch request created from your account.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-black/10 bg-[var(--panel)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-[var(--foreground)]">In progress</p>
                <p className="font-semibold text-[var(--foreground)]">{bookingMetrics.inProgress}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Jobs still moving through worker arrival, service, or payment.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-black/10 bg-[var(--panel)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-[var(--foreground)]">Paid jobs</p>
                <p className="font-semibold text-[var(--foreground)]">{bookingMetrics.paid}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Bookings with payment already processed in-app.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-black/10 bg-[var(--panel)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-[var(--foreground)]">Reviews left</p>
                <p className="font-semibold text-[var(--foreground)]">{bookingMetrics.reviewLeft}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Verified reviews attached to completed jobs.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-black/10 bg-[var(--panel)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-[var(--foreground)]">Total spend</p>
                <p className="font-semibold text-[var(--foreground)]">
                  ${bookingMetrics.totalSpend.toFixed(0)}
                </p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Running total across your booking history.
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="!bg-[linear-gradient(180deg,rgba(55,42,10,0.98),rgba(35,26,4,1))] !text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/92">
            Payment status
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
            Close the job with payment first, then verified feedback.
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/88">
            This follows the real service flow: the worker completes the job, the customer confirms payment, and then the review is left on the same booking record.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <StatusPill tone="success">{bookingMetrics.paid} paid</StatusPill>
            <StatusPill tone="neutral">{bookingMetrics.total} total</StatusPill>
            <StatusPill tone="warning">{bookingMetrics.inProgress} in progress</StatusPill>
          </div>
        </Panel>
      </div>
    </>
  );
}
