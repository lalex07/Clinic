# 大豐耳鼻喉科聯合診所 — Clinic Website

A website for 大豐耳鼻喉科聯合診所 (Dafeng ENT United Clinic), a four-location ENT clinic in Taipei.

## Content brief

The full site content — structure, page-by-page copy, doctor bios, locations, and SEO metadata — lives in `site-spec.md` at the project root. Treat that file as the source of truth for what goes on the site. Do not invent content, doctor information, or services not listed there. Where the brief has placeholders marked 〔待補〕, leave them as visible placeholders or flag them — do not make up replacement content.

## Brand assets

Real brand assets live in `brand_assets/`:

- `logo.pdf` — clinic logo
- `新店 LINE QR code.jpg`, `木柵 LINE QR code.jpg`, `興隆 LINE QR code.jpg` — general LINE booking QR codes for each existing location
- `興隆 surgery LINE QR code.png` — surgery inquiry/booking QR for 興隆
- `新店木柵 surgery LINE QR code.png` — surgery inquiry/booking QR shared between 新店 and 木柵

Pair each location with its general QR on its location page. Surgery QRs belong on the surgery / 手術中心 section, and on each respective location page when surgery is mentioned. 中山 has no QR codes yet — leave placeholders.

Use these real assets instead of generic placeholders wherever possible.

## Design

Use the frontend-design skill in `.claude/skills/frontend-design/` for all UI work. The site is bilingual (primary: Traditional Chinese; secondary: English where useful). Tone: professional, warm, trustworthy — this is a healthcare site for patients and family members, not a design showcase. Avoid aggressive colors, flashy gradients, or anything that feels like a tech-startup landing page.

## Design rules (apply to every page, every component)

**No glows, halos, auras, or blurred light effects.** Zero tolerance. Every pill, badge, eyebrow, dot, button, card, and decorative element has crisp hard edges. Shadows are allowed only as grounded layered depth tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) which simulate object weight, not light emission. If a shadow's blur is producing a "glow" appearance rather than a "sitting on a surface" appearance, it's wrong. No `backdrop-filter: blur` (frosted/aura effect), no `filter: blur` / `filter: drop-shadow` as decoration. A colored dot is just a colored circle.

**Symmetric vertical breathing on hero/intro blocks.** Any hero box, intro callout, or feature panel must have equal vertical space above and below before the next content section starts. Don't let intro blocks sit flush against the next section — it reads as falling off the page.

**No gradients.** Linear-gradient and radial-gradient are not used anywhere in the design system, except possibly as page-level body background (single flat color preferred even there). Cards, pills, badges, heroes, callouts, and section backgrounds use solid colors only. Depth comes from layered shadows, spacing, and typography — never from gradient accents. This applies regardless of how subtle the gradient appears.

**No multi-color gradient accents.** Cards, sections, and components do not use teal-to-terracotta or any other gradient as decoration — no gradient top bars, no gradient borders, no gradient hover states. Solid colors only. (Superseded by the stricter "No gradients" rule above — kept for emphasis on the multi-color case.)

**Hover state for cards = lift, not color.** Interactive cards translate up 4–6px on hover and deepen their shadow slightly. They do not change color, gain gradient bars, or shift hue. Transition transform and box-shadow only — never use `transition-all`.

**Shadows are layered and tinted, not glowy.** Per the frontend-design skill: shadows use the established tinted-shadow tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`). They suggest depth and physical layering, not light emission.

**Restraint over density.** Inspired by cureclinictw.com (which 院長 specifically prefers — he found Caringlink and HomePro overpowering on information). Each section presents one clear focal idea, not a feature list. Whitespace is a feature, not wasted space. When in doubt between adding more information and removing some, remove.

**Header/nav must always fit on one line at desktop widths.** The site header (brand + nav + search + language toggle + CTA) must never wrap to a second line or overflow horizontally at desktop widths. Any addition to the header (a new nav item, a search control, a badge) has to preserve the single-line fit — verify with a desktop-width screenshot before committing. If something new won't fit, shrink or collapse it (e.g. a click-to-open search overlay behind an icon rather than an inline input), don't let the header wrap. (Learned the hard way: an inline header search box overflowed the nav onto a second line.)

**Images in a placeholder must stay inside the placeholder box.** When a real image replaces a `.photo-zone` (or any fixed aspect-ratio placeholder), it must be constrained to that box — `object-fit: cover` within the placeholder's fixed `aspect-ratio`, width/height 100%, never breaking out, overflowing, or stretching the layout. The placeholder defines the footprint; the image fills it and is clipped to it, never the reverse. Check that a swapped-in image hasn't grown the box or spilled past its rounded corners.

Goals:
- Generous vertical breathing room between sections
- Short paragraphs (2-4 sentences max in body copy)
- Section content that fits on one screen without scrolling whenever possible
- Avoid grid-of-many-feature-cards patterns; prefer 3-6 considered items
- Photography and illustration carry weight rather than dense text blocks
- Calm trust over busy energy

## Technical

- Plain HTML, CSS, and JavaScript — no build step, hostable on GitHub Pages
- Mobile-first (over 70% of patients will visit on phones; see brief section 十)
- Each location page should include structured data (schema.org MedicalClinic / LocalBusiness) per brief section 十二
- Preview locally with `python3 -m http.server 8000` from the project root, then open `http://localhost:8000` in the browser. Never test against `file:///` URLs.
- Static site, no backend/DB/auth — features needing accounts or persistence require an external service (e.g. Supabase), not the static site.
- Native browser UI (date pickers, pull-to-refresh) can't be CSS-themed; match the design by building a custom accessible component.

## File organization

This is a no-build GitHub Pages site served straight from the repo root by path. Keep the layout flat and predictable so live URLs never break:

- **Served pages (`*.html`) live FLAT at the repo root.** `index.html` is the site root; every other page (`about.html`, `services.html`, `news.html`, `faq.html`, `faq-q*.html`, `location-*.html`, …) sits beside it. **Never nest a served page into a subfolder** — moving `foo.html` to `pages/foo.html` changes its public URL and breaks inbound links, bookmarks, and the search index. English pages are the one intentional nesting: they mirror the Chinese structure under `/en/`.
- **`assets/`** holds all served CSS/JS/images (`site.css`, `search.js`, `search-index.js`, `qr/`, `doctors/`, …), also flat under the root.
- **`brand_assets/`** holds source/original brand files (logo PDF, original-resolution QR codes and photos) that are not necessarily served as-is.
- **`docs/`** holds working/historical documents that are NOT served and NOT part of the build — design reviews, dated audit notes, superseded drafts (e.g. `docs/design-review.md`, `docs/review-2026-06-02.md`). These are reference material for contributors, not pages.
- **`.claude/`** holds skills (`clinic-audit`, `frontend-design`) and local settings.
- **Stays at the root by necessity:** `CLAUDE.md` (Claude Code requires it at root), plus the actively-referenced working files `progress.md`, `site-spec.md`, `faq.md`, `.gitignore`, and any `README`.

New files follow this categorization by default: a new patient-facing page → root; a new stylesheet/script/image → `assets/`; a new internal note, review, or draft → `docs/`.

## Compliance

Taiwan medical advertising rules apply. See section 九 in `site-spec.md` for the do-not-use word list (no 保證, 最, 根治, 唯一, etc.) and the required footer disclaimer. Treat that section as hard constraints.

- No patient testimonials / 病人見證 / reviews on the site (Taiwan 醫療法 restriction).
- 健保特約 / 健保特約診所 IS a permitted item to display.
- Medical content (FAQ, 公告) follows draft → 院長 review → publish; never publish unreviewed. 院長-approved copy is inserted verbatim — never reword or silently "fix"; flag suspected typos instead.

## Pre-commit audit

Before committing any change, run the `clinic-audit` skill in `.claude/skills/clinic-audit/`. It checks §九 compliance, the design rules above, and accessibility (WCAG AA) in one pass, and knows this project's known-good exceptions. Report-only by default; pass "audit and fix" to apply fixes.

## Multi-agent workflow

- Two parallel agents must never edit the same file (last-write-wins silently loses changes).
- Only ONE agent commits per batch; remove any stale `.git/index.lock` first; don't force-push.
- Serialize edits to shared chrome (header/footer, `site.css`, `site.js`) into one agent; build site-wide UI by injecting via `site.js` so it lands on every page without per-page edits.
- Run a synthesis agent last: clinic-audit (report-only) → update `progress.md` → single commit. Always update `progress.md` before committing, even for one-file fixes.

## Bilingual

The site is bilingual. Chinese (Traditional) is the default and lives at the project root (`/`). English lives under `/en/`.

- Currently `/en/` is a single placeholder (`en/index.html`: "English version coming soon" + LINE QR codes). Full English pages are deferred until 院長 approves the Chinese content.
- A language toggle (`中文 | EN`, no flag icons) sits in the header of every page — active language in `--primary`, inactive in `--ink-faint` (`.lang-toggle` in `assets/site.css`). Chinese pages link to `en/index.html`; English pages link back to the Chinese root.
- When English pages are built, they go in `/en/` mirroring the Chinese structure. Same design rules apply. Compliance rules (§九) apply to both languages — translate the forbidden words list.

## Status

The 中山 (Zhongshan) flagship location opens October 2026. Until then, present it as "2026 年 10 月開幕・敬請期待" with no surgery-specific marketing language live on the site.
