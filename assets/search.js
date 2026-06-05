/* =============================================================================
 * 大豐耳鼻喉科 — 站內搜尋（點擊開啟的覆蓋式搜尋 overlay）
 * -----------------------------------------------------------------------------
 * 純 vanilla JS，無相依套件、無建置步驟、無後端。
 *
 * 行為（取代上一版「每頁 header 內嵌搜尋框」，該內嵌框造成 header 溢位換行）：
 *   1. 載入時，於 header 注入一顆「放大鏡」圖示按鈕（aria-label="搜尋"），
 *      置於 .lang-toggle 之前；注入方式比照 site.js 的 back-to-top 按鈕。
 *   2. 於 <body> 末端建立一個隱藏的搜尋 overlay：實心半透明深色背幕（rgba 變暗，
 *      不使用 backdrop-filter/模糊），置中卡片內含大型輸入框、搜尋按鈕、
 *      「熱門搜尋」標籤列與關閉（X）按鈕。
 *   3. 沿用既有索引邏輯（window.DAFENG_SEARCH_INDEX）即時顯示結果於卡片內。
 *
 * 索引來源：window.DAFENG_SEARCH_INDEX（由 assets/search-index.js 提供，須先載入）。
 *
 * 無障礙：
 *   - overlay 為 role="dialog" aria-modal="true"，以標題標示（aria-labelledby）。
 *   - 開啟時焦點移入輸入框；Esc 或點背幕關閉；關閉後焦點回到放大鏡按鈕。
 *   - 焦點鎖在對話框內（focus trap）。尊重 prefers-reduced-motion。
 *   - 輸入框採 combobox 樣式：↑/↓ 移動、Enter 前往、滑鼠 hover 標記。
 * ============================================================================= */
(function () {
  "use strict";

  var MAX_RESULTS = 8;
  var TYPE_LABEL = { faq: "衛教", location: "院區", news: "消息" };

  // 「熱門搜尋」— 真實的診所主題（對應索引內的關鍵字）。
  var HOT = ["睡眠呼吸中止", "鼻過敏", "眩暈", "兒童門診", "門診時間", "立即預約"];

  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function highlight(text, terms) {
    var out = escapeHtml(text);
    terms.forEach(function (t) {
      if (!t) return;
      var safe = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp("(" + safe + ")", "gi"), "<mark>$1</mark>");
    });
    return out;
  }

  // 比對單筆索引，回傳分數（0 = 不符合）。沿用上一版評分邏輯。
  function scoreEntry(entry, terms) {
    var title = (entry.title || "").toLowerCase();
    var kw = (entry.keywords || []).join(" ").toLowerCase();
    var summary = (entry.summary || "").toLowerCase();
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var hit = 0;
      if (title.indexOf(t) !== -1) hit += title.indexOf(t) === 0 ? 16 : 10;
      if (kw.indexOf(t) !== -1) hit += 6;
      if (summary.indexOf(t) !== -1) hit += 2;
      if (hit === 0) return 0; // AND：每個字都必須命中某處
      total += hit;
    }
    return total;
  }

  function search(query) {
    var index = window.DAFENG_SEARCH_INDEX || [];
    var terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    var scored = [];
    for (var i = 0; i < index.length; i++) {
      var s = scoreEntry(index[i], terms);
      if (s > 0) scored.push({ entry: index[i], score: s, order: i });
    }
    scored.sort(function (a, b) {
      return b.score - a.score || a.order - b.order; // 穩定排序
    });
    return scored.slice(0, MAX_RESULTS).map(function (x) { return x.entry; });
  }

  var MAGNIFIER =
    '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path></svg>';

  function init() {
    var header = document.getElementById("header") || document.querySelector(".site-header");
    if (!header) return;
    var nav = header.querySelector(".nav") || header;

    // 防衛性去重：移除上一版殘留的內嵌搜尋框（若 HTML 尚未被清掉），
    // 確保 header 只有一套搜尋 UI、不再溢位。（執行期 DOM，不更動任何 HTML 檔。）
    var legacy = header.querySelectorAll(".site-search");
    for (var L = 0; L < legacy.length; L++) legacy[L].parentNode.removeChild(legacy[L]);

    // 1) 注入放大鏡觸發鈕（置於 .lang-toggle 之前）
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "search-trigger";
    trigger.setAttribute("aria-label", "搜尋");
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = MAGNIFIER;
    var langToggle = nav.querySelector(".lang-toggle");
    if (langToggle) nav.insertBefore(trigger, langToggle);
    else nav.appendChild(trigger);

    // 2) 建立 overlay（附加到 <body>）
    var overlay = document.createElement("div");
    overlay.className = "search-overlay";
    overlay.id = "searchOverlay";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="search-overlay__backdrop" data-search-close></div>' +
      '<div class="search-modal" role="dialog" aria-modal="true" aria-labelledby="searchModalTitle">' +
        '<button type="button" class="search-modal__close" aria-label="關閉搜尋" data-search-close>' +
          '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
        '<h2 id="searchModalTitle" class="search-modal__title">搜尋網站</h2>' +
        '<form class="search-modal__form" role="search" novalidate>' +
          '<div class="search-modal__field">' +
            '<span class="search-modal__field-icon" aria-hidden="true">' + MAGNIFIER + '</span>' +
            '<input type="search" class="search-modal__input" id="searchModalInput" ' +
              'role="combobox" aria-expanded="false" aria-controls="searchResults" aria-autocomplete="list" ' +
              'aria-label="搜尋網站" placeholder="搜尋網站…" autocomplete="off" autocapitalize="off" spellcheck="false" />' +
          '</div>' +
          '<button type="submit" class="search-modal__submit">搜尋</button>' +
        '</form>' +
        '<div class="search-modal__hot">' +
          '<span class="search-modal__hot-label" id="searchHotLabel">熱門搜尋</span>' +
          '<ul class="search-chips" aria-labelledby="searchHotLabel">' +
            HOT.map(function (q) {
              return '<li><button type="button" class="search-chip" data-q="' + escapeHtml(q) + '">' +
                escapeHtml(q) + "</button></li>";
            }).join("") +
          '</ul>' +
        '</div>' +
        '<ul class="search-results" id="searchResults" role="listbox" aria-label="搜尋結果" hidden></ul>' +
      '</div>';
    document.body.appendChild(overlay);

    var modal = overlay.querySelector(".search-modal");
    var input = overlay.querySelector(".search-modal__input");
    var form = overlay.querySelector(".search-modal__form");
    var list = overlay.querySelector(".search-results");
    var chips = overlay.querySelectorAll(".search-chip");

    var results = [];
    var active = -1;
    var lastFocus = null;
    var closeTimer = null;

    function optId(i) { return "searchOpt-" + i; }

    function focusables() {
      return Array.prototype.slice
        .call(modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])'))
        .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    }

    // --- 結果清單 -------------------------------------------------------
    function closeList() {
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      results = [];
      active = -1;
    }

    function setActive(next) {
      var items = list.querySelectorAll('[role="option"]');
      if (!items.length) return;
      if (active > -1 && items[active]) items[active].setAttribute("aria-selected", "false");
      active = (next + items.length) % items.length;
      items[active].setAttribute("aria-selected", "true");
      input.setAttribute("aria-activedescendant", optId(active));
      items[active].scrollIntoView({ block: "nearest" });
    }

    function render(query) {
      var terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
      results = search(query);
      active = -1;
      input.removeAttribute("aria-activedescendant");

      if (!terms.length) { closeList(); return; }

      if (!results.length) {
        list.hidden = false;
        input.setAttribute("aria-expanded", "true");
        list.innerHTML = '<li class="search-results__empty" role="status">查無結果</li>';
        return;
      }

      list.innerHTML = results
        .map(function (e, i) {
          var label = TYPE_LABEL[e.type];
          var badge = label
            ? ' <span class="search-result__badge search-result__badge--' + e.type + '">' + label + "</span>"
            : "";
          return (
            '<li class="search-result" role="option" id="' + optId(i) + '" aria-selected="false">' +
            '<a href="' + escapeHtml(e.url) + '" tabindex="-1">' +
            '<span class="search-result__title">' + highlight(e.title, terms) + badge + "</span>" +
            '<span class="search-result__snippet">' + highlight(e.summary || "", terms) + "</span>" +
            "</a></li>"
          );
        })
        .join("");
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function go(i) {
      if (i > -1 && results[i]) window.location.href = results[i].url;
      else if (results.length) window.location.href = results[0].url;
    }

    // --- overlay 開 / 關 ------------------------------------------------
    function openOverlay() {
      if (!overlay.hidden) return;
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      lastFocus = document.activeElement;
      overlay.hidden = false;
      document.documentElement.classList.add("search-open");
      trigger.setAttribute("aria-expanded", "true");
      // 動畫：下一影格加上 .is-open（reduce-motion 下 CSS 會關閉過場）
      requestAnimationFrame(function () { overlay.classList.add("is-open"); });
      input.value = "";
      closeList();
      input.focus();
    }

    function finishClose() {
      overlay.hidden = true;
      document.documentElement.classList.remove("search-open");
      closeList();
      closeTimer = null;
    }

    function closeOverlay() {
      if (overlay.hidden) return;
      overlay.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      if (reduceMotion()) finishClose();
      else closeTimer = setTimeout(finishClose, 240);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // --- 事件 -----------------------------------------------------------
    trigger.addEventListener("click", openOverlay);

    input.addEventListener("input", function () { render(input.value); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (results.length) go(active);
      else render(input.value);
    });

    input.addEventListener("keydown", function (e) {
      switch (e.key) {
        case "ArrowDown":
          if (list.hidden) render(input.value);
          else setActive(active + 1);
          e.preventDefault();
          break;
        case "ArrowUp":
          if (!list.hidden) { setActive(active - 1); e.preventDefault(); }
          break;
        case "Enter":
          if (!list.hidden && results.length) { go(active); e.preventDefault(); }
          break;
      }
    });

    // 熱門搜尋 chip：填入查詢並即時執行
    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener("click", function () {
        input.value = this.getAttribute("data-q") || "";
        input.focus();
        render(input.value);
      });
    }

    // 滑鼠 hover 標記結果；點擊由 <a> 自行導航
    list.addEventListener("mousemove", function (e) {
      var li = e.target.closest('[role="option"]');
      if (!li) return;
      var items = Array.prototype.slice.call(list.querySelectorAll('[role="option"]'));
      var idx = items.indexOf(li);
      if (idx > -1 && idx !== active) setActive(idx);
    });

    // 點背幕 / X 關閉
    overlay.addEventListener("click", function (e) {
      if (e.target.closest("[data-search-close]")) closeOverlay();
    });

    // Esc 關閉；Tab 在對話框內循環（focus trap）
    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeOverlay();
        e.preventDefault();
        return;
      }
      if (e.key === "Tab") {
        var f = focusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus(); e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus(); e.preventDefault();
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
