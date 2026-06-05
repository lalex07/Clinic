/* =============================================================================
 * 大豐耳鼻喉科 — 站內即時搜尋 (client-side search)
 * -----------------------------------------------------------------------------
 * 純 vanilla JS，無相依套件、無建置步驟、無後端。
 * 讀取 window.DAFENG_SEARCH_INDEX（由 assets/search-index.js 提供），
 * 在使用者輸入時即時過濾並於搜尋列下方顯示結果下拉清單。
 *
 * 載入順序（每頁 <head> 或 </body> 前，兩支都要，index 先載）：
 *     <script src="assets/search-index.js" defer></script>
 *     <script src="assets/search.js" defer></script>
 *
 * 需要的 HTML（見 search-integration.md，貼進每頁 header）：
 *     <div class="site-search" role="search"> … <input class="site-search__input"> …
 *
 * 無障礙：採 ARIA combobox + listbox 樣式。
 *   ↑ / ↓  在結果間移動   Enter  前往選取結果   Esc  關閉清單
 *   滑鼠 hover 亦會標記該結果；查無結果時顯示「查無結果」。
 * ============================================================================= */
(function () {
  "use strict";

  var MAX_RESULTS = 8;

  // 分類標籤（顯示於結果右側）。page 不顯示標籤。
  var TYPE_LABEL = { faq: "衛教", location: "院區", news: "消息" };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // 將 (已跳脫的) 文字中、命中的查詢字以 <mark> 包起來。
  function highlight(text, terms) {
    var out = escapeHtml(text);
    terms.forEach(function (t) {
      if (!t) return;
      // 對已跳脫文字做不分大小寫的字面比對；跳脫正則特殊字元。
      var safe = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp("(" + safe + ")", "gi"), "<mark>$1</mark>");
    });
    return out;
  }

  // 比對單筆索引，回傳分數（0 = 不符合，需排除）。
  function scoreEntry(entry, terms) {
    var title = (entry.title || "").toLowerCase();
    var kw = (entry.keywords || []).join(" ").toLowerCase();
    var summary = (entry.summary || "").toLowerCase();
    var total = 0;

    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var hit = 0;
      if (title.indexOf(t) !== -1) hit += (title.indexOf(t) === 0 ? 16 : 10);
      if (kw.indexOf(t) !== -1) hit += 6;
      if (summary.indexOf(t) !== -1) hit += 2;
      if (hit === 0) return 0; // 採 AND：每個字都必須命中某處
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
      return b.score - a.score || a.order - b.order; // 同分維持索引順序（穩定）
    });
    return scored.slice(0, MAX_RESULTS).map(function (x) {
      return x.entry;
    });
  }

  function wire(root) {
    var input = root.querySelector(".site-search__input");
    var list = root.querySelector(".site-search__results");
    if (!input || !list) return;

    var results = []; // 目前顯示的索引項
    var active = -1; // 目前標記的結果（-1 = 無）

    function close() {
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      results = [];
      active = -1;
    }

    function open() {
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function optId(i) {
      return "siteSearchOpt-" + i;
    }

    function setActive(next) {
      var items = list.querySelectorAll('[role="option"]');
      if (!items.length) return;
      if (active > -1 && items[active]) items[active].setAttribute("aria-selected", "false");
      active = (next + items.length) % items.length; // wrap
      items[active].setAttribute("aria-selected", "true");
      input.setAttribute("aria-activedescendant", optId(active));
      // 確保標記項可見
      items[active].scrollIntoView({ block: "nearest" });
    }

    function render(query) {
      var terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
      results = search(query);
      active = -1;
      input.removeAttribute("aria-activedescendant");

      if (!terms.length) {
        close();
        return;
      }

      if (!results.length) {
        list.innerHTML =
          '<li class="site-search__empty" role="status">查無結果</li>';
        open();
        return;
      }

      var html = results
        .map(function (e, i) {
          var label = TYPE_LABEL[e.type];
          var badge = label
            ? ' <span class="site-search__badge site-search__badge--' +
              e.type +
              '">' +
              label +
              "</span>"
            : "";
          return (
            '<li class="site-search__item" role="option" id="' +
            optId(i) +
            '" aria-selected="false">' +
            '<a href="' +
            escapeHtml(e.url) +
            '" tabindex="-1">' +
            '<span class="site-search__item-title">' +
            highlight(e.title, terms) +
            badge +
            "</span>" +
            '<span class="site-search__item-snippet">' +
            highlight(e.summary || "", terms) +
            "</span>" +
            "</a>" +
            "</li>"
          );
        })
        .join("");
      list.innerHTML = html;
      open();
    }

    function go(i) {
      if (i > -1 && results[i]) {
        window.location.href = results[i].url;
      } else if (results.length) {
        window.location.href = results[0].url; // Enter 未選取 → 第一筆
      }
    }

    // --- 事件 -----------------------------------------------------------
    input.addEventListener("input", function () {
      render(input.value);
    });

    input.addEventListener("focus", function () {
      if (input.value.trim()) render(input.value);
    });

    input.addEventListener("keydown", function (e) {
      switch (e.key) {
        case "ArrowDown":
          if (list.hidden) {
            render(input.value);
          } else {
            setActive(active + 1);
          }
          e.preventDefault();
          break;
        case "ArrowUp":
          if (!list.hidden) setActive(active - 1);
          e.preventDefault();
          break;
        case "Enter":
          if (!list.hidden && results.length) {
            go(active);
            e.preventDefault();
          }
          break;
        case "Escape":
          if (!list.hidden) {
            close();
            e.preventDefault();
          } else {
            input.value = "";
          }
          break;
      }
    });

    // 滑鼠 hover 標記、點擊由 <a> 自行導航
    list.addEventListener("mousemove", function (e) {
      var li = e.target.closest('[role="option"]');
      if (!li) return;
      var items = Array.prototype.slice.call(list.querySelectorAll('[role="option"]'));
      var idx = items.indexOf(li);
      if (idx > -1 && idx !== active) setActive(idx);
    });

    // 點擊清單外 → 關閉
    document.addEventListener("click", function (e) {
      if (!root.contains(e.target)) close();
    });
  }

  function init() {
    var roots = document.querySelectorAll(".site-search");
    for (var i = 0; i < roots.length; i++) wire(roots[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
