# 進度筆記 / Progress — 大豐耳鼻喉科 website

Orientation note for the next session. See `site-spec.md` for the full content brief (source of truth) and `CLAUDE.md` for the rules (design rules + compliance live there).

_Last updated: 2026-08-02 (session 50)_

## 🗓️ 2026-07-31 (session 50) — Phase A：無 cookie 互動統計（**僅蒐集，無儀表板**）＋隱私權政策頁

建立 Phase A 的互動數據蒐集層：新表 `public.events`（pageview／booking_click／faq_view）＋ deny-by-default RLS，蒐集端寫在既有 `assets/site.js`（不新增檔案、不新增 script tag），並新增對外頁 `privacy.html` 誠實揭露蒐集內容。**本期只做蒐集，儀表板／報表屬 Phase B，未實作。** 改動：2 個新 migration、`assets/site.js`、`assets/site.css`（一條 scoped 連結樣式）、`privacy.html`（新頁）、`sitemap.xml`＋`assets/search-index.js`（標記外各一筆）、35 個對外 HTML 的 meta CSP。**未碰 RLS 既有政策／auth／已核可的醫療文案／產生器／admin 應用。公開頁本期「不是」零位元組變動**——35 頁各改一行（CSP `connect-src` 加上 Supabase origin），但**三個產生器重跑全部「No change」**，產生器輸出路徑零漂移。**最後一輪（隱私定稿輪）只動 `privacy.html` 兩個 hunk**——院長裁定的 90 天保存期限、以及第三方服務揭露擴寫——**未再動 CSS／JS／schema／DB**。**再一輪小幅文案定稿（2026-08-02）同樣只動 `privacy.html`**：補上代管商 GitHub Pages 的揭露、並把「逾期即予刪除」改為「逾期予以刪除」（全句僅一字之差）；另刪除測試者殘留的一筆探測列，**`public.events` 現為 0 列**。

- **DB（migration #1，經 MCP 套用）：`20260730014525_phase_a_events_analytics_schema.sql`。** `public.events`：id uuid pk、event_type text（check 白名單三值）、path、referrer_host、device（mobile/desktop，可空）、faq_slug、session_id、created_at。**刻意無 IP／UA／姓名／email 任何欄位**。索引 `events_created_at_idx`、`events_type_created_at_idx`。RLS deny-by-default：`events_insert_public`（僅 INSERT，anon＋authenticated，WITH CHECK 強制 event_type 白名單＋四個文字欄位長度 ≤256）、`events_admin_select`（is_admin()）、`events_admin_delete`。**完全沒有 UPDATE policy → 任何人都改不了既有列。** 檔尾附完整 ROLLBACK。
- **DB（migration #2，經 MCP 套用）：`20260731033546_phase_a_events_harden_created_at_and_admin_delete.sql`（人工指示的硬化；#1 保留為歷史紀錄不修改）。** `created_at` 改 `not null default now()`；**先 revoke 表層 INSERT、再只對 `event_type, path, referrer_host, device, faq_slug, session_id` 六欄 column-level 重新 grant**（對既有表下 `revoke insert (created_at, id)` 是 no-op，故須 revoke＋regrant）→ 前端再也無法偽造或清空 `created_at`／`id`。`events_admin_delete` 改用 `is_admin_mfa()`，與 session 47 的 aal2 慣例一致；**`events_admin_select` 刻意維持 `is_admin()`**（讀不是寫，與其他所有表一致）。自帶 ROLLBACK。
- **蒐集端（`assets/site.js`，寫在既有外層 IIFE 內、ES5 風格自足區塊）。** 不新增檔案——site.js 本來就每頁載入。`track('booking_click')` 掛在既有 `openBooking()` 的「已開啟」防呆之後（重複點擊不重複計數）。fire-and-forget，全程包在 try/catch 內吞掉一切。session_id 為隨機 UUID，存 **sessionStorage（`df_sid`）**，**絕不用 localStorage、絕不用 cookie**；sessionStorage 拋錯時退回記憶體內 id。`path = location.pathname`（query 與 hash 皆剝除）、`referrer_host` 只取 document.referrer 的 hostname、`device` 由 `matchMedia('(max-width: 760px)')` 判定、`faq_slug` 由 `faq-qN.html` 取裸 `qN`。另加 `isLocalHost()` 早退（localhost／127.0.0.1／::1／0.0.0.0／`*.local`／file:）→**本機開發不會寫進正式表**；`sitePath()`／`ROOT_PREFIX` 由 script 自身 `src` 推導。
- **刻意偏離規格（已向人類說明並獲接受）：主用 `fetch`、`sendBeacon` 當 fallback，與原任務描述的優先序相反。** 原因：Supabase 的 Cloudflare edge 會回 `set-cookie: __cf_bm`，而 `sendBeacon` 的 credentials mode 是 include，`fetch` 用 `credentials:'omit'` 才會讓瀏覽器忽略它——對一個對外宣稱「無 cookie」的站，這點是實質的。已實測每頁 `document.cookie` 為空。測試者判定此取捨成立、建議維持，並註記 sendBeacon fallback 實質上是 dead code。
- **CSP（35 個對外 HTML）：只加一個指令**——`connect-src` 加上 `https://ysnrrkpusgdgzwkywddu.supabase.co`，其餘一律不放寬。`admin/index.html` 本來就允許 `https://*.supabase.co`，唯讀確認後未動。
- **新頁 `privacy.html`（對外頁，flat 於 repo root）。** chrome 沿用 `contact.html`（同一份 CSP＋skip-link＋header／nav／語言切換＋麵包屑＋canonical＋og/twitter），正體中文。誠實揭露：蒐集什麼（僅 pathname、裝置類別、referrer hostname、每次造訪的 sessionStorage id）、用途、**不**蒐集什麼（無 cookie、無 IP、無個資、無跨 session／跨站追蹤、無 profiling）、程式實際載入的第三方服務、保存期限、聯絡方式**只走既有已公開管道**（院區電話→locations.html、LINE→contact.html，**未杜撰 email 或 DPO 角色**）。`sitemap.xml`＋`assets/search-index.js` 各補一筆，**寫在產生器標記區塊之外**，並獨立確認可存活完整產生器重跑。頁尾「隱私權政策」連結以 site.js 全站注入（既有 chrome 注入模式，不做 36 頁逐頁編輯、不會走鐘）。
- **第三輪修掉測試者找到的四個缺陷。**（1）**〔blocker〕`privacy.html` 原本聲稱「關閉 JavaScript 網站仍可正常使用」是假的**——`assets/site.css:527` 的 `.reveal { opacity: 0 }` 要靠 JS 加 `.in`，JS 關閉時全站 166 個元素（含每個院區的地址／電話／時段卡）永久隱形。**lead 裁示：改文案，不動網站**（`.reveal` 漸進增強重構超出範圍且有 FOUC 風險）。現在文案把兩種情況分開講：擋掉連線 → 網站完全可用（已實證重驗）；關閉 JS → 統計不會執行、不送出任何資料。**全站 JS-off 隱形問題仍存在，列在人類的清單上。**（2）**〔major〕頁內行內連結與內文無法區分**（同色、無底線、無字重差、hover 無變化）＝WCAG 2.2 SC 1.4.1 Level A，而且那是本頁唯一提供的聯絡途徑。以 `assets/site.css` 一條 scoped `.faq-article p a` 修正（底線為主要辨識、`--primary`、hover → `--primary-deep` ＋2px、`:focus-visible` outline、transition 具名 `color` 與 `text-decoration-thickness`）；**本次 CSS 新增有明確授權**。（3）〔minor〕cookie 敘述兩處收斂：「本網站不使用 cookie」→「本網站**本身**不使用 cookie」，把但書交給第三方服務段落承擔。（4）〔minor〕注入的頁尾連結補 `privacyLink.lang = 'zh-Hant'`（SC 3.1.2）——它會把中文字塞進 5 個 `<html lang="en">` 的 `/en/*` 文件。
- **第四輪（隱私定稿）：只改 `privacy.html`，兩個 hunk。**
  - **（1）保存期限定案——院長裁示 90 天，〔待補〕消失。** `privacy.html:111` 現為「瀏覽統計的保存期限為 90 天。前述每一筆原始瀏覽紀錄自寫入之日起保存 90 天，逾期即予刪除；清除作業由診所定期執行，目前未設定自動排程。保存期間內，這些紀錄僅用於前述的網站改善分析。」**必須誠實記錄的另一面：目前完全沒有自動清除機制**——無 pg_cron、無排程工作、無 trigger（測試者已實查）。文案是刻意寫成「由診所定期人工執行、且明講未設定自動排程」，因此不會誇大成自動化；但**政策與實務要靠人記得執行才會一致**（見後續）。
  - **（2）第三方服務揭露擴寫。** Google Fonts、Google 地圖維持（皆為真實連線）。Cloudflare 敘述**依 `assets/site.js:136-140` 的實情改正**：beacon 每頁都載入，但送出的是 `{"token":"__CF_BEACON_TOKEN__"}`，故頁面載明「尚未填入識別碼、因此還沒有任何可查閱的統計」。新增一段揭露 **jsDelivr 僅為 `/admin/` 載入**（`@supabase/supabase-js@2.108.1/dist/umd/supabase.js`，SRI 釘於 `admin/index.html:323`），並明講**一般頁面不會向其發出請求**——已實證為真：`cdn.jsdelivr.net` 只出現在 `admin/index.html`，且對外頁 CSP 根本不允許該來源。另補一句說明送往 Supabase 的連線經 Cloudflare 節點轉送（`curl -sI` 實證回應含 `server: cloudflare`、`cf-ray: …-TPE`）。**測試者由原始碼重建連線清單並確認完整**：公開頁自動發出的連線恰為 `fonts.googleapis.com`、`fonts.gstatic.com`、`www.google.com/maps`（僅院區頁）、`static.cloudflareinsights.com`、`ysnrrkpusgdgzwkywddu.supabase.co`；`lh.hding.com.tw`、`lin.ee`、`www.facebook.com` 一律是使用者點擊的 `<a href>`，不會自動抓取。
  - **（3）IP 措辭：稽核後刻意不改——「不動」才是正確答案。** 建構者重讀全部四處（meta/og/twitter `:8`／`:14`／`:19`、頁首導言 `:77`、我們不會記錄的資料 `:101`）後判定原文已正確，測試者獨立複核同意。全頁**沒有任何一句聲稱診所永不接收、或永不被送出 IP**（那在 CDN 層是不成立的）；每一句主張都限縮在「**統計紀錄**中不含」的範圍內，而 `:101` 的「資料表中沒有這些欄位」已對 `information_schema` 核實（events 恰 8 欄，無 IP、無 UA）。
- **第五輪（文案定稿，2026-08-02）：只改 `privacy.html` 兩處，外加刪一列測試資料，其餘檔案一律未動。**
  - **（1）補上代管商（GitHub Pages）揭露——上一輪後續清單的第（4）項就此關閉。** `privacy.html:107` 於「本網站另使用下列第三方服務……」之前新增一段：本站代管於 GitHub Pages，傳送頁面時「該服務會取得建立連線所需的資訊，其中包含您的 IP 位址」，並明寫這屬於「傳送網頁時無法避免的技術過程」、且「與前述瀏覽統計是兩回事——送往 Supabase 的統計紀錄中沒有 IP 位址欄位」，處理方式比照既有段落交由該服務自身的隱私政策。**主機事實由兩個 agent 各自獨立查證**：canonical（`privacy.html:9,15`）為 `https://lalex07.github.io/Clinic/privacy.html`、`sitemap.xml:176` 相符、`find . -name CNAME` 無結果 → 無自訂網域，確為 GitHub Pages 預設 `github.io` 網域。**用字刻意只寫「取得」，不寫「記錄」／「保存」**——GitHub 的日誌與保存行為在此無從查證，故全句對其不作任何主張。
  - **（2）「逾期即予刪除」→「逾期予以刪除」（`privacy.html:112`）**，回應上一輪測試者的編輯註記（「即」的即時性與「未設定自動排程」相扞格）。測試者以程式比對本筆記所記的原句：**恰一字之差**（即予→予以），90 天（兩處）、定期執行、目前未設定自動排程皆完好，無其他漂移。
  - **（3）DB：清掉測試者殘留的探測列。** 以列明 id（`6c564c4d-9326-4227-a55a-a31d21b10f1c`、`/__tester_probe__`）的**有界 delete** 執行，count 1 → 0；無無條件 delete、無新 migration、無 schema／RLS 變更。
- **第五輪測試：四道自動閘門全 PASS。** **瀏覽器 QA**——「第三方服務」段落由三段變四段，版面節奏完全未變：desktop 與 mobile 量測全部七個 `<h2>` 間距**皆為 32px**，「保存期限」標題前後不擁擠；header 於 1280／1440 單行（73px）；390／375 無橫向捲動；頁內 20 個連結／資源全部 200；零 CSP violation；console 只剩既有的 Cloudflare RUM beacon CORS 失敗，**經判定為 localhost-only 產物**（CF 的 ACAO header 與 host／port 不符），正式 origin 上不會發生。**RLS：PASS，且比前幾輪更嚴謹**——anon 的 SELECT／UPDATE／DELETE 這次是**在有資料的表上**於交易內證明被拒（以擁有者身分插入 → `SET LOCAL ROLE anon` → update 0 列、delete 0 列、可見 0 列），因為對空表打 REST 探測的結果並不具結論性；anon 帶 `id` 或 `created_at` 的 INSERT → 401/42501，並以 `column_privileges` 從結構上追根；anon 連自己剛寫入的列都讀不回（`RETURNING` 42501）。無新 advisor、無 secrets、`.env` 仍未受版控且已 gitignore。
- **逐位元組閘門：PASS（bit-for-bit）。** 三個產生器（team／news／faq）重跑，**全部輸出「No change」**；本 session 於最後一輪後再跑一次，`git status --porcelain` 前後完全相同、41 個受版控檔案雜湊全數吻合（`git diff | shasum` = `b916be15…`）。標記區塊外的 `sitemap.xml:174-180`／`assets/search-index.js:70-77` 隱私條目存活完整重跑。`generate-team.mjs` 會重寫 `assets/doctors/li-shun-yuan.jpg`，內容逐位元組相同（git status 不出現該檔）。**第五輪（文案定稿）再跑一次三個產生器：全部輸出「No change」、零 churn**——`git status --porcelain` 前後以 `cmp` 比對完全相同，且 **`git diff` 本身亦以 `cmp` 確認逐位元組相同**（比只看 status 更強：status 看不見已被修改檔案「內部」的漂移），`privacy.html` 的 SHA-256（`2786ad1d…`）亦未變。本輪未需要、也未執行任何 `git checkout`。
- **clinic-audit（report-only）：PASS，最終輪零新增發現。** 新頁 §九 乾淨（`最` 命中只有最新消息的 nav／footer 標籤）、無收費／療效／見證，36 頁免責聲明齊全；**頁面上已無任何 〔待補〕**；設計規則零 gradient／glow／`transition: all`／eyebrow pill；WCAG AA：新增的 `.faq-article p a` 連結樣式最終量測為 **6.85:1（一般）／10.09:1（hover）**，辨識度由底線承擔（SC 1.4.1）——此為最終數值，取代第三輪的 6.35／9.36。**第五輪再跑一次：PASS、三組檢查零發現**——新增的 GitHub Pages 那一段 §九 乾淨，且**未新增任何 CSS**（用到的 class 全部已存在於 `site.css`）。
- **最終輪測試：四道自動閘門全 PASS。** **瀏覽器 QA**——desktop 1280 header 單行（72px，無 wrap）；mobile 390 無橫向捲動、零溢出元素；改寫後的「第三方服務」段落為三段、32px 節奏與其餘六節一致；9 個頁面零 CSP violation；頁內 14 條站內連結全 200；`/en/` 注入的隱私連結為 `../privacy.html`＋`lang="zh-Hant"`、每頁恰一條、200。**RLS**——anon 以六個 client 欄位 INSERT → 201；帶 `created_at` → 401/42501；帶 `id` → 401/42501；`event_type:"evil"` → 遭 RLS 拒絕；SELECT → `[]`；UPDATE／DELETE 影響 0 列且該列驗證仍完整。**`events` 上完全沒有 UPDATE policy → 對任何人皆不可變**；column grant 確認 anon 僅持有那六欄的 INSERT。無新 advisor、無 secrets、`.env` 已 gitignore 且未受版控。**真實解析後 DOM**（非 grep）驗過全部 18 個 `.faq-article` 頁：`privacy.html` 2 個命中、17 篇 `faq-q*.html` **各 0**（它們的 `.faq-cta` 是 `<article>` 直屬子元素、不在 `<p>` 內）→ 對 17 篇已發佈文章零迴歸。隱私頁每一句事實敘述逐行對照 `assets/site.js` 核實無誤。SC 1.4.1：連結對底色 6.35:1、hover 9.36:1，連結與周圍內文對比僅 1.03:1（＝底線是承重的）。**在非 guard 的 LAN 主機實證追蹤可用**（2×201 ＋ 一筆 booking_click），localhost／127.0.0.1 確認被 guard 跳過且 `df_sid` 從未建立。以覆寫 `fetch`／`sendBeacon` 同步拋錯重現「端點被擋」：modal 照開、零 uncaught error。`/en/*` 頁尾隱私連結 200（沒有重演健保標誌那類路徑 bug）、每頁恰好一條；header 於 1024／1280／1440 皆單行；390 無橫向捲動。**RLS：PASS**——anon 不帶 `created_at`／`id` 的 INSERT 201，帶任一 → 401/42501；SELECT/UPDATE/DELETE 全被拒且列存活；確認無 UPDATE policy；`events_admin_select`=`is_admin()`、`events_admin_delete`=`is_admin_mfa()`；**草稿隱藏是以 policy predicate 驗證，目前無草稿列，非實際草稿資料驗證**（誠實記錄）；無 secrets（JWT 皆 `role:anon`）；`/admin/` 仍 Disallow 且不在 sitemap／搜尋索引；無新 advisor。零新增 console error／CSP violation；兩類既有問題仍在未動的頁面上（`cloudflareinsights.com/cdn-cgi/rum` 因 `__CF_BEACON_TOKEN__` 佔位字產生的 CORS error、`/en/*` 的 `GET /en/assets/nhi-logo.png → 404`）。
- **人類確認／裁示（稽核軌跡）：** 保留統計、硬化 `created_at`、admin DELETE 收緊為 `is_admin_mfa()`、加 localhost guard、清掉測試列、新增隱私頁——皆由人類明確指示。**人類延後（deferred）**：真實 iOS Safari 驗證、以及用真正 MFA admin session 實跑 `events_admin_select`／`events_admin_delete`。**人類接受**：隱私頁文案是**未核可草稿**，此點作為 commit 的前提條件、而非測試的阻斷條件。**院長裁示（最終輪）：瀏覽統計保存期限定為 90 天**——此為人類的內容決定，非工程推導，`privacy.html:111` 依此改寫、〔待補〕移除。人類並已明確要求在此階段產出更新後的 commit 摘要（其餘未結項目屬人類 commit 前的判斷，非測試阻斷）。**第五輪（文案定稿）亦由人類指示**：補上 GitHub Pages 代管揭露、把「即予」改為「予以」、清掉殘留探測列；四道自動閘門全 PASS 後，**人類再次明確要求現在就交出更新後的 commit**——僅存的「傳輸層 IP 揭露是否擴及其他第三方」屬**法務／編輯判斷，卡的是人類的 commit 決定，不是測試**。
- **測試資料清理（誠實記錄）：** 累積的 39 筆測試列已在第二輪清除（人類授權）；第三輪 LAN 驗證留下的 3 筆亦清回 0——**該次清除是以未加條件的 `delete from public.events;` 執行，觸發了 harness 的安全警告**；操作有授權、且此表歷來只有測試資料，仍如實記載。最終輪把殘留的 4 筆清為 0，**改以列明 id 的有界 delete 執行**（四個 id 均載於建構者報告），不再重蹈上一輪的無條件刪除。其後**測試者自身的探測又留下 1 筆**：id `6c564c4d-9326-4227-a55a-a31d21b10f1c`、`path /__tester_probe__`、`session_id qa-probe-2026-07-31`。**第五輪已以列明該 id 的有界 delete 清除，count 1 → 0**，且**測試者本輪刻意不再留下任何探測列**——改以在會 rollback 的交易內驗證 anon INSERT 路徑，不寫進正式表。**`public.events` 目前為 0 列**（交件前以 MCP 再查證）。
- **未動：** RLS 既有政策與 `is_admin()`／`is_admin_mfa()` 本體、auth 設定、Edge Function、三個產生器程式、admin 應用（僅唯讀確認其 CSP）、任何已核可醫療文案、17 篇衛教專欄、其他院區內容。**最終輪另刻意不動**：`assets/site.css`／`assets/site.js`／schema／DB 政策皆未再變更，且**四處 IP 措辭經稽核後判定正確而維持原文**（見上）。**第五輪同樣只動 `privacy.html`**：`assets/site.css`／`assets/site.js`／schema／RLS 政策／產生器／admin 一律未再變更，DB 只執行一筆列明 id 的 delete、無 migration。**Phase B 儀表板／報表本期完全未做。**
- **後續（本輪已結三項：GitHub Pages 揭露、「即」的措辭、殘留探測列）：**（1）**`privacy.html` 全篇文案待院長／法務簽核**——目前仍是未經審閱的法律文案，且現在多了新增的 GitHub Pages 那一段，一併送審；保存期限那一句仍需另行點名確認。（上一輪「逾期**即**予刪除」的編輯註記已於本輪處理完畢，現為「逾期予以刪除」。）（2）**〔本輪最重要的後續〕完全沒有自動清除機制。** 保存政策已定為 90 天並已寫進對外頁，但目前只靠有人記得手動下 delete 來執行——無 pg_cron、無排程工作、無 trigger。**必須二擇一：排一個真正的清除工作（pg_cron／Edge Function／GitHub Action），或至少建立週期性行事曆提醒**；否則自第一位真實訪客起算 90 天內，公開宣示的政策就會與實務脫節。（3）**〔新增，測試者提出，屬法務的編輯判斷〕傳輸層 IP 的揭露目前只針對 GitHub Pages 書寫**，但同一種技術必然性也適用於 Google Fonts、Google 地圖、Cloudflare，以及送往 Supabase 的那個統計 POST 本身（**該連線同樣帶著 IP，即使寫入的那一列沒有 IP 欄位**）。現行的「與前述瀏覽統計是兩回事」有可能被讀成「統計流程全程與 IP 無關」，而非較窄且準確的「**儲存下來的統計紀錄沒有 IP 欄位**」。**兩種讀法之下頁面都沒有不實陳述**——這是完整性／尺度的取捨，不是工程缺陷，併入既定的院長／法務簽核一併裁定。（4）**若 `__CF_BEACON_TOKEN__` 日後填入真實 token，`privacy.html` 的 Cloudflare 那一句必須在同一個 commit 內同步更新**——現行文字明講「尚未填入識別碼、還沒有任何統計」。（5）**〔新增，既有問題、先前未列〕header 在 761px 至約 1160px 之間會橫向溢出**——`.btn.nav__cta` 於 768px 溢出 383px、1024px 溢出 127px，原因是行動版斷點訂在 `assets/site.css:543` 的 `max-width: 760px`。**全站既有問題、與本期無關**：未受本期改動的 `index.html`／`about.html`／`faq.html`／`contact.html` 表現完全相同，而本期 diff 未觸及任何 header selector（`assets/site.css` 只新增那一段 scoped `.faq-article p a`）。desktop 1280+ 與 mobile 390／375 皆乾淨，故就規則文字而言未違反既有規則（CLAUDE.md 的 header 規則講的是 desktop 寬度），但這段平板／小筆電區間值得另開一輪處理。（6）既有、超出本期範圍、列在人類清單上：全站 JS-off 的 `.reveal` 隱形（`assets/site.css:527`，166 個元素、含每個院區的地址／電話／時段卡）、`/en/*` 健保標誌 404、`__CF_BEACON_TOKEN__` 佔位字、`site.css:506` 頁尾連結對比不足（3.77:1）、`en/*.html` 的「中文」連結缺 `lang`。（7）人類延後：真實 iOS Safari 驗證、以真正 MFA session 實跑 `events_admin_select`／`events_admin_delete`；草稿隱藏仍僅以 policy predicate 驗證（目前無未發佈列）。（8）流程備忘：Python `http.server` 不送 `Cache-Control`，暖快取的瀏覽器會靜默供應舊 CSS——在這套環境驗證 CSS 前務必 hard-reload。
- **CLAUDE.md 同步更新（規則異動，非一次性修補）：** 「Backend & tooling layout」原本聲稱「公開頁對後端零執行期依賴」已不再成立，改為「內容零依賴；唯一的執行期呼叫是這支 beacon，且必須 fire-and-forget——失敗／被擋／關閉時每頁行為完全相同」，並新增一條 `public.events` 的長期硬約束（無 cookie／無 localStorage、無 IP/UA/姓名/email 欄位、只送 pathname、不得拋錯進頁面程式、localhost guard、anon 僅 INSERT 且刻意無 UPDATE policy、**改動蒐集內容必須在同一個 commit 內同步改 `privacy.html`**）。

## 🗓️ 2026-06-16 (session 49) — 修 admin 圖片兩問：FAQ 封面 bucket 持久化＋預覽，doctor 照片 cache-buster

承 session 48 的 FAQ 封面修復，處理兩個相關 bug。只動 `admin/app.js`＋`scripts/generate-team.mjs`＋progress；**未碰 RLS／auth／已核可文案；公開頁本期零位元組變動**（17 篇 faq-qN.html＋team.html 重跑產生器全部「No change」）。

- **PART 1a 診斷（經 MCP 實證）：FAQ 封面確實沒進 bucket（非 dashboard 殘影）。** `storage.buckets` 三桶（faq-images／news-images／doctor-photos）設定**完全相同**（public、5MB、`allowed_mime_types=[image/png,image/jpeg,image/webp]`）；`storage.objects` 顯示 faq-images **空**、news-images 有 2 物件、doctor-photos 有 1（test.png）。RLS 政策三桶亦對稱（write 需 `is_admin_mfa()`、select 需 `is_admin()`）。**對 storage API 實打**（anon、無 admin session）：合法 PNG → `403 RLS`（＝MIME／size 都過、唯一關卡是 RLS，正式 admin 登入即可寫入→會持久化）；`image/gif`（不在白名單）→ **`415 invalid_mime_type`，且此檢查發生在 RLS 之前**。**根因**：上傳呼叫傳 `contentType: file.type` 原值，當瀏覽器回報的 type 為空字串或近似值（如 `image/jpg`、HEIC、特殊檔案選擇器）即被 bucket MIME 白名單以 415 拒絕→封面永遠落不了地。錯誤有 throw（顯示於 faqSaveMsg）、**非靜默吞掉**，但確實擋住持久化。既有 17 篇封面 `cover_path` 皆為本地 `assets/faq/faq-qN.png`（seed 的插畫檔，從未經 bucket 上傳）——這才是 bucket 空的原因。
- **PART 1a 修法：** `admin/app.js` 新增共用 `safeImageType(file, ext)`——`file.type` 已是白名單三型之一就用它，否則由副檔名映射（png→image/png、jpg/jpeg→image/jpeg、webp→image/webp，預設 png）。`uploadFaqCoverIfAny`／`uploadPhotoIfAny` 改用它，保證 Content-Type 一定落在 bucket 白名單→合法圖片可靠持久化。
- **PART 1b 修法：admin 預覽改讀 Storage public URL。** 新增共用 `previewFromBucket(el, bucket, storedPath)`：先樂觀顯示本地 `../<path>`（seed 檔在本地存在），再以 `new Image()` 探測 `<SUPABASE_URL>/storage/v1/object/public/<bucket>/<basename>?v=…`，載入成功即換成 bucket public URL（剛上傳的圖**立即可見**，不必等發佈生成本地檔）。保留 `?v=`。`syncFaqCoverUi` 改呼叫之——儲存後不再留白框。**'change' 時仍顯示剛挑檔案的 objectURL（原本就 work）；發佈的靜態頁照舊用本地 `assets/faq` 路徑（產生器下載後）——只有 admin 預覽改讀 Storage。**
- **PART 2 修法：doctor 照片比照 FAQ。** (1) `uploadPhotoIfAny` 回傳 `assets/doctors/<slug>.<ext>?v=<Date.now()>`，**只在真的挑了新檔案時**才加 `?v=`（無檔案回傳 null、photo_path 原樣保留→未改動的 doctor byte-identical、plain save 不 churn team.html）。(2) `scripts/generate-team.mjs` `syncPhoto()` 把 `?v=` 帶上 bucket download URL（CDN 以完整 URL 為 key→替換照片必 cache miss→抓到新圖）、本地檔名去 query；發佈 `<img src>` 保留 `?v=`（同 FAQ）。(3) doctor 刪除後 best-effort 刪 bucket 物件（slug 會回收，殘留物件會被下一位同 slug 醫師繼承；不阻擋刪列）。(4) `syncPhotoUi` 預覽改走 `previewFromBucket`。
- **news 不動（依指示）：** news 上傳鍵為列 id（`<rowUUID>.<ext>`）——**新文章**每列為新 UUID 故首傳唯一、不受影響；惟同列**替換**圖片會重用鍵，理論上與 FAQ／doctor 同款 stale-CDN 風險（id 為每列穩定、非每次上傳唯一）。本期依指示不改 news，僅誠實記錄此細節。
- **逐位元組閘門：** 重跑 `generate-team.mjs`＋`generate-faq.mjs`（未動 DB）→team.html＋17 篇＋search-index＋sitemap 全部「No change」；`git status` 僅 `admin/app.js`＋`scripts/generate-team.mjs`。`node --check` 三檔皆過。
- **clinic-audit（report-only）PASS：** 公開頁零變動；diff 內無 §九 禁語、無 gradient／glow／transition:all。
- **承接 session 48**：bucket 內 `faq-images`（空）無孤兒；`doctor-photos/test.png` 仍是測試孤兒，admin 可於 dashboard 手動刪。

## 🗓️ 2026-06-10 (session 48) — 修 bug：衛教專欄上傳封面後，發佈頁顯示健保標誌（NHI logo）而非上傳的圖

**症狀**：/admin/ 衛教專欄上傳封面→儲存→發佈，公開頁（卡片＋hero）顯示 `assets/nhi-logo.png` 而非上傳圖。**根因（forensics 確認）**：封面以**固定 bucket key**（`faq-q18.png`、upsert）上傳、`cover_path` 無版本參數，於是**三層快取都鎖在第一次的內容**：(1) Supabase storage CDN 對 public URL 快取 `max-age=3600`——CI 的 `generate-faq.mjs` 在封面被替換後一小時內可能下載到**舊版**；(2)(3) GitHub Pages CDN＋瀏覽器對 `assets/faq/faq-q18.png` 這個**不變的 URL** 永遠用舊圖。最初的壞內容：6/9 21:22（CEST）首次 q18 測試上傳的檔案**本身就是 nhi-logo.png**（commit `61d3f48` 提交的 bytes 與 `assets/nhi-logo.png` SHA-256 完全相同；CI 抓取時是該 URL 首次請求＝cache miss＝origin 內容，故非快取造成）——之後 6/10 早上即使重新上傳了正確的吉祥物圖（09:01 的 regen `d6d456e` 已提交**正確** bytes），瀏覽器／Pages 快取仍繼續顯示 NHI logo，看起來就像「上傳什麼都變健保標誌」。**site.js 的 footer NHI 注入完全無關**（selector 只配對 `.site-footer .footer__brand .footer__logo`，未誤掛任何封面）。

- **修法（cache-busting，三層一起解）**：`admin/app.js` `uploadFaqCoverIfAny()` 改回傳 `assets/faq/faq-<slug>.<ext>?v=<Date.now()>`——**只在真的有挑新檔案時**才產生新 `?v=`（無檔案時回傳 undefined、cover_path 原樣保留，不會每次儲存都變）。`scripts/generate-faq.mjs` `syncImage()` 把 cover_path 的 query **帶上 bucket public URL**（CDN 以完整 URL 為 key，新 `?v=` 必為 cache miss→必抓到剛上傳的內容）；本地檔名照舊去掉 query。與既有手動 `?v=2`／`?v=4` 慣例一致。
- **逐位元組閘門**：基準跑（17 篇、未動 DB）全部「No change」。端到端重測（經 MCP 模擬 admin 寫入）：新文章 q18（`?v=1001`）→產生器下載到的是 bucket 的吉祥物圖（SHA-256 `0c96cc75…`，**非** nhi-logo 的 `dae2955c…`）、卡片＋hero src 都帶 `?v=1001`；換封面（`?v=2002`）→兩處 src 同步更新、以新 URL 重抓；刪除→頁／卡／search／sitemap 自動移除，**17 篇既有頁全程零變化**。
- **孤兒清理＋防再發**：刪除本地孤兒 `assets/faq/faq-q18.png`（Test 文章已刪但產生器不刪圖）。`admin/app.js` 刪除文章後**順手刪 bucket 封面物件**（best-effort、不阻擋刪文）——slug 會回收（nextFaqSlug=max+1），舊物件殘留會被下一篇同 slug 文章繼承。**bucket 內既有孤兒 `faq-images/faq-q18.png` 需 admin 手動刪一次**（dashboard → Storage → faq-images；本 session 無 admin 憑證、direct SQL 被 storage 防護 trigger 擋下且不應動 RLS）。另：`doctor-photos/test.png` 也是測試孤兒，可一併刪。
- **UI 提示**：admin 封面欄位 label 加註「建議 16:9、1376×768；非 16:9 會被置中裁切」——方形圖（如標誌）被 `object-fit: cover` 裁切是預期行為、非 bug。
- **clinic-audit（report-only）PASS**：公開頁本次零位元組變動；§九／設計／a11y 命中皆為規則註解或 admin 編輯器自身的提醒文字。doctor／news 流程未動（news 圖檔名本來就是每次上傳唯一的 UUID，無此問題；doctor 照片同樣是固定檔名，**有同款潛在風險**，後續可比照加 `?v=`）。

## 🗓️ 2026-06-10 (session 47) — RLS 層強制 admin 寫入需 MFA（aal2）—— 收掉 M1

admin 已完成 TOTP enrollment（DB 確認 verified_mfa_factors=1），故把 session 45 預留的後續落實：**在 RLS 層要求 admin 的 INSERT/UPDATE/DELETE 必須是 MFA 升級過的 session（aal2），不再只是 `is_admin()`**。讀取完全不動（公開站、anon、登入時的 profile 自讀照舊）。一個新 migration：`supabase/migrations/20260609220017_phase4_require_aal2_for_admin_writes.sql`（經 MCP apply）。

- **新 helper `is_admin_mfa()`**：與 `is_admin()` 同型（SECURITY DEFINER、pinned `search_path=public`、STABLE），回傳 `is_admin() AND coalesce(auth.jwt()->>'aal','aal1')='aal2'`。grant 僅給 authenticated、revoke anon/public（鏡像 is_admin）。
- **public 表（doctors／profiles／news／faq_articles）**：原本是單一 `*_admin_all`（FOR ALL，is_admin）。拆成四條：`*_admin_select`（SELECT，**維持 is_admin()** → admin 仍可讀草稿／自身 profile，讀取行為零變化）＋ `*_admin_insert`／`*_admin_update`／`*_admin_delete`（**改用 is_admin_mfa()** → 寫入需 aal2）。anon／public 的 select_published／self_select 一律不動。
- **storage.objects（doctor-photos／news-images／faq-images）**：本來就是分開的 per-command policy。只把三個 bucket 的 INSERT/UPDATE/DELETE 換成 is_admin_mfa()；admin 讀回的 `*_admin_select`（upload RETURNING 用，維持 is_admin()）與公開讀（無 policy、走 public URL）皆不動。
- **未動**：`is_admin()` 本體（讀取＋Edge Function gate 仍用）、anon、任何 SELECT、Edge Function。專案無 `public.audit_log` 表，故不涉及。
- **驗證（經 MCP）**：套用成功；policy 清單確認所有 write 皆為 is_admin_mfa()、所有 read/anon 不變；is_admin_mfa 定義／grant 正確。**anon 實打**：讀 doctors／已發佈 news／faq（17 篇）正常、草稿仍隱藏、anon INSERT 仍 42501 擋下、anon 呼叫 is_admin_mfa rpc 為 permission denied。security advisor 僅多一筆 is_admin_mfa 的 SECURITY-DEFINER-executable（與 is_admin 同屬 by-design：RLS 要呼叫它、只洩漏呼叫者自身 admin+aal2 狀態）。
- **未實測（需 admin 活 session）**：aal2 寫入成功路徑要登入＋過 TOTP 才能完整確認——**由 admin 在前台實測一次儲存／上傳**。若儲存失敗，migration 檔尾附**完整 ROLLBACK SQL**（把 write policy 換回 is_admin()、drop is_admin_mfa），可即時還原。
- **承接**：session 45（app 層 MFA gate）＋ session 46（CSP／pin+SRI／bucket 限制）。**M1 至此於 RLS 層關閉**。

## 🗓️ 2026-06-09 (session 46) — 安全強化：四項 Low 修補（FAQ 產生器跳脫、pin+SRI supabase-js、bucket 限制、meta CSP）

落實 session 44 安全審查的四項 Low/防禦縱深修補。改 `scripts/generate-faq.mjs`、`admin/index.html`＋`admin/app.js`、全部 35 個對外 HTML（root＋en/）＋ admin 的 CSP meta、三個 storage bucket 設定（經 MCP，非檔案）、progress。**未動 RLS／auth 政策／Edge Function／公開頁文案**。

- **#1 FAQ 產生器輸出跳脫（逐位元組閘門必須維持）。** `generate-faq.mjs` 對所有 DB 來源值加上 `esc()`／`escAttr()`（鏡像 generate-team/news.mjs）：卡片／文章的 title・excerpt・cover_path・cover_alt、麵包屑 title、head 的 description／og／twitter、ld+json 的 headline／description、search-index.js 的 title／keywords／summary。**`body_html` 維持逐字輸出（正典，依設計不跳脫）**。ld+json 與 search-index.js 為 JSON／JS 字串情境，用 escAttr（中和 `"`／`<`／`>`，防止跳出字串或關閉 `</script>`）。**閘門：改完後重跑三個產生器，faq.html＋17 篇 faq-qN.html＋search-index.js＋sitemap.xml 全部「No change」（20 個檔案逐位元組相同）**——現有 17 篇無 HTML 特殊字元，故輸出不變；git diff 僅 `scripts/generate-faq.mjs`。
- **#2 pin＋SRI admin 的 supabase-js。** 原本 `import ...@supabase/supabase-js@2/+esm`（只釘 major、無完整性）。改為在 `index.html` 以 classic `<script>` 載入**釘死版本 2.108.1 的原始套件 UMD 檔 `dist/umd/supabase.js`**（非 jsDelivr 動態壓縮的 `.min.js`——後者 bytes 會變動而破壞 SRI），帶 `integrity="sha384-EjUdIV…"`＋`crossorigin="anonymous"`（SRI 經兩次抓取確認穩定）。`app.js` 改用全域 `const { createClient } = window.supabase;`（classic script 先於 deferred module 執行，全域已就緒）。headless Chrome 實測：無 SRI／blocked 錯誤、loginView 顯示＝client 已建立、init() 正常。
- **#3 bucket size＋MIME 限制（經 MCP）。** doctor-photos／news-images／faq-images 設 `file_size_limit=5242880`（5MB）＋`allowed_mime_types=[image/png,image/jpeg,image/webp]`，維持 public。現有物件皆 png 且 ≤249KB（涵蓋於白名單與限額內）；設定後實測既有 public 物件讀取仍 HTTP 200。**註：合法 admin 上傳的接受／超量拒絕為 storage 層伺服器端強制，但需 admin 登入才能實跑——本期無 admin 憑證，僅驗證設定值與既有讀取。**
- **#4 保守 meta CSP（不可破壞任何頁）。** 對外頁政策：`default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; frame-src https://www.google.com`。涵蓋實際所需：Google Fonts、location 頁的 Google Maps iframe、site.js 注入的 **Cloudflare Web Analytics beacon**（刻意保留——隱私友善、目前 placeholder token）。inline `<style>`／inline `<script>`（news/faq 分頁）需 `'unsafe-inline'`——因有 inline script，無法在不放 `'unsafe-inline'` 下做更嚴格策略（已知限制，於 commit 註記）。**admin 另用較緊政策**（script-src 加 `https://cdn.jsdelivr.net`、connect-src 加 `https://*.supabase.co`、img-src 加 `data: blob:` 供 QR／預覽）。CSP meta 插在每頁 `<meta charset>` 之後；對 faq/news/team 產生頁加在產生器不會改寫的位置——重跑產生器仍「No change」。**實測：headless Chrome 載入 index／faq／faq-q1／news／team／location-xindian／about／contact／services／en/index／admin——全部 0 CSP violation 且正常 render**（首版漏了 Cloudflare beacon 被擋，已加入 origin 後復測通過）。
- **clinic-audit（report-only）PASS**：§九（最＝最新、無禁語／收費／療效；免責聲明齊全）、設計（0 gradient／glow／transition:all——命中皆為註解或 CSS 百分比誤報）、a11y（img 皆有 alt、lang 齊全、skip-link 30/30）皆無回歸。
- **後續**：admin 完成 MFA enrollment 後再評估把 RLS 寫入政策收緊為要求 aal2（承 session 45）。SRI 在升級 supabase-js 版本時需一併更新 hash。

## 🗓️ 2026-06-09 (session 45) — /admin/ 加上 TOTP 兩步驟驗證（MFA，app 層強制；RLS aal2 為後續）

回應 session 44 安全審查 M1（admin 帳號未啟用 MFA）。在 `/admin/` 登入加上 TOTP 第二因子，密碼登入後必須完成 TOTP 才能進入編輯器。只動 `admin/`（index/app/css）＋ progress；未碰 RLS／auth config／後端／產生器／公開站。用既有 supabase-js client（sb）的 MFA API：`enroll`／`challenge`／`verify`／`getAuthenticatorAssuranceLevel`／`listFactors`／`unenroll`。TOTP 在 Supabase 預設可用，無需 dashboard 開關。

- **流程（app.js 重寫 auth 區塊）。** 密碼登入成功後 `routeByAAL()` 讀 `getAuthenticatorAssuranceLevel()`：
  - `currentLevel='aal2'` → 直接 `gateAndShowApp()`（重載時不再要求重輸 TOTP，因 session 已是 aal2）。
  - `currentLevel='aal1' & nextLevel='aal2'`（已有已驗證因子）→ 顯示**輸入驗證碼**視圖：`challenge({factorId})`＋`verify({factorId,challengeId,code})`。
  - `currentLevel='aal1' & nextLevel='aal1'`（尚無因子）→ 顯示**設定兩步驟驗證**視圖：`enroll({factorType:'totp'})`→顯示 QR（`totp.qr_code`）＋手動金鑰（`totp.secret`）→輸入 6 碼→`challenge`＋`verify` 完成啟用。進入前先 `unenroll` 清掉先前未完成的 unverified 因子，避免堆積。
  - 成功後一律經 **GATE `gateAndShowApp()`：session 必為 aal2 且 `isAdmin()` 通過才 `showApp()`**。`init()` 於每次載入「重查 AAL」（非僅看 session），password-only(aal1) session 無法靠重整進入編輯器。登出（含兩個 MFA 視圖的「取消（登出）」）清空 factorId 並回登入。錯誤以既有 `.admin-error` 顯示、可重試。
- **UI（index.html＋admin.css）。** 新增 `#mfaChallengeView`／`#mfaEnrollView` 兩個 `.admin-login` 卡片，沿用既有 token（solid 色、grounded shadow、hover=lift，無 glow／gradient）。新 `.admin-mfa__qr`（白底磚利於掃描）／`.admin-mfa__secret`（等寬金鑰框）／`.admin-mfa__code`（置中、字距加大的 6 碼輸入）。
- **安全範圍（重要）。** **本次僅 app 層強制**；RLS 仍以 `is_admin()` 把關、**未**改為要求 aal2。**收緊 RLS 要求 aal2 是刻意的後續工作，須等 admin 實際完成 TOTP enrollment 後再做**，否則會把 admin 鎖在自己的 DB 外。復原路徑（遺失驗證器）：Supabase dashboard → Authentication → Users →（該帳號）→ Factors 刪除因子後重新登入再 enrol；已寫入 app.js 註解。
- **驗證（headless Chrome；無驗證器無法跑真實 TOTP 登入）。**
  - **實測**：以 `--headless=new --dump-dom` 載入真實頁面——模組（CDN supabase-js）載入、`init()` 無例外執行、無 session → 正確路由到 **loginView 顯示、其餘三視圖 hidden**（同時驗證 `setView()` 正確切換四視圖）。以真實 markup＋CSS 的暫存預覽檔截圖 enroll／challenge 兩視圖：標題、QR 白磚、等寬金鑰框、置中 6 碼輸入、primary／ghost 按鈕、`.admin-error` 皆正確呈現、符合設計規則。醫師／消息／FAQ 編輯器邏輯未更動（僅換 auth 區塊）。
  - **未實測（需驗證器與 admin 憑證）**：真實 TOTP enroll→verify→aal2→showApp 的 end-to-end；aal2 session 重載直接進入；錯誤碼重試。AAL 分支邏輯以回傳值推演＋上述 DOM/視圖實測涵蓋。
  - **後續 TODO**：admin 完成 enrollment 後，評估將 RLS 寫入政策收緊為要求 aal2（避免鎖死，須在 enrollment 之後）。

## 🗓️ 2026-06-09 (session 44) — 全系統安全審查（report-only，未改任何 code/RLS/auth/config）

對整個系統（靜態站＋Supabase 後端＋發佈管線）做一次完整安全審查，**僅報告、不修改**。報告存於 `docs/security-review-2026-06-09.md`（依嚴重度分級，含「已做對的事」與 live-vs-inferred 標註）。本次只對 anon 角色做了 RLS 探測請求（皆被擋、**零資料變更**，已回讀驗證）。

- **結論：無 Critical／High。** Secret 衛生乾淨（含 `git log -p --all` 全史掃描——唯一 JWT 解碼為 `role:anon`，無 service-role／PAT／密碼／私鑰；`github_pat_` 命中為註解佔位字）。RLS 確為 deny-by-default 且經 anon 實打驗證（讀 profiles→`[]`、讀草稿→`[]`、INSERT/UPDATE/DELETE 皆 0 列、is_admin RPC 對 anon 401、storage 上傳 403）。公開註冊已關閉（live signup→422 `signup_disabled`、僅 email provider、單一 user）。`is_admin()` SECURITY DEFINER＋pinned `search_path=public`、anon EXECUTE 已撤。Edge Function `regen-team` 驗 JWT＋admin、固定 event/repo、PAT 僅在 function secret。
- **Medium（2，皆為專案 checklist 已列的營運項）**：M1 admin 帳號**未啟用 MFA**（`auth.mfa_factors` verified=0）；M2 **leaked-password protection 關閉**（security advisor WARN）。
- **Low**：L1 `generate-faq.mjs` 對 title/description/cover_*（非 body_html）未跳脫（與 team/news 產生器不一致，防禦縱深）；L2 admin 由 jsdelivr 載 supabase-js，僅釘 major、無 SRI；L3 三個 bucket 無 size/MIME 限制；L4 無 meta CSP。
- **Informational**：is_admin 對 authenticated 可執行＝by-design（已確認安全）；Edge Function CORS `*`（後端仍驗權，影響低）；效能 advisor（unindexed FK／initplan／multiple permissive policies，皆 scale-only）。
- **未實測（環境外）**：GitHub 細粒度 PAT 的 scope/expiry、Action repo variables、session-JWT TTL——report 中標為 inferred；建議記錄 PAT 到期日。

## 🗓️ 2026-06-09 (session 43) — Supabase 後端 Phase 3b：/admin/ 衛教專欄編輯器＋新增文章流程（建立在 3a 逐位元組基礎上）

在 3a（衛教專欄遷入 Supabase＋逐位元組產生器）之上，加上 `/admin/` 的衛教專欄編輯器與新增文章流程。**不更動任何既有核可文章文字**：body_html 仍是產生器逐字輸出的正典來源，未改動 body 輸出路徑；既有 17 篇仍逐位元組重生成（3a 閘門重跑通過）。改 `admin/`（index/app/css）、`scripts/generate-faq.mjs`、`regen-team.yml`、`assets/search-index.js`（新增 q8–q17 索引）、progress/README；無新 migration（沿用 3a schema）。

- **Part A — /admin/ 衛教專欄編輯器（鏡像醫師／消息編輯器）。** topbar 加第三個分頁「衛教專欄」（醫師／消息編輯器原封不動）。清單（#faqList＋新增）＋表單：標題、卡片摘要 excerpt、內文、封面上傳（faq-images bucket）＋cover_alt、搜尋關鍵字、分類、狀態（draft/published）、排序、自動指派 slug（q18…）。顯眼的 §九＋院長審閱提醒（最敏感的編輯器）。**內文以 Markdown 作為 body_html 的便利層**：新文章 Markdown→標準 faq-article HTML（前言 <p>；`##`→<h2 class="faq-sub">；段落→<p>；自動附加標準 `.faq-cta`）。既有文章 body_html→Markdown 載入 textarea，**安全閘門**：Markdown 轉回 HTML 必須與儲存的 body_html 逐位元組相同，否則顯示原始 HTML（read-mostly）並標示警告——絕不讓有損轉換默默改寫核可文字。17 篇 body 全部實測 round-trip 乾淨。僅用 anon key＋登入 session（RLS 把關），無 service-role／PAT。
- **Part B — generate-faq.mjs 升級（既有頁輸出維持逐位元組相同）。** 新頁：已發佈但 faq-<slug>.html 不存在者，以既有 faq-qN.html 為**模板**（header/footer/nav/breadcrumb/hero/ld+json/CTA chrome 完全相同）建立新頁，填入 head（title/description/canonical/og/twitter）＋ ARTICLE/BREADCRUMB/LDJSON 標記內容；封面由 faq-images bucket 下載進 assets/faq/ 引用本地路徑。head 欄位對「所有頁」以 regex 重生成（既有頁因 DB==檔案而逐位元組無變化）。卡片：已自動含全部已發佈。搜尋＋sitemap：對**每一篇已發佈**輸出（現在也納入 q8–q17）；無策展 keywords/summary 者以標題／excerpt 衍生合理預設。下架／刪除：不在已發佈集合內的 faq-q<N>.html 會被移除（卡片／搜尋／sitemap 自動消失），**移除嚴格限定 faq-q<N>.html 檔名**，不碰其他頁。Action 的 `git add -A -- 'faq-q*.html'` 正確提交新增與移除的頁。
- **Part C — 驗證＋提交。**
  - **3a 迴歸閘門**：DB 無變更時跑產生器，既有 17 篇 faq-qN.html＋faq.html＋sitemap **逐位元組相同**；唯一合理變更＝search-index.js 新增 q8–q17（70 行新增、0 刪除，q1–q7 與非 FAQ 條目不動）。head regex 重生成對既有頁為 no-op。
  - **完整流程（以 MCP 模擬 admin 寫入＋跑產生器，因無 admin 瀏覽器憑證）**：新增並發佈 q18 → 建立 faq-q18.html（chrome 與 q1 的 header/footer 完全相同、head/breadcrumb/h1/ld+json 皆填入 q18 與其 slug、3/3 標記、本機實測渲染含封面）、faq.html 出現卡片、搜尋＋sitemap 各加一筆；**編輯既有 q5 一個詞（明顯→較重）→ faq-q5.html 僅該行該詞變動、其餘零變更**；**下架 q18 → faq-q18.html 移除、卡片／搜尋／sitemap 條目消失**；刪除 q18 清理；q5 還原為逐位元組相同。Markdown round-trip 對 17 篇全部實測通過。
  - **未實測（需 admin 憑證）**：登入後的 admin 編輯器 end-to-end 寫入／封面上傳尚未實跑（與前幾期相同，無密碼）；以上以 MCP 模擬其 DB 寫入並跑真實產生器（產出即提交檔案）涵蓋整條輸出路徑。
  - **clinic-audit（report-only）PASS**：新搜尋條目（衍生自既有 excerpt）無 §九 禁語；admin/ 無 gradient／glow／transition:all。醫師／消息編輯器無迴歸（三分頁、三模組皆在）。無 secrets。

## 🗓️ 2026-06-09 (session 42) — Supabase 後端 Phase 3a：衛教專欄遷入 Supabase ＋逐位元組忠實的產生器（零內容變更；編輯器／新增文章為 3b）

把 17 篇 衛教專欄遷入 Supabase，並建立「從 DB 重生成、與現有檔案逐位元組相同」的產生器。**硬規則：本階段不更動任何一篇文章的一個字**——成功標準＝跑完產生器後 `git diff` 只顯示新增的標記註解，faq.html／任何 faq-qN.html／search-index.js／sitemap.xml 的醫療文字、標記、屬性、空白皆不變。**本階段無 admin 編輯器、無新增文章功能（屬 3b）。**

- **Part A — Schema＋安全（經 MCP，3 個 migration）。** `faq_articles`（slug 唯一 q1…q17、title、excerpt〔faq.html 卡片 <p>〕、description〔meta／ld+json〕、body_html〔<article> 內 h1 之後的原始 HTML〕、cover_path〔含 ?v=〕、cover_alt、category、search_keywords jsonb、search_summary、sitemap_lastmod、status draft/published、display_order、author_id、published_at、updated_at 觸發器）。為逐位元組重現而**新增** description／search_keywords／search_summary／sitemap_lastmod 欄位。RLS deny-by-default、重用 is_admin()：anon＋authenticated 僅 SELECT published；admin 全 CRUD。Storage `faq-images` bucket：公開 READ、寫入限 is_admin()＋admin SELECT 讀回（沿用上一階段 upload RETURNING 修法）。
- **Part B — 忠實遷移 17 篇（不杜撰、不修改）。** 以 Node 抽取腳本逐位元組擷取每篇的 title（h1）／description／excerpt／body_html（h1 之後到 </article> 之前的原文）／cover_path＋cover_alt（hero <img>，含 ?v=）／display_order，並從 faq.html 卡片取 excerpt、從 search-index.js 取 q1–q7 的 keywords＋summary、從 sitemap.xml 取 lastmod（q1–q12=06-06、q13–q17=06-07）。**先以「重建區塊＝原檔子字串」預檢全部通過**，再 seed。seed 經 MCP 套用後以 **md5 逐欄位核對 DB vs 本地擷取，17 篇全部相符**（含 q1–q7 keywords 陣列）。
- **Part C — 標記＋產生器。** 以一次性腳本（精確錨點、單一匹配斷言）在 5 類檔案插入標記：faq.html `<!-- FAQ:START/END -->`（僅卡片，grid 容器＋#faqPagination＋分頁 <script> 留在標記外）；每篇 faq-qN.html `<!-- ARTICLE:START/END -->`（hero figure＋article）、`<!-- BREADCRUMB:START/END -->`（麵包屑標題 span）、`<!-- LDJSON:START/END -->`（<head> ld+json Article）；search-index.js `/* FAQ:START/END *​/`（type:"faq" 區段，僅 q1–q7 有索引者輸出）；sitemap.xml `<!-- FAQ:START/END -->`（faq-qN url）。`scripts/generate-faq.mjs`（鏡像 generate-team/news.mjs、純 fetch、無 npm 依賴、env SUPABASE_URL/ANON_KEY）以 anon key 讀 published、依 display_order 重生成各區塊（值原樣輸出、body_html 為原始 HTML）；cover 以 faq-images bucket 為來源下載進 assets/faq/、引用本地路徑（公開站零執行期依賴）。`regen-team.yml` 加 `node scripts/generate-faq.mjs` 步驟，git add 併入 `faq.html faq-q*.html assets/faq assets/search-index.js sitemap.xml`——一次 dispatch 重生成三頁群。
- **Part D — 驗證（閘門）＋提交。**
  - **逐位元組閘門**：跑 `node scripts/generate-faq.mjs` 後，全部 20 個檔案皆「No change」；`git diff` 僅 108 行新增、**全為標記註解**（faq.html 2＋sitemap 2＋search 2＋每篇 6×17=102），無任何醫療文字／markup／空白變更。
  - **clinic-audit（report-only）PASS**：§九 無禁語（`最` 命中皆 最新 nav）、頁尾免責聲明齊全；設計規則變更檔無 gradient／glow／transition:all；無障礙 `<img>` 皆具 alt。標記為註解、不可見、無影響。
  - **RLS（anon 實打）**：anon 只讀到 17 篇 published、草稿被隱藏（臨時插入測試草稿驗畢即刪）；anon INSERT 401、anon 寫 faq-images bucket 400。security advisor 無新增項。
  - **預覽（本機，headless）**：faq.html 17 張卡、分頁 6 篇/頁正常；faq-q1 文章頁 h1／3 個 faq-sub／faq-cta／封面（?v=4）／麵包屑標題皆正確。

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
