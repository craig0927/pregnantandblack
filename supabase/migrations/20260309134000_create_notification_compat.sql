-- Compatibility overload for trigger calls to create_notification(...)
-- Fixes: function create_notification(uuid, uuid, unknown, unknown, uuid, unknown) does not exist

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
    type,
    title,
    body,
    entity_id,
    entity_type
  )
  values (
    p_user_id,
    coalesce(p_type, 'activity'),
    coalesce(p_title, 'New activity'),
    null,
    p_entity_id,
    p_entity_type
  );
end;
$$;

revoke all on function public.create_notification(uuid, uuid, text, text, uuid, text) from public;
grant execute on function public.create_notification(uuid, uuid, text, text, uuid, text) to authenticated;
