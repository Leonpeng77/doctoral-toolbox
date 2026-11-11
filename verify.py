#!/usr/bin/env python3
"""Measured checks for the Doctoral Toolbox static site.

Runs from the project root:  python3 verify.py
Prints real results, exits 1 if any check fails.
"""
import functools
import html.parser
import http.server
import json
import os
import pathlib
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
SITE = ROOT / "site"
JS_DIR = SITE / "assets" / "js"

results = []


def record(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    mark = "PASS" if ok else "FAIL"
    print(f"[{mark}] {name}" + (f"  -> {detail}" if detail else ""))


class VisibleText(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "head"):
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style", "head") and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def visible_words(path):
    parser = VisibleText()
    parser.feed(path.read_text(encoding="utf-8"))
    return len(re.findall(r"[A-Za-z][A-Za-z'-]*", " ".join(parser.parts)))


def run_node_test():
    if not shutil.which("node"):
        record("Node functional assertions", False, "node not found on PATH")
        return
    apa = json.dumps(str(JS_DIR / "apa7.js"))
    ref = json.dumps(str(JS_DIR / "reference-check.js"))
    parser = json.dumps(str(JS_DIR / "reference-parser.js"))
    js = r"""
const assert = require('assert');
const A = require(%s);
const R = require(%s);
const P = require(%s);
let n = 0;
function t(f) { f(); n++; }

t(() => assert.strictEqual(
  A.formatAuthors('Smith, John A.\nLee, B.'),
  'Smith, J. A., & Lee, B.'));

t(() => assert.strictEqual(
  A.formatAuthors('Smith, John A.\nLee, B.\nChen, C.'),
  'Smith, J. A., Lee, B., & Chen, C.'));

t(() => assert.strictEqual(A.formatAuthorName('John A. Smith'), 'Smith, J. A.'));
t(() => assert.strictEqual(A.formatAuthorName('Smith, Jean-Luc'), 'Smith, J.-L.'));

const many = Array.from({length: 21}, (_, i) => 'Author' + i + ', Given' + i);
t(() => {
  const s = A.formatAuthors(many);
  assert.ok(s.includes('...'), '21-author ellipsis missing');
  assert.ok(!s.includes('&'), 'ampersand must not appear for 21+ authors');
});

t(() => assert.strictEqual(A.normalizeDoi('doi:10.1234/abc'), 'https://doi.org/10.1234/abc'));
t(() => assert.strictEqual(A.normalizeDoi('https://dx.doi.org/10.1/x'), 'https://doi.org/10.1/x'));
t(() => assert.strictEqual(A.normalizeDoi('https://doi.org/10.9/z'), 'https://doi.org/10.9/z'));

const journal = A.formatReference({
  type: 'journal', authors: 'Smith, John A.\nLee, B.', year: '2024',
  title: 'Dynamic capabilities and firm performance',
  journal: 'Journal of Business Research', volume: '142', issue: '3',
  pages: '45-67', doi: '10.1016/j.jbusres.2023.114321'
});
t(() => assert.strictEqual(journal.text,
  'Smith, J. A., & Lee, B. (2024). Dynamic capabilities and firm performance. ' +
  'Journal of Business Research, 142(3), 45-67. ' +
  'https://doi.org/10.1016/j.jbusres.2023.114321'));
t(() => assert.ok(journal.html.includes('<em>142</em>'), 'volume must be italic'));
t(() => assert.strictEqual(journal.warnings.length, 0, 'unexpected warnings on valid journal entry'));

const book = A.formatReference({
  type: 'book', authors: 'Smith, John A.', year: '2020',
  title: 'Doing doctoral research well', edition: '2nd ed.', publisher: 'Sage'
});
t(() => assert.ok(book.html.includes('<em>Doing doctoral research well</em>')));
t(() => assert.ok(book.text.includes('(2nd ed.). Sage.')));

const messy = [
  'Smith, J. A. and Lee, B. (2024). Dynamic Capabilities And Firm Performance. Journal of Business Research, Vol. 142, pp. 45-67. doi:10.1016/j.jbusres.2023.114321',
  'Chen, C., Wang, L., et al. (2023).  AI  GOVERNANCE  AND  PUBLIC  SECTOR  INNOVATION. Public Administration Review, 83(2), 301-315. https://doi.org/10.1111/puar.13620',
  'American Psychological Association. (2020). Publication manual. Retrieved from https://apastyle.apa.org/manual.',
  'Zhang, W. (2022)。企业社会责任与财务绩效。管理世界，38（4），55-70。',
  'Brown, T. (2021). Open data in government. Government Information Quarterly, 38, 101-112.',
  "Garcia, M., & O'Neill, P. (2022) Leadership and trust. Journal of Management 48(1), 12-30."
].join('\n');
const report = R.check(messy);
t(() => assert.ok(report.errors >= 3, 'expected >=3 errors, got ' + report.errors));
t(() => assert.ok(report.warnings >= 3, 'expected >=3 warnings, got ' + report.warnings));
t(() => assert.strictEqual(report.lines, 6));

const clean = R.check('Smith, J. A., & Lee, B. (2024). Dynamic capabilities and firm performance. Journal of Business Research, 142(3), 45-67. https://doi.org/10.1016/j.jbusres.2023.114321');
t(() => assert.strictEqual(clean.errors, 0, 'clean entry flagged as error'));
t(() => assert.strictEqual(clean.warnings, 0, 'clean entry flagged as warning'));

t(() => assert.strictEqual(A.formatAuthors('Smith, J. A., & Lee, B.'), 'Smith, J. A., & Lee, B.'));
t(() => assert.strictEqual(A.formatAuthors('Smith, J. A., Lee, B., & Chen, C.'),
  'Smith, J. A., Lee, B., & Chen, C.'));
t(() => assert.strictEqual(A.formatAuthors('American Psychological Association'),
  'American Psychological Association'));
t(() => assert.strictEqual(R.check('Smith, J. A. (n.d.). Leadership and trust. Journal of Management, 48(1), 12-30.').errors, 0,
  '(n.d.) entry must not inherit "and" from the title'));

const p1 = P.parseReference('Smith, J. A. and Lee, B. (2024). Dynamic Capabilities And Firm Performance. Journal of Business Research, Vol. 142, pp. 45-67. doi:10.1016/j.jbusres.2023.114321');
t(() => assert.strictEqual(p1.fields.volume, '142'));
t(() => assert.strictEqual(p1.fields.pages, '45-67'));
t(() => assert.strictEqual(p1.fields.doi, '10.1016/j.jbusres.2023.114321'));
t(() => assert.ok(p1.warnings.some(w => /sentence case/i.test(w))));
const p2 = P.parseReference("Garcia, M., & O'Neill, P. (2022) Leadership and trust. Journal of Management 48(1), 12-30.");
t(() => assert.strictEqual(p2.fields.volume, '48'));
t(() => assert.strictEqual(p2.fields.issue, '1'));
const p3 = P.parseReference('American Psychological Association. (2020). Publication manual (7th ed.). APA.');
t(() => assert.strictEqual(p3.fields.title, 'Publication manual'));
t(() => assert.strictEqual(A.formatReference(p3.fields).text,
  'American Psychological Association (2020). Publication manual (7th ed.). APA.'));

console.log('NODE_ASSERTIONS=' + n);
console.log('AUDIT_ERRORS=' + report.errors + ' AUDIT_WARNINGS=' + report.warnings + ' RULES=' + report.ruleCount);
""" % (apa, ref, parser)
    proc = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    if proc.returncode != 0:
        record("Node functional assertions", False, proc.stderr.strip().splitlines()[-1] if proc.stderr.strip() else f"exit {proc.returncode}")
        return
    detail = " | ".join(x for x in proc.stdout.strip().splitlines())
    record("Node functional assertions", True, detail)


def syntax_checks():
    if not shutil.which("node"):
        record("JS syntax", False, "node not found on PATH")
        return
    for name in ("apa7.js", "reference-check.js", "reference-parser.js"):
        proc = subprocess.run(["node", "--check", str(JS_DIR / name)], capture_output=True, text=True)
        record(f"JS syntax: {name}", proc.returncode == 0, proc.stderr.strip()[:160])


def link_check():
    html_files = sorted(SITE.rglob("*.html"))
    pattern = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.I)
    checked = 0
    broken = []
    for page in html_files:
        for raw in pattern.findall(page.read_text(encoding="utf-8")):
            target = raw.strip()
            if (not target or target.startswith(("#", "http://", "https://", "//", "mailto:", "data:", "javascript:"))):
                continue
            target = target.split("#", 1)[0].split("?", 1)[0]
            if not target:
                continue
            checked += 1
            resolved = (page.parent / target).resolve()
            if not resolved.exists():
                broken.append(f"{page.relative_to(SITE)} -> {raw}")
    record("Internal links / asset paths", not broken,
           f"{checked} relative links checked, {len(broken)} broken" + (": " + "; ".join(broken[:4]) if broken else ""))


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def http_checks():
    handler = functools.partial(QuietHandler, directory=str(SITE))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    targets = sorted(p for p in SITE.rglob("*") if p.is_file())
    failures = []
    try:
        for path in targets:
            rel = path.relative_to(SITE).as_posix()
            url = f"http://127.0.0.1:{port}/{rel}"
            try:
                with urllib.request.urlopen(url, timeout=5) as resp:
                    if resp.status != 200 or not resp.read(1):
                        failures.append(f"{rel}: status {resp.status} / empty")
            except (urllib.error.URLError, OSError) as exc:
                failures.append(f"{rel}: {exc}")
    finally:
        server.shutdown()
        server.server_close()
    record("Local HTTP 200 for every file", not failures,
           f"{len(targets)} files served" + (": " + "; ".join(failures[:4]) if failures else ""))


def content_checks():
    for guide in sorted((SITE / "guides").glob("*.html")):
        count = visible_words(guide)
        record(f"Guide word count: {guide.name}", count >= 600,
               f"{count} visible English words (threshold 600)")
    for tool in sorted((SITE / "tools").glob("*.html")):
        count = visible_words(tool)
        record(f"Tool page word count: {tool.name}", count >= 600,
               f"{count} visible English words (threshold 600)")
    notices = (SITE / "NOTICE.txt").exists()
    record("NOTICE.txt present", notices)


def runtime_dependency_check():
    patterns = [
        re.compile(r'<script[^>]+src\s*=\s*["\']https?://', re.I),
        re.compile(r'<link[^>]+stylesheet[^>]+href\s*=\s*["\']https?://', re.I),
        re.compile(r'<img[^>]+src\s*=\s*["\']https?://', re.I),
        re.compile(r'@import\s+url\(\s*["\']?https?://', re.I),
        re.compile(r'url\(\s*["\']?https?://', re.I),
    ]
    hits = []
    files = 0
    for path in SITE.rglob("*"):
        if not path.is_file() or path.suffix not in (".html", ".css", ".js"):
            continue
        files += 1
        for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if any(p.search(line) for p in patterns):
                hits.append(f"{path.relative_to(SITE)}:{i}")
    record("Zero external runtime resources", not hits,
           f"{files} html/css/js files scanned, {len(hits)} remote loads"
           + (": " + ", ".join(hits[:4]) if hits else ""))


def placeholder_report():
    stale = []
    mail = []
    for path in SITE.rglob("*"):
        if path.is_file() and path.suffix in (".html", ".xml", ".txt", ".md"):
            for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                loc = f"{path.relative_to(SITE)}:{i}"
                if "https://yourdomain.com" in line:
                    stale.append(loc)
                elif "yourdomain.com" in line:
                    mail.append(loc)
    print(f"[INFO] Domain placeholders remaining: {len(stale)} across "
          f"{len(set(h.split(':')[0] for h in stale))} files")
    print(f"[INFO] Contact email placeholders remaining: {len(mail)}")
    if stale:
        print("       " + ", ".join(stale[:8]) + (" ..." if len(stale) > 8 else ""))


def azure_checks():
    test_file = ROOT / "azure" / "tests" / "run.js"
    proc = subprocess.run(["node", str(test_file)], capture_output=True, text=True)
    record("Azure shared handler assertions", proc.returncode == 0,
           proc.stdout.strip().replace("\n", " | ") or proc.stderr.strip()[:160])

    if not shutil.which("node"):
        record("Azure local API HTTP contract", False, "node not found on PATH")
        return
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    env = dict(os.environ, PORT=str(port))
    server = subprocess.Popen(["node", str(ROOT / "azure" / "local-server.js")],
                              env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    base = f"http://127.0.0.1:{port}"
    try:
        ready = False
        for _ in range(30):
            try:
                with urllib.request.urlopen(base + "/api/health", timeout=1) as resp:
                    health = json.load(resp)
                    ready = health.get("status") == "ok" and health.get("mode") == "local"
                    break
            except (urllib.error.URLError, OSError, ValueError):
                time.sleep(0.1)
        record("Azure local API /api/health", ready,
               "status=ok mode=local rules=" + str(health.get("rules")) if ready else "server did not become ready")
        if not ready:
            return
        payload = json.dumps({"text":
            "Smith, J. A. and Lee, B. (2024). Dynamic Capabilities And Firm Performance. "
            "Journal of Business Research, Vol. 142, pp. 45-67. doi:10.1016/j.jbusres.2023.114321\n"
            "American Psychological Association. (2020). Publication manual (7th ed.). APA."
        }).encode("utf-8")
        request = urllib.request.Request(base + "/api/parse", data=payload,
                                         headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(request, timeout=5) as resp:
            parsed = json.load(resp)
        ok = (parsed["summary"]["count"] == 2 and
              parsed["entries"][0]["formatted"].startswith("Smith, J. A., & Lee, B. (2024).") and
              parsed["entries"][1]["formatted"].startswith("American Psychological Association"))
        record("Azure local API /api/parse", ok,
               "count=" + str(parsed["summary"]["count"]) +
               " avgConfidence=" + str(parsed["summary"]["averageConfidence"]) +
               " residualIssues=" + str(parsed["summary"]["issues"]))
    finally:
        server.terminate()
        try:
            server.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server.kill()


def seo_checks():
    problems = []
    seen_titles = {}
    pages = [p for p in sorted(SITE.rglob("*.html")) if p.name != "404.html"]
    for page in pages:
        text = page.read_text(encoding="utf-8")
        name = page.relative_to(SITE).as_posix()
        if '<link rel="canonical"' not in text:
            problems.append(name + ": missing canonical")
        if '<meta name="description"' not in text:
            problems.append(name + ": missing meta description")
        if 'privacy.html' not in text:
            problems.append(name + ": privacy policy not reachable")
        title = re.search(r"<title>(.*?)</title>", text, re.S)
        if not title:
            problems.append(name + ": missing title")
        else:
            seen_titles.setdefault(title.group(1).strip(), []).append(name)
    for title, owners in seen_titles.items():
        if len(owners) > 1:
            problems.append("duplicate title: " + title)
    record("SEO / policy essentials", not problems,
           f"{len(pages)} indexable pages checked, {len(problems)} problems"
           + (": " + "; ".join(problems[:4]) if problems else ""))


def deliverable_check():
    """The lead-magnet PDF must be buildable and contain every checklist item."""
    md = ROOT / "products" / "apa7-submission-checklist.md"
    build = ROOT / "build_pdf.py"
    if not md.exists() or not build.exists():
        record("Lead-magnet PDF build", False, "source Markdown or build script missing")
        return
    expected = len(re.findall(r"^- \[ \] ", md.read_text(encoding="utf-8"), re.M))
    venv_py = ROOT / ".buildenv" / "bin" / "python"
    if not venv_py.exists():
        record("Lead-magnet PDF build", False, ".buildenv missing - run build_pdf.py setup")
        return
    proc = subprocess.run([str(venv_py), str(build)], capture_output=True, text=True)
    if proc.returncode != 0:
        record("Lead-magnet PDF build", False, proc.stderr.strip().splitlines()[-1][:160])
        return
    pdf = ROOT / "products" / "dist" / "apa7-submission-checklist.pdf"
    try:
        from pypdf import PdfReader  # available inside .buildenv, not system python
        sys.path.insert(0, str(ROOT / ".buildenv" / "lib" / "python3.13" / "site-packages"))
        from pypdf import PdfReader as Reader
        reader = Reader(str(pdf))
        text = "".join(p.extract_text() for p in reader.pages)
        boxes = text.count("[ ]")
        ok = boxes == expected and len(reader.pages) >= 2
        record("Lead-magnet PDF build", ok,
               f"{len(reader.pages)} pages, {boxes}/{expected} checks, " +
               f"{pdf.stat().st_size:,} bytes")
    except Exception as exc:
        record("Lead-magnet PDF build", pdf.exists(),
               f"built but text check unavailable ({type(exc).__name__})")


def i18n_check():
    """Chinese dictionary must cover every data-i18n marker in every page."""
    import importlib.util
    data_js = SITE / "assets" / "js" / "i18n-data.js"
    zh_py = ROOT / "i18n-zh.py"
    runtime = SITE / "assets" / "js" / "i18n-runtime.js"
    if not (data_js.exists() and zh_py.exists() and runtime.exists()):
        record("Bilingual dictionary", False, "i18n-data.js / i18n-zh.py / i18n-runtime.js missing")
        return
    try:
        spec = importlib.util.spec_from_file_location("i18n_zh_local", zh_py)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
    except Exception as exc:
        record("Bilingual dictionary", False, f"translation module error: {exc}")
        return

    total = 0
    missing = []
    pages_with_script = 0
    for page in sorted(SITE.rglob("*.html")):
        rel = page.relative_to(SITE).as_posix()
        source = page.read_text(encoding="utf-8")
        keys = re.findall(r'data-i18n="([^"]+)"', source)
        if "i18n.js" in source:
            pages_with_script += 1
            # Every page must load the local runtime; never a remote one.
            for src in re.findall(r'<script src="([^"]*i18n[^"]*)"', source):
                if src.startswith("http"):
                    missing.append(f"{rel}: remote i18n script")
                elif not (page.parent / src).resolve().exists():
                    missing.append(f"{rel}: missing script {src}")
        have = mod.PAGES.get(rel, {})
        for key in keys:
            total += 1
            if not have.get(key):
                missing.append(f"{rel}:{key}")
    ok = not missing and pages_with_script >= 13
    record("Bilingual dictionary", ok,
           f"{total} markers across {pages_with_script} pages, "
           f"{sum(len(v) for v in mod.PAGES.values())} translations" +
           (": " + ", ".join(missing[:5]) if missing else ""))


def prelaunch_check():
    hits = []
    for path in SITE.rglob("*"):
        if path.is_file() and path.suffix in (".html", ".xml", ".txt"):
            for line in path.read_text(encoding="utf-8").splitlines():
                if "https://yourdomain.com" in line:
                    hits.append(path.relative_to(SITE).as_posix())
    unique = sorted(set(hits))
    record("PRELAUNCH: canonical/sitemap domain replaced", not unique,
           f"{len(hits)} stale domain references in {len(unique)} files" +
           (": " + ", ".join(unique[:5]) if unique else ""))
    contact = (SITE / "contact.html").read_text(encoding="utf-8")
    real_email = "mailto:" in contact and "contact@yourdomain.com" not in contact
    record("PRELAUNCH: real contact email present", real_email,
           "mailto link present, no placeholder" if real_email
           else "placeholder email or missing mailto link")


def main():
    print("=" * 68)
    print("Doctoral Toolbox - measured verification")
    print("=" * 68)
    syntax_checks()
    run_node_test()
    link_check()
    http_checks()
    runtime_dependency_check()
    content_checks()
    seo_checks()
    i18n_check()
    deliverable_check()
    azure_checks()
    placeholder_report()
    if "--prelaunch" in sys.argv:
        print("-" * 68)
        print("STRICT PRELAUNCH MODE")
        prelaunch_check()
    passed = sum(1 for _, ok, _ in results if ok)
    failed = len(results) - passed
    print("-" * 68)
    print(f"RESULT: {passed} passed, {failed} failed, {len(results)} checks total")
    print("=" * 68)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
