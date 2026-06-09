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

## Phase 2 — editable 最新消息 (news)

Same model as Phase 1, applied to 公告 / 最新消息: single admin writes; **public reads
PUBLISHED news only**; `news.html` stays static and is regenerated on publish.

**Table (`news`):** `title`, `body`, `clinic` (`xindian`/`muzha`/`xinglong`/`zhongshan`),
`date`, `image_path` (nullable), `status` (`draft`/`published`, default `draft`),
`author_id` (→ `auth.users`), `published_at`, timestamps + `updated_at` trigger.

**Security:** RLS deny-by-default, reusing `is_admin()`. Policies: **anon + authenticated
`SELECT` only where `status = 'published'`**; **admin full CRUD** (sees drafts too). Storage
bucket **`news-images`** — public READ (public object URLs), **writes restricted to
`is_admin()`** (parallel to `doctor-photos`; no broad listing policy). No new advisories.

**Admin:** the `/admin/` app gained a topbar switcher (醫療團隊 / 最新消息). The news view
mirrors the doctor editor — list + form (title, body, clinic, date, optional cover upload to
`news-images`, draft/published status). The doctor editor is unchanged.

**Regeneration:** `news.html` has `<!-- NEWS:START/END -->` markers inside `#newsGrid` (the
grid container, its `id`, and the `#newsEmpty` empty-state stay outside the markers, so the
page's clinic-filter + custom date-calendar JS keep working). `scripts/generate-news.mjs`
(mirror of `generate-team.mjs`) reads published news (date desc) with the anon key and renders
the exact `.news-card` markup; cover images are downloaded from the bucket into `assets/news/`
and referenced locally (zero runtime Supabase dependency). The Action
(`regen-team.yml`) now runs **both** generators on one dispatch and commits
`team.html assets/doctors news.html assets/news`. The `repository_dispatch` event name stays
`doctors-changed` (back-compat); it now regenerates both pages.

**§九 still governs published news.** Announcements follow draft → 院長 review → publish (a
reminder is shown in the admin news form). No patient testimonials. The 中山 announcement keeps
its「敬請期待」status. Run `clinic-audit` on the regenerated `news.html`.

---

## Phase 3a — 衛教專欄 (FAQ) migrated to Supabase (generator only; editor is 3b)

Same model again, for the 17 衛教專欄 articles. **This phase changed ZERO words** of
the existing articles — it migrated them into Supabase and built a byte-faithful
generator. There is **no admin editor and no new-article flow yet** (that is Phase 3b).

**Table (`faq_articles`):** `slug` (`q1`…`q17`), `title`, `excerpt` (the faq.html card
paragraph), `description` (meta + ld+json), `body_html` (the verbatim inner HTML of
`<article>` after the `<h1>`), `cover_path` (incl. any `?v=`), `cover_alt`, `category`,
`search_keywords`/`search_summary` (curated `search-index.js` data — only q1–q7 have
entries today), `sitemap_lastmod`, `status`, `display_order`, `author_id`, timestamps.
`description`/`search_*`/`sitemap_lastmod` exist so the static files reproduce exactly.

**Security:** RLS deny-by-default reusing `is_admin()` — anon `SELECT` published only,
admin full CRUD. Storage bucket **`faq-images`** mirrors the others (public read, admin
write + admin read-back SELECT for upload RETURNING).

**Byte-faithful generator (`scripts/generate-faq.mjs`):** regenerates ONLY the
marker-delimited regions from the DB, reproducing the current markup byte-for-byte:
- `faq.html` — `<!-- FAQ:START/END -->` around the `.faq-card` grid (the grid container,
  `#faqPagination`, and the pagination `<script>` stay outside the markers).
- each `faq-qN.html` — `<!-- ARTICLE:START/END -->` (hero `<figure>` + `<article>`),
  `<!-- BREADCRUMB:START/END -->` (the breadcrumb title), `<!-- LDJSON:START/END -->`
  (the `<head>` ld+json Article).
- `assets/search-index.js` — `/* FAQ:START/END */` around the `type:"faq"` entries
  (only articles that have curated `search_keywords`/`search_summary` are emitted).
- `sitemap.xml` — `<!-- FAQ:START/END -->` around the `faq-qN.html` `<url>`s.

Covers download from `faq-images` into `assets/faq/` (bucket wins) and are referenced by
local path — zero runtime Supabase dependency. The Action (`regen-team.yml`) now runs all
three generators on one dispatch and commits the FAQ files too. **§九 governs all
articles; 院長-approved copy is inserted verbatim and never reworded.** The Phase-3a seed
(`migrations/…_phase3a_seed_faq_articles.sql`) holds the 17 articles verbatim and was
verified md5-equal to the static files, field by field.

---

## Files

- `migrations/` — Phase-1 (schema, storage, hardening) + Phase-2 (news schema, news-images
  storage, news seed) migrations.
- `functions/regen-team/` — the admin-gated regeneration trigger (Edge Function; one dispatch
  now regenerates both team.html and news.html).
- `../admin/` — the login-gated editor (`index.html`, `app.js`, `admin.css`, `config.js`) —
  doctors **and** news.
- `../scripts/generate-team.mjs`, `../scripts/generate-news.mjs` — the static regenerators (approach A).
- `../.github/workflows/regen-team.yml` — the GitHub Action (regenerates both pages).
- `../.env.example` — template for `SUPABASE_URL` / `SUPABASE_ANON_KEY`.
