"use client";

import { Panel, SectionHeading, StatusPill } from "@/components/ui";
import {
  useLiveWorkerBoard,
  type LiveScheduleState,
} from "@/components/use-live-worker-board";

const states: LiveScheduleState[] = [
  "On job",
  "Confirmed",
  "Available",
  "Unavailable",
];

const stateHelp: Record<LiveScheduleState, string> = {
  "On job": "You are busy right now.",
  Confirmed: "Booked later today.",
  Available: "Customers can still book this time.",
  Unavailable: "Hide this time from booking.",
};

function parseMeridiemTime(value: string) {
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);

  if (!match) {
    return "";
  }

  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "00");

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    return "";
  }

  let twentyFourHour = hour % 12;

  if (match[3] === "PM") {
    twentyFourHour += 12;
  }

  return `${String(twentyFourHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatInputTime(value: string) {
  const [hoursValue, minutesValue] = value.split(":");
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return "";
  }

  const meridiem = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

function parseTimeRange(value: string) {
  const [start = "", end = ""] = value.split(" - ").map((part) => part.trim());

  return {
    start: parseMeridiemTime(start),
    end: parseMeridiemTime(end),
  };
}

function buildTimeRange(start: string, end: string, fallback: string) {
  const formattedStart = formatInputTime(start);

  if (!formattedStart) {
    return fallback;
  }

  const formattedEnd = formatInputTime(end);
  return formattedEnd ? `${formattedStart} - ${formattedEnd}` : formattedStart;
}

export function WorkerScheduleBoard() {
  const {
    board,
    error,
    loading,
    summary,
    updateAvailability,
    updateSlot,
    addSlot,
    removeSlot,
  } =
    useLiveWorkerBoard();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
      <Panel>
        <SectionHeading
          eyebrow="Availability"
          title="Set your working hours."
          description="Write the hours you want customers to see for each day."
        />
        {error ? <p className="mt-6 text-sm text-[var(--muted)]">{error}</p> : null}
        {loading ? (
          <p className="mt-6 text-sm text-[var(--muted)]">Loading availability...</p>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {board.availability.map((row) => (
            <label
              key={row.day}
              className="grid gap-2 rounded-[1.25rem] border border-black/10 bg-[var(--panel)] p-4"
            >
              <span className="text-sm font-semibold text-[var(--foreground)]">{row.day}</span>
              <input
                value={row.hours}
                onChange={(event) => updateAvailability(row.day, event.target.value)}
                placeholder="9 AM - 5 PM"
                className="rounded-[1rem] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              />
            </label>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeading
            eyebrow="Today"
            title="Add today's jobs and free times."
            description="Keep each time slot simple so customers can see when you are busy and when you are free."
          />
          <div className="flex flex-col items-start gap-3">
            <StatusPill tone={summary.tone}>{summary.status}</StatusPill>
            <button
              type="button"
              onClick={addSlot}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
            >
              Add new time
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{summary.note}</p>
        {!loading && board.schedule.length === 0 ? (
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            No time slots yet. Add one so customers can book you.
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          {board.schedule.map((slot) => (
            <div
              key={slot.id}
              className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] p-5"
            >
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                      Start time
                    </span>
                    <input
                      type="time"
                      value={parseTimeRange(slot.time).start}
                      onChange={(event) =>
                        updateSlot(slot.id, {
                          time: buildTimeRange(
                            event.target.value,
                            parseTimeRange(slot.time).end,
                            slot.time,
                          ),
                        })
                      }
                      aria-label="Start time"
                      className="rounded-[1rem] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                      End time
                    </span>
                    <input
                      type="time"
                      value={parseTimeRange(slot.time).end}
                      onChange={(event) =>
                        updateSlot(slot.id, {
                          time: buildTimeRange(
                            parseTimeRange(slot.time).start,
                            event.target.value,
                            slot.time,
                          ),
                        })
                      }
                      aria-label="End time"
                      className="rounded-[1rem] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    />
                  </label>
                </div>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                    Status
                  </span>
                  <select
                    value={slot.state}
                    onChange={(event) =>
                      updateSlot(slot.id, {
                        state: event.target.value as LiveScheduleState,
                      })
                    }
                    className="rounded-[1rem] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  >
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                    Job title
                  </span>
                  <input
                    value={slot.title}
                    onChange={(event) =>
                      updateSlot(slot.id, { title: event.target.value })
                    }
                    placeholder="Pipe repair, light fixing, cleaning..."
                    className="rounded-[1rem] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                    Customer name
                  </span>
                  <input
                    value={slot.customer}
                    onChange={(event) =>
                      updateSlot(slot.id, { customer: event.target.value })
                    }
                    placeholder="Customer name"
                    className="rounded-[1rem] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  />
                </label>
                <p className="text-sm text-[var(--muted)]">{stateHelp[slot.state]}</p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      void removeSlot(slot.id);
                    }}
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
