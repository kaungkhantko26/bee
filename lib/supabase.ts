import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ProfileRole = "hirer" | "employer";

export type ProfileRecord = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: ProfileRole;
  profession: string | null;
  years_experience: number | null;
  experience_summary: string | null;
  created_at?: string;
  updated_at?: string;
};

export type WorkerProfileRecord = {
  worker_id: string;
  display_name: string;
  profession: string;
  area: string;
  hourly_rate: number;
  eta_minutes: number;
  rating: number;
  completed_jobs: number;
  availability_status: string;
  availability_note: string;
  bio: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
};

export type WorkerAvailabilityRecord = {
  id: string;
  worker_id: string;
  day_label: string;
  hours: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type WorkerScheduleState = "On job" | "Confirmed" | "Available" | "Unavailable";

export type WorkerScheduleSlotRecord = {
  id: string;
  worker_id: string;
  hirer_id: string | null;
  time_label: string;
  title: string;
  customer_name: string;
  state: WorkerScheduleState;
  created_at?: string;
  updated_at?: string;
};

export type BookingRecord = {
  id: string;
  hirer_id: string;
  worker_id: string;
  service: string;
  scheduled_for: string;
  status: string;
  address: string;
  price: string;
  payment_status: string;
  worker_total_fee: string | null;
  worker_fee_submitted_at: string | null;
  hirer_close_confirmed: boolean;
  worker_close_confirmed: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ChatMessageRecord = {
  id: string;
  worker_id: string;
  hirer_id: string;
  sender_id: string;
  sender_role: ProfileRole;
  author_name: string;
  body: string;
  created_at?: string;
};

type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRecord;
        Insert: Omit<ProfileRecord, "created_at" | "updated_at">;
        Update: Partial<ProfileRecord>;
        Relationships: [];
      };
      worker_profiles: {
        Row: WorkerProfileRecord;
        Insert: Omit<WorkerProfileRecord, "created_at" | "updated_at">;
        Update: Partial<WorkerProfileRecord>;
        Relationships: [];
      };
      worker_availability: {
        Row: WorkerAvailabilityRecord;
        Insert: Omit<WorkerAvailabilityRecord, "created_at" | "updated_at" | "id"> & {
          id?: string;
        };
        Update: Partial<WorkerAvailabilityRecord>;
        Relationships: [];
      };
      worker_schedule_slots: {
        Row: WorkerScheduleSlotRecord;
        Insert: Omit<WorkerScheduleSlotRecord, "created_at" | "updated_at" | "id"> & {
          id?: string;
        };
        Update: Partial<WorkerScheduleSlotRecord>;
        Relationships: [];
      };
      bookings: {
        Row: BookingRecord;
        Insert: Omit<
          BookingRecord,
          | "id"
          | "created_at"
          | "updated_at"
          | "worker_total_fee"
          | "worker_fee_submitted_at"
          | "hirer_close_confirmed"
          | "worker_close_confirmed"
        > & {
          id?: string;
          worker_total_fee?: string | null;
          worker_fee_submitted_at?: string | null;
          hirer_close_confirmed?: boolean;
          worker_close_confirmed?: boolean;
        };
        Update: Partial<BookingRecord>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessageRecord;
        Insert: Omit<ChatMessageRecord, "id" | "created_at"> & { id?: string };
        Update: Partial<ChatMessageRecord>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      close_completed_booking: {
        Args: {
          target_booking_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let browserClient: SupabaseClient<Database> | null = null;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (!browserClient) {
    browserClient = createClient<Database>(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }

  return browserClient;
}
