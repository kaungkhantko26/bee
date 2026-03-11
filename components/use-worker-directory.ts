"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured, type WorkerProfileRecord } from "@/lib/supabase";

type WorkerDirectoryState = {
  loading: boolean;
  workers: WorkerProfileRecord[];
  error: string;
};

export function useWorkerDirectory() {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<WorkerDirectoryState>({
    loading: configured,
    workers: [],
    error: configured ? "" : "Supabase is not configured.",
  });

  useEffect(() => {
    if (!configured) {
      return;
    }

    let active = true;
    const supabase = getSupabaseBrowserClient();

    async function loadWorkers() {
      const { data, error } = await supabase
        .from("worker_profiles")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!active) {
        return;
      }

      if (error) {
        setState({
          loading: false,
          workers: [],
          error: error.message,
        });
        return;
      }

      setState({
        loading: false,
        workers: (data as WorkerProfileRecord[] | null) ?? [],
        error: "",
      });
    }

    void loadWorkers();

    return () => {
      active = false;
    };
  }, [configured]);

  return state;
}
