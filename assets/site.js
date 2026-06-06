/* 大豐耳鼻喉科 — shared behaviour for every page */
(function () {
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
    // is display:none at <=760px, so on phones there was no way to book. Clone it as a
    // prominent full-width action at the bottom of the menu; its contact.html href is
    // intercepted by the booking-modal handler below, so it opens the modal on mobile too.
    var headerCta = document.querySelector('.nav__cta');
    if (headerCta && !links.querySelector('.nav__menu-cta')) {
      var menuCta = document.createElement('a');
      menuCta.className = 'nav__menu-cta';
      menuCta.href = headerCta.getAttribute('href') || 'contact.html';
      menuCta.innerHTML = headerCta.innerHTML; // calendar icon + 立即預約 label
      links.appendChild(menuCta);
    }
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
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
    nhiMark.src = 'assets/nhi-logo.png';
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

  // Cloudflare Web Analytics — privacy-friendly, cookieless. No cookies, no
  // other trackers. SITE OWNER: replace __CF_BEACON_TOKEN__ below with your
  // real token from the Cloudflare dashboard (Web Analytics → your site →
  // "Add a site" snippet). Until then the beacon loads but reports nothing.
  var cfBeacon = document.createElement('script');
  cfBeacon.defer = true;
  cfBeacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  cfBeacon.setAttribute('data-cf-beacon', '{"token":"__CF_BEACON_TOKEN__"}');
  document.body.appendChild(cfBeacon);

  /* ===== 自訂下拉重新整理 — custom pull-to-refresh (touch / coarse-pointer only) =====
     The browser's NATIVE pull-to-refresh can't be styled, so we draw our own: an
     upside-down doctor logo that follows the pull and reloads once dragged past a
     threshold. overscroll-behavior-y (CSS) stops the native gesture from fighting it.
     Guards: only fires at the very top of the page, never while the search overlay or
     booking modal is open, and never blocks normal scrolling (it only owns the gesture
     once the user is actively pulling DOWN from scrollY 0). Desktop = no effect. */
  (function () {
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var canTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
    if (!coarse || !canTouch) return; // desktop / fine-pointer → feature off entirely

    var THRESHOLD = 72;  // px of (damped) pull needed to trigger a reload
    var MAX_PULL = 96;   // cap how far the indicator travels
    var DAMP = 0.5;      // resistance → rubber-band feel
    var REST = -56;      // indicator parked just above the viewport (px)
    function reduce() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    function overlayOpen() {
      return !!document.querySelector('.search-overlay:not([hidden]), .booking-overlay:not([hidden])');
    }

    var ind = document.createElement('div');
    ind.className = 'ptr-indicator';
    ind.setAttribute('aria-hidden', 'true');
    var ptrImg = document.createElement('img');
    ptrImg.src = 'assets/logo.png';
    ptrImg.alt = '';
    ind.appendChild(ptrImg);
    document.body.appendChild(ind);

    var startY = 0, pulling = false, dist = 0, armed = false;

    function setPull(d) {
      ind.style.transform = 'translateX(-50%) translateY(' + (REST + d) + 'px)';
      ind.style.opacity = Math.min(1, d / THRESHOLD).toFixed(3);
    }
    function reset(animate) {
      ind.classList.toggle('is-animating', !!animate && !reduce());
      ind.classList.remove('is-armed');
      ind.style.transform = '';
      ind.style.opacity = '';
    }

    window.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || window.scrollY > 0 || overlayOpen()) return;
      startY = e.touches[0].clientY;
      pulling = true; dist = 0; armed = false;
      ind.classList.remove('is-animating');
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (!pulling) return;
      if (window.scrollY > 0 || overlayOpen()) { pulling = false; reset(true); return; }
      var dy = e.touches[0].clientY - startY;
      if (dy <= 0) { // pulling up / not down → hand the gesture back to normal scroll
        if (dist !== 0) { dist = 0; reset(false); }
        return;
      }
      e.preventDefault(); // actively pulling down at the top → we own the gesture
      dist = Math.min(MAX_PULL, dy * DAMP);
      setPull(dist);
      var nowArmed = dist >= THRESHOLD;
      if (nowArmed !== armed) { armed = nowArmed; ind.classList.toggle('is-armed', armed); }
    }, { passive: false });

    function end() {
      if (!pulling) return;
      pulling = false;
      if (armed) {
        ind.classList.add('is-armed', 'is-animating');
        if (reduce()) window.location.reload();
        else setTimeout(function () { window.location.reload(); }, 180);
      } else {
        reset(true);
      }
    }
    window.addEventListener('touchend', end, { passive: true });
    window.addEventListener('touchcancel', function () { pulling = false; reset(true); }, { passive: true });
  })();

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
        '<a class="booking-modal__more" href="locations.html">查看院區・門診<span aria-hidden="true"> →</span></a>' +
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
