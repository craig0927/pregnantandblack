-- RLS audit: add missing policies and tighten overly-permissive ones.
-- All policy creates are idempotent (wrapped in DO blocks).

-- ============================================================
-- FORUM POSTS
-- ============================================================

grant select, insert, update, delete on public.forum_posts to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_posts' and policyname='forum_posts_select') then
    create policy "forum_posts_select" on public.forum_posts for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_posts' and policyname='forum_posts_insert_own') then
    create policy "forum_posts_insert_own" on public.forum_posts for insert to authenticated with check (auth.uid() = author_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_posts' and policyname='forum_posts_update_own') then
    create policy "forum_posts_update_own" on public.forum_posts for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_posts' and policyname='forum_posts_delete_own') then
    create policy "forum_posts_delete_own" on public.forum_posts for delete to authenticated using (auth.uid() = author_id);
  end if;
end $$;

-- ============================================================
-- FORUM COMMENTS
-- ============================================================

grant select, insert, update, delete on public.forum_comments to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_comments' and policyname='forum_comments_select') then
    create policy "forum_comments_select" on public.forum_comments for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_comments' and policyname='forum_comments_insert_own') then
    create policy "forum_comments_insert_own" on public.forum_comments for insert to authenticated with check (auth.uid() = author_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_comments' and policyname='forum_comments_update_own') then
    create policy "forum_comments_update_own" on public.forum_comments for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='forum_comments' and policyname='forum_comments_delete_own') then
    create policy "forum_comments_delete_own" on public.forum_comments for delete to authenticated using (auth.uid() = author_id);
  end if;
end $$;

-- ============================================================
-- APPOINTMENTS
-- ============================================================

grant select, insert, update on public.appointments to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='appointments' and policyname='appointments_select') then
    create policy "appointments_select" on public.appointments for select to authenticated using (auth.uid() = user_id or auth.uid() = hca_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='appointments' and policyname='appointments_insert_own') then
    create policy "appointments_insert_own" on public.appointments for insert to authenticated with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='appointments' and policyname='appointments_update_participant') then
    create policy "appointments_update_participant" on public.appointments for update to authenticated using (auth.uid() = user_id or auth.uid() = hca_id) with check (auth.uid() = user_id or auth.uid() = hca_id);
  end if;
end $$;

-- ============================================================
-- PROFILES
-- ============================================================

grant select, insert, update on public.profiles to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select') then
    create policy "profiles_select" on public.profiles for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_own') then
    create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own') then
    create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- ============================================================
-- CONVERSATIONS
-- ============================================================

grant select, insert on public.conversations to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='conversations_select_participant') then
    create policy "conversations_select_participant" on public.conversations for select to authenticated
      using (exists (select 1 from public.conversation_participants cp where cp.conversation_id = id and cp.user_id = auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='conversations_insert') then
    create policy "conversations_insert" on public.conversations for insert to authenticated with check (true);
  end if;
end $$;

-- ============================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================

grant select, insert on public.conversation_participants to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversation_participants' and policyname='conversation_participants_select') then
    create policy "conversation_participants_select" on public.conversation_participants for select to authenticated
      using (user_id = auth.uid() or exists (select 1 from public.conversation_participants cp2 where cp2.conversation_id = conversation_id and cp2.user_id = auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversation_participants' and policyname='conversation_participants_insert') then
    create policy "conversation_participants_insert" on public.conversation_participants for insert to authenticated with check (true);
  end if;
end $$;

-- ============================================================
-- CONVERSATION MESSAGES
-- ============================================================

grant select, insert on public.conversation_messages to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversation_messages' and policyname='conversation_messages_select_participant') then
    create policy "conversation_messages_select_participant" on public.conversation_messages for select to authenticated
      using (exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_messages.conversation_id and cp.user_id = auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversation_messages' and policyname='conversation_messages_insert_participant') then
    create policy "conversation_messages_insert_participant" on public.conversation_messages for insert to authenticated
      with check (auth.uid() = sender_id and exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_messages.conversation_id and cp.user_id = auth.uid()));
  end if;
end $$;

-- ============================================================
-- HCA APPROVALS
-- Admin-managed allowlist checked during HCA registration.
-- Read access for all authenticated users (email-only, not sensitive).
-- Only service role can insert/update.
-- ============================================================

grant select on public.hca_approvals to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hca_approvals' and policyname='hca_approvals_select') then
    create policy "hca_approvals_select" on public.hca_approvals for select to authenticated using (true);
  end if;
end $$;

-- ============================================================
-- HCA AVAILABILITY
-- ============================================================

grant select, insert, update, delete on public.hca_availability to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hca_availability' and policyname='hca_availability_select') then
    create policy "hca_availability_select" on public.hca_availability for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hca_availability' and policyname='hca_availability_insert_own') then
    create policy "hca_availability_insert_own" on public.hca_availability for insert to authenticated with check (auth.uid() = hca_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hca_availability' and policyname='hca_availability_update_own') then
    create policy "hca_availability_update_own" on public.hca_availability for update to authenticated using (auth.uid() = hca_id) with check (auth.uid() = hca_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hca_availability' and policyname='hca_availability_delete_own') then
    create policy "hca_availability_delete_own" on public.hca_availability for delete to authenticated using (auth.uid() = hca_id);
  end if;
end $$;

-- ============================================================
-- NOTIFICATIONS (tighten existing permissive policies)
-- ============================================================

drop policy if exists notifications_insert_authenticated on public.notifications;
drop policy if exists notifications_update_authenticated on public.notifications;
drop policy if exists notifications_delete_authenticated on public.notifications;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications_select_own') then
    create policy "notifications_select_own" on public.notifications for select to authenticated using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications_update_own') then
    create policy "notifications_update_own" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications_delete_own') then
    create policy "notifications_delete_own" on public.notifications for delete to authenticated using (auth.uid() = user_id);
  end if;
end $$;

-- ============================================================
-- AUDIT EVENTS — no client access
-- ============================================================

revoke all on public.audit_events from authenticated, anon;
