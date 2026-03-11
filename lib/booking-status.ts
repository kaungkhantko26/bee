export const bookingStatusFlow = [
  "Request sent",
  "Worker accepted",
  "On the way",
  "Arrived",
  "Job completed",
  "Payment processed",
  "Review left",
] as const;

export type BookingLifecycleStatus = (typeof bookingStatusFlow)[number];

const closedBookingStatuses = new Set<BookingLifecycleStatus>([
  "Job completed",
  "Payment processed",
  "Review left",
]);

export function getBookingStatusTone(status: string) {
  switch (status) {
    case "Request sent":
      return "warning" as const;
    case "Worker accepted":
      return "neutral" as const;
    case "On the way":
      return "neutral" as const;
    case "Arrived":
      return "success" as const;
    case "Job completed":
      return "success" as const;
    case "Payment processed":
      return "success" as const;
    case "Review left":
      return "success" as const;
    default:
      return "neutral" as const;
  }
}

export function getBookingStatusIndex(status: string) {
  const index = bookingStatusFlow.indexOf(status as BookingLifecycleStatus);
  return index === -1 ? 0 : index;
}

export function getBookingStatusDescription(status: string) {
  switch (status) {
    case "Request sent":
      return "BEE is checking nearby availability and pushing the request to workers who can realistically take it.";
    case "Worker accepted":
      return "The first worker accepted the job, so the request is now assigned and ready to move into travel.";
    case "On the way":
      return "The assigned worker is travelling to the address now.";
    case "Arrived":
      return "The worker has reached the location and can start the job.";
    case "Job completed":
      return "The work is done. Payment can now be processed in-app.";
    case "Payment processed":
      return "Payment is complete. The booking can now close with a verified review.";
    case "Review left":
      return "The job is fully closed with payment and customer feedback attached.";
    default:
      return "This booking is moving through the BEE dispatch lifecycle.";
  }
}

export function isClosedBookingStatus(status: string) {
  return closedBookingStatuses.has(status as BookingLifecycleStatus);
}

export function canClearCompletedChat(status: string | null) {
  return status ? isClosedBookingStatus(status) : false;
}

export function canConfirmBookingClose(status: string, paymentStatus: string) {
  const normalizedPaymentStatus = paymentStatus.trim().toLowerCase();
  return (
    normalizedPaymentStatus === "paid" &&
    (status === "Payment processed" || status === "Review left")
  );
}

export function isArchivedBooking(
  booking: Pick<{
    status: string;
    payment_status: string;
    hirer_close_confirmed: boolean;
    worker_close_confirmed: boolean;
  }, "status" | "payment_status" | "hirer_close_confirmed" | "worker_close_confirmed">,
) {
  return (
    canConfirmBookingClose(booking.status, booking.payment_status) &&
    booking.hirer_close_confirmed &&
    booking.worker_close_confirmed
  );
}

export function getWorkerNextAction(status: string) {
  switch (status) {
    case "Request sent":
      return {
        label: "Accept job",
        nextStatus: "Worker accepted" as BookingLifecycleStatus,
        description: "Claim this dispatch before another worker takes it.",
      };
    case "Worker accepted":
      return {
        label: "Start trip",
        nextStatus: "On the way" as BookingLifecycleStatus,
        description: "Tell the customer you are heading to the address.",
      };
    case "On the way":
      return {
        label: "Mark arrived",
        nextStatus: "Arrived" as BookingLifecycleStatus,
        description: "Confirm that you reached the job location.",
      };
    case "Arrived":
      return {
        label: "Complete job",
        nextStatus: "Job completed" as BookingLifecycleStatus,
        description: "Finish the service so the customer can pay and close the job.",
      };
    default:
      return null;
  }
}

export function getCustomerNextAction(
  status: string,
  paymentStatus: string,
  hasWorkerTotalFee = false,
) {
  if (
    status === "Job completed" &&
    hasWorkerTotalFee &&
    paymentStatus.toLowerCase() !== "paid"
  ) {
    return {
      label: "Process payment",
      nextStatus: "Payment processed" as BookingLifecycleStatus,
      nextPaymentStatus: "Paid",
      description: "Confirm the worker's submitted total and release the payment.",
    };
  }

  if (status === "Payment processed") {
    return {
      label: "Leave review",
      nextStatus: "Review left" as BookingLifecycleStatus,
      nextPaymentStatus: paymentStatus || "Paid",
      description: "Add verified feedback tied to this completed booking.",
    };
  }

  return null;
}
