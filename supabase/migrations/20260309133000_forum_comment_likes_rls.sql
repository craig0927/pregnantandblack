-- RLS + grants for forum_comment_likes so comment like/unlike works reliably.

grant select, insert, delete on table public.forum_comment_likes to authenticated;

alter table if exists public.forum_comment_likes enable row level security;

-- Normalize duplicates before unique index.
delete from public.forum_comment_likes a
using public.forum_comment_likes b
where a.ctid < b.ctid
  and a.comment_id = b.comment_id
  and a.user_id = b.user_id;

create unique index if not exists forum_comment_likes_comment_user_unique
  on public.forum_comment_likes (comment_id, user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'forum_comment_likes'
      AND policyname = 'forum_comment_likes_select_authenticated'
  ) THEN
    CREATE POLICY forum_comment_likes_select_authenticated
      ON public.forum_comment_likes
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'forum_comment_likes'
      AND policyname = 'forum_comment_likes_insert_own'
  ) THEN
    CREATE POLICY forum_comment_likes_insert_own
      ON public.forum_comment_likes
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'forum_comment_likes'
      AND policyname = 'forum_comment_likes_delete_own'
  ) THEN
    CREATE POLICY forum_comment_likes_delete_own
      ON public.forum_comment_likes
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;
