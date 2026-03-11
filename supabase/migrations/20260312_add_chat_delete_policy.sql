drop policy if exists "Participants can delete completed chat messages" on public.chat_messages;
create policy "Participants can delete completed chat messages"
on public.chat_messages
for delete
to authenticated
using (
  (auth.uid() = hirer_id or auth.uid() = worker_id)
  and exists (
    select 1
    from public.bookings
    where bookings.hirer_id = chat_messages.hirer_id
      and bookings.worker_id = chat_messages.worker_id
      and bookings.status in ('Job completed', 'Payment processed', 'Review left')
  )
);
