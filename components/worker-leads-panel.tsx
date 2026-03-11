"use client";

import { useEffect, useState } from "react";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { Panel, StatusPill } from "@/components/ui";
import { confirmBookingClose } from "@/lib/booking-close";
import { getSupabaseBrowserClient, isSupabaseConfigured, type BookingRecord } from "@/lib/supabase";
import {
  canConfirmBookingClose,
  getBookingStatusDescription,
  getBookingStatusTone,
  getWorkerNextAction,
  isArchivedBooking,
  type BookingLifecycleStatus,
} from "@/lib/booking-status";

type LeadsState = {
  loading: boolean;
  error: string;
  bookings: BookingRecord[];
};

export function WorkerLeadsPanel() {
  const configured = isSupabaseConfigured();
  const { loading: authLoading, profile } = useAuthProfile();
  const [state, setState] = useState<LeadsState>({
    loading: configured,
    error: configured ? "" : "Supabase is not configured.",
    bookings: [],
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feeDrafts, setFeeDrafts] = useState<Record<string, string>>({});
  const activeBookings = state.bookings.filter((booking) => !isArchivedBooking(booking));

  useEffect(() => {
    if (!configured) {
      return;
    }

    if (authLoading || !profile || profile.role !== "employer") {
      return;
    }

    let active = true;
    const workerProfile = profile;
    const supabase = getSupabaseBrowserClient();

    async function loadLeads() {
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

      setState({
        loading: false,
        error: "",
        bookings: (data as BookingRecord[] | null) ?? [],
      });
    }

    void loadLeads();
    const interval = window.setInterval(() => {
      void loadLeads();
    }, 500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authLoading, configured, profile]);

  async function updateBookingStatus(bookingId: string, status: BookingLifecycleStatus) {
    if (!configured || !profile || profile.role !== "employer") {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setUpdatingId(bookingId);

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .eq("worker_id", profile.id);

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
      bookings: current.bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status } : booking,
      ),
    }));
    setUpdatingId(null);
  }

  async function handleCloseConfirmation(booking: BookingRecord) {
    if (!configured || !profile || profile.role !== "employer") {
      return;
    }

    setUpdatingId(booking.id);

    try {
      const result = await confirmBookingClose(booking, "employer");

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

  async function submitWorkerTotal(booking: BookingRecord) {
    if (!configured || !profile || profile.role !== "employer") {
      return;
    }

    const workerTotalFee = (feeDrafts[booking.id] ?? booking.worker_total_fee ?? "").trim();

    if (!workerTotalFee) {
      setState((current) => ({
        ...current,
        error: "Enter the final total fee before sending it to the customer.",
      }));
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setUpdatingId(booking.id);

    const { error } = await supabase
      .from("bookings")
      .update({
        worker_total_fee: workerTotalFee,
        worker_fee_submitted_at: new Date().toISOString(),
        payment_status: "Awaiting customer payment",
      })
      .eq("id", booking.id)
      .eq("worker_id", profile.id);

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
              worker_total_fee: workerTotalFee,
              worker_fee_submitted_at: new Date().toISOString(),
              payment_status: "Awaiting customer payment",
            }
          : currentBooking,
      ),
    }));
    setUpdatingId(null);
  }

  return (
    <Panel className="!bg-[linear-gradient(180deg,rgba(55,42,10,0.98),rgba(35,26,4,1))] !text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/92">
        My job requests
      </p>
      {state.error ? (
        <p className="mt-5 text-sm text-white/88">{state.error}</p>
      ) : null}
      {state.loading ? (
        <p className="mt-5 text-sm text-white/88">Loading job requests...</p>
      ) : null}
      {!state.loading && activeBookings.length === 0 ? (
        <p className="mt-5 text-sm text-white/88">
          No job requests yet. When a customer books you, it will appear here.
        </p>
      ) : null}
      <div className="mt-5 space-y-3">
        {activeBookings.map((lead) => (
          <div
            key={lead.id}
            className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">{lead.service}</p>
              <StatusPill
                tone={getBookingStatusTone(lead.status)}
              >
                {lead.status}
              </StatusPill>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-white/88">
              <p>Budget estimate: {lead.price}</p>
              <p>Time: {lead.scheduled_for}</p>
            </div>
            <p className="mt-2 text-sm text-white/84">Address: {lead.address}</p>
            {lead.worker_total_fee ? (
              <p className="mt-2 text-sm text-white/88">Final fee sent: {lead.worker_total_fee}</p>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-white/80">
              {getBookingStatusDescription(lead.status)}
            </p>
            {getWorkerNextAction(lead.status) ? (
              <div className="mt-4 rounded-[1.1rem] bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/84">
                  Next action
                </p>
                <p className="mt-2 text-sm leading-6 text-white/88">
                  {getWorkerNextAction(lead.status)?.description}
                </p>
                <button
                  type="button"
                  disabled={updatingId === lead.id}
                  onClick={() => {
                    const nextAction = getWorkerNextAction(lead.status);
                    if (!nextAction) {
                      return;
                    }
                    void updateBookingStatus(lead.id, nextAction.nextStatus as BookingLifecycleStatus);
                  }}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingId === lead.id
                    ? "Updating..."
                    : getWorkerNextAction(lead.status)?.label}
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-[1.1rem] bg-white/10 p-4 text-sm leading-6 text-white/84">
                {lead.status === "Job completed"
                  ? lead.worker_total_fee
                    ? "Waiting for the customer to confirm the submitted total and pay."
                    : "Send the final total fee so the customer can pay."
                  : lead.status === "Payment processed"
                    ? "Payment is complete. The customer can leave a verified review."
                    : lead.status === "Review left"
                      ? "This job is closed with payment and review completed."
                      : "No further worker action is needed right now."}
              </div>
            )}
            {lead.status === "Job completed" && lead.payment_status !== "Paid" ? (
              <div className="mt-4 rounded-[1.1rem] bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/84">
                  Final fee
                </p>
                <p className="mt-2 text-sm leading-6 text-white/88">
                  Enter the exact total you want the customer to pay for this completed job.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={feeDrafts[lead.id] ?? lead.worker_total_fee ?? ""}
                    onChange={(event) =>
                      setFeeDrafts((current) => ({
                        ...current,
                        [lead.id]: event.target.value,
                      }))
                    }
                    placeholder="$65"
                    className="min-h-11 flex-1 rounded-[1rem] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] outline-none"
                  />
                  <button
                    type="button"
                    disabled={updatingId === lead.id}
                    onClick={() => {
                      void submitWorkerTotal(lead);
                    }}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingId === lead.id
                      ? "Sending..."
                      : lead.worker_total_fee
                        ? "Update total fee"
                        : "Send total fee"}
                  </button>
                </div>
              </div>
            ) : null}
            {canConfirmBookingClose(lead.status, lead.payment_status) ? (
              <div className="mt-4 rounded-[1.1rem] bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/84">
                  Close booking
                </p>
                <p className="mt-2 text-sm leading-6 text-white/88">
                  When both worker and customer confirm, the job leaves this active queue but remains in history and receipts.
                </p>
                <button
                  type="button"
                  disabled={updatingId === lead.id || lead.worker_close_confirmed}
                  onClick={() => {
                    void handleCloseConfirmation(lead);
                  }}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {lead.worker_close_confirmed
                    ? lead.hirer_close_confirmed
                      ? "Closing..."
                      : "Waiting for customer confirmation"
                    : updatingId === lead.id
                      ? "Confirming..."
                      : "Confirm close"}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}
