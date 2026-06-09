-- ============================================================
-- Phase 3a: faq_articles (衛教專欄) schema, RLS, policies
-- Single-admin model; public reads PUBLISHED only; admin full CRUD.
-- Reuses the shared set_updated_at() trigger and is_admin() helper.
--
-- Extra columns beyond the base spec are needed to reproduce the existing
-- static files byte-for-byte from the DB:
--   description       — the meta/og/twitter + ld+json Article description
--   search_keywords   — curated assets/search-index.js keyword array (q1-q7 only)
--   search_summary    — curated search-index.js summary (q1-q7 only)
--   sitemap_lastmod   — the <lastmod> in sitemap.xml (q1-q12 2026-06-06, q13-q17 2026-06-07)
-- ============================================================

create table if not exists public.faq_articles (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  excerpt          text,
  description      text,
  body_html        text,
  cover_path       text,
  cover_alt        text,
  category         text,
  search_keywords  jsonb,
  search_summary   text,
  sitemap_lastmod  date,
  status           text not null default 'draft' check (status in ('draft','published')),
  display_order    int,
  author_id        uuid references auth.users(id) on delete set null,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists trg_faq_articles_updated_at on public.faq_articles;
create trigger trg_faq_articles_updated_at
  before update on public.faq_articles
  for each row execute function public.set_updated_at();

create index if not exists faq_articles_display_order_idx on public.faq_articles (display_order);
create index if not exists faq_articles_status_idx on public.faq_articles (status);

-- ---------- RLS: deny-by-default ----------
alter table public.faq_articles enable row level security;

-- public read: anon + authenticated may read ONLY published rows
drop policy if exists faq_articles_select_published on public.faq_articles;
create policy faq_articles_select_published
  on public.faq_articles for select
  to anon, authenticated
  using (status = 'published');

-- admin full CRUD (sees drafts too)
drop policy if exists faq_articles_admin_all on public.faq_articles;
create policy faq_articles_admin_all
  on public.faq_articles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
