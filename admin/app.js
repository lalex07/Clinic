/* Admin app — login-gated doctor editor.
 * Uses ONLY the anon key + Supabase Auth. RLS enforces that only an admin can
 * write; the anon key is browser-safe. No service-role key, no PAT here. */
// supabase-js is loaded as a pinned, SRI-checked UMD <script> in index.html (it
// exposes the global `supabase`). Bare ESM `import` URLs can't carry an integrity
// attribute, so we use the global instead of importing from the CDN here.
const { createClient } = window.supabase;

const CFG = window.SUPABASE_CONFIG;
const sb = createClient(CFG.url, CFG.anonKey);
const BUCKET = 'doctor-photos';

const $ = (id) => document.getElementById(id);
const loginView = $('loginView'), appView = $('appView');
const mfaEnrollView = $('mfaEnrollView'), mfaChallengeView = $('mfaChallengeView');

let doctors = [];
let current = null;        // currently edited doctor object (or null for new)

/* ---------- auth + MFA (TOTP two-step verification) ----------
 * App-level enforcement: the admin must reach session AAL2 (password + a
 * verified TOTP factor) AND pass isAdmin() before the editor (showApp) is shown.
 *
 * NOTE — this is APP-LEVEL ONLY. RLS still gates writes on is_admin(), NOT on
 * aal2. Tightening RLS to require aal2 is a deliberate follow-up AFTER the admin
 * has enrolled a factor — doing it before enrollment would lock the admin out of
 * their own database. See progress.md.
 *
 * RECOVERY — if the authenticator is lost or enrollment/login breaks, an admin
 * can delete the factor in the Supabase dashboard → Authentication → Users →
 * (the user) → Factors, then log in again to re-enrol. (The browser anon key
 * cannot remove another session's verified factor, so the dashboard is the path.)
 */
function setView(name) {
  loginView.hidden = name !== 'login';
  mfaEnrollView.hidden = name !== 'enroll';
  mfaChallengeView.hidden = name !== 'challenge';
  appView.hidden = name !== 'app';
}

async function isAdmin() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data, error } = await sb.from('profiles')
    .select('role, active, full_name').eq('id', user.id).maybeSingle();
  if (error || !data) return false;
  if (data.role === 'admin' && data.active) {
    $('whoami').textContent = `· ${data.full_name || user.email}`;
    return true;
  }
  return false;
}

// Current Authenticator Assurance Level: { currentLevel, nextLevel } or null on error.
async function currentAAL() {
  const { data, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return null;
  return data;
}

async function showApp() {
  setView('app');
  await loadDoctors();
}
function showLogin(msg) {
  setView('login');
  $('loginBtn').disabled = false;
  $('loginError').textContent = msg || '';
}

// Route a signed-in (password) session by its AAL. Never shows the app directly —
// only the aal2 branch reaches gateAndShowApp().
async function routeByAAL() {
  const aal = await currentAAL();
  if (!aal) { await sb.auth.signOut(); return showLogin('無法確認驗證狀態，請重新登入。'); }
  if (aal.currentLevel === 'aal2') return gateAndShowApp();   // second factor already satisfied
  if (aal.nextLevel === 'aal2') return showChallenge();       // a verified factor exists → challenge
  return showEnroll();                                        // no factor yet → first-time setup
}

// Final gate: require BOTH aal2 (second factor verified this session) AND admin.
async function gateAndShowApp() {
  const aal = await currentAAL();
  if (!aal || aal.currentLevel !== 'aal2') return showLogin('需要完成兩步驟驗證。');
  if (await isAdmin()) return showApp();
  await sb.auth.signOut();
  return showLogin('此帳號沒有管理員權限。');
}

/* ----- challenge an existing, verified TOTP factor ----- */
let challengeFactorId = null;
async function showChallenge() {
  const { data, error } = await sb.auth.mfa.listFactors();
  if (error) { await sb.auth.signOut(); return showLogin('無法載入驗證因子：' + error.message); }
  const totp = (data && data.totp && data.totp[0]) || null;   // listFactors().totp = verified TOTP only
  if (!totp) return showEnroll();                             // none verified → fall back to enroll
  challengeFactorId = totp.id;
  $('mfaChallengeCode').value = '';
  $('mfaChallengeError').textContent = '';
  setView('challenge');
  $('mfaChallengeCode').focus();
}

/* ----- first-time TOTP enrollment ----- */
let enrollFactorId = null;
async function showEnroll() {
  $('mfaEnrollError').textContent = '';
  try {
    // Clear any leftover UNVERIFIED factor from an abandoned earlier attempt so they
    // don't accumulate (listFactors().all includes unverified; .totp lists verified only).
    const { data: list } = await sb.auth.mfa.listFactors();
    for (const f of (list && list.all) || []) {
      if (f.factor_type === 'totp' && f.status !== 'verified') {
        await sb.auth.mfa.unenroll({ factorId: f.id });
      }
    }
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw error;
    enrollFactorId = data.id;
    $('mfaQr').src = data.totp.qr_code;       // SVG data URI from Supabase
    $('mfaSecret').textContent = data.totp.secret;
    $('mfaEnrollCode').value = '';
    setView('enroll');
    $('mfaEnrollCode').focus();
  } catch (err) {
    await sb.auth.signOut();
    showLogin('無法開始兩步驟驗證設定：' + (err.message || err));
  }
}

// Shared verify: challenge the factor, then verify the 6-digit code. Throws on failure.
// On success supabase-js upgrades the stored session to aal2.
async function verifyFactor(factorId, code) {
  const { data: ch, error: chErr } = await sb.auth.mfa.challenge({ factorId });
  if (chErr) throw chErr;
  const { error: vErr } = await sb.auth.mfa.verify({ factorId, challengeId: ch.id, code });
  if (vErr) throw vErr;
}

/* ---------- view handlers ---------- */
async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return showLogin('');
  // Re-check AAL on every load (not just session presence) so a password-only
  // (aal1) session can't reach the editor simply by reloading the page.
  await routeByAAL();
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loginBtn').disabled = true;
  $('loginError').textContent = '';
  const { error } = await sb.auth.signInWithPassword({
    email: $('email').value.trim(), password: $('password').value,
  });
  $('loginBtn').disabled = false;
  if (error) return showLogin('登入失敗：' + error.message);
  await routeByAAL();
});

$('mfaChallengeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('mfaChallengeBtn').disabled = true;
  $('mfaChallengeError').textContent = '';
  try {
    await verifyFactor(challengeFactorId, $('mfaChallengeCode').value.trim());
    await gateAndShowApp();                  // session is now aal2
  } catch (err) {
    $('mfaChallengeError').textContent = '驗證失敗：' + (err.message || err) + '（請確認驗證碼後重試）';
  } finally {
    $('mfaChallengeBtn').disabled = false;
  }
});

$('mfaEnrollForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('mfaEnrollBtn').disabled = true;
  $('mfaEnrollError').textContent = '';
  try {
    await verifyFactor(enrollFactorId, $('mfaEnrollCode').value.trim());
    await gateAndShowApp();                  // factor verified → session upgraded to aal2
  } catch (err) {
    $('mfaEnrollError').textContent = '啟用失敗：' + (err.message || err) + '（請確認驗證碼後重試）';
  } finally {
    $('mfaEnrollBtn').disabled = false;
  }
});

async function logout() { await sb.auth.signOut(); challengeFactorId = enrollFactorId = null; showLogin(''); }
$('logoutBtn').addEventListener('click', logout);
$('mfaChallengeCancel').addEventListener('click', logout);
$('mfaEnrollCancel').addEventListener('click', logout);

/* ---------- list ---------- */
async function loadDoctors() {
  const { data, error } = await sb.from('doctors').select('*').order('display_order', { ascending: true });
  if (error) { alert('讀取失敗：' + error.message); return; }
  doctors = data || [];
  const ul = $('doctorList');
  ul.innerHTML = '';
  for (const d of doctors) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-current', current && current.id === d.id ? 'true' : 'false');
    b.innerHTML = `<span class="dl-name"></span><span class="dl-role"></span>`;
    b.querySelector('.dl-name').textContent = d.name;
    b.querySelector('.dl-role').textContent = d.role || '';
    b.addEventListener('click', () => editDoctor(d));
    li.appendChild(b);
    ul.appendChild(li);
  }
}

/* ---------- editor ---------- */
function rowInput(value, placeholder) {
  const li = document.createElement('li');
  const input = document.createElement('input');
  input.type = 'text'; input.value = value || ''; input.placeholder = placeholder || '';
  const rm = document.createElement('button');
  rm.type = 'button'; rm.className = 'admin-btn admin-btn--sm rm'; rm.textContent = '✕';
  rm.addEventListener('click', () => li.remove());
  li.append(input, rm);
  return li;
}
function clinicRow(c) {
  const li = document.createElement('li');
  const label = document.createElement('input');
  label.type = 'text'; label.value = c?.label || ''; label.placeholder = '標籤（例：新店總院）'; label.className = 'c-label';
  const url = document.createElement('input');
  url.type = 'text'; url.value = c?.url || ''; url.placeholder = '連結（例：location-xindian.html）'; url.className = 'c-url';
  const rm = document.createElement('button');
  rm.type = 'button'; rm.className = 'admin-btn admin-btn--sm rm'; rm.textContent = '✕';
  rm.addEventListener('click', () => li.remove());
  li.append(label, url, rm);
  return li;
}

function editDoctor(d) {
  current = d || null;
  $('editorEmpty').hidden = true;
  $('editForm').hidden = false;
  $('docId').value = d?.id || '';
  $('f_name').value = d?.name || '';
  $('f_role').value = d?.role || '';
  $('f_slug').value = d?.slug || '';
  $('f_specialty').value = d?.specialty || '';
  $('f_pending').checked = d ? !!d.specialty_pending : true;
  $('f_order').value = d?.display_order ?? '';
  $('f_photo_mode').value = d?.photo_mode || 'photo';

  const cv = $('cvList'); cv.innerHTML = '';
  (Array.isArray(d?.credentials) ? d.credentials : []).forEach((c) => cv.appendChild(rowInput(c, '學經歷一項')));
  const cl = $('clinicList'); cl.innerHTML = '';
  (Array.isArray(d?.clinics) ? d.clinics : []).forEach((c) => cl.appendChild(clinicRow(c)));

  $('saveMsg').textContent = '';
  $('deleteBtn').hidden = !d;
  syncPhotoUi(d?.photo_path);
  loadDoctors(); // refresh aria-current highlight
}

function syncPhotoUi(photoPath) {
  const mode = $('f_photo_mode').value;
  $('photoRow').style.display = mode === 'photo' ? 'flex' : 'none';
  const prev = $('photoPreview');
  if (mode === 'photo' && photoPath) {
    prev.style.backgroundImage = `url(../${photoPath})`;
    $('photoPathLabel').textContent = photoPath;
  } else {
    prev.style.backgroundImage = 'none';
    $('photoPathLabel').textContent = '';
  }
}
$('f_photo_mode').addEventListener('change', () => syncPhotoUi(current?.photo_path));

$('addCv').addEventListener('click', () => $('cvList').appendChild(rowInput('', '學經歷一項')));
$('addClinic').addEventListener('click', () => $('clinicList').appendChild(clinicRow()));
$('newBtn').addEventListener('click', () => editDoctor(null));

function slugify(s) {
  return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function uploadPhotoIfAny(slug) {
  const file = $('f_photo').files[0];
  if (!file) return null;
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const key = `${slug}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(key, file, { upsert: true, contentType: file.type });
  if (error) throw new Error('照片上傳失敗：' + error.message);
  return `assets/doctors/${key}`;
}

$('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('saveBtn').disabled = true;
  $('saveMsg').textContent = '儲存中…';
  try {
    const slug = $('f_slug').value.trim() || slugify($('f_name').value);
    const credentials = [...$('cvList').querySelectorAll('input')].map((i) => i.value.trim()).filter(Boolean);
    const clinics = [...$('clinicList').querySelectorAll('li')].map((li) => ({
      label: li.querySelector('.c-label').value.trim(),
      url: li.querySelector('.c-url').value.trim(),
    })).filter((c) => c.label || c.url);
    const mode = $('f_photo_mode').value;

    let photo_path = current?.photo_path ?? null;
    if (mode === 'photo') {
      const uploaded = await uploadPhotoIfAny(slug);
      if (uploaded) photo_path = uploaded;
    } else {
      photo_path = null; // anon / placeholder carry no path
    }

    const row = {
      slug,
      name: $('f_name').value.trim(),
      role: $('f_role').value.trim() || null,
      specialty: $('f_specialty').value.trim() || null,
      specialty_pending: $('f_pending').checked,
      credentials, clinics,
      photo_mode: mode,
      photo_path,
      display_order: $('f_order').value === '' ? null : Number($('f_order').value),
    };

    let res;
    const id = $('docId').value;
    if (id) res = await sb.from('doctors').update(row).eq('id', id).select().single();
    else res = await sb.from('doctors').insert(row).select().single();
    if (res.error) throw new Error(res.error.message);

    $('saveMsg').textContent = '已儲存 ✓（記得「發佈到網站」讓變更上線）';
    $('f_photo').value = '';
    current = res.data;
    $('docId').value = res.data.id;
    $('deleteBtn').hidden = false;
    syncPhotoUi(res.data.photo_path);
    await loadDoctors();
  } catch (err) {
    $('saveMsg').textContent = '✗ ' + err.message;
  } finally {
    $('saveBtn').disabled = false;
  }
});

$('deleteBtn').addEventListener('click', async () => {
  const id = $('docId').value;
  if (!id || !confirm('確定刪除這位醫師？此動作無法復原。')) return;
  const { error } = await sb.from('doctors').delete().eq('id', id);
  if (error) { $('saveMsg').textContent = '✗ ' + error.message; return; }
  current = null;
  $('editForm').hidden = true;
  $('editorEmpty').hidden = false;
  await loadDoctors();
});

/* ---------- publish (trigger regeneration) ---------- */
$('publishBtn').addEventListener('click', async () => {
  const msg = $('publishMsg');
  msg.hidden = false;
  msg.textContent = '正在請求重新產生網站…';
  try {
    const { error } = await sb.functions.invoke(CFG.regenFunction, { body: { reason: 'admin-publish' } });
    if (error) throw error;
    msg.textContent = '已觸發重新產生：GitHub Action 會更新 team.html、news.html 與 衛教專欄 並重新部署（約 1–2 分鐘）。';
  } catch (err) {
    msg.textContent =
      '無法自動觸發（Edge Function 尚未部署或未設定 PAT）。' +
      '可改用：GitHub → Actions →「Regenerate team.html + news.html + 衛教專欄」→ Run workflow 手動發佈。詳見 supabase/README.md。';
  }
});

/* ===================== News (最新消息) module ===================== */
/* Mirrors the doctor module above. Writes go to the `news` table / `news-images`
 * bucket; RLS enforces that only the admin can write. The public news.html stays
 * static and is regenerated by scripts/generate-news.mjs on publish. */
const NEWS_BUCKET = 'news-images';
const NEWS_CLINIC_LABEL = { xindian: '新店', muzha: '木柵', xinglong: '興隆', zhongshan: '中山' };

let newsItems = [];
let currentNews = null;     // currently edited news object (or null for new)
let newsLoaded = false;     // lazy-load the list on first switch to the news view

/* ---------- section switcher (醫療團隊 / 最新消息 / 衛教專欄) ---------- */
let faqLoaded = false;
const VIEWS = {
  doctors: { view: $('doctorView'), btn: $('navDoctors') },
  news:    { view: $('newsView'),   btn: $('navNews') },
  faq:     { view: $('faqView'),    btn: $('navFaq') },
};
function showSection(which) {
  for (const [k, v] of Object.entries(VIEWS)) {
    const on = k === which;
    v.view.hidden = !on;
    v.btn.setAttribute('aria-selected', on ? 'true' : 'false');
  }
  if (which === 'news' && !newsLoaded) { newsLoaded = true; loadNews(); }
  if (which === 'faq' && !faqLoaded) { faqLoaded = true; loadFaq(); }
}
VIEWS.doctors.btn.addEventListener('click', () => showSection('doctors'));
VIEWS.news.btn.addEventListener('click', () => showSection('news'));
VIEWS.faq.btn.addEventListener('click', () => showSection('faq'));

/* ---------- list ---------- */
async function loadNews() {
  const { data, error } = await sb.from('news').select('*').order('date', { ascending: false });
  if (error) { alert('讀取消息失敗：' + error.message); return; }
  newsItems = data || [];
  const ul = $('newsList');
  ul.innerHTML = '';
  for (const n of newsItems) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-current', currentNews && currentNews.id === n.id ? 'true' : 'false');
    b.innerHTML = `<span class="dl-name"></span><span class="dl-role"></span>`;
    b.querySelector('.dl-name').textContent = n.title;
    const status = n.status === 'published' ? '已發佈' : '草稿';
    b.querySelector('.dl-role').textContent =
      `${NEWS_CLINIC_LABEL[n.clinic] || n.clinic}・${n.date}・${status}`;
    b.addEventListener('click', () => editNews(n));
    li.appendChild(b);
    ul.appendChild(li);
  }
}

/* ---------- editor ---------- */
function syncNewsImageUi(imagePath) {
  const prev = $('newsImagePreview');
  if (imagePath) {
    prev.style.backgroundImage = `url(../${imagePath})`;
    $('newsImagePathLabel').textContent = imagePath;
    $('newsImageClear').hidden = false;
  } else {
    prev.style.backgroundImage = 'none';
    $('newsImagePathLabel').textContent = '';
    $('newsImageClear').hidden = true;
  }
}

function editNews(n) {
  currentNews = n || null;
  $('newsEditorEmpty').hidden = true;
  $('newsForm').hidden = false;
  $('newsId').value = n?.id || '';
  $('n_title').value = n?.title || '';
  $('n_body').value = n?.body || '';
  $('n_clinic').value = n?.clinic || 'xindian';
  $('n_date').value = n?.date || '';
  $('n_status').value = n?.status || 'draft';
  $('n_image').value = '';
  $('newsSaveMsg').textContent = '';
  $('newsDeleteBtn').hidden = !n;
  syncNewsImageUi(n?.image_path || null);
  loadNews(); // refresh aria-current highlight
}

$('newsNewBtn').addEventListener('click', () => editNews(null));

// "remove image" → fall back to the 公告 placeholder tile (cleared on next save)
$('newsImageClear').addEventListener('click', () => {
  if (currentNews) currentNews = { ...currentNews, image_path: null };
  $('n_image').value = '';
  syncNewsImageUi(null);
});

// instant local preview when a file is chosen
$('n_image').addEventListener('change', () => {
  const file = $('n_image').files[0];
  if (file) {
    $('newsImagePreview').style.backgroundImage = `url(${URL.createObjectURL(file)})`;
    $('newsImageClear').hidden = false;
  }
});

// upload to news-images keyed by the row id; returns the local path, or undefined (no file → no change)
async function uploadNewsImageIfAny(id) {
  const file = $('n_image').files[0];
  if (!file) return undefined;
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const key = `${id}.${ext}`;
  const { error } = await sb.storage.from(NEWS_BUCKET).upload(key, file, { upsert: true, contentType: file.type });
  if (error) throw new Error('圖片上傳失敗：' + error.message);
  return `assets/news/${key}`;
}

$('newsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('newsSaveBtn').disabled = true;
  $('newsSaveMsg').textContent = '儲存中…';
  try {
    const existingId = $('newsId').value;
    const id = existingId || crypto.randomUUID();
    const status = $('n_status').value;

    // image: upload if a new file was chosen; else keep current (or null if cleared)
    let image_path = currentNews?.image_path ?? null;
    const uploaded = await uploadNewsImageIfAny(id);
    if (uploaded !== undefined) image_path = uploaded;

    const row = {
      title: $('n_title').value.trim(),
      body: $('n_body').value.trim() || null,
      clinic: $('n_clinic').value,
      date: $('n_date').value,
      status,
      image_path,
      // stamp published_at on publish; clear when sent back to draft
      published_at: status === 'published' ? (currentNews?.published_at || new Date().toISOString()) : null,
    };

    let res;
    if (existingId) {
      res = await sb.from('news').update(row).eq('id', existingId).select().single();
    } else {
      const { data: { user } } = await sb.auth.getUser();
      res = await sb.from('news').insert({ ...row, id, author_id: user?.id ?? null }).select().single();
    }
    if (res.error) throw new Error(res.error.message);

    $('newsSaveMsg').textContent = '已儲存 ✓（記得「發佈到網站」讓變更上線）';
    $('n_image').value = '';
    currentNews = res.data;
    $('newsId').value = res.data.id;
    $('newsDeleteBtn').hidden = false;
    syncNewsImageUi(res.data.image_path);
    await loadNews();
  } catch (err) {
    $('newsSaveMsg').textContent = '✗ ' + err.message;
  } finally {
    $('newsSaveBtn').disabled = false;
  }
});

$('newsDeleteBtn').addEventListener('click', async () => {
  const id = $('newsId').value;
  if (!id || !confirm('確定刪除這則消息？此動作無法復原。')) return;
  const { error } = await sb.from('news').delete().eq('id', id);
  if (error) { $('newsSaveMsg').textContent = '✗ ' + error.message; return; }
  currentNews = null;
  $('newsForm').hidden = true;
  $('newsEditorEmpty').hidden = false;
  await loadNews();
});

/* ===================== FAQ (衛教專欄) module ===================== */
/* Mirrors the doctor/news editors. body_html is the canonical source the
 * generator emits verbatim; Markdown is a convenience layer ON TOP of it with a
 * strict round-trip safety gate (never let a lossy conversion rewrite approved
 * copy). §九 + 院長-review apply — see the reminder in the form. */
const FAQ_BUCKET = 'faq-images';
const FAQ_CTA = '        <a class="faq-cta" href="locations.html">若您有相關困擾，歡迎至大豐耳鼻喉科門診評估 <span aria-hidden="true">→</span></a>';

let faqItems = [];
let currentFaq = null;
let faqBodyMode = 'md';   // 'md' = editable Markdown; 'raw' = raw body_html (read-mostly)

/* ---- Markdown <-> the standard faq-article body_html (exact inverses) ---- */
function faqHtmlToMd(body) {
  if (typeof body !== 'string' || !body.startsWith('\n')) return null;
  const tail = '\n\n' + FAQ_CTA;
  if (!body.endsWith(tail)) return null;
  const inner = body.slice(1, body.length - tail.length);
  const out = [];
  for (const b of inner.split('\n\n')) {
    let m;
    if ((m = b.match(/^        <p>(.*)<\/p>$/))) { out.push(m[1]); continue; }
    if ((m = b.match(/^        <h2 class="faq-sub">(.*)<\/h2>\n        <p>(.*)<\/p>$/))) { out.push(`## ${m[1]}\n\n${m[2]}`); continue; }
    return null; // unrecognized shape -> not safely round-trippable
  }
  return out.join('\n\n');
}
function faqMdToHtml(md) {
  const blocks = md.split(/\n\n+/).map((s) => s.trim()).filter((s) => s.length);
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.startsWith('## ')) {
      const h = b.slice(3).trim();
      const next = blocks[i + 1];
      if (next != null && !next.startsWith('## ')) { out.push(`        <h2 class="faq-sub">${h}</h2>\n        <p>${next}</p>`); i++; }
      else { out.push(`        <h2 class="faq-sub">${h}</h2>`); }
    } else {
      out.push(`        <p>${b}</p>`);
    }
  }
  return '\n' + out.join('\n\n') + '\n\n' + FAQ_CTA;
}

/* ---------- list ---------- */
async function loadFaq() {
  const { data, error } = await sb.from('faq_articles').select('*').order('display_order', { ascending: true });
  if (error) { alert('讀取衛教文章失敗：' + error.message); return; }
  faqItems = data || [];
  const ul = $('faqList');
  ul.innerHTML = '';
  for (const a of faqItems) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-current', currentFaq && currentFaq.id === a.id ? 'true' : 'false');
    b.innerHTML = `<span class="dl-name"></span><span class="dl-role"></span>`;
    b.querySelector('.dl-name').textContent = a.title;
    b.querySelector('.dl-role').textContent = `${a.slug}・${a.status === 'published' ? '已發佈' : '草稿'}`;
    b.addEventListener('click', () => editFaq(a));
    li.appendChild(b);
    ul.appendChild(li);
  }
}

function nextFaqSlug() {
  let max = 0;
  for (const a of faqItems) { const m = /^q(\d+)$/.exec(a.slug || ''); if (m) max = Math.max(max, +m[1]); }
  return `q${max + 1}`;
}

/* ---------- editor ---------- */
function syncFaqCoverUi(coverPath) {
  const prev = $('faqCoverPreview');
  if (coverPath) {
    prev.style.backgroundImage = `url(../${coverPath.split('?')[0]})`;
    $('faqCoverPathLabel').textContent = coverPath;
  } else {
    prev.style.backgroundImage = 'none';
    $('faqCoverPathLabel').textContent = '';
  }
}

function editFaq(a) {
  currentFaq = a || null;
  $('faqEditorEmpty').hidden = true;
  $('faqForm').hidden = false;
  $('faqId').value = a?.id || '';
  $('f_faq_title').value = a?.title || '';
  $('f_faq_excerpt').value = a?.excerpt || '';
  $('f_faq_category').value = a?.category || '';
  $('f_faq_status').value = a?.status || 'draft';
  $('f_faq_order').value = a?.display_order ?? '';
  $('f_faq_slug').value = a?.slug || (a ? '' : `（將指派：${nextFaqSlug()}）`);
  $('f_faq_keywords').value = Array.isArray(a?.search_keywords) ? a.search_keywords.join(', ') : '';
  $('f_faq_cover').value = '';
  $('f_faq_cover_alt').value = a?.cover_alt || '';
  syncFaqCoverUi(a?.cover_path || null);

  // body: prefer editable Markdown, but only if it round-trips byte-for-byte
  const flag = $('faqBodyFlag');
  if (a && a.body_html) {
    const md = faqHtmlToMd(a.body_html);
    if (md != null && faqMdToHtml(md) === a.body_html) {
      faqBodyMode = 'md';
      $('f_faq_body').value = md;
      flag.hidden = false; flag.className = 'admin-bodyflag admin-span2 is-md';
      flag.textContent = 'Markdown 模式：段落空行分隔、## 為章節小標，結尾 CTA 自動附加。';
    } else {
      faqBodyMode = 'raw';
      $('f_faq_body').value = a.body_html;
      flag.hidden = false; flag.className = 'admin-bodyflag admin-span2';
      flag.textContent = '⚠ 此文無法安全轉為 Markdown，顯示原始 HTML（read-mostly）。請勿改動已核可文字，僅在必要時謹慎編輯。';
    }
  } else {
    faqBodyMode = 'md';
    $('f_faq_body').value = '';
    flag.hidden = false; flag.className = 'admin-bodyflag admin-span2 is-md';
    flag.textContent = 'Markdown 模式：第一段為前言；## 小標自成章節；結尾 CTA 自動附加（請勿自行輸入）。';
  }

  $('f_faq_body').readOnly = faqBodyMode === 'raw';
  $('faqSaveMsg').textContent = '';
  $('faqDeleteBtn').hidden = !a;
  loadFaq();
}

$('faqNewBtn').addEventListener('click', () => editFaq(null));
$('f_faq_cover').addEventListener('change', () => {
  const file = $('f_faq_cover').files[0];
  if (file) $('faqCoverPreview').style.backgroundImage = `url(${URL.createObjectURL(file)})`;
});

async function uploadFaqCoverIfAny(slug) {
  const file = $('f_faq_cover').files[0];
  if (!file) return undefined;
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const key = `faq-${slug}.${ext}`;
  const { error } = await sb.storage.from(FAQ_BUCKET).upload(key, file, { upsert: true, contentType: file.type });
  if (error) throw new Error('封面上傳失敗：' + error.message);
  // ?v= cache-buster: the bucket key is fixed per slug (upsert), so without a
  // fresh version every cache layer (visitor browser, GitHub Pages CDN, and the
  // storage CDN the generator downloads from — max-age=3600) keeps serving the
  // PREVIOUS cover after a replacement. Same convention as the manual ?v=2/?v=4
  // on existing articles; generate-faq.mjs strips it for the local filename.
  return `assets/faq/${key}?v=${Date.now()}`;
}

$('faqForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('faqSaveBtn').disabled = true;
  $('faqSaveMsg').textContent = '儲存中…';
  try {
    const existingId = $('faqId').value;
    const slug = existingId ? currentFaq.slug : nextFaqSlug();

    // body: Markdown -> canonical HTML, or raw HTML as-is
    const bodyText = $('f_faq_body').value;
    const body_html = faqBodyMode === 'raw' ? bodyText : faqMdToHtml(bodyText);

    // cover (required so the hero <figure> has a real image)
    let cover_path = currentFaq?.cover_path ?? null;
    const uploaded = await uploadFaqCoverIfAny(slug);
    if (uploaded !== undefined) cover_path = uploaded;
    if (!cover_path) throw new Error('請先上傳封面圖片');

    const kws = $('f_faq_keywords').value.split(',').map((s) => s.trim()).filter(Boolean);
    const title = $('f_faq_title').value.trim();
    const excerpt = $('f_faq_excerpt').value.trim() || null;
    const status = $('f_faq_status').value;
    const common = {
      title,
      excerpt,
      body_html,
      cover_path,
      cover_alt: $('f_faq_cover_alt').value.trim() || null,
      category: $('f_faq_category').value.trim() || null,
      search_keywords: kws.length ? kws : null,
      display_order: $('f_faq_order').value === '' ? null : Number($('f_faq_order').value),
      status,
    };

    let res;
    if (existingId) {
      // preserve description / sitemap_lastmod / search_summary / slug / author_id;
      // stamp published_at on first publish only
      const patch = { ...common };
      if (status === 'published' && !currentFaq.published_at) patch.published_at = new Date().toISOString();
      res = await sb.from('faq_articles').update(patch).eq('id', existingId).select().single();
    } else {
      const { data: { user } } = await sb.auth.getUser();
      res = await sb.from('faq_articles').insert({
        ...common,
        slug,
        description: excerpt,                       // new articles: card summary doubles as meta description
        search_summary: null,                       // generator derives a default from the excerpt
        sitemap_lastmod: new Date().toISOString().slice(0, 10),
        author_id: user?.id ?? null,
        published_at: status === 'published' ? new Date().toISOString() : null,
      }).select().single();
    }
    if (res.error) throw new Error(res.error.message);

    $('faqSaveMsg').textContent = `已儲存 ✓（${res.data.slug}）——記得「發佈到網站」讓變更上線`;
    $('f_faq_cover').value = '';
    currentFaq = res.data;
    $('faqId').value = res.data.id;
    $('f_faq_slug').value = res.data.slug;
    $('faqDeleteBtn').hidden = false;
    syncFaqCoverUi(res.data.cover_path);
    await loadFaq();
  } catch (err) {
    $('faqSaveMsg').textContent = '✗ ' + err.message;
  } finally {
    $('faqSaveBtn').disabled = false;
  }
});

$('faqDeleteBtn').addEventListener('click', async () => {
  const id = $('faqId').value;
  if (!id || !confirm('確定刪除這篇文章？發佈後其頁面與卡片也會在下次重生成時移除。此動作無法復原。')) return;
  const { error } = await sb.from('faq_articles').delete().eq('id', id);
  if (error) { $('faqSaveMsg').textContent = '✗ ' + error.message; return; }
  // Best-effort: also remove the bucket cover. Slug numbers are recycled
  // (nextFaqSlug = max+1), so a leftover object would be inherited by the next
  // article that reuses this slug. Row deletion above is the critical part —
  // a failed object removal must not block it.
  if (currentFaq?.cover_path) {
    const base = currentFaq.cover_path.split('?')[0].split('/').pop();
    if (base) await sb.storage.from(FAQ_BUCKET).remove([base]);
  }
  currentFaq = null;
  $('faqForm').hidden = true;
  $('faqEditorEmpty').hidden = false;
  await loadFaq();
});

init();
