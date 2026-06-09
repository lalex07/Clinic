# 進度筆記 / Progress — 大豐耳鼻喉科 website

Orientation note for the next session. See `site-spec.md` for the full content brief (source of truth) and `CLAUDE.md` for the rules (design rules + compliance live there).

_Last updated: 2026-06-09 (session 41)_

## 🗓️ 2026-06-09 (session 41) — 修正 Storage 上傳 RLS：/admin/ 上傳封面圖報「new row violates row-level security policy」

`/admin/` 消息編輯器上傳封面圖失敗，報 `new row violates row-level security policy for table objects`；`news-images`（與 `doctor-photos`）皆受影響。只新增 1 個 migration（`supabase/migrations/20260609163534_storage_admin_select_for_upload_returning.sql`）＋更新 `progress.md`；未動 app 程式。

- **真因（非「缺 INSERT policy」）。** 兩 bucket 的 admin INSERT/UPDATE/DELETE policy **本來就在、且對 admin 有效**（經模擬 admin JWT 實測：純 `INSERT` 通過）。真正缺的是 **SELECT**：supabase-js `.upload()` 走 `INSERT ... RETURNING`，而 PostgreSQL 會以 **SELECT(USING) policy 檢查 RETURNING 回傳列**；Phase 1 強化（`20260608204735`）把 storage.objects 上唯一的 SELECT policy 移除（為擋 anon 列舉），導致登入的 admin 對自己剛寫入的列**無讀回可見性** → RETURNING 被擋 → 報出上述 RLS 錯誤（純 INSERT 不帶 RETURNING 會過，所以只在瀏覽器上傳時炸）。
- **修法（經 MCP，已套用）。** 為兩 bucket 各加一條 **admin 限定** 的 SELECT policy：`for select to authenticated using (bucket_id='<bucket>' and public.is_admin())`。並把 6 條寫入 policy（兩 bucket 的 INSERT/UPDATE/DELETE）以 drop-if-exists＋create **冪等重述**，讓此 migration 自成完整、可重現的「storage admin 存取」聲明。**未加任何 anon 寫入或廣域列舉 policy**，公開 READ（公開物件 URL，本就不經 policy）不受影響，**保留 Phase 1 強化意圖**（anon 仍 0 可見、不可列舉）。
- **驗證（模擬各角色 JWT，於交易內 rollback）。** 修法後：admin `INSERT ... RETURNING` 於 **news-images ✓ 與 doctor-photos ✓ 皆成功**（即真正的上傳路徑）；anon 寫入**被擋**、anon 列舉**0 列可見**；authenticated **非 admin** 寫入**被擋**、列舉**0 列可見**（SELECT policy 確為 is_admin 限定）。security advisor 無新增項（僅剩既有 2 個設計必要 WARN）。
- **未實測（需 admin 憑證）**：未以真實瀏覽器登入 admin 跑完整上傳 end-to-end（無密碼）；以上為 DB 層 RLS 模擬（含 RETURNING），與 storage-api 實際執行的 SQL 等價。**下次強化 storage 時務必保留這兩條 admin SELECT policy**，否則上傳會再次失效。

## 🗓️ 2026-06-09 (session 40) — Supabase 後端 Phase 2：最新消息（公告）可編輯化（news 表＋RLS＋news-images bucket、/admin/ 消息編輯器、generate-news.mjs、Action 一次重生成兩頁）

接續 Phase 1（醫師可編輯化），以**完全相同的模型**讓「最新消息」可編輯：單一管理員全權；公開只可讀 **published** 消息；編輯在既有 `/admin/` 進行；`news.html` 維持靜態，發佈時由 Supabase 重生成（approach A）。新增 3 個 migration、`scripts/generate-news.mjs`、`assets/news/`，並改 `admin/`（index/app/css）、`news.html`（加標記）、`.github/workflows/regen-team.yml`。**未動既有醫師編輯器與 team.html 重生成；未改 news.html 的版面／篩選器／日曆 JS，只填資料區塊。** 瀏覽器只用 anon key＋Auth，無 service-role／PAT。

- **Part A — Schema＋安全（經 Supabase MCP，已套用 3 個 migration）。** `news`（id、title、body、clinic check∈xindian/muzha/xinglong/zhongshan、date、image_path 可空、status check∈draft/published 預設 draft、author_id→auth.users、published_at、created_at/updated_at＋`set_updated_at` 觸發器；date desc／status 索引）。RLS deny-by-default、重用 Phase 1 的 `is_admin()`：anon＋authenticated **僅可 SELECT status='published'**；admin 全 CRUD（含草稿）；其餘拒絕。Storage：`news-images` bucket（公開 READ、寫入限 `is_admin()`，比照 doctor-photos 強化後狀態——不設過寬列舉 SELECT policy）。security advisor 無新增項（僅剩 Phase 1 既有的 2 個設計必要 WARN）。
- **Part B — 由現有內容 seed（不杜撰）。** 解析 news.html 唯一一張 `article.news-card`，寫入 1 列：title（中山…開幕…）、body（該段）、clinic=zhongshan、date=2026-06-01、image_path=null、status=published、author_id=該 admin。未杜撰其他公告。§九 與中山「敬請期待」狀態仍適用。
- **Part C — `/admin/` 消息編輯器（與醫師模組並存）。** topbar 加「醫療團隊／最新消息」分頁切換（`role=tablist`）；醫師編輯器原封不動。消息視圖鏡像醫師模式：清單（`#newsList`＋新增）＋表單（標題、內文 textarea、院區下拉、日期、選填封面上傳至 news-images、狀態 draft/published）。儲存寫回 news（RLS 把關；新列以 `crypto.randomUUID()` 為 id＋上傳鍵、author_id=登入者）、可刪除。重用 admin.css tokens、crisp 無光暈／漸層。表單內加 §九 審閱提醒小字（草稿→院長審閱→發佈）。既有「發佈到網站」鈕不變（觸發全站重生成）。
- **Part D — 重生成 news.html（approach A）。** `news.html` 的 `#newsGrid` 內加 `<!-- NEWS:START/END -->`（保留 grid 容器＋id 與 `#newsEmpty` 空狀態於標記外）。`scripts/generate-news.mjs`（鏡像 generate-team.mjs，純 fetch、無 npm 依賴）以 anon key 讀 published 消息（date desc），重現**完全相同的 `.news-card` markup**：`data-clinic`／`data-date`、`.news-card__meta`（`<time datetime=YYYY-MM-DD>YYYY.MM.DD</time>`＋中文院區 tag）、h2、p；有圖→`.news-card__img` 變體並把 bucket 圖下載進 `assets/news/` 引用**本地路徑**，無圖→`公告／Announcement` 預設磚。只換標記間區塊，篩選／日曆 JS 不動。`regen-team.yml` 加一步 `node scripts/generate-news.mjs`（同 env），git add 併入 `news.html assets/news`——**一次 dispatch 重生成 team.html 與 news.html**；`repository_dispatch` 事件名 `doctors-changed` 維持不變（相容）。
- **Part E — 驗證＋文件。** 見下方實測；`supabase/README.md` 補 Phase 2 段；`.env` 仍 gitignored、`.env.example` 用 placeholder；無 secrets 進 repo。

### 驗證（實測 vs 未實測）
- **實測（DB/RLS，以 anon key 實打 REST）**：anon SELECT news（不帶 status 過濾）**只回 published 那 1 列**、草稿被 RLS 隱藏；anon **INSERT 被擋（HTTP 401）**；anon 寫 news-images bucket **被擋（HTTP 400）**。臨時插入的測試草稿驗畢即刪。security advisor 無新增。
- **實測（重生成）**：`node scripts/generate-news.mjs` 對既有 seed 卡片重生成，`diff` **零變更**（產出 byte-for-byte 等於現有 markup——預設磚、日期 2026.06.01、中山 tag 皆相符）。
- **實測（前端，本機 `http://localhost:8000`，headless Chromium）**：`/admin/` 無 console error、登入卡正常、分頁切換鈕（醫療團隊／最新消息）皆在；強制顯示消息視圖確認表單 chrome 正常（§九 提醒、各欄、狀態、封面預覽、儲存/刪除）。`news.html` 無自身 console error（僅第三方 cloudflareinsights CORS，與本變更無關）、中山卡正確渲染、5 個院區篩選＋日期選擇器在、按「木柵」會隱藏中山卡並顯示空狀態（篩選 JS 仍正常）。
- **未實測（需 admin 憑證）**：登入後的消息**新增/編輯/刪除/上傳 end-to-end** 尚未實跑（admin user 於 dashboard 手動建立、註冊已關閉）；其寫入由 RLS（admin 全 CRUD＋storage 限 is_admin、anon 實測被擋）保證。Action 需在實際 repo 由 workflow_dispatch／發佈鈕觸發後才會提交重生成的 news.html。

## 🗓️ 2026-06-08 (session 39) — Admin：修正登入畫面登入後不隱藏（`[hidden]` 被 display:grid 蓋過）

`admin/` 後台登入成功後，登入畫面不會消失、蓋住編輯器。成因純 CSS：`admin/admin.css` 的 `.admin-login { display: grid }` 蓋過 HTML `hidden` 屬性的 UA 預設 `display:none`，所以 app.js 執行 `loginView.hidden = true` 後，`<section id="loginView" hidden>` 仍以 grid 顯示。auth／profiles 讀取／is_admin 檢查皆正常，只是 view 沒隱藏。

- **修正（只動 `admin/admin.css`）**：檔案頂部加入防禦性基線 `[hidden] { display: none !important; }`，讓 `hidden` 屬性永遠勝出（`!important` 蓋過非 important 的 `display:grid`，與來源順序／specificity 無關）。未動 `app.js`／`index.html`（邏輯本來就正確）。
- **驗證**：本機 `http://localhost:8000/admin/` 登入卡正常渲染（grid 置中不變）；以 headless 計算樣式實測——`.admin-login` 帶 `hidden` 計算為 `display:none`、不帶 `hidden` 仍為 `display:grid`，確認覆寫只影響隱藏狀態、不破壞可見登入版面。

## 🗓️ 2026-06-08 (session 38) — Repo 整理：封存舊進度筆記 + 文件化後端/工具佈局

純整理，無 served page 變更。`progress.md`（約 138 KB）已過大，拆分如下：

- **封存舊進度。** 新增 `docs/progress-archive.md`（`# Progress archive`，newest-first），把較舊的 session 逐字搬入（session 32 → session 1，含早期的 ⏭️ NEXT SESSION／❓ Open questions／✅ Done so far 早期狀態快照）。`progress.md` 僅保留：頂部 orientation、最近 5 篇（session 37–33，含 Supabase 後端那篇）、以及常青底部區（🎨 Design reference／⬜ Pages not yet built／🔒 Constraints to keep）。是搬移非刪除，內容不流失。
- **文件化後端/工具佈局。** 於 `CLAUDE.md` 檔案組織節新增「Backend & tooling layout」子節，描述既有的非 served 工具目錄（`supabase/`、`scripts/`、`admin/`、`.github/workflows/`，皆排除於 nav／sitemap／robots／搜尋之外），並明訂：secrets（service-role key、GitHub PAT、密碼）永不進 repo，只允許帶 placeholder 的 `.env.example`。`.gitignore` 補上 `*.env`（已有 `.env`；不影響 `.env.example`）。
- **本機清理（無 tracked 變更）**：刪除 `.DS_Store`、`temporary screenshots/`、stale `.git/index.lock`（皆 gitignored）。

## 🗓️ 2026-06-08 (session 37) — Supabase 後端 Phase 1：醫療團隊（醫師）可編輯化（doctors 表＋RLS＋storage、/admin/ 編輯器、變更時重生成 team.html）

依 `docs/supabase-admin-plan.md` 的 Phase 1 與 approach A（**公開站維持靜態**，醫師資料變更時才重生成 team.html）。模型：單一管理員帳號全權；公開可讀 doctors（公開資訊）；編輯在登入閘控的 `/admin/` 進行。新增 `admin/`、`scripts/`、`.github/workflows/`、`supabase/`，並改 `team.html`（加標記）、`robots.txt`、`.gitignore`、`.env.example`。**無任何 service-role key 或 GitHub PAT 進入瀏覽器或 repo**；瀏覽器只用 anon key＋Supabase Auth。

- **Part A — Schema＋安全（經 Supabase MCP 直接建置，已套用 3 個 migration）。**
  - `profiles`（id=auth.users id、full_name、role admin/doctor/nurse 預設 admin、active、timestamps）與 `doctors`（slug 唯一、name、role、specialty、specialty_pending=待醫師確認、credentials jsonb、clinics jsonb [{label,url}]、photo_mode photo/anon/placeholder、photo_path、display_order、updated_at 觸發器）。
  - RLS deny-by-default；`is_admin()`（SECURITY DEFINER，避免 profiles 自我遞迴）。Policies：anon＋authenticated 可 SELECT doctors（全列）；admin 對 doctors／profiles 全 CRUD；authenticated 可讀自己的 profile；其餘拒絕。
  - Storage：`doctor-photos` bucket，公開 READ、寫入限 `is_admin()`。
  - 安全 advisor：修正 `set_updated_at` search_path、移除過寬的 bucket 列舉 SELECT policy、撤銷 anon 對 `is_admin()` 的 EXECUTE。**剩 1 個 WARN（authenticated 可執行 is_admin）為設計必要**（RLS policy 需呼叫它；函式僅回傳「呼叫者本人是否為 admin」，不洩漏他人資料），已於 README 記錄。
  - Auth：公開註冊須在 dashboard 關閉、手動建立唯一 admin user 並插入 profile（role=admin）——已於 `supabase/README.md` 詳列步驟（無法由程式代做）。
- **Part B — 由現有內容 seed（不杜撰）。** 解析 team.html 全部 7 張 `article.doc`，忠實寫入 doctors：姓名／職稱／專長＋pending、credentials、clinics、display_order、photo_mode/photo_path（有 jpg=photo＋該路徑；剪影=anon；待補=placeholder）。保留各醫師 `待醫師確認` 旗標；僅 巫靚穎 specialty_pending=false（與原頁一致）。
- **Part C — `/admin/` 登入閘控編輯器（純 HTML/JS＋CDN supabase-js，no build）。** Email/密碼登入 → 檢查 is_admin → 醫師清單 → 逐位編輯表單（姓名、職稱、專長＋「待醫師確認」開關、學經歷增刪、院區連結、排序、photo_mode、照片上傳至 bucket）→ 儲存寫回 Supabase（RLS 把關）。重用 site.css tokens、crisp 無光暈／漸層。已從 nav／語言切換／sitemap／robots／搜尋索引**排除** /admin/。
- **Part D — 變更時重生成 team.html（approach A）。** team.html 加 `<!-- DOCTORS:START/END -->` 標記，重生成只動該區塊。`scripts/generate-team.mjs`（純 fetch、無 npm 依賴）以 anon key 讀 doctors 依 display_order 重現**完全相同的卡片 markup**；photo-mode 醫師的照片以 bucket 為來源下載進 `assets/doctors/` 並引用**本地路徑**，使公開站對 Supabase **零執行期依賴**。`.github/workflows/regen-team.yml`（workflow_dispatch＋repository_dispatch:doctors-changed，GITHUB_TOKEN contents:write，Supabase URL/anon 為 repo variables）重生成並提交。安全自動觸發：已部署 `regen-team` Edge Function（admin 閘控；PAT 存於函式 secret，非瀏覽器）；另記錄 Database Webhook 作法。基線（手動 workflow_dispatch／本機 `node scripts/generate-team.mjs`）已驗證可正確重生成。
- **Part E — 文件＋驗證。** `supabase/README.md`：建立專案、關閉註冊、建 admin、插 profile、key 安全表（anon vs service-role vs PAT 各放哪）、發佈流程、安全清單（2FA／HTTPS／RLS 為閘）、§九 仍規管已發佈內容。`.env` 已 gitignored、`.env.example` 用 placeholder。

### 驗證（實測 vs 未實測）
- **實測（DB/RLS）**：anon **可讀** doctors（7 列）、anon **寫入被擋**（INSERT 失敗、無殘留）；pg_policies 確認 doctors/profiles/storage policy 與設計一致；security advisor 僅剩設計必要的 1 個 WARN。
- **實測（重生成）**：`node scripts/generate-team.mjs` 重生成 team.html，`git diff` 僅移除**不可見的編輯註解**並加標記，**每張 `<article>` 卡 byte-for-byte 不變**；Chrome headless 1280 截圖確認照片／剪影／字樣占位／pending／CV／院區連結／header 單行／無光暈漸層皆與原頁相同、卡片填滿框。
- **實測（admin UI）**：`/admin/` 登入畫面以 site tokens 正常渲染（supabase-js ESM 由 CDN 載入、init 執行）。
- **未實測（需手動前置）**：登入後的 admin 編輯／上傳 end-to-end **尚未實跑**，因 admin auth user 需在 dashboard 手動建立（註冊已關閉）；其寫入路徑已由 RLS policy 層（admin 全 CRUD＋storage 限 is_admin、anon 實測被擋）保證。Edge Function 已部署但回 503，待 `GITHUB_DISPATCH_PAT`/`GITHUB_REPO` secret 設定後生效；GitHub Action 需在實際 repo 設定 variables 後由 workflow_dispatch 跑。

## 🗓️ 2026-06-08 (session 36) — 衛教專欄：q1 封面還原為原始版

把 session 35 換上的 q1 重做版**還原為原始封面**。使用者把原圖 `faq-q1 copy.png`（已是 1376×768）放在 repo 根目錄；以 `mv "faq-q1 copy.png" assets/faq/faq-q1.png` 一步覆寫重做版並移除根目錄散檔（驗為真 PNG、1376×768）。cache-bust 由 `faq-q1.png?v=3` 升為 **`?v=4`**（`faq.html`＋`faq-q1.html` 各一處）讓瀏覽器／CDN 取回還原後的圖。無其他 markup／CSS 變更。

- **驗證（本機 `http://localhost:8000`，Chrome headless 1280）**：`faq.html` q1 卡片與 `faq-q1.html` 詳情頁皆顯示原始封面、滿版填滿卡片框、無光暈／漸層，header 維持單行。
- **clinic-audit（report-only）全 PASS**：§九 無禁語（`最` 命中為 最新 nav）／無費用／頁尾免責聲明齊全；`<img>` 皆具 alt（q1 alt 仍與原圖主題相符）；repo 根目錄無散落 `.png`。

## 🗓️ 2026-06-08 (session 35) — 衛教專欄：換 q1 封面為重做版；移除卡片分類膠囊（pill chips）

兩項變更。動到 `faq.html`、`faq-q1.html`、`assets/site.css`、`assets/faq/faq-q1.png`，並刪掉誤放在 repo 根目錄的 `faq q1 image redone.png`。

- **q1 封面換成使用者重做版。** 使用者把 `faq q1 image redone.png`（1672×941，16:9）放在 repo 根目錄；以 `sips -z 768 1376` 下採樣到 **1376×768** 後覆寫 `assets/faq/faq-q1.png`（驗為真 PNG、1376×768、約 1.27MB），再 `git rm` 掉根目錄那張散檔（served 圖只放 `assets/`，不放根目錄）。cache-bust 由 `faq-q1.png?v=2` 升為 **`?v=3`**（`faq.html`＋`faq-q1.html` 各一處）讓新圖顯示。
- **移除卡片分類膠囊。** `faq.html` 17 張卡片 `.faq-card__body` 第一個子元素的 `<span class="faq-card__tag">…</span>`（小綠圓角膠囊，如 鼻過敏・睡眠、兒童睡眠呼吸中止、中耳・胃食道逆流）**全數刪除**；`assets/site.css` 移除已無用的 `.faq-card__tag{}` 規則（原 ~638 行）。`<h2>` 成為 body 第一個子元素，靠 `.faq-card__body` 既有 `padding:var(--s-5)` 留白，桌機＋手機預覽間距乾淨、未另加 margin。`.faq-card__more`（閱讀全文）與詳情頁 `.tag`（總院／手術中心）等未動。
- **驗證（本機 `http://localhost:8000`，Chrome headless 桌機 1280／手機 390）。** `faq.html` 17 張卡片皆無膠囊、間距乾淨；q1 新封面滿版填滿卡片框、圓角裁切、無溢出／光暈／漸層；`faq-q1.html` 詳情頁亦顯示新封面。
- **clinic-audit（report-only）全 PASS**：§九 無禁語（`最` 命中為 最新 nav）／無費用／頁尾免責聲明齊全；設計規則變更檔無 gradient／glow／`transition:all`，`.faq-card__tag` 無殘留引用；無障礙 17 張 `<img>` 皆具 alt、標題 1 h1＋17 h2 無跳級。

## 🗓️ 2026-06-08 (session 34) — 修正 faq.html 卡片封面 padding：`--filled` 現勝過 `--sm`，封面圖滿版填滿卡片框

修一個 CSS bug：`faq.html` 卡片封面圖未填滿卡片框，四周露出一圈 cream 邊。成因是卡片 figure 同掛 `photo-zone--sm photo-zone--filled`，`.photo-zone--filled`（~405 行）設 `padding:0`、`.photo-zone--sm`（~420 行）設 `padding:var(--s-4)`，兩者同 specificity，`--sm` 因在檔案後面而勝出，圖被 compact padding 內縮、露出底下 cream 的 `.photo-zone` 框。只動 `assets/site.css`，未動 HTML／圖片。

- **`assets/site.css`（緊接 `.photo-zone--filled img{}` 區塊後，~411 行）新增兩條高 specificity 規則。** `.photo-zone--sm.photo-zone--filled { padding: 0; }`（0,2,0 勝過 `.photo-zone--sm` 的 0,1,0，與來源順序無關）讓滿版卡片去掉 compact padding；`.photo-zone--filled.faq-card__media { border-bottom: 0; }` 移除滿版卡片圖下方殘留的虛線分隔線（`.faq-card__media` 原設 `border-bottom:1px dashed`）。未動詳情頁 `.faq-article__media` 規則（本就正確填滿）。
- **驗證（本機 `http://localhost:8000/faq.html`，桌機 1280／手機 390）。** 17 張卡片封面皆滿版填滿卡片框、無 cream 邊、圓角仍裁切、無溢出／光暈／漸層；Chrome headless 桌機＋手機截圖確認。
- **clinic-audit（report-only）**：只改 CSS padding／border，未動文案／顏色／HTML。設計規則：變更檔無 gradient／backdrop-filter／filter:blur／drop-shadow／`0 0` glow／`transition:all`（命中皆 CSS 註解）。§九 與對比度不受影響。全 PASS、無發現。
- **備註**：`assets/site.css` 會被快取，部署後需 hard-refresh（Cmd+Shift+R）才看得到變更。

## 🗓️ 2026-06-08 (session 33) — 衛教專欄 6 張封面以重生成的滿版（full-bleed）版本替換（q4／q17 並修正吉祥物）

把 6 張衛教專欄封面（`faq-q1／q4／q7／q10／q14／q17`）替換為重新生成的**滿版（full-bleed）**版本：q1／q7／q10／q14＝滿版；q4／q17＝滿版＋**修正吉祥物**（院長 ENT 醫師臉部／頭鏡／白袍還原）。動到 `assets/faq/`（6 張 PNG 覆寫）、`faq.html`、6 篇 `faq-qN.html`（加 `?v=2` cache-bust）、`docs/faq-images-map.md`。

- **下載與資產（`assets/faq/`，6 張覆寫）。** 從 CloudFront（連結會過期）即時 `curl` 下載 6 張 2k 原圖（2752×1536，皆 HTTP 200、>4MB、真 PNG），以同檔名覆寫舊版；再用 `sips -z 768 1376` **下採樣到 1376×768** 以對齊其餘 11 張封面的尺寸與檔案大小（約 1.2–1.4MB）。q8（圖內錯字 軟鵒→軟顎）、q13、q15 依指示**不動**，留待後續重生成。
- **Cache-bust。** 僅對這 6 張被替換的 `<img src>` 在 `faq.html` 與各自 `faq-qN.html` 追加 `?v=2`（共 12 處，已逐處核對一致），讓 CDN／瀏覽器顯示新圖；markup／CSS 結構無其他變動（仍走 `.photo-zone--filled`＋`object-fit:cover`）。
- **`docs/faq-images-map.md` 更新。** 將 q1／q4／q7／q10／q14／q17 的表格列與「Full URLs」換成新檔名，標注 2026-06-08 重生成（q1／q7／q10／q14＝full-bleed；q4／q17＝full-bleed＋修正吉祥物）；新增 TODO：q8（圖內錯字 軟顎）、q13、q15 仍待重生成。

### 驗證（clinic-audit report-only）
- **§九**：6 變更頁無 保證／根治／唯一／第一／必須／一定要／最〔上級〕（`最` 命中皆 最新 nav）；無費用；`[0-9]%` 命中為 CSS `border-radius:50%`；7 頁頁尾免責聲明齊全。
- **設計規則**：變更檔無 gradient／backdrop-filter／filter:blur／drop-shadow／`transition:all`；新圖皆 16:9、`object-fit:cover` 滿版裁切於圓角框內、未撐框未溢出（本機 `http://localhost:8000` 預覽，頁面與 6 圖皆 HTTP 200）。
- **無障礙**：變更頁 `<img>` 全具描述性 alt（仍與新圖主題相符）；html lang zh-Hant。
- **逐張視覺核對**：6 張吉祥物忠實（圓臉、黑框眼鏡、額頭頭鏡、白袍、同一成年男性）、滿版情境設定、主題資訊圖正確；中文標題／描述字形正常。
- **待院長簽核（已 flag、不擋）**：新圖內描述文案待院長 §九 簽核；**q14** 圖內描述疑似「耳咽管」誤植為「耳耳嚨管」（圖中解剖標籤本身正確），列入院長校對。

Older session notes → docs/progress-archive.md

---

## 🎨 Design reference (unchanged)
- **Palette:** cream bg `#FAF6EF` + deep teal `#16635B` (primary) + warm terracotta `#CC7A45` (accent). Calm/trustworthy, not tech-startup.
- **Type:** Noto Serif TC (headings) + Noto Sans TC (body, line-height 1.8–2 for Chinese).
- **Preview:** `python3 -m http.server 8000` from project root → http://localhost:8000. Never test `file://`.
- Screenshots in `temporary screenshots/` (latest per feature: `about-*`, `svc-*`, `lang-*`, `v4-*`).

---

## ⬜ Pages not yet built
- **全院區門診總表 / Weekly schedule** (§十一) — 醫師 × 院區 × 時段 table; data blank `待補`. Hub already links to it.
- **預約掛號 / 聯絡我們 / Contact** (§八) — 電話 / LINE / 線上掛號 CTAs.
- **衛教專欄 / Blog** (§七) — SEO articles; topics listed, no bodies yet.
- **EN pages** — all of `/en/` beyond the two placeholders.

---

## 🔒 Constraints to keep
- Plain HTML/CSS/JS, no build step (GitHub Pages).
- §九 compliance on every page: no 保證 / 最 / 根治 / 唯一 / 第一, no efficacy guarantees, no fee mentions; footer legal disclaimer mandatory. Scan before finishing.
- Every page needs its own `<title>` + meta description (drafts in §十二).
- Never invent doctor/clinical/中山 content — leave `〔待補〕` visible/flagged.
- 中山: "2026 年 10 月開幕・敬請期待", no live surgery marketing until open.
