"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { Panel, StatusPill, cn } from "@/components/ui";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { useLanguage } from "@/components/language-provider";
import { getDefaultRouteForRole } from "@/lib/role-routes";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type ProfileRecord,
  type ProfileRole,
} from "@/lib/supabase";

type Mode = "signin" | "signup";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  role: ProfileRole;
  profession: string;
  yearsExperience: string;
  experienceSummary: string;
};

const defaultForm: FormState = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  role: "hirer",
  profession: "",
  yearsExperience: "",
  experienceSummary: "",
};

function buildProfileRecord(userId: string, form: FormState): ProfileRecord {
  return {
    id: userId,
    email: form.email.trim(),
    full_name: form.fullName.trim(),
    phone: form.phone.trim() || null,
    role: form.role,
    profession: form.role === "employer" ? form.profession.trim() || null : null,
    years_experience:
      form.role === "employer" && form.yearsExperience
        ? Number(form.yearsExperience)
        : null,
    experience_summary:
      form.role === "employer" ? form.experienceSummary.trim() || null : null,
  };
}

export function AuthForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const { copy } = useLanguage();
  const [mode, setMode] = useState<Mode>("signup");
  const [form, setForm] = useState<FormState>(defaultForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const configured = isSupabaseConfigured();
  const { loading: authLoading, profile } = useAuthProfile();

  useEffect(() => {
    if (authLoading || !profile) {
      return;
    }

    const allowedNext =
      profile.role === "employer"
        ? nextPath === "/worker" || nextPath === "/admin"
        : nextPath === "/discover" ||
          nextPath === "/bookings" ||
          nextPath === "/request" ||
          nextPath === "/support";

    router.replace(
      allowedNext && nextPath ? nextPath : getDefaultRouteForRole(profile.role),
    );
  }, [authLoading, nextPath, profile, router]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveProfile(userId: string) {
    const supabase = getSupabaseBrowserClient();
    const payload = buildProfileRecord(userId, form);
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (profileError) {
      throw profileError;
    }
  }

  async function findProfile(userId: string): Promise<ProfileRecord | null> {
    const supabase = getSupabaseBrowserClient();
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    return (data as ProfileRecord | null) ?? null;
  }

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      setError(
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before using auth.",
      );
      setMessage("");
      return;
    }

    if (mode === "signup" && !form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (mode === "signup" && form.role === "employer" && !form.profession.trim()) {
      setError("Employer accounts need a profession.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const supabase = getSupabaseBrowserClient();

        if (mode === "signup") {
          const { data, error: authError } = await supabase.auth.signUp({
            email: form.email.trim(),
            password: form.password,
            options: {
              data: {
                full_name: form.fullName.trim(),
                phone: form.phone.trim(),
                role: form.role,
                profession: form.profession.trim(),
                years_experience: form.yearsExperience.trim(),
                experience_summary: form.experienceSummary.trim(),
              },
            },
          });

          if (authError) {
            throw authError;
          }

          if (data.user && data.session) {
            await saveProfile(data.user.id);
            setMessage("Account created. Redirecting you into BEE now.");
            router.push(form.role === "employer" ? "/worker" : "/discover");
            return;
          }

          setMessage(
            "Account created. Check your email for the confirmation link, then sign in to finish.",
          );
          setMode("signin");
          return;
        }

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (authError) {
          throw authError;
        }

        const profile = await findProfile(data.user.id);

        if (!profile) {
          setPendingUserId(data.user.id);
          setForm((current) => ({
            ...current,
            fullName:
              current.fullName ||
              String(data.user.user_metadata.full_name ?? ""),
            phone:
              current.phone || String(data.user.user_metadata.phone ?? ""),
            role:
              current.role ||
              (data.user.user_metadata.role as ProfileRole | undefined) ||
              "hirer",
            profession:
              current.profession ||
              String(data.user.user_metadata.profession ?? ""),
            yearsExperience:
              current.yearsExperience ||
              String(data.user.user_metadata.years_experience ?? ""),
            experienceSummary:
              current.experienceSummary ||
              String(data.user.user_metadata.experience_summary ?? ""),
          }));
          setMessage(
            "You are signed in. Finish your role details below so BEE can route you correctly.",
          );
          return;
        }

        setMessage("Signed in successfully. Redirecting to your workspace.");
        router.push(profile.role === "employer" ? "/worker" : "/discover");
      } catch (caughtError) {
        const nextError =
          caughtError instanceof Error ? caughtError.message : "Something went wrong.";
        setError(nextError);
      } finally {
        setBusy(false);
      }
    });
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pendingUserId) {
      return;
    }

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (form.role === "employer" && !form.profession.trim()) {
      setError("Employer accounts need a profession.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        await saveProfile(pendingUserId);
        setPendingUserId(null);
        setMessage("Profile saved. Redirecting to your workspace.");
        router.push(form.role === "employer" ? "/worker" : "/discover");
      } catch (caughtError) {
        const nextError =
          caughtError instanceof Error ? caughtError.message : "Something went wrong.";
        setError(nextError);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <StatusPill tone="dark">Secure access</StatusPill>
        <h2 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
          {pendingUserId
            ? copy.auth.finishProfile
            : mode === "signup"
              ? copy.auth.createAccount
              : copy.auth.welcomeBack}
        </h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          {pendingUserId
            ? copy.auth.finishProfileBody
            : mode === "signup"
              ? copy.auth.signupBody
              : copy.auth.signinBody}
        </p>
      </div>

      {!pendingUserId ? (
        <div className="inline-flex w-fit rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,216,0.94))] p-1 shadow-[0_14px_28px_rgba(94,74,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]">
          {(["signup", "signin"] as const).map((item) => {
            const active = item === mode;
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setError("");
                  setMessage("");
                }}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-[var(--foreground)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--accent-soft)]",
                )}
              >
                {item === "signup" ? copy.auth.signup : copy.auth.signin}
              </button>
            );
          })}
        </div>
      ) : null}

      {!configured ? (
        <Panel className="bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(253,230,138,0.94))]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-900">
            Supabase setup required
          </p>
          <p className="mt-3 text-sm leading-7 text-amber-900/80">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
            to your environment, then run the SQL migration in
            `supabase/migrations`.
          </p>
        </Panel>
      ) : null}

      {error ? (
        <Panel className="bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(254,205,211,0.94))]">
          <p className="text-sm font-semibold text-rose-900">{error}</p>
        </Panel>
      ) : null}

      {message ? (
        <Panel className="bg-[linear-gradient(180deg,rgba(240,253,244,0.98),rgba(187,247,208,0.94))]">
          <p className="text-sm font-semibold text-emerald-900">{message}</p>
        </Panel>
      ) : null}

      <form
        onSubmit={pendingUserId ? handleProfileSubmit : handleAuthSubmit}
        className="space-y-5"
      >
        <Panel>
          <div className="grid gap-5">
            {mode === "signup" || pendingUserId ? (
              <>
                <Field label={copy.auth.fullName}>
                  <Input
                    value={form.fullName}
                    onChange={(value) => updateField("fullName", value)}
                    placeholder="Avery Mills"
                  />
                </Field>
                <Field label={copy.auth.phone}>
                  <Input
                    value={form.phone}
                    onChange={(value) => updateField("phone", value)}
                    placeholder="+1 555 0123"
                  />
                </Field>
              </>
            ) : null}

            {!pendingUserId ? (
              <>
                <Field label={copy.auth.email}>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(value) => updateField("email", value)}
                    placeholder="you@example.com"
                  />
                </Field>
                <Field label={copy.auth.password}>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(value) => updateField("password", value)}
                    placeholder="Enter a secure password"
                  />
                </Field>
              </>
            ) : null}

            {mode === "signup" || pendingUserId ? (
              <>
                <Field label={copy.auth.accountType}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <RoleCard
                      title={copy.auth.hirer}
                      body={copy.auth.hirerBody}
                      active={form.role === "hirer"}
                      onClick={() => updateField("role", "hirer")}
                    />
                    <RoleCard
                      title={copy.auth.employer}
                      body={copy.auth.employerBody}
                      active={form.role === "employer"}
                      onClick={() => updateField("role", "employer")}
                    />
                  </div>
                </Field>

                {form.role === "employer" ? (
                  <div className="grid gap-5 rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,251,214,0.96),rgba(255,240,160,0.78))] p-5 shadow-[0_18px_38px_rgba(244,196,3,0.12),inset_0_1px_0_rgba(255,255,255,0.88)]">
                    <Field label={copy.auth.profession}>
                      <Input
                        value={form.profession}
                        onChange={(value) => updateField("profession", value)}
                        placeholder="Plumber, electrician, cleaner..."
                      />
                    </Field>
                    <Field label={copy.auth.yearsExperience}>
                      <Input
                        type="number"
                        value={form.yearsExperience}
                        onChange={(value) => updateField("yearsExperience", value)}
                        placeholder="5"
                      />
                    </Field>
                    <Field label={copy.auth.workSummary}>
                      <Textarea
                        value={form.experienceSummary}
                        onChange={(value) =>
                          updateField("experienceSummary", value)
                        }
                        placeholder="Describe your services, certifications, and the kind of jobs you handle."
                      />
                    </Field>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </Panel>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(24,18,0,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy
                ? "Working..."
                : pendingUserId
                ? copy.auth.saveProfile
                : mode === "signup"
                  ? copy.auth.create
                  : copy.auth.signin}
          </button>
          {!pendingUserId ? (
            <p className="text-sm text-[var(--muted)]">
              {mode === "signup" ? copy.auth.alreadyHave : copy.auth.needAccount}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "signin" : "signup");
                  setError("");
                  setMessage("");
                }}
                className="font-semibold text-[var(--foreground)]"
              >
                {mode === "signup" ? copy.auth.signInHere : copy.auth.createOneHere}
              </button>
            </p>
          ) : (
            <Link href="/" className="text-sm font-semibold text-[var(--foreground)]">
              {copy.auth.returnHome}
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
      {children}
    </label>
  );
}

function Input({
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-12 rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/12"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={4}
      className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/12"
    />
  );
}

function RoleCard({
  title,
  body,
  active,
  onClick,
}: {
  title: string;
  body: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[1.4rem] p-4 text-left shadow-[0_16px_32px_rgba(94,74,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] transition",
        active
          ? "bg-[linear-gradient(180deg,rgba(255,251,214,0.98),rgba(255,236,122,0.92))]"
          : "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,216,0.92))]",
      )}
    >
      <p className="font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p>
    </button>
  );
}
