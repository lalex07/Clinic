# 大豐耳鼻喉科 — English Site Build Plan

A phased path from the current `/en/` coming-soon stubs to a complete bilingual site. Each phase
is an independently shippable chunk (its own agent + commit). Keep the design identical to the CN
site (shared `assets/site.css` + `site.js`); translate content faithfully and keep it §九-compliant
in English too (the medical-advertising rules apply regardless of language — no efficacy/superlative
claims, no fees, no patient testimonials, preserve the hedged "may be associated with / results
vary" tone).

> Cross-cutting: medical content (services, team credentials, FAQ) should get **院長's review** in
> English before it's final, same as the Chinese. And going bilingual roughly **doubles content
> upkeep** — every future CN change needs its EN counterpart updated.

---

## Phase 1 — Core brochure pages  *(prompt already written)*

`en/index.html`, `en/about.html`, `en/services.html`, `en/team.html`, `en/locations.html`.

Establishes the reusable EN shell: English header/nav (About / Services / Team / Locations / Health
Education / News), footer with an English courtesy translation of the legal disclaimer (Chinese
remains operative), the language toggle (EN active, 中文 → each page's CN counterpart), and the
"Book Now" CTA. ~5 pages. **Do this first** — it sets the pattern everything else copies.

## Phase 2 — Location details + contact + 404

`en/location-xindian/muzha/xinglong/zhongshan.html`, `en/contact.html`, `en/404.html`.

Completes the English "find us / book" path: addresses, embedded maps, the LINE booking links, the
contact fallback, and a translated 404. Mostly structural translation; 中山 stays "Opening Oct 2026"
with no surgery marketing. Medium effort.

## Phase 3 — Language-aware shared chrome  *(JS, cross-cutting)*

Right now the injected booking modal, search overlay, footer NHI badge, and back-to-top label render
**Chinese strings on EN pages** (they're built in `site.js`). Make `site.js` detect the page's
`<html lang>` and render the English strings on `/en/` pages. Also: an **English search index** (so
site search works on EN pages), and EN labels throughout the injected chrome. Do this once Phases 1–2
exist so EN pages stop looking half-Chinese. Single cross-cutting `site.js`/`site.css` job — run it
alone (no other agent touching those files).

## Phase 4 — FAQ / 衛教專欄  *(the big content phase)*

`en/faq.html` (the card grid + pagination) + `en/faq-q1.html … en/faq-q17.html` (17 article pages) +
the English `FAQPage` schema. This is the largest chunk and the most sensitive — 17 medical articles
that must translate the hedging and correlation-not-causation framing accurately. **院長 should review
the English medical copy.** Best split across a couple of runs (e.g. articles 1–9, then 10–17), each
mirroring the CN article-page structure (no Q-numbers, breadcrumb, photo-zone banner, schema).

## Phase 5 — News / 最新消息

`en/news.html` with the clinic + date filters translated. Small for now (one example announcement),
but the filter UI + calendar need English labels. Straightforward once Phase 3's lang-aware pattern
exists.

## Phase 6 — SEO / i18n polish

- **`hreflang`** tags on every page linking each CN page to its EN alternate and vice-versa (tells
  Google about the language versions — important for being found in both languages).
- Add all `/en/` pages to `sitemap.xml`; give EN pages their own English OG/Twitter meta + titles.
- Verify the language toggle is wired **both ways** on every page (CN → EN counterpart, EN → CN).
- Re-run `clinic-audit` across the EN pages (lang attrs, alt text, contrast, §九 on the EN copy).

---

## Rough sequencing & sizing

| Phase | Scope | Size | Depends on |
|---|---|---|---|
| 1 | 5 core pages | Medium | — |
| 2 | 4 locations + contact + 404 | Medium | P1 (shell pattern) |
| 3 | Lang-aware `site.js` chrome + EN search | Small–Med | P1 |
| 4 | FAQ listing + 17 articles | **Large** (split it) | P1, P3 |
| 5 | News page | Small | P3 |
| 6 | hreflang, sitemap, OG, toggle wiring, audit | Small–Med | all pages exist |

Suggested order: **1 → 2 → 3 → 4 → 5 → 6.** Phase 3 can be pulled earlier if the Chinese chrome on
EN pages bothers you; Phase 6 should come last (it needs every EN page to exist).

## Things to decide

1. **Translation review** — will 院長 (or a clinician) review the EN medical copy (services, team,
   FAQ), or is faithful translation enough? Recommended: at least the FAQ + service descriptions.
2. **How "complete" EN needs to be before launch** — e.g. ship Phases 1–3 (a usable English brochure)
   and add FAQ/news later, vs. wait for everything.
3. **Maintenance owner** — who keeps EN in sync when CN content changes. Worth deciding up front.
