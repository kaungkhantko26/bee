"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Panel } from "@/components/ui";
import { useAuthProfile } from "@/components/auth/use-auth-profile";
import { getDefaultRouteForRole } from "@/lib/role-routes";
import type { ProfileRole } from "@/lib/supabase";

export function RoleGate({
  allow,
  children,
}: {
  allow: ProfileRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, configured, session, profile } = useAuthProfile();

  useEffect(() => {
    if (!configured || loading) {
      return;
    }

    if (!session) {
      router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!profile) {
      router.replace("/auth");
      return;
    }

    if (profile.role !== allow) {
      router.replace(getDefaultRouteForRole(profile.role));
    }
  }, [allow, configured, loading, pathname, profile, router, session]);

  if (!configured) {
    return <>{children}</>;
  }

  if (loading || !session || !profile || profile.role !== allow) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <Panel>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Loading workspace
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Checking your account role and routing you to the correct side of BEE.
          </p>
        </Panel>
      </div>
    );
  }

  return <>{children}</>;
}
