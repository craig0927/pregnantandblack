-- Fires AFTER INSERT on appointments when status = 'requested'.
-- Notifies the HCA that a user has requested a session.

create or replace function public.notify_on_session_requested()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'requested' then
    perform public.create_notification(
      NEW.hca_id,   -- recipient: the HCA being requested
      NEW.user_id,  -- actor: the user making the request
      'request_session',
      'requested a session',
      NEW.id,
      'appointment'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_session_requested_notify on public.appointments;
create trigger on_session_requested_notify
  after insert on public.appointments
  for each row execute function public.notify_on_session_requested();
