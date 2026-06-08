-- ============================================================
-- Phase 1: profiles + doctors schema, helper, RLS, policies
-- Single-admin model; public reads doctors; admin full CRUD.
-- ============================================================

-- updated_at trigger function (shared)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'admin' check (role in ('admin','doctor','nurse')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- doctors ----------
create table if not exists public.doctors (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique,
  name               text not null,
  role               text,
  specialty          text,
  specialty_pending  boolean not null default true,
  credentials        jsonb not null default '[]'::jsonb,
  clinics            jsonb not null default '[]'::jsonb,
  photo_mode         text check (photo_mode in ('photo','anon','placeholder')),
  photo_path         text,
  display_order      int,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists trg_doctors_updated_at on public.doctors;
create trigger trg_doctors_updated_at
  before update on public.doctors
  for each row execute function public.set_updated_at();

create index if not exists doctors_display_order_idx on public.doctors (display_order);

-- ---------- is_admin() helper (SECURITY DEFINER bypasses RLS to avoid recursion) ----------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active
  );
$$;

-- ---------- RLS: deny-by-default ----------
alter table public.profiles enable row level security;
alter table public.doctors  enable row level security;

-- doctors: anyone (anon + authenticated) may read all rows (public info)
drop policy if exists doctors_select_public on public.doctors;
create policy doctors_select_public
  on public.doctors for select
  to anon, authenticated
  using (true);

-- doctors: admin full CRUD
drop policy if exists doctors_admin_all on public.doctors;
create policy doctors_admin_all
  on public.doctors for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles: admin full CRUD (the single admin reads its own row to verify is_admin)
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles: a user may always read their OWN row (needed for the client role check
-- before is_admin() short-circuits; harmless for the single-admin model)
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select
  on public.profiles for select
  to authenticated
  using (id = auth.uid());
