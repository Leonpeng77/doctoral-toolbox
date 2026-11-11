#!/usr/bin/env node
/* Zero-dependency assertions against the shared Azure handler. */
'use strict';

const assert = require('node:assert/strict');
const { handleHealth, handleParse } = require('../function-app/shared/handler');

let n = 0;
function t(fn) { fn(); n++; }

const MESSY = [
  'Smith, J. A. and Lee, B. (2024). Dynamic Capabilities And Firm Performance. Journal of Business Research, Vol. 142, pp. 45-67. doi:10.1016/j.jbusres.2023.114321',
  'American Psychological Association. (2020). Publication manual (7th ed.). APA.',
  "Garcia, M., & O'Neill, P. (2022) Leadership and trust. Journal of Management 48(1), 12-30."
].join('\n');

t(() => assert.equal(handleHealth().status, 'ok'));
t(() => assert.equal(handleHealth().rules, 14));
t(() => assert.equal(handleHealth().version, '1.0.0'));

const ok = handleParse({ text: MESSY });
t(() => assert.equal(ok.statusCode, 200));
t(() => assert.equal(ok.body.entries.length, 3));
t(() => assert.equal(ok.body.summary.count, 3));
t(() => assert.equal(ok.body.summary.truncated, false));
t(() => assert.equal(ok.body.summary.rulesApplied, 14));
t(() => assert.ok(ok.body.summary.averageConfidence > 0));

const first = ok.body.entries[0];
t(() => assert.equal(first.fields.year, '2024'));
t(() => assert.deepEqual(first.fields.authors, ['Smith, J. A', 'Lee, B']));
t(() => assert.equal(first.fields.doi, '10.1016/j.jbusres.2023.114321'));
t(() => assert.equal(first.fields.volume, '142'));
t(() => assert.equal(first.fields.pages, '45-67'));
t(() => assert.ok(first.formatted.startsWith('Smith, J. A., & Lee, B. (2024).')));
t(() => assert.ok(first.formatted.includes('https://doi.org/10.1016/')));
t(() => assert.ok(first.html.includes('<em>142</em>')));
t(() => assert.ok(first.parseWarnings.some((w) => /sentence case/i.test(w))));

t(() => assert.equal(ok.body.entries[1].fields.authors[0], 'American Psychological Association'));
t(() => assert.equal(ok.body.entries[1].formatted,
  'American Psychological Association (2020). Publication manual (7th ed.). APA.'));
t(() => assert.equal(ok.body.entries[2].fields.volume, '48'));
t(() => assert.equal(ok.body.entries[2].fields.issue, '1'));

t(() => assert.equal(handleParse({ text: '' }).statusCode, 400));
t(() => assert.equal(handleParse({}).statusCode, 400));
t(() => assert.equal(handleParse({ text: 'x'.repeat(100001) }).statusCode, 400));

const many = Array.from({ length: 201 }, (_, i) => 'Author' + i + ', A. A. (2020). Title ' + i + '. Journal of Studies, 1, 1-2.').join('\n');
const capped = handleParse({ text: many });
t(() => assert.equal(capped.body.entries.length, 200));
t(() => assert.equal(capped.body.summary.truncated, true));
t(() => assert.equal(capped.body.summary.discarded, 1));

t(() => assert.ok(handleParse({ references: MESSY }).body.summary.count === 3));

/* The deployed Function App uses the v3 programming model, so these
   are the exact entry points Azure will invoke. No npm packages needed. */
const parseFn = require('../function-app/parse/index.js');
const healthFn = require('../function-app/health/index.js');
const parseBindings = require('../function-app/parse/function.json');
const healthBindings = require('../function-app/health/function.json');

t(() => assert.equal(parseBindings.bindings[0].route, 'parse'));
t(() => assert.equal(parseBindings.bindings[0].methods[0], 'post'));
t(() => assert.equal(healthBindings.bindings[0].methods[0], 'get'));

async function checkEntryPoints() {
  const parseCtx = { res: null };
  await parseFn(parseCtx, { body: { text: MESSY } });
  t(() => assert.equal(parseCtx.res.status, 200));
  t(() => assert.equal(parseCtx.res.body.entries.length, 3));
  t(() => assert.equal(parseCtx.res.headers['Content-Type'], 'application/json; charset=utf-8'));

  const healthCtx = { res: null };
  await healthFn(healthCtx, {});
  t(() => assert.equal(healthCtx.res.status, 200));
  t(() => assert.equal(healthCtx.res.body.mode, 'azure'));

  console.log('AZURE_TESTS_OK=' + n);
  console.log('PARSE_ENTRIES=' + ok.body.entries.length +
    ' SUMMARY_ISSUES=' + ok.body.summary.issues +
    ' SUMMARY_ERRORS=' + ok.body.summary.errors);
}

checkEntryPoints().catch((err) => {
  console.error(err);
  process.exit(1);
});
