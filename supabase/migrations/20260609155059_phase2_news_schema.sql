-- ============================================================
-- Phase 2: news (最新消息 / 公告) schema, RLS, policies
-- Single-admin model; public reads PUBLISHED news only; admin full CRUD.
-- Reuses the shared set_updated_at() trigger and is_admin() helper from Phase 1.
-- ============================================================

-- ---------- news ----------
create table if not exists public.news (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text,
  clinic        text not null check (clinic in ('xindian','muzha','xinglong','zhongshan')),
  date          date not null,
  image_path    text,
  status        text not null default 'draft' check (status in ('draft','published')),
  author_id     uuid references auth.users(id) on delete set null,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_news_updated_at on public.news;
create trigger trg_news_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();

-- list is ordered by date desc on the public page and in the admin
create index if not exists news_date_idx on public.news (date desc);
create index if not exists news_status_idx on public.news (status);

-- ---------- RLS: deny-by-default ----------
alter table public.news enable row level security;

-- public read: anon + authenticated may read ONLY published rows
drop policy if exists news_select_published on public.news;
create policy news_select_published
  on public.news for select
  to anon, authenticated
  using (status = 'published');

-- admin full CRUD (sees drafts too; this policy OR's with the published one)
drop policy if exists news_admin_all on public.news;
create policy news_admin_all
  on public.news for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
