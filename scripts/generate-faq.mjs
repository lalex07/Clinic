#!/usr/bin/env node
/* =============================================================================
 * generate-faq.mjs — regenerate the 衛教專欄 (FAQ) static files from Supabase
 * -----------------------------------------------------------------------------
 * Mirror of generate-team.mjs / generate-news.mjs (approach A). Reads the
 * `faq_articles` table with the BROWSER-SAFE anon key (RLS allows anon SELECT
 * only on status='published' rows) and regenerates ONLY the marker-delimited
 * regions, reproducing the existing markup BYTE-FOR-BYTE:
 *
 *   faq.html              <!-- FAQ:START/END -->        the .faq-card grid
 *   faq-qN.html           <!-- ARTICLE:START/END -->    hero <figure> + <article>
 *                         <!-- BREADCRUMB:START/END -->  the breadcrumb title span
 *                         <!-- LDJSON:START/END -->      the <head> ld+json Article
 *   assets/search-index.js  /* FAQ:START/END *​/         the type:"faq" entries
 *   sitemap.xml           <!-- FAQ:START/END -->        the faq-qN.html <url>s
 *
 * Values are emitted VERBATIM (the DB was seeded verbatim from these files);
 * body_html is raw HTML. The page chrome, pagination JS, search-index header and
 * all non-FAQ entries stay OUTSIDE the markers and are never touched.
 *
 * Covers: for an article with a cover image, the file is referenced at its LOCAL
 * repo path. If the faq-images bucket holds an object at that basename (an admin
 * upload) it wins and is downloaded into assets/faq/; otherwise the committed
 * local file is kept. The published site keeps ZERO runtime Supabase dependency.
 *
 * No npm dependencies — Node 18+ global fetch. Config: env SUPABASE_URL /
 * SUPABASE_ANON_KEY, falling back to a local .env file.
 *
 * Usage:  node scripts/generate-faq.mjs
 * ========================================================================== */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
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

// Replace the bytes between an opening marker and a closing marker with `block`.
// `block` reproduces the EXACT original content (markers stay in place).
function replaceRegion(text, startMarker, endMarker, block, label) {
  const s = text.indexOf(startMarker);
  const e = text.indexOf(endMarker);
  if (s === -1 || e === -1 || e < s) {
    console.error(`ERROR: markers not found for ${label}`);
    process.exit(1);
  }
  return text.slice(0, s + startMarker.length) + block + text.slice(e);
}

/* ---------- renderers (raw values; DB seeded verbatim) ---------- */
const pageUrl = (a) => `faq-${a.slug}.html`;

function renderCard(a) {
  return [
    `        <a class="faq-card reveal" href="${pageUrl(a)}">`,
    `          <figure class="photo-zone photo-zone--16x9 photo-zone--sm photo-zone--filled faq-card__media">`,
    `            <img src="${a.cover_path}" alt="${a.cover_alt}" ${IMG_ATTRS}>`,
    `          </figure>`,
    `          <div class="faq-card__body">`,
    `            <h2>${a.title}</h2>`,
    `            <p>${a.excerpt}</p>`,
    `            <span class="faq-card__more">閱讀全文 <span aria-hidden="true">→</span></span>`,
    `          </div>`,
    `        </a>`,
  ].join('\n');
}

function renderArticleRegion(a) {
  const figure = [
    `      <figure class="photo-zone photo-zone--16x9 photo-zone--filled faq-article__media reveal">`,
    `        <img src="${a.cover_path}" alt="${a.cover_alt}" ${IMG_ATTRS}>`,
    `      </figure>`,
  ].join('\n');
  const article =
    `      <article class="faq-article faq-article--solo reveal">\n` +
    `        <h1>${a.title}</h1>${a.body_html}</article>`;
  return `\n\n${figure}\n\n${article}\n\n    `;
}

function renderLdJson(a) {
  const ld = [
    `<script type="application/ld+json">`,
    `{`,
    `  "@context": "https://schema.org",`,
    `  "@type": "Article",`,
    `  "headline": "${a.title}",`,
    `  "description": "${a.description}",`,
    `  "inLanguage": "zh-Hant",`,
    `  "author": { "@type": "Organization", "name": "大豐耳鼻喉科聯合診所" },`,
    `  "publisher": { "@type": "MedicalClinic", "name": "大豐耳鼻喉科聯合診所" },`,
    `  "isPartOf": { "@type": "WebPage", "name": "衛教專欄", "url": "faq.html" }`,
    `}`,
    `</script>`,
  ].join('\n');
  return `\n${ld}\n`;
}

function renderSearchEntry(a) {
  const kw = (a.search_keywords || []).map((k) => `"${k}"`).join(', ');
  return [
    `  {`,
    `    type: "faq",`,
    `    title: "${a.title}",`,
    `    url: "${pageUrl(a)}",`,
    `    keywords: [${kw}],`,
    `    summary: "${a.search_summary}"`,
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

async function fileExists(p) {
  try { await access(p, FS.F_OK); return true; } catch { return false; }
}

// Bucket object (if any) wins as source of truth; else keep the committed local file.
async function syncImage(cfg, a) {
  if (!a.cover_path) return;
  const base = basename(a.cover_path.split('?')[0]); // strip ?v= cache-bust
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
    console.error('ERROR: no published faq_articles returned — refusing to wipe the blocks.');
    process.exit(1);
  }
  console.log(`Fetched ${articles.length} published FAQ article(s).`);

  for (const a of articles) await syncImage(cfg, a);

  // 1) faq.html — the card grid
  {
    const cards = articles.map(renderCard).join('\n\n');
    const block = `\n\n${cards}\n\n        `;
    let html = await readFile(resolve(ROOT, 'faq.html'), 'utf8');
    html = replaceRegion(html, '<!-- FAQ:START -->', '<!-- FAQ:END -->', block, 'faq.html cards');
    await writeIfChanged(resolve(ROOT, 'faq.html'), html, 'faq.html');
  }

  // 2) each faq-qN.html — article region + breadcrumb title + ld+json
  for (const a of articles) {
    const p = resolve(ROOT, pageUrl(a));
    let html = await readFile(p, 'utf8');
    html = replaceRegion(html, '<!-- ARTICLE:START -->', '<!-- ARTICLE:END -->', renderArticleRegion(a), `${pageUrl(a)} article`);
    html = replaceRegion(html, '<!-- BREADCRUMB:START -->', '<!-- BREADCRUMB:END -->', `\n        <span aria-current="page">${a.title}</span>\n        `, `${pageUrl(a)} breadcrumb`);
    html = replaceRegion(html, '<!-- LDJSON:START -->', '<!-- LDJSON:END -->', renderLdJson(a), `${pageUrl(a)} ldjson`);
    await writeIfChanged(p, html, pageUrl(a));
  }

  // 3) assets/search-index.js — type:"faq" entries (only articles with curated search data)
  {
    const withSearch = articles.filter((a) => Array.isArray(a.search_keywords) && a.search_summary != null);
    const entries = withSearch.map(renderSearchEntry).join('\n');
    const block = `\n${entries}\n  `;
    let js = await readFile(resolve(ROOT, 'assets', 'search-index.js'), 'utf8');
    js = replaceRegion(js, '/* FAQ:START */', '/* FAQ:END */', block, 'search-index.js faq');
    await writeIfChanged(resolve(ROOT, 'assets', 'search-index.js'), js, 'assets/search-index.js');
  }

  // 4) sitemap.xml — faq-qN.html <url> entries
  {
    const entries = articles.map(renderSitemapEntry).join('\n');
    const block = `\n${entries}\n  `;
    let xml = await readFile(resolve(ROOT, 'sitemap.xml'), 'utf8');
    xml = replaceRegion(xml, '<!-- FAQ:START -->', '<!-- FAQ:END -->', block, 'sitemap.xml faq');
    await writeIfChanged(resolve(ROOT, 'sitemap.xml'), xml, 'sitemap.xml');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
