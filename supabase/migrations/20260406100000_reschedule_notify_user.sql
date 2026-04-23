-- Fix reschedule notification to always notify the USER.
-- Previously notified the HCA, which was wrong when the HCA is the one rescheduling.
-- Since either party can now reschedule, the user is always the party that needs to be informed.

create or replace function public.notify_on_session_rescheduled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (NEW.date != OLD.date or NEW.start_time != OLD.start_time)
     and NEW.status = 'confirmed'
     and OLD.status = 'confirmed' then
    perform public.create_notification(
      NEW.user_id,   -- recipient: user (always notified when session time changes)
      NEW.hca_id,    -- actor: hca
      'session_rescheduled',
      'rescheduled your session',
      NEW.id,
      'appointment'
    );
  end if;
  return NEW;
end;
$$;
