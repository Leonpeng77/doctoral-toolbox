/*
 * Local bilingual layer for Doctoral Toolbox.
 * Zero dependencies, zero network calls. Language choice is stored only in
 * this browser's localStorage. Nothing the user types is ever read or sent.
 */
(function () {
  'use strict';

  var DATA = window.I18N_DATA;
  if (!DATA) { return; }

  var KEY = 'dt-lang';
  var path = decodeURIComponent(location.pathname).replace(/\\/g, '/');

  /* Dictionary keys are worktree-relative paths such as
     "guides/apa7-in-text-citations.html". The site may be served from a
     subpath (a share link, a Pages preview), so strip the mounting prefix
     by walking upward until a key matches. */
  function resolvePage() {
    var segments = path.split('/').filter(Boolean);
    var file = segments[segments.length - 1];
    if (!file) { return 'index.html'; }
    if (!/\.html$/.test(file)) { file = 'index.html'; }
    for (var i = 0; i < segments.length; i++) {
      var candidate = segments.slice(i).join('/');
      if (i === segments.length - 1 && candidate !== file) { candidate = file; }
      if (DATA.pages[candidate]) { return candidate; }
    }
    return file;
  }

  var page = resolvePage();
  var pageMap = DATA.pages[page];

  function current() {
    try { return localStorage.getItem(KEY) === 'zh' ? 'zh' : 'en'; }
    catch (e) { return 'en'; }
  }

  function remember(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode */ }
  }

  function textOf(node) {
    return node.textContent.replace(/\s+/g, ' ').trim();
  }

  // Cache the original English innerHTML once, so switching back is exact.
  var originals = [];
  function collect() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      originals.push({ node: nodes[i], html: nodes[i].innerHTML,
                       key: nodes[i].getAttribute('data-i18n') });
    }
  }

  function applyNav(lang) {
    var nav = document.querySelectorAll('.site-nav a, .site-foot a');
    for (var i = 0; i < nav.length; i++) {
      var raw = nav[i].getAttribute('data-i18n-en');
      if (raw === null) {
        raw = textOf(nav[i]);
        nav[i].setAttribute('data-i18n-en', raw);
      }
      if (lang === 'zh' && DATA.shared[raw]) {
        nav[i].textContent = DATA.shared[raw];
      } else {
        nav[i].textContent = raw;
      }
    }
  }

  function apply(lang, announce) {
    var zh = lang === 'zh';
    document.documentElement.lang = zh ? 'zh-CN' : 'en';

    for (var i = 0; i < originals.length; i++) {
      var entry = originals[i];
      var translated = zh && pageMap && pageMap[entry.key];
      entry.node.innerHTML = translated || entry.html;
    }
    applyNav(lang);

    // Skip link is outside [data-i18n].
    var skip = document.querySelector('.skip-link');
    if (skip) { skip.textContent = zh ? '跳到正文' : 'Skip to content'; }

    // Switcher labels.
    var btn = document.getElementById('lang-switch');
    if (btn) {
      btn.setAttribute('aria-label', DATA.ui.switch_title);
      btn.setAttribute('title', DATA.ui.switch_title);
      var active = btn.querySelector('.lang-active');
      var inactive = btn.querySelector('.lang-inactive');
      if (active) { active.textContent = zh ? DATA.ui.switch_zh : DATA.ui.switch_en; }
      if (inactive) { inactive.textContent = zh ? DATA.ui.switch_en : DATA.ui.switch_zh; }
      btn.setAttribute('data-state', lang);
    }

    var live = document.getElementById('i18n-live');
    if (live && announce) {
      live.textContent = zh ? DATA.ui.notice : DATA.ui.notice_en;
    }
    remember(lang);
    window.dispatchEvent(new CustomEvent('dt:langchange', { detail: { lang: lang } }));
  }

  function buildSwitcher() {
    if (document.getElementById('lang-switch')) { return; }
    var header = document.querySelector('.site-head .wrap');
    if (!header) { return; }

    var wrap = document.createElement('div');
    wrap.className = 'lang-switch-wrap';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'lang-switch';
    btn.className = 'lang-switch';
    btn.innerHTML = '<span class="lang-inactive">' + DATA.ui.switch_en + '</span>' +
                    '<span class="lang-sep">/</span>' +
                    '<span class="lang-active">' + DATA.ui.switch_en + '</span>';
    btn.addEventListener('click', function () {
      apply(current() === 'zh' ? 'en' : 'zh', true);
    });
    wrap.appendChild(btn);
    header.appendChild(wrap);

    var live = document.createElement('span');
    live.id = 'i18n-live';
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
  }

  function init() {
    collect();
    buildSwitcher();
    apply(current(), false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DT_I18N = {
    lang: current,
    on: function (fn) { window.addEventListener('dt:langchange', function (e) { fn(e.detail.lang); }); }
  };
})();
