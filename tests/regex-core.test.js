'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const RegexCore = require('../src/Script/regex-core.js');
const RegexWorkerClient = require('../src/Script/regex-worker-client.js');

test('capture offsets are represented and highlighted at their exact positions', () => {
  const compiled = RegexCore.compile('(a)(b)', 'g');
  assert.equal(compiled.error, null);
  const found = RegexCore.findAll(compiled.regex, 'zab!');
  assert.equal(found.matches.length, 1);
  assert.equal(found.matches[0].full, 'ab');
  assert.deepEqual(found.matches[0].groups, ['a', 'b']);
  const html = RegexCore.highlight('zab!', found.matches);
  assert.match(html, /group-2">a<\/span>/);
  assert.match(html, /group-3">b<\/span>/);
});

test('named capture groups are returned as structured data', () => {
  const compiled = RegexCore.compile('(?<word>hello)', 'g');
  const found = RegexCore.findAll(compiled.regex, 'say hello!');
  assert.equal(found.matches[0].namedGroups.word, 'hello');
  assert.equal(found.matches[0].full, 'hello');
});

test('unmatched optional groups remain undefined and do not crash rendering', () => {
  const compiled = RegexCore.compile('(a)?b', 'g');
  const found = RegexCore.findAll(compiled.regex, 'b ab');
  assert.equal(found.matches[0].groups[0], undefined);
  assert.equal(found.matches[1].groups[0], 'a');
  assert.doesNotThrow(() => RegexCore.highlight('b ab', found.matches));
});

test('multiline zero-width matches terminate and include each line start', () => {
  const compiled = RegexCore.compile('^', 'gm');
  const found = RegexCore.findAll(compiled.regex, 'a\nb\n');
  assert.deepEqual(found.matches.map(match => match.index), [0, 2, 4]);
  assert.equal(found.truncated, false);
});

test('Unicode zero-width matches advance over surrogate pairs', () => {
  const compiled = RegexCore.compile('(?=.)', 'gu');
  const found = RegexCore.findAll(compiled.regex, 'A😀B');
  assert.deepEqual(found.matches.map(match => match.index), [0, 1, 3]);
  assert.equal(found.matches.some(match => match.index === 2), false);
});

test('duplicate and incompatible flags fail with an explicit validation error', () => {
  assert.match(RegexCore.validateFlags('gg'), /Duplicate/);
  assert.match(RegexCore.validateFlags('uv'), /cannot be used together/);
  assert.equal(RegexCore.compile('a', 'gq').regex, null);
});

test('invalid flags are validated even when the pattern is empty', () => {
  assert.match(RegexCore.compile('', 'gg').error, /Duplicate/);
  assert.equal(RegexCore.compile('', 'g').error, null);
});

test('match caps report partial results instead of silently truncating', () => {
  const compiled = RegexCore.compile('a', 'g');
  const found = RegexCore.findAll(compiled.regex, 'a'.repeat(11), 10);
  assert.equal(found.matches.length, 10);
  assert.equal(found.truncated, true);
});

test('worker client terminates a worker when the timeout expires', async () => {
  let lastWorker;
  class HangingWorker {
    constructor() { lastWorker = this; this.terminated = false; }
    postMessage() {}
    terminate() { this.terminated = true; }
  }
  const client = RegexWorkerClient.create('fake-worker.js', HangingWorker);
  await assert.rejects(client.run({ op: 'evaluate' }, { timeoutMs: 10 }), error => error.code === 'REGEX_TIMEOUT');
  assert.equal(lastWorker.terminated, true);
});

test('untrusted user text is HTML-escaped in highlighted output', () => {
  const compiled = RegexCore.compile('.', 'g');
  const input = '<img src=x onerror=alert(1)>';
  const found = RegexCore.findAll(compiled.regex, input);
  const html = RegexCore.highlight(input, found.matches);
  assert.equal(html.includes('<img'), false);
  assert.match(html, /&lt;<\/mark>/);
  assert.doesNotMatch(html, /<img/);
});

test('malformed or hostile persistence data is normalized safely', () => {
  const normalized = RegexCore.normalizeStoredList([
    null,
    'bad-record',
    { pattern: '(', flags: 'g', ts: 'not-a-time' },
    { pattern: 'safe', flags: 'gg', ts: 10 },
    { pattern: 'safe', flags: 'g', ts: 10 },
    { pattern: 'safe', flags: 'g', ts: 11 },
    { pattern: 123, flags: 'g', ts: 12 }
  ], 20);
  assert.deepEqual(normalized, [{ pattern: '(', flags: 'g', ts: 0 }, { pattern: 'safe', flags: 'g', ts: 10 }]);
  assert.deepEqual(RegexCore.normalizeStoredList({ pattern: 'not-an-array' }), []);
});


test('replacement prefix and suffix tokens are included in output-size limits', () => {
  const compiled = RegexCore.compile('.', 'g');
  const text = 'a'.repeat(5000);
  assert.throws(() => RegexCore.replace(compiled.regex, text, '$\u0060', true), /may exceed/);
  assert.throws(() => RegexCore.replace(compiled.regex, text, "$'", true), /may exceed/);
});

test('replacement and split preserve expected semantics with bounded results', () => {
  const compiled = RegexCore.compile('(\\w+)', 'g');
  assert.equal(RegexCore.replace(compiled.regex, 'one two', '<$1>', true), '<one> <two>');
  assert.deepEqual(RegexCore.split(compiled.regex, 'one two', 10), ['', 'one', ' ', 'two', '']);
});


test('split truncation is only reported when the result exceeds the cap', () => {
  const compiled = RegexCore.compile(',', 'g');
  const exactLimitText = Array(RegexCore.MAX_SEGMENTS).fill('x').join(',');
  const overLimitText = Array(RegexCore.MAX_SEGMENTS + 1).fill('x').join(',');

  const exact = RegexCore.splitSummary(compiled.regex, exactLimitText, RegexCore.MAX_SEGMENTS);
  assert.equal(exact.segments.length, RegexCore.MAX_SEGMENTS);
  assert.equal(exact.truncated, false);

  const over = RegexCore.splitSummary(compiled.regex, overLimitText, RegexCore.MAX_SEGMENTS);
  assert.equal(over.segments.length, RegexCore.MAX_SEGMENTS);
  assert.equal(over.truncated, true);
});

test('large text highlight previews are bounded and safely escaped', () => {
  const text = 'a'.repeat(500) + '<img src=x onerror=alert(1)>' + 'b'.repeat(1000);
  const compiled = RegexCore.compile('^a{500}', 'g');
  const found = RegexCore.findAll(compiled.regex, text);
  const preview = RegexCore.createPreview(text, found.matches, 600);

  assert.equal(found.matches.length, 1);
  assert.equal(preview.visibleLength, 600);
  assert.equal(preview.truncated, true);
  assert.match(preview.html, /<mark class="match">a{500}<\/mark>/);
  assert.doesNotMatch(preview.html, /<img/);
  assert.match(preview.html, /&lt;img/);
});
