-- forum_likes RLS policies for authenticated users
-- Fixes: 42501 "new row violates row-level security policy"

alter table if exists public.forum_likes enable row level security;

-- Optional safety: prevent duplicate likes per user/post
delete from public.forum_likes a
using public.forum_likes b
where a.ctid < b.ctid
  and a.post_id = b.post_id
  and a.user_id = b.user_id;

create unique index if not exists forum_likes_post_user_unique
  on public.forum_likes (post_id, user_id);

-- Read likes
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'forum_likes'
      and policyname = 'forum_likes_select_authenticated'
  ) then
    create policy "forum_likes_select_authenticated"
      on public.forum_likes
      for select
      to authenticated
      using (true);
  end if;
end
$$;

-- Insert your own like row only
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'forum_likes'
      and policyname = 'forum_likes_insert_own'
  ) then
    create policy "forum_likes_insert_own"
      on public.forum_likes
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Delete only your own like row
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'forum_likes'
      and policyname = 'forum_likes_delete_own'
  ) then
    create policy "forum_likes_delete_own"
      on public.forum_likes
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;
