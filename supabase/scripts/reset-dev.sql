-- Dev-only reset script.
-- Clears app data and auth users so you can start from a clean slate.
-- Run in Supabase SQL editor, or via psql/supabase db execute.

begin;

-- Truncate known app tables if they exist.
do $$
declare
  target_tables text[] := array[
    'notifications',
    'forum_comment_likes',
    'forum_likes',
    'forum_comments',
    'forum_posts',
    'conversation_messages',
    'conversations',
    'appointments',
    'hca_availability',
    'profiles'
    -- Optional: include approvals if you also want to clear approved HCA emails.
    -- ,'hca_approvals'
  ];
  qualified_tables text[];
begin
  select array_agg(format('%I.%I', 'public', t.tablename))
  into qualified_tables
  from pg_tables t
  where t.schemaname = 'public'
    and t.tablename = any(target_tables);

  if qualified_tables is not null and array_length(qualified_tables, 1) > 0 then
    execute 'truncate table '
      || array_to_string(qualified_tables, ', ')
      || ' restart identity cascade';
  end if;
end
$$;

-- Clear Supabase auth users if auth schema is present.
-- This removes sign-in accounts so registration starts fresh.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'auth'
      and table_name = 'users'
  ) then
    delete from auth.users;
  end if;
end
$$;

commit;
