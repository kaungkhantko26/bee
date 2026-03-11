create extension if not exists "pgcrypto";

create table if not exists public.worker_profiles (
  worker_id uuid primary key references public.profiles (id) on delete cascade,
  display_name text not null,
  profession text not null,
  area text not null default 'Service area not set',
  hourly_rate numeric(10,2) not null default 30,
  eta_minutes integer not null default 20,
  rating numeric(3,2) not null default 5.0,
  completed_jobs integer not null default 0,
  availability_status text not null default 'Available now',
  availability_note text not null default 'Ready for new work',
  bio text not null default 'Professional ready for home service bookings.',
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.worker_availability (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles (id) on delete cascade,
  day_label text not null,
  hours text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (worker_id, day_label)
);

create table if not exists public.worker_schedule_slots (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles (id) on delete cascade,
  hirer_id uuid references public.profiles (id) on delete set null,
  time_label text not null,
  title text not null,
  customer_name text not null,
  state text not null check (state in ('On job', 'Confirmed', 'Available', 'Unavailable')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  hirer_id uuid not null references public.profiles (id) on delete cascade,
  worker_id uuid not null references public.profiles (id) on delete cascade,
  service text not null,
  scheduled_for text not null,
  status text not null,
  address text not null,
  price text not null,
  payment_status text not null default 'Pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles (id) on delete cascade,
  hirer_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_role text not null check (sender_role in ('hirer', 'employer')),
  author_name text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_marketplace_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists worker_profiles_set_updated_at on public.worker_profiles;
create trigger worker_profiles_set_updated_at
before update on public.worker_profiles
for each row
execute function public.set_marketplace_updated_at();

drop trigger if exists worker_availability_set_updated_at on public.worker_availability;
create trigger worker_availability_set_updated_at
before update on public.worker_availability
for each row
execute function public.set_marketplace_updated_at();

drop trigger if exists worker_schedule_slots_set_updated_at on public.worker_schedule_slots;
create trigger worker_schedule_slots_set_updated_at
before update on public.worker_schedule_slots
for each row
execute function public.set_marketplace_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_marketplace_updated_at();

create or replace function public.sync_worker_profile_from_profile()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'employer' then
    insert into public.worker_profiles (
      worker_id,
      display_name,
      profession,
      bio,
      tags
    )
    values (
      new.id,
      new.full_name,
      coalesce(new.profession, 'Home services'),
      coalesce(new.experience_summary, 'Professional ready for home service bookings.'),
      case
        when new.profession is null or btrim(new.profession) = '' then array['Home services']
        else array[new.profession]
      end
    )
    on conflict (worker_id) do update
    set
      display_name = excluded.display_name,
      profession = excluded.profession,
      bio = excluded.bio,
      tags = excluded.tags,
      updated_at = timezone('utc', now());

    insert into public.worker_availability (worker_id, day_label, hours, sort_order)
    select
      new.id,
      defaults.day_label,
      defaults.hours,
      defaults.sort_order
    from (
      values
        ('Mon', '9 AM - 5 PM', 1),
        ('Tue', '9 AM - 5 PM', 2),
        ('Wed', '9 AM - 5 PM', 3),
        ('Thu', '9 AM - 5 PM', 4),
        ('Fri', '9 AM - 5 PM', 5),
        ('Sat', 'Emergency only', 6)
    ) as defaults(day_label, hours, sort_order)
    where not exists (
      select 1
      from public.worker_availability availability
      where availability.worker_id = new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_sync_worker_profile on public.profiles;
create trigger profiles_sync_worker_profile
after insert or update on public.profiles
for each row
execute function public.sync_worker_profile_from_profile();

insert into public.worker_profiles (worker_id, display_name, profession, bio, tags)
select
  profiles.id,
  profiles.full_name,
  coalesce(profiles.profession, 'Home services'),
  coalesce(profiles.experience_summary, 'Professional ready for home service bookings.'),
  case
    when profiles.profession is null or btrim(profiles.profession) = '' then array['Home services']
    else array[profiles.profession]
  end
from public.profiles
where profiles.role = 'employer'
on conflict (worker_id) do nothing;

insert into public.worker_availability (worker_id, day_label, hours, sort_order)
select
  profiles.id,
  defaults.day_label,
  defaults.hours,
  defaults.sort_order
from public.profiles profiles
cross join (
  values
    ('Mon', '9 AM - 5 PM', 1),
    ('Tue', '9 AM - 5 PM', 2),
    ('Wed', '9 AM - 5 PM', 3),
    ('Thu', '9 AM - 5 PM', 4),
    ('Fri', '9 AM - 5 PM', 5),
    ('Sat', 'Emergency only', 6)
) as defaults(day_label, hours, sort_order)
where profiles.role = 'employer'
  and not exists (
    select 1
    from public.worker_availability availability
    where availability.worker_id = profiles.id
  );

alter table public.worker_profiles enable row level security;
alter table public.worker_availability enable row level security;
alter table public.worker_schedule_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Public can read worker profiles" on public.worker_profiles;
create policy "Public can read worker profiles"
on public.worker_profiles
for select
using (true);

drop policy if exists "Workers can insert own worker profile" on public.worker_profiles;
create policy "Workers can insert own worker profile"
on public.worker_profiles
for insert
to authenticated
with check (auth.uid() = worker_id);

drop policy if exists "Workers can update own worker profile" on public.worker_profiles;
create policy "Workers can update own worker profile"
on public.worker_profiles
for update
to authenticated
using (auth.uid() = worker_id)
with check (auth.uid() = worker_id);

drop policy if exists "Public can read worker availability" on public.worker_availability;
create policy "Public can read worker availability"
on public.worker_availability
for select
using (true);

drop policy if exists "Workers can insert own availability" on public.worker_availability;
create policy "Workers can insert own availability"
on public.worker_availability
for insert
to authenticated
with check (auth.uid() = worker_id);

drop policy if exists "Workers can update own availability" on public.worker_availability;
create policy "Workers can update own availability"
on public.worker_availability
for update
to authenticated
using (auth.uid() = worker_id)
with check (auth.uid() = worker_id);

drop policy if exists "Workers can delete own availability" on public.worker_availability;
create policy "Workers can delete own availability"
on public.worker_availability
for delete
to authenticated
using (auth.uid() = worker_id);

drop policy if exists "Participants can read schedule slots" on public.worker_schedule_slots;
create policy "Participants can read schedule slots"
on public.worker_schedule_slots
for select
to authenticated
using (auth.uid() = worker_id or auth.uid() = hirer_id);

drop policy if exists "Workers can insert own schedule slots" on public.worker_schedule_slots;
create policy "Workers can insert own schedule slots"
on public.worker_schedule_slots
for insert
to authenticated
with check (auth.uid() = worker_id);

drop policy if exists "Workers can update own schedule slots" on public.worker_schedule_slots;
create policy "Workers can update own schedule slots"
on public.worker_schedule_slots
for update
to authenticated
using (auth.uid() = worker_id)
with check (auth.uid() = worker_id);

drop policy if exists "Workers can delete own schedule slots" on public.worker_schedule_slots;
create policy "Workers can delete own schedule slots"
on public.worker_schedule_slots
for delete
to authenticated
using (auth.uid() = worker_id);

drop policy if exists "Participants can read bookings" on public.bookings;
create policy "Participants can read bookings"
on public.bookings
for select
to authenticated
using (auth.uid() = hirer_id or auth.uid() = worker_id);

drop policy if exists "Hirers can create bookings" on public.bookings;
create policy "Hirers can create bookings"
on public.bookings
for insert
to authenticated
with check (auth.uid() = hirer_id);

drop policy if exists "Participants can update bookings" on public.bookings;
create policy "Participants can update bookings"
on public.bookings
for update
to authenticated
using (auth.uid() = hirer_id or auth.uid() = worker_id)
with check (auth.uid() = hirer_id or auth.uid() = worker_id);

drop policy if exists "Participants can read chat messages" on public.chat_messages;
create policy "Participants can read chat messages"
on public.chat_messages
for select
to authenticated
using (auth.uid() = hirer_id or auth.uid() = worker_id);

drop policy if exists "Participants can send chat messages" on public.chat_messages;
create policy "Participants can send chat messages"
on public.chat_messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and (auth.uid() = hirer_id or auth.uid() = worker_id)
);
