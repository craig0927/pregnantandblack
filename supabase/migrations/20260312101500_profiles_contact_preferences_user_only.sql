-- Require public.profiles.contact_preferences to include chat only for users.
do $$
declare
  contact_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
  into contact_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'profiles'
    and a.attname = 'contact_preferences'
    and a.attnum > 0
    and not a.attisdropped;

  if contact_type is null then
    raise exception 'public.profiles.contact_preferences not found';
  end if;

  alter table if exists public.profiles
    drop constraint if exists contact_preferences_must_include_chat;

  if contact_type = 'text[]' then
    execute $sql$
      update public.profiles
      set contact_preferences = array(
        select distinct pref
        from (
          select lower(trim(prefs.value)) as pref
          from unnest(coalesce(contact_preferences, array[]::text[])) as prefs(value)
          where nullif(trim(prefs.value), '') is not null

          union all

          select 'chat'
          where coalesce(role, '') = 'user'
        ) normalized
        where pref in ('chat', 'video', 'phone')
      )
    $sql$;

    execute $sql$
      alter table public.profiles
        add constraint contact_preferences_must_include_chat
        check (
          coalesce(role, '') <> 'user'
          or coalesce(contact_preferences, array[]::text[]) @> array['chat']::text[]
        )
    $sql$;
  elsif contact_type = 'jsonb' then
    execute $sql$
      update public.profiles
      set contact_preferences = to_jsonb(array(
        select distinct pref
        from (
          select lower(trim(prefs.value)) as pref
          from jsonb_array_elements_text(coalesce(contact_preferences, '[]'::jsonb)) as prefs(value)
          where nullif(trim(prefs.value), '') is not null

          union all

          select 'chat'
          where coalesce(role, '') = 'user'
        ) normalized
        where pref in ('chat', 'video', 'phone')
      ))
    $sql$;

    execute $sql$
      alter table public.profiles
        add constraint contact_preferences_must_include_chat
        check (
          coalesce(role, '') <> 'user'
          or coalesce(contact_preferences, '[]'::jsonb) @> '["chat"]'::jsonb
        )
    $sql$;
  else
    raise exception
      'Unsupported public.profiles.contact_preferences type: %',
      contact_type;
  end if;
end
$$;
