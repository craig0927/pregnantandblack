create or replace function public.is_hca_approved(check_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hca_approvals
    where lower(trim(email)) = lower(trim(check_email))
  );
$$;

revoke all on function public.is_hca_approved(text) from public;
grant execute on function public.is_hca_approved(text) to anon;
grant execute on function public.is_hca_approved(text) to authenticated;
