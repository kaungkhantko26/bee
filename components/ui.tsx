import type { ReactNode } from "react";

export function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(255,250,234,0.96))] p-4 shadow-[0_26px_60px_rgba(94,74,0,0.12),0_10px_24px_rgba(94,74,0,0.08),inset_0_1px_0_rgba(255,255,255,0.96),inset_0_-2px_0_rgba(139,97,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/86 sm:rounded-[1.75rem] sm:p-6 lg:rounded-[2rem] lg:p-7",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  invert = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  invert?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          "text-sm font-semibold uppercase tracking-[0.24em]",
          invert ? "text-white/84" : "text-[var(--accent-strong)]",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] sm:text-3xl lg:text-4xl",
          invert ? "text-white" : "text-[var(--foreground)]",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-3 max-w-2xl text-sm leading-7",
            invert ? "text-white/92" : "text-[var(--muted)]",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function MetricCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.25rem] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(255,250,234,0.96))] p-4 shadow-[0_18px_38px_rgba(94,74,0,0.12),0_6px_14px_rgba(94,74,0,0.08),inset_0_1px_0_rgba(255,255,255,0.96),inset_0_-2px_0_rgba(139,97,0,0.08)] sm:rounded-[1.5rem] sm:p-5">
      <div className="h-1.5 w-16 rounded-full bg-[var(--accent)]/70" />
      <p className="mt-4 break-words text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{label}</p>
    </div>
  );
}

const toneClasses = {
  neutral: "bg-[linear-gradient(180deg,rgba(255,253,238,0.98),rgba(255,242,184,0.96))] text-[var(--foreground)] shadow-[0_10px_20px_rgba(94,74,0,0.1),inset_0_1px_0_rgba(255,255,255,0.92)]",
  success: "bg-[linear-gradient(180deg,rgba(240,253,244,0.98),rgba(187,247,208,0.95))] text-emerald-900 shadow-[0_10px_20px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]",
  warning: "bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(253,230,138,0.95))] text-amber-950 shadow-[0_10px_20px_rgba(245,158,11,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]",
  dark: "bg-[linear-gradient(180deg,rgba(55,42,10,0.98),rgba(35,26,4,1))] text-white shadow-[0_14px_26px_rgba(24,18,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]",
};

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full rounded-full px-3 py-1 text-center text-xs font-semibold tracking-[0.01em] whitespace-normal break-words",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
