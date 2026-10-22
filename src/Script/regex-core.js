(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RegexCore = api;
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';
  const MAX_MATCHES = 50000, MAX_SEGMENTS = 50000, MAX_TEXT_LENGTH = 5000000;
  const MAX_PATTERN_LENGTH = 10000, MAX_REPLACEMENT_LENGTH = 10000, MAX_RESULT_LENGTH = 10000000;
  const MAX_PREVIEW_LENGTH = 250000;
  const ALLOWED_FLAGS = /^[dgimsuvy]*$/;

  function validateFlags(flags) {
    if (typeof flags !== 'string' || !ALLOWED_FLAGS.test(flags)) return 'Invalid flags. Supported flags are d, g, i, m, s, u, v, and y.';
    if (new Set(flags).size !== flags.length) return 'Duplicate regex flags are not allowed.';
    if (flags.includes('u') && flags.includes('v')) return 'The u and v flags cannot be used together.';
    try { new RegExp('', flags); return null; }
    catch (error) { return error && error.message ? error.message : 'Invalid regular expression flags.'; }
  }

  function compile(pattern, flags) {
    if (typeof pattern !== 'string') return { regex: null, error: 'Regex pattern must be a string.' };
    if (pattern.length > MAX_PATTERN_LENGTH) return { regex: null, error: 'Regex pattern is too long (maximum ' + MAX_PATTERN_LENGTH + ' characters).' };
    const flagError = validateFlags(flags);
    if (flagError) return { regex: null, error: flagError };
    if (pattern === '') return { regex: null, error: null };
    try { return { regex: new RegExp(pattern, flags), error: null }; }
    catch (error) { return { regex: null, error: error && error.message ? error.message : 'Invalid regular expression.' }; }
  }

  function advanceStringIndex(text, index, unicode) {
    if (!unicode || index + 1 >= text.length) return index + 1;
    const first = text.charCodeAt(index);
    if (first < 0xD800 || first > 0xDBFF) return index + 1;
    const second = text.charCodeAt(index + 1);
    return second >= 0xDC00 && second <= 0xDFFF ? index + 2 : index + 1;
  }

  function findAll(regex, text, maxMatches) {
    const limit = Number.isInteger(maxMatches) && maxMatches > 0 ? Math.min(maxMatches, MAX_MATCHES) : MAX_MATCHES;
    if (!(regex instanceof RegExp)) return { matches: [], truncated: false };
    if (typeof text !== 'string') text = String(text == null ? '' : text);
    if (text.length > MAX_TEXT_LENGTH) throw new Error('Input text is too large (maximum ' + MAX_TEXT_LENGTH.toLocaleString() + ' characters).');
    let flags = regex.flags;
    if (!flags.includes('g')) flags += 'g';
    let supportsIndices = false;
    try { new RegExp('', 'd'); supportsIndices = true; } catch (_) {}
    if (supportsIndices && !flags.includes('d')) flags += 'd';
    const execRegex = new RegExp(regex.source, flags);
    const matches = [];
    let match, truncated = false;
    while ((match = execRegex.exec(text)) !== null) {
      if (matches.length >= limit) { truncated = true; break; }
      const indices = match.indices ? Array.from(match.indices, pair => pair ? [pair[0], pair[1]] : null) : null;
      matches.push({
        full: match[0], index: match.index, end: match.index + match[0].length,
        groups: Array.from(match).slice(1), namedGroups: match.groups ? Object.assign({}, match.groups) : {}, indices
      });
      if (match[0] === '') execRegex.lastIndex = advanceStringIndex(text, execRegex.lastIndex, flags.includes('u') || flags.includes('v'));
    }
    return { matches, truncated };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function highlight(text, matches) {
    if (typeof text !== 'string') text = String(text == null ? '' : text);
    if (!text) return '';
    if (!Array.isArray(matches) || matches.length === 0) return escapeHtml(text);
    let html = '', lastIndex = 0;
    for (const match of matches) {
      const start = Math.max(lastIndex, Math.min(text.length, match.index));
      const end = Math.max(start, Math.min(text.length, match.end));
      const matchedText = text.slice(start, end);
      html += escapeHtml(text.slice(lastIndex, start));
      const spans = [];
      if (Array.isArray(match.indices)) {
        for (let group = 1; group < match.indices.length; group++) {
          const pair = match.indices[group];
          if (!pair || pair.length !== 2 || pair[1] <= pair[0]) continue;
          const groupStart = Math.max(0, pair[0] - match.index);
          const groupEnd = Math.min(matchedText.length, pair[1] - match.index);
          if (groupEnd > groupStart) spans.push({ start: groupStart, end: groupEnd, group: group });
        }
      }
      if (!spans.length) {
        html += '<mark class="match">' + escapeHtml(matchedText) + '</mark>';
      } else {
        const levels = new Array(matchedText.length).fill(0);
        for (const span of spans) for (let pos = span.start; pos < span.end; pos++) {
          if (span.group > levels[pos]) levels[pos] = span.group;
        }
        let group = levels[0] || 0, buffer = '', body = '';
        for (let pos = 0; pos < matchedText.length; pos++) {
          const next = levels[pos] || 0;
          if (next !== group) {
            body += group === 0 ? escapeHtml(buffer) : '<span class="group group-' + (((group - 1) % 6) + 2) + '">' + escapeHtml(buffer) + '</span>';
            group = next; buffer = matchedText[pos];
          } else buffer += matchedText[pos];
        }
        body += group === 0 ? escapeHtml(buffer) : '<span class="group group-' + (((group - 1) % 6) + 2) + '">' + escapeHtml(buffer) + '</span>';
        html += '<mark class="match">' + body + '</mark>';
      }
      lastIndex = Math.max(lastIndex, end);
    }
    html += escapeHtml(text.slice(lastIndex));
    return html;
  }

  function replacementExpansionLength(template, text, match) {
    const groups = match.groups || [];
    const named = match.namedGroups || {};
    const hasNamedGroups = Object.keys(named).length > 0;
    let length = 0;

    for (let i = 0; i < template.length; i++) {
      if (template[i] !== '$' || i + 1 >= template.length) {
        length++;
        continue;
      }

      const next = template[i + 1];
      if (next === '$') {
        length++;
        i++;
      } else if (next === '&') {
        length += match.full.length;
        i++;
      } else if (next === '\u0060') {
        length += match.index;
        i++;
      } else if (next === "'") {
        length += text.length - match.end;
        i++;
      } else if (next === '<' && hasNamedGroups) {
        const close = template.indexOf('>', i + 2);
        if (close !== -1) {
          const name = template.slice(i + 2, close);
          const value = named[name];
          if (typeof value === 'string') length += value.length;
          i = close;
        } else {
          length++;
        }
      } else if (next >= '0' && next <= '9') {
        const firstDigit = next.charCodeAt(0) - 48;
        const secondChar = template[i + 2];
        const hasSecondDigit = secondChar >= '0' && secondChar <= '9';
        const twoDigitGroup = hasSecondDigit ? firstDigit * 10 + secondChar.charCodeAt(0) - 48 : -1;

        if (hasSecondDigit && twoDigitGroup > 0 && twoDigitGroup <= groups.length) {
          const value = groups[twoDigitGroup - 1];
          if (typeof value === 'string') length += value.length;
          i += 2;
        } else if (firstDigit > 0 && firstDigit <= groups.length) {
          const value = groups[firstDigit - 1];
          if (typeof value === 'string') length += value.length;
          i++;
        } else {
          // Invalid capture references leave the dollar literal; process digits normally.
          length++;
        }
      } else {
        length++;
      }

      if (length > MAX_RESULT_LENGTH) return length;
    }
    return length;
  }

  function assertSafeReplacementLength(text, replacement, matches) {
    let matchedLength = 0;
    let expandedLength = 0;
    for (const match of matches) {
      matchedLength += match.end - match.index;
      expandedLength += replacementExpansionLength(replacement, text, match);
      if (text.length - matchedLength + expandedLength > MAX_RESULT_LENGTH) {
        throw new Error('Replacement result may exceed ' + MAX_RESULT_LENGTH.toLocaleString() + ' characters. Use a shorter replacement or smaller input.');
      }
    }
    if (text.length - matchedLength + expandedLength > MAX_RESULT_LENGTH) {
      throw new Error('Replacement result may exceed ' + MAX_RESULT_LENGTH.toLocaleString() + ' characters. Use a shorter replacement or smaller input.');
    }
  }

  function replace(regex, text, replacement, all) {
    if (!(regex instanceof RegExp)) return text;
    if (typeof text !== 'string') text = String(text == null ? '' : text);
    if (typeof replacement !== 'string') replacement = String(replacement == null ? '' : replacement);
    if (replacement.length > MAX_REPLACEMENT_LENGTH) throw new Error('Replacement is too long (maximum ' + MAX_REPLACEMENT_LENGTH.toLocaleString() + ' characters).');
    if (text.length > MAX_TEXT_LENGTH) throw new Error('Input text is too large (maximum ' + MAX_TEXT_LENGTH.toLocaleString() + ' characters).');

    if (all === false) {
      const first = findAll(regex, text, 1);
      if (first.matches.length) assertSafeReplacementLength(text, replacement, first.matches);
      return text.replace(new RegExp(regex.source, regex.flags.replace(/g/g, '')), replacement);
    }

    const summary = findAll(regex, text, MAX_MATCHES);
    if (summary.truncated) {
      throw new Error('Replacement stopped because the match limit (' + MAX_MATCHES.toLocaleString() + ') was reached. Narrow the pattern or reduce the input text.');
    }
    assertSafeReplacementLength(text, replacement, summary.matches);
    const flags = regex.flags.includes('g') ? regex.flags : regex.flags + 'g';
    return text.replace(new RegExp(regex.source, flags), replacement);
  }
  function splitSummary(regex, text, maxSegments) {
    if (typeof text !== 'string') text = String(text == null ? '' : text);
    if (text.length > MAX_TEXT_LENGTH) throw new Error('Input text is too large (maximum ' + MAX_TEXT_LENGTH.toLocaleString() + ' characters).');
    const requestedLimit = Number.isInteger(maxSegments) && maxSegments > 0 ? maxSegments : MAX_SEGMENTS;
    const limit = Math.min(requestedLimit, MAX_SEGMENTS);
    if (!(regex instanceof RegExp)) return { segments: [text], truncated: false };
    // Probe one extra segment so hitting the exact cap is not mistaken for truncation.
    const result = text.split(new RegExp(regex.source, regex.flags), limit + 1);
    const truncated = result.length > limit;
    return { segments: truncated ? result.slice(0, limit) : result, truncated };
  }

  function split(regex, text, maxSegments) {
    return splitSummary(regex, text, maxSegments).segments;
  }

  function createPreview(text, matches, maxCharacters) {
    if (typeof text !== 'string') text = String(text == null ? '' : text);
    const requestedLimit = Number.isInteger(maxCharacters) && maxCharacters > 0 ? maxCharacters : MAX_PREVIEW_LENGTH;
    const limit = Math.min(requestedLimit, MAX_PREVIEW_LENGTH);
    const previewText = text.slice(0, limit);
    const previewMatches = Array.isArray(matches)
      ? matches.filter(match => match && Number.isFinite(match.index) && match.index < limit)
      : [];
    return {
      html: highlight(previewText, previewMatches),
      truncated: text.length > previewText.length,
      visibleLength: previewText.length
    };
  }

  function normalizeStoredList(value, limit) {
    if (!Array.isArray(value)) return [];
    const maxItems = Number.isInteger(limit) && limit > 0 ? limit : 20;
    const output = [], seen = new Set();
    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      if (typeof item.pattern !== 'string' || !item.pattern.length || item.pattern.length > MAX_PATTERN_LENGTH) continue;
      if (typeof item.flags !== 'string' || validateFlags(item.flags)) continue;
      const key = item.pattern + '\u0000' + item.flags;
      if (seen.has(key)) continue;
      seen.add(key);
      output.push({ pattern: item.pattern, flags: item.flags, ts: Number.isFinite(item.ts) ? item.ts : 0 });
      if (output.length >= maxItems) break;
    }
    return output;
  }

  function run(payload) {
    const data = payload || {};
    const text = typeof data.text === 'string' ? data.text : String(data.text == null ? '' : data.text);
    if (text.length > MAX_TEXT_LENGTH) throw new Error('Input text is too large (maximum ' + MAX_TEXT_LENGTH.toLocaleString() + ' characters).');
    const compiled = compile(data.pattern, data.flags == null ? '' : data.flags);
    if (compiled.error) throw new Error(compiled.error);
    if (!compiled.regex) return { matches: [], truncated: false, replaceResult: text, segments: [text], segmentsTruncated: false };
    if (data.op === 'replace') return { replaceResult: replace(compiled.regex, text, data.replacement == null ? '' : data.replacement, data.all !== false) };
    const found = findAll(compiled.regex, text, data.maxMatches);
    const replaceResult = replace(compiled.regex, text, data.replacement == null ? '' : data.replacement, true);
    const splitResult = splitSummary(compiled.regex, text, MAX_SEGMENTS);
    return {
      matches: found.matches, truncated: found.truncated, replaceResult, segments: splitResult.segments,
      segmentsTruncated: splitResult.truncated
    };
  }

  return {
    MAX_MATCHES, MAX_SEGMENTS, MAX_TEXT_LENGTH, MAX_PATTERN_LENGTH, MAX_REPLACEMENT_LENGTH, MAX_PREVIEW_LENGTH,
    compile, validateFlags, advanceStringIndex, findAll, escapeHtml, highlight, createPreview, replace, split, splitSummary,
    normalizeStoredList, run
  };
});
