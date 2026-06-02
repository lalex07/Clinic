# 進度筆記 / Progress — 大豐耳鼻喉科 website

Orientation note for the next session. See `site-spec.md` for the full content brief (source of truth) and `CLAUDE.md` for the rules (design rules + compliance live there).

_Last updated: 2026-06-02 (session 4)_

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
- **(a) 巫婧穎 vs 巫靚穎 名字用字確認**（blocking）— **FAQ 用「婧」、team.html 用「靚」**，兩處不一致，需院長確認正確用字後統一全站（含 team.html、site-spec §五、照片檔名）。
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
- **Design review saved to `design-review.md`** — specific, actionable proposals (not applied yet) for Services / Locations / About against the new principle, with per-item impact ratings + a priority table. Awaiting 院長 review before applying.
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
1. **Resolve the 林諄儒 vs 林雅芳 name question** (blocking — see Open questions). The roster currently treats them as **two distinct doctors** (林諄儒 = 新店, full credentials provided; 林雅芳 = 木柵, 2019 founder, still 〔待補〕). Confirm with 院長 whether both are real, or one is a transcription error, then adjust the roster + doctor total (7 → 6 if they're one person).
2. **Pick the Facebook banner variant (A/B/C) + clean up.** Once 院長 chooses, delete the two unused variants and rename the winner back to `brand_assets/facebook-cover.svg` / `-preview.png`.
3. **Build 預約掛號 / 聯絡 page** (§八) — booking + contact (電話 / LINE / 線上掛號 CTAs). This is the last major remaining content page.
4. **Optionally build 衛教專欄 / Blog** (§七) if 院長 wants it — SEO article topics listed in spec, no bodies yet.
5. **Collect remaining doctor credentials** for **蔡彥群, 廖學森, 蕭仁豪, 李順源, 林雅芳** (林雅芳 only if confirmed as a separate doctor). Cards/spec entries for these are still 〔待補〕 or draft.
6. **Wait on 院長 for 中山院區** — address + phone + confirmed opening date (still presented as "2026 年 10 月開幕・敬請期待").
7. ~~Build 醫療團隊 / Team~~ ✅ **Done** (session 2). Also consider applying approved items from `design-review.md` (review with 院長 first).

**Live site:** GitHub Pages live → **https://lalex07.github.io/Clinic/** (deploys from the default branch, no build step). 院長 (Alex's dad) has **approved the design direction** (palette, tone, layout) — build the rest on this foundation.

---

## ❓ Open questions for 院長 (blocking real content)

These are the `〔待補〕` items that need his input before pages can be finalised:

- **院長 review needed on the Q2, Q4–Q7 FAQ drafts** (`faq.md`) — tone, factual accuracy, length, and §九 compliance. Nothing publishes until reviewed. _(Q1/Q3 already approved 2026-06-02; format validated. All 17 topic titles now supplied; Q8–Q17 still to be drafted.)_
- **FAQ image strategy decision** — SVG illustrations vs licensed stock photos vs anatomical diagrams vs no images. (No stock photos used yet; each draft carries a `📷 配圖建議` placeholder only.)
- **⚠️ 林諄儒 vs 林雅芳 — name verification needed.** The codebase currently has **two distinct doctor entries**: **林諄儒** (新店總院, with the full credentials 院長 sent — 中國醫藥大學, 北醫附醫總醫師/主治, 香港中文大學 + 新加坡樟宜綜合醫院 國際手術進修) and **林雅芳** (木柵分院, 2019 共同創辦, still 〔待補〕). Need 院長 to confirm whether these are **two real, different doctors**, or whether **one of the names is a transcription error**. Nothing was auto-merged. If they turn out to be the same person, the doctor total should change from 7 → 6.
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
