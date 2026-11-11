/*
 * Messy-reference parser for Doctoral Toolbox.
 * Original deterministic implementation. No third-party code, no network.
 * Runs in the browser and in Node (also used by the Azure Functions prototype).
 *
 * It extracts structured fields from a pasted reference so the APA 7
 * formatter can rebuild it. It deliberately does NOT rewrite titles:
 * automatic sentence-case conversion destroys proper nouns and named
 * theoretical constructs. Titles are preserved and flagged instead.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RefParser = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function normalize(value) {
    return String(value == null ? '' : value)
      .replace(/\uFF0C/g, ', ').replace(/\u3002/g, '. ')
      .replace(/\uFF1B/g, '; ').replace(/\uFF1A/g, ': ')
      .replace(/\uFF08/g, '(').replace(/\uFF09/g, ')')
      .replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ').trim();
  }

  function hasFullWidth(value) {
    return /[\uFF0C\u3002\uFF1B\uFF1A\uFF08\uFF09]/.test(String(value));
  }

  function splitAuthors(text) {
    var t = clean(text).replace(/[,.\s]+$/, '');
    if (!t) return [];
    var formatted = /\s&\s|,\s*&/.test(t) ||
      /,\s+[A-Z][A-Za-z'-]{1,},\s*[A-Z]\./.test(t);
    var parts;
    if (formatted) {
      parts = t.replace(/\s*,?\s*&\s*/g, ', ')
               .replace(/\s+and\s+/gi, ', ')
               .split(/,\s+(?=[A-Z][A-Za-z'-]{1,},\s*[A-Z]\.?)|\s*;\s*/);
    } else if (t.indexOf(',') > -1) {
      parts = t.split(/\s*;\s*|\s+and\s+/i);
    } else {
      parts = [t];
    }
    return parts.map(function (p) {
      return clean(p).replace(/[,.\s]+$/, '');
    }).filter(Boolean);
  }

  function extractDate(text) {
    var re = /\(([^)]*(?:(?:19|20)\d{2}|n\.d\.|in press|advance online)[^)]*)\)/i;
    var m = text.match(re);
    if (m) {
      var inside = clean(m[1]);
      var ym = inside.match(/\b(?:19|20)\d{2}[a-z]?\b/);
      return {
        year: ym ? ym[0] : 'n.d.',
        date: /[,\s]/.test(inside) ? inside : '',
        start: m.index,
        end: m.index + m[0].length
      };
    }
    var bare = text.match(/\b(?:19|20)\d{2}\b/);
    return {
      year: bare ? bare[0] : 'n.d.',
      date: '',
      start: bare ? bare.index : -1,
      end: bare ? bare.index + 4 : -1
    };
  }

  function extractDoi(text) {
    var m = text.match(/(?:https?:\/\/(?:dx\.)?doi\.org\/|doi\s*[:.]\s*)(10\.\d{4,9}\/[^\s,;)]+)/i) ||
            text.match(/\b(10\.\d{4,9}\/[^\s,;)]+)/);
    if (!m) return { value: '', raw: '' };
    return { value: clean(m[1]).replace(/[.,;]+$/, ''), raw: m[0] };
  }

  function looksTitleCase(title) {
    var words = clean(title).split(' ').filter(function (w) { return /^[A-Z]/.test(w); });
    if (words.length < 4) return false;
    var caps = words.filter(function (w) {
      var letters = w.replace(/[^A-Za-z]/g, '');
      return letters.length > 1 && letters === letters.toUpperCase();
    });
    var titleCase = words.slice(1).filter(function (w) { return /^[A-Z]/.test(w); });
    return caps.length >= 3 || titleCase.length >= 2;
  }

  /* Protect abbreviation periods so ". " really means a sentence break. */
  function splitSentences(body) {
    return body
      .replace(/\bVol\./g, 'Vol@@').replace(/\bpp\./g, 'pp@@')
      .replace(/\bed\./g, 'ed@@').replace(/\bEd\./g, 'Ed@@')
      .replace(/\beds\./g, 'eds@@').replace(/\bNo\./g, 'No@@')
      .split(/\.\s+/)
      .map(function (s) { return clean(s.replace(/@@/g, '.')).replace(/\.+$/, ''); })
      .filter(Boolean);
  }

  function guessType(fields, remainder) {
    if (/\[[^\]]*(?:dissertation|thesis)[^\]]*\]/i.test(remainder)) return 'thesis';
    if (/\[[^\]]*(?:conference|presentation|paper presented)[^\]]*\]/i.test(remainder)) return 'conference';
    if (/\bIn\s+[A-Z]/.test(remainder) && fields.bookTitle) return 'chapter';
    if (fields.doi || fields.volume || fields.journal) return 'journal';
    if (fields.url && !fields.pages) return 'web';
    if (fields.edition || fields.publisher) return 'book';
    return 'journal';
  }

  function parseReference(input) {
    var raw = String(input == null ? '' : input).trim();
    var warnings = [];
    if (!raw) return { raw: '', fields: {}, warnings: ['Empty line.'], confidence: 0 };

    if (hasFullWidth(raw)) warnings.push('Full-width punctuation was normalised to ASCII for parsing.');
    var text = normalize(raw);

    var date = extractDate(text);
    var authorsText = date.start > 0
      ? clean(text.slice(0, date.start)).replace(/[.\s]+$/, '')
      : '';
    var remainder = date.end > 0 ? clean(text.slice(date.end)).replace(/^[.\s]+/, '') : text;

    var authors = splitAuthors(authorsText);
    if (date.start < 0) warnings.push('No date element found; (n.d.) will be used.');
    if (!authors.length) warnings.push('No author element found; check the source manually.');

    var doi = extractDoi(remainder);
    var body = remainder;
    if (doi.raw) body = body.replace(doi.raw, ' ');

    var urlMatch = body.match(/https?:\/\/[^\s,;)]+/i);
    var url = urlMatch ? clean(urlMatch[0]).replace(/[.,;]+$/, '') : '';
    if (urlMatch) body = body.replace(urlMatch[0], ' ');
    body = clean(body).replace(/[.\s]+$/, '');

    var chunks = splitSentences(body);
    var title = chunks.length ? chunks[0] : '';
    var source = chunks.length > 1 ? chunks.slice(1).join('. ') : '';

    if (looksTitleCase(title)) {
      warnings.push('Title looks like Title Case or ALL CAPS. APA 7 needs sentence case; review it manually.');
    }
    if (!title) warnings.push('No title could be identified.');

    var fields = {
      type: 'journal',
      authors: authors,
      year: date.year,
      date: date.date,
      title: title,
      journal: '', volume: '', issue: '', pages: '',
      doi: doi.value, url: url,
      edition: '', publisher: '', editors: '', bookTitle: '',
      site: '', workType: '', institution: '', database: '',
      conference: '', location: '',
      noDoiConfirmed: !doi.value
    };

    var volMatch = source.match(/,\s*(?:Vol\.?\s*)?(\d+)(?=\s*\(|\s*,|\s*\.|$)/);
    var spaceVolMatch = source.match(/\s+(\d+)\((\d+)\)\s*,\s*(\d+\s*[-–]\s*\d+)/);
    var issueMatch = source.match(/\((\d+)\)/);
    var pagesMatch = source.match(/(?:pp\.\s*)?(\d+\s*[-–]\s*\d+)/);
    var editionMatch = source.match(/\(([^)]*\bed\.[^)]*)\)/i) ||
                       remainder.match(/\(([^)]*\bed\.[^)]*)\)/i);

    if (editionMatch) {
      title = clean(title.replace(/\s*\([^)]*\bed\.[^)]*\)/i, ''));
      fields.title = title;
    }

    if (volMatch) {
      fields.volume = volMatch[1];
      var cut = source.indexOf(volMatch[0]);
      fields.journal = clean(source.slice(0, cut)).replace(/[,\s]+$/, '');
      if (issueMatch) fields.issue = issueMatch[1];
      if (pagesMatch) fields.pages = clean(pagesMatch[1]).replace(/\s/g, '');
    } else if (spaceVolMatch) {
      fields.volume = spaceVolMatch[1];
      fields.issue = spaceVolMatch[2];
      fields.pages = clean(spaceVolMatch[3]).replace(/\s/g, '');
      fields.journal = clean(source.slice(0, spaceVolMatch.index));
    } else if (editionMatch) {
      fields.edition = clean(editionMatch[1]);
      fields.publisher = clean(source.replace(editionMatch[0], '')).replace(/^[,\s]+|[.\s]+$/g, '');
    } else if (source) {
      fields.publisher = clean(source);
    }

    if (/\bIn\s+/.test(title) || /\bIn\s+[A-Z]/.test(remainder)) {
      fields.bookTitle = clean(source).replace(/^In\s+[^,]*,?\s*/i, '');
    }

    fields.type = guessType(fields, remainder);
    if (!fields.journal && !fields.publisher && !fields.url && !fields.doi) {
      warnings.push('Source element could not be confidently identified; the rebuild may be incomplete.');
    }
    if (!doi.value) {
      warnings.push('No DOI found. If the article has one, add it; otherwise end the entry at the page range.');
    }

    var filled = ['authors', 'year', 'title', 'journal', 'volume', 'pages', 'doi', 'publisher']
      .filter(function (k) { return fields[k] && (!Array.isArray(fields[k]) || fields[k].length); }).length;
    return {
      raw: raw,
      fields: fields,
      warnings: warnings,
      confidence: Math.min(1, filled / 6)
    };
  }

  function parseList(input) {
    return String(input == null ? '' : input)
      .split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean)
      .map(parseReference);
  }

  return {
    parseReference: parseReference,
    parseList: parseList,
    splitAuthors: splitAuthors,
    normalize: normalize
  };
});
