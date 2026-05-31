# 進度筆記 / Progress — 大豐耳鼻喉科 website

Orientation note for the next session. See `site-spec.md` for the full content brief (source of truth) and `CLAUDE.md` for the rules (design rules + compliance live there).

_Last updated: 2026-05-31_

## 🗓️ 2026-05-31 (session 5) — Facebook cover banner (marketing asset)

- **`brand_assets/facebook-cover.svg`** — 820×312 FB cover, self-contained SVG. Two-panel composition in Dafeng's design language: LEFT teal (`--primary`) panel with 4 line-icon specialties (一般耳鼻喉／睡眠呼吸中止／眩暈／頭頸部, reusing the site's icon paths) + the slogan "新店・文山在地深耕 / 三院區守護全家人的呼吸與睡眠"; a crisp terracotta seam; RIGHT cream panel with the **logo embedded inline as base64** (512px, from the 1200px `assets/logo.png`) + 大豐耳鼻喉科聯合診所 / DAFENG ENT CLINIC / 四院區 wordmark. Fully vector except the logo (11 `<text>`, 17 shapes, 1 raster). Solid blocks only — no gradients, no glows (verified). Fonts via Noto `@import` + CJK fallback stack (true CJK font-binary embedding is multi-MB, impractical).
- **`brand_assets/facebook-cover-preview.png`** — **1640×624** PNG export (2× of the 820×312 display = Facebook's recommended upload size; rendered via Chrome headless at `--force-device-scale-factor=2` with Noto loaded). Crisp text/icon edges, sharp logo — ready to upload to Facebook.
- **Mobile-safe:** left content inset to ~x88 and right content centered at x640 so the slogan, all icons, logo, and wordmark survive Facebook's ~90px mobile side-crop (verified by simulating the center-640 crop).
- ⚠️ This is an **SVG composition, not photographic**. If 院長 wants a photo-based banner (real doctors/clinic, like the Caringlink reference), this won't deliver that — recommend Canva or a freelance designer.

## 🗓️ 2026-05-31 (session 4) — Glow removal + symmetric hero spacing

- **Removed the eyebrow-pill glow site-wide.** The `.eyebrow` pills (interior `.page-head .eyebrow` in `site.css` + homepage `.eyebrow` in `index.html`) carried `box-shadow: var(--shadow-sm)`, whose teal-tinted blur wrapped the small rounded pill as a soft halo. Dropped the shadow; the 1px `--primary-soft` border now gives crisp definition.
- **Removed `backdrop-filter: blur` from the sticky header** (`.site-header`). Header is now solid opaque `--bg` (no frosted-glass/aura); `.scrolled` just adds the bottom border. Verified: zero `backdrop-filter`, zero `filter: blur` / `drop-shadow` anywhere. (The only `filter:` left is the color-only saturate/brightness/contrast on doctor photos — allowed.)
- **All remaining `box-shadow`s confirmed grounded** — every one uses `--shadow-sm/md/lg` (or `none` / the inset white hairline on the hero avatar). No glow-blur values.
- **Symmetric vertical breathing on the Services 中山 teaser.** The mint `.svc-soon` box sat flush against the `.svc-cta` band below; added `.svc-soon-sec { padding-bottom: var(--s-7) }` so it floats with equal cream space above (from `.svc-list` padding-bottom) and below. Audited Team / About / Locations / Home heroes — all already balanced via section padding.
- **CLAUDE.md:** tightened the glow rule to **"No glows, halos, auras, or blurred light effects" (zero tolerance**, incl. backdrop-filter/filter blur), and added **"Symmetric vertical breathing on hero/intro blocks."**
- **Verified** with hard-refresh screenshots (`temporary screenshots/f-*`): team eyebrow close-up (crisp, no halo), services teaser (symmetric), home/locations/about heroes (crisp pills, solid header, balanced spacing).

## 🗓️ 2026-05-31 (session 3) — Two global cleanups

- **Removed ALL "創辦" badges site-wide.** Dropped the founder/cohort pills (新店共同創辦・2010, 木柵創辦・2019, 興隆創辦・2025) from every `team.html` doctor card and deleted the `.doc__badge` / `.doc__badge--founder` CSS. The founding-院長 story now lives only as prose in the About timeline + site-spec.md — no badge chrome restating it. Verified: zero `doc__badge` / `創辦`-pill matches.
- **Removed ALL gradients site-wide** (now a hard rule). Replaced every linear/radial gradient with a solid token: page-head & hero washes (`site.css`, `index.html`) → flat cream; eyebrow pills → `--surface`; hero avatar disc → `--surface`; section bands (features / timeline / sched-band / svc-cta) → `--bg-2`; teaser/banner panels (svc-soon, soon-banner, loc-card--soon) → `--primary-soft` / `--bg-2`; map placeholder stripes → `--bg-2`. Verified: **zero** `linear-gradient` / `radial-gradient` across all `.html` + `.css`. (Body bg was already a single solid color; SVG grain texture is not a gradient, kept.)
- **CLAUDE.md:** added hard **"No gradients."** rule (supersedes the old "no gradient *accents*"); depth now comes from layered shadows, spacing, typography, and solid tonal blocks only.
- **Verified** with hard-refresh screenshots (`temporary screenshots/v-*`): home, team, services (incl. 中山 teaser), locations, about — every block is a clean solid fill.

## 🗓️ 2026-05-31 (session 2) — Team page + restraint principle

- **醫療團隊 `team.html` built** — 7 doctors from the **updated site-spec §五 roster**, grouped by 院區 with each location's 院長 leading: 新店（蔡彥群院長・2010共創 → 廖學森・2010共創 → 林諄儒）→ 木柵（蕭仁豪院長・2019 → 林雅芳・2019）→ 興隆（李順源院長・2025 → 巫靚穎 小兒專科・2025）. CureClinic-inspired card IA (portrait → name+role → trimmed 4–5 credential bullets), adapted entirely to Dafeng's own design system (palette, serif headings, tinted shadows, lift-only hover). **創辦院長 (2010)** surfaced as an accent badge on 蔡彥群 & 廖學森, visible at first glance.
- **Real doctor portraits in `assets/doctors/`** (resized from `brand_assets/`, originals untouched): **廖學森** `liao-hsueh-sen.jpg`, **蕭仁豪** `hsiao-jen-hao.jpg`, **巫靚穎** `wu-ching-ying.jpg`, **林諄儒** `lin-chun-ju.jpg`. Uniform rounded-square container (4:5, object-fit cover, faint warm overlay) so real photos + placeholders read as one coherent set.
  - ⚠️ **Filename character mismatches** flagged for 院長 in site-spec §五: photo files were named `廖學生`(→學森) and `巫婧穎`(→靚穎) — confirm correct characters.
  - **Still using shared placeholder cards** (family-name char on primary-soft, `<!-- TODO -->`): **蔡彥群, 林雅芳, 李順源** — awaiting their photos.
  - **小兒專科 identity resolved**: 巫靚穎 = the "1 位小兒專科醫師" referenced site-wide. (Task prompt's roster was pre-update; site-spec §五 7-doctor roster is the truth and added 林諄儒.)
- **EN stub** `en/team.html` added (coming-soon pattern, 中文｜EN toggle), matching existing `/en/` placeholders.
- **"Restraint over density" added to CLAUDE.md** design rules (inspired by cureclinictw.com, which 院長 prefers; Caringlink/HomePro felt overpowering). One focal idea per section, short paragraphs, whitespace as a feature, prefer 3–6 considered items over grids-of-many.
- **Design review saved to `design-review.md`** — specific, actionable proposals (not applied yet) for Services / Locations / About against the new principle, with per-item impact ratings + a priority table. Awaiting 院長 review before applying.
- **Verified**: compliance scan clean (no 保證/最/根治/唯一/第一); desktop/tablet/mobile screenshots in `temporary screenshots/team-*`; per-row card heights uniform; founder badges legible. Specialties all marked 「待醫師確認」, §十一 schedule still blank.
- **Still awaiting from 院長**: photos for 蔡彥群/林雅芳/李順源; confirmed specialties + clinic schedules; the two filename-character confirmations.

## 🗓️ 2026-05-31 — today's work

- **Slogan reordered → 新店・文山 first** (`新店・文山在地深耕…`). 新店 now leads because it is the founding location (2010); 文山 came with 木柵 (2019) + 興隆 (2025). Applied to `index.html` hero, `about.html` (title / meta description / hero lead), and the canonical slogan in `site-spec.md` §二-B.
- **QR images cropped clean** — all 5 `assets/qr/*` cropped to a tight square + ~5% quiet-zone padding, removing the baked-in clinic-name text band beneath the QR (e.g. "興隆大豐耳鼻喉科診所", "大豐耳鼻喉科診所(新店)"). Filenames unchanged; HTML labels above/below the QR are untouched. Verified on the 興隆 detail page. _Originals preserved in git at commit `1024099` (`git show 1024099:assets/qr/<file>`)._
- **Inter-section spacing tightened one step, globally** — `--s-7` 4.5→3.5rem and `--s-8` 6.5→5rem in `assets/site.css`. Calmer hero→section gap on every page (About hero→發展歷程 was the worst offender); still breathable for Chinese typography. Re-screenshotted home / About / Services / Locations to confirm.
- **About page** (`about.html`) is built — hero + founding-history **timeline 2010→2019→2025→2026** + 廖學森 credibility callout. (Pending 院長 review of the founding narrative.)
- **Bilingual scaffolding live** — `中文 | EN` toggle in the header of every CN page; `/en/` is a placeholder (coming-soon + LINE QRs) until CN content is approved.
- **Live + approved** — GitHub Pages is live at **https://lalex07.github.io/Clinic/** and 院長 (Alex's dad) has **approved the design direction**.

**Content/data added to `site-spec.md`:**
- New doctors on the roster: **林雅芳** (木柵, joined 2019) and **巫靚穎** (興隆, joined 2025).
- **廖學森醫師**'s **萬芳醫學中心** affiliation and **兒童睡眠呼吸中止症手術經驗** now documented — use as the clinic's **institutional differentiator** (already surfaced in the About credibility callout; carry into the Team page).

> ⚠️ One API crash mid-session may have left partial state. Today's three fixes were committed (`e009bcc`) and verified after the crash, but **next session should re-confirm** slogan, QR crops, and spacing all rendered correctly before moving on.

---

## ⏭️ NEXT SESSION (start here)

1. **Verify today's changes rendered correctly** — a mid-session API crash may have left partial state (it didn't, but confirm). Preview locally and check: hero slogan reads **新店・文山在地深耕**; all 5 QR cards show clean squares with **no baked-in clinic-name text**; inter-section gaps are tighter (esp. About hero→發展歷程). All committed in `e009bcc`.
2. ~~Build 醫療團隊 / Team~~ ✅ **Done** (2026-05-31 session 2 — see top of file). Next candidates: **預約掛號 / Contact** (§八), **全院區門診總表** (§十一, needs schedule data), or apply approved items from `design-review.md`.
3. **Review `design-review.md` with 院長** — decide which restraint-pass simplifications to apply to Services / Locations / About.

**Live site:** GitHub Pages live → **https://lalex07.github.io/Clinic/** (deploys from the default branch, no build step). 院長 (Alex's dad) has **approved the design direction** (palette, tone, layout) — build the rest on this foundation.

---

## ❓ Open questions for 院長 (blocking real content)

These are the `〔待補〕` items that need his input before pages can be finalised:

- **Slogan refinement** — confirm/adjust the hero slogan (currently §二 slogan B).
- **Doctor data** — confirm each doctor's **credentials, specialties, and clinic schedules** (§五 bios are "待確認"; 醫師 × 院區 × 時段 table §十一 is blank).
- **中山院區** — **address, phone, and confirmed opening date** (currently all `待補`; presented as "2026 年 10 月開幕・敬請期待").
- **Equipment list for Services** — confirm actual 儀器/設備 (the §三/§四 `（請依實際設備/服務調整）` flags).
- Also outstanding: per-location 門診時間, 交通/地圖, LINE booking deep-links; 看診醫師 per院區.

---

## ✅ Done so far

### Architecture — shared stylesheet
- **`assets/site.css`** — design tokens, reset, grain overlay, header/nav, **`.lang-toggle`**, buttons, `.sec-head`, `.page-head` (interior banner) + breadcrumb, footer, `.reveal`, `.skip-link`, editorial flags (`.review-note`, `.tbd`), responsive (incl. mobile header fit).
- **`assets/site.js`** — sticky-header border, mobile nav toggle, IntersectionObserver reveal (no-JS / reduced-motion fallback).
- **`assets/locations.css`** — components for the location hub + detail pages.
- **When building new pages:** link `assets/site.css` + `assets/site.js`, copy the header (with the `中文 | EN` toggle) + footer verbatim, set `aria-current="page"` on the active nav item, add page-specific CSS inline (or a new `assets/<page>.css`). Nav order: 關於大豐 / 診療項目 / 醫療團隊 / 院區・門診 / 衛教專欄; CTA → `contact.html`.

### Design rules (now codified in `CLAUDE.md` → "Design rules")
Applied site-wide:
- **No glows / halos / glare** — dots/pills/badges are flat solid shapes (stripped the eyebrow-dot halos).
- **No multi-color gradient accents** — killed the teal→terracotta hover bars on cards and the terracotta blob in hero/page-head backgrounds (now single-hue teal+cream washes for depth only).
- **Hover = lift, not color** — cards translate up + deepen shadow; `transform`/`box-shadow` only, never `transition: all`.
- **Shadows** use the `--shadow-sm/md/lg` tinted tokens (depth, not light emission).

### Pages built
- **Homepage `index.html`** — hero, 3 quick-entry cards, 5 feature highlights, footer. Refactored onto `site.css`.
- **Locations** — `locations.html` hub (4-card 院區切換 + 門診總表 call-out) + `location-xindian/-xinglong/-muzha.html` (full detail: 門診時間 table `待補`, 交通/地圖 placeholders, contact sidebar, **real LINE QR cards** from `assets/qr/`, schema.org `MedicalClinic`). `location-zhongshan.html` = coming-soon (future tense, no QR, no surgery 招攬).
  - QR pairing: 新店 & 木柵 → general + shared `xindian-muzha-surgery-line.png`; 興隆 → general + `xinglong-surgery-line.png`.
- **Services `services.html`** (§四) — 4 blocks (一般耳鼻喉 / 睡眠呼吸中止症 / 眩暈 / 頭頸部腫瘤, last 3 tagged 特色門診) with symptom pills, approach text, warning-sign callouts, 醫師/院區 cross-links; + 中山手術中心 teaser (future tense, info-only CTA). Compliance-clean (no `最` at all).
- **About `about.html`** (§零/§三) — hero, founding story (uses §三 ethos), **timeline 2010→2019→2025→2026** (centerpiece; 2026 in accent, "預計 10 月開幕"), 廖學森 萬芳醫學中心 + 兒童睡眠手術 credibility callout, community/values section, CTA. **Built; pending dad review.**

### Bilingual scaffolding
- **`中文 | EN` header toggle** on every CN page (no flags; active = primary, inactive = ink-faint). CN → `/en/…`, EN → back to root.
- **`/en/`** = placeholders only: `en/index.html` (coming-soon + LINE QR codes) and `en/about.html` (coming-soon stub). Full EN pages deferred until CN content is approved. Per `CLAUDE.md`: EN mirrors CN structure under `/en/`; §九 compliance applies to both (translate the banned-word list).

### Logo / avatar
- `assets/logo.png` + `favicon.png` regenerated from `brand_assets/logo.pdf`: full circular doctor mark, **centered with even padding**, and a **clean white-disc edge (no dark ring/hairline)**. `.brand__mark` uses `object-fit: contain` + `object-position: center`, **no border**.

---

## 🎨 Design reference (unchanged)
- **Palette:** cream bg `#FAF6EF` + deep teal `#16635B` (primary) + warm terracotta `#CC7A45` (accent). Calm/trustworthy, not tech-startup.
- **Type:** Noto Serif TC (headings) + Noto Sans TC (body, line-height 1.8–2 for Chinese).
- **Preview:** `python3 -m http.server 8000` from project root → http://localhost:8000. Never test `file://`.
- Screenshots in `temporary screenshots/` (latest per feature: `about-*`, `svc-*`, `lang-*`, `v4-*`).

---

## ⬜ Pages not yet built
- **全院區門診總表 / Weekly schedule** (§十一) — 醫師 × 院區 × 時段 table; data blank `待補`. Hub already links to it.
- **預約掛號 / 聯絡我們 / Contact** (§八) — 電話 / LINE / 線上掛號 CTAs.
- **衛教專欄 / Blog** (§七) — SEO articles; topics listed, no bodies yet.
- **EN pages** — all of `/en/` beyond the two placeholders.

---

## 🔒 Constraints to keep
- Plain HTML/CSS/JS, no build step (GitHub Pages).
- §九 compliance on every page: no 保證 / 最 / 根治 / 唯一 / 第一, no efficacy guarantees, no fee mentions; footer legal disclaimer mandatory. Scan before finishing.
- Every page needs its own `<title>` + meta description (drafts in §十二).
- Never invent doctor/clinical/中山 content — leave `〔待補〕` visible/flagged.
- 中山: "2026 年 10 月開幕・敬請期待", no live surgery marketing until open.
