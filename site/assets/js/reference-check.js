/*
 * Heuristic APA 7 reference-list checker.
 * Original implementation written for this site. No third-party code.
 * Runs entirely in the browser; also loadable in Node for tests.
 * It flags likely formatting problems. It is not a substitute for
 * checking the current APA 7 manual or your institution's template.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RefCheck = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* The author element ends where the date element begins. Falling back
     to "first 60 characters" pulls title words such as "and" into the
     author region and produces false positives for (n.d.) entries. */
  function authorRegion(line) {
    var date = line.match(/\((?:\d{4}|n\.d\.|in press|advance online)/i);
    if (date) return line.slice(0, date.index);
    var close = line.indexOf(').');
    if (close > -1) return line.slice(0, close);
    return line.slice(0, 120);
  }

  var RULES = [
    {
      id: 'doi-prefix',
      severity: 'error',
      title: 'DOI is not a DOI URL',
      why: 'APA 7 presents every DOI as a live link beginning https://doi.org/.',
      fix: 'Replace "doi:10.xxxx/..." with "https://doi.org/10.xxxx/...".',
      test: function (line) {
        return /\bdoi\s*[:.]\s*10\./i.test(line) || /dx\.doi\.org/i.test(line);
      }
    },
    {
      id: 'retrieved-from',
      severity: 'warn',
      title: '"Retrieved from" is rarely correct',
      why: 'APA 7 drops "Retrieved from" unless the content is designed to change and a retrieval date is genuinely needed.',
      fix: 'Delete the phrase and keep the bare URL, or add a retrieval date only for archival/dynamic sources.',
      test: function (line) { return /retrieved from/i.test(line); }
    },
    {
      id: 'and-in-authors',
      severity: 'error',
      title: 'Authors joined with "and"',
      why: 'APA 7 joins the final two authors with an ampersand in the reference list.',
      fix: 'Use ", & " before the last author. Use "and" only in narrative in-text citations.',
      test: function (line) { return /\band\b/i.test(authorRegion(line)); }
    },
    {
      id: 'et-al-in-list',
      severity: 'error',
      title: '"et al." in a reference list',
      why: 'Reference lists enumerate up to 20 authors in full. "et al." belongs to in-text citations.',
      fix: 'List all authors (first 19, an ellipsis, then the final author when there are 21 or more).',
      test: function (line) { return /\bet al\./i.test(line); }
    },
    {
      id: 'pp-in-journal',
      severity: 'warn',
      title: '"pp." before a page range',
      why: 'APA 7 uses "pp." only for book chapters and edited-book entries, not journal articles.',
      fix: 'Write the journal page range directly: 12(3), 45-67.',
      test: function (line) { return /\bpp\.\s*\d/i.test(line); }
    },
    {
      id: 'vol-word',
      severity: 'error',
      title: 'Volume written as "Vol."',
      why: 'APA 7 writes the volume number directly after the journal title, with no label.',
      fix: 'Use "Journal of Applied Research, 18, 45-67" and italicise the 18.',
      test: function (line) { return /\bVol(?:ume)?\.?\s*\d/i.test(line); }
    },
    {
      id: 'missing-year',
      severity: 'error',
      title: 'No parenthesised year found',
      why: 'Every APA 7 reference places the year in parentheses after the author element.',
      fix: 'Add "(2024)" or "(n.d.)" immediately after the authors.',
      test: function (line) { return !/\((?:\d{4}[a-z]?|n\.d\.|in press|advance online publication)/i.test(line); }
    },
    {
      id: 'all-caps-title',
      severity: 'warn',
      title: 'Title may be in Title Case or ALL CAPS',
      why: 'APA 7 reference titles use sentence case; only proper nouns keep capitals.',
      fix: 'Lowercase everything after the first word and after a colon, except proper nouns.',
      test: function (line) {
        var m = line.match(/\)\.\s*(.+?)(?:\.\s|$)/);
        if (!m) return false;
        var words = m[1].split(/\s+/).filter(function (w) { return /^[A-Z]/.test(w); });
        var caps = words.filter(function (w) {
          return w.length > 1 && w.replace(/[^A-Za-z]/g, '') === w.replace(/[^A-Za-z]/g, '').toUpperCase();
        });
        return words.length >= 4 && caps.length >= 3;
      }
    },
    {
      id: 'ampersand-no-comma',
      severity: 'warn',
      title: 'Ampersand may be missing its preceding comma',
      why: 'APA 7 requires a comma before "&" whenever three or more authors are listed.',
      fix: 'Write "Smith, J. A., Lee, B., & Chen, C."',
      test: function (line) { return /[^\s,]\s&\s/.test(authorRegion(line)); }
    },
    {
      id: 'double-space',
      severity: 'warn',
      title: 'Double space detected',
      why: 'APA 7 uses one space after punctuation throughout the reference list.',
      fix: 'Collapse repeated spaces.',
      test: function (line) { return /\S {2,}\S/.test(line); }
    },
    {
      id: 'fullwidth-punctuation',
      severity: 'error',
      title: 'Full-width punctuation detected',
      why: 'English-language reference lists use half-width punctuation; full-width marks break citation parsers.',
      fix: 'Replace Chinese punctuation with ASCII commas, periods and parentheses.',
      test: function (line) { return /[\uFF0C\u3002\uFF1B\uFF1A\uFF08\uFF09]/.test(line); }
    },
    {
      id: 'period-after-url',
      severity: 'warn',
      title: 'Period after a URL or DOI',
      why: 'APA 7 adds no terminal period after a URL or DOI because it can break the link.',
      fix: 'Remove the final period after the link.',
      test: function (line) { return /https?:\/\/\S+\.\s*$/i.test(line); }
    },
    {
      id: 'available-from',
      severity: 'warn',
      title: '"Available from" is not APA 7 wording',
      why: 'This wording belongs to other styles such as Vancouver.',
      fix: 'Use the bare URL, or the database name for a dissertation.',
      test: function (line) { return /available from|accessed on/i.test(line); }
    },
    {
      id: 'no-final-period',
      severity: 'warn',
      title: 'Entry may be missing its terminal period',
      why: 'Entries without a link end with a period.',
      fix: 'Add a period after the final element, unless the entry ends with a URL or DOI.',
      test: function (line) {
        return !/https?:\/\//i.test(line) && !/[.?!]$/.test(line);
      }
    }
  ];

  /* Optional lang: 'en' (default) or 'zh'. The rule engine is identical;
     only the wording of title/fix is localised. Node tests omit lang and
     therefore keep the original English strings. */
  var MSG_MAP = {
    'doi-prefix': 'doiNotUrl',
    'retrieved-from': 'retrievedFrom',
    'and-in-authors': 'andAuthors',
    'et-al-in-list': 'etAlInList',
    'pp-in-journal': 'ppBeforePages',
    'vol-word': 'volLabel',
    'missing-year': 'noYear',
    'all-caps-title': 'titleCase',
    'ampersand-no-comma': 'missingComma',
    'double-space': 'doubleSpace',
    'fullwidth-punctuation': 'fullWidth',
    'period-after-url': 'periodAfterUrl',
    'available-from': 'availableFrom'
  };

  function check(input, lang) {
    var lines = String(input == null ? '' : input)
      .split(/\r?\n/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    var issues = [];
    lines.forEach(function (line, index) {
      RULES.forEach(function (rule) {
        var hit = false;
        try { hit = !!rule.test(line); } catch (e) { hit = false; }
        if (hit) {
          var title = rule.title, fix = rule.fix;
          if (lang === 'zh' && typeof window !== 'undefined' && window.DT_MSGS) {
            var m = window.DT_MSGS.rule(MSG_MAP[rule.id]);
            if (m) { title = m.title; fix = m.fix; }
          }
          issues.push({
            line: index + 1,
            id: rule.id,
            severity: rule.severity,
            title: title,
            why: rule.why,
            fix: fix,
            excerpt: line.length > 160 ? line.slice(0, 160) + '...' : line
          });
        }
      });
    });
    var errors = issues.filter(function (i) { return i.severity === 'error'; }).length;
    var warnings = issues.filter(function (i) { return i.severity === 'warn'; }).length;
    return {
      lines: lines.length,
      issues: issues,
      errors: errors,
      warnings: warnings,
      clean: issues.length === 0,
      ruleCount: RULES.length
    };
  }

  return { RULES: RULES, check: check };
});
