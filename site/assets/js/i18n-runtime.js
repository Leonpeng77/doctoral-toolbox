/*
 * Runtime message catalogue for the two tools.
 * The rule engines stay identical in both languages; only the human-readable
 * strings change. Loaded before apa7.js / reference-check.js.
 */
(function () {
  'use strict';

  var M = {
    /* ---- reference-check.js rule messages ---- */
    doiNotUrl: {
      en: { title: 'DOI is not a DOI URL',
            fix: 'Replace "doi:10.xxxx/..." with "https://doi.org/10.xxxx/...".' },
      zh: { title: 'DOI 不是 DOI 链接形式',
            fix: '把 "doi:10.xxxx/..." 改成 "https://doi.org/10.xxxx/..." 。' }
    },
    retrievedFrom: {
      en: { title: '"Retrieved from" is rarely correct',
            fix: 'Delete the phrase and keep the bare URL, or add a retrieval date only for archival/dynamic sources.' },
      zh: { title: '"Retrieved from" 大多不对',
            fix: '删掉这组词、只保留裸网址；只有存档或动态来源才加检索日期。' }
    },
    andAuthors: {
      en: { title: 'Authors joined with "and"',
            fix: 'Use ", & " before the last author. Use "and" only in narrative in-text citations.' },
      zh: { title: '作者之间用了 "and"',
            fix: '最后一位作者前用 ", & "。"and" 只用于叙述式文内引用。' }
    },
    etAlInList: {
      en: { title: '"et al." in a reference list',
            fix: 'List all authors (first 19, an ellipsis, then the final author when there are 21 or more).' },
      zh: { title: '参考文献列表里出现 "et al."',
            fix: '逐一列出作者（二十一位及以上时列前 19 位、省略号、最后一位）。' }
    },
    ppBeforePages: {
      en: { title: '"pp." before a page range',
            fix: 'Write the journal page range directly: 12(3), 45-67.' },
      zh: { title: '页码前加了 "pp."',
            fix: '期刊页码直接写：12(3), 45-67。' }
    },
    volLabel: {
      en: { title: 'Volume written as "Vol."',
            fix: 'Use "Journal of Applied Research, 18, 45-67" and italicise the 18.' },
      zh: { title: '卷号写成了 "Vol."',
            fix: '写成 "Journal of Applied Research, 18, 45-67"，并把 18 设为斜体。' }
    },
    noYear: {
      en: { title: 'No parenthesised year found',
            fix: 'Add "(2024)" or "(n.d.)" immediately after the authors.' },
      zh: { title: '没有找到括号年份',
            fix: '在作者后紧跟 "(2024)" 或 "(n.d.)"。' }
    },
    titleCase: {
      en: { title: 'Title may be in Title Case or ALL CAPS',
            fix: 'Lowercase everything after the first word and after a colon, except proper nouns.' },
      zh: { title: '标题可能是标题式大写或全大写',
            fix: '除首词、冒号后的词和专有名词外，其余改为小写。' }
    },
    missingComma: {
      en: { title: 'Ampersand may be missing its preceding comma',
            fix: 'Write "Smith, J. A., Lee, B., & Chen, C."' },
      zh: { title: '& 前可能缺了逗号',
            fix: '写成 "Smith, J. A., Lee, B., & Chen, C."' }
    },
    doubleSpace: {
      en: { title: 'Double space detected',
            fix: 'Collapse repeated spaces.' },
      zh: { title: '检测到双空格',
            fix: '把连续空格合并为一个。' }
    },
    fullWidth: {
      en: { title: 'Full-width punctuation detected',
            fix: 'Replace Chinese punctuation with ASCII commas, periods and parentheses.' },
      zh: { title: '检测到全角标点',
            fix: '把中文标点换成半角逗号、句号和括号。' }
    },
    periodAfterUrl: {
      en: { title: 'Period after a URL or DOI',
            fix: 'Remove the final period after the link.' },
      zh: { title: '网址或 DOI 后有句号',
            fix: '删掉链接末尾的句号。' }
    },
    availableFrom: {
      en: { title: '"Available from" is not APA 7 wording',
            fix: 'Use the bare URL, or the database name for a dissertation.' },
      zh: { title: '"Available from" 不是 APA 7 的措辞',
            fix: '改用裸网址；学位论文则写数据库名。' }
    },

    /* ---- apa7.js warnings ---- */
    noAuthor: { en: 'No author entered. For a missing author, APA 7 moves the title to the author position.',
                zh: '未填作者。确实无作者时，APA 7 会把标题移到作者位置。' },
    noYear: { en: 'No year entered, so the reference uses (n.d.). Confirm the source really has no date.',
              zh: '未填年份，条目将使用 (n.d.)。请确认来源确实没有日期。' },
    noTitle: { en: 'No title entered.', zh: '未填标题。' },
    titleCase: { en: 'The title looks like Title Case or ALL CAPS. APA 7 reference titles use sentence case; review it manually.',
                 zh: '标题看起来是标题式大写或全大写。APA 7 参考文献标题用句首大写，请人工核对。' },
    noDoi: { en: 'No DOI supplied. If the article has one, add it. If it has no DOI and came from an academic database, end the reference at the page range with no URL.',
             zh: '未填 DOI。若有 DOI 请补上；若确实没有且来自学术数据库，条目到页码范围即可，不加网址。' },
    noPublisher: { en: 'Enter a publisher. APA 7 no longer includes the publisher location.',
                   zh: '请填出版社。APA 7 已不再写出版地。' },
    noBookTitle: { en: 'Enter the book title for the chapter.', zh: '请填写该章节所在的书名。' },
    noUrl: { en: 'Enter the full URL for the web page.', zh: '请填写该网页的完整网址。' },

    /* ---- dynamic UI counts / summaries ---- */
    entries: { en: 'entries', zh: '条' },
    checks: { en: 'checks', zh: '项' },
    defaultWorkType: { en: 'Doctoral dissertation', zh: 'Doctoral dissertation' }
  };

  window.DT_MSGS = {
    lang: function () {
      try { return localStorage.getItem('dt-lang') === 'zh' ? 'zh' : 'en'; }
      catch (e) { return 'en'; }
    },
    get: function (key) {
      var row = M[key];
      if (!row) { return null; }
      return row[this.lang()] || row.en;
    },
    rule: function (key) {
      var row = M[key];
      if (!row) { return null; }
      return row[this.lang()] || row.en;
    }
  };
})();
