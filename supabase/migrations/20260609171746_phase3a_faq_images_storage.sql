-- ============================================================
-- Storage: faq-images bucket — public READ (public object URLs),
-- admin-only writes + admin read-back (SELECT) so supabase-js .upload()'s
-- INSERT ... RETURNING succeeds. Mirrors the doctor-photos / news-images
-- buckets including the storage_admin_select fix.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('faq-images', 'faq-images', true)
on conflict (id) do update set public = true;

-- admin read-back (enables upload RETURNING; scoped to is_admin, not a broad/anon listing)
drop policy if exists faq_images_admin_select on storage.objects;
create policy faq_images_admin_select
  on storage.objects for select
  to authenticated
  using (bucket_id = 'faq-images' and public.is_admin());

-- admin-only insert
drop policy if exists faq_images_admin_insert on storage.objects;
create policy faq_images_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'faq-images' and public.is_admin());

-- admin-only update
drop policy if exists faq_images_admin_update on storage.objects;
create policy faq_images_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'faq-images' and public.is_admin())
  with check (bucket_id = 'faq-images' and public.is_admin());

-- admin-only delete
drop policy if exists faq_images_admin_delete on storage.objects;
create policy faq_images_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'faq-images' and public.is_admin());
