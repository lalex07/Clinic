#!/usr/bin/env node
/* =============================================================================
 * generate-faq.mjs — regenerate the 衛教專欄 (FAQ) static files from Supabase
 * -----------------------------------------------------------------------------
 * Mirror of generate-team.mjs / generate-news.mjs (approach A). Reads the
 * `faq_articles` table with the BROWSER-SAFE anon key (RLS allows anon SELECT
 * only on status='published' rows) and regenerates the FAQ static files from the
 * DB, reproducing the existing markup BYTE-FOR-BYTE for unchanged articles:
 *
 *   faq.html              <!-- FAQ:START/END -->        the .faq-card grid (all published)
 *   faq-<slug>.html       <!-- ARTICLE:START/END -->    hero <figure> + <article>
 *                         <!-- BREADCRUMB:START/END -->  the breadcrumb title span
 *                         <!-- LDJSON:START/END -->      the <head> ld+json Article
 *                         + head <title>/meta/canonical regenerated from title/description/slug
 *   assets/search-index.js  /* FAQ:START/END *​/         the type:"faq" entries (ALL published)
 *   sitemap.xml           <!-- FAQ:START/END -->        the faq-<slug>.html <url>s (ALL published)
 *
 * Phase 3b additions (existing-page output stays byte-identical):
 *   - NEW pages: a published article with no faq-<slug>.html yet is created from a
 *     faithful template (an existing faq-qN.html — identical chrome) with the same
 *     markers, filled from the article.
 *   - SEARCH + SITEMAP entries are emitted for EVERY published article (surfacing
 *     q8–q17 etc.); articles without curated search_keywords/search_summary get a
 *     sensible default derived from the title / excerpt.
 *   - UNPUBLISH/DELETE: a faq-<slug>.html whose slug is NOT in the current
 *     published set is removed (cards/search/sitemap drop out automatically). File
 *     removal is scoped STRICTLY to faq-q<N>.html paths — no other page is touched.
 *
 * body_html is the canonical source and is emitted VERBATIM (raw HTML) — the body
 * output path is never reshaped. Covers download from faq-images into assets/faq/
 * (bucket wins) and are referenced by local path: zero runtime Supabase dependency.
 *
 * No npm dependencies — Node 18+ global fetch. Config: env SUPABASE_URL /
 * SUPABASE_ANON_KEY, falling back to a local .env file.
 *
 * Usage:  node scripts/generate-faq.mjs
 * ========================================================================== */

import { readFile, writeFile, mkdir, access, readdir, unlink } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FAQ_DIR = resolve(ROOT, 'assets', 'faq');
const BUCKET = 'faq-images';
const IMG_ATTRS = 'width="1376" height="768" loading="lazy" decoding="async"';

async function loadConfig() {
  let url = process.env.SUPABASE_URL;
  let key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    try {
      const env = await readFile(resolve(ROOT, '.env'), 'utf8');
      for (const line of env.split('\n')) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const v = m[2].replace(/^["']|["']$/g, '');
        if (m[1] === 'SUPABASE_URL' && !url) url = v;
        if (m[1] === 'SUPABASE_ANON_KEY' && !key) key = v;
      }
    } catch { /* no .env — rely on env vars */ }
  }
  if (!url || !key) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set (env or .env).');
    process.exit(1);
  }
  return { url: url.replace(/\/$/, ''), key };
}

// ---- minimal HTML-escaping for text nodes/attributes (mirrors generate-team/news.mjs) ----
// Applied to every DB-sourced value injected below — EXCEPT body_html, which is the
// canonical admin-authored HTML and is emitted VERBATIM by design. escAttr() also
// neutralises the breakout chars for the ld+json <script> and the search-index.js JS
// strings (a stray " / < / > can't escape the string or close the <script>).
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

// Replace the bytes between an opening marker and a closing marker with `block`.
function replaceRegion(text, startMarker, endMarker, block, label) {
  const s = text.indexOf(startMarker);
  const e = text.indexOf(endMarker);
  if (s === -1 || e === -1 || e < s) {
    console.error(`ERROR: markers not found for ${label}`);
    process.exit(1);
  }
  return text.slice(0, s + startMarker.length) + block + text.slice(e);
}

// Replace one attribute's value (string replacement, $-safe via a function).
function setAttrValue(text, re, value, label) {
  if (!re.test(text)) { console.error(`ERROR: head field not found: ${label}`); process.exit(1); }
  return text.replace(re, (_, p1) => `${p1}${value}"`);
}

/* ---------- renderers (raw values; body_html emitted verbatim) ---------- */
const pageUrl = (a) => `faq-${a.slug}.html`;
const TITLE_SUFFIX = '｜衛教專欄｜大豐耳鼻喉科聯合診所';

function renderCard(a) {
  return [
    `        <a class="faq-card reveal" href="${pageUrl(a)}">`,
    `          <figure class="photo-zone photo-zone--16x9 photo-zone--sm photo-zone--filled faq-card__media">`,
    `            <img src="${escAttr(a.cover_path)}" alt="${escAttr(a.cover_alt)}" ${IMG_ATTRS}>`,
    `          </figure>`,
    `          <div class="faq-card__body">`,
    `            <h2>${esc(a.title)}</h2>`,
    `            <p>${esc(a.excerpt)}</p>`,
    `            <span class="faq-card__more">閱讀全文 <span aria-hidden="true">→</span></span>`,
    `          </div>`,
    `        </a>`,
  ].join('\n');
}

function renderArticleRegion(a) {
  const figure = [
    `      <figure class="photo-zone photo-zone--16x9 photo-zone--filled faq-article__media reveal">`,
    `        <img src="${escAttr(a.cover_path)}" alt="${escAttr(a.cover_alt)}" ${IMG_ATTRS}>`,
    `      </figure>`,
  ].join('\n');
  const article =
    `      <article class="faq-article faq-article--solo reveal">\n` +
    `        <h1>${esc(a.title)}</h1>${a.body_html}</article>`;  // body_html VERBATIM — canonical, by design
  return `\n\n${figure}\n\n${article}\n\n    `;
}

function renderLdJson(a) {
  const ld = [
    `<script type="application/ld+json">`,
    `{`,
    `  "@context": "https://schema.org",`,
    `  "@type": "Article",`,
    `  "headline": "${escAttr(a.title)}",`,
    `  "description": "${escAttr(a.description)}",`,
    `  "inLanguage": "zh-Hant",`,
    `  "author": { "@type": "Organization", "name": "大豐耳鼻喉科聯合診所" },`,
    `  "publisher": { "@type": "MedicalClinic", "name": "大豐耳鼻喉科聯合診所" },`,
    `  "isPartOf": { "@type": "WebPage", "name": "衛教專欄", "url": "faq.html" }`,
    `}`,
    `</script>`,
  ].join('\n');
  return `\n${ld}\n`;
}

// Search: emit for EVERY published article; derive defaults when not curated.
const searchKeywordsOf = (a) =>
  (Array.isArray(a.search_keywords) && a.search_keywords.length) ? a.search_keywords : [a.title];
const searchSummaryOf = (a) =>
  (a.search_summary != null && a.search_summary !== '') ? a.search_summary : (a.excerpt || a.title);

function renderSearchEntry(a) {
  const kw = searchKeywordsOf(a).map((k) => `"${escAttr(k)}"`).join(', ');
  return [
    `  {`,
    `    type: "faq",`,
    `    title: "${escAttr(a.title)}",`,
    `    url: "${pageUrl(a)}",`,
    `    keywords: [${kw}],`,
    `    summary: "${escAttr(searchSummaryOf(a))}"`,
    `  },`,
  ].join('\n');
}

function renderSitemapEntry(a) {
  return [
    `  <url>`,
    `    <loc>https://lalex07.github.io/Clinic/${pageUrl(a)}</loc>`,
    `    <lastmod>${a.sitemap_lastmod}</lastmod>`,
    `    <changefreq>monthly</changefreq>`,
    `    <priority>0.6</priority>`,
    `  </url>`,
  ].join('\n');
}

// Regenerate the per-article <head> fields (byte-identical when unchanged).
function applyHead(html, a) {
  // <title> is a text node (esc); the og/twitter/description meta values are
  // attribute values (escAttr). url is constructed from the constrained slug.
  const titleText = `${esc(a.title)}${TITLE_SUFFIX}`;
  const titleAttr = `${escAttr(a.title)}${TITLE_SUFFIX}`;
  const descAttr = escAttr(a.description);
  const url = `https://lalex07.github.io/Clinic/${pageUrl(a)}`;
  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${titleText}</title>`);
  html = setAttrValue(html, /(<meta name="description" content=")[^"]*"/, descAttr, 'meta description');
  html = setAttrValue(html, /(<link rel="canonical" href=")[^"]*"/, url, 'canonical');
  html = setAttrValue(html, /(<meta property="og:title" content=")[^"]*"/, titleAttr, 'og:title');
  html = setAttrValue(html, /(<meta property="og:description" content=")[^"]*"/, descAttr, 'og:description');
  html = setAttrValue(html, /(<meta property="og:url" content=")[^"]*"/, url, 'og:url');
  html = setAttrValue(html, /(<meta name="twitter:title" content=")[^"]*"/, titleAttr, 'twitter:title');
  html = setAttrValue(html, /(<meta name="twitter:description" content=")[^"]*"/, descAttr, 'twitter:description');
  return html;
}

async function fileExists(p) {
  try { await access(p, FS.F_OK); return true; } catch { return false; }
}

let templateCache = null;
async function getTemplate() {
  if (templateCache) return templateCache;
  const pages = (await readdir(ROOT))
    .filter((f) => /^faq-q\d+\.html$/.test(f))
    .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));
  for (const f of pages) {
    const p = resolve(ROOT, f);
    if (await fileExists(p)) { templateCache = await readFile(p, 'utf8'); return templateCache; }
  }
  console.error('ERROR: no existing faq-qN.html to use as a template for new pages.');
  process.exit(1);
}

async function syncImage(cfg, a) {
  if (!a.cover_path) return;
  const base = basename(a.cover_path.split('?')[0]);
  const localPath = resolve(ROOT, a.cover_path.split('?')[0]);
  const publicUrl = `${cfg.url}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(base)}`;
  let res;
  try { res = await fetch(publicUrl); } catch { res = null; }
  if (res && res.ok) {
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(FAQ_DIR, { recursive: true });
    await writeFile(localPath, buf);
    console.log(`  · downloaded bucket cover → ${base} (${buf.length} bytes)`);
    return;
  }
  if (!(await fileExists(localPath))) {
    console.warn(`  ! WARNING: ${a.cover_path} missing locally and not in bucket`);
  }
}

async function writeIfChanged(path, next, name) {
  const cur = await readFile(path, 'utf8');
  if (cur === next) { console.log(`No change to ${name}.`); return; }
  await writeFile(path, next);
  console.log(`${name} regenerated.`);
}

async function main() {
  const cfg = await loadConfig();
  const endpoint = `${cfg.url}/rest/v1/faq_articles?select=*&status=eq.published&order=display_order.asc`;
  const res = await fetch(endpoint, { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` } });
  if (!res.ok) {
    console.error(`ERROR: faq_articles fetch failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const articles = await res.json();
  if (!Array.isArray(articles) || articles.length === 0) {
    console.error('ERROR: no published faq_articles returned — refusing to wipe the blocks / remove pages.');
    process.exit(1);
  }
  console.log(`Fetched ${articles.length} published FAQ article(s).`);

  for (const a of articles) await syncImage(cfg, a);

  // 1) faq.html — the card grid (all published)
  {
    const block = `\n\n${articles.map(renderCard).join('\n\n')}\n\n        `;
    let html = await readFile(resolve(ROOT, 'faq.html'), 'utf8');
    html = replaceRegion(html, '<!-- FAQ:START -->', '<!-- FAQ:END -->', block, 'faq.html cards');
    await writeIfChanged(resolve(ROOT, 'faq.html'), html, 'faq.html');
  }

  // 2) each faq-<slug>.html — head + article + breadcrumb + ld+json (create if new)
  for (const a of articles) {
    const p = resolve(ROOT, pageUrl(a));
    let html, isNew = false;
    if (await fileExists(p)) html = await readFile(p, 'utf8');
    else { html = await getTemplate(); isNew = true; }
    html = applyHead(html, a);
    html = replaceRegion(html, '<!-- ARTICLE:START -->', '<!-- ARTICLE:END -->', renderArticleRegion(a), `${pageUrl(a)} article`);
    html = replaceRegion(html, '<!-- BREADCRUMB:START -->', '<!-- BREADCRUMB:END -->', `\n        <span aria-current="page">${esc(a.title)}</span>\n        `, `${pageUrl(a)} breadcrumb`);
    html = replaceRegion(html, '<!-- LDJSON:START -->', '<!-- LDJSON:END -->', renderLdJson(a), `${pageUrl(a)} ldjson`);
    if (isNew) { await writeFile(p, html); console.log(`CREATED ${pageUrl(a)}`); }
    else await writeIfChanged(p, html, pageUrl(a));
  }

  // 3) assets/search-index.js — type:"faq" entries (ALL published)
  {
    const block = `\n${articles.map(renderSearchEntry).join('\n')}\n  `;
    let js = await readFile(resolve(ROOT, 'assets', 'search-index.js'), 'utf8');
    js = replaceRegion(js, '/* FAQ:START */', '/* FAQ:END */', block, 'search-index.js faq');
    await writeIfChanged(resolve(ROOT, 'assets', 'search-index.js'), js, 'assets/search-index.js');
  }

  // 4) sitemap.xml — faq-<slug>.html <url>s (ALL published)
  {
    const block = `\n${articles.map(renderSitemapEntry).join('\n')}\n  `;
    let xml = await readFile(resolve(ROOT, 'sitemap.xml'), 'utf8');
    xml = replaceRegion(xml, '<!-- FAQ:START -->', '<!-- FAQ:END -->', block, 'sitemap.xml faq');
    await writeIfChanged(resolve(ROOT, 'sitemap.xml'), xml, 'sitemap.xml');
  }

  // 5) UNPUBLISH/DELETE: remove faq-q<N>.html whose slug is not published.
  //    Scoped strictly to faq-q<N>.html filenames — never any other page.
  {
    const publishedSlugs = new Set(articles.map((a) => a.slug));
    for (const f of await readdir(ROOT)) {
      const m = /^faq-(q\d+)\.html$/.exec(f);
      if (!m) continue;
      if (!publishedSlugs.has(m[1])) {
        await unlink(resolve(ROOT, f));
        console.log(`REMOVED ${f} (slug ${m[1]} not in the published set).`);
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
