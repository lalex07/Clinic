# 大豐耳鼻喉科 — Staff Admin / CMS Plan (Supabase)

Draft plan for a staff content-management system on top of the existing static site. The
guiding principle: **keep the public site static** (fast, free, SEO-friendly, 院長-approved)
and add a **separate gated admin** backed by Supabase that staff use to create content, with
院長 review before anything goes live.

> This is a multi-session project, not a single batch. Recommended only **after** the core
> site is launch-ready (contact page + real clinic data). Treat each phase below as its own
> scoped piece of work.

---

## 1. Goals & scope

**In scope**
- Staff log in to an admin area.
- Two staff roles — **doctor** and **nurse** — can create/edit **公告 (news)** and **FAQ
  (衛教專欄)** articles, and upload images.
- **Doctors** can additionally edit **their own** 醫療團隊 profile — and *only* their own.
- A **review/approval step**: staff create drafts; content is published only after approval.
  (Non-negotiable for a medical site under §九 — see §7.)

**Out of scope (staff cannot touch)**
- Site structure, navigation, layout, design system, CSS/JS — the "website foundation."
- Other doctors' profiles; other staff's accounts.
- Anything that publishes without review.

**Recommended third role:** an **admin/approver** (this should be 院長 or a manager). Your
brief named two roles, but someone has to be the compliance gatekeeper who approves content.
I recommend `admin` = 院長, who can approve/publish and manage accounts. Confirm this.

---

## 2. Architecture (hybrid)

```
  Public visitors ──► Static site (GitHub Pages)  ◄── reads PUBLISHED content only
                          ▲
                          │  (on publish: regenerate pages, or fetch at runtime)
                          │
  Clinic staff ──► Admin app (gated)  ──►  Supabase
                                           ├─ Auth (login, roles)
                                           ├─ Postgres DB (news, faq, doctors, profiles)
                                           ├─ Row-Level Security (per-role + per-doctor rules)
                                           └─ Storage (uploaded images)
```

- **Public site:** stays static HTML/CSS/JS. It never talks to the admin; it only ever sees
  *published* content.
- **Supabase:** hosts auth, the database, permissions (RLS), and image storage.
- **Admin app:** a small, separate, login-gated app (can itself be static + the Supabase JS
  client). Staff never get repo or hosting access.

**Why Supabase over the alternatives** (recap): it's the only option that cleanly enforces the
"each doctor edits only their own profile" rule (via row-level security) and a draft→approve
workflow, while letting you keep the static site. Git-based CMSs can't do per-user row
permissions; WordPress means abandoning the site and taking on its security-patching burden.

---

## 3. Data model (Postgres)

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id` (= auth user id), `full_name`, `role` (`admin`/`doctor`/`nurse`), `doctor_id` (→ doctors, nullable), `active` | One row per staff account; `doctor_id` links a doctor account to their profile row. |
| `doctors` | `id`, `name`, `slug`, `clinic`, `title`, `credentials` (jsonb/text), `photo_mode`, `display_order` | Powers 醫療團隊. A doctor account edits only the row where `doctors.id = their profiles.doctor_id`. |
| `news` | `id`, `title`, `body`, `clinic_tag`, `image_path`, `status` (`draft`/`pending`/`published`), `author_id`, `reviewed_by`, `published_at`, timestamps | 公告 / 最新消息. |
| `faq_articles` | `id`, `title`, `body`, `category_tag`, `image_path`, `slug`, `status`, `author_id`, `reviewed_by`, `published_at`, timestamps | 衛教專欄 articles (mirrors the current faq-qN structure). |
| `audit_log` (optional) | `id`, `actor_id`, `action`, `entity`, `entity_id`, `at` | Who changed/published what — useful accountability on a medical site. |

`status` drives the workflow everywhere: `draft` → `pending` (submitted) → `published`
(approved) — or back to `draft` with a review note.

---

## 4. Auth & roles

- **Supabase Auth** (email + password, or magic-link). Do **not** roll your own auth.
- Accounts are created/invited by the `admin` (院長) — no public signup.
- On login the app reads the user's `profiles.role` and shows only what that role can do.
- Strongly recommend **2-factor auth** for staff accounts and a sensible password policy —
  this is a clinic, accounts are a real attack surface.

| Role | News / FAQ | Own doctor profile | Approve & publish | Manage accounts |
|---|---|---|---|---|
| **nurse** | create/edit own drafts | — | — | — |
| **doctor** | create/edit own drafts | edit own only | — | — |
| **admin (院長)** | full | all | ✅ | ✅ |

---

## 5. Authorization (Row-Level Security) — the heart of it

RLS is enabled on every table, **deny-by-default**, then policies grant the minimum. Sketches:

- **Public read (anon key):** `SELECT` on `news`/`faq_articles` only where `status = 'published'`;
  `SELECT` on `doctors` (the team list).
- **Staff drafts:** authenticated doctors/nurses can `INSERT` rows (forced to `status='draft'`,
  `author_id = auth.uid()`) and `UPDATE`/`SELECT` rows where `author_id = auth.uid()` **and**
  `status <> 'published'`.
- **No self-publishing:** a policy/trigger prevents anyone but `admin` from setting
  `status='published'` (so staff can't bypass review).
- **Per-doctor profile rule:** on `doctors`, doctors may `UPDATE` only the row where
  `id = (select doctor_id from profiles where profiles.id = auth.uid())`. This is the clean,
  database-enforced version of "廖學森 can only edit 廖學森."
- **Admin:** full access; the only role that can publish or manage accounts.
- The **service-role key** (which bypasses RLS) is used **only** server-side (e.g. a publish
  function) and is never shipped to the browser.

---

## 6. Editorial / publish workflow

1. Nurse or doctor writes a 公告 or FAQ → saves as **draft**.
2. They **submit for review** → `pending`.
3. **院長 (admin)** reviews against §九, then **approves** (`published`) or sends back with a
   note.
4. On publish, the public site reflects it (see §8).

This mirrors your *current* "draft → 院長 review → publish" FAQ workflow — just operationalized
so staff can do steps 1–2 themselves.

---

## 7. Compliance & security (medical site — take seriously)

- **§九 still applies to everything staff publish.** The approval gate is the safety net:
  nothing medical goes live without 院長 sign-off. Patient testimonials remain banned
  regardless of who posts.
- Consider running the existing **clinic-audit** check on generated pages as part of publish.
- **Security:** Supabase Auth + RLS (never trust the client), 2FA for staff, anon key limited
  to published-read, service-role key server-only, admin app over HTTPS, restrict accounts to
  known clinic emails. Keep the `audit_log` so there's a record of who published what.

---

## 8. How the public static site shows published content — key decision

Two approaches (you'll pick one; can start simple and evolve):

- **A — Generate on publish (best for SEO).** When 院長 publishes, a Supabase Edge Function
  triggers a GitHub Action that regenerates the affected static pages (news cards, FAQ cards,
  individual `faq-qN.html` article pages) from templates and commits them → GitHub Pages
  redeploys. The public site stays 100% static; article pages remain individually indexable.
  More moving parts to set up.
- **B — Fetch at runtime (simplest to start).** The list pages (`news.html`, `faq.html`) load
  published rows from Supabase via the JS client on page load. Fast to build; downside is those
  lists become JS-rendered (weaker SEO for the list pages, and a runtime dependency on
  Supabase).

**Recommendation:** keep **individual article pages generated/static (A)** for SEO, since
that's where the search value is; the **list pages can start on B** and move to A later. Decide
this before Phase 4.

---

## 9. Hosting & cost

- **Public site:** stays on GitHub Pages (Pages + Actions supports approach A).
- **Admin app:** can be a static app on GitHub Pages / Netlify / Vercel (it's just the Supabase
  client behind a login).
- **Supabase free tier** (verify current limits) is ample at clinic scale — roughly 500MB DB /
  1GB storage / tens of thousands of monthly users. Watch the free-tier "pause after inactivity"
  behavior; with regular staff use it's fine, or the ~US$25/mo Pro tier removes the worry.
- Net: likely **free to a few dollars a month**.

---

## 10. Staged build sequence

- **Phase 0 — Prereqs:** finish the site launch (contact page, real data). Confirm the three
  roles, and pick the §8 rendering approach. *(Do this first.)*
- **Phase 1 — Supabase foundation:** create the project; build the schema; enable RLS + write
  policies; set up Auth; seed roles and a couple of test accounts. **Test the permissions hard**
  (especially the per-doctor rule and no-self-publish) before any UI.
- **Phase 2 — Admin app, news first:** login, role-aware dashboard, news draft→submit, image
  upload, and 院長 approve/publish. Prove the whole loop on one content type.
- **Phase 3 — FAQ + doctor profiles:** add FAQ articles to the admin; add the doctor-profile
  editor with the per-doctor RLS.
- **Phase 4 — Wire the public site:** generate-on-publish for article pages (and/or runtime
  fetch for lists) per §8.
- **Phase 5 — Hardening:** approval-workflow polish, clinic-audit on publish, a security review,
  audit logging, and staff onboarding/training.

Each phase is independently testable and shippable.

---

## 11. Decisions needed before Phase 1

1. **Roles:** confirm `admin` (院長) as approver, plus `doctor` and `nurse`.
2. **Who gets accounts**, and what email domain.
3. **Rendering approach** (§8 A vs B, or the hybrid I recommended).
4. **Do doctor profiles become DB-editable now**, or stay static for v1 and add later? (Editing
   own profile is a stated requirement, so likely yes — but it's the trickiest RLS piece.)
5. **Budget:** free tier vs Pro.
6. **Admin app stack:** plain HTML/JS + Supabase client (matches your no-build ethos) vs a small
   framework.

## 12. Risks

- **Security** is the big one — it's a medical site with staff accounts. Lean on Supabase's
  built-in auth + RLS; don't improvise.
- **Scope creep** — keep v1 to news + FAQ + own-profile; resist adding more until it's solid.
- **Maintenance** — someone owns this long-term (accounts, updates, the publish pipeline).
- **Free-tier limits/pausing** — fine at this scale, but know the behavior.
- **SEO** — if list pages go runtime-only, keep article pages static (A) so search value holds.
