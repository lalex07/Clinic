/* 大豐耳鼻喉科 — shared behaviour for every page */
(function () {
  // Root-relative path helper for site-wide INJECTED links/assets.
  // This file is loaded as "assets/site.js" from the repo-root pages and as
  // "../assets/site.js" from /en/*, so anything injected here must resolve its
  // href/src against the site root rather than hard-coding a relative path.
  // (Hard-coded relative paths 404 on /en/* — see the .nhi-mark note below.)
  var selfScript = document.currentScript || document.querySelector('script[src$="assets/site.js"]');
  var ROOT_PREFIX = (function () {
    try {
      var m = /^(.*?)assets\/site\.js/.exec((selfScript && selfScript.getAttribute('src')) || '');
      return m ? m[1] : '';
    } catch (e) { return ''; }
  })();
  function sitePath(p) { return ROOT_PREFIX + p; }

  // sticky header border on scroll
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // mobile nav toggle
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    // Surface the 立即預約 booking CTA inside the mobile menu — the header .nav__cta
    // is display:none at <=1129px (NAV_COLLAPSE_MQ below / assets/site.css collapsed-nav
    // media query), so on phones and small laptops there was no way to book. Clone it as a
    // prominent full-width action at the bottom of the menu; its contact.html href is
    // intercepted by the booking-modal handler below, so it opens the modal on mobile too.
    var headerCta = document.querySelector('.nav__cta');
    if (headerCta && !links.querySelector('.nav__menu-cta')) {
      var menuCta = document.createElement('a');
      menuCta.className = 'nav__menu-cta';
      menuCta.href = headerCta.getAttribute('href') || sitePath('contact.html');
      menuCta.innerHTML = headerCta.innerHTML; // calendar icon + 立即預約 label
      links.appendChild(menuCta);
    }
    /* ---- 收合選單的鍵盤可用性（disclosure pattern，全部在 JS 處理）----
       #navLinks 在每一頁的 DOM 順序都排在 .nav__toggle 之前，所以從漢堡鈕按 Tab 會
       「跳過」選單裡的 7 個項目直接落到內文，只有 Shift+Tab 才回得去。header 標記共用
       於 31 個頁面（team/news/faq/faq-q* 由產生器產出），實體調整 DOM 順序會造成無謂的
       產生器變動，因此改由這裡管理焦點：
         · 開啟 → 焦點移到第一個項目
         · 開啟期間 Tab／Shift+Tab 只在「漢堡鈕 + 選單項目」之間循環
         · Esc（或再次點擊漢堡鈕）→ 關閉並把焦點交回漢堡鈕
       NAV_COLLAPSE_MQ 必須與 assets/site.css 收合導覽的 media query 保持一致。 */
    var NAV_COLLAPSE_MQ = '(max-width: 1129px)';

    // 選單內可聚焦的項目：6 個導覽連結 + 注入的 .nav__menu-cta（收合時 display:none →
    // offsetParent 為 null，自動被濾掉）
    var menuItems = function () {
      return Array.prototype.slice.call(links.querySelectorAll('a[href]')).filter(function (el) {
        return el.offsetParent !== null;
      });
    };
    var menuIsOpen = function () { return links.classList.contains('open'); };
    // class 與 aria 一律一起更新，兩者永不脫鉤
    var setMenuState = function (open) {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    };
    var openMenu = function () {
      setMenuState(true);
      var items = menuItems();
      if (items.length) items[0].focus();
    };
    var closeMenu = function (returnFocus) {
      if (!menuIsOpen()) return;
      setMenuState(false);
      if (returnFocus && toggle.focus) toggle.focus();
    };

    toggle.addEventListener('click', function () {
      if (menuIsOpen()) closeMenu(true); else openMenu();
    });

    // 漢堡鈕上的鍵盤操作：開啟時 Tab → 第一個項目、Shift+Tab → 最後一個項目、Esc → 關閉
    toggle.addEventListener('keydown', function (e) {
      if (!menuIsOpen()) return;
      if (e.key === 'Escape') { closeMenu(true); e.preventDefault(); return; }
      if (e.key !== 'Tab') return;
      var items = menuItems();
      if (!items.length) return;
      e.preventDefault();
      (e.shiftKey ? items[items.length - 1] : items[0]).focus();
    });

    // 選單內的鍵盤操作：頭尾接回漢堡鈕形成封閉循環；Esc 關閉並交回焦點
    links.addEventListener('keydown', function (e) {
      if (!menuIsOpen()) return;
      if (e.key === 'Escape') { closeMenu(true); e.preventDefault(); return; }
      if (e.key !== 'Tab') return;
      var items = menuItems();
      if (!items.length) return;
      var atFirst = document.activeElement === items[0];
      var atLast = document.activeElement === items[items.length - 1];
      if ((e.shiftKey && atFirst) || (!e.shiftKey && atLast)) { toggle.focus(); e.preventDefault(); }
    });

    // 點選單內的連結後關閉（焦點交給即將載入的頁面，不搶回漢堡鈕）
    links.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a[href]')) closeMenu(false);
    });

    // 跨越收合斷點時重置狀態：先前在手機寬度開啟選單、放大到桌機、再縮回手機，
    // 殘留的 .open／aria-expanded="true" 會讓選單自己「重新打開」。
    try {
      var navMq = window.matchMedia(NAV_COLLAPSE_MQ);
      var onNavMq = function () { setMenuState(false); };
      if (navMq.addEventListener) navMq.addEventListener('change', onNavMq);
      else if (navMq.addListener) navMq.addListener(onNavMq);
    } catch (e) { /* 靜默：matchMedia 不可用時不影響其他行為 */ }
  }

  // back-to-top button — built here so it appears on every page (incl. the
  // standalone faq-qN.html article pages) with no per-page markup.
  var toTop = document.createElement('button');
  toTop.className = 'back-to-top';
  toTop.type = 'button';
  toTop.setAttribute('aria-label', '回到頂端');
  toTop.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(toTop);

  var toggleToTop = function () {
    toTop.classList.toggle('is-visible', window.scrollY > 400);
  };
  toggleToTop();
  window.addEventListener('scroll', toggleToTop, { passive: true });

  toTop.addEventListener('click', function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  // scroll reveal (skips items already marked .in, e.g. above-the-fold hero)
  var revealEls = document.querySelectorAll('.reveal:not(.in)');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // 全民健康保險 (NHI) 特約 trust mark — injected site-wide so it appears in the
  // footer of every page with no per-page HTML edits. The clinic is NHI-contracted
  // (健保特約, confirmed). Placed as just the official emblem right beside the
  // clinic's footer logo (HomePro/Caringlink-style), no visible 健保特約 text.
  // The emblem is a meaningful trust signal, so its alt carries the meaning and
  // it is NOT aria-hidden. Served copy lives in assets/ (source in brand_assets/).
  var footerLogo = document.querySelector('.site-footer .footer__brand .footer__logo');
  if (footerLogo && footerLogo.parentNode && !footerLogo.parentNode.querySelector('.nhi-mark')) {
    var nhiMark = document.createElement('img');
    nhiMark.className = 'nhi-mark';
    nhiMark.src = sitePath('assets/nhi-logo.png');
    nhiMark.alt = '全民健康保險特約院所';
    nhiMark.width = 52;
    nhiMark.height = 52;
    nhiMark.loading = 'lazy';
    nhiMark.decoding = 'async';
    // wrap the clinic logo + NHI emblem in a row so they sit side by side
    var markRow = document.createElement('div');
    markRow.className = 'footer__marks';
    footerLogo.parentNode.insertBefore(markRow, footerLogo);
    markRow.appendChild(footerLogo);
    markRow.appendChild(nhiMark);
  }

  // 隱私權政策 footer link — injected site-wide (same pattern as the NHI emblem)
  // so it appears in the footer menu of every page, including /en/*, without 36
  // per-page edits and with no way for the pages to desync. /en/* has no English
  // policy page yet, so it links to the Chinese privacy.html via sitePath().
  var footerNav = document.querySelector('.site-footer .footer__base nav');
  if (footerNav && !footerNav.querySelector('.footer__privacy')) {
    var privacyLink = document.createElement('a');
    privacyLink.className = 'footer__privacy';
    privacyLink.href = sitePath('privacy.html');
    privacyLink.textContent = '隱私權政策';
    // the label is Traditional Chinese even inside the /en/* documents
    // (<html lang="en">) — annotate it so screen readers switch voice (SC 3.1.2)
    privacyLink.lang = 'zh-Hant';
    // /en/* labels this nav "Language" (it held only the 中文 link); once the
    // policy link joins it, that label no longer describes the group.
    if (footerNav.getAttribute('aria-label') === 'Language') footerNav.setAttribute('aria-label', 'Footer');
    footerNav.appendChild(privacyLink);
  }

  // Cloudflare Web Analytics — privacy-friendly, cookieless. No cookies, no
  // other trackers. SITE OWNER: replace __CF_BEACON_TOKEN__ below with your
  // real token from the Cloudflare dashboard (Web Analytics → your site →
  // "Add a site" snippet). Until then the beacon loads but reports nothing.
  var cfBeacon = document.createElement('script');
  cfBeacon.defer = true;
  cfBeacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  cfBeacon.setAttribute('data-cf-beacon', '{"token":"__CF_BEACON_TOKEN__"}');
  document.body.appendChild(cfBeacon);

  /* ===== 第一方・無 Cookie 的互動統計（Phase A：僅收集，尚無後台報表）=====
     隱私優先（醫療網站的硬性要求）：不使用 cookie、不寫 localStorage、不收集 IP、
     User-Agent、姓名或任何可識別病人的資料；不送 query string 與 hash（path 只取
     location.pathname）；referrer 只取「主機名」，絕不外送完整來源網址。
     session_id 是每次造訪隨機產生、僅存在 sessionStorage 的 UUID（關閉分頁即消失
     → 無跨造訪／跨裝置追蹤）。
     寫入 Supabase 的 events 表，只用可公開的 anon key；RLS 只允許 INSERT（無法讀
     取／修改／刪除）。整段 fire-and-forget 且靜默失敗——被擋、離線、CSP 拒絕、或
     伺服器回錯，都不會 throw 進頁面、不 log 可見錯誤、不影響任何 render。
     另有 isLocalHost() 守門：本機開發（localhost／127.0.0.1／::1／0.0.0.0／*.local／
     file://）一律略過，避免測試流量污染正式資料。
     本站的資料蒐集說明公開於 privacy.html〈隱私權政策〉，兩者內容需保持一致。 */
  var track = function () {}; // 預設 no-op：呼叫端在任何情況下都不會出錯
  try {
    var AN_ENDPOINT = 'https://ysnrrkpusgdgzwkywddu.supabase.co/rest/v1/events';
    // 瀏覽器可公開的 anon key（與 admin/config.js 相同的值）；RLS 才是安全閘門。
    // 絕不可放 service-role key。
    var AN_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbnJya3B1c2dkZ3p3a3l3ZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Mjk5MTIsImV4cCI6MjA5NjMwNTkxMn0.pZbXVHYOa9yc4kOjwN2DtSkWIUV7SFDfPHrysjcPQ58';
    var AN_SID_KEY = 'df_sid';
    var anMemoSid = null;

    // 本機開發不得寫入正式資料表：在 localhost／區域網路測試時整段統計靜默略過，
    // 讓 events 表只留下真實訪客的資料。判斷不出來時一律視為「本機」而不送出（保守）。
    var AN_LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'];
    function isLocalHost() {
      try {
        if (location.protocol === 'file:') return true; // 直接開檔（file://）
        var h = (location.hostname || '').toLowerCase();
        if (!h) return true; // 沒有 host 的 origin（about:／blob: 等）
        if (AN_LOCAL_HOSTNAMES.indexOf(h) !== -1) return true;
        return /\.local$/.test(h); // Bonjour／區域網路主機名，如 macbook.local
      } catch (e) { return true; }
    }

    function anUuid() {
      try {
        if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
      } catch (e) { /* 靜默降級 */ }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
      });
    }

    // 每次造訪一組 id，只放 sessionStorage（非 cookie、非 localStorage）。無痕模式／
    // 停用儲存時 sessionStorage 存取會 throw → 退回僅存於記憶體，靜默降級不中斷。
    function anSession() {
      try {
        var s = window.sessionStorage.getItem(AN_SID_KEY);
        if (!s) { s = anUuid(); window.sessionStorage.setItem(AN_SID_KEY, s); }
        return s;
      } catch (e) {
        if (!anMemoSid) anMemoSid = anUuid();
        return anMemoSid;
      }
    }

    // 手機／桌機只以視窗寬度判定（760px＝手機門檻），不讀 User-Agent。此 760px 是統計用
    // 的分類門檻，刻意與 header 的收合斷點（1129px）脫鉤——改動導覽斷點時不要跟著改，
    // 否則歷史資料的 device 分類會斷層。
    function anDevice() {
      try {
        if (!window.matchMedia) return null;
        return window.matchMedia('(max-width: 760px)').matches ? 'mobile' : 'desktop';
      } catch (e) { return null; }
    }

    // 只取來源的主機名；無來源或同源則不記錄。永不外送完整網址（含路徑／參數）。
    function anReferrerHost() {
      try {
        if (!document.referrer) return null;
        var h = new URL(document.referrer).hostname;
        if (!h || h === location.hostname) return null;
        return h;
      } catch (e) { return null; }
    }

    function anSend(payload) {
      var body = JSON.stringify(payload);
      // 首選 fetch + keepalive + credentials:'omit'：可正確帶 apikey／Authorization
      // header，且明確「不送出也不接受任何 cookie」（Supabase 邊緣的 Cloudflare 會回
      // Set-Cookie: __cf_bm，credentials:'omit' 讓瀏覽器忽略它 → 真正無 cookie）。
      // keepalive 使請求在頁面切換後仍會送達，可靠度等同 sendBeacon。
      if (window.fetch) {
        window.fetch(AN_ENDPOINT, {
          method: 'POST',
          keepalive: true,
          credentials: 'omit',
          mode: 'cors',
          headers: {
            apikey: AN_KEY,
            Authorization: 'Bearer ' + AN_KEY,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: body
        })['catch'](function () { /* 靜默：離線／被擋／CSP 拒絕皆不影響頁面 */ });
        return;
      }
      // 後備：sendBeacon（無法帶自訂 header，故 apikey 以 query string 傳遞）
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          AN_ENDPOINT + '?apikey=' + encodeURIComponent(AN_KEY),
          new Blob([body], { type: 'application/json' })
        );
      }
    }

    track = function (eventType, extra) {
      try {
        if (isLocalHost()) return; // 本機開發：不送出、不留下任何紀錄
        var payload = {
          event_type: eventType,
          path: location.pathname, // 只有路徑，不含 ?query 與 #hash
          session_id: anSession()
        };
        var dev = anDevice();
        if (dev) payload.device = dev;
        var ref = anReferrerHost();
        if (ref) payload.referrer_host = ref;
        if (extra && extra.faq_slug) payload.faq_slug = extra.faq_slug;
        anSend(payload);
      } catch (e) { /* 靜默 */ }
    };

    track('pageview');

    // 衛教專欄文章頁：faq-q7.html → faq_slug 'q7'（與 faq_articles.slug 同一慣例）
    var anFaq = /(?:^|\/)faq-(q\d+)\.html$/.exec(location.pathname);
    if (anFaq) track('faq_view', { faq_slug: anFaq[1] });
  } catch (e) { /* 靜默：統計層絕不可影響頁面 */ }

  /* ===== 線上預約掛號 modal — built once on every page, opened by every booking CTA =====
     Reuses the search overlay's accessible-dialog pattern + dark backdrop.
     Intercepts clicks on any anchor pointing at contact.html (header 立即預約,
     footer 預約掛號, homepage qcard) → preventDefault and open this popup instead.
     contact.html stays as a no-JS permalink fallback so the CTA never dead-ends. */
  (function () {
    // 門診預約：各開放院區的 LINE「預約掛號」連結
    var OUTPATIENT = [
      { name: '新店大豐', url: 'https://lh.hding.com.tw/90674076/linebot/agreement?inviter=MgylrkrPT8tqs4G0xp2xgEMp7jGeN5bxTQcY4IcLTnr14FtPQFD0648WDCWc3bLlAquRdVAyfc6xYPyRQGoIXA%3D%3D' },
      { name: '木柵大豐', url: 'https://lh.hding.com.tw/90674076/linebot/agreement?inviter=j-FlOt6Ml-3govzU7vBE684BEi6N3ROc5akzU3O_LXqeieCkGB5ww4zlNp7riFdbfed0d8oLuS1ULF_m8xjX9Q%3D%3D' },
      { name: '興隆大豐', url: 'https://lh.hding.com.tw/90674076/linebot/agreement?inviter=zgzecC_wbGBGspDH-C0_fuajeDxCtWUBfI6Hskbh4gDLom9zMvYahn_AwIrrpHIno3y11OvyJ7Ha5bT4hlKh2Q%3D%3D' }
    ];
    // 手術諮詢預約：共用之 LINE 連結
    var SURGERY = [
      { name: '新店・木柵 手術', url: 'https://lin.ee/0tOeKVL' },
      { name: '興隆 手術', url: 'https://lin.ee/2uw6SVN' }
    ];

    var LINE_ICON =
      '<svg class="booking-line__icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">' +
      '<path d="M12 3C6.49 3 2 6.63 2 11.1c0 4 3.56 7.36 8.37 8 .33.07.77.22.88.5.1.26.07.66.03.92 0 0-.12.71-.14.86-.04.26-.2 1.01.89.55 1.09-.46 5.86-3.45 8-5.91 1.48-1.62 2.18-3.27 2.18-5.92C22.21 6.63 17.72 3 12 3zM8.13 13.36H6.14c-.29 0-.52-.23-.52-.52V9.06c0-.29.23-.52.52-.52.29 0 .52.23.52.52v3.26h1.47c.29 0 .52.23.52.52 0 .29-.23.52-.52.52zm2.06-.52c0 .29-.23.52-.52.52-.29 0-.52-.23-.52-.52V9.06c0-.29.23-.52.52-.52.29 0 .52.23.52.52v3.78zm4.64 0c0 .22-.14.42-.36.49a.52.52 0 0 1-.58-.19l-2.04-2.78v2.48c0 .29-.23.52-.52.52-.29 0-.52-.23-.52-.52V9.06c0-.22.15-.42.36-.49.21-.07.45 0 .58.19l2.04 2.78V9.06c0-.29.23-.52.52-.52.29 0 .52.23.52.52v3.78zm3.27-2.41c.29 0 .52.23.52.52 0 .29-.23.52-.52.52h-1.47v.95h1.47c.29 0 .52.23.52.52 0 .29-.23.52-.52.52h-1.99a.52.52 0 0 1-.52-.52V9.06c0-.29.23-.52.52-.52h1.99c.29 0 .52.23.52.52 0 .29-.23.52-.52.52h-1.47v.95h1.47z"/></svg>';

    function closeIcon() {
      return '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    }
    function row(name, url, label, aria) {
      return '<li class="booking-row">' +
        '<span class="booking-row__name">' + name + '</span>' +
        '<a class="booking-line" href="' + url + '" target="_blank" rel="noopener noreferrer" aria-label="' + aria + '">' +
          LINE_ICON + '<span>' + label + '</span></a>' +
      '</li>';
    }

    var overlay = document.createElement('div');
    overlay.className = 'booking-overlay';
    overlay.id = 'bookingOverlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="booking-overlay__backdrop" data-booking-close></div>' +
      '<div class="booking-modal" role="dialog" aria-modal="true" aria-labelledby="bookingTitle" aria-describedby="bookingLead" tabindex="-1">' +
        '<button type="button" class="booking-modal__close" data-booking-close aria-label="關閉預約視窗">' + closeIcon() + '</button>' +
        '<h2 id="bookingTitle" class="booking-modal__title">線上預約掛號</h2>' +
        '<p id="bookingLead" class="booking-modal__lead">請選擇就診院區，點擊後將於 LINE 開啟預約。手術相關請使用下方「手術諮詢預約」。</p>' +
        '<div class="booking-group">' +
          '<h3 class="booking-group__label">門診預約</h3>' +
          '<ul class="booking-list">' +
            OUTPATIENT.map(function (c) {
              return row(c.name, c.url, '預約掛號', c.name + '・以 LINE 預約掛號，另開新視窗');
            }).join('') +
            '<li class="booking-row booking-row--soon">' +
              '<span class="booking-row__name">中山大豐</span>' +
              '<span class="booking-row__soon">2026 年 10 月開幕・敬請期待</span>' +
            '</li>' +
          '</ul>' +
        '</div>' +
        '<div class="booking-group">' +
          '<h3 class="booking-group__label">手術諮詢預約</h3>' +
          '<ul class="booking-list">' +
            SURGERY.map(function (c) {
              return row(c.name, c.url, '手術諮詢', c.name + '諮詢預約，以 LINE 開啟，另開新視窗');
            }).join('') +
          '</ul>' +
        '</div>' +
        '<a class="booking-modal__more" href="' + sitePath('locations.html') + '">查看院區・門診<span aria-hidden="true"> →</span></a>' +
      '</div>';
    document.body.appendChild(overlay);

    var modal = overlay.querySelector('.booking-modal');
    var lastFocus = null;
    var closeTimer = null;

    function reduceMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    function focusables() {
      return Array.prototype.slice.call(modal.querySelectorAll('a[href], button')).filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
    }

    function openBooking(opener) {
      if (!overlay.hidden) return;
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      lastFocus = opener || document.activeElement;
      track('booking_click'); // 統計：涵蓋 header 立即預約／footer 預約掛號／首頁 qcard／行動選單 CTA
      overlay.hidden = false;
      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
      modal.focus(); // dialog 容器 (tabindex=-1) → 螢幕報讀器播報標題與說明
    }
    function finishClose() { overlay.hidden = true; closeTimer = null; }
    function closeBooking() {
      if (overlay.hidden) return;
      overlay.classList.remove('is-open');
      if (reduceMotion()) finishClose();
      else closeTimer = setTimeout(finishClose, 280);
      if (lastFocus && lastFocus.focus) lastFocus.focus(); // 焦點回到開啟的 CTA
    }

    // 攔截所有指向 contact.html 的預約 CTA → 改開 modal
    document.addEventListener('click', function (e) {
      var cta = e.target.closest && e.target.closest('a[href$="contact.html"]');
      if (!cta) return;
      e.preventDefault();
      openBooking(cta);
    });

    // 背幕／X 關閉
    overlay.addEventListener('click', function (e) {
      if (e.target.closest('[data-booking-close]')) closeBooking();
    });

    // Esc 關閉；Tab 在對話框內循環（focus trap）
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeBooking(); e.preventDefault(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (document.activeElement === modal && e.shiftKey) { last.focus(); e.preventDefault(); }
      else if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    });
  })();
})();
