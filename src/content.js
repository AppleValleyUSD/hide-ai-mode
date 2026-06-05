/*
 * AVUSD - Hide Google AI Mode
 * Content script. Runs on google.com.
 *
 * Two defenses:
 *   1) REDIRECT: if a page actually loads in AI Mode, bounce it to plain Web
 *      results (udm=14). This is the strongest guarantee - even if a student
 *      reaches an AI Mode URL by another route, the page never renders.
 *   2) HIDE: remove the AI Mode tab/pill and AI Overview blocks from the DOM,
 *      using both attribute matching and visible-text matching, on every
 *      mutation (Google rebuilds the results page dynamically).
 *
 * Maintenance note: Google rotates class names constantly but the udm=50 URL
 * parameter and the visible label "AI Mode" have been stable. If the button
 * reappears after a Google update, first re-confirm the parameter by clicking
 * AI Mode on a test device and reading the URL, then update PARAM / LABELS below.
 */

(function () {
  "use strict";

  // ----- Config you may need to adjust after a Google layout change -----
  var AI_MODE_PARAM = "udm=50";          // the URL flag for AI Mode
  var WEB_PARAM = "udm=14";              // plain Web results (no AI)
  var LABELS = ["ai mode", "dive deeper with ai mode", "search with ai mode"];
  var ENABLE_REDIRECT = true;            // set false to hide-only, no redirect
  // ---------------------------------------------------------------------

  // Match AI_MODE_PARAM only as a whole query value (?udm=50 / &udm=50), not as
  // a substring, so a hypothetical udm=500 wouldn't be caught by accident.
  var AI_MODE_RE = (function () {
    var esc = AI_MODE_PARAM.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("[?&]" + esc + "(?:&|#|$)");
  })();

  // 1) Redirect away from AI Mode pages.
  if (ENABLE_REDIRECT) {
    try {
      var url = new URL(window.location.href);
      var udm = url.searchParams.get("udm");
      if (udm === "50") {
        url.searchParams.set("udm", "14");
        window.location.replace(url.toString());
        return; // stop; the page is navigating away
      }
    } catch (e) { /* ignore and fall through to hiding */ }
  }

  function looksLikeAiMode(el) {
    if (!el || !el.getAttribute) return false;
    var href = el.getAttribute("href");
    if (href && (AI_MODE_RE.test(href) || /[?&]aimode=/.test(href))) {
      return true;
    }
    var aria = el.getAttribute("aria-label") || "";
    var text = (el.textContent || "");
    var hay = (aria + " " + text).trim().toLowerCase();
    // Only treat clickable controls as text matches. Google sometimes renders
    // the pill as a <div role="link"/"button"> rather than an <a>, so accept
    // those too — but keep an exact-equality match so a result snippet that
    // merely contains the words "ai mode" is never hidden.
    var role = el.getAttribute("role");
    var clickable = el.tagName === "A" || role === "link" || role === "button";
    for (var i = 0; i < LABELS.length; i++) {
      if (aria.toLowerCase() === LABELS[i]) return true;
      if (clickable && hay === LABELS[i]) return true;
    }
    return false;
  }

  function hideEntryPoint(el) {
    // Walk up a few levels to catch the clickable pill/wrapper, not just the
    // inner text node, but stop well before we'd hide the whole search bar.
    var node = el;
    for (var i = 0; i < 3 && node && node.parentElement; i++) {
      if (node.getAttribute && (node.getAttribute("role") === "search" ||
          node.id === "searchform" || node.id === "tsf")) {
        break;
      }
      node = node.parentElement;
    }
    el.style.setProperty("display", "none", "important");
    if (node && node !== el) {
      node.style.setProperty("display", "none", "important");
    }
  }

  function sweep(root) {
    var scope = (root && root.querySelectorAll) ? root : document;
    var candidates = scope.querySelectorAll(
      'a, button, [role="link"], [role="button"], [aria-label]'
    );
    for (var i = 0; i < candidates.length; i++) {
      if (looksLikeAiMode(candidates[i])) hideEntryPoint(candidates[i]);
    }
    // AI Overview containers (covered by CSS too, belt-and-suspenders).
    var ov = scope.querySelectorAll(
      '#m-x-content, div[data-attrid="AIOverview"], div[aria-label="AI Overview" i]'
    );
    for (var j = 0; j < ov.length; j++) {
      ov[j].style.setProperty("display", "none", "important");
    }
  }

  function startObserver() {
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        // An attribute (href / aria-label) changed on an existing node, turning
        // it into an AI Mode control. Re-check just that node.
        if (m.type === "attributes") {
          if (m.target && m.target.nodeType === 1 && looksLikeAiMode(m.target)) {
            hideEntryPoint(m.target);
          }
          continue;
        }
        var added = m.addedNodes;
        for (var k = 0; k < added.length; k++) {
          if (added[k].nodeType === 1) sweep(added[k]);
        }
      }
    });
    // Setting style.display never touches href/aria-label, so watching those
    // two attributes can't re-trigger us — no feedback loop.
    obs.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "aria-label"]
    });
  }

  // documentElement exists at document_start, so observe immediately to catch
  // entry points as the parser streams them in or scripts inject them.
  sweep(document);
  startObserver();
  // Re-sweep once the full initial DOM is parsed, in case the pill was in the
  // server-rendered markup but arrived after our first sweep.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { sweep(document); });
  }
})();
