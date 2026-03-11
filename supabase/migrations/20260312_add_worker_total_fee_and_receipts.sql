alter table public.bookings
add column if not exists worker_total_fee text,
add column if not exists worker_fee_submitted_at timestamptz;
