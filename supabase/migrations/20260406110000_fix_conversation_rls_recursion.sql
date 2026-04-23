-- Fix infinite recursion in conversation_participants RLS policy.
-- The previous policy queried conversation_participants from within its own
-- policy, causing Postgres to recurse infinitely.
-- A user only needs to see their own participant rows.

drop policy if exists "conversation_participants_select" on public.conversation_participants;

create policy "conversation_participants_select"
  on public.conversation_participants for select
  to authenticated
  using (user_id = auth.uid());
