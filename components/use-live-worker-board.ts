"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type ChatMessageRecord,
  type ProfileRecord,
  type WorkerAvailabilityRecord,
  type WorkerProfileRecord,
  type WorkerScheduleSlotRecord,
  type WorkerScheduleState,
} from "@/lib/supabase";
import { canClearCompletedChat } from "@/lib/booking-status";

export type LiveScheduleState = WorkerScheduleState;

export type LiveAvailabilityRow = {
  id?: string;
  day: string;
  hours: string;
};

export type LiveScheduleSlot = {
  id: string;
  time: string;
  title: string;
  customer: string;
  state: LiveScheduleState;
};

export type LiveMessage = {
  id: string;
  sender: "hirer" | "employer";
  author: string;
  text: string;
  time: string;
  hirerId?: string;
};

export const workerPresenceOptions = [
  {
    value: "Available now",
    note: "Ready for new work",
  },
  {
    value: "Busy",
    note: "Currently busy, but still checking requests",
  },
  {
    value: "Away",
    note: "Temporarily away from new requests",
  },
  {
    value: "Offline",
    note: "Not accepting work right now",
  },
] as const;

const defaultAvailabilityRows = [
  { day: "Mon", hours: "9 AM - 5 PM", sortOrder: 1 },
  { day: "Tue", hours: "9 AM - 5 PM", sortOrder: 2 },
  { day: "Wed", hours: "9 AM - 5 PM", sortOrder: 3 },
  { day: "Thu", hours: "9 AM - 5 PM", sortOrder: 4 },
  { day: "Fri", hours: "9 AM - 5 PM", sortOrder: 5 },
  { day: "Sat", hours: "Emergency only", sortOrder: 6 },
] as const;

function formatMessageTime(value?: string) {
  if (!value) {
    return "--:--";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSummaryFromSchedule(schedule: LiveScheduleSlot[]) {
  const active = schedule.find((slot) => slot.state === "On job");
  const upcoming = schedule.find((slot) => slot.state === "Available");
  const confirmed = schedule.filter((slot) => slot.state === "Confirmed").length;

  if (active) {
    return {
      status: "On job now",
      note: `Busy with ${active.title} until ${active.time}`,
      tone: "warning" as const,
    };
  }

  if (upcoming) {
    return {
      status: "Available later today",
      note: `Next open slot ${upcoming.time}`,
      tone: "success" as const,
    };
  }

  return {
    status: confirmed > 0 ? "Booked for today" : "Available now",
    note: confirmed > 0 ? `${confirmed} confirmed job(s) today` : "Ready for new work",
    tone: confirmed > 0 ? ("neutral" as const) : ("success" as const),
  };
}

function toneFromStatus(status: string) {
  if (status.toLowerCase().includes("job")) {
    return "warning" as const;
  }

  if (status.toLowerCase().includes("available")) {
    return "success" as const;
  }

  return "neutral" as const;
}

function noteForPresence(status: string) {
  return (
    workerPresenceOptions.find((option) => option.value === status)?.note ||
    "Availability updated"
  );
}

function buildWorkerProfilePayload(profile: ProfileRecord): WorkerProfileRecord {
  return {
    worker_id: profile.id,
    display_name: profile.full_name,
    profession: profile.profession?.trim() || "Home services",
    area: "Service area not set",
    hourly_rate: 30,
    eta_minutes: 20,
    rating: 5,
    completed_jobs: 0,
    availability_status: "Available now",
    availability_note: "Ready for new work",
    bio:
      profile.experience_summary?.trim() ||
      "Professional ready for home service bookings.",
    tags: profile.profession?.trim() ? [profile.profession.trim()] : ["Home services"],
  };
}

type BoardState = {
  loading: boolean;
  error: string;
  workerId: string | null;
  workerName: string;
  activeHirerId: string | null;
  activeBookingStatus: string | null;
  canChat: boolean;
  clearingChat: boolean;
  chatHint: string;
  availability: LiveAvailabilityRow[];
  schedule: LiveScheduleSlot[];
  messages: LiveMessage[];
  workerProfile: WorkerProfileRecord | null;
};

const emptyBoard: BoardState = {
  loading: false,
  error: "",
  workerId: null,
  workerName: "Worker",
  activeHirerId: null,
  activeBookingStatus: null,
  canChat: false,
  clearingChat: false,
  chatHint: "Book a worker first to start chatting.",
  availability: [],
  schedule: [],
  messages: [],
  workerProfile: null,
};

async function ensureWorkerSetup(profile: ProfileRecord) {
  const supabase = getSupabaseBrowserClient();
  const { data: existingWorkerProfile } = await supabase
    .from("worker_profiles")
    .select("*")
    .eq("worker_id", profile.id)
    .maybeSingle();

  const workerProfileRecord =
    (existingWorkerProfile as WorkerProfileRecord | null) ?? null;

  if (!workerProfileRecord) {
    await supabase
      .from("worker_profiles")
      .insert(buildWorkerProfilePayload(profile));
  } else {
    await supabase
      .from("worker_profiles")
      .update({
        display_name: profile.full_name,
        profession: profile.profession?.trim() || workerProfileRecord.profession,
        bio:
          profile.experience_summary?.trim() || workerProfileRecord.bio,
        tags:
          profile.profession?.trim()
            ? [profile.profession.trim()]
            : workerProfileRecord.tags,
      })
      .eq("worker_id", profile.id);
  }

  const { count: availabilityCount } = await supabase
    .from("worker_availability")
    .select("*", { count: "exact", head: true })
    .eq("worker_id", profile.id);

  if (!availabilityCount) {
    await supabase.from("worker_availability").insert(
      defaultAvailabilityRows.map((row) => ({
        worker_id: profile.id,
        day_label: row.day,
        hours: row.hours,
        sort_order: row.sortOrder,
      })),
    );
  }

}

async function resolveWorkerIdForHirer(hirerId: string) {
  const supabase = getSupabaseBrowserClient();

  const { data: latestBooking } = await supabase
    .from("bookings")
    .select("worker_id")
    .eq("hirer_id", hirerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestBooking?.worker_id) {
    return latestBooking.worker_id;
  }
  return null;
}

async function resolveActiveHirerId(workerId: string) {
  const supabase = getSupabaseBrowserClient();

  const { data: latestMessage } = await supabase
    .from("chat_messages")
    .select("hirer_id")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestMessage?.hirer_id) {
    return latestMessage.hirer_id;
  }

  const { data: latestBooking } = await supabase
    .from("bookings")
    .select("hirer_id")
    .eq("worker_id", workerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return latestBooking?.hirer_id ?? null;
}

async function writeWorkerSummary(workerId: string, schedule: LiveScheduleSlot[]) {
  const supabase = getSupabaseBrowserClient();
  const summary = buildSummaryFromSchedule(schedule);

  const { error } = await supabase
    .from("worker_profiles")
    .update({
      availability_status: summary.status,
      availability_note: summary.note,
    })
    .eq("worker_id", workerId);

  if (error) {
    throw error;
  }
}

function mapAvailability(rows: WorkerAvailabilityRecord[]) {
  return rows.map((row) => ({
    id: row.id,
    day: row.day_label,
    hours: row.hours,
  }));
}

function mapSchedule(rows: WorkerScheduleSlotRecord[]) {
  return rows.map((row) => ({
    id: row.id,
    time: row.time_label,
    title: row.title,
    customer: row.customer_name,
    state: row.state,
  }));
}

function mapMessages(rows: ChatMessageRecord[]) {
  return rows.map((row) => ({
    id: row.id,
    sender: row.sender_role,
    author: row.author_name,
    text: row.body,
    time: formatMessageTime(row.created_at),
    hirerId: row.hirer_id,
  }));
}

export function useLiveWorkerBoard() {
  const configured = isSupabaseConfigured();
  const { loading: authLoading, session, profile } = useAuthProfile();
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<BoardState>({
    ...emptyBoard,
    loading: configured,
    error: configured ? "" : "Supabase is not configured.",
  });

  useEffect(() => {
    if (!configured) {
      return;
    }

    if (authLoading) {
      return;
    }

    if (!session?.user || !profile) {
      return;
    }

    let active = true;
    const currentProfile = profile;
    const supabase = getSupabaseBrowserClient();

    async function loadBoard() {
      setState((current) => ({
        ...current,
        loading: true,
        error: "",
      }));

      try {
        if (currentProfile.role === "employer") {
          await ensureWorkerSetup(currentProfile);

          const activeHirerId = await resolveActiveHirerId(currentProfile.id);

          const [{ data: workerProfile }, { data: availability }, { data: schedule }] =
            await Promise.all([
              supabase
                .from("worker_profiles")
                .select("*")
                .eq("worker_id", currentProfile.id)
                .maybeSingle(),
              supabase
                .from("worker_availability")
                .select("*")
                .eq("worker_id", currentProfile.id)
                .order("sort_order"),
              supabase
                .from("worker_schedule_slots")
                .select("*")
                .eq("worker_id", currentProfile.id)
                .order("time_label"),
            ]);

          const workerProfileRecord =
            (workerProfile as WorkerProfileRecord | null) ?? null;

          const [messagesResult, bookingResult] = activeHirerId
            ? await Promise.all([
                supabase
                  .from("chat_messages")
                  .select("*")
                  .eq("worker_id", currentProfile.id)
                  .eq("hirer_id", activeHirerId)
                  .order("created_at"),
                supabase
                  .from("bookings")
                  .select("status")
                  .eq("worker_id", currentProfile.id)
                  .eq("hirer_id", activeHirerId)
                  .order("updated_at", { ascending: false })
                  .limit(1)
                  .maybeSingle(),
              ])
            : [
                { data: [] as ChatMessageRecord[] },
                { data: null as { status: string } | null },
              ];

          if (!active) {
            return;
          }

          setState({
            loading: false,
            error: "",
            workerId: currentProfile.id,
            workerName:
              workerProfileRecord?.display_name || currentProfile.full_name || "Worker",
            activeHirerId,
            activeBookingStatus: bookingResult.data?.status ?? null,
            canChat: Boolean(activeHirerId),
            clearingChat: false,
            chatHint: activeHirerId
              ? canClearCompletedChat(bookingResult.data?.status ?? null)
                ? "This job is completed. You can clear the chat thread when both sides are done."
                : "Reply to customers who already booked you."
              : "Chat will open when a customer books you.",
            availability: mapAvailability(
              (availability as WorkerAvailabilityRecord[] | null) ?? [],
            ),
            schedule: mapSchedule(
              (schedule as WorkerScheduleSlotRecord[] | null) ?? [],
            ),
            messages: mapMessages((messagesResult.data as ChatMessageRecord[] | null) ?? []),
            workerProfile: workerProfileRecord,
          });

          return;
        }

        const workerId = await resolveWorkerIdForHirer(currentProfile.id);

        if (!workerId) {
          setState({
            ...emptyBoard,
            loading: false,
            error: "",
            canChat: false,
            chatHint: "Book a worker first to start chatting.",
          });
          return;
        }

        const [{ data: workerProfile }, { data: availability }, { data: messages }, { data: booking }] =
          await Promise.all([
            supabase
              .from("worker_profiles")
              .select("*")
              .eq("worker_id", workerId)
              .maybeSingle(),
            supabase
              .from("worker_availability")
              .select("*")
              .eq("worker_id", workerId)
              .order("sort_order"),
            supabase
              .from("chat_messages")
              .select("*")
              .eq("worker_id", workerId)
              .eq("hirer_id", currentProfile.id)
              .order("created_at"),
            supabase
              .from("bookings")
              .select("status")
              .eq("worker_id", workerId)
              .eq("hirer_id", currentProfile.id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

        const workerProfileRecord =
          (workerProfile as WorkerProfileRecord | null) ?? null;

        if (!active) {
          return;
        }

        setState({
          loading: false,
          error: "",
          workerId,
          workerName:
            workerProfileRecord?.display_name || "Worker",
          activeHirerId: currentProfile.id,
          activeBookingStatus: booking?.status ?? null,
          canChat: true,
          clearingChat: false,
          chatHint:
            canClearCompletedChat(booking?.status ?? null)
              ? "This job is completed. You can clear the chat thread when you no longer need it."
              : "Chat is available for workers you already booked.",
          availability: mapAvailability(
            (availability as WorkerAvailabilityRecord[] | null) ?? [],
          ),
          schedule: [],
          messages: mapMessages((messages as ChatMessageRecord[] | null) ?? []),
          workerProfile: workerProfileRecord,
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          ...emptyBoard,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load live marketplace data.",
        });
      }
    }

    void loadBoard();

    return () => {
      active = false;
    };
  }, [authLoading, configured, profile, refreshKey, session]);

  const summary = useMemo(() => {
    if (!session?.user || !profile) {
      return {
        status: "Available now",
        note: "Sign in to load your live worker data.",
        tone: "neutral" as const,
      };
    }

    if (profile?.role === "employer") {
      return {
        status: state.workerProfile?.availability_status || "Available now",
        note: state.workerProfile?.availability_note || "Ready for new work",
        tone: toneFromStatus(state.workerProfile?.availability_status || "Available now"),
      };
    }

    return {
      status: state.workerProfile?.availability_status || "Available now",
      note: state.workerProfile?.availability_note || "Ready for new work",
      tone: toneFromStatus(state.workerProfile?.availability_status || "Available now"),
    };
  }, [profile, session?.user, state.workerProfile]);

  async function updateAvailability(day: string, hours: string) {
    if (!profile || profile.role !== "employer" || !state.workerId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const existing = state.availability.find((row) => row.day === day);

    await supabase.from("worker_availability").upsert(
      {
        id: existing?.id,
        worker_id: state.workerId,
        day_label: day,
        hours,
        sort_order:
          defaultAvailabilityRows.find((row) => row.day === day)?.sortOrder || 0,
      },
      { onConflict: "worker_id,day_label" },
    );

    setRefreshKey((current) => current + 1);
  }

  async function updateSlot(
    id: string,
    patch: Partial<Pick<LiveScheduleSlot, "time" | "title" | "customer" | "state">>,
  ) {
    if (!profile || profile.role !== "employer" || !state.workerId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const nextSchedule = state.schedule.map((slot) =>
      slot.id === id
        ? {
            ...slot,
            time: patch.time ?? slot.time,
            title: patch.title ?? slot.title,
            customer: patch.customer ?? slot.customer,
            state: patch.state ?? slot.state,
          }
        : slot,
    );

    await supabase
      .from("worker_schedule_slots")
      .update({
        time_label: patch.time,
        title: patch.title,
        customer_name: patch.customer,
        state: patch.state,
      })
      .eq("id", id)
      .eq("worker_id", state.workerId);

    await writeWorkerSummary(state.workerId, nextSchedule);
    setRefreshKey((current) => current + 1);
  }

  async function addSlot() {
    if (!profile || profile.role !== "employer" || !state.workerId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const nextSlot: LiveScheduleSlot = {
      id: `temp-${Date.now()}`,
      time: "06:30 PM",
      title: "",
      customer: "",
      state: "Available",
    };

    await supabase.from("worker_schedule_slots").insert({
      worker_id: state.workerId,
      hirer_id: null,
      time_label: nextSlot.time,
      title: nextSlot.title,
      customer_name: nextSlot.customer,
      state: nextSlot.state,
    });

    await writeWorkerSummary(state.workerId, [...state.schedule, nextSlot]);
    setRefreshKey((current) => current + 1);
  }

  async function removeSlot(id: string) {
    if (!profile || profile.role !== "employer" || !state.workerId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const previousSchedule = state.schedule;
    const nextSchedule = previousSchedule.filter((slot) => slot.id !== id);
    const nextSummary = buildSummaryFromSchedule(nextSchedule);

    setState((current) => ({
      ...current,
      error: "",
      schedule: nextSchedule,
      workerProfile: current.workerProfile
        ? {
            ...current.workerProfile,
            availability_status: nextSummary.status,
            availability_note: nextSummary.note,
          }
        : current.workerProfile,
    }));

    try {
      const { error } = await supabase
        .from("worker_schedule_slots")
        .delete()
        .eq("id", id)
        .eq("worker_id", state.workerId);

      if (error) {
        throw error;
      }

      await writeWorkerSummary(state.workerId, nextSchedule);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to remove this time slot.";

      setState((current) => ({
        ...current,
        error: message,
        schedule: previousSchedule,
        workerProfile: current.workerProfile
          ? {
              ...current.workerProfile,
              availability_status: buildSummaryFromSchedule(previousSchedule).status,
              availability_note: buildSummaryFromSchedule(previousSchedule).note,
            }
          : current.workerProfile,
      }));
    }
  }

  async function sendMessage(sender: "hirer" | "employer", text: string) {
    const trimmed = text.trim();
    if (!trimmed || !session?.user || !profile || !state.workerId) {
      return;
    }

    if (!state.canChat) {
      return;
    }

    const hirerId =
      sender === "hirer" ? profile.id : state.activeHirerId;

    if (!hirerId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    await supabase.from("chat_messages").insert({
      worker_id: state.workerId,
      hirer_id: hirerId,
      sender_id: profile.id,
      sender_role: sender,
      author_name:
        sender === "employer"
          ? state.workerName
          : profile.full_name,
      body: trimmed,
    });

    setRefreshKey((current) => current + 1);
  }

  async function clearChat() {
    if (!session?.user || !profile || !state.workerId || !state.activeHirerId) {
      return;
    }

    if (!canClearCompletedChat(state.activeBookingStatus)) {
      return;
    }

    const previousMessages = state.messages;
    const supabase = getSupabaseBrowserClient();

    setState((current) => ({
      ...current,
      error: "",
      clearingChat: true,
      messages: [],
    }));

    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("worker_id", state.workerId)
        .eq("hirer_id", state.activeHirerId);

      if (error) {
        throw error;
      }

      setState((current) => ({
        ...current,
        clearingChat: false,
      }));
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setState((current) => ({
        ...current,
        clearingChat: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to clear this completed chat.",
        messages: previousMessages,
      }));
    }
  }

  async function updatePresence(status: string) {
    if (!profile || profile.role !== "employer" || !state.workerId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    await supabase
      .from("worker_profiles")
      .update({
        availability_status: status,
        availability_note: noteForPresence(status),
      })
      .eq("worker_id", state.workerId);

    setRefreshKey((current) => current + 1);
  }

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return {
    loading: session?.user && profile ? state.loading : false,
    error: session?.user && profile ? state.error : configured ? "" : "Supabase is not configured.",
    board: {
      workerName: session?.user && profile ? state.workerName : "Worker",
      availability: session?.user && profile ? state.availability : [],
      schedule: session?.user && profile ? state.schedule : [],
      messages: session?.user && profile ? state.messages : [],
      bookingStatus: session?.user && profile ? state.activeBookingStatus : null,
    },
    canChat: session?.user && profile ? state.canChat : false,
    canClearChat:
      session?.user && profile
        ? canClearCompletedChat(state.activeBookingStatus) && state.messages.length > 0
        : false,
    clearingChat: session?.user && profile ? state.clearingChat : false,
    chatHint:
      session?.user && profile
        ? state.chatHint
        : configured
          ? "Sign in and book a worker to start chatting."
          : "Supabase is not configured.",
    summary,
    updateAvailability,
    updateSlot,
    addSlot,
    removeSlot,
    updatePresence,
    sendMessage,
    clearChat,
    refresh,
  };
}
