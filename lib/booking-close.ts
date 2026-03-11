"use client";

import { getSupabaseBrowserClient, type BookingRecord } from "@/lib/supabase";

export async function confirmBookingClose(
  booking: BookingRecord,
  actor: "hirer" | "employer",
) {
  const supabase = getSupabaseBrowserClient();
  const confirmationField =
    actor === "hirer" ? "hirer_close_confirmed" : "worker_close_confirmed";

  const { data, error } = await supabase
    .from("bookings")
    .update({ [confirmationField]: true })
    .eq("id", booking.id)
    .select("*")
    .single();

  if (error) {
    if (
      error.message.includes("hirer_close_confirmed") ||
      error.message.includes("worker_close_confirmed")
    ) {
      throw new Error(
        "Run supabase/migrations/20260312_add_booking_close_confirmation.sql in Supabase first.",
      );
    }

    throw error;
  }

  const updatedBooking = data as BookingRecord;

  if (updatedBooking.hirer_close_confirmed && updatedBooking.worker_close_confirmed) {
    const { error: chatDeleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("worker_id", booking.worker_id)
      .eq("hirer_id", booking.hirer_id);

    if (chatDeleteError) {
      throw chatDeleteError;
    }

    return {
      deleted: false,
      booking: updatedBooking,
    };
  }

  return {
    deleted: false,
    booking: updatedBooking,
  };
}
