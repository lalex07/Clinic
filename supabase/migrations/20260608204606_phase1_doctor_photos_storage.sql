-- ============================================================
-- Storage: doctor-photos bucket — public READ, admin-only writes
-- ============================================================
insert into storage.buckets (id, name, public)
values ('doctor-photos', 'doctor-photos', true)
on conflict (id) do update set public = true;

-- public read (bucket is public; explicit select policy for the API path)
drop policy if exists doctor_photos_public_read on storage.objects;
create policy doctor_photos_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'doctor-photos');

-- admin-only insert
drop policy if exists doctor_photos_admin_insert on storage.objects;
create policy doctor_photos_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'doctor-photos' and public.is_admin());

-- admin-only update
drop policy if exists doctor_photos_admin_update on storage.objects;
create policy doctor_photos_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'doctor-photos' and public.is_admin())
  with check (bucket_id = 'doctor-photos' and public.is_admin());

-- admin-only delete
drop policy if exists doctor_photos_admin_delete on storage.objects;
create policy doctor_photos_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'doctor-photos' and public.is_admin());
