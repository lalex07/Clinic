#!/usr/bin/env node
/* =============================================================================
 * generate-news.mjs — regenerate the news-cards block in news.html from Supabase
 * -----------------------------------------------------------------------------
 * Mirror of generate-team.mjs (approach A, generate-static-on-change). Reads the
 * `news` table with the BROWSER-SAFE anon key (RLS allows anon SELECT only on
 * status='published' rows), renders each card reproducing news.html's EXACT
 * existing .news-card markup/classes, and surgically replaces only the region
 * between <!-- NEWS:START --> and <!-- NEWS:END -->. The page's existing
 * filter/calendar JS keeps working unchanged — it reads data-clinic / data-date
 * off the cards, which this generator always emits.
 *
 * Images: for a row with image_path set, the file is referenced at its LOCAL repo
 * path (e.g. assets/news/<id>.jpg) so the published site has ZERO runtime Supabase
 * dependency. If the news-images bucket holds an object at that basename (an admin
 * upload) it is the source of truth and is downloaded into assets/news/. Rows with
 * no image_path render the 公告 / Announcement placeholder tile.
 *
 * No npm dependencies — uses Node's global fetch (Node 18+). Config comes from
 * env vars SUPABASE_URL / SUPABASE_ANON_KEY, falling back to a local .env file.
 *
 * Usage:  node scripts/generate-news.mjs
 * ========================================================================== */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const NEWS_HTML = resolve(ROOT, 'news.html');
const NEWS_DIR = resolve(ROOT, 'assets', 'news');
const BUCKET = 'news-images';

const START = '<!-- NEWS:START';
const END = '<!-- NEWS:END -->';

// xindian→新店, muzha→木柵, xinglong→興隆, zhongshan→中山
const CLINIC_LABEL = { xindian: '新店', muzha: '木柵', xinglong: '興隆', zhongshan: '中山' };

// ---- config (env first, then optional .env file; never commit real keys) ----
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

// ---- minimal HTML-escaping for text nodes/attributes ----
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

// "2026-06-01" → "2026.06.01" (dotted display). Falls back to the raw value.
function displayDate(d) {
  const s = String(d ?? '');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : s;
}
function isoDate(d) {
  const s = String(d ?? '');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s;
}

function renderMedia(n) {
  if (n.image_path) {
    return [
      `          <div class="news-card__media">`,
      `            <img class="news-card__img" src="${escAttr(n.image_path)}" alt="${escAttr(n.title)}" loading="lazy" />`,
      `          </div>`,
    ].join('\n');
  }
  // no image → default 公告 placeholder tile (matches the seeded card exactly)
  return [
    `          <!-- no image → default 公告 placeholder tile (decorative; the heading + body carry the announcement) -->`,
    `          <div class="news-card__media news-card__media--placeholder" aria-hidden="true">`,
    `            <span class="news-card__placeholder">`,
    `              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
    `              <span class="news-card__placeholder-zh">公告</span>`,
    `              <span class="news-card__placeholder-en">Announcement</span>`,
    `            </span>`,
    `          </div>`,
  ].join('\n');
}

function renderCard(n, i) {
  const stagger = ['', ' d1', ' d2'][i % 3];
  const iso = isoDate(n.date);
  const label = CLINIC_LABEL[n.clinic] || esc(n.clinic);
  return [
    `        <article class="news-card reveal in${stagger}" data-clinic="${escAttr(n.clinic)}" data-date="${escAttr(iso)}">`,
    renderMedia(n),
    `          <div class="news-card__body">`,
    `            <div class="news-card__meta">`,
    `              <time class="news-card__date" datetime="${escAttr(iso)}">${esc(displayDate(n.date))}</time>`,
    `              <span class="news-card__tag">${esc(label)}</span>`,
    `            </div>`,
    `            <h2>${esc(n.title)}</h2>`,
    `            <p>${esc(n.body)}</p>`,
    `          </div>`,
    `        </article>`,
  ].join('\n');
}

async function fileExists(p) {
  try { await access(p, FS.F_OK); return true; } catch { return false; }
}

// Ensure the local image file exists; bucket object (if any) wins as source of truth.
async function syncImage(cfg, n) {
  if (!n.image_path) return;
  const base = basename(n.image_path);
  const localPath = resolve(ROOT, n.image_path);
  const publicUrl = `${cfg.url}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(base)}`;
  let res;
  try { res = await fetch(publicUrl); } catch { res = null; }
  if (res && res.ok) {
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(NEWS_DIR, { recursive: true });
    await writeFile(localPath, buf);
    console.log(`  · downloaded bucket image → ${n.image_path} (${buf.length} bytes)`);
    return;
  }
  if (await fileExists(localPath)) {
    console.log(`  · kept local image ${n.image_path} (no bucket object)`);
  } else {
    console.warn(`  ! WARNING: ${n.image_path} missing locally and not in bucket`);
  }
}

async function main() {
  const cfg = await loadConfig();
  // RLS restricts anon to published rows; the status filter is belt-and-suspenders.
  const endpoint = `${cfg.url}/rest/v1/news?select=*&status=eq.published&order=date.desc`;
  const res = await fetch(endpoint, {
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
  });
  if (!res.ok) {
    console.error(`ERROR: news fetch failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const news = await res.json();
  if (!Array.isArray(news)) {
    console.error('ERROR: unexpected news response (not an array) — refusing to touch the block.');
    process.exit(1);
  }
  console.log(`Fetched ${news.length} published news item(s).`);

  for (const n of news) await syncImage(cfg, n);

  // Zero published rows is a legitimate state (all drafts): emit an empty block;
  // the page's filter JS then shows the existing empty-state message on load.
  const cards = news.map(renderCard).join('\n\n');
  const block = news.length ? `\n\n${cards}\n\n        ` : `\n\n        `;

  const html = await readFile(NEWS_HTML, 'utf8');
  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.error('ERROR: NEWS markers not found in news.html.');
    process.exit(1);
  }
  const startClose = html.indexOf('-->', startIdx) + 3; // end of the START comment
  const next = html.slice(0, startClose) + block + html.slice(endIdx);
  if (next === html) {
    console.log('No change to news.html.');
  } else {
    await writeFile(NEWS_HTML, next);
    console.log('news.html NEWS block regenerated.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
