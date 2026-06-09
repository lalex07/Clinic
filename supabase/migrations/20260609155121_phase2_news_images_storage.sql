-- ============================================================
-- Storage: news-images bucket — public READ (via public object URLs),
-- admin-only writes. Parallel to the doctor-photos bucket (post-hardening state).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do update set public = true;

-- NOTE: no broad SELECT policy on storage.objects for this bucket. The bucket is
-- public, so object URLs (/storage/v1/object/public/news-images/...) are served
-- WITHOUT a policy; omitting a SELECT policy stops anon from LISTING the bucket via
-- the API (matches the Phase 1 doctor-photos hardening). The generator reads
-- image_path from the news table, never the bucket listing.

-- admin-only insert
drop policy if exists news_images_admin_insert on storage.objects;
create policy news_images_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'news-images' and public.is_admin());

-- admin-only update
drop policy if exists news_images_admin_update on storage.objects;
create policy news_images_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'news-images' and public.is_admin())
  with check (bucket_id = 'news-images' and public.is_admin());

-- admin-only delete
drop policy if exists news_images_admin_delete on storage.objects;
create policy news_images_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'news-images' and public.is_admin());
