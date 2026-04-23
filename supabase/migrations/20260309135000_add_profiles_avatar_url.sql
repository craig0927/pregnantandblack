-- Add avatar_url for profile photo selection in app
alter table if exists public.profiles
  add column if not exists avatar_url text;
