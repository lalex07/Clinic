-- ============================================================
-- Phase 4: require an MFA-elevated session (aal2) for admin WRITES
-- ------------------------------------------------------------
-- Closes M1 of docs/security-review-2026-06-09.md. The admin has now enrolled a
-- TOTP factor, so it is safe to require an MFA-elevated (aal2) session for every
-- write. READS ARE UNCHANGED: anon/public SELECT, the admin's draft reads, and
-- the login-time profile self-read all keep using is_admin()/public policies.
--
-- Mechanism: a new helper is_admin_mfa() = is_admin() AND the request JWT's
-- 'aal' claim = 'aal2'. ONLY the INSERT/UPDATE/DELETE policies switch to it.
--
-- The public-table admin policies were single FOR ALL policies, so each is split
-- into an admin SELECT (is_admin(), reads unchanged) + admin INSERT/UPDATE/DELETE
-- (is_admin_mfa(), writes require aal2). Storage already had per-command policies,
-- so only its INSERT/UPDATE/DELETE are swapped; the admin read-back SELECTs stay.
--
-- NOTE: there is no public.audit_log table in this project, so none is touched.
-- NOTE: is_admin() itself is unchanged (still used by reads + the Edge Function
-- gate). anon and every SELECT/read policy are unchanged.
--
-- ROLLBACK (instant revert if a live aal2 save fails) — re-point the write
-- policies back to is_admin() and drop the helper; see the bottom of this file.
-- ============================================================

-- ---------- helper: is_admin AND aal2 (MFA-elevated) ----------
-- Same shape as is_admin(): SECURITY DEFINER + pinned search_path=public + STABLE.
-- auth.jwt() returns the request's verified JWT claims; 'aal' is 'aal2' only after
-- the session has passed a TOTP MFA challenge. Missing claim -> treated as aal1.
create or replace function public.is_admin_mfa()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin()
     and coalesce((auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

-- Mirror is_admin() grants exactly: authenticated only; never anon/public.
revoke execute on function public.is_admin_mfa() from public, anon;
grant execute on function public.is_admin_mfa() to authenticated;

-- ============================================================
-- public tables — split FOR ALL into SELECT(is_admin) + write(is_admin_mfa)
-- ============================================================

-- ---------- doctors ----------
drop policy if exists doctors_admin_all on public.doctors;
create policy doctors_admin_select on public.doctors for select to authenticated using (public.is_admin());
create policy doctors_admin_insert on public.doctors for insert to authenticated with check (public.is_admin_mfa());
create policy doctors_admin_update on public.doctors for update to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create policy doctors_admin_delete on public.doctors for delete to authenticated using (public.is_admin_mfa());

-- ---------- profiles ----------
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_select on public.profiles for select to authenticated using (public.is_admin());
create policy profiles_admin_insert on public.profiles for insert to authenticated with check (public.is_admin_mfa());
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create policy profiles_admin_delete on public.profiles for delete to authenticated using (public.is_admin_mfa());

-- ---------- news ----------
drop policy if exists news_admin_all on public.news;
create policy news_admin_select on public.news for select to authenticated using (public.is_admin());
create policy news_admin_insert on public.news for insert to authenticated with check (public.is_admin_mfa());
create policy news_admin_update on public.news for update to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create policy news_admin_delete on public.news for delete to authenticated using (public.is_admin_mfa());

-- ---------- faq_articles ----------
drop policy if exists faq_articles_admin_all on public.faq_articles;
create policy faq_articles_admin_select on public.faq_articles for select to authenticated using (public.is_admin());
create policy faq_articles_admin_insert on public.faq_articles for insert to authenticated with check (public.is_admin_mfa());
create policy faq_articles_admin_update on public.faq_articles for update to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create policy faq_articles_admin_delete on public.faq_articles for delete to authenticated using (public.is_admin_mfa());

-- ============================================================
-- storage.objects — swap per-bucket admin WRITE policies to is_admin_mfa().
-- The admin read-back SELECT policies stay on is_admin(); public reads use
-- public bucket URLs (no policy) and are untouched.
-- ============================================================

-- doctor-photos
drop policy if exists doctor_photos_admin_insert on storage.objects;
create policy doctor_photos_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'doctor-photos' and public.is_admin_mfa());
drop policy if exists doctor_photos_admin_update on storage.objects;
create policy doctor_photos_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'doctor-photos' and public.is_admin_mfa())
  with check (bucket_id = 'doctor-photos' and public.is_admin_mfa());
drop policy if exists doctor_photos_admin_delete on storage.objects;
create policy doctor_photos_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'doctor-photos' and public.is_admin_mfa());

-- news-images
drop policy if exists news_images_admin_insert on storage.objects;
create policy news_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'news-images' and public.is_admin_mfa());
drop policy if exists news_images_admin_update on storage.objects;
create policy news_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'news-images' and public.is_admin_mfa())
  with check (bucket_id = 'news-images' and public.is_admin_mfa());
drop policy if exists news_images_admin_delete on storage.objects;
create policy news_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'news-images' and public.is_admin_mfa());

-- faq-images
drop policy if exists faq_images_admin_insert on storage.objects;
create policy faq_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'faq-images' and public.is_admin_mfa());
drop policy if exists faq_images_admin_update on storage.objects;
create policy faq_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'faq-images' and public.is_admin_mfa())
  with check (bucket_id = 'faq-images' and public.is_admin_mfa());
drop policy if exists faq_images_admin_delete on storage.objects;
create policy faq_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'faq-images' and public.is_admin_mfa());

-- ============================================================
-- ROLLBACK (run this whole block to instantly revert to the pre-Phase-4 state:
-- admin writes gated by is_admin() again, helper dropped). Reads are unaffected
-- either way. Kept here as a comment so it ships with the migration.
-- ------------------------------------------------------------
-- -- public tables: collapse the split policies back into one FOR ALL (is_admin)
-- drop policy if exists doctors_admin_select on public.doctors;
-- drop policy if exists doctors_admin_insert on public.doctors;
-- drop policy if exists doctors_admin_update on public.doctors;
-- drop policy if exists doctors_admin_delete on public.doctors;
-- create policy doctors_admin_all on public.doctors for all to authenticated
--   using (public.is_admin()) with check (public.is_admin());
--
-- drop policy if exists profiles_admin_select on public.profiles;
-- drop policy if exists profiles_admin_insert on public.profiles;
-- drop policy if exists profiles_admin_update on public.profiles;
-- drop policy if exists profiles_admin_delete on public.profiles;
-- create policy profiles_admin_all on public.profiles for all to authenticated
--   using (public.is_admin()) with check (public.is_admin());
--
-- drop policy if exists news_admin_select on public.news;
-- drop policy if exists news_admin_insert on public.news;
-- drop policy if exists news_admin_update on public.news;
-- drop policy if exists news_admin_delete on public.news;
-- create policy news_admin_all on public.news for all to authenticated
--   using (public.is_admin()) with check (public.is_admin());
--
-- drop policy if exists faq_articles_admin_select on public.faq_articles;
-- drop policy if exists faq_articles_admin_insert on public.faq_articles;
-- drop policy if exists faq_articles_admin_update on public.faq_articles;
-- drop policy if exists faq_articles_admin_delete on public.faq_articles;
-- create policy faq_articles_admin_all on public.faq_articles for all to authenticated
--   using (public.is_admin()) with check (public.is_admin());
--
-- -- storage.objects: swap the three buckets' write policies back to is_admin()
-- drop policy if exists doctor_photos_admin_insert on storage.objects;
-- create policy doctor_photos_admin_insert on storage.objects for insert to authenticated
--   with check (bucket_id = 'doctor-photos' and public.is_admin());
-- drop policy if exists doctor_photos_admin_update on storage.objects;
-- create policy doctor_photos_admin_update on storage.objects for update to authenticated
--   using (bucket_id = 'doctor-photos' and public.is_admin())
--   with check (bucket_id = 'doctor-photos' and public.is_admin());
-- drop policy if exists doctor_photos_admin_delete on storage.objects;
-- create policy doctor_photos_admin_delete on storage.objects for delete to authenticated
--   using (bucket_id = 'doctor-photos' and public.is_admin());
--
-- drop policy if exists news_images_admin_insert on storage.objects;
-- create policy news_images_admin_insert on storage.objects for insert to authenticated
--   with check (bucket_id = 'news-images' and public.is_admin());
-- drop policy if exists news_images_admin_update on storage.objects;
-- create policy news_images_admin_update on storage.objects for update to authenticated
--   using (bucket_id = 'news-images' and public.is_admin())
--   with check (bucket_id = 'news-images' and public.is_admin());
-- drop policy if exists news_images_admin_delete on storage.objects;
-- create policy news_images_admin_delete on storage.objects for delete to authenticated
--   using (bucket_id = 'news-images' and public.is_admin());
--
-- drop policy if exists faq_images_admin_insert on storage.objects;
-- create policy faq_images_admin_insert on storage.objects for insert to authenticated
--   with check (bucket_id = 'faq-images' and public.is_admin());
-- drop policy if exists faq_images_admin_update on storage.objects;
-- create policy faq_images_admin_update on storage.objects for update to authenticated
--   using (bucket_id = 'faq-images' and public.is_admin())
--   with check (bucket_id = 'faq-images' and public.is_admin());
-- drop policy if exists faq_images_admin_delete on storage.objects;
-- create policy faq_images_admin_delete on storage.objects for delete to authenticated
--   using (bucket_id = 'faq-images' and public.is_admin());
--
-- -- finally drop the helper
-- drop function if exists public.is_admin_mfa();
-- ============================================================
