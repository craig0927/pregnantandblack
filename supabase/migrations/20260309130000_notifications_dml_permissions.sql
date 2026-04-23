-- Follow-up fix for forum like/unlike trigger failures on notifications.
-- Observed error: permission denied for table notifications (code 42501)

grant select, insert, update, delete on table public.notifications to authenticated;

alter table if exists public.notifications enable row level security;

-- Ensure INSERT policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_insert_authenticated'
  ) THEN
    CREATE POLICY notifications_insert_authenticated
      ON public.notifications
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END
$$;

-- Ensure UPDATE policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_update_authenticated'
  ) THEN
    CREATE POLICY notifications_update_authenticated
      ON public.notifications
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- Ensure DELETE policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_delete_authenticated'
  ) THEN
    CREATE POLICY notifications_delete_authenticated
      ON public.notifications
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END
$$;
