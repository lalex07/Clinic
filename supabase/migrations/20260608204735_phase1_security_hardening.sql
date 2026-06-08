-- ============================================================
-- Security hardening (resolves database-linter advisories)
-- ============================================================

-- 1. Pin search_path on the trigger function (advisor 0011)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Drop the broad public-read SELECT policy on storage.objects (advisor 0025).
-- The 'doctor-photos' bucket is public, so object URLs
-- (/storage/v1/object/public/doctor-photos/...) are served WITHOUT this policy.
-- Removing it stops anon clients from LISTING the whole bucket via the API,
-- which the generator never needs (it reads photo_path from the doctors table).
drop policy if exists doctor_photos_public_read on storage.objects;

-- 3. is_admin() stays SECURITY DEFINER (RLS uses it), but anon never needs it
-- (the only anon-facing policy is doctors SELECT using (true)). Revoke EXECUTE
-- from anon/public; keep it for authenticated so the admin policies still evaluate.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
