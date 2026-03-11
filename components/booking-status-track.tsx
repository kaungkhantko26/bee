import { bookingStatusFlow, getBookingStatusIndex } from "@/lib/booking-status";
import { cn } from "@/components/ui";

export function BookingStatusTrack({ status }: { status: string }) {
  const currentIndex = getBookingStatusIndex(status);

  return (
    <div
      className="mt-4 grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}
    >
      {bookingStatusFlow.map((step, index) => {
        const active = index <= currentIndex;

        return (
          <div
            key={step}
            className={cn(
              "rounded-[1rem] px-3 py-2 text-center text-xs font-semibold tracking-[0.01em]",
              active
                ? "bg-[var(--accent)] text-[var(--foreground)]"
                : "bg-white/80 text-[var(--muted)]",
            )}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}
