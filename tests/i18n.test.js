const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require(process.env.JSDOM_PATH || 'jsdom');

const SITE = '/Users/Ray/WorkBuddy/2026-11-10-21-05-38/academic-tools-site/site';
let pass = 0, fail = 0;
function t(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' -> ' + detail : '')); }
}

function load(rel, runScripts = true) {
  const file = path.join(SITE, rel);
  const html = fs.readFileSync(file, 'utf8');
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(html, {
    url: 'https://example.test/' + rel,
    runScripts: runScripts ? 'dangerously' : 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  if (runScripts) {
    // Inject external scripts in document order; jsdom cannot fetch file://
    // relatives from an http URL. We execute the ACTUAL shipped files.
    const prefix = rel.includes('/') ? '../' : '';
    const scripts = [...dom.window.document.querySelectorAll('script[src]')];
    for (const s of scripts) {
      const src = s.getAttribute('src');
      let f;
      if (src.startsWith('http')) continue;
      if (src.startsWith('mailto')) continue;
      f = path.resolve(SITE, path.dirname(rel), src);
      if (!fs.existsSync(f)) { errors.push('missing script: ' + src); continue; }
      const code = fs.readFileSync(f, 'utf8');
      try { dom.window.eval(code); } catch (e) { errors.push(src + ': ' + e.message); }
    }
  }
  return { dom, errors };
}

async function ready(dom) {
  await new Promise(r => setTimeout(r, 250));
  return dom;
}

(async () => {
  console.log('\n=== 1. 首页：切换前后文本 ===');
  const { dom, errors } = load('index.html');
  await ready(dom);
  const d = dom.window.document;
  const w = dom.window;

  t('i18n-data 已加载', !!w.I18N_DATA);
  t('切换按钮已生成', !!d.getElementById('lang-switch'));
  t('初始为英文', d.documentElement.lang === 'en', d.documentElement.lang);
  const before = d.querySelector('[data-i18n="i2"]').textContent;
  t('初始标题是英文', /Sort out/.test(before), before);

  const navBefore = d.querySelector('.site-nav a').textContent;
  t('导航初始 Home', navBefore === 'Home', navBefore);

  d.getElementById('lang-switch').click();

  const after = d.querySelector('[data-i18n="i2"]').textContent;
  t('点击后标题变中文', /参考文献/.test(after), after);
  t('html lang 变 zh-CN', d.documentElement.lang === 'zh-CN', d.documentElement.lang);
  t('导航变中文', d.querySelector('.site-nav a').textContent === '首页', d.querySelector('.site-nav a').textContent);
  t('localStorage 持久化', w.localStorage.getItem('dt-lang') === 'zh', w.localStorage.getItem('dt-lang'));
  t('跳过链接已翻译', d.querySelector('.skip-link').textContent === '跳到正文');

  const para = d.querySelector('[data-i18n="i9"]');
  t('内联 <strong> 保留', !!para.querySelector('strong'), para.innerHTML.slice(0, 60));
  t('内联 <em> 保留', !!para.querySelector('em'));
  const linkPara = d.querySelector('[data-i18n="i18"]');
  t('内联 <a> 保留且 href 完好',
    !!linkPara.querySelector('a') && linkPara.querySelector('a').getAttribute('href').includes('smart-import'),
    linkPara.innerHTML.slice(0, 80));

  d.getElementById('lang-switch').click();
  t('再次点击切回英文', d.querySelector('[data-i18n="i2"]').textContent === before);

  console.log('\n=== 2. 语言偏好跨页面（模拟同源导航）===');
  // jsdom gives each instance its own localStorage; seed the value the way
  // a real same-origin navigation would present it.
  const guide = fs.readFileSync(path.join(SITE, 'guides/apa7-in-text-citations.html'), 'utf8');
  const d2 = new JSDOM(guide, { url: 'https://example.test/guides/apa7-in-text-citations.html',
    runScripts: 'dangerously', pretendToBeVisual: true });
  d2.window.localStorage.setItem('dt-lang', 'zh');
  for (const s of d2.window.document.querySelectorAll('script[src]')) {
    const f = path.resolve(SITE, 'guides', s.getAttribute('src'));
    if (fs.existsSync(f)) { try { d2.window.eval(fs.readFileSync(f, 'utf8')); } catch (e) {} }
  }
  await new Promise(r => setTimeout(r, 200));
  const gtxt = d2.window.document.querySelector('[data-i18n="i2"]').textContent;
  t('另一页以中文首屏显示', /文内引用/.test(gtxt), gtxt);

  console.log('\n=== 3. 工具页动态文案 ===');
  const c = load('tools/reference-check.html'); await ready(c.dom);
  const cw = c.dom.window, cd = c.dom.window.document;
  cw.localStorage.setItem('dt-lang', 'zh');
  cw.dispatchEvent(new cw.CustomEvent('dt:langchange', { detail: { lang: 'zh' } }));
  const ta = cd.getElementById('refs');
  ta.value = 'Smith, J. A. and Lee, B. (2024). Dynamic Capabilities And Firm Performance. Journal of Business Research, Vol. 142, pp. 45-67. doi:10.1016/j.jbusres.2023.114321';
  cd.getElementById('run').click();
  const issueText = cd.getElementById('results').textContent;
  t('体检结果为中文标题', /作者之间用了|DOI 不是/.test(issueText), issueText.slice(0, 100));
  t('体检"改法"已中文化', /改法/.test(issueText));

  const messy = cd.getElementById('messy');
  messy.value = 'Smith, J. A. and Lee, B. (2024). Dynamic Capabilities And Firm Performance. Journal of Business Research, Vol. 142, pp. 45-67. doi:10.1016/j.jbusres.2023.114321';
  cd.getElementById('parse-btn').click();
  const parseText = cd.getElementById('parse-results').textContent;
  t('智能导入标签中文化', /原始输入|重建为 APA 7/.test(parseText), parseText.slice(0, 80));
  t('智能导入条目/警告汇总中文化', /条目|解析警告|剩余问题/.test(parseText), parseText.slice(0, 120));

  console.log('\n=== 4. 生成器页警告本地化 ===');
  const e = load('tools/apa7-citation.html'); await ready(e.dom);
  const ew = e.dom.window, ed = e.dom.window.document;
  ew.localStorage.setItem('dt-lang', 'zh');
  ew.dispatchEvent(new ew.CustomEvent('dt:langchange', { detail: { lang: 'zh' } }));
  ed.querySelector('form').dispatchEvent(new ew.Event('submit', { bubbles: true, cancelable: true }));
  const warn = ed.getElementById('warnings').textContent;
  t('生成器警告中文化', /未填|无警告/.test(warn), warn.slice(0, 90));

  console.log('\n=== 5. 覆盖率：每个 data-i18n 都有中文 ===');
  const DIRS = ['index.html','about.html','contact.html','privacy.html','free/apa7-checklist.html',
    'guides/apa6-to-apa7.html','guides/apa7-dissertations.html','guides/apa7-in-text-citations.html',
    'guides/apa7-reference-list.html','guides/dba-literature-review-workflow.html','guides/title-case-problem.html',
    'tools/apa7-citation.html','tools/reference-check.html'];
  let total = 0, missing = [];
  for (const rel of DIRS) {
    const x = load(rel, false);
    const nodes = x.dom.window.document.querySelectorAll('[data-i18n]');
    const map = JSON.parse(fs.readFileSync(path.join(SITE, 'assets/js/i18n-data.js'), 'utf8')
      .replace(/^.*?window\.I18N_DATA = /s, '').replace(/;\s*$/, ''));
    for (const n of nodes) {
      total++;
      const key = n.getAttribute('data-i18n');
      const zhText = map.pages[rel] && map.pages[rel][key];
      if (!zhText) missing.push(rel + ':' + key);
    }
  }
  t(`中文覆盖 ${total} 块无遗漏`, missing.length === 0, missing.slice(0, 8).join(', '));

  console.log('\n=== 6. 零外部请求检查 ===');
  for (const rel of ['index.html', 'tools/reference-check.html']) {
    const x = load(rel, false);
    const html = fs.readFileSync(path.join(SITE, rel), 'utf8');
    // Only script/style/font/image loads count. Canonical and inline links
    // to our own host are navigation, not runtime dependencies.
    const remote = (html.match(/<(?:script|link|img|iframe)[^>]+(?:src|href)="https?:\/\/[^"]+"/g) || [])
      .filter(s => !s.includes('doctoral-toolbox.app.workbuddy.host'));
    t(rel + ' 无外部脚本/样式', remote.length === 0, remote.join(', '));
  }

  console.log(`\n结果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
