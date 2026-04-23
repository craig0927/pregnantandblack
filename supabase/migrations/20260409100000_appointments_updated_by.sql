-- Add updated_by column to appointments so triggers know who made the change.
-- This allows cancel/reschedule notifications to always go to the OTHER party.

alter table public.appointments
  add column if not exists updated_by uuid references public.profiles(id);

-- Fix cancellation trigger: notify the party who did NOT cancel.
create or replace function public.notify_on_session_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_actor uuid;
begin
  if NEW.status = 'cancelled' and OLD.status != 'cancelled' then
    -- actor is whoever triggered the update; fallback to user_id
    v_actor := coalesce(NEW.updated_by, NEW.user_id);
    -- notify the other party
    if v_actor = NEW.user_id then
      v_recipient := NEW.hca_id;
    else
      v_recipient := NEW.user_id;
    end if;

    perform public.create_notification(
      v_recipient,
      v_actor,
      'session_cancelled',
      'cancelled a session',
      NEW.id,
      'appointment'
    );
  end if;
  return NEW;
end;
$$;

-- Fix reschedule trigger: notify the party who did NOT reschedule.
create or replace function public.notify_on_session_rescheduled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_actor uuid;
begin
  if (NEW.date != OLD.date or NEW.start_time != OLD.start_time)
     and NEW.status = 'confirmed'
     and OLD.status = 'confirmed' then
    v_actor := coalesce(NEW.updated_by, NEW.user_id);
    if v_actor = NEW.user_id then
      v_recipient := NEW.hca_id;
    else
      v_recipient := NEW.user_id;
    end if;

    perform public.create_notification(
      v_recipient,
      v_actor,
      'session_rescheduled',
      'rescheduled your session',
      NEW.id,
      'appointment'
    );
  end if;
  return NEW;
end;
$$;
