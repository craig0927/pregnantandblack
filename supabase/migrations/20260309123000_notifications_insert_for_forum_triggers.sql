-- Fix forum like toggle failures caused by notification trigger writes.
-- Error observed: permission denied for table notifications (code 42501)

grant insert, select on table public.notifications to authenticated;

alter table if exists public.notifications enable row level security;

-- Allow trigger-driven inserts during authenticated requests.
-- Note: this is permissive by design to unblock trigger writes.
-- If you want tighter security later, move trigger function(s) to SECURITY DEFINER
-- and replace this with stricter checks.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_insert_authenticated'
  ) then
    create policy notifications_insert_authenticated
      on public.notifications
      for insert
      to authenticated
      with check (true);
  end if;
end
$$;
