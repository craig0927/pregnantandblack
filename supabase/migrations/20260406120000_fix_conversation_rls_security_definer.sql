-- Fix infinite recursion in conversations/conversation_participants RLS.
-- Using a SECURITY DEFINER function bypasses RLS when doing the participation
-- check, breaking the recursive loop.

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
grant execute on function public.is_conversation_participant(uuid) to authenticated;

-- Replace recursive policies with function-based ones

drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
  on public.conversations for select
  to authenticated
  using (public.is_conversation_participant(id));

drop policy if exists "conversation_participants_select" on public.conversation_participants;
create policy "conversation_participants_select"
  on public.conversation_participants for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "conversation_messages_select_participant" on public.conversation_messages;
create policy "conversation_messages_select_participant"
  on public.conversation_messages for select
  to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy if exists "conversation_messages_insert_participant" on public.conversation_messages;
create policy "conversation_messages_insert_participant"
  on public.conversation_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and public.is_conversation_participant(conversation_id)
  );
