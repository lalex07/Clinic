# Security review — Dafeng ENT clinic system (static site + Supabase + publish pipeline)

**Date:** 2026-06-09 · **Scope:** repo root `/Clinic`, git history, the **live** Supabase
project `ysnrrkpusgdgzwkywddu`, the `regen-team` Edge Function, and the GitHub publish pipeline.
**Mode:** report-only — no code, RLS, auth, or config was changed. The only writes attempted were
RLS probe requests as the anon role, which (correctly) mutated **nothing** (verified below).

**Intended design (from `CLAUDE.md` + `supabase/README.md`):** single-admin CMS; the public site
stays static with zero runtime Supabase dependency; **RLS is the security gate**; only browser-safe
values (project URL + anon key) are ever committed; service-role key and GitHub PAT never touch the
repo or browser.

## Verdict

The system matches its intended design well. **No Critical or High findings.** Secret hygiene is
clean (history included), RLS is genuinely deny-by-default and was confirmed by live anon probing,
and public signups are disabled. The actionable items are two **Medium** operational hardening gaps
the project's own checklist already calls for (admin MFA not enabled; leaked-password protection
off), plus low/defense-in-depth items.

### Live vs inferred — what was tested against the running system

- **Tested live:** anon REST reads/writes on all four tables; anon RPC to `is_admin()`; anon storage
  list + upload; anon Edge Function call; anon signup attempt; GoTrue public settings; Supabase
  Security & Performance advisors; `pg_policies` / `pg_class` RLS state; `is_admin()` definition and
  EXECUTE grants; bucket config; auth user/provider/MFA counts; JWT role decode; full `git log -p`
  secret scan.
- **Inferred (not directly inspectable here):** the GitHub fine-grained PAT's scope/expiry and the
  Action's repo-variable values (live only in GitHub settings, not readable from this environment);
  the session-JWT access-token TTL (GoTrue admin setting not exposed on the public endpoint).

---

## Critical
None.

## High
None.

---

## Medium

### M1. Admin account has no MFA enrolled
- **What:** The single admin user (`auth.users` count = 1, email provider) has **0 verified MFA
  factors** (`select count(*) from auth.mfa_factors where status='verified'` → 0).
- **Why it matters:** The entire write-side security model collapses to one email+password. The
  project's own `supabase/README.md` security checklist requires "Admin account has 2FA/MFA." A
  phished/reused password is the most likely real-world compromise path for a one-admin CMS, and the
  admin can publish to a medical site.
- **Evidence:** live query of `auth.mfa_factors` (verified = 0); README checklist item is unchecked.
- **Fix:** Enrol TOTP MFA for the admin in the Supabase dashboard (Authentication → the user →
  enable MFA), and confirm the admin app surfaces the MFA challenge on login.

### M2. Leaked-password protection disabled
- **What:** Supabase Security Advisor reports `auth_leaked_password_protection` = **WARN**
  ("Leaked password protection is currently disabled").
- **Why it matters:** Without it, the admin can set a password already known in HaveIBeenPwned
  breach corpora — directly worsening the single-credential risk in M1.
- **Evidence:** `get_advisors(security)` returned the lint live.
- **Fix:** Dashboard → Authentication → Password security → enable "Leaked password protection"
  (and consider a minimum strength policy). Ref:
  https://supabase.com/docs/guides/auth/password-security

---

## Low

### L1. FAQ generator injects DB text into HTML/JSON-LD without escaping (defense-in-depth)
- **What:** `scripts/generate-faq.mjs` emits `a.title`, `a.description`, `a.cover_path`,
  `a.cover_alt` **raw** into HTML and into the `ld+json` block (lines ~111–127), e.g.
  `` `<h1>${a.title}</h1>${a.body_html}` `` and `` `"description": "${a.description}"` ``.
  `body_html` is intentionally verbatim (admin-authored canonical HTML — by design), but the other
  fields are unescaped, unlike `generate-team.mjs` / `generate-news.mjs`, which both escape via
  `esc()` / `escAttr()`.
- **Why it matters:** Low risk today because a single trusted admin authors content and 院長 reviews
  it before publish. But it is an inconsistency: a stray `"` or `</script>` in a title/description
  would break the page/JSON-LD, and a malicious value would inject script. Defense-in-depth wants the
  non-`body_html` fields escaped like the other two generators.
- **Evidence:** read of `scripts/generate-faq.mjs:111–130`; contrast with escaped sinks in
  `generate-news.mjs:86,108,115` and `generate-team.mjs:60–62`.
- **Fix:** Escape `title`/`description`/`cover_path`/`cover_alt` with the same `esc`/`escAttr` helpers
  (and JSON-encode the JSON-LD string fields), leaving `body_html` verbatim by design.

### L2. supabase-js loaded from CDN without Subresource Integrity or exact-version pin
- **What:** `admin/app.js:4` imports from
  `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm` — pinned only to **major v2** (rolls
  forward on every minor/patch) and with **no SRI hash**.
- **Why it matters:** A jsDelivr compromise or a malicious package release would execute in the
  admin's authenticated session (the one account that can write to the DB and trigger publishes).
  Supply-chain hardening item; affects the admin tool only, not the public site.
- **Evidence:** `grep` of `admin/app.js`.
- **Fix:** Pin an exact version (e.g. `@supabase/supabase-js@2.x.y`) and/or self-host the bundle
  under `admin/`. SRI on a bare ESM `import` URL isn't directly supported, so version-pinning +
  self-hosting is the practical mitigation.

### L3. Storage buckets have no size or MIME-type restrictions
- **What:** All three buckets (`doctor-photos`, `news-images`, `faq-images`) have
  `file_size_limit = null` and `allowed_mime_types = null` (public read = true).
- **Why it matters:** Anon write is correctly blocked (tested), so this only matters for the
  authenticated admin — but an unbounded, any-MIME public bucket means a compromised admin (see M1)
  or a fat-finger could upload arbitrarily large or non-image files served from the project domain.
- **Evidence:** `select … from storage.buckets` live.
- **Fix:** Set `file_size_limit` (e.g. a few MB) and `allowed_mime_types` (image/* ) on each bucket.

### L4. No Content-Security-Policy on served pages
- **What:** GitHub Pages can't set HTTP headers and no `<meta http-equiv="Content-Security-Policy">`
  is present on the public pages.
- **Why it matters:** A CSP would blunt the impact of any future injected markup. Optional hardening;
  not a live vulnerability. No `http://` mixed-content resources were found in the served HTML (good).
- **Fix:** Optionally add a restrictive meta CSP to the page template(s).

---

## Informational

### I1. `is_admin()` is executable by `authenticated` — by design, confirmed safe
- Security Advisor flags `authenticated_security_definer_function_executable` (WARN). This is the
  **known by-design** item documented in `supabase/README.md`. Confirmed live:
  `is_admin()` is `SECURITY DEFINER`, `STABLE`, with a **pinned `search_path=public`** (no
  search-path hijack), body limited to `select exists(select 1 from profiles where id=auth.uid()
  and role='admin' and active)`. EXECUTE is granted to `authenticated`/`postgres`/`service_role`
  only — **`anon`'s EXECUTE is revoked** (anon RPC returned `permission denied for function
  is_admin`, HTTP 401). It takes no arguments and discloses only the caller's own admin status. No
  action needed.

### I2. Edge Function CORS is `Access-Control-Allow-Origin: *`
- `regen-team` returns `*` for CORS. Low impact: the function independently verifies the caller's JWT
  + admin profile server-side before doing anything (an anon/cross-origin call still gets 401/403),
  so a permissive CORS origin grants nothing. Could be tightened to the admin's origin as hygiene.

### I3. Performance advisors (not security)
- `unindexed_foreign_keys` on `news.author_id` and `faq_articles.author_id` (INFO);
  `auth_rls_initplan` on `profiles_self_select` (re-evaluates `auth.uid()` per row — wrap as
  `(select auth.uid())`); `multiple_permissive_policies` on `doctors`/`news`/`faq_articles`/
  `profiles` for `authenticated` SELECT (the admin-ALL + public/self-SELECT overlap). All are
  scale/perf only, harmless at current row counts (1–17 rows); noted for completeness.

---

## What's already done right

- **Secret hygiene is clean, history included.** Full `git log -p --all` scan found **no**
  service-role key, `github_pat_`/`ghp_`/PAT, private key, AWS/Slack token, or hardcoded password.
  The only JWT anywhere in history decodes to **`role:anon`** (`ref:ysnrrkpusgdgzwkywddu`) — the
  browser-safe key, exactly as intended. The one match for `github_pat_`/`GITHUB_DISPATCH_PAT=` is a
  **placeholder in a comment** (`supabase/functions/regen-team/index.ts`: `github_pat_xxx`), not a
  real secret.
- **`.env` is gitignored; only `.env.example` (placeholders) is tracked.** Confirmed.
- **`admin/config.js` carries only the URL + anon key** (decoded: `role:anon`) — correct.
- **RLS is genuinely the gate, deny-by-default, confirmed live by anon probing:**
  - All four tables (`profiles`, `doctors`, `news`, `faq_articles`) and `storage.objects` have RLS
    **enabled**.
  - anon read of `profiles` → `[]` (not anon-readable). anon read of `doctors` → rows (public, by
    design). anon read of draft news / non-published FAQ → `[]` (only `status='published'` leaks).
  - anon **INSERT** doctors → `42501 row-level security policy` (HTTP 401). anon **UPDATE** news and
    anon **DELETE** faq returned HTTP 204/`[]` because the policies filtered them to **0 rows** —
    verified non-destructive: the news title and `faq q1` were **unchanged** afterward, and a
    `Prefer: return=representation` PATCH returned `[]` (zero rows touched).
  - anon **storage upload** to `news-images` → `403 new row violates row-level security policy`.
  - Policy audit (`pg_policies`): public SELECT limited to `status='published'` on news/faq and
    `true` on doctors only; every write policy is gated on `is_admin()`; `profiles` exposes only
    `id = auth.uid()` self-select + admin-all. No anon INSERT/UPDATE/DELETE anywhere.
- **Storage write policies are admin-only** across all three buckets (insert/update/delete each gated
  on `is_admin()` + correct `bucket_id`); anon write is blocked (tested). Public read is intentional
  (the static site references public object URLs / downloads them at build).
- **Auth is locked down:** GoTrue `disable_signup: true` (live signup attempt → `422
  signup_disabled`), `anonymous_users: false`, **only the `email` provider enabled** (all OAuth/SAML/
  phone/passkey off), exactly **one** user. Defense-in-depth signup lockout is in place.
- **Edge Function `regen-team` is properly admin-gated:** `verify_jwt: true`; it calls
  `auth.getUser()` then checks the caller's `profiles.role === 'admin' && active === true` before
  doing anything (anon call → `401 unauthorized`, verified live). It dispatches a **fixed**
  `event_type: 'doctors-changed'` to the **env-configured** repo (no caller-controlled repo/event
  injection), and the PAT is read from `Deno.env` secrets and never returned or logged (errors return
  only a status string). Returns 503 if the PAT/repo aren't configured.
- **Pipeline least-privilege:** `.github/workflows/regen-team.yml` sets `permissions: contents:
  write` only, uses repo **Variables** (not secrets) for the browser-safe URL/anon key, and commits
  via `GITHUB_TOKEN`. The generators interpolate DB content into HTML files (not into shell), so
  there's no DB→shell command injection in the commit step.
- **Frontend handles DB values safely in the admin app:** `admin/app.js` renders DB-sourced names,
  roles, and titles via **`textContent`** (e.g. `.dl-name`/`.dl-role`, `n.title`); the only
  `innerHTML` assignments are `''` or static markup with no DB interpolation. `generate-team.mjs` and
  `generate-news.mjs` escape all DB text via `esc()`/`escAttr()`.
- **`/admin/` is excluded from discovery:** `robots.txt` `Disallow: /admin/`; no `admin` references
  in `sitemap.xml` or `assets/search-index.js`; the admin app exposes nothing sensitive in page
  source (only `config.js`'s URL + anon key). No `http://` mixed-content resources in served HTML.

---

## Recommended priority order
1. **M1** — enrol admin MFA (highest real-world risk for a one-account CMS).
2. **M2** — turn on leaked-password protection (pairs with M1).
3. **L3 / L2 / L1** — bucket size+MIME limits; pin/self-host supabase-js; escape FAQ generator
   non-`body_html` fields.
4. **L4 / I2** — optional CSP; tighten Edge Function CORS.
5. **Operational:** record the GitHub PAT's expiry date and set a renewal reminder (the publish
   "Publish" button silently 503s when it lapses) — could not be inspected from here.
