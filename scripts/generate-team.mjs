#!/usr/bin/env node
/* =============================================================================
 * generate-team.mjs — regenerate the doctor-cards block in team.html from Supabase
 * -----------------------------------------------------------------------------
 * Approach A (generate-static-on-change). Reads the `doctors` table with the
 * BROWSER-SAFE anon key (RLS allows anon SELECT on doctors), renders each card
 * reproducing team.html's EXACT existing markup/classes, and surgically replaces
 * only the region between <!-- DOCTORS:START --> and <!-- DOCTORS:END -->.
 *
 * Photos: for photo_mode='photo', the file is referenced at its LOCAL repo path
 * (photo_path, e.g. assets/doctors/foo.jpg) so the published site has ZERO runtime
 * Supabase dependency. If the doctor-photos bucket holds an object at that
 * basename (an admin upload), it is the source of truth and is downloaded into
 * assets/doctors/, overwriting the local copy. If no bucket object exists (the
 * seeded photos), the already-committed local file is kept as-is.
 *
 * No npm dependencies — uses Node's global fetch (Node 18+). Config comes from
 * env vars SUPABASE_URL / SUPABASE_ANON_KEY, falling back to a local .env file.
 *
 * Usage:  node scripts/generate-team.mjs
 * ========================================================================== */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEAM_HTML = resolve(ROOT, 'team.html');
const DOCTORS_DIR = resolve(ROOT, 'assets', 'doctors');

const START = '<!-- DOCTORS:START';
const END = '<!-- DOCTORS:END -->';

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

const ARROW_SVG =
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const ANON_SVG =
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8.5" r="4"/><path d="M4 20c0-4.2 3.6-7 8-7s8 2.8 8 7v1H4z"/></svg>';

function renderPhoto(d) {
  const name = esc(d.name);
  if (d.photo_mode === 'photo' && d.photo_path) {
    return [
      `          <div class="doc__photo">`,
      `            <img src="${escAttr(d.photo_path)}" alt="${escAttr(d.name + '醫師')}" loading="lazy" />`,
      `          </div>`,
    ].join('\n');
  }
  if (d.photo_mode === 'anon') {
    return [
      `          <div class="doc__photo">`,
      `            <div class="doc__ph doc__ph--anon" role="img" aria-label="${escAttr(d.name + '醫師（不提供照片）')}">`,
      `              ${ANON_SVG}`,
      `            </div>`,
      `          </div>`,
    ].join('\n');
  }
  // placeholder — family-name monogram (first character of the name)
  const monogram = esc([...String(d.name)][0] || '');
  return [
    `          <div class="doc__photo">`,
    `            <!-- TODO: replace with real portrait when provided -->`,
    `            <div class="doc__ph" role="img" aria-label="${escAttr(d.name + '醫師（照片待提供）')}"><span>${monogram}</span></div>`,
    `          </div>`,
  ].join('\n');
}

function renderSpec(d) {
  const pending = d.specialty_pending
    ? `專長<span class="doc__pending">待醫師確認</span>`
    : `專長`;
  return [
    `            <div class="doc__spec">`,
    `              <div class="doc__label">${pending}</div>`,
    `              <p>${esc(d.specialty)}</p>`,
    `            </div>`,
  ].join('\n');
}

function renderCv(d) {
  const items = Array.isArray(d.credentials) ? d.credentials : [];
  const lis = items.map((c) => `              <li>${esc(c)}</li>`).join('\n');
  return [`            <ul class="doc__cv">`, lis, `            </ul>`].join('\n');
}

function renderClinics(d) {
  const clinics = Array.isArray(d.clinics) ? d.clinics : [];
  const links = clinics.map((c) =>
    `              <a href="${escAttr(c.url)}">${esc(c.label)}\n                ${ARROW_SVG}</a>`
  ).join('\n');
  return [`            <div class="doc__clinic">`, links, `            </div>`].join('\n');
}

function renderCard(d, i) {
  const stagger = ['', ' d1', ' d2'][i % 3];
  return [
    `        <article class="doc reveal${stagger}">`,
    renderPhoto(d),
    `          <div class="doc__body">`,
    `            <h2 class="doc__name">${esc(d.name)}</h2>`,
    `            <p class="doc__role">${esc(d.role)}</p>`,
    renderSpec(d),
    renderCv(d),
    renderClinics(d),
    `          </div>`,
    `        </article>`,
  ].join('\n');
}

async function fileExists(p) {
  try { await access(p, FS.F_OK); return true; } catch { return false; }
}

// Ensure the local photo file exists; bucket object (if any) wins as source of truth.
async function syncPhoto(cfg, d) {
  if (d.photo_mode !== 'photo' || !d.photo_path) return;
  const base = basename(d.photo_path);
  const localPath = resolve(ROOT, d.photo_path);
  const publicUrl = `${cfg.url}/storage/v1/object/public/doctor-photos/${encodeURIComponent(base)}`;
  let res;
  try { res = await fetch(publicUrl); } catch { res = null; }
  if (res && res.ok) {
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(DOCTORS_DIR, { recursive: true });
    await writeFile(localPath, buf);
    console.log(`  · downloaded bucket photo → ${d.photo_path} (${buf.length} bytes)`);
    return;
  }
  if (await fileExists(localPath)) {
    console.log(`  · kept local photo ${d.photo_path} (no bucket object)`);
  } else {
    console.warn(`  ! WARNING: ${d.photo_path} missing locally and not in bucket`);
  }
}

async function main() {
  const cfg = await loadConfig();
  const endpoint = `${cfg.url}/rest/v1/doctors?select=*&order=display_order.asc`;
  const res = await fetch(endpoint, {
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
  });
  if (!res.ok) {
    console.error(`ERROR: doctors fetch failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const doctors = await res.json();
  if (!Array.isArray(doctors) || doctors.length === 0) {
    console.error('ERROR: no doctors returned — refusing to wipe the block.');
    process.exit(1);
  }
  console.log(`Fetched ${doctors.length} doctors.`);

  for (const d of doctors) await syncPhoto(cfg, d);

  const cards = doctors.map(renderCard).join('\n\n');
  const block = `\n\n${cards}\n\n        `; // keep blank lines + END indentation

  const html = await readFile(TEAM_HTML, 'utf8');
  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.error('ERROR: DOCTORS markers not found in team.html.');
    process.exit(1);
  }
  const startClose = html.indexOf('-->', startIdx) + 3; // end of the START comment
  const next = html.slice(0, startClose) + block + html.slice(endIdx);
  if (next === html) {
    console.log('No change to team.html.');
  } else {
    await writeFile(TEAM_HTML, next);
    console.log('team.html DOCTORS block regenerated.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
