/*
 * APA 7 reference formatter.
 * Original implementation written for this site. No third-party code.
 * Runs entirely in the browser; also loadable in Node for tests.
 * Scope: the six reference types most often needed in doctoral writing.
 * It does not attempt to guess sentence case for titles (see warnings).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.APA7 = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var TYPE_LABELS = {
    journal: 'Journal article',
    book: 'Book',
    chapter: 'Book chapter',
    web: 'Web page',
    thesis: 'Doctoral dissertation / thesis',
    conference: 'Conference presentation'
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clean(value) {
    return String(value == null ? '' : value).trim().replace(/\s+/g, ' ');
  }

  function ensurePeriod(value) {
    var s = clean(value);
    if (!s) return '';
    return /[.?!]$/.test(s) ? s : s + '.';
  }

  function toInitial(token) {
    if (/^[A-Za-z]\.$/.test(token)) return token.toUpperCase();
    if (/^[A-Za-z]$/.test(token)) return token.toUpperCase() + '.';
    if (token.indexOf('-') > -1) {
      return token.split('-').map(function (part) {
        return part ? part.charAt(0).toUpperCase() + '.' : '';
      }).join('-');
    }
    return token.charAt(0).toUpperCase() + '.';
  }

  function initials(given) {
    return clean(given).split(' ').filter(Boolean).map(toInitial).join(' ');
  }

  /* Accepts "Smith, John A.", "John A. Smith" and "Smith, J. A.".
     Compound surnames and suffixes are not decomposed: enter them in
     "Surname, Given" form when they occur. */
  function formatAuthorName(raw) {
    var name = clean(raw);
    if (!name) return '';
    var comma = name.indexOf(',');
    if (comma > -1) {
      var surname = name.slice(0, comma).trim();
      var given = name.slice(comma + 1).trim();
      return surname + (given ? ', ' + initials(given) : '');
    }
    var words = name.split(' ');
    if (words.length === 1) return words[0];
    /* Corporate authors (e.g. "American Psychological Association")
       must stay verbatim. A personal name in "Given Surname" order
       always carries an initial such as "A.", which organisations do not. */
    var hasInitial = words.some(function (w) { return /^[A-Z]\.$/.test(w); });
    if (!hasInitial && words.length >= 3) return name;
    var last = words.pop();
    return last + ', ' + initials(words.join(' '));
  }

  /* Accepts one author per line (preferred), and also tolerates an
     already-formatted string such as "Smith, J. A., & Lee, B." pasted
     back from a reference list. Without the ampersand split, that whole
     string would be parsed as a single author and mangled into initials. */
  function parseAuthors(raw) {
    if (Array.isArray(raw)) return raw;
    var lines = String(raw == null ? '' : raw)
      .split(/[\r\n;]+/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    var out = [];
    lines.forEach(function (line) {
      var alreadyFormatted = /\s&\s|,\s*&/.test(line) ||
        /,\s+[A-Z][A-Za-z'-]{1,},\s*[A-Z]\./.test(line);
      if (!alreadyFormatted) { out.push(line); return; }
      var normalised = line.replace(/\s*,?\s*&\s*/g, ', ').replace(/,\s*$/, '');
      normalised.split(/,\s+(?=[A-Z][A-Za-z'-]{1,},\s*[A-Z]\.)/)
        .forEach(function (part) {
          var name = part.trim().replace(/,\s*$/, '').trim();
          if (name) out.push(name);
        });
    });
    return out;
  }

  /* APA 7: 1 author; 2 authors joined by ", & "; 3-20 joined with a
     serial comma and "&"; 21+ list the first 19, an ellipsis, then the
     last author (no ampersand). */
  function formatAuthors(raw) {
    var names = parseAuthors(raw).map(formatAuthorName).filter(Boolean);
    if (!names.length) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + ', & ' + names[1];
    if (names.length <= 20) {
      return names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1];
    }
    return names.slice(0, 19).join(', ') + ', ... ' + names[names.length - 1];
  }

  function normalizeDoi(value) {
    var s = clean(value);
    if (!s) return '';
    s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
         .replace(/^doi\s*:\s*/i, '')
         .trim();
    return s ? 'https://doi.org/' + s : '';
  }

  function looksLikeShouting(title) {
    var words = clean(title).split(' ').filter(function (w) {
      return /^[A-Z]/.test(w);
    });
    var caps = words.filter(function (w) {
      return w === w.toUpperCase() && /[A-Z]{2,}/.test(w.replace(/[^A-Za-z]/g, ''));
    });
    return words.length >= 4 && caps.length >= 3;
  }

  function formatReference(data) {
    var d = data || {};
    var type = TYPE_LABELS[d.type] ? d.type : 'journal';
    var authors = formatAuthors(d.authors);
    var year = clean(d.year) || 'n.d.';
    var title = clean(d.title);
    var warnings = [];
    var lead = (authors ? authors + ' ' : '') + '(' + year + ').';
    var middle = '';
    var middleHtml = '';
    var tail = '';
    var tailHtml = '';
    var url = '';

    if (!authors) warnings.push('No author entered. For a missing author, APA 7 moves the title to the author position.');
    if (!clean(d.year)) warnings.push('No year entered, so the reference uses (n.d.). Confirm the source really has no date.');
    if (!title) warnings.push('No title entered.');
    if (title && looksLikeShouting(title)) {
      warnings.push('The title looks like Title Case or ALL CAPS. APA 7 reference titles use sentence case; review it manually.');
    }

    if (type === 'journal') {
      var journal = clean(d.journal);
      var volume = clean(d.volume);
      var issue = clean(d.issue);
      var pages = clean(d.pages);
      middle = ensurePeriod(title);
      middleHtml = esc(middle);
      var source = journal;
      if (volume) source += ', ' + volume;
      if (issue) source += '(' + issue + ')';
      if (pages) source += ', ' + pages;
      tail = ensurePeriod(source);
      var sourceHtml = esc(journal);
      if (volume) sourceHtml += ', <em>' + esc(volume) + '</em>';
      if (issue) sourceHtml += '(' + esc(issue) + ')';
      if (pages) sourceHtml += ', ' + esc(pages);
      tailHtml = sourceHtml + '.';
      url = normalizeDoi(d.doi);
      if (!url && !d.noDoiConfirmed) {
        warnings.push('No DOI supplied. If the article has one, add it. If it has no DOI and came from an academic database, end the reference at the page range with no URL.');
      }
    } else if (type === 'book') {
      var edition = clean(d.edition);
      var publisher = clean(d.publisher);
      var plain = lead + ' ' + title + (edition ? ' (' + edition + ')' : '') + '. ' + ensurePeriod(publisher);
      var rich = esc(lead) + ' <em>' + esc(title) + '</em>' +
        (edition ? ' (' + esc(edition) + ')' : '') + '. ' + esc(ensurePeriod(publisher));
      if (!publisher) warnings.push('Enter a publisher. APA 7 no longer includes the publisher location.');
      return finish(plain, rich);
    } else if (type === 'chapter') {
      var editors = clean(d.editors);
      var bookTitle = clean(d.bookTitle);
      var chapPages = clean(d.pages);
      var chapPublisher = clean(d.publisher);
      var plain = lead + ' ' + ensurePeriod(title) + ' In ' + (editors || 'E. Editor') +
        ' (Ed.), ' + bookTitle + (chapPages ? ' (pp. ' + chapPages + ')' : '') + '. ' + ensurePeriod(chapPublisher);
      var rich = esc(lead) + ' ' + esc(ensurePeriod(title)) + ' In ' + esc(editors || 'E. Editor') +
        ' (Ed.), <em>' + esc(bookTitle) + '</em>' + (chapPages ? ' (pp. ' + esc(chapPages) + ')' : '') + '. ' + esc(ensurePeriod(chapPublisher));
      if (!bookTitle) warnings.push('Enter the book title for the chapter.');
      return finish(plain, rich);
    } else if (type === 'web') {
      var site = clean(d.site);
      var date = clean(d.date);
      var dateLabel = date ? date : year;
      var webLead = (authors ? authors + ' ' : '') + '(' + dateLabel + ').';
      var omitSite = site && authors && site.toLowerCase() === authors.toLowerCase();
      var plain = webLead + ' ' + ensurePeriod(title) + (site && !omitSite ? ' ' + site + '.' : '') +
        (clean(d.url) ? ' ' + clean(d.url) : '');
      var rich = esc(webLead) + ' ' + esc(ensurePeriod(title)) +
        (site && !omitSite ? ' <em>' + esc(site) + '</em>.' : '') +
        (clean(d.url) ? ' ' + esc(clean(d.url)) : '');
      if (!clean(d.url)) warnings.push('Enter the full URL for the web page.');
      return finish(plain, rich);
    } else if (type === 'thesis') {
      var institution = clean(d.institution);
      var database = clean(d.database);
      var bracket = ' [' + clean(d.workType || 'Doctoral dissertation') +
        (institution ? ', ' + institution : '') + ']';
      var plain = lead + ' ' + title + bracket + '. ' + ensurePeriod(database);
      var rich = esc(lead) + ' <em>' + esc(title) + '</em>' + esc(bracket) + '. ' + esc(ensurePeriod(database));
      return finish(plain, rich);
    } else if (type === 'conference') {
      var conf = clean(d.conference);
      var location = clean(d.location);
      var confDate = clean(d.date) || year;
      var cLead = (authors ? authors + ' ' : '') + '(' + confDate + ').';
      var plain = cLead + ' ' + title + ' [Conference presentation]. ' + ensurePeriod(conf + (location ? ', ' + location : ''));
      var rich = esc(cLead) + ' <em>' + esc(title) + '</em> [Conference presentation]. ' + esc(ensurePeriod(conf + (location ? ', ' + location : '')));
      return finish(plain, rich);
    }

    var plainOut = [lead, middle, tail].filter(Boolean).join(' ') + (url ? ' ' + url : '');
    var richOut = [esc(lead), middleHtml, tailHtml].filter(Boolean).join(' ') + (url ? ' <a href="' + esc(url) + '" rel="noopener noreferrer">' + esc(url) + '</a>' : '');
    return finish(plainOut, richOut);

    function finish(plainText, richText) {
      return {
        text: plainText.replace(/\s+/g, ' ').trim(),
        html: richText.replace(/\s+/g, ' ').trim(),
        warnings: warnings,
        type: type
      };
    }
  }

  return {
    TYPE_LABELS: TYPE_LABELS,
    formatAuthorName: formatAuthorName,
    formatAuthors: formatAuthors,
    parseAuthors: parseAuthors,
    normalizeDoi: normalizeDoi,
    formatReference: formatReference
  };
});
