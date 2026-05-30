# 進度筆記 / Progress — 大豐耳鼻喉科 website

Orientation note for the next session. See `site-spec.md` for the full content brief (source of truth) and `CLAUDE.md` for the rules.

_Last updated: 2026-05-30_

---

## ⏭️ NEXT DECISION POINT (start here)

Today's session shipped the shared-stylesheet refactor + the full Locations set (hub + 4 location pages, 中山 as coming-soon). **Before building more pages, decide:**

1. **Show the client (Alex's dad) first** — get a review/feedback pass on the homepage + locations as built, so the rest of the site is built on confirmed direction (content, tone, layout). Many `〔待補〕` items (門診時間, 看診醫師, 中山 details, traffic/maps) need his input anyway.
2. **Continue building — next up: 診療項目 / Services (§四)** — recommended next page if continuing, since the location pages already link/defer to it (surgery-centre detail, 睡眠/眩暈/頭頸部 evaluation flows).

> No need to ask which; whoever resumes should raise this choice with Alex.

---

## 🏗️ Architecture — shared stylesheet (NEW this session)

The site is no longer one self-contained file. Shared chrome now lives in:
- **`assets/site.css`** — design tokens, base/reset, grain overlay, header/nav, buttons, `.sec-head`, `.page-head` (interior banner) + breadcrumb, footer, `.reveal`, `.skip-link`, editorial flags (`.review-note`, `.tbd`), shared responsive. Every page links this.
- **`assets/site.js`** — sticky-header border, mobile nav toggle, IntersectionObserver reveal (with no-JS/`prefers-reduced-motion` fallback). Linked at end of `<body>`.
- **`assets/locations.css`** — components specific to the location hub + detail pages (loaded only by those pages).
- `index.html` was refactored to use these; only homepage-specific CSS (hero/quick/features) stays inline in it.

**When building the remaining pages:** link `assets/site.css` + `assets/site.js`, copy the header/footer markup verbatim (set `aria-current="page"` on the active nav item), and add page-specific CSS either inline or in a new `assets/<page>.css`. Nav order: 關於大豐 / 診療項目 / 醫療團隊 / 院區・門診 / 衛教專欄, CTA → `contact.html`.

Nav/footer link targets (some pages not built yet → will 404 until then): `about.html`, `services.html`, `team.html`, `locations.html`, `blog.html`, `contact.html`.

---

## ✅ Done — Locations (NEW this session)

- **`locations.html`** — hub: 院區切換 grid (4 cards), 全院區門診總表 call-out (data still `待補`).
- **`location-xindian.html`** / **`-xinglong.html`** / **`-muzha.html`** — full detail pages: page-head + breadcrumb, 門診時間 table (all cells `待補`), 交通 + 地圖 placeholder panels, contact sidebar (院長 / 看診醫師`待補` / address / tel link / FB), and LINE QR cards using the **real** `brand_assets` QRs (copied to `assets/qr/` with ASCII names). Each has **schema.org `MedicalClinic`** JSON-LD (name/tel/address/sameAs).
  - QR pairing: 新店 & 木柵 → general QR + shared `xindian-muzha-surgery-line.png`; 興隆 → general QR + `xinglong-surgery-line.png`. Surgery QRs framed neutrally as "手術・睡眠諮詢".
- **`location-zhongshan.html`** — 中山 coming-soon: "2026 年 10 月開幕" banner, surgery-centre capabilities in **future/preview tense** (將/規劃/開幕後將提供) per §四⑤ ⚠️, all of 院長/地址/電話/門診 as `待補`, **no QR** (placeholder), pre-registration placeholder. No live surgery 招攬.
- Compliance: scanned clean. Rephrased `第一時間`→`搶先` to avoid the §九 `第一` flag. `最近`(=nearest) kept (verbatim §二, previously accepted).
- Verified: all pages + assets serve 200; screenshots in `temporary screenshots/loc-*` (desktop + mobile) look correct.

---

## ✅ Done — Homepage (`index.html`)

Single-file, plain HTML/CSS/JS, mobile-first. Sections built (all copy verbatim from `site-spec.md` §二/§三/§九):

- **Header** — logo badge + clinic name, nav (placeholder `#` links), `立即預約` CTA, mobile hamburger.
- **Hero** — slogan B (`文山・新店在地深耕…`), full subtitle paragraph, `新店・木柵・興隆・中山` location statement, `查看院區與門診` secondary button, doctor-rings visual.
- **Three quick-entry cards** — 四大院區・門診時間 / 診療項目 / 立即預約 (verbatim sub-lines).
- **Five feature highlights** (§三) — 01–05, equal-height cards.
- **Footer** — legal disclaimer (verbatim), real addresses/phones for 新店・興隆・木柵, 中山 shown as `2026 年 10 月開幕・敬請期待`, copyright + footer nav.

### Design decisions
- **Palette:** warm cream bg + deep teal (`#16635B`) primary + warm terracotta (`#CC7A45`) accent. Intentionally calm/trustworthy, not tech-startup. No default Tailwind blue/indigo.
- **Type:** Noto Serif TC (display headings) + Noto Sans TC (body, line-height 1.8–2 for Chinese).
- **Logo:** `brand_assets/logo.pdf` → cropped & re-centered to `assets/logo.png` (+ `favicon.png`) using headless Chrome (sips only does centered crops). Friendly cartoon-doctor mark.
- **Compliance:** scanned clean — none of the §九 prohibited words (保證/最/根治/唯一/第一…). Only `最` instance is `最近` ("nearest") inside verbatim card copy — fine.
- **Editorial flags kept visible:** the brief's `（請依實際設備調整）` note in feature 04 is rendered as a flagged pill, not passed off as final copy.
- Effects: layered tinted shadows, soft radial-gradient atmosphere, SVG grain, staggered fade-up reveals (transform/opacity only), hover/focus-visible/active on all interactive elements. Respects `prefers-reduced-motion`.

### Preview
`python3 -m http.server 8000` from project root → http://localhost:8000
Screenshots in `temporary screenshots/` (latest: `desktop3.png`, `mobile3.png`).

---

## 🔧 Minor polish still open
- Logo sits edge-to-edge in its circular badge → doctor's own outline ~coincides with the badge border. Optional: add a few % inner padding for breathing room (waiting on user preference).
- Footer disclaimer text is small (~0.78rem) — fine, but double-check legibility on real phones.
- Quick-entry cards could optionally `<a>`-link to real pages once built (currently `#`).

---

## ⬜ Pages not yet built
All nav links currently point to `#`. Remaining pages (per `site-spec.md` §一 architecture):

- **關於大豐** (§三) — clinic philosophy + the five highlights (some already on homepage).
- **診療項目 / Services** (§四) — four blocks: 一般耳鼻喉科 / 睡眠呼吸中止症 / 眩暈 / 頭頸部腫瘤, plus the 中山手術中心 一站式 section. Watch §四 ⚠️ tone warnings (頭頸部 = "診斷/轉介" language; 手術 = avoid 保證/最/根治).
- **醫療團隊 / Team** (§五) — 7 doctors. NOTE: bios are marked **建議專長（待確認）** — flag as "pending confirmation", don't present as final.
- ~~**四大院區・門診時間・交通 / Locations** (§六)~~ — ✅ DONE this session (see above).
- **全院區門診總表 / Weekly schedule** (§十一) — integrated 醫師 × 院區 × 時段 table; brief suggests filterable. **Schedule data is blank 〔待補〕** in the brief. (Hub page already has a call-out card pointing here; build the actual table page next, or fold into `locations.html`.)
- **預約掛號 / 聯絡我們 / Contact** (§八) — 電話 / LINE / 線上掛號 CTAs.
- **衛教專欄 / Blog** (§七) — SEO articles; topic list given, no article bodies yet.

---

## ❓ Open questions / things to remember
- **中山院區:** opens Oct 2026 → always present as "2026 年 10 月開幕・敬請期待"; no live surgery-marketing copy until open. Address/phone/院長 all 〔待補〕.
- **Placeholders to fill (〔待補〕):** doctor clinic schedules, special-clinic doctor/day assignments (§四), 中山 details, traffic/map info, LINE booking links. Leave visible/flagged — do not invent.
- **Per §十二:** every page needs its own `<title>` + meta description (drafts provided in §十二).
- **SEO titles & disclaimer are mandatory** on every page; reuse the homepage footer disclaimer.
- Site is hostable on GitHub Pages (no build step). Keep that constraint.
