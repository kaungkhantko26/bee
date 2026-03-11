"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type ProfileRecord,
} from "@/lib/supabase";

type AuthProfileState = {
  loading: boolean;
  configured: boolean;
  session: Session | null;
  profile: ProfileRecord | null;
};

export function useAuthProfile() {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<AuthProfileState>({
    loading: configured,
    configured,
    session: null,
    profile: null,
  });

  useEffect(() => {
    if (!configured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    let active = true;

    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      return (data as ProfileRecord | null) ?? null;
    }

    async function syncSession(nextSession: Session | null) {
      if (!active) {
        return;
      }

      if (!nextSession?.user) {
        setState({
          loading: false,
          configured: true,
          session: null,
          profile: null,
        });
        return;
      }

      const profile = await loadProfile(nextSession.user.id);

      if (!active) {
        return;
      }

      setState({
        loading: false,
        configured: true,
        session: nextSession,
        profile,
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      void syncSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  return state;
}
