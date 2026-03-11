alter table public.bookings
add column if not exists hirer_close_confirmed boolean not null default false,
add column if not exists worker_close_confirmed boolean not null default false;

drop policy if exists "Participants can delete fully confirmed bookings" on public.bookings;
create policy "Participants can delete fully confirmed bookings"
on public.bookings
for delete
to authenticated
using (
  (auth.uid() = hirer_id or auth.uid() = worker_id)
  and payment_status = 'Paid'
  and hirer_close_confirmed
  and worker_close_confirmed
);

create or replace function public.close_completed_booking(target_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_booking public.bookings;
begin
  select *
  into target_booking
  from public.bookings
  where id = target_booking_id;

  if not found then
    raise exception 'Booking not found';
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if auth.uid() <> target_booking.hirer_id and auth.uid() <> target_booking.worker_id then
    raise exception 'You cannot close this booking';
  end if;

  if target_booking.payment_status <> 'Paid' then
    raise exception 'Only paid bookings can be fully closed';
  end if;

  if not target_booking.hirer_close_confirmed or not target_booking.worker_close_confirmed then
    raise exception 'Both sides must confirm before the booking can be closed';
  end if;

  delete from public.chat_messages
  where worker_id = target_booking.worker_id
    and hirer_id = target_booking.hirer_id;
end;
$$;

grant execute on function public.close_completed_booking(uuid) to authenticated;
