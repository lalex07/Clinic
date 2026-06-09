-- ============================================================
-- Fix: admin storage uploads failed with
--   "new row violates row-level security policy for table objects".
-- Root cause: supabase-js .upload() runs INSERT ... RETURNING, and
-- PostgreSQL checks RETURNING rows against SELECT (USING) policies. The
-- Phase 1 hardening (20260608204735) dropped the only SELECT policy on
-- storage.objects, so the authenticated admin had NO read-back visibility
-- -> the RETURNING row was invisible -> rejected, even though the INSERT
-- WITH CHECK passed. (A plain INSERT with no RETURNING succeeds; the
-- storage API always uses RETURNING, which is why it failed in the browser.)
--
-- Fix: add an admin-scoped SELECT policy per bucket so the admin can read
-- back its own writes. Scoped to public.is_admin() + bucket_id: this is NOT
-- a broad/anon listing policy and does NOT touch public READ (served via
-- public object URLs without any policy) or allow anon writes/listing.
-- Only the single admin gains SELECT, which the upload round-trip requires.
-- ============================================================

-- ---------- doctor-photos: admin read-back (enables upload RETURNING) ----------
drop policy if exists doctor_photos_admin_select on storage.objects;
create policy doctor_photos_admin_select
  on storage.objects for select
  to authenticated
  using (bucket_id = 'doctor-photos' and public.is_admin());

-- ---------- news-images: admin read-back (enables upload RETURNING) ----------
drop policy if exists news_images_admin_select on storage.objects;
create policy news_images_admin_select
  on storage.objects for select
  to authenticated
  using (bucket_id = 'news-images' and public.is_admin());

-- Re-assert the admin write policies idempotently so this migration is a
-- complete, reproducible statement of both buckets' admin access. (These
-- already existed and worked — INSERT/UPDATE/DELETE were never the gap; the
-- missing SELECT read-back was.)
drop policy if exists doctor_photos_admin_insert on storage.objects;
create policy doctor_photos_admin_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'doctor-photos' and public.is_admin());
drop policy if exists doctor_photos_admin_update on storage.objects;
create policy doctor_photos_admin_update
  on storage.objects for update to authenticated
  using (bucket_id = 'doctor-photos' and public.is_admin())
  with check (bucket_id = 'doctor-photos' and public.is_admin());
drop policy if exists doctor_photos_admin_delete on storage.objects;
create policy doctor_photos_admin_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'doctor-photos' and public.is_admin());

drop policy if exists news_images_admin_insert on storage.objects;
create policy news_images_admin_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'news-images' and public.is_admin());
drop policy if exists news_images_admin_update on storage.objects;
create policy news_images_admin_update
  on storage.objects for update to authenticated
  using (bucket_id = 'news-images' and public.is_admin())
  with check (bucket_id = 'news-images' and public.is_admin());
drop policy if exists news_images_admin_delete on storage.objects;
create policy news_images_admin_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'news-images' and public.is_admin());
