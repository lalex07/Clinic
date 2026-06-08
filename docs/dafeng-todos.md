# 大豐耳鼻喉科 — To-Do & Improvements

Snapshot of what's left, in priority order. The site itself is feature-complete and polished
(booking modal, search, news, paginated FAQ, SEO, analytics, 404, NHI badge, mobile fixes). The
real finish line now is **content/data from 院長**, not code.

_Last reviewed: 2026-06-06_

---

## P1 — Blocked on 院長 (the actual finish line)

These are real-world facts the site can't invent. Best handled as one consolidated ask to 院長.

- [ ] **門診時間 / weekly schedule (§十一)** — still blank. This is the single most-wanted patient
      info ("when are you open, which doctor when"). Need the 醫師 × 院區 × 時段 table, or at least
      per-location hours. **Highest priority.**
- [ ] **Each doctor's confirmed specialties** — every doctor card still shows 「待醫師確認」.
- [ ] **林雅芳's full credentials / bio** — still 〔待補〕 (she's confirmed as a real, separate doctor;
      just missing her學經歷).
- [ ] **中山院區 details** — confirmed address, phone, and opening date (currently the placeholder
      "2026 年 10 月開幕・敬請期待"). Keep no surgery marketing until open.
- [ ] **Transit specifics on location pages** — the 〔待確認〕 items: 木柵 (all of MRT/bus/parking),
      新店 (buses + parking), and parking for every branch.
- [ ] **Equipment list for Services** — confirm actual 儀器/設備 (the 「請依實際設備調整」 flags).
- [ ] **Remaining doctor photos** — 蔡彥群 and 李順源 are still family-name monogram placeholders,
      awaiting their photos. (林諄儒/林雅芳 are intentionally anonymized; do not add photos for them.)
- [ ] **FAQ Q13–Q17** — drafted in faq.md, awaiting 院長 review → then publish (same workflow as
      Q8–Q12).
- [ ] **FAQ illustration strategy** — decide real illustrations vs the current placeholders, then
      fill the `.photo-zone` slots (must be constrained to the placeholder box per the design rule).

---

## P2 — Quick config / verification (do soon)

- [ ] **Paste the real Cloudflare Web Analytics token** — site.js currently has the placeholder
      `__CF_BEACON_TOKEN__`. Create the free account, add the site, paste the token. Analytics is
      wired but inert until then.
- [ ] **Verify the mobile 立即預約 fix on a real phone** — confirm the button both *shows up* and
      *opens the booking modal* when tapped (two separate things that can each break).
- [ ] **Git housekeeping** — re-link branch tracking if still loose
      (`git branch --set-upstream-to=origin/main main`), and confirm `origin/main` matches local
      after all the recent batches. Delete `Clinic-backup-pre-scrub.bundle` once you're confident
      the history scrub is fine.

---

## P3 — Buildable improvements (when ready)

- [ ] **Staff admin / CMS (Supabase)** — the planned next-phase project; see the Supabase admin
      plan doc. Start *after* the site is launch-ready (P1 done). It lets staff post 公告/FAQ and
      lets doctors edit their own profile, with 院長 approval. Not a quick batch — its own project.
- [ ] **/en/ English pages** — currently coming-soon stubs only. Build out if foreign / English-
      speaking patients are a goal. Sizeable chunk; mirror the CN structure, translate the §九
      banned-word list too.
- [ ] **Real photography** — once 院長 commissions a photographer, swap the remaining `.photo-zone`
      placeholders for real `<img>` (about timeline, location exterior banners, services scenes,
      locations cards, homepage team shot). Slots are pre-sized.
- [ ] **Proper Open Graph share image** — OG currently uses the logo; a dedicated 1200×630 share
      image would look better when links are shared on LINE/FB.
- [ ] **Facebook cover banner** — long-standing open item: pick the A/B/C variant in `brand_assets/`,
      delete the other two, rename the winner back to `facebook-cover.svg` / `-preview.png` (or
      commission a photo-based banner from a designer).

---

## Backlog / nice-to-haves

- [ ] **Periodic mobile QA** of interactive features as they're added (booking modal, search overlay,
      news filters, FAQ pagination) — phones are where modals/pickers most often break.
- [ ] **Keep sitemap.xml current** as new pages / FAQ articles are added.
- [ ] **Slogan refinement** — confirm/adjust the hero slogan if 院長 wants.
- [ ] **Custom calendar date picker on 最新消息** — was discussed (native input is in place now); only
      worth the custom build once there are many announcements to filter.
- [ ] **404 / analytics / NHI badge** — ✅ done (analytics pending its token).

---

## Notes / conventions (so nothing drifts)

- Run the **clinic-audit** skill before every commit (§九 compliance + design rules + a11y).
- Design rules are hard: no gradients / glows / blur, hover = lift not color, tinted-shadow tokens
  only, header always one line, placeholder images constrained to their box.
- §九 compliance on every page: no 保證/最/根治/唯一/第一/必須/一定要, no fees, no efficacy claims,
  footer disclaimer mandatory. No patient testimonials (medical-ad rule).
- Served `*.html` + `assets/` stay flat at the repo root (no nesting — breaks URLs); working docs in
  `docs/`; source assets in `brand_assets/`.
- 中山 stays "2026 年 10 月開幕・敬請期待" with no live surgery marketing until it opens.
