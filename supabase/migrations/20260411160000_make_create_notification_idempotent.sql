-- Make notification creation idempotent so repeated actions like re-liking
-- the same comment do not fail on the notifications dedupe unique index.

create or replace function public.create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_entity_id uuid,
  p_entity_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    user_id,
    actor_id,
    type,
    title,
    body,
    entity_id,
    entity_type
  )
  values (
    p_user_id,
    p_actor_id,
    coalesce(p_type, 'activity'),
    coalesce(p_title, 'New activity'),
    null,
    p_entity_id,
    p_entity_type
  )
  on conflict (user_id, type, actor_id, entity_type, entity_id) do nothing;
end;
$$;

revoke all on function public.create_notification(uuid, uuid, text, text, uuid, text) from public;
grant execute on function public.create_notification(uuid, uuid, text, text, uuid, text) to authenticated;
