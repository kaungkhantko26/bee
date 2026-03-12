"use client";

import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? undefined;

  return (
    <AuthShell>
      <AuthForm nextPath={nextPath} />
    </AuthShell>
  );
}
