/*
 * Framework-agnostic request handler.
 * Used unchanged by the local Node server and by the Azure Functions app.
 * The site's browser modules are vendored into ./vendor at deploy time;
 * locally they are loaded straight from the repository so there is one
 * single source of truth for parsing and formatting logic.
 */
'use strict';

function load(name) {
  try {
    return require('./vendor/' + name);
  } catch (err) {
    return require('../../../site/assets/js/' + name);
  }
}

var RefParser = load('reference-parser.js');
var APA7 = load('apa7.js');
var RefCheck = load('reference-check.js');

var VERSION = '1.0.0';
var MAX_CHARS = 100000;
var MAX_ENTRIES = 200;

function handleHealth() {
  return {
    status: 'ok',
    service: 'doctoral-toolbox-api',
    version: VERSION,
    rules: RefCheck.RULES.length,
    maxEntries: MAX_ENTRIES,
    note: 'Development / research prototype. No persistence, no telemetry of submitted text.'
  };
}

function handleParse(body) {
  var payload = body || {};
  var text = String(payload.text == null ? (payload.references == null ? '' : payload.references) : payload.text);
  var errors = [];

  if (!text.trim()) errors.push('Field "text" is required and must not be empty.');
  if (text.length > MAX_CHARS) {
    errors.push('Input exceeds ' + MAX_CHARS + ' characters.');
  }
  if (errors.length) {
    return { statusCode: 400, body: { error: 'Invalid request', details: errors } };
  }

  var lines = text.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
  var truncated = lines.length > MAX_ENTRIES;
  var selected = lines.slice(0, MAX_ENTRIES);

  var entries = selected.map(function (line, index) {
    var parsed = RefParser.parseReference(line);
    var built = APA7.formatReference(parsed.fields);
    var audit = RefCheck.check(built.text);
    return {
      index: index + 1,
      raw: parsed.raw,
      fields: parsed.fields,
      formatted: built.text,
      html: built.html,
      confidence: Number(parsed.confidence.toFixed(2)),
      parseWarnings: parsed.warnings,
      issues: audit.issues
    };
  });

  var totalIssues = entries.reduce(function (sum, e) { return sum + e.issues.length; }, 0);
  var totalErrors = entries.reduce(function (sum, e) {
    return sum + e.issues.filter(function (i) { return i.severity === 'error'; }).length;
  }, 0);
  var avg = entries.length
    ? entries.reduce(function (sum, e) { return sum + e.confidence; }, 0) / entries.length
    : 0;

  return {
    statusCode: 200,
    body: {
      entries: entries,
      summary: {
        count: entries.length,
        truncated: truncated,
        discarded: truncated ? lines.length - MAX_ENTRIES : 0,
        averageConfidence: Number(avg.toFixed(2)),
        issues: totalIssues,
        errors: totalErrors,
        rulesApplied: RefCheck.RULES.length
      }
    }
  };
}

module.exports = { handleHealth: handleHealth, handleParse: handleParse, VERSION: VERSION };
