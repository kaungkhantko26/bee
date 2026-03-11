import type { BookingRecord } from "@/lib/supabase";

export function getBookingDisplayedFee(booking: Pick<BookingRecord, "worker_total_fee" | "price">) {
  return booking.worker_total_fee?.trim() || booking.price;
}

export function parseBookingAmount(value: string) {
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}
