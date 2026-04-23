-- Expose booked appointment slots without leaking participant identities.
-- This lets clients filter unavailable HCA times even though appointments
-- themselves are protected by RLS.

create or replace function public.get_booked_appointment_slots(
  p_date_from date,
  p_date_to date default null,
  p_hca_id uuid default null
)
returns table (
  date date,
  hca_id uuid,
  start_time time,
  id uuid
)
language sql
security definer
set search_path = public
as $$
  select
    a.date,
    a.hca_id,
    a.start_time,
    a.id
  from public.appointments a
  where a.status in ('requested', 'confirmed')
    and a.date >= p_date_from
    and a.date <= coalesce(p_date_to, p_date_from)
    and (p_hca_id is null or a.hca_id = p_hca_id);
$$;

revoke all on function public.get_booked_appointment_slots(date, date, uuid) from public;
grant execute on function public.get_booked_appointment_slots(date, date, uuid) to authenticated;
