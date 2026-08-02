-- ============================================================
-- Phase A round 2 — corrective hardening on top of
-- 20260730014525_phase_a_events_analytics_schema.sql
-- (that migration is already applied + recorded; it is left as the
--  historical record and this one layers the two fixes on top.)
--
-- 1) created_at becomes SERVER-SET and non-forgeable:
--      * NOT NULL default now()
--      * anon/authenticated lose INSERT on created_at and id, so a hostile
--        client can neither backdate/forge a timestamp nor choose a row id.
--    NOTE: a bare `revoke insert (created_at, id) ...` cannot subtract from an
--    existing TABLE-level grant in Postgres (column REVOKE only touches column
--    ACLs). So we revoke the table-level INSERT first, then re-grant INSERT
--    column-by-column on exactly the six client-supplied columns.
--
-- 2) events_admin_delete now requires public.is_admin_mfa() (aal2), matching
--    the session-47 / 20260609220017 convention that every admin WRITE needs
--    MFA. events_admin_select stays on public.is_admin() — reads are not
--    writes, which matches every other table.
-- ============================================================

-- ---------- 1) created_at: server-set, NOT NULL ----------
update public.events set created_at = now() where created_at is null;

alter table public.events
  alter column created_at set default now(),
  alter column created_at set not null;

-- public roles may INSERT only the six columns the tracker actually sends.
revoke insert on public.events from anon, authenticated;
grant insert (event_type, path, referrer_host, device, faq_slug, session_id)
  on public.events to anon, authenticated;

-- ---------- 2) admin DELETE requires MFA (aal2) ----------
drop policy if exists events_admin_delete on public.events;
create policy events_admin_delete
  on public.events for delete
  to authenticated
  using (public.is_admin_mfa());

-- events_admin_select is deliberately unchanged (public.is_admin()).

-- ============================================================
-- ROLLBACK (paste to undo THIS migration only; the base Phase A
-- migration 20260730014525 stays in place)
-- ============================================================
-- -- restore the table-wide INSERT grant (client could set created_at/id again):
-- revoke insert (event_type, path, referrer_host, device, faq_slug, session_id)
--   on public.events from anon, authenticated;
-- grant insert on public.events to anon, authenticated;
--
-- -- drop the NOT NULL (the default now() was already present before):
-- alter table public.events alter column created_at drop not null;
--
-- -- put admin DELETE back on is_admin() (no MFA requirement):
-- drop policy if exists events_admin_delete on public.events;
-- create policy events_admin_delete on public.events for delete to authenticated
--   using (public.is_admin());
-- ============================================================
