# Supabase backend — Phase 1: editable 醫療團隊 (doctors)

Phase 1 of the staff CMS in `docs/supabase-admin-plan.md`. It makes the **doctor
page editable** without giving up the static public site:

- **Public site stays static.** `team.html` is plain HTML on GitHub Pages with
  **zero runtime Supabase dependency**. The doctor cards are regenerated from the
  database only when data changes (approach A).
- **Editing** happens in a separate, **login-gated** admin app under `/admin/`.
- **Security gate is RLS**: anyone can *read* doctor data (it is public info), but
  only the single **admin** account can write.

```
  Visitors ─► team.html (static, GitHub Pages)
                 ▲  regenerated on change by scripts/generate-team.mjs (GitHub Action)
                 │
  Admin ─► /admin/ (anon key + Supabase Auth) ─► Supabase (Postgres + RLS + Storage)
                 │  "Publish" ─► Edge Function ─► repository_dispatch ─► the Action
```

Project ref: `ysnrrkpusgdgzwkywddu` · URL: `https://ysnrrkpusgdgzwkywddu.supabase.co`

---

## What Phase 1 created

**Tables (schema in `migrations/`):**
- `profiles` — one row per staff account: `id` (= auth user id), `full_name`,
  `role` (`admin`/`doctor`/`nurse`, default `admin`), `active`, timestamps.
- `doctors` — `slug`, `name`, `role`, `specialty`, `specialty_pending` (the
  「待醫師確認」marker), `credentials` (jsonb array), `clinics` (jsonb array of
  `{label,url}`), `photo_mode` (`photo`/`anon`/`placeholder`), `photo_path`,
  `display_order`, timestamps + `updated_at` trigger.

**Security:**
- RLS **deny-by-default** on both tables.
- `is_admin()` = `exists(select 1 from profiles where id = auth.uid() and role='admin' and active)`
  (SECURITY DEFINER so it can check `profiles` without tripping that table's own RLS).
- Policies: **anon `SELECT` on `doctors`** (all rows); **admin full CRUD** on
  `doctors` and `profiles`; a user may read their own `profiles` row. Nothing else.

**Storage:** a public `doctor-photos` bucket — **public READ**, **writes restricted
to `is_admin()`**.

**Edge Function:** `regen-team` — admin-gated; triggers the GitHub regeneration.

> One database-linter advisory remains by design: *"Signed-in users can execute
> SECURITY DEFINER function `is_admin()`"*. The RLS policies on `doctors`/`profiles`
> call `is_admin()`, so the `authenticated` role **must** be able to execute it. The
> function takes no arguments and returns only whether the *current caller* is an
> admin — it discloses nothing about other users. `anon`'s EXECUTE was revoked.

---

## One-time setup (Supabase dashboard)

These steps need the dashboard / CLI and are **not** done from code:

1. **Disable public sign-ups.** Dashboard → **Authentication → Sign In / Providers
   → Email**: turn **OFF** "Allow new users to sign up" (`DISABLE_SIGNUP`). Only the
   manually-created admin may authenticate. (Optionally also turn off other providers.)
2. **Create the one admin user.** Dashboard → **Authentication → Users → Add user**
   → enter the clinic admin email + a strong password (confirm email if prompted).
   Copy the new user's **UID**.
3. **Insert the admin profile row.** Dashboard → **SQL Editor**:
   ```sql
   insert into public.profiles (id, full_name, role, active)
   values ('PASTE-ADMIN-UID-HERE', '管理員', 'admin', true);
   ```
4. **Enable 2FA (MFA)** for that admin account, and require HTTPS for the admin app.

The `doctors` table is already seeded from the existing `team.html` (7 doctors).

---

## Keys — what is safe where (read this before touching secrets)

| Secret | Safe in browser / repo? | Where it goes |
|---|---|---|
| **Project URL** | ✅ yes | `admin/config.js`, `.env`, repo variable `SUPABASE_URL` |
| **anon key** (or `sb_publishable_…`) | ✅ yes — public by design; RLS is the gate | `admin/config.js`, `.env`, repo variable `SUPABASE_ANON_KEY` |
| **service-role key** | ❌ **NEVER** | not used in Phase 1 at all; bypasses RLS — server-only if ever needed |
| **GitHub PAT** (fine-grained, `contents:write` + dispatch) | ❌ **NEVER in browser/repo** | only in the `regen-team` Edge Function's **secrets** (or the DB webhook config) |

`.env` is **gitignored**; commit only `.env.example`. `admin/config.js` intentionally
contains the URL + anon key (browser-safe).

---

## Publishing changes to the live site

The admin app never writes HTML. Editing writes to Supabase; a regeneration step
rebuilds `team.html`. Three ways to trigger it, in order of automation:

### Baseline (always works, no secrets beyond repo variables)
- Add repo **Variables** (Settings → Secrets and variables → Actions → *Variables*):
  `SUPABASE_URL` and `SUPABASE_ANON_KEY` (browser-safe — variables, not secrets).
- Run locally: `node scripts/generate-team.mjs` (reads `.env`), commit `team.html`.
- Or GitHub → **Actions → "Regenerate team.html" → Run workflow** (`workflow_dispatch`).

The Action (`.github/workflows/regen-team.yml`) runs the generator and commits
`team.html` + any new `assets/doctors/` images using `GITHUB_TOKEN` (contents:write).

### Automatic — the admin "Publish" button (Edge Function)
The `regen-team` function is deployed and JWT-verified. To arm it:
```bash
supabase secrets set GITHUB_DISPATCH_PAT=github_pat_xxx GITHUB_REPO=owner/repo
```
- The **PAT** must be a *fine-grained* token scoped to this repo with
  **Contents: Read and write** (and it implicitly allows `repository_dispatch`).
  It lives **only** in the function's secrets — never in the browser.
- Then the admin "發佈到網站" button calls the function → `repository_dispatch`
  (`doctors-changed`) → the Action regenerates + commits. Until the secret is set the
  function returns **503** and the button shows the manual fallback instructions.

### Fully automatic — Database Webhook (optional, no button needed)
Dashboard → **Database → Webhooks → Create**:
- Table `public.doctors`, events **INSERT/UPDATE/DELETE**.
- Type **HTTP Request**, method **POST**, URL
  `https://api.github.com/repos/OWNER/REPO/dispatches`.
- Headers: `Authorization: Bearer github_pat_xxx`, `Accept: application/vnd.github+json`,
  `Content-Type: application/json`, `User-Agent: dafeng-webhook`.
- Body: `{ "event_type": "doctors-changed" }`.
The PAT lives **server-side in the webhook config**. With this on, every saved edit
auto-regenerates; the "Publish" button becomes optional.

---

## How photos flow (zero runtime dependency)

- Seeded doctors reference photos already committed at `assets/doctors/*.jpg`.
- When the admin uploads a new photo it goes to the `doctor-photos` bucket under the
  key `<slug>.<ext>`, and `photo_path` is set to `assets/doctors/<slug>.<ext>`.
- On regeneration the generator, for each `photo`-mode doctor, **downloads the bucket
  object into `assets/doctors/` (bucket wins as source of truth)** and references the
  **local** path. If no bucket object exists (the seed case) it keeps the committed
  local file. The published page therefore never calls Supabase at runtime.

---

## Security checklist

- [ ] Public sign-ups **disabled**; only the manually-created admin can log in.
- [ ] Admin account has **2FA/MFA** and a strong password.
- [ ] Admin app served over **HTTPS** only.
- [ ] **RLS is the gate** — never trust the client. anon = read doctors only; admin = write.
- [ ] **service-role key** is never shipped to the browser or committed (Phase 1 doesn't use it).
- [ ] **GitHub PAT** only in the Edge Function secret / webhook config — never in repo or browser.
- [ ] `.env` is gitignored; only `.env.example` is committed.
- [ ] **§九 still governs any published content.** Doctor specialties keep their
      `待醫師確認` pending flags; 院長 reviews medical copy before publish. No
      patient testimonials. Run `clinic-audit` on the regenerated `team.html`.

---

## Files

- `migrations/` — the three Phase-1 migrations (schema, storage, hardening).
- `functions/regen-team/` — the admin-gated regeneration trigger (Edge Function).
- `../admin/` — the login-gated editor (`index.html`, `app.js`, `admin.css`, `config.js`).
- `../scripts/generate-team.mjs` — the static regenerator (approach A).
- `../.github/workflows/regen-team.yml` — the GitHub Action.
- `../.env.example` — template for `SUPABASE_URL` / `SUPABASE_ANON_KEY`.
