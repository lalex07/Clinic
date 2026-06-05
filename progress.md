# 進度筆記 / Progress — 大豐耳鼻喉科 website

Orientation note for the next session. See `site-spec.md` for the full content brief (source of truth) and `CLAUDE.md` for the rules (design rules + compliance live there).

_Last updated: 2026-06-06 (session 13)_

## 🗓️ 2026-06-06 (session 13) — 發布 FAQ Q8–Q12（院長核准）+ SEO/社群 meta・schema・sitemap/robots + 首頁最新消息 teaser

多 agent 平行作業；本 agent 負責整併 faq.html 與唯一 commit。clinic-audit（report-only）三組全 PASS。

- **Agent 1：全站 SEO／社群中繼資料 + schema + 標題還原 + 首頁最新消息 teaser。**
  - 每頁補上 `<link rel="canonical">`、Open Graph（og:title／description／url／image／site_name／locale／type）與 Twitter card（summary_large_image），圖片用 `assets/logo.png`。
  - 結構化資料：首頁 `MedicalClinic`＋`PostalAddress`；FAQ 文章頁 `Article`＋`MedicalClinic`／`Organization`／`WebPage`；faq.html `FAQPage`。
  - **頁面 `<title>` 還原為完整品牌式**（session 10 曾簡化為「大豐耳鼻喉科」等；現為「大豐耳鼻喉科聯合診所｜新店・木柵・興隆 三院區」「<主題>｜衛教專欄｜大豐耳鼻喉科聯合診所」等，利於 SEO 與分享）。
  - **首頁新增「最新消息」teaser 區塊**（`.home-news`，連向 news.html 的最新一則公告），hover 僅箭頭位移、無變色，符合設計規則。
- **FAQ Q8–Q12 經院長核准、正式發布。**
  - `faq.md`：Q8–Q12 狀態由「草稿」更新為「已審閱／可發布」（院長親修微調，如 Q8 補「小下巴／鼻腔溝造狹窄／體重過重」等用字）。Q13–Q17 維持草稿（待院長審閱）。
  - 5 個文章頁 `faq-q8…q12.html`（由 Q8–Q12 agent 建立，本 agent 確認）：各 1 個 h1＋3 個 h2、breadcrumb、`.photo-zone` 占位 banner（受框約束未溢出）、canonical、Article schema、頁尾免責聲明、最新消息 nav、搜尋圖示（無舊內嵌搜尋框）。
  - **faq.html 卡片網格新增 Q8–Q12 五張卡**（沿用 Q1–Q7 markup：`.photo-zone` 占位＋該題 `配圖建議`＋分類 tag＋標題＋1–2 行摘要＋「閱讀全文 →」連向各文章頁）。網格現 12 張（Q1–Q12）；Q13–Q17 未發布。分類 tag：成人睡眠呼吸中止（Q8,Q12）／女性・睡眠健康（Q9）／打鼾・止鼾裝置（Q10）／睡眠・胃食道逆流（Q11）。
  - **FAQPage JSON-LD 擴充至 Q1–Q12**（12 題 Question／Answer，排除 Q13–Q17）；JSON 解析驗證通過。
- **新增 `sitemap.xml`（根目錄）＋ `robots.txt`。**
  - sitemap：28 個 URL，列出每個 served 頁面（含 `faq-q8…q12.html`），URL 取自各頁 canonical（首頁＝`https://lalex07.github.io/Clinic/`），含 lastmod 2026-06-06／changefreq／priority；`/en/` 5 個 stub 也列入（priority 0.3）。排除尚未建立的 Q13–Q17。XML 驗證通過、namespace 正確。
  - robots.txt：`User-agent: *` / `Allow: /`，並 `Sitemap:` 指向 sitemap.xml。
- **仍待辦：** Q13–Q17 仍為草稿（待院長審閱）；**健保特約 badge**、**門診時間表（§十一 醫師×院區×時段）**、**預約掛號／聯絡頁（contact.html，header CTA「立即預約」目前指向尚未建立的此頁）** 皆待補。首頁病人回饋（patient-feedback）仍 HELD，待院長 §九 合規簽核。

### 驗證（clinic-audit report-only 全綠）
- **§九**：Q8–Q12 頁面與 faq.html 無 保證／根治／唯一／第一／必須／一定要／最〔上級〕；全站 `最` 僅 最新（最新消息 nav）＋最近（地理「最近捷運／離您最近」）＋最佳（photo-zone 標籤）；無費用、無療效百分比；5 個新頁頁尾免責聲明齊全；中山維持「2026 年 10 月開幕・敬請期待」。
- **設計規則**：gradient／backdrop-filter／filter:blur／drop-shadow／`0 0` glow／`transition:all` 全 0；新卡片與文章 banner 的 `.photo-zone` 占位皆受框約束未溢出；header 單行。
- **無障礙**：faq.html＝1 h1＋12 h2（無跳級）；faq-q8…q12 各 1 h1＋3 h2；img alt 全齊、html lang zh-Hant、skip-link、最新消息 nav 齊備。
- **連結／渲染**：本機 server 對 faq.html、faq-q8…q12.html、sitemap.xml、robots.txt 皆 200；截圖 `temporary screenshots/s13-faq-grid`（12 卡網格）、`s13-faq-q8`（文章頁占位 banner 受框）確認。

## 🗓️ 2026-06-06 (session 12) — 搜尋改圖示+overlay（修 header 溢位）+ FAQ 圖回退占位 + 消息預設公告磚 + CLAUDE.md 規則 + docs/ 整理

多 agent 平行作業；本 agent 負責整併 header／共用檔與唯一 commit。clinic-audit（report-only）三組全 PASS。

- **搜尋重新設計為「放大鏡圖示 + 點擊開啟 overlay」，修正 header 溢位。** 上一版（session 11）每頁 header 內嵌搜尋輸入框，在桌機寬度把 nav 擠到第二行／溢出。本次：`assets/search.js` 改為載入時於 header（`.lang-toggle` 之前）注入一顆放大鏡按鈕，並於 `<body>` 末建立隱藏 overlay（`role="dialog" aria-modal="true"`、aria-labelledby、focus-trap、Esc／點背幕關閉、關閉後焦點回按鈕、尊重 prefers-reduced-motion；背幕為實心 `rgba(14,74,68,.42)` 無模糊；卡片含大輸入框＋「熱門搜尋」chip＋即時結果）。`assets/site.css` 以 `.search-trigger`／`.search-overlay`／`.search-modal` 取代舊 `.site-search` 規則（0 殘留）。**我把每頁 header 內殘留的舊 `.site-search` 內嵌 markup 全數刪除**（18 頁，各 1 段；search.js 另有執行期防衛去重，但原始碼一併清乾淨避免重複 id／閃爍）。`search-index.js`／`search.js`／`site.css` 三者每頁皆已連結。**桌機 header 已回到單行**（1280／1024px 截圖確認，nav 不換行不溢出）。
- **FAQ Higgsfield 占位插圖移除、回退為 `.photo-zone` 占位**（agent 3 已回退頁面 body；本 agent 確認）。原因：生成圖未受占位框約束、尺寸溢出版面。`assets/faq/q1–q7.jpg` 7 檔刪除；`faq.html` 7 張卡片與各 `faq-qN.html` banner 回到 camera-icon「配圖建議」占位（faq.html：0 個 `<img>`、7 個 figure 占位；各文章頁 1 個 figure 占位）。院長確定插圖策略後再以**受框約束**的方式重做。
- **最新消息：預設「公告／Announcement」磚。** 無圖片的公告卡顯示實心預設磚（喇叭圖示＋公告／ANNOUNCEMENT 標籤，硬邊、無漸層光暈），整塊 `aria-hidden="true"`（標題＋內文承載語意）；範例中山開幕公告即用此磚。news.html 內附「日後新增公告」範本註解（有圖走 `.news-card__img` object-fit:cover、無圖走預設磚）。
- **CLAUDE.md 新增兩條設計規則 + 一節「File organization」：**
  - 設計規則：① **header/nav 桌機永遠單行**，任何 header 新增物都須維持單行（不換行、不溢出）；放不下就收成圖示／overlay，別讓 header 換行（本次溢位即教訓）。② **占位框內的圖片永遠受框約束**（固定 aspect-ratio 內 object-fit:cover、100% 填滿並裁切，絕不溢出／撐大版面）——對應本次 FAQ 圖回退的原因。
  - 「File organization」節：無建置 GitHub Pages，**served 頁面（`*.html`）與 `assets/` 一律平鋪 repo 根目錄**（絕不把 served HTML 巢狀進子資料夾，會破壞 URL）；`/en/` 為唯一刻意巢狀（鏡像中文結構）；`brand_assets/`＝原始素材；`docs/`＝不 served 的工作／歷史文件；`.claude/`＝skills。新檔依此分類預設歸位。
- **docs/ 整理（不動 live 站）。** 新建 `docs/`，以 `git mv` 移入兩份非 served 的次要文件：`docs/design-review.md`、`docs/review-2026-06-02.md`（無遺留 `faq-draft-*.md`）。**所有 served HTML（含 index.html）與 assets/ 維持根目錄不動**，內部連結與 live URL 不受影響。progress.md 內 3 處引用已更新為 `docs/…` 路徑。根目錄保留：CLAUDE.md（Claude Code 要求）、progress.md、site-spec.md、faq.md、.gitignore。
- **首頁病人回饋（patient-feedback）仍 HELD**，待院長就醫療廣告（§九）合規簽核後才上線，本次未動。

### 驗證（clinic-audit report-only 全綠）
- **§九**：保證／根治／唯一／第一／必須／一定要／最權威＝0；`最` 僅 最新×28（最新消息）＋最近×5（地理）＋最佳×3（photo-zone 標籤）；無費用；**23 頁**頁尾免責聲明齊全。中山維持「2026 年 10 月開幕・敬請期待」無手術招攬。
- **設計規則**：gradient／backdrop-filter／filter:blur／drop-shadow／`0 0` glow／`transition:all` 全 0（唯一 `filter:` 為 team 醫師照色彩正規化＝既知例外；overlay 背幕實心無模糊；overlay 淡入用 opacity、卡片用 transform，reduced-motion 下關閉）；**header 單行**；news 卡片 hover＝lift（translateY+shadow，不變色）。
- **無障礙**：html lang 23/23、img alt 全齊、SVG 裝飾全 `aria-hidden`、skip-link 23/23；搜尋 overlay dialog ARIA／focus-trap／reduced-motion 齊備；標題順序全頁 ok（含 news.html h1 h2 h2、各頁恰 1 h1）。（grep 另命中 2 筆皆為誤報：`<img>` 在 HTML 註解的範本文字內、`<svg>` 位於 `aria-hidden="true"` 祖先之下，皆非真實缺失。）
- **渲染**（Chrome headless 2×，`temporary screenshots/s12-*`）：`header-desktop`(1280) 與 `header-1024` 單行不換行；`news-placeholder` 預設公告磚渲染；`faq-placeholders` 卡片回到 camera-icon 占位。

## 🗓️ 2026-06-06 (session 11) — 最新消息頁 + 全站搜尋 + FAQ 插圖（Higgsfield）

多 agent 平行作業；本 agent 負責整併共用檔（header／`site.css`／`search-index.js`）與唯一 commit。clinic-audit（report-only）三組全 PASS。

- **最新消息 `news.html` 新增。** 院區公告／門診異動的集中頁：hero ＋ breadcrumb ＋**院區篩選 chip（全部／新店／木柵／興隆）**＋公告卡片網格，client-side 依 `data-date` 由新到舊排序、篩選空狀態有提示。目前一則**範例公告**＝中山旗艦手術中心 2026/10 開幕（占位配圖，未上線手術行銷語，符合中山「敬請期待」狀態）。`en/news.html` 為 coming-soon stub，與 CN 頁以語言切換互連。
- **全站搜尋上線。** `assets/search-index.js`（手動維護靜態索引，18 筆：6 主要頁＋7 衛教＋4 院區＋1 最新消息）＋ `assets/search.js`（vanilla JS，即時搜尋、ARIA combobox／listbox、鍵盤上下／Enter／Esc、命中字 `<mark>`、分類標籤）。搜尋列插入**每一頁** header（nav 之後、語言切換之前），≤760px 落到 header 第二行佔滿整列。CSS 併入 `assets/site.css`（實心底色、硬邊、無發光／漸層、hover 僅變底色、`:focus-visible` 外框）。新增的搜尋色彩全數通過 WCAG AA（item-title 10.09、snippet 5.20、badge-location #9a5527/accent-soft 4.68、badge-news 5.94…）。**整併時把 news 索引條目的 url 由 `location-zhongshan.html` 改指 `news.html`**（搜尋「最新消息／公告」即可到達新頁），並同步更新 `search-index.js` 內過時的維護備註。交接檔 `search-integration.md` 併入後刪除。
- **最新消息 nav 連結加到每一頁 header**（順序：關於大豐／診療項目／醫療團隊／院區・門診／衛教專欄／**最新消息**；`news.html` 上 `aria-current="page"`）。`/en/` stub 無主選單，故不加 nav 連結（沿用既有慣例）；CN↔EN 仍以語言切換互連。
- **FAQ Q1–Q7 占位插圖（Higgsfield 生成）已接上。** 7 張 `assets/faq/q1–q7.jpg`（大豐吉祥物風格、診所色盤、衛教示意，非真實人物／兒童），1600×900，接到 `faq.html` 卡片（`loading=lazy`）與各 `faq-qN.html` 文章 banner（`loading=eager`）。原 `.photo-zone` 占位框已全數移除（faq.html 0 個 figure 占位、7 個 `<img>`；各文章頁 1 個 `<img>`）。alt 文字描述具體且 §九-clean（「插圖：…」「非真實兒童」「未露臉」）。檔案 120–162KB，合理。⚠️ **PENDING 院長視覺審查**——此為占位風格圖，院長確認插圖策略後可替換。
- **首頁病人回饋（patient-feedback）仍 HELD**，待院長就醫療廣告（§九）合規簽核後才上線，本次未動。

### 驗證（clinic-audit report-only 全綠）
- **§九**：保證／根治／唯一／第一／必須／一定要／最權威＝0；`最` 僅 最新×28（「最新消息」＝latest news，非臨床最上級，新增之可接受用法）＋最近×5（地理）＋最佳×3（photo-zone 標籤）；無費用；**23 頁**頁尾免責聲明齊全（含 `news.html`、`en/news.html`）。
- **設計規則**：gradient／backdrop-filter／filter:blur／drop-shadow／`0 0` glow shadow／`transition:all` 全 0；搜尋列與結果清單 hover 僅變底色、陰影用既有 tinted token。
- **無障礙**：html lang 23/23、img alt 全齊（含 7 張 FAQ 插圖，alt 描述完整）、SVG 全 `aria-hidden`（含搜尋放大鏡圖示）、skip-link 23/23、搜尋 combobox/listbox ARIA 18/18；標題順序全頁 ok（news.html＝h1 h2 h2，各頁恰 1 個 h1、無跳級）。
- **渲染驗證**（Chrome headless 2×，`temporary screenshots/s11-*`）：`index`（搜尋列＋最新消息 nav 於 header、無光暈漸層）、`news`（hero＋院區篩選＋中山範例公告）、`faq-mobile`（搜尋列落第二行、FAQ 插圖渲染）。本機 server 各頁與資產（含 `assets/faq/*.jpg`、兩支 search script）皆 200。

## 🗓️ 2026-06-05 (session 10) — FAQ Q8–Q17 草擬併入 + 首頁團隊合照占位 + 院區順序 + 頁面標題簡化

多 agent 平行作業，本 agent 負責整併與唯一 commit。clinic-audit（report-only）三組全 PASS。

- **FAQ Q8–Q17 草擬，併入 `faq.md`（仍為草稿・待院長審閱，未發布）。** 10 篇（Q8 軟顎舌根／Q9 女性荷爾蒙／Q10 止鼾牙套／Q11 胃食道逆流×睡眠／Q12 成人臨床表現／Q13 兒童臨床表現／Q14 逆流×中耳炎／Q15 逆流×耳悶／Q16 肥胖／Q17 簡易打呼判讀）各約 650 字，嚴格沿用 Q1–Q7 範本（開場框架→機制粗體小標→辨識徵兆→日常可做→軟性「至門診評估」收尾→📷 配圖建議）。狀態統一為「草稿（待院長審閱）」，文章列表表格與註記同步更新。涉手術主題（Q8、Q10）以中山院區「2026 年 10 月開幕」未來式帶過。**未發布至 `faq.html`，未建立 `faq-qN.html` 文章頁**——延續既有 workflow，等院長審閱通過才上線。草稿暫存檔 `faq-draft-q8-q12.md`、`faq-draft-q13-q17.md` 併入後刪除。
- **首頁團隊合照占位**（`index.html`）— 新增 `.home-teamshot` 區塊，16:9 `.photo-zone` 智慧占位（內含 shot brief：全體醫師白袍合影、1920×1080+），院長委拍後可直接換成 `<img>`。沿用既有占位元件，無實際外部圖片。
- **院區順序統一為 新店→木柵→興隆→中山**（依創立年序 2010→2019→2025→2026）。`locations.html` 四張卡片與相關清單已對齊此序。
- **頁面 `<title>` 簡化** — 各頁標題改為精簡品牌式（關於大豐／診療項目／醫療團隊／院區・門診／衛教專欄／木柵大豐…），FAQ 文章頁則用各篇主題標題。

### 驗證（clinic-audit report-only 全綠）
- **§九**：保證／根治／唯一／第一／必須／一定要／最權威＝0；`最` 僅 最佳×3（photo-zone 標籤）＋最近×5（地理）；無費用；21 頁頁尾免責聲明齊全（`%` grep 命中皆為 CSS 寬度／keyframes／地圖 URL 編碼，非療效宣稱）。
- **設計規則**：gradient／backdrop-filter／filter:blur／drop-shadow／`0 0` glow shadow／`transition:all` 全 0（grep 命中兩處皆註解文字，唯一 `filter:` 為 team 醫師照色彩正規化＝既知例外）。
- **無障礙**：html lang 21/21、img alt 全齊、SVG 全 `aria-hidden`、skip-link 21/21；標題順序全頁 ok（含 index.html、locations.html 無跳級，各頁恰 1 個 h1）。

## 🗓️ 2026-06-05 (session 9) — 兩項無障礙修正 + clinic-audit 補強（標題順序＋背景對比）

源自一次 Impeccable（report-only）交叉稽核：扣除設計規則允許的項目後，剩兩個真正的 a11y 問題。**僅做修正所需最小變更，未改任何視覺設計（院長核准、鎖定）。**

### Fix 1 — 首頁標題階層跳級（h1→h3，零視覺變更）
- `index.html` 三張 `.qcard` 快速入口（四大院區・門診時間／診療項目／立即預約）原為 `<h3>`，緊接 hero `<h1>` 之後、且在頁面第一個 `<h2>` 之前 → **h1→h3 跳級**（WCAG 1.3.1 / clinic-audit Group C #4）。前幾個 session 修了 `locations.html` 與 FAQ 頁，但漏了首頁這三張卡。
- 將三個 `<h3>` 升為 `<h2>`，並把 CSS 選擇器 `.qcard h3` → `.qcard h2`（`index.html:178`）。base `h1,h2,h3` 規則對 h2/h3 完全相同（同字體／字重／margin:0），且 `.qcard h2` 仍 `1.2rem/600`，**外觀逐像素不變**（截圖 `temporary screenshots/a11y-index-qcards.png` 確認）。修正後首頁順序：h1 → h2×4 → h3×5（feature），無跳級。

### Fix 2 — 立即預約 CTA 對比（保留赤陶色，加深文字）
- `team.html:205`（`.team-links__actions .primary`）與 `about.html:166`（`.about-cta__links .primary`）：CTA 底色 `var(--accent)` #CC7A45 + 白字 = **3.27:1，未過 WCAG AA**（hover #b96a38 = 4.05:1 仍不過）。此白底白字未列於 clinic-audit 既有 `--accent` 例外（該例外僅限 icon／大字）。
- **保留赤陶底色不動**，只把文字色改為深墨 **`#121110`**：實測 resting #CC7A45 = **5.78:1**、hover #b96a38 = **4.65:1**，雙雙過 AA。註：`--ink #2B2A26` 在 accent 上僅 4.40:1 仍不過，故需更深的 `#121110`（暖近黑，不用純冷黑）。CTA 內 SVG 用 `currentColor`，圖示一併轉深、與文字一致。底色／字級／字重皆未動。

### clinic-audit 補強（`.claude/skills/clinic-audit/SKILL.md`）— 讓稽核自身抓得到這兩類問題
- **(a) 標題「順序」而非僅「數量」**：Group C #4 原本只數 h1/h2/h3 出現次數，所以「頁面後段有 h2、但前段已 h1→h3 跳級」會漏掉（正是首頁這次的情形）。新增一段 python：依**文件順序**讀各頁標題、標記任何跳超過一級者；先 `<footer>` 切掉（頁尾共用 `<h4>` 為既知例外，避免誤判 h2→h4）。
- **(b) 文字 × 非 cream 背景對比**：對比段原本只查「文字 on cream」。擴充為：凡覆寫背景為色塊的元件（按鈕／chip／callout／teal CTA 帶）都要拿文字對**該元件自身背景**檢查，且**含 `:hover` 背景**。記錄 white-on-#CC7A45 = 3.27:1 為已知 FAIL 範例與站內修法（加深文字或換過關背景）；對比小工具改為可傳第二個 hex 檢查任意背景。

### 驗證（clinic-audit report-only 全綠）
- **§九**：保證／根治／唯一／第一／必須／一定要／最權威＝0；`最` 僅 最佳×3（photo-zone 標籤）＋最近×5（地理）；無費用；17 頁頁尾免責聲明齊全。
- **設計規則**：gradient／backdrop-filter／filter:blur／drop-shadow／`0 0` glow shadow／`transition:all` 全 0（grep 命中的兩處皆為註解文字，唯一 `filter:` 為 team 醫師照色彩正規化＝既知例外）。
- **無障礙**：html lang 齊、img alt 齊、裝飾 SVG 全 `aria-hidden`、skip-link 17/17、reduced-motion guard 在；**新標題順序檢查全頁 ok**；兩 CTA 對比 5.78／4.65 過 AA。

## 🗓️ 2026-06-04 (session 8) — 衛教專欄拆成獨立文章頁 + 全站回到頂端按鈕

clinic-audit（report-only）三組全 PASS（§九／設計規則／無障礙），含 7 個新文章頁與回到頂端按鈕。

### Task 1 — 衛教專欄改為「一文一頁」（homepro 式）
- 新增 **7 個根目錄頁** `faq-q1.html … faq-q7.html`（刻意放 ROOT，沿用既有 `assets/`、`index.html` 等相對路徑，無 `../`）。以 script 從 `faq.html` 抽出 header／footer **逐字複製**、各篇 `<article id="qN">` 內文**逐字搬移**（院長核准內文一字未改，連 Q1 原稿「流鼻水，鼻塞」的標點都原樣保留）。
- 每頁：獨立 `<title>`、`<meta description>`（依各篇開場改寫、§九-clean）、breadcrumb（首頁／衛教專欄／文章標題）、頂部 `.photo-zone` 配圖 banner（沿用該卡片的 shot brief）、`.faq-cta` 保留、輕量 schema.org `Article`。
- **無障礙**：文章標題由 `<h2>` 升為頁面唯一 `<h1>`；`.faq-sub` 由 `<h3>` 升為 `<h2>`（消除 h1→h3 跳級）。每頁 1 個 h1、3 個 h2、0 個 h3。
- `faq.html`：7 張卡片 `href` 由 `#qN` 改為 `faq-qN.html`；**刪除**已冗餘的整段 inline `.faq-articles`（保留 hero／卡片網格／header／footer／免責聲明）。`en/faq.html` 維持 stub，無 EN 文章頁。
- CSS（`site.css`）：`.faq-article > h2` 選擇器改為 `> h1`（標題樣式跟著搬到 h1，且避免誤套到現為 h2 的 `.faq-sub`）；新增 `.faq-article--solo`（單篇頁去除分隔線 border-top）與 `.faq-article__media`（banner 對齊 65ch 文欄）。

### Task 2 — 全站「回到頂端」浮動按鈕（cureclinic 式）
- 於共用檔一次實作、全站（含新 faq-qN 頁）自動出現，無需逐頁 markup：`assets/site.js` 建立 `<button class="back-to-top">` append 到 `<body>`；`assets/site.css` 加樣式。
- 行為：捲動 > 400px 才顯示（`is-visible` class 切換）；點擊平滑捲回頂端；`prefers-reduced-motion` 時改 instant scroll、且 CSS 關閉顯示/lift 過場動畫。
- 樣式（合設計規則）：實心圓、`--primary` 底、白色上箭頭、硬邊、接地 `--shadow-md`；hover＝上移 3px＋加深陰影＋底色轉 `--primary-deep`（按鈕變色允許，非卡片）。`aria-label="回到頂端"`、可鍵盤聚焦、`:focus-visible` 外框、內層 svg `aria-hidden`；隱藏時 `visibility:hidden` 故不可聚焦。

### 驗證
- 截圖（Chrome headless 2×，`temporary screenshots/s8-*`）：`faq-grid`（卡片網格不變、連結改指獨立頁）、`faq-q1-article`（banner＋h1＋h2 小標＋CTA）、`faq-q1-mobile`、`backtotop-visible`（實心圓按鈕於右下、無光暈/漸層）。回到頂端可見態截圖以暫時複本 `_btt_q6.html`（強制 `is-visible`）拍攝後刪除。
- clinic-audit 三組 PASS；`最` 僅 最近／最佳；新頁 disclaimer 齊全。

### Task 3 — git 歷史抹除（**已執行，經明確同意**）
- 自**所有歷史 commit** 移除 `assets/doctors/lin-chun-ju.jpg` 與 `brand_assets/林諄儒 photo.jpg`。以官方 standalone `git-filter-repo` 腳本（pip 受 PEP 668 阻擋，改下載單檔腳本以 python3 執行）`--invert-paths --path … --force`。
- **force-push 前先備份**：`git bundle create ../Clinic-backup-pre-scrub.bundle --all`（33M，含所有 ref，留作唯一還原點）。
- 重寫後 origin 被 filter-repo 移除→重新加回→`git push origin --force --all`（`a4bd85a…8ee96dd main 強制更新`，無 tag）。
- **驗證**：兩路徑在所有歷史的 object-list 命中＝0、舊 blob `c04bd80` 不可達；其餘三張醫師照（liao／wu／hsiao）歷史完好；local＝origin main＝`8ee96dd`、remote 歷史亦無痕。
- ⚠️ **後續注意**：所有 commit SHA 已改寫（前 `7081a3b`→今 `8ee96dd`）。**其他 clone／另一個 Claude session 需重新 clone 或 hard-reset**，勿直接 pull。GitHub 可能短暫快取舊 blob、**既有 fork 仍保有**舊物件；如需徹底清除網頁快取／fork，須聯絡 GitHub Support。備份 bundle 位於專案上層 `Clinic-backup-pre-scrub.bundle`，確認無誤後可刪。

## 🗓️ 2026-06-04 (session 7) — 兩位醫師匿名化 + 院區交通／地圖 + 木柵院長 label + 衛教專欄改卡片網格

四項任務，全程未違反設計規則（無漸層／光暈／backdrop-filter／filter-blur、hover=lift、無 transition:all、僅用 tinted shadow token）與 §九（無 保證／根治／唯一／第一／最〔僅最近・最佳〕／必須／一定要、無費用、頁尾免責聲明完整）。

### Task 1 — 林諄儒・林雅芳 匿名化（隱私，兩位醫師不願露面）
- 新增 `.doc__ph--anon` modifier（`team.html` `<style>`）：沿用 `.doc__photo` 容器（同 4:5 crop／footprint），solid `--bg-2` 底 ＋ 置中 Instagram 式**中性人形剪影** inline SVG（`--ink-faint`，`fill:currentColor`），硬邊、純色、無漸層／光暈。容器加 `role="img"` ＋ `aria-label="〇〇〇醫師（不提供照片）"`，內層 svg `aria-hidden`。
- **林諄儒**：原 `<img src="assets/doctors/lin-chun-ju.jpg">` → 匿名剪影。**林雅芳**：原 `.doc__ph` 單字「林」占位 → 同款匿名剪影。
- **未動** 蔡彥群／李順源 的家族字監名占位（語意不同＝「照片待提供」，仍為綠底 `.doc__ph` 單字）。
- **隱私清檔**：`git rm` 刪除 `assets/doctors/lin-chun-ju.jpg` 與 `brand_assets/林諄儒 photo.jpg`（非僅 unlink，避免仍可由 GitHub Pages 取得）。`site-spec.md` §五 對應更新。⚠️ **git 歷史仍保有 blob**——若需徹底抹除須另跑 history scrub（如 `git filter-repo`），本次未做，列為選用後續。
- 林雅芳原本就無照片檔，無檔可刪。

### Task 2 — 三間營運院區補上 交通方式 ＋ 地圖位置（取代 placeholder-panel）
- 兩個共用元件加進 `assets/locations.css`：`.transit-list`（白卡、tinted `--shadow-sm`、硬邊、每列 icon＋粗體 label）與 `.loc-map`（keyless Google Maps `?q=…&output=embed` iframe，`loading=lazy`、`referrerpolicy`、`aspect-ratio:16/9`、`--radius-lg`＋`--shadow-sm`，附 `.map-addr` 地址 caption）。schema.org 資料未動、仍正確。
- **交通事實來源與信心度（請院長核對）：**
  - **興隆（興隆路二段118號）— 高信心**：公車「興德國小」站就在診所同側門口（taiwanhelper TPE14555 明列 118號站牌往東向），路線：羅斯福路幹線・棕2・棕6・棕11・671・673・236區・0南・109・530・606・676；捷運松山新店線「萬隆站」或文湖線「萬芳醫院站」下車轉乘（文山區戶政景美辦事處〔興隆路二段160號，與診所同段〕官方交通指引）。停車＝〔待確認〕。
  - **新店總院（建國路161、163號）— 中信心**：最近捷運＝松山新店線・環狀線「大坪林站」，步行約 10 分鐘（措辭加「約／以現場為準」hedge；網路資料對精確分鐘有出入：建國路民權路口距1號出口約5分鐘、大豐路約8分鐘、大豐國小路線約21分鐘）。公車路線、停車＝〔待確認〕。
  - **木柵（木新路三段220號）— 低信心**：聚合平台（Moovit）把新店／木柵兩家診所交通資料混在一起（兩者都標「大坪林1分鐘」明顯錯誤），故**最近捷運站與步行時間、鄰近公車站名與路線全列〔待確認〕**；維基證實木新路三段西接新店寶橋路，但 220 號實際最近站無法可靠判定，不臆測。停車＝〔待確認〕。
- 三頁地圖 iframe 的 `q` 皆用「診所名＋地址」字串，讓 pin 落在實際診所。
- ⚠️ 所有 `〔待確認〕` 以站上既有 `.tbd`（✎ 標記 pill）呈現，院長確認後可直接替換。

### Task 3 — 木柵院長 label
- `location-muzha.html` 側欄「院長」由 `蕭仁豪 醫師（SINCE 2019）` → `蕭仁豪 醫師`（移除誤植的英文 SINCE 後綴）。其餘三院區頁面掃描確認無相同贅綴。

### Task 4 — 衛教專欄（faq.html）改為雜誌式卡片網格
- 參考 HomePro 的卡片網格**結構**（每卡：頂部主圖＋分類標籤＋標題＋摘要），但**以大豐自己的設計語言呈現**（留白、沉穩、硬邊、lift-on-hover），刻意避開 HomePro 的資訊密度（院長曾覺其 overpowering）。
- 頂部 `.faq-index` 的 `.faq-entry` 直列清單 → `.faq-grid`（桌機 3 欄／平板 2 欄／手機 1 欄）；7 篇（Q1–Q7）各成一張 `.faq-card`：`.photo-zone--16x9--sm` 智慧占位（內含逐篇配圖建議 shot brief）＋分類 pill＋標題＋1–2 行摘要＋「閱讀全文 →」，連結至既有 `#q1…#q7` 錨點。
- 分類標籤：鼻過敏・睡眠（Q1,Q2）／兒童睡眠呼吸中止（Q3–Q6）／鼻部結構・打鼾（Q7）。可選的分類 filter bar **未做**（僅 7 篇，且為避免非必要 JS／維持克制；卡片分類 pill 已足夠表達分群）。
- **下方完整文章（`.faq-articles`）一字未改**；院長核准的內文與 `#q1…#q7` 錨點原樣保留。`en/faq.html` 維持 stub、頁尾免責聲明完整。CSS：移除已無用的 `.faq-entry*`／`.faq-index__list` 規則，改為 `.faq-card*`／`.faq-grid`。

### 驗證
- 截圖（Chrome headless 2×，`temporary screenshots/s6-*`）：team（兩剪影 vs 兩監名占位清楚可辨）、faq 桌機＋手機（3→1 欄）、三院區頁（交通卡片＋地圖實際嵌入成功渲染、木柵院長已修正）。
- §九 與設計規則 grep 全數 clean；`最` 僅 最近／最佳（pre-existing 占位）。

### ⏭️ 待院長
- 確認三院區交通的 `〔待確認〕` 項（尤其木柵全部、新店公車／停車、各院區停車）。
- 衛教專欄卡片配圖：院長決定插圖策略後，把各 `.photo-zone` 換成實際插圖（版位已預留）。

## 🗓️ 2026-06-04 (session 6) — 醫師姓名用字統一（巫靚穎）+ .gitignore

- **巫靚穎 用字確認並統一全站**：院長確認正確用字為「巫靚穎」（先前 faq 誤用「婧」）。修正 `faq.html`（已發布，3 處）與 `faq.md`（草稿，3 處）的「巫婧穎」→「巫靚穎」。team.html 本即正確。`site-spec.md` §五 與本檔 blocking item (a) 標為已解決。`brand_assets/巫婧穎 photo.jpeg` 原始檔名依規則保留未動（已 romanize 為 `wu-ching-ying.jpg` 服務於站上，不受影響）。
- **`.gitignore`**：新增 `.claude/settings.local.json`（Claude Code 本機設定，先前為 untracked）。
- ✅ **林諄儒 vs 林雅芳 已確認**：院長確認為**兩位不同醫師**，皆為實際醫師（非誤植）。醫師總數維持 **7（6 耳鼻喉＋1 小兒）**，roster 無需調整——全站既有內容本即正確，無需修改。
- ✅ **廖學森 用字已確認**：院長確認正確用字為「廖學森」（原始照片檔名「廖學生」為誤植）。各頁本即使用「廖學森」，無需修改；`brand_assets/` 原始檔名保留未動。
- **本次三項姓名疑問（巫靚穎／林諄儒vs林雅芳／廖學森）全數確認結案**，site-spec §五 TODO 已對應更新。

## 🗓️ 2026-06-04 (session 5) — 無障礙修正（review-2026-06-02 的 4 項）

套用 `docs/review-2026-06-02.md` 的 4 個 accessibility 發現，**僅做修正所需的最小變更，無其他視覺改動**。合規（§九）與設計規則在本次 review 已是 PASS，未動。

1. **Reduced-motion guard（`index.html`）** — hero `.breath-rings circle` 的 `breathe 6s infinite` 先前不受任何 `prefers-reduced-motion` 保護（既有 guard 在 `site.css` 只處理 `.reveal`）。在 `index.html` `<style>` 內 `@keyframes breathe` 後新增 `@media (prefers-reduced-motion: reduce){ .breath-rings circle{ animation:none } }`。WCAG 2.3.3。
2. **裝飾性 SVG `aria-hidden` 全站掃描** — 為所有缺漏的純裝飾 inline `<svg>` 補上 `aria-hidden="true" focusable="false"`，共 **134** 個（10 中文頁 + 4 個 `/en/` stub）。全部 SVG 皆為 24×24 線圖示且旁邊有文字標籤（nav／卡片標題／chip／info-row／breadcrumb／footer／地圖佔位／en 返回箭頭），無任何「不靠鄰近文字即傳達獨特資訊」者，故全數可隱藏；連結內的 chevron 一併隱藏以保持連結 accessible name 乾淨。既有 `aria-hidden` 的 breath-rings 未重複加。掃描後 0 個 SVG 仍缺 `aria-hidden`、無重複屬性。
3. **文字對比（`assets/site.css` + 用處）** — `--ink-faint` `#918A7C`（cream 上 3.18:1）**加深為 `#736C5E`**（cream 4.83:1、white 5.2:1，雙雙過 AA 4.5:1）；token 沿用故 team 卡片 bio／QR 說明／eyebrow 等小字一次到位。`--accent` `#CC7A45`（3.03:1）**值不變**（仍用於圖示填色／大字，3:1 可接受），但把 6 處**小字**的 `color:var(--accent)` 改為 `--ink-soft`（`#5E584E`，6.5:1）：`.sec-head .kicker`、`.faq-entry__num`、`.faq-article__num`（`site.css`）、`.values__inner .kicker`（`about.html`）、`.feature__num`（`index.html`）、`.svc__num`（`services.html`）。大字 accent（`.tl-year` clamp 1.6–2.1rem）與裝飾短線／圖示 accent 維持不動。
4. **標題階層（`locations.html`）** — 原 `<h1>`→`<h3>` 跳級。`全院區門診總表` 由 `<h3>` 升為 `<h2>`（CSS 選擇器 `.sched-card__body h3`→`h2` 同步，外觀不變）；4 張院區卡片標題 `新店／興隆／木柵／中山大豐` 由 `<span class="loc-card__name">` 改為 `<h2 class="loc-card__name">`（class 沿用，顏色／字級／字重不變，base `h1,h2,h3` 已 `margin:0`）。主內容大綱現為 h1 → h2(×4 卡片) → h2(門診總表)，無跳級。footer 的 `<h4>` 為全站共用、不在本次範圍，未動。

### 驗證
- **§九 合規**：保證／根治／唯一／第一／必須／一定要 全站 0；`最` 僅 最近（地理）＋ 最佳（攝影佔位標籤，pre-existing）；14 頁皆有頁尾法定免責聲明。**無新增違規。**
- **設計規則**：`linear/radial/conic-gradient` 0、`backdrop-filter`／`filter:blur`／`drop-shadow` 0（唯一 `filter:` 為 team 醫師照色彩正規化，pre-existing）、`transition:all` 0、`0 0` glow shadow 0。**未引入任何違規。**
- **截圖**（Chrome headless 2×，`temporary screenshots/a11y-{index,services,team,locations}.png`）：四頁版位與外觀與修正前一致；卡片標題改 heading 後樣式不變；小字對比微調幾乎不可察。

## 🗓️ 2026-06-02 (session 4) — FAQ 上線 + 設計精修收尾 + 全站 nav 連結

### FAQ 系統正式上線
- **`faq.html` 發布** — 7 篇**院長核准**衛教文章（Q1–Q7）正式上線。先前僅為 `faq.md` 草稿（未發布、無頁面、無 nav）；本次院長通過 Q2、Q4–Q7（先前 Q1/Q3 已通過），7 篇全數核准，建立 `faq.html` 衛教專欄頁面。
- **`en/faq.html`** stub 一併建立（coming-soon 樣式，中文｜EN 切換，沿用既有 `/en/` placeholder 模式）。
- **`faq.md` review workflow 維持** — 持續作為院長醫療內容審閱的工作文件：草稿 → 院長審閱／修訂／核准 → 才上線至 `faq.html`。Q8–Q17 後續沿用此流程。

### 設計精修收尾（兩個 agent 平行完成、已 commit）
- **首頁 hero 呼吸環視覺還原** — 復原 homepage hero 的 breathing-rings 視覺。
- **照片佔位框重疊修正** — 修正 `about.html` 等頁面 photo placeholder 的版位重疊問題。

### 全站 nav 連結（本次 session 收尾）
- **「衛教專欄」nav 連結全站接上 `faq.html`** — 先前各頁 header nav 的衛教專欄連結指向尚未建立的 `blog.html`；本次全數改指向已發布的 `faq.html`（10 個中文頁：index / about / services / team / locations / 4 個 location 詳細頁 / faq）。faq.html 自身的 nav 連結加 `aria-current="page"`。nav 順序維持 關於大豐／診療項目／醫療團隊／院區・門診／衛教專欄。
- **`/en/` 未加 nav 連結** — `/en/` 各頁仍為 coming-soon stub，header 僅有 brand ＋ 語言切換、**無主選單**，無對應 nav 可加「Health Education」連結；en/faq.html stub 自身已可由 en 頁面語言切換／既有連結到達。待 `/en/` 建置完整選單時再補。

### ⏭️ 下一個 session 待辦
- ~~**(a) 巫婧穎 vs 巫靚穎 名字用字確認**（blocking）~~ ✅ **已解決（2026-06-04）**：院長確認正確用字為**巫靚穎**。faq.html（3 處）＋ faq.md（3 處）的「婧」已統一為「靚」；team.html 本即為「靚」；site-spec §五 註記已更新。`brand_assets/` 原始照片檔名（巫婧穎 photo.jpeg）保留未動。
- **(b) FAQ Q8–Q17 撰寫** — 以院長語氣沿用 Q1–Q7 範本（17 題標題已備齊）。
- **(c) 照片區仍待實拍** — 院長委拍攝影師後補上 4 個剩餘 photo zone：關於頁時間軸、院區詳細頁、診療項目特色、院區總覽卡片。
- **(d) 收集剩餘醫師學經歷**（蔡彥群／廖學森／蕭仁豪／李順源／林雅芳）。
- **(e) 等院長提供中山院區 地址／電話／確認開幕日期**。
- **(f) 評估是否建置 預約掛號／聯絡 頁**。

## 🗓️ 2026-06-02 (session 3) — 設計精修：照片區 + CureClinic 風格微調

院長核准朝 **cureclinictw.com** 美學精修（沉穩、premium-but-warm、補上目前缺乏的人味）。非重新設計，僅視覺精修。

### Part 1 — 5 個照片區（共用「智慧佔位框」元件）
- 新增共用元件 **`.photo-zone`**（`assets/site.css`）：solid `--bg-2` 底、dashed `--line-strong` 邊框、單線相機圖示、內嵌「拍攝建議」標籤——看起來像設計稿註記而非破圖，且**佔位框本身就是 shot list**，院長委拍時直接照著拍。比例 modifier：`--16x9 / --4x3 / --1x1 / --4x5`，另有 `--sm` 精簡變體。所有佔位框視覺一致，只有內層標籤文字不同。
  1. **首頁 hero**（`index.html`）：**移除原「呼吸環＋卡通醫師頭像 badge＋浮動 chip」裝飾**，改為單欄 hero 文案 ＋ 下方寬幅 **16:9** 照片區。卡通頭像僅保留於 header logo。
  2. **關於頁・時間軸**（`about.html`）：4 個里程碑各加 **1:1** 方形佔位（`.tl-content` 改為 photo｜text 兩欄）。中山（2026）為「開幕後補上 / Photo pending」變體。
  3. **院區詳細頁**（4 頁）：頁首加 **4:3** 外觀照 banner（`.loc-hero`，max-height 22rem 避免過高）。中山為 pending 變體。
  4. **診療項目**（`services.html`）：4 大特色各加 **4:3** 情境照（`.svc__lead` photo｜intro 兩欄），標籤強調「設備/檢查環境、不露臉」。
  5. **院區總覽卡片**（`locations.html`）：4 張卡片各加 **4:3** 卡片照。
- **未**引入任何實際外部圖片；全部為佔位框。完整 shot list 另寫入 `site-spec.md` 新增**第十三節**（攝影師 brief）。

### Part 2 — 字體與色調微調（朝 CureClinic）
- **內文**：明確 `font-weight: 400`、`line-height: 1.8 → 1.9`（更輕、更透氣）。
- **標題減重**：`.sec-head h2`、`.page-head h1` 由 700 → 600；首頁 hero h1 **加大且減重**（clamp 上限 3.35→3.55rem、weight 700→**500**），confident scale + delicate weight。
- **雙語小標**：`.sec-head .kicker` 加義式英文前綴（`.kicker__en`，italic／`--ink-faint`）——首頁 About、關於頁 Our Story／Milestones／Our Promise。（team 無 sec-head kicker，page-head eyebrow 維持原樣；services/locations 用 page-head eyebrow 亦維持。）
- **--primary 一階去飽和**：`#16635B → #28645C`（muted grey-green，更 premium）。其餘 palette token 不動；白字對比 6.8:1，無障礙合格。before/after 對照圖：`temporary screenshots/ref-primary-before-after.png`。
- **間距**：`--s-7 3.5→4rem`、`--s-8 5→5.5rem`，略增 section 呼吸感（仍不至於空洞）。

### 驗證
- 截圖（hard refresh，Chrome headless）：`temporary screenshots/ref-home-hero.png`、`ref-home-desktop.png`、`ref-about-timeline.png`、`ref-loc-xindian.png`、`ref-services.png`、`ref-locations-hub.png`、`ref-primary-before-after.png`。所有佔位框視覺一致、僅標籤不同；字體變輕、雙語小標、間距到位。
- `linear/radial/conic-gradient` 全站 **0**；`backdrop-filter`／`filter: blur`／`drop-shadow` **0**；無 `0 0` 模糊 glow box-shadow；無殘留 `breath-rings/hero__badge/hero__chip/hero__grid/hero__visual`。
- **未動**：palette 其餘 token、元件形狀（卡片/pill/按鈕）、頁面結構/導覽/URL、團隊頁醫師照處理、header 卡通 logo、合規文字與 〔待補〕。

---

### ⏭️ 後續可選
- 院長委拍後，把各 `.photo-zone` figure 換成 `<img>`（沿用相同 aspect-ratio class，版位已預留）。詳見 `site-spec.md` 第十三節技術備註。

## 🗓️ 2026-06-02 (session 2) — 套用院長 Q1/Q3 修訂 + 以院長語氣重寫 Q2, Q4–Q7

- **Q1、Q3 套用院長親自修訂版定稿**（`faq.md`，狀態維持「已通過院長審閱（待發布）」，字數重算、最後更新改 2026-06-02）：
  - **Q1**：開頭句改寫；「不解乏」→口語「很睏」；「目前研究顯示」→「許多研究顯示」；辨識段加入具體情境「看書及看電視容易打瞌睡」；**新增結尾段落 surface 診所臨床能力**——耳鼻喉專科內視鏡評估鼻腔黏膜腫脹程度＋過敏原抽血檢測（院長的軟性、據實行銷，無療效承諾）。約 700 字。
  - **Q3**：「有部分」→「有相當比例」；機制段加「鼻咽腔部分壓縮」、「半夜自醒，做惡夢甚至有夢遊」；徵兆段加「及其專注力（甚或過動）」；「處理鼻過敏」→「慎重處理」；「至門診」→「至專科門診」。約 620 字。
- **從院長修訂中萃取的寫作偏好（新範本準則）**，並據此**重寫 Q2、Q4–Q7**：
  1. **降低過度保留**：證據紮實時「目前研究顯示」→「許多研究顯示／許多研究觀察到」；重 hedging 留給真正不確定的相關性。
  2. **據實 surface 診所臨床能力**：結尾段點名真實工具——耳鼻喉專科內視鏡、過敏原抽血檢測、安排／轉介睡眠檢測、興隆院區巫靚穎醫師兒科專科評估、中山院區 2026/10 開幕後之手術選項（未開幕僅以未來式輕述，不作招攬）。**未杜撰任何能力。**
  3. **具體症狀勝過抽象**：如「白天開車或開會容易打瞌睡」「上課恍神、寫作業坐不住」「笑起來牙齦外露」「呼吸像停了一下」。
  4. **小兒文章明確提及巫靚穎醫師／兒科共同評估**（Q4、Q5、Q6）。
  5. **概數語感**：相當比例／部分孩子／明顯增大。
  6. **口語勝過臨床術語**：寫給家長與一般病人。
- **Q2 標題對齊**：文章標題由「鼻過敏與睡眠呼吸中止有相關嗎？」改為與目錄一致的「鼻過敏與睡眠呼吸中止的相關性」。
- **§九 合規掃描通過**：6 篇（含 Q1/Q3 定稿）正文無 保證／最／根治／唯一／第一／必須／一定要；無費用、無藥品品牌、無療效承諾／百分比、無診斷；相關 vs. 因果明確。
- **狀態**：Q1、Q3＝已通過（待發布）；Q2、Q4–Q7＝草稿（待院長審閱）；Q8–Q17＝待撰寫。仍為草稿文件（未發布、無 faq.html、無 nav、配圖僅占位）。

## 🗓️ 2026-06-02 — FAQ 睡眠呼吸中止症群組草擬（Q2, Q4–Q7）

- **Q1、Q3 經院長審閱通過。** 院長確認 Q1（鼻過敏與睡眠品質）、Q3（兒童腺樣體增生與睡眠呼吸中止）的語氣、長度、結構、保留性用語（hedging）、配圖占位做法與 §九 合規處理皆可用，定為其餘 FAQ 的範本。`faq.md` 兩篇狀態由「草稿（待院長審閱）」更新為「**已通過院長審閱（待發布）**」。
- **新草擬 5 篇（睡眠呼吸中止症臨床群組），待院長審閱：**
  - **Q2** 鼻過敏與睡眠呼吸中止有相關嗎？
  - **Q4** 兒童睡眠呼吸中止症與生長曲線（小兒；提及巫靚穎醫師兒科共同評估）
  - **Q5** 兒童睡眠呼吸中止與面容變化（小兒；腺樣體面容，相關非因果）
  - **Q6** 兒童睡眠呼吸中止症與注意力不集中、過動的相關關係（小兒）
  - **Q7** 打鼾與鼻中隔彎曲的相關關係（鼻腔結構橋接）
  - 每篇 ~650–660 字，嚴格沿用 Q1/Q3 範本（開場框架 → 機制粗體小標 → 辨識徵兆 → 日常／家長可做 → 軟性導向門診 → 📷 配圖建議占位）。保留性用語一致（目前研究顯示／有相關性／因人而異／相關而非因果）。
- **§九 合規掃描通過**：5 篇正文無 保證／最／根治／唯一／第一／必須／一定要；無費用、無藥品品牌、無療效承諾、無診斷，相關 vs. 因果皆明確標示。
- **17 題主題標題全數填入 `faq.md` 表格**（院長已提供完整清單，取代原 〔待補主題〕）。Q1/Q3＝已通過；Q2/Q4–Q7＝草稿待審；Q8–Q17＝待撰寫。
- **仍為草稿文件** — 未發布、未建立 `faq.html`、未加 nav 連結；配圖僅占位（無實際外部圖片）。
- **下一批待撰寫：** Q8–Q17（軟顎舌根構造、女性荷爾蒙、止鼾牙套、胃食道逆流×睡眠／中耳炎／耳悶、成人與兒童臨床表現、肥胖、簡易打呼判讀）。

## 🗓️ 2026-05-31 (evening) — FAQ / 衛教專欄 workflow established

- **FAQ workflow established.** Created **`faq.md`** as a **draft-only** document for medical content review — it lives in the repo as 院長's working document and is **not** published (no `faq.html`, not linked from nav).
- **Q1 (鼻過敏與睡眠品質) and Q3 (兒童腺樣體增生與睡眠呼吸中止)** drafted as ~600-char samples — both **await 院長 review before any publication**. §九 compliance scan clean on article copy.
- **Workflow:** 醫療衛教 content drafts go in `faq.md` → 院長 review / edit / approval → only then move to a published `faq.html` page that gets linked from site nav. Medical content is never published unreviewed.
- Committed `cf1bc55` ("Draft FAQ structure + Q1 & Q3 samples for院長 review").

## 🗓️ 2026-05-31 (session 6) — Doctor credentials + stricter glow/gradient sweep

- **巫靚穎 credentials added** (team.html card + site-spec.md, **appended** not replacing): 學歷 台北醫學大學醫學系；經歷 雙和醫院兒科總醫師、北醫附醫住院醫師；認證/學會 中華民國兒科專科醫師＋肥胖醫學會・肥胖研究醫學會・美容醫學醫學會（3 學會壓成一行以維持克制）. **✅ 小兒專科身分確認**：巫靚穎＝中華民國兒科專科醫師＝site 所稱「1 位小兒專科醫師」；§五 TODO 的「待確認」已移除並改為已確認。
- **林諄儒 credentials added** (team.html card + site-spec.md, appended): 北醫附醫耳鼻喉科總醫師、主治醫師；**香港中文大學・新加坡樟宜綜合醫院 國際手術進修**（差異化，卡片上以兩行明顯呈現）；台灣耳鼻喉頭頸外科專科醫師. 卡片移除未經證實的「胸腔內科」敘述（site-spec 原欄位保留未刪，並加 ⚠️ 待院長確認註記）.
- **⚠️ 林諄儒 vs 林雅芳 — flagged, NOT auto-merged**: 本任務假設兩者為同一人（木柵醫師），但現有 roster 是**兩位不同醫師**（林諄儒＝新店第3位、林雅芳＝木柵第5位 2019 創辦）. 未做任何合併/搬移/取代，以免誤刪真實醫師；已在 site-spec §五 加顯著 TODO 請院長確認 (a) 兩人皆實際存在？或 (b) 其一為誤植。**醫師總數 7（6 耳鼻喉＋1 小兒）暫定**，若兩人實為一人則應改為 6。
- **Doctor counts verified consistent**: team hero「六位耳鼻喉科專科醫師與一位小兒專科醫師」✓、所有頁尾「6＋1」✓、首頁 hero lead「6＋1」✓. 首頁 stat bubble「7 位專科醫師」與 title「七位醫師」皆為總數 7，準確（7 位皆為專科醫師，未宣稱全為耳鼻喉），保留未改。
- **Stricter glow sweep (Task 3)**: 首頁 `.hero__badge`（圓形 logo 盤）由 `--shadow-lg`＋inset 白環 → `--shadow-sm`（大柔影在圓形上會像光暈）；`.hero__chip` 浮動小卡由 `--shadow-md` → `--shadow-sm`. 移除唯一的 inset 環。其餘 box-shadow 全為接地 `--shadow-*` token（向下偏移、alpha ≤ 0.12，無 0-0 模糊、無外擴 spread）. 螢幕截圖確認 logo 盤光暈消失。
- **Gradient sweep (Task 4)**: 已是 ZERO（session 4 清乾淨）；本次再次確認 `linear/radial/conic-gradient` 全站 0 筆。`backdrop-filter`、`filter: blur/drop-shadow` 皆 0；唯一 `filter:` 為醫師照片色彩正規化（允許）。
- **Facebook cover banner — redesigned + split into 3 A/B/C variants** (supersedes the session-5 single banner below). Logo removed from the banner (the FB profile picture already shows the 大豐 mark, so a second mark was redundant); right cream panel now carries **大豐耳鼻喉科聯合診所 + 新店・木柵・興隆・中山 + LINE 線上預約看診** (identical across all 3). Canvas **1640×624**, solid colors only, no gradients/glows, rendered crisp via Chrome headless with Noto loaded. The 3 variants differ only in left-panel layout, for 院長 to choose:
  - **A** (`facebook-cover-A.svg` / `-preview-A.png`) — eyebrow + 4 specialty icons **and** tagline both shifted right (everything clears the bottom-left profile-picture zone; left side feels emptier).
  - **B** (`facebook-cover-B.svg` / `-preview-B.png`) — icons **centered** (original spot); only the tagline shifted up/right to clear the profile-picture safe zone.
  - **C** (`facebook-cover-C.svg` / `-preview-C.png`) — icons centered **and** tagline back in its original lower-**left** position, **no** safe-zone adjustment (most balanced in isolation, but the FB profile picture will overlap the start of the tagline).
  - Committed `75cd840` (`A/B` in `8f64739`). The old single `facebook-cover.svg` / `-preview.png` were removed in the A/B split. Next session: pick one, delete the other two, rename the winner back to `facebook-cover.svg` / `-preview.png`.

## 🗓️ 2026-05-31 (session 5) — Facebook cover banner (marketing asset, ⚠️ superseded by session 6 A/B/C redesign above)

- **`brand_assets/facebook-cover.svg`** — 820×312 FB cover, self-contained SVG. Two-panel composition in Dafeng's design language: LEFT teal (`--primary`) panel with 4 line-icon specialties (一般耳鼻喉／睡眠呼吸中止／眩暈／頭頸部, reusing the site's icon paths) + the slogan "新店・文山在地深耕 / 三院區守護全家人的呼吸與睡眠"; a crisp terracotta seam; RIGHT cream panel with the **logo embedded inline as base64** (512px, from the 1200px `assets/logo.png`) + 大豐耳鼻喉科聯合診所 / DAFENG ENT CLINIC / 四院區 wordmark. Fully vector except the logo (11 `<text>`, 17 shapes, 1 raster). Solid blocks only — no gradients, no glows (verified). Fonts via Noto `@import` + CJK fallback stack (true CJK font-binary embedding is multi-MB, impractical).
- **`brand_assets/facebook-cover-preview.png`** — **1640×624** PNG export (2× of the 820×312 display = Facebook's recommended upload size; rendered via Chrome headless at `--force-device-scale-factor=2` with Noto loaded). Crisp text/icon edges, sharp logo — ready to upload to Facebook.
- **Mobile-safe:** left content inset to ~x88 and right content centered at x640 so the slogan, all icons, logo, and wordmark survive Facebook's ~90px mobile side-crop (verified by simulating the center-640 crop).
- ⚠️ This is an **SVG composition, not photographic**. If 院長 wants a photo-based banner (real doctors/clinic, like the Caringlink reference), this won't deliver that — recommend Canva or a freelance designer.

## 🗓️ 2026-05-31 (session 4) — Glow removal + symmetric hero spacing

- **Removed the eyebrow-pill glow site-wide.** The `.eyebrow` pills (interior `.page-head .eyebrow` in `site.css` + homepage `.eyebrow` in `index.html`) carried `box-shadow: var(--shadow-sm)`, whose teal-tinted blur wrapped the small rounded pill as a soft halo. Dropped the shadow; the 1px `--primary-soft` border now gives crisp definition.
- **Removed `backdrop-filter: blur` from the sticky header** (`.site-header`). Header is now solid opaque `--bg` (no frosted-glass/aura); `.scrolled` just adds the bottom border. Verified: zero `backdrop-filter`, zero `filter: blur` / `drop-shadow` anywhere. (The only `filter:` left is the color-only saturate/brightness/contrast on doctor photos — allowed.)
- **All remaining `box-shadow`s confirmed grounded** — every one uses `--shadow-sm/md/lg` (or `none` / the inset white hairline on the hero avatar). No glow-blur values.
- **Symmetric vertical breathing on the Services 中山 teaser.** The mint `.svc-soon` box sat flush against the `.svc-cta` band below; added `.svc-soon-sec { padding-bottom: var(--s-7) }` so it floats with equal cream space above (from `.svc-list` padding-bottom) and below. Audited Team / About / Locations / Home heroes — all already balanced via section padding.
- **CLAUDE.md:** tightened the glow rule to **"No glows, halos, auras, or blurred light effects" (zero tolerance**, incl. backdrop-filter/filter blur), and added **"Symmetric vertical breathing on hero/intro blocks."**
- **Verified** with hard-refresh screenshots (`temporary screenshots/f-*`): team eyebrow close-up (crisp, no halo), services teaser (symmetric), home/locations/about heroes (crisp pills, solid header, balanced spacing).

## 🗓️ 2026-05-31 (session 3) — Two global cleanups

- **Removed ALL "創辦" badges site-wide.** Dropped the founder/cohort pills (新店共同創辦・2010, 木柵創辦・2019, 興隆創辦・2025) from every `team.html` doctor card and deleted the `.doc__badge` / `.doc__badge--founder` CSS. The founding-院長 story now lives only as prose in the About timeline + site-spec.md — no badge chrome restating it. Verified: zero `doc__badge` / `創辦`-pill matches.
- **Removed ALL gradients site-wide** (now a hard rule). Replaced every linear/radial gradient with a solid token: page-head & hero washes (`site.css`, `index.html`) → flat cream; eyebrow pills → `--surface`; hero avatar disc → `--surface`; section bands (features / timeline / sched-band / svc-cta) → `--bg-2`; teaser/banner panels (svc-soon, soon-banner, loc-card--soon) → `--primary-soft` / `--bg-2`; map placeholder stripes → `--bg-2`. Verified: **zero** `linear-gradient` / `radial-gradient` across all `.html` + `.css`. (Body bg was already a single solid color; SVG grain texture is not a gradient, kept.)
- **CLAUDE.md:** added hard **"No gradients."** rule (supersedes the old "no gradient *accents*"); depth now comes from layered shadows, spacing, typography, and solid tonal blocks only.
- **Verified** with hard-refresh screenshots (`temporary screenshots/v-*`): home, team, services (incl. 中山 teaser), locations, about — every block is a clean solid fill.

## 🗓️ 2026-05-31 (session 2) — Team page + restraint principle

- **醫療團隊 `team.html` built** — 7 doctors from the **updated site-spec §五 roster**, grouped by 院區 with each location's 院長 leading: 新店（蔡彥群院長・2010共創 → 廖學森・2010共創 → 林諄儒）→ 木柵（蕭仁豪院長・2019 → 林雅芳・2019）→ 興隆（李順源院長・2025 → 巫靚穎 小兒專科・2025）. CureClinic-inspired card IA (portrait → name+role → trimmed 4–5 credential bullets), adapted entirely to Dafeng's own design system (palette, serif headings, tinted shadows, lift-only hover). **創辦院長 (2010)** surfaced as an accent badge on 蔡彥群 & 廖學森, visible at first glance.
- **Real doctor portraits in `assets/doctors/`** (resized from `brand_assets/`, originals untouched): **廖學森** `liao-hsueh-sen.jpg`, **蕭仁豪** `hsiao-jen-hao.jpg`, **巫靚穎** `wu-ching-ying.jpg`, **林諄儒** `lin-chun-ju.jpg`. Uniform rounded-square container (4:5, object-fit cover, faint warm overlay) so real photos + placeholders read as one coherent set.
  - ⚠️ **Filename character mismatches** flagged for 院長 in site-spec §五: photo files were named `廖學生`(→學森) and `巫婧穎`(→靚穎) — confirm correct characters.
  - **Still using shared placeholder cards** (family-name char on primary-soft, `<!-- TODO -->`): **蔡彥群, 林雅芳, 李順源** — awaiting their photos.
  - **小兒專科 identity resolved**: 巫靚穎 = the "1 位小兒專科醫師" referenced site-wide. (Task prompt's roster was pre-update; site-spec §五 7-doctor roster is the truth and added 林諄儒.)
- **EN stub** `en/team.html` added (coming-soon pattern, 中文｜EN toggle), matching existing `/en/` placeholders.
- **"Restraint over density" added to CLAUDE.md** design rules (inspired by cureclinictw.com, which 院長 prefers; Caringlink/HomePro felt overpowering). One focal idea per section, short paragraphs, whitespace as a feature, prefer 3–6 considered items over grids-of-many.
- **Design review saved to `docs/design-review.md`** — specific, actionable proposals (not applied yet) for Services / Locations / About against the new principle, with per-item impact ratings + a priority table. Awaiting 院長 review before applying.
- **Verified**: compliance scan clean (no 保證/最/根治/唯一/第一); desktop/tablet/mobile screenshots in `temporary screenshots/team-*`; per-row card heights uniform; founder badges legible. Specialties all marked 「待醫師確認」, §十一 schedule still blank.
- **Still awaiting from 院長**: photos for 蔡彥群/林雅芳/李順源; confirmed specialties + clinic schedules; the two filename-character confirmations.

## 🗓️ 2026-05-31 — today's work

- **Slogan reordered → 新店・文山 first** (`新店・文山在地深耕…`). 新店 now leads because it is the founding location (2010); 文山 came with 木柵 (2019) + 興隆 (2025). Applied to `index.html` hero, `about.html` (title / meta description / hero lead), and the canonical slogan in `site-spec.md` §二-B.
- **QR images cropped clean** — all 5 `assets/qr/*` cropped to a tight square + ~5% quiet-zone padding, removing the baked-in clinic-name text band beneath the QR (e.g. "興隆大豐耳鼻喉科診所", "大豐耳鼻喉科診所(新店)"). Filenames unchanged; HTML labels above/below the QR are untouched. Verified on the 興隆 detail page. _Originals preserved in git at commit `1024099` (`git show 1024099:assets/qr/<file>`)._
- **Inter-section spacing tightened one step, globally** — `--s-7` 4.5→3.5rem and `--s-8` 6.5→5rem in `assets/site.css`. Calmer hero→section gap on every page (About hero→發展歷程 was the worst offender); still breathable for Chinese typography. Re-screenshotted home / About / Services / Locations to confirm.
- **About page** (`about.html`) is built — hero + founding-history **timeline 2010→2019→2025→2026** + 廖學森 credibility callout. (Pending 院長 review of the founding narrative.)
- **Bilingual scaffolding live** — `中文 | EN` toggle in the header of every CN page; `/en/` is a placeholder (coming-soon + LINE QRs) until CN content is approved.
- **Live + approved** — GitHub Pages is live at **https://lalex07.github.io/Clinic/** and 院長 (Alex's dad) has **approved the design direction**.

**Content/data added to `site-spec.md`:**
- New doctors on the roster: **林雅芳** (木柵, joined 2019) and **巫靚穎** (興隆, joined 2025).
- **廖學森醫師**'s **萬芳醫學中心** affiliation and **兒童睡眠呼吸中止症手術經驗** now documented — use as the clinic's **institutional differentiator** (already surfaced in the About credibility callout; carry into the Team page).

> ⚠️ One API crash mid-session may have left partial state. Today's three fixes were committed (`e009bcc`) and verified after the crash, but **next session should re-confirm** slogan, QR crops, and spacing all rendered correctly before moving on.

---

## ⏭️ NEXT SESSION (start here)

1. **FAQ — review 院長's feedback on the Q2, Q4–Q7 batch** (`faq.md`) — apply edits, then **draft Q8–Q17** (all 17 titles now supplied). _(Q1/Q3 approved 2026-06-02; Q2/Q4–Q7 drafted and awaiting review.)_
1. ~~**Resolve the 林諄儒 vs 林雅芳 name question**~~ ✅ **Resolved 2026-06-04** — 院長 confirmed they are **two different, real doctors** (林諄儒 = 新店 #3; 林雅芳 = 木柵 #5, 2019 founder). Doctor total stays **7**; no roster change. (林雅芳's full credentials are still 〔待補〕 — see credential list below.)
2. **Pick the Facebook banner variant (A/B/C) + clean up.** Once 院長 chooses, delete the two unused variants and rename the winner back to `brand_assets/facebook-cover.svg` / `-preview.png`.
3. **Build 預約掛號 / 聯絡 page** (§八) — booking + contact (電話 / LINE / 線上掛號 CTAs). This is the last major remaining content page.
4. **Optionally build 衛教專欄 / Blog** (§七) if 院長 wants it — SEO article topics listed in spec, no bodies yet.
5. **Collect remaining doctor credentials** for **蔡彥群, 廖學森, 蕭仁豪, 李順源, 林雅芳** (林雅芳 only if confirmed as a separate doctor). Cards/spec entries for these are still 〔待補〕 or draft.
6. **Wait on 院長 for 中山院區** — address + phone + confirmed opening date (still presented as "2026 年 10 月開幕・敬請期待").
7. ~~Build 醫療團隊 / Team~~ ✅ **Done** (session 2). Also consider applying approved items from `docs/design-review.md` (review with 院長 first).

**Live site:** GitHub Pages live → **https://lalex07.github.io/Clinic/** (deploys from the default branch, no build step). 院長 (Alex's dad) has **approved the design direction** (palette, tone, layout) — build the rest on this foundation.

---

## ❓ Open questions for 院長 (blocking real content)

These are the `〔待補〕` items that need his input before pages can be finalised:

- **院長 review needed on the Q2, Q4–Q7 FAQ drafts** (`faq.md`) — tone, factual accuracy, length, and §九 compliance. Nothing publishes until reviewed. _(Q1/Q3 already approved 2026-06-02; format validated. All 17 topic titles now supplied; Q8–Q17 still to be drafted.)_
- **FAQ image strategy decision** — SVG illustrations vs licensed stock photos vs anatomical diagrams vs no images. (No stock photos used yet; each draft carries a `📷 配圖建議` placeholder only.)
- ✅ **林諄儒 vs 林雅芳 — RESOLVED 2026-06-04.** 院長 confirmed these are **two real, different doctors**: **林諄儒** (新店總院 #3, full credentials provided — 中國醫藥大學, 北醫附醫總醫師/主治, 香港中文大學 + 新加坡樟宜綜合醫院 國際手術進修) and **林雅芳** (木柵分院 #5, 2019 共同創辦, credentials still 〔待補〕). Not a transcription error, nothing merged. Doctor total stays **7 (6 ENT + 1 pediatric)**.
- **Facebook banner — which variant (A/B/C), or commission a designer?** Three SVG variants are in `brand_assets/` for comparison: **A** = icons + tagline both shifted right; **B** = icons original/centered + tagline shifted for the profile-picture safe zone; **C** = fully original layout, no safe-zone adjustment (profile pic overlaps tagline). All are SVG compositions, not photographic. Confirm which variant to ship, **or** whether 院長 would rather commission a polished/photo-based banner from a designer/Canva. Once chosen, delete the other two and rename the winner back to `facebook-cover.svg` / `-preview.png`.
- **Slogan refinement** — confirm/adjust the hero slogan (currently §二 slogan B).
- **Remaining doctor credentials still 〔待補〕** — **蔡彥群, 廖學森, 蕭仁豪, 李順源, 林雅芳** (林雅芳 only if confirmed as a separate doctor). 巫靚穎 + 林諄儒 are now done. Also still need every doctor's confirmed **specialties + clinic schedules** (§五 bios "待確認"; 醫師 × 院區 × 時段 table §十一 is blank).
- **中山院區** — **address, phone, and confirmed opening date** (currently all `待補`; presented as "2026 年 10 月開幕・敬請期待").
- **Equipment list for Services** — confirm actual 儀器/設備 (the §三/§四 `（請依實際設備/服務調整）` flags).
- Also outstanding: per-location 門診時間, 交通/地圖, LINE booking deep-links; 看診醫師 per院區.

---

## ✅ Done so far

### Architecture — shared stylesheet
- **`assets/site.css`** — design tokens, reset, grain overlay, header/nav, **`.lang-toggle`**, buttons, `.sec-head`, `.page-head` (interior banner) + breadcrumb, footer, `.reveal`, `.skip-link`, editorial flags (`.review-note`, `.tbd`), responsive (incl. mobile header fit).
- **`assets/site.js`** — sticky-header border, mobile nav toggle, IntersectionObserver reveal (no-JS / reduced-motion fallback).
- **`assets/locations.css`** — components for the location hub + detail pages.
- **When building new pages:** link `assets/site.css` + `assets/site.js`, copy the header (with the `中文 | EN` toggle) + footer verbatim, set `aria-current="page"` on the active nav item, add page-specific CSS inline (or a new `assets/<page>.css`). Nav order: 關於大豐 / 診療項目 / 醫療團隊 / 院區・門診 / 衛教專欄; CTA → `contact.html`.

### Design rules (now codified in `CLAUDE.md` → "Design rules")
Applied site-wide:
- **No glows / halos / glare** — dots/pills/badges are flat solid shapes (stripped the eyebrow-dot halos).
- **No multi-color gradient accents** — killed the teal→terracotta hover bars on cards and the terracotta blob in hero/page-head backgrounds (now single-hue teal+cream washes for depth only).
- **Hover = lift, not color** — cards translate up + deepen shadow; `transform`/`box-shadow` only, never `transition: all`.
- **Shadows** use the `--shadow-sm/md/lg` tinted tokens (depth, not light emission).

### Pages built
- **Homepage `index.html`** — hero, 3 quick-entry cards, 5 feature highlights, footer. Refactored onto `site.css`.
- **Locations** — `locations.html` hub (4-card 院區切換 + 門診總表 call-out) + `location-xindian/-xinglong/-muzha.html` (full detail: 門診時間 table `待補`, 交通/地圖 placeholders, contact sidebar, **real LINE QR cards** from `assets/qr/`, schema.org `MedicalClinic`). `location-zhongshan.html` = coming-soon (future tense, no QR, no surgery 招攬).
  - QR pairing: 新店 & 木柵 → general + shared `xindian-muzha-surgery-line.png`; 興隆 → general + `xinglong-surgery-line.png`.
- **Services `services.html`** (§四) — 4 blocks (一般耳鼻喉 / 睡眠呼吸中止症 / 眩暈 / 頭頸部腫瘤, last 3 tagged 特色門診) with symptom pills, approach text, warning-sign callouts, 醫師/院區 cross-links; + 中山手術中心 teaser (future tense, info-only CTA). Compliance-clean (no `最` at all).
- **About `about.html`** (§零/§三) — hero, founding story (uses §三 ethos), **timeline 2010→2019→2025→2026** (centerpiece; 2026 in accent, "預計 10 月開幕"), 廖學森 萬芳醫學中心 + 兒童睡眠手術 credibility callout, community/values section, CTA. **Built; pending dad review.**

### Bilingual scaffolding
- **`中文 | EN` header toggle** on every CN page (no flags; active = primary, inactive = ink-faint). CN → `/en/…`, EN → back to root.
- **`/en/`** = placeholders only: `en/index.html` (coming-soon + LINE QR codes) and `en/about.html` (coming-soon stub). Full EN pages deferred until CN content is approved. Per `CLAUDE.md`: EN mirrors CN structure under `/en/`; §九 compliance applies to both (translate the banned-word list).

### Logo / avatar
- `assets/logo.png` + `favicon.png` regenerated from `brand_assets/logo.pdf`: full circular doctor mark, **centered with even padding**, and a **clean white-disc edge (no dark ring/hairline)**. `.brand__mark` uses `object-fit: contain` + `object-position: center`, **no border**.

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
