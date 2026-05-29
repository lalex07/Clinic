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

## Technical

- Plain HTML, CSS, and JavaScript — no build step, hostable on GitHub Pages
- Mobile-first (over 70% of patients will visit on phones; see brief section 十)
- Each location page should include structured data (schema.org MedicalClinic / LocalBusiness) per brief section 十二
- Preview locally with `python3 -m http.server 8000` from the project root, then open `http://localhost:8000` in the browser. Never test against `file:///` URLs.

## Compliance

Taiwan medical advertising rules apply. See section 九 in `site-spec.md` for the do-not-use word list (no 保證, 最, 根治, 唯一, etc.) and the required footer disclaimer. Treat that section as hard constraints.

## Status

The 中山 (Zhongshan) flagship location opens October 2026. Until then, present it as "2026 年 10 月開幕・敬請期待" with no surgery-specific marketing language live on the site.
