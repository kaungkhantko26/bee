"use client";

import { useEffect, useState } from "react";
import { Panel, StatusPill } from "@/components/ui";
import { useLiveWorkerBoard } from "@/components/use-live-worker-board";

export function LiveChatPanel({
  mode,
  title,
  subtitle,
  showHistory = true,
}: {
  mode: "hirer" | "employer";
  title: string;
  subtitle: string;
  showHistory?: boolean;
}) {
  const {
    board,
    canChat,
    canClearChat,
    clearingChat,
    chatHint,
    error,
    sendMessage,
    clearChat,
    refresh,
  } = useLiveWorkerBoard();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const interval = window.setInterval(() => {
      refresh();
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refresh]);

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
            {title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
          {board.bookingStatus ? (
            <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
              Booking status: {board.bookingStatus}
            </p>
          ) : null}
          {!canChat ? (
            <p className="mt-2 text-sm font-medium text-[var(--muted)]">{chatHint}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill tone={canChat ? "success" : "neutral"}>
            {canChat ? "Live chat" : "Locked"}
          </StatusPill>
          {canClearChat ? (
            <button
              type="button"
              onClick={() => {
                void clearChat();
              }}
              disabled={clearingChat}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {clearingChat ? "Deleting chat..." : "Delete completed chat"}
            </button>
          ) : null}
        </div>
      </div>

      {showHistory ? (
        <div className="mt-6 space-y-3">
          {error ? <p className="text-sm text-[var(--muted)]">{error}</p> : null}
          {board.messages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No messages yet. Start the conversation here.
            </p>
          ) : null}
          {board.messages.map((message) => {
            const own = message.sender === mode;

            return (
              <div
                key={message.id}
                className={`flex ${own ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    own
                      ? "rounded-br-sm bg-[var(--foreground)] text-white"
                      : "rounded-bl-sm bg-[var(--panel)] text-[var(--foreground)]"
                  }`}
                >
                  <p className={`text-xs font-semibold ${own ? "text-white/88" : "text-[var(--muted)]"}`}>
                    {message.author} · {message.time}
                  </p>
                  <p className="mt-1">{message.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-[1.25rem] border border-black/10 bg-[var(--panel)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
          {error || chatHint}
        </div>
      )}

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canChat) {
            return;
          }
          sendMessage(mode, draft);
          setDraft("");
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!canChat}
          placeholder={
            canChat
              ? mode === "employer"
                ? "Reply to the customer..."
                : "Message the worker..."
              : "Chat unlocks after booking"
          }
          className="min-h-12 flex-1 rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/12 disabled:cursor-not-allowed disabled:bg-[var(--panel)] disabled:text-[var(--muted)]"
        />
        <button
          type="submit"
          disabled={!canChat}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </Panel>
  );
}
