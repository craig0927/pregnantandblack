-- Creates or replaces the generate_meet_link RPC.
-- Generates a Jitsi Meet room URL from the appointment ID and writes it
-- to appointments.meet_link. Returns the URL.

create or replace function public.generate_meet_link(p_appointment_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meet_link text;
begin
  -- Build a stable, unique Jitsi room URL from the appointment ID.
  v_meet_link := 'https://meet.jit.si/pab-' || replace(p_appointment_id::text, '-', '');

  update public.appointments
  set meet_link = v_meet_link
  where id = p_appointment_id;

  return v_meet_link;
end;
$$;

-- Grant execute to authenticated users (HCA calls this on accept).
grant execute on function public.generate_meet_link(uuid) to authenticated;
