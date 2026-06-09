/* Admin app — login-gated doctor editor.
 * Uses ONLY the anon key + Supabase Auth. RLS enforces that only an admin can
 * write; the anon key is browser-safe. No service-role key, no PAT here. */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CFG = window.SUPABASE_CONFIG;
const sb = createClient(CFG.url, CFG.anonKey);
const BUCKET = 'doctor-photos';

const $ = (id) => document.getElementById(id);
const loginView = $('loginView'), appView = $('appView');

let doctors = [];
let current = null;        // currently edited doctor object (or null for new)

/* ---------- auth ---------- */
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

async function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
  await loadDoctors();
}
function showLogin(msg) {
  appView.hidden = true;
  loginView.hidden = false;
  $('loginError').textContent = msg || '';
}

async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (session && await isAdmin()) return showApp();
  if (session) { await sb.auth.signOut(); return showLogin('此帳號沒有管理員權限。'); }
  showLogin('');
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loginBtn').disabled = true;
  $('loginError').textContent = '';
  const { error } = await sb.auth.signInWithPassword({
    email: $('email').value.trim(), password: $('password').value,
  });
  if (error) { $('loginBtn').disabled = false; return showLogin('登入失敗：' + error.message); }
  if (await isAdmin()) { $('loginBtn').disabled = false; return showApp(); }
  await sb.auth.signOut();
  $('loginBtn').disabled = false;
  showLogin('此帳號沒有管理員權限。');
});

$('logoutBtn').addEventListener('click', async () => { await sb.auth.signOut(); showLogin(''); });

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
    msg.textContent = '已觸發重新產生：GitHub Action 會更新 team.html 與 news.html 並重新部署（約 1–2 分鐘）。';
  } catch (err) {
    msg.textContent =
      '無法自動觸發（Edge Function 尚未部署或未設定 PAT）。' +
      '可改用：GitHub → Actions →「Regenerate team.html + news.html」→ Run workflow 手動發佈。詳見 supabase/README.md。';
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

/* ---------- section switcher (醫療團隊 / 最新消息) ---------- */
const doctorView = $('doctorView'), newsView = $('newsView');
const navDoctorsBtn = $('navDoctors'), navNewsBtn = $('navNews');

function showSection(which) {
  const isNews = which === 'news';
  doctorView.hidden = isNews;
  newsView.hidden = !isNews;
  navDoctorsBtn.setAttribute('aria-selected', isNews ? 'false' : 'true');
  navNewsBtn.setAttribute('aria-selected', isNews ? 'true' : 'false');
  if (isNews && !newsLoaded) { newsLoaded = true; loadNews(); }
}
navDoctorsBtn.addEventListener('click', () => showSection('doctors'));
navNewsBtn.addEventListener('click', () => showSection('news'));

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

init();
