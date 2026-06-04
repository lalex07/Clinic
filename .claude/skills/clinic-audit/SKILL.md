---
name: clinic-audit
description: Run the Dafeng ENT clinic site's pre-commit audit — Taiwan medical-advertising compliance (site-spec §九), the project's hard design rules from CLAUDE.md (no gradients, no glows/halos/blur, hover = lift not color, tinted shadow tokens only, no transition:all), and accessibility (WCAG AA). Use this whenever the user says "audit", "compliance check", "design-rule check", "a11y check", "accessibility check", "review before commit/push", or before shipping any change to the clinic website. Report-only by default; only fix when explicitly asked.
---

# Clinic site audit (compliance + design rules + accessibility)

This skill runs the standing pre-commit audit for the 大豐耳鼻喉科聯合診所 website. It checks three things, in this order, and produces a single prioritized findings report. **By default it does not change any files** — it reports. Only apply fixes if the user explicitly asks ("audit and fix").

The two sources of truth this skill enforces:
- **`CLAUDE.md`** → the design rules (hard constraints) and compliance pointer.
- **`site-spec.md` §九** → the Taiwan medical-advertising compliance checklist + the mandatory footer disclaimer.

Always run from the project root. Scan all Chinese pages (`*.html` at root), the `/en/` stubs, and `assets/*.css`. The site is plain HTML/CSS/JS with no build step.

---

## How to run

Work through the three groups below. Use ripgrep (`rg`) or `grep -rn`. Record every hit with `file:line`, a severity, and a concrete fix. Then write the report in the format at the bottom.

Severity scale: **Blocker** (compliance violation or broken page) → **High** → **Medium** → **Low/Info**.

---

## Group A — §九 Medical-advertising compliance (Blocker if violated)

Taiwan medical advertising rules. Any hit here that is a real marketing claim is a **Blocker** — it must not ship.

1. **Forbidden words.** Scan page copy (not code/comments) for:
   `保證`, `療效保證`, `根治`, `完全根治`, `唯一`, `第一`, `最` (as a superlative: 最好/最佳/最權威/最強/最有效), `必須`, `一定要`.
   ```
   for w in 保證 療效保證 根治 完全根治 唯一 第一 必須 一定要 最權威; do echo "--- $w ---"; grep -rn "$w" *.html en/*.html; done
   grep -rno "最." *.html en/*.html | sort | uniq -c | sort -rn
   ```
   **Known acceptable exceptions (do NOT flag):** `最近` (geographic "nearest"), and `最佳` only inside a `.photo-zone` photographer placeholder label (about shot lighting, not a clinical claim). Anything else with `最` as a superlative about the clinic/treatment → Blocker.

2. **No fees / prices.** `元`, `費用`, `收費`, `價格`, `NT$`, `$<number>`. Any price on a medical page → Blocker.
   ```
   grep -rn "費用\|收費\|價格\|NT\$\|\$[0-9]" *.html en/*.html
   ```

3. **No efficacy guarantees / percentages / before-after claims.** `治癒`, `成功率`, `百分之`, `[0-9]%` in copy, patient testimonials, or before/after photos. Use "協助改善／依個別狀況" neutral phrasing instead.

4. **Footer legal disclaimer present on EVERY page.** Every page must contain the 《醫療機構網際網路資訊管理辦法》 disclaimer.
   ```
   for f in $(ls *.html); do grep -q "醫療機構網際網路資訊管理辦法" "$f" && echo "$f ✓" || echo "$f ✗ MISSING"; done
   ```
   A missing disclaimer → Blocker.

5. **頭頸部腫瘤 / surgery wording** must match actual services — keep "診斷／評估／轉介" tone, no language implying the clinic directly performs cancer treatment unless confirmed. **中山 (Zhongshan)** must stay "2026 年 10 月開幕・敬請期待" with no live surgery marketing.

> §九 also applies to `/en/` pages when built — the forbidden-word list must be translated. Today `/en/` is stubs, so just confirm the disclaimer/coming-soon is intact.

---

## Group B — Design rules (from CLAUDE.md; High unless noted)

Zero-tolerance rules. The whole point is grounded, crisp, calm — no light emission, no gradients.

1. **Gradients: must be ZERO.**
   ```
   grep -rn "linear-gradient\|radial-gradient\|conic-gradient" *.html en/*.html assets/*.css
   ```
   Any hit → High. (Body background may be a single flat color only — never a gradient.)

2. **Glows / halos / blurred light: must be ZERO.**
   ```
   grep -rn "backdrop-filter\|filter:.*blur\|drop-shadow" *.html en/*.html assets/*.css
   ```
   **Known acceptable exception:** the single `filter: saturate()/brightness()/contrast()` color-normalization on doctor photos in `team.html` (color only, no blur) — do NOT flag.

3. **No glow-style box-shadows.** Shadows must be grounded depth tokens (`--shadow-sm/md/lg`): downward offset, low alpha, no `0 0` origin, no large outward spread.
   ```
   grep -rn "box-shadow:[^;]*" *.html en/*.html assets/*.css | grep -E "0 0 |0px 0px "
   ```
   Any `0 0` blur glow → High.

4. **Hover on cards = lift, not color.** Interactive *cards* (`.qcard`, `.feature`, `.loc-card`, `.doc`, `.faq-entry`, plus any new card) must translate up 4–6px and deepen shadow only — no color/hue/gradient change on hover. (Buttons, nav links, and chips changing color on hover is fine — the rule targets cards.)
   ```
   grep -rn ":hover" assets/*.css *.html
   ```

5. **No `transition: all`.** Transition only `transform` and `box-shadow`.
   ```
   grep -rn "transition: all\|transition:all\|transition-all" *.html en/*.html assets/*.css
   ```

6. **Symmetric vertical breathing** on hero/intro/callout blocks (equal space above and below before the next section). This is a visual check — confirm in a screenshot, don't grep.

7. **Restraint over density.** One focal idea per section, short paragraphs (2–4 sentences), prefer 3–6 considered items over grids-of-many. Flag sections that have drifted into feature-list density. (Judgment call → Medium/Info.)

---

## Group C — Accessibility (WCAG AA)

1. **`<html lang>`** set on every page (`zh-Hant` for root, `en` for `/en/`).
   ```
   grep -rno '<html[^>]*lang="[^"]*"' *.html en/*.html
   ```

2. **Every `<img>` has alt.** QR codes and doctor photos included; alt should be descriptive.
   ```
   grep -rno '<img[^>]*>' *.html en/*.html | grep -v 'alt='
   ```

3. **Decorative inline SVGs are hidden from screen readers.** Every purely-decorative `<svg>` icon needs `aria-hidden="true" focusable="false"` (especially chevrons inside links). Spot-check that no page has decorative SVGs without it.
   ```
   echo "svg: $(grep -rho '<svg' *.html en/*.html | wc -l)  aria-hidden: $(grep -rho 'aria-hidden' *.html en/*.html | wc -l)"
   for f in *.html; do n=$(grep -c '<svg' "$f"); h=$(grep '<svg' "$f" | grep -c 'aria-hidden'); [ "$n" -gt "$h" ] && echo "$f: $((n-h)) svg(s) without aria-hidden"; done
   ```

4. **Heading hierarchy:** exactly one `<h1>` per page, no skipped levels (don't jump h1→h3). Card/section titles that act as headings should be real headings.
   ```
   for f in *.html; do printf "%-22s h1=%s h2=%s h3=%s\n" "$f" "$(grep -oc '<h1' $f)" "$(grep -oc '<h2' $f)" "$(grep -oc '<h3' $f)"; done
   ```

5. **Skip link, focus styles, aria-current, mobile nav ARIA** present.
   ```
   grep -rln "skip-link" *.html | wc -l        # expect every page
   grep -rn ":focus-visible\|:focus" assets/*.css
   grep -rln "aria-current" *.html
   grep -n "aria-expanded\|aria-controls\|aria-label" assets/site.js
   ```

6. **Reduced-motion:** any continuous/looping CSS animation (e.g. the hero `.breath-rings` `breathe` keyframes) must be disabled under `@media (prefers-reduced-motion: reduce)`. The guard in `site.css` only covers `.reveal` — inline page animations need their own guard.
   ```
   grep -rn "animation:" *.html assets/*.css
   grep -rn "prefers-reduced-motion" *.html assets/*.css
   ```

7. **Color contrast (WCAG AA = 4.5:1 normal text, 3:1 large/UI).** Re-check whenever a palette token or a text color changes. Background is cream `--bg #FAF6EF` / white `--surface #FFFFFF`.
   Known-good baseline (passes AA): `--ink #2B2A26`, `--ink-soft #5E584E` (6.5:1), `--primary #28645C` (6.35:1), white-on-`--primary` (6.85:1), `--ink-faint #736C5E` (4.83:1 on cream — was darkened from `#918A7C` which FAILED).
   Use-with-care (large text / icons only, ~3:1): `--accent #CC7A45` (3.03:1 on cream) — never use as small body text; for small text use `--ink-soft` or `--primary`.
   To check a new pair:
   ```
   python3 - <<'PY'
   def lin(c):
       c/=255; return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
   def L(h): return 0.2126*lin(int(h[1:3],16))+0.7152*lin(int(h[3:5],16))+0.0722*lin(int(h[5:7],16))
   def cr(a,b):
       la,lb=L(a),L(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
   print(round(cr("#XXXXXX","#FAF6EF"),2))  # replace fg; >=4.5 passes AA for normal text
   PY
   ```

---

## Optional verification (for bigger changes)

If the change touched layout/visuals, preview and screenshot before reporting:
```
python3 -m http.server 8000   # then load http://localhost:8000 — never test file:// URLs
```
Screenshot the affected pages (desktop + mobile) and confirm no design rule regressed visually (glows, gradients, breathing symmetry).

---

## Report format

Output one prioritized report. Lead with a status line per area, then findings:

```
COMPLIANCE (§九):   PASS / N findings
DESIGN RULES:       PASS / N findings
ACCESSIBILITY:      PASS / N findings
```

Then, for each finding:
- **[Severity] Short title** — `file:line`
  What's wrong (one line). → Concrete fix (one line).

Group by area, Blockers first. If everything passes, say so plainly — a clean PASS is a valid and common result for this project. Do not invent issues to look busy.

**Do not auto-fix.** Report only, unless the user said "audit and fix" — in which case make the minimal change each fix requires, never a broader refactor, then re-run the relevant checks to confirm.

---

## Notes

- Run from the project root so the globs resolve.
- This project is collaborative and may be edited concurrently (e.g. by a separate Claude Code session). Scope this skill to read-only auditing unless told to fix; if fixing, touch only the specific lines a finding calls out, and don't commit unless asked.
- Keep the known-acceptable exceptions above in mind so the report doesn't raise false positives (geographic `最近`, the photo-zone `最佳` label, the doctor-photo color `filter`, `--accent` on icons/large text, the intentionally de-emphasized inactive language toggle in `--ink-faint`).
