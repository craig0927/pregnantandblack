-- Prevent double-booking at the DB level.
-- If two users pass the app-level pre-check simultaneously, Postgres will
-- reject the second insert/update with a unique constraint violation.

create unique index if not exists appointments_hca_date_time_unique
  on public.appointments (hca_id, date, start_time)
  where status = 'requested' or status = 'confirmed';
