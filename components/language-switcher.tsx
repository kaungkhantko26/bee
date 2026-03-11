"use client";

import { cn } from "@/components/ui";
import { useLanguage } from "@/components/language-provider";

export function LanguageSwitcher() {
  const { language, setLanguage, copy } = useLanguage();

  return (
    <div className="inline-flex w-full rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,216,0.9))] p-1 shadow-[0_14px_28px_rgba(94,74,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] sm:w-auto">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={cn(
          "rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4",
          language === "en"
            ? "bg-[linear-gradient(180deg,rgba(55,42,10,0.98),rgba(35,26,4,1))] text-white shadow-[0_10px_18px_rgba(24,18,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "text-[var(--muted)]",
        )}
      >
        {copy.common.english}
      </button>
      <button
        type="button"
        onClick={() => setLanguage("my")}
        className={cn(
          "rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4",
          language === "my"
            ? "bg-[linear-gradient(180deg,rgba(55,42,10,0.98),rgba(35,26,4,1))] text-white shadow-[0_10px_18px_rgba(24,18,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "text-[var(--muted)]",
        )}
      >
        {copy.common.burmese}
      </button>
    </div>
  );
}
