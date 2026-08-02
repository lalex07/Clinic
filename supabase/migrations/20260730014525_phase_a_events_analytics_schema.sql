-- ============================================================
-- Phase A: public.events — first-party, COOKIELESS engagement analytics
-- COLLECTION ONLY (no dashboard this phase).
--
-- Privacy (medical site — this is a hard constraint):
--   * NO ip address, NO user-agent, NO name/email, NO patient-identifying data,
--     NO query strings, NO hashes, NO full referrer URLs — referrer_host is the
--     HOSTNAME only. There is deliberately no column that could hold PII.
--   * session_id is a random UUID kept in the browser's sessionStorage (per-visit,
--     not a cookie, not localStorage) → no cross-session / cross-device tracking.
--
-- RLS is deny-by-default: the public role may ONLY insert (shape-validated in the
-- WITH CHECK); reading and deleting are admin-only. There is no UPDATE policy at
-- all, so nobody can mutate a row through the API.
-- ============================================================

create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  event_type     text not null check (event_type in ('pageview','booking_click','faq_view')),
  path           text,
  referrer_host  text,
  device         text check (device in ('mobile','desktop')),
  faq_slug       text,
  session_id     text,
  created_at     timestamptz default now()
);

-- time-range queries (Phase B dashboard) + per-type time-range queries
create index if not exists events_created_at_idx on public.events (created_at);
create index if not exists events_type_created_at_idx on public.events (event_type, created_at);

-- ---------- RLS: deny-by-default ----------
alter table public.events enable row level security;

-- public write: anon + authenticated may INSERT ONLY, and only well-shaped rows.
-- The WITH CHECK re-states the event_type whitelist and caps every free-text
-- column at 256 chars so a hostile client cannot stuff the table with junk.
drop policy if exists events_insert_public on public.events;
create policy events_insert_public
  on public.events for insert
  to anon, authenticated
  with check (
    event_type in ('pageview','booking_click','faq_view')
    and (path is null or length(path) <= 256)
    and (referrer_host is null or length(referrer_host) <= 256)
    and (session_id is null or length(session_id) <= 256)
    and (faq_slug is null or length(faq_slug) <= 256)
  );

-- NO anon SELECT / UPDATE / DELETE policy exists → those are denied for the
-- public roles (and UPDATE is denied for every role, admin included).

-- admin read (Phase B dashboard will use this)
drop policy if exists events_admin_select on public.events;
create policy events_admin_select
  on public.events for select
  to authenticated
  using (public.is_admin());

-- admin delete (retention / purge).
-- NOTE for reviewers: every other admin WRITE in this project requires
-- public.is_admin_mfa() (aal2) per migration 20260609220017. This migration
-- follows the Phase A spec as written and gates DELETE on public.is_admin().
-- Tightening it to is_admin_mfa() is a one-line change if desired.
drop policy if exists events_admin_delete on public.events;
create policy events_admin_delete
  on public.events for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- ROLLBACK (paste to fully undo this migration)
-- ============================================================
-- drop policy if exists events_insert_public on public.events;
-- drop policy if exists events_admin_select on public.events;
-- drop policy if exists events_admin_delete on public.events;
-- drop index if exists public.events_type_created_at_idx;
-- drop index if exists public.events_created_at_idx;
-- drop table if exists public.events;
--
-- (Partial rollback — keep the table, revoke public writes:
--  drop policy if exists events_insert_public on public.events;)
--
-- (Alternative hardening — require MFA/aal2 for admin DELETE instead of is_admin():
--  drop policy if exists events_admin_delete on public.events;
--  create policy events_admin_delete on public.events for delete to authenticated
--    using (public.is_admin_mfa());)
-- ============================================================
