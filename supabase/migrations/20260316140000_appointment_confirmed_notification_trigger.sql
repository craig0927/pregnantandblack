-- Replace any existing appointment-status notification trigger with a correct one.
-- Fires AFTER UPDATE on appointments when status transitions to 'confirmed'.
-- Notifies the user (not the HCA) that their session was confirmed.

-- Drop known candidates for a pre-existing broken trigger.
drop trigger if exists on_appointment_status_notify     on public.appointments;
drop trigger if exists on_appointment_confirmed_notify  on public.appointments;
drop trigger if exists on_appointment_notify            on public.appointments;
drop trigger if exists notify_appointment_status        on public.appointments;

create or replace function public.notify_on_appointment_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only fire when transitioning to 'confirmed' from a non-confirmed state.
  if NEW.status = 'confirmed' and (OLD.status is null or OLD.status <> 'confirmed') then
    perform public.create_notification(
      NEW.user_id,   -- recipient: the user whose appointment was confirmed
      NEW.hca_id,    -- actor: the HCA who confirmed it
      'session_confirmed',
      'confirmed your session',
      NEW.id,
      'appointment'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_appointment_confirmed_notify on public.appointments;
create trigger on_appointment_confirmed_notify
  after update of status on public.appointments
  for each row execute function public.notify_on_appointment_confirmed();
