-- Fires AFTER UPDATE on appointments when the user cancels (status -> 'cancelled')
-- or reschedules (date/time changed while status stays 'confirmed').

create or replace function public.notify_on_session_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'cancelled' and OLD.status != 'cancelled' then
    perform public.create_notification(
      NEW.hca_id,    -- recipient: HCA
      NEW.user_id,   -- actor: user
      'session_cancelled',
      'cancelled a session',
      NEW.id,
      'appointment'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_session_cancelled_notify on public.appointments;
create trigger on_session_cancelled_notify
  after update on public.appointments
  for each row execute function public.notify_on_session_cancelled();

-- -------------------------------------------------------

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
      NEW.hca_id,    -- recipient: HCA
      NEW.user_id,   -- actor: user
      'session_rescheduled',
      'rescheduled a session',
      NEW.id,
      'appointment'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_session_rescheduled_notify on public.appointments;
create trigger on_session_rescheduled_notify
  after update on public.appointments
  for each row execute function public.notify_on_session_rescheduled();
