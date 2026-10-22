/* ===========================================================
   Regex Pro — Modern Regex Tester
   Modular Vanilla JavaScript (IIFE pattern, no globals)
   =========================================================== */
(function () {
  'use strict';

  /* =====================================================
     1. STATE
     ===================================================== */
  const state = {
    pattern: '',
    flags: 'g',
    text: '',
    matches: [],
    matchesTruncated: false,
    evaluationId: 0,
    history: [],
    favorites: [],
    activeTab: 'cheatsheet',
    sidebarWidth: 320,
    lastResult: null,
  };

  /* =====================================================
     2. DOM REFERENCES
     ===================================================== */
  const dom = {
    regexInput: document.getElementById('regexInput'),
    flagsInput: document.getElementById('flagsInput'),
    flagToggles: document.querySelectorAll('.flag-toggle input'),
    regexError: document.getElementById('regexError'),
    regexStatus: document.getElementById('regexStatus'),
    testString: document.getElementById('testString'),
    charCount: document.getElementById('charCount'),
    lineCount: document.getElementById('lineCount'),
    wordCount: document.getElementById('wordCount'),
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    highlightedOutput: document.getElementById('highlightedOutput'),
    matchCount: document.getElementById('matchCount'),
    infoTotal: document.getElementById('infoTotal'),
    infoFirst: document.getElementById('infoFirst'),
    infoLast: document.getElementById('infoLast'),
    infoPattern: document.getElementById('infoPattern'),
    matchList: document.getElementById('matchList'),
    explanation: document.getElementById('explanation'),
    replaceInput: document.getElementById('replaceInput'),
    replacePreview: document.getElementById('replacePreview'),
    splitResult: document.getElementById('splitResult'),
    splitCount: document.getElementById('splitCount'),
    sidebar: document.getElementById('sidebar'),
    sidebarSearch: document.getElementById('sidebarSearch'),
    resizeHandle: document.getElementById('resizeHandle'),
    tabs: document.querySelectorAll('.tab'),
    panels: document.querySelectorAll('.tab-panel'),
    panelCheatsheet: document.getElementById('panel-cheatsheet'),
    panelLibrary: document.getElementById('panel-library'),
    panelHistory: document.getElementById('panel-history'),
    panelFavorites: document.getElementById('panel-favorites'),
    toastContainer: document.getElementById('toast-container'),
    helpModal: document.getElementById('helpModal'),
    downloadMenu: document.getElementById('downloadMenu'),
    stopRegexButton: document.getElementById('stopRegexButton'),
  };

  /* =====================================================
     3. STORAGE MANAGER
     ===================================================== */
  const Storage = {
    KEYS: {
      HISTORY: 'rp_history',
      FAVORITES: 'rp_favorites',
      TEXT: 'rp_text',
      PATTERN: 'rp_pattern',
      FLAGS: 'rp_flags',
      REPLACE: 'rp_replace',
      WIDTH: 'rp_sidebar_width',
    },

    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },

    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (e) { /* quota or private mode */ }
    },

    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* noop */ }
    },
  };

  /* =====================================================
     4. UTILITIES
     ===================================================== */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function formatNumber(n) {
    return n.toLocaleString();
  }

  function truncate(str, max = 60) {
    if (str.length <= max) return str;
    return str.slice(0, max - 1) + '…';
  }

  function getTimestamp() {
    return Date.now();
  }

  function formatTimeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  function downloadFile(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); document.body.removeChild(ta); return true; }
      catch (err) { document.body.removeChild(ta); return false; }
    }
  }

  /* =====================================================
     5. TOAST
     ===================================================== */
  const Toast = {
    icons: {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    },

    show(message, type = 'info', duration = 2800) {
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.innerHTML = `${this.icons[type] || this.icons.info}<span>${escapeHtml(message)}</span>`;
      dom.toastContainer.appendChild(el);
      setTimeout(() => {
        el.classList.add('fade-out');
        setTimeout(() => el.remove(), 300);
      }, duration);
    },

    success(msg, d) { this.show(msg, 'success', d); },
    error(msg, d) { this.show(msg, 'error', d); },
    info(msg, d) { this.show(msg, 'info', d); },
    warning(msg, d) { this.show(msg, 'warning', d); },
  };

  /* =====================================================
     6. REGEX ENGINE
     ===================================================== */
  const RegexCore = window.RegexCore;
  const RegexWorker = window.RegexWorkerClient.create(
    new URL('./regex-worker.js', document.currentScript ? document.currentScript.src : window.location.href)
  );
  const RegexEngine = {
    compile: RegexCore.compile,
    highlight: RegexCore.highlight,
  };

  /* =====================================================
     7. REGEX EXPLAINER (tokenizer)
     ===================================================== */
  const Explainer = {
    tokenize(pattern) {
      const tokens = [];
      if (!pattern) return tokens;
      let i = 0;

      while (i < pattern.length) {
        const c = pattern[i];

        // --- Escape sequence ---
        if (c === '\\') {
          const next = pattern[i + 1];
          if (next === undefined) {
            tokens.push({ token: '\\', desc: 'Literal backslash' });
            i++;
          } else {
            const map = {
              d: 'Any digit (0-9)',
              D: 'Any non-digit',
              w: 'Word char [a-zA-Z0-9_]',
              W: 'Non-word char',
              s: 'Whitespace (space, tab, newline)',
              S: 'Non-whitespace',
              b: 'Word boundary',
              B: 'Non-word boundary',
              n: 'Newline character',
              t: 'Tab character',
              r: 'Carriage return',
              f: 'Form feed',
              v: 'Vertical tab',
              '0': 'Null character',
            };
            if (map[next]) {
              tokens.push({ token: '\\' + next, desc: map[next] });
            } else if (/\d/.test(next)) {
              // Backreference
              let j = i + 1;
              while (j < pattern.length && /\d/.test(pattern[j])) j++;
              tokens.push({
                token: pattern.slice(i, j),
                desc: `Backreference to group ${pattern.slice(i + 1, j)}`,
              });
              i = j; continue;
            } else if (next === 'c') {
              tokens.push({ token: '\\cX', desc: 'Control character' });
              i += 2; continue;
            } else if (next === 'x') {
              tokens.push({ token: '\\xHH', desc: 'Hex character (HH)' });
              i += 2; continue;
            } else if (next === 'u') {
              tokens.push({ token: '\\uHHHH', desc: 'Unicode character (HHHH)' });
              i += 2; continue;
            } else {
              tokens.push({ token: '\\' + next, desc: `Literal "${next}"` });
            }
            i += 2;
          }
          continue;
        }

        // --- Character class ---
        if (c === '[') {
          let j = i + 1;
          if (pattern[j] === '^') j++;
          while (j < pattern.length && pattern[j] !== ']') {
            if (pattern[j] === '\\') j += 2;
            else j++;
          }
          const content = pattern.slice(i, j + 1);
          const isNegated = content === '^';
          tokens.push({
            token: content,
            desc: isNegated
              ? `Any character NOT in "${content.slice(2, -1)}"`
              : `Any character in "${content.slice(1, -1)}"`,
          });
          i = j + 1;
          continue;
        }

        // --- Group ---
        if (c === '(') {
          let desc = 'Capturing group';
          let headerLen = 1;
          if (pattern[i + 1] === '?') {
            const a = pattern[i + 2], b = pattern[i + 3];
            if (a === ':') { desc = 'Non-capturing group'; headerLen = 3; }
            else if (a === '=') { desc = 'Positive lookahead'; headerLen = 3; }
            else if (a === '!') { desc = 'Negative lookahead'; headerLen = 3; }
            else if (a === '<') {
              if (b === '=') { desc = 'Positive lookbehind'; headerLen = 4; }
              else if (b === '!') { desc = 'Negative lookbehind'; headerLen = 4; }
              else {
                // Named group
                let end = i + 3;
                while (end < pattern.length && pattern[end] !== '>') end++;
                const name = pattern.slice(i + 3, end);
                desc = `Named group "${name}"`;
                headerLen = end - i + 1;
              }
            }
          }

          // Skip group content (respect nesting & escapes)
          let depth = 1, k = i + headerLen;
          while (k < pattern.length && depth > 0) {
            if (pattern[k] === '\\') k += 2;
            else if (pattern[k] === '(') { depth++; k++; }
            else if (pattern[k] === ')') { depth--; k++; }
            else k++;
          }
          tokens.push({ token: pattern.slice(i, k), desc });
          i = k;
          continue;
        }

        // --- Quantifier with braces ---
        if (c === '{') {
          let j = i + 1;
          while (j < pattern.length && pattern[j] !== '}') j++;
          if (j < pattern.length && /^\d+(,\d*)?$/.test(pattern.slice(i + 1, j))) {
            const content = pattern.slice(i + 1, j);
            const lazy = pattern[j + 1] === '?';
            const meaning = content.includes(',')
              ? content.endsWith(',') ? `At least ${content.slice(0, -1)} times` : `Between ${content.replace(',', ' and ')} times`
              : `Exactly ${content} times`;
            tokens.push({ token: pattern.slice(i, j + 1) + (lazy ? '?' : ''), desc: meaning + (lazy ? ' (lazy)' : ' (greedy)') });
            i = j + 1 + (lazy ? 1 : 0);
            continue;
          }
          tokens.push({ token: '{', desc: 'Literal "{"' });
          i++; continue;
        }

        // --- Simple quantifier ---
        if (c === '*' || c === '+' || c === '?') {
          const lazy = pattern[i + 1] === '?';
          const map = {
            '*': 'Zero or more',
            '+': 'One or more',
            '?': 'Optional (zero or one)',
          };
          tokens.push({
            token: c + (lazy ? '?' : ''),
            desc: map[c] + (lazy ? ' (lazy)' : ' (greedy)'),
          });
          i += 1 + (lazy ? 1 : 0);
          continue;
        }

        // --- Anchors ---
        if (c === '^') { tokens.push({ token: '^', desc: 'Start of string or line (with m flag)' }); i++; continue; }
        if (c === '$') { tokens.push({ token: '$', desc: 'End of string or line (with m flag)' }); i++; continue; }

        // --- Alternation ---
        if (c === '|') { tokens.push({ token: '|', desc: 'Alternation (OR)' }); i++; continue; }

        // --- Dot ---
        if (c === '.') { tokens.push({ token: '.', desc: 'Any character (except newline)' }); i++; continue; }

        // --- Literal ---
        tokens.push({ token: c, desc: `Literal "${c}"` });
        i++;
      }

      return tokens;
    },

    render(pattern) {
      if (!pattern) {
        return '<div class="placeholder">Enter a pattern to see a human-readable explanation.</div>';
      }
      const tokens = this.tokenize(pattern);
      if (tokens.length === 0) return '<div class="placeholder">Empty pattern.</div>';

      return tokens.map(t => `
        <div class="explain-row">
          <span class="token">${escapeHtml(t.token)}</span>
          <span class="arrow">→</span>
          <span class="desc">${escapeHtml(t.desc)}</span>
        </div>
      `).join('');
    },
  };

  /* =====================================================
     8. CHEATSHEET DATA
     ===================================================== */
  const CHEATSHEET = [
    { token: '\\d', tip: 'Any digit (0-9)', desc: 'Digit' },
    { token: '\\D', tip: 'Any non-digit character', desc: 'Non-digit' },
    { token: '\\w', tip: 'Any word char (a-z, A-Z, 0-9, _)', desc: 'Word char' },
    { token: '\\W', tip: 'Any non-word character', desc: 'Non-word' },
    { token: '\\s', tip: 'Whitespace (space, tab, newline)', desc: 'Whitespace' },
    { token: '\\S', tip: 'Any non-whitespace', desc: 'Non-whitespace' },
    { token: '.', tip: 'Any character except newline', desc: 'Any char' },
    { token: '^', tip: 'Start of string or line (with m flag)', desc: 'Start anchor' },
    { token: '$', tip: 'End of string or line (with m flag)', desc: 'End anchor' },
    { token: '\\b', tip: 'Word boundary position', desc: 'Word boundary' },
    { token: '\\B', tip: 'Non-word boundary', desc: 'Non-boundary' },
    { token: '*', tip: 'Previous element zero or more times', desc: 'Zero or more' },
    { token: '+', tip: 'Previous element one or more times', desc: 'One or more' },
    { token: '?', tip: 'Previous element zero or one time', desc: 'Optional' },
    { token: '*?', tip: 'Zero or more, lazy', desc: 'Lazy *' },
    { token: '+?', tip: 'One or more, lazy', desc: 'Lazy +' },
    { token: '{n}', tip: 'Exactly n times', desc: 'Exact count' },
    { token: '{n,}', tip: 'At least n times', desc: 'Min count' },
    { token: '{n,m}', tip: 'Between n and m times', desc: 'Range count' },
    { token: '[abc]', tip: 'Any character in the set', desc: 'Character set' },
    { token: '[^abc]', tip: 'Any character NOT in the set', desc: 'Negated set' },
    { token: '[a-z]', tip: 'Any character in the range', desc: 'Range' },
    { token: '(...)', tip: 'Capturing group — accessible via $1, $2...', desc: 'Capture' },
    { token: '(?:...)', tip: 'Non-capturing group', desc: 'Non-capture' },
    { token: '(?=...)', tip: 'Positive lookahead', desc: 'Lookahead' },
    { token: '(?!...)', tip: 'Negative lookahead', desc: 'Neg lookahead' },
    { token: '(?<=...)', tip: 'Positive lookbehind', desc: 'Lookbehind' },
    { token: '(?<!...)', tip: 'Negative lookbehind', desc: 'Neg lookbehind' },
    { token: '|', tip: 'Alternation — matches either side', desc: 'OR' },
    { token: '\\1', tip: 'Backreference to group 1', desc: 'Backref' },
    { token: '\\', tip: 'Escape special character', desc: 'Escape' },
  ];

  /* =====================================================
     9. REGEX LIBRARY
     ===================================================== */
  const LIBRARY = [
    { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'g', desc: 'Basic email address pattern' },
    { name: 'Phone (Intl.)', pattern: '\\+?\\d{1,3}[\\s.-]?\\(?\\d{1,4}\\)?[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,9}', flags: 'g', desc: 'International phone formats' },
    { name: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g', desc: 'IPv4 address (000.000.000.000)' },
    { name: 'IPv6', pattern: '(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}', flags: 'g', desc: 'Full IPv6 address' },
    { name: 'URL', pattern: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*', flags: 'gi', desc: 'HTTP/HTTPS URL' },
    { name: 'Username', pattern: '^[a-zA-Z0-9_]{3,16}$', flags: '', desc: '3-16 alphanumeric chars / underscore' },
    { name: 'Password (Strong)', pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}', flags: '', desc: 'Min 8 chars with mixed cases, digit & symbol' },
    { name: 'Hex Color', pattern: '#(?:[A-Fa-f0-9]{3}){1,2}\\b', flags: 'g', desc: '#RGB or #RRGGBB' },
    { name: 'Credit Card', pattern: '\\b(?:\\d[ -]*?){13,19}\\b', flags: 'g', desc: '13-19 digit card numbers' },
    { name: 'ZIP Code (US)', pattern: '\\b\\d{5}(?:-\\d{4})?\\b', flags: 'g', desc: '5-digit or ZIP+4' },
    { name: 'Date (ISO)', pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b', flags: 'g', desc: 'YYYY-MM-DD' },
    { name: 'Date (US)', pattern: '\\b\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}\\b', flags: 'g', desc: 'MM/DD/YYYY' },
    { name: 'Time (24h)', pattern: '\\b(?\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?\\b', flags: 'g', desc: 'HH:MM or HH:MM:SS' },
    { name: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', flags: 'gi', desc: 'UUID v1-v5' },
    { name: 'HTML Tags', pattern: '<\\/?[a-z][\\s\\S]*?>', flags: 'gi', desc: 'Any HTML tag (open or close)' },
    { name: 'Hashtag', pattern: '#[A-Za-z0-9_]+', flags: 'g', desc: 'Social media hashtag' },
    { name: 'Mention', pattern: '@[A-Za-z0-9_]+', flags: 'g', desc: 'Social media @mention' },
    { name: 'Numbers', pattern: '\\b\\d+(\\.\\d+)?\\b', flags: 'g', desc: 'Integer or decimal' },
    { name: 'Quoted String', pattern: '"([^"\\\\]|\\\\.)*"', flags: 'g', desc: 'Double-quoted string with escapes' },
    { name: 'Slug', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', flags: '', desc: 'URL-safe slug' },
  ];

  /* =====================================================
     10. SAMPLE TEXT
     ===================================================== */
  const SAMPLE_TEXT = `Hello there! Here's a comprehensive sample to test regex patterns against:

📧 Emails:
  - john.doe@example.com
  - user+tag@subdomain.example.co.uk
  - first.last@company.io

🌐 URLs:
  - https://www.example.com/path?query=1
  - http://api.service.org/v2/users
  - https://github.com/user/repo.git

📞 Phone numbers:
  - +1 (555) 123-4567
  - 555-123-4567
  - +44 20 7946 0958
  - 555.123.4567

📅 Dates & Times:
  - 2024-03-15
  - 03/15/2024
  - 14:30:00
  - 2024-12-31 23:59:59

🎨 Colors:
  - #FF5733
  - #00f
  - #ABCDEF
  - rgb(255, 99, 71)

🌍 IP addresses:
  - IPv4: 192.168.1.1, 10.0.0.255
  - IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334

📍 Other:
  - ZIP: 90210, 10001-1234
  - UUID: 550e8400-e29b-41d4-a716-446655440000
  - Credit card: 4532-1234-5678-9010
  - HTML: <div class="container"><p>Hello world!</p></div>

#regex #testing #developer @regex_pro`;

  /* =====================================================
     11. HISTORY & FAVORITES
     ===================================================== */
  const History = {
    load() { state.history = RegexCore.normalizeStoredList(Storage.get(Storage.KEYS.HISTORY, []), 20); },
    save() { Storage.set(Storage.KEYS.HISTORY, state.history.slice(0, 20)); },
    add(pattern, flags) {
      if (!pattern) return;
      state.history = state.history.filter(h => h.pattern !== pattern);
      state.history.unshift({ pattern, flags, ts: getTimestamp() });
      state.history = state.history.slice(0, 20);
      this.save();
      this.render();
    },
    clear() {
      state.history = [];
      this.save();
      this.render();
    },
    render() {
      const panel = dom.panelHistory;
      if (state.history.length === 0) {
        panel.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <p>No recent regex history yet.<br/>Start testing to see your history here.</p>
          </div>`;
        return;
      }
      panel.innerHTML = state.history.map((h, i) => `
        <div class="list-item" data-history-idx="${i}">
          <span class="item-pattern" title="${escapeHtml(h.pattern)}">${escapeHtml(h.pattern)}</span>
          <span class="item-flags">/${escapeHtml(h.flags)}</span>
          <span class="item-time">${formatTimeAgo(h.ts)}</span>
          <button class="item-remove" data-history-remove="${i}" aria-label="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('');
    },
    apply(idx) {
      const h = state.history[idx];
      if (!h) return;
      setPattern(h.pattern, h.flags);
      Toast.success('Pattern loaded from history');
    },
  };

  const Favorites = {
    load() { state.favorites = RegexCore.normalizeStoredList(Storage.get(Storage.KEYS.FAVORITES, []), 100); },
    save() { Storage.set(Storage.KEYS.FAVORITES, state.favorites); },
    toggle(pattern, flags) {
      if (!pattern) { Toast.warning('Nothing to favorite'); return; }
      const idx = state.favorites.findIndex(f => f.pattern === pattern);
      if (idx >= 0) {
        state.favorites.splice(idx, 1);
        Toast.info('Removed from favorites');
      } else {
        state.favorites.unshift({ pattern, flags, ts: getTimestamp() });
        Toast.success('Added to favorites ⭐');
      }
      this.save();
      this.render();
    },
    remove(idx) {
      state.favorites.splice(idx, 1);
      this.save();
      this.render();
    },
    render() {
      const panel = dom.panelFavorites;
      if (state.favorites.length === 0) {
        panel.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <p>No favorites yet.<br/>Click the ★ icon to save a pattern.</p>
          </div>`;
        return;
      }
      panel.innerHTML = state.favorites.map((f, i) => `
        <div class="list-item" data-fav-idx="${i}">
          <span class="item-pattern" title="${escapeHtml(f.pattern)}">${escapeHtml(f.pattern)}</span>
          <span class="item-flags">/${escapeHtml(f.flags)}</span>
          <button class="item-remove" data-fav-remove="${i}" aria-label="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('');
    },
    apply(idx) {
      const f = state.favorites[idx];
      if (!f) return;
      setPattern(f.pattern, f.flags);
      Toast.success('Favorite loaded');
    },
  };

  /* =====================================================
     12. RENDERERS
     ===================================================== */
  function renderCheatsheet(filter = '') {
    const q = filter.toLowerCase().trim();
    const items = CHEATSHEET.filter(it =>
      !q || it.token.toLowerCase().includes(q) || it.tip.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)
    );
    if (items.length === 0) {
      dom.panelCheatsheet.innerHTML = `<div class="empty-state"><p>No matches for "${escapeHtml(q)}"</p></div>`;
      return;
    }
    dom.panelCheatsheet.innerHTML = items.map(it => `
      <div class="cheat-item" data-token="${escapeHtml(it.token)}" data-tip="${escapeHtml(it.tip)}">
        <code>${escapeHtml(it.token)}</code>
        <span class="cheat-desc">${escapeHtml(it.desc)}</span>
      </div>
    `).join('');
  }

  function renderLibrary(filter = '') {
    const q = filter.toLowerCase().trim();
    const items = LIBRARY.filter(it =>
      !q || it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q) || it.pattern.toLowerCase().includes(q)
    );
    if (items.length === 0) {
      dom.panelLibrary.innerHTML = `<div class="empty-state"><p>No matches for "${escapeHtml(q)}"</p></div>`;
      return;
    }
    dom.panelLibrary.innerHTML = items.map((it, i) => `
      <div class="lib-item" data-lib-idx="${i}">
        <div class="lib-name">${escapeHtml(it.name)}</div>
        <span class="lib-pattern">/${escapeHtml(it.pattern)}/${escapeHtml(it.flags)}</span>
        <div class="lib-desc">${escapeHtml(it.desc)}</div>
      </div>
    `).join('');
  }

  /* =====================================================
     13. MAIN UPDATE PIPELINE
     ===================================================== */
  async function update() {
    const runId = ++state.evaluationId;
    state.pattern = dom.regexInput.value;
    state.flags = dom.flagsInput.value;
    state.text = dom.testString.value;
    updateTextMeta();

    if (!state.pattern) {
      RegexWorker.cancel('evaluate', 'Pattern cleared.');
      RegexWorker.cancel('replace', 'Pattern cleared.');
      state.matches = [];
      state.matchesTruncated = false;
      clearResults();
      hideError();
      setStatus('', 'Ready');
      dom.explanation.innerHTML = '<div class="placeholder">Enter a pattern to see a human-readable explanation.</div>';
      dom.replacePreview.innerHTML = '<span class="placeholder">Replacement preview will appear here.</span>';
      renderSplit(state.text, null, [state.text]);
      dom.stopRegexButton.disabled = true;
      return;
    }

    const compiled = RegexEngine.compile(state.pattern, state.flags);
    if (compiled.error) {
      RegexWorker.cancel('evaluate', 'Invalid pattern.');
      state.matches = [];
      state.matchesTruncated = false;
      showError(compiled.error);
      setStatus('error', 'Invalid regex');
      clearResults();
      dom.explanation.innerHTML = Explainer.render(state.pattern);
      dom.replacePreview.innerHTML = '<span class="placeholder">Fix regex errors first.</span>';
      renderSplit(state.text, null, [state.text]);
      dom.stopRegexButton.disabled = true;
      return;
    }

    hideError();
    dom.stopRegexButton.disabled = false;
    setStatus('pending', 'Evaluating…');
    try {
      const result = await RegexWorker.run({
        op: 'evaluate', pattern: state.pattern, flags: state.flags,
        text: state.text, replacement: dom.replaceInput.value
      }, { channel: 'evaluate', timeoutMs: 2500 });

      if (runId !== state.evaluationId) return;
      state.matches = result.matches || [];
      state.matchesTruncated = Boolean(result.truncated);
      hideError();
      dom.stopRegexButton.disabled = true;
      setStatus(state.matchesTruncated ? 'warning' : 'ok',
        formatNumber(state.matches.length) + (state.matchesTruncated ? '+ matches (limit reached)' : ' match' + (state.matches.length !== 1 ? 'es' : '')));
      renderHighlight();
      renderMatchInfo();
      renderExplanation();
      renderReplace(result.replaceResult, true);
      renderSplit(state.text, compiled.regex, result.segments || [], result.segmentsTruncated);
      debouncedHistory();
    } catch (error) {
      if (runId !== state.evaluationId || error.code === 'CANCELLED') return;
      state.matches = [];
      state.matchesTruncated = false;
      dom.stopRegexButton.disabled = true;
      showError(error && error.message ? error.message : 'Regex evaluation failed.');
      setStatus('error', error && error.code === 'REGEX_TIMEOUT' ? 'Stopped (timeout)' : 'Evaluation error');
      clearResults();
      dom.explanation.innerHTML = Explainer.render(state.pattern);
      dom.replacePreview.innerHTML = '<span class="placeholder">Evaluation could not be completed.</span>';
      renderSplit(state.text, null, [state.text]);
    }
  }

  let lastSavedPattern = '';
  const debouncedHistory = debounce(() => {
    if (state.pattern && state.pattern !== lastSavedPattern) {
      lastSavedPattern = state.pattern;
      History.add(state.pattern, state.flags);
    }
  }, 800);

  function clearResults() {
    dom.highlightedOutput.innerHTML = state.text ? escapeHtml(state.text) : '<div class="placeholder">Your matched text will appear here in real-time.</div>';
    dom.matchCount.textContent = '0 matches';
    dom.infoTotal.textContent = '0';
    dom.infoFirst.textContent = '—';
    dom.infoLast.textContent = '—';
    dom.infoPattern.textContent = state.pattern ? `/${state.pattern}/${state.flags}` : '—';
    dom.matchList.innerHTML = '';
  }

  function renderHighlight() {
    if (state.text.length === 0 && state.matches.length === 0) {
      dom.highlightedOutput.innerHTML = '<div class="placeholder">Enter text to see matches highlighted.</div>';
      dom.matchCount.textContent = '0 matches';
      return;
    }
    dom.highlightedOutput.innerHTML = RegexEngine.highlight(state.text, state.matches);
    const n = state.matches.length;
    dom.matchCount.textContent = formatNumber(n) + (state.matchesTruncated ? '+ matches (truncated)' : ' match' + (n !== 1 ? 'es' : ''));
  }

  function renderMatchInfo() {
    const n = state.matches.length;
    dom.infoTotal.textContent = formatNumber(n) + (state.matchesTruncated ? '+' : '');
    dom.infoPattern.textContent = '/' + state.pattern + '/' + state.flags;
    if (n === 0) {
      dom.infoFirst.textContent = '—';
      dom.infoLast.textContent = '—';
      dom.matchList.innerHTML = '<div class="empty-state" style="padding:20px"><p>No matches found.</p></div>';
      return;
    }
    const first = state.matches[0];
    const last = state.matches[n - 1];
    dom.infoFirst.textContent = truncate(first.full, 30);
    dom.infoLast.textContent = truncate(last.full, 30);

    dom.matchList.innerHTML = state.matches.slice(0, 100).map((m, i) => {
      const groupsHtml = m.groups.length > 0
        ? '<div class="match-groups">' + m.groups.map((g, gi) => (
            '<div class="group-row"><span class="g-label">Group ' + (gi + 1) + ':</span>' +
            '<span class="' + (g === undefined ? 'g-empty' : 'g-value') + '">' +
            (g === undefined ? '(not matched)' : escapeHtml(truncate(g, 80))) + '</span></div>'
          )).join('') +
          (Object.keys(m.namedGroups).length > 0 ? Object.entries(m.namedGroups).map(([k, v]) => (
            '<div class="group-row"><span class="g-label">' + escapeHtml(k) + ':</span>' +
            '<span class="' + (v === undefined ? 'g-empty' : 'g-value') + '">' +
            (v === undefined ? '(not matched)' : escapeHtml(truncate(v, 80))) + '</span></div>'
          )).join('') : '') + '</div>'
        : '';
      return '<div class="match-card"><div class="match-header">' +
        '<span class="match-num">#' + (i + 1) + '</span>' +
        '<span class="match-pos">pos ' + m.index + '–' + m.end + ' · length ' + m.full.length + '</span></div>' +
        '<div class="match-text">' + escapeHtml(truncate(m.full, 200)) + '</div>' + groupsHtml + '</div>';
    }).join('') +
      (n > 100 ? '<div class="empty-state" style="padding:12px"><p>Showing first 100 of ' + formatNumber(n) + ' matches.</p></div>' : '') +
      (state.matchesTruncated ? '<div class="empty-state" style="padding:12px"><p>Match cap reached. Additional matches may exist.</p></div>' : '');
  }

  function renderExplanation() {
    dom.explanation.innerHTML = Explainer.render(state.pattern);
  }

  async function renderReplace(precomputedResult, isPrecomputed) {
    const pattern = state.pattern, flags = state.flags, text = state.text;
    const replacement = dom.replaceInput.value;
    if (!pattern) {
      dom.replacePreview.innerHTML = '<span class="placeholder">Replacement preview will appear here.</span>';
      return;
    }
    if (text.length === 0) {
      dom.replacePreview.innerHTML = '<span class="placeholder">Enter text to preview replacement.</span>';
      state.lastResult = '';
      return;
    }
    let result = precomputedResult;
    if (!isPrecomputed) {
      try {
        const response = await RegexWorker.run({
          op: 'replace', pattern: pattern, flags: flags, text: text,
          replacement: replacement, all: true
        }, { channel: 'replace', timeoutMs: 2500 });
        if (pattern !== state.pattern || flags !== state.flags || text !== state.text || replacement !== dom.replaceInput.value) return;
        result = response.replaceResult;
      } catch (error) {
        if (error.code !== 'CANCELLED') dom.replacePreview.textContent = error.message || 'Replacement preview failed.';
        return;
      }
    }
    if (typeof result !== 'string') return;
    if (result === text && state.matches.length > 0 && replacement !== '') {
      dom.replacePreview.innerHTML = escapeHtml(result) + ' <em style="color:var(--text-dim);font-size:11px">(no change)</em>';
    } else {
      dom.replacePreview.innerHTML = escapeHtml(result) || '<em style="color:var(--text-dim)">(empty)</em>';
    }
    state.lastResult = result;
  }

  function renderSplit(text, regex, suppliedSegments, segmentsTruncated) {
    if (!regex) {
      dom.splitResult.innerHTML = '<div class="placeholder">Enter a pattern to split text.</div>';
      dom.splitCount.textContent = '0 segments';
      return;
    }
    const segments = Array.isArray(suppliedSegments) ? suppliedSegments : [];
    dom.splitCount.textContent = formatNumber(segments.length) +
      (segments.length !== 1 ? ' segments' : ' segment') + (segmentsTruncated ? ' (truncated)' : '');
    dom.splitResult.innerHTML = segments.map((segment, i) =>
      '<div class="split-segment ' + (segment === '' ? 'empty' : '') + '">' +
      '<span class="seg-idx">#' + (i + 1) + '</span>' +
      (segment === '' ? '(empty)' : escapeHtml(truncate(segment, 100))) + '</div>'
    ).join('') + (segmentsTruncated ? '<div class="empty-state" style="padding:12px"><p>Split output limited to the first 50,000 segments.</p></div>' : '');
  }

  function updateTextMeta() {
    const text = state.text;
    dom.charCount.textContent = `${formatNumber(text.length)} characters`;
    dom.lineCount.textContent = `${formatNumber(text.split('\n').length)} line${text.split('\n').length !== 1 ? 's' : ''}`;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    dom.wordCount.textContent = `${formatNumber(words)} word${words !== 1 ? 's' : ''}`;
  }

  function showError(msg) {
    dom.regexError.textContent = msg;
    dom.regexError.classList.remove('hidden');
  }

  function hideError() {
    dom.regexError.classList.add('hidden');
  }

  function setStatus(type, text) {
    dom.regexStatus.className = 'status-pill ' + (type || '');
    dom.regexStatus.textContent = text;
  }

  /* =====================================================
     14. PATTERN & FLAGS SETTERS
     ===================================================== */
  function setPattern(pattern, flags) {
    dom.regexInput.value = pattern;
    dom.flagsInput.value = flags || '';
    // Sync flag toggles
    dom.flagToggles.forEach(input => {
      input.checked = (flags || '').includes(input.dataset.flag);
    });
    update();
  }

  function syncFlagsFromToggles() {
    let f = '';
    dom.flagToggles.forEach(input => {
      if (input.checked) f += input.dataset.flag;
    });
    dom.flagsInput.value = f;
  }

  /* =====================================================
     15. ACTION HANDLERS
     ===================================================== */
  const Actions = {
    async copyRegex() {
      const text = `${state.pattern}`;
      if (!state.pattern) { Toast.warning('Nothing to copy'); return; }
      if (await copyToClipboard(text)) Toast.success('Regex copied to clipboard');
      else Toast.error('Failed to copy');
    },

    async copyMatches() {
      if (state.matches.length === 0) { Toast.warning('No matches to copy'); return; }
      const data = state.matches.map((m, i) => ({
        index: i + 1,
        match: m.full,
        start: m.index,
        end: m.end,
        length: m.full.length,
        groups: m.groups,
        namedGroups: m.namedGroups,
      }));
      if (await copyToClipboard(JSON.stringify(data, null, 2))) Toast.success(`${state.matches.length} matches copied as JSON`);
      else Toast.error('Failed to copy');
    },

    async copyResult() {
      const text = state.lastResult || '';
      if (!text) { Toast.warning('No result to copy'); return; }
      if (await copyToClipboard(text)) Toast.success('Result copied');
      else Toast.error('Failed to copy');
    },

    downloadJSON() {
      if (state.matches.length === 0) { Toast.warning('No matches to download'); return; }
      const data = {
        pattern: state.pattern,
        flags: state.flags,
        timestamp: new Date().toISOString(),
        matchCount: state.matches.length,
        text: state.text,
        matches: state.matches.map((m, i) => ({
          index: i + 1,
          match: m.full,
          start: m.index,
          end: m.end,
          length: m.full.length,
          groups: m.groups,
          namedGroups: m.namedGroups,
        })),
      };
      downloadFile('regex-results.json', JSON.stringify(data, null, 2), 'application/json');
      Toast.success('JSON downloaded');
      closeDownloadMenu();
    },

    downloadTXT() {
      if (state.matches.length === 0) { Toast.warning('No matches to download'); return; }
      let content = `Regex: /${state.pattern}/${state.flags}\n`;
      content += `Total Matches: ${state.matches.length}\n`;
      content += `Generated: ${new Date().toLocaleString()}\n`;
      content += '='.repeat(50) + '\n\n';
      state.matches.forEach((m, i) => {
        content += `[#${i + 1}] pos ${m.index}-${m.end}: ${m.full}\n`;
        if (m.groups.length > 0) {
          m.groups.forEach((g, gi) => {
            content += `    Group ${gi + 1}: ${g === undefined ? '(not matched)' : g}\n`;
          });
        }
      });
      downloadFile('regex-results.txt', content, 'text/plain');
      Toast.success('TXT downloaded');
      closeDownloadMenu();
    },

    async replaceFirst() {
      if (!state.pattern) { Toast.warning('Enter a regex first'); return; }
      const compiled = RegexEngine.compile(state.pattern, state.flags);
      if (compiled.error) { Toast.error(compiled.error); return; }
      try {
        const response = await RegexWorker.run({
          op: 'replace', pattern: state.pattern, flags: state.flags, text: state.text,
          replacement: dom.replaceInput.value, all: false
        }, { channel: 'action-replace-first', timeoutMs: 2500 });
        state.lastResult = response.replaceResult;
        dom.replacePreview.innerHTML = escapeHtml(response.replaceResult) || '<em style="color:var(--text-dim)">(empty)</em>';
        Toast.info('First occurrence replaced in preview');
      } catch (error) { Toast.error(error.message || 'Replacement failed'); }
    },

    async replaceAll() {
      if (!state.pattern) { Toast.warning('Enter a regex first'); return; }
      const compiled = RegexEngine.compile(state.pattern, state.flags);
      if (compiled.error) { Toast.error(compiled.error); return; }
      try {
        const response = await RegexWorker.run({
          op: 'replace', pattern: state.pattern, flags: state.flags, text: state.text,
          replacement: dom.replaceInput.value, all: true
        }, { channel: 'action-replace-all', timeoutMs: 2500 });
        state.lastResult = response.replaceResult;
        dom.replacePreview.innerHTML = escapeHtml(response.replaceResult) || '<em style="color:var(--text-dim)">(empty)</em>';
        Toast.success('Preview updated');
      } catch (error) { Toast.error(error.message || 'Replacement failed'); }
    },

    async applyReplace() {
      if (!state.pattern) { Toast.warning('Enter a regex first'); return; }
      const compiled = RegexEngine.compile(state.pattern, state.flags);
      if (compiled.error) { Toast.error(compiled.error); return; }
      try {
        const response = await RegexWorker.run({
          op: 'replace', pattern: state.pattern, flags: state.flags, text: state.text,
          replacement: dom.replaceInput.value, all: true
        }, { channel: 'action-apply-replace', timeoutMs: 2500 });
        dom.testString.value = response.replaceResult;
        await update();
        Toast.success('Replacement applied to text');
      } catch (error) { Toast.error(error.message || 'Replacement failed'); }
    },

    stopRegex() {
      state.evaluationId++;
      RegexWorker.cancel('evaluate', 'Stopped by user.');
      dom.stopRegexButton.disabled = true;
      state.matches = [];
      state.matchesTruncated = false;
      clearResults();
      showError('Regex evaluation stopped.');
      setStatus('error', 'Stopped');
    },

    clearAll() {
      if (!state.pattern && !state.text && !dom.replaceInput.value) {
        Toast.info('Already empty');
        return;
      }
      dom.regexInput.value = '';
      dom.flagsInput.value = '';
      dom.testString.value = '';
      dom.replaceInput.value = '';
      dom.flagToggles.forEach(t => { if (t.dataset.flag === 'g') t.checked = true; else t.checked = false; });
      Storage.remove(Storage.KEYS.TEXT);
      Storage.remove(Storage.KEYS.PATTERN);
      Storage.remove(Storage.KEYS.FLAGS);
      Storage.remove(Storage.KEYS.REPLACE);
      update();
      Toast.success('Cleared all fields');
    },

    clearText() {
      dom.testString.value = '';
      Storage.remove(Storage.KEYS.TEXT);
      update();
      Toast.info('Test text cleared');
    },

    loadSample() {
      dom.testString.value = SAMPLE_TEXT;
      update();
      Toast.success('Sample text loaded');
    },

    saveFavorite() {
      if (!state.pattern) { Toast.warning('Enter a pattern first'); return; }
      Favorites.toggle(state.pattern, state.flags);
    },

    showHelp() {
      dom.helpModal.classList.remove('hidden');
    },

    closeHelp() {
      dom.helpModal.classList.add('hidden');
    },
  };

  function toggleDownloadMenu(force) {
    const isOpen = dom.downloadMenu.classList.contains('open');
    if (force === true || !isOpen) dom.downloadMenu.classList.add('open');
    else dom.downloadMenu.classList.remove('open');
  }

  function closeDownloadMenu() {
    dom.downloadMenu.classList.remove('open');
  }

  /* =====================================================
     16. EVENT BINDING
     ===================================================== */
  function bindEvents() {
    // Regex inputs
    dom.regexInput.addEventListener('input', debounce(update, 80));
    dom.flagsInput.addEventListener('input', () => {
      // Strip invalid chars
      dom.flagsInput.value = dom.flagsInput.value.replace(/[^dgimsuvy]/g, '');
      // Sync toggles
      const f = dom.flagsInput.value;
      dom.flagToggles.forEach(input => { input.checked = f.includes(input.dataset.flag); });
      update();
    });

    // Flag toggles
    dom.flagToggles.forEach(input => {
      input.addEventListener('change', () => {
        syncFlagsFromToggles();
        update();
      });
    });

    // Test string
    dom.testString.addEventListener('input', debounce(update, 120));
    dom.replaceInput.addEventListener('input', debounce(renderReplace, 120));

    // File upload
    dom.fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      await loadFile(file);
      dom.fileInput.value = '';
    });

    // Drag & drop
    let dragCounter = 0;
    const testCard = document.getElementById('testStringCard');
    const dropOverlay = dom.dropZone.querySelector('.drop-overlay');

    ['dragenter', 'dragover'].forEach(ev => {
      dom.dropZone.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (ev === 'dragenter') dragCounter++;
        dropOverlay.classList.add('active');
      });
    });
    ['dragleave', 'drop'].forEach(ev => {
      dom.dropZone.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (ev === 'dragleave') {
          dragCounter--;
          if (dragCounter <= 0) {
            dragCounter = 0;
            dropOverlay.classList.remove('active');
          }
        }
      });
    });
    dom.dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dragCounter = 0;
      dropOverlay.classList.remove('active');
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) await loadFile(file);
    });

    // Global drag prevent
    ['dragover', 'drop'].forEach(ev => {
      window.addEventListener(ev, (e) => {
        if (!dom.dropZone.contains(e.target)) e.preventDefault();
      });
    });

    // Sidebar tabs
    dom.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        dom.tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        dom.panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        state.activeTab = tab.dataset.tab;
        document.getElementById('panel-' + state.activeTab).classList.add('active');
      });
    });

    // Sidebar search
    dom.sidebarSearch.addEventListener('input', debounce((e) => {
      const q = e.target.value;
      if (state.activeTab === 'cheatsheet') renderCheatsheet(q);
      else if (state.activeTab === 'library') renderLibrary(q);
    }, 150));

    // Delegated clicks for dynamic items
    document.addEventListener('click', (e) => {
      // Cheatsheet token click → insert at cursor
      const cheat = e.target.closest('.cheat-item');
      if (cheat) {
        const token = cheat.dataset.token;
        insertAtCursor(dom.regexInput, token);
        dom.regexInput.focus();
        update();
        return;
      }
      // Library item click
      const lib = e.target.closest('.lib-item');
      if (lib) {
        const idx = parseInt(lib.dataset.libIdx, 10);
        const item = LIBRARY[idx];
        if (item) {
          setPattern(item.pattern, item.flags);
          Toast.success(`Loaded: ${item.name}`);
        }
        return;
      }
      // History item
      const hist = e.target.closest('.list-item[data-history-idx]');
      if (hist && !e.target.closest('[data-history-remove]')) {
        History.apply(parseInt(hist.dataset.historyIdx, 10));
        return;
      }
      // History remove
      const histRm = e.target.closest('[data-history-remove]');
      if (histRm) {
        e.stopPropagation();
        state.history.splice(parseInt(histRm.dataset.historyRemove, 10), 1);
        History.save();
        History.render();
        return;
      }
      // Favorite item
      const fav = e.target.closest('.list-item[data-fav-idx]');
      if (fav && !e.target.closest('[data-fav-remove]')) {
        Favorites.apply(parseInt(fav.dataset.favIdx, 10));
        return;
      }
      // Favorite remove
      const favRm = e.target.closest('[data-fav-remove]');
      if (favRm) {
        e.stopPropagation();
        Favorites.remove(parseInt(favRm.dataset.favRemove, 10));
        return;
      }
      // Download menu trigger
      const dlTrigger = e.target.closest('[data-action="downloadMenu"]');
      if (dlTrigger) {
        toggleDownloadMenu();
        return;
      }
      // Any other action button
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (Actions[action]) void Actions[action]();
        return;
      }
      // Close download menu on outside click
      if (!e.target.closest('.dropdown')) closeDownloadMenu();
    });

    // Resize handle
    let isResizing = false;
    dom.resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      dom.resizeHandle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, 250), 550);
      dom.sidebar.style.width = newWidth + 'px';
      state.sidebarWidth = newWidth;
    });
    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        dom.resizeHandle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        Storage.set(Storage.KEYS.WIDTH, state.sidebarWidth);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const meta = e.ctrlKey || e.metaKey;

      if (meta && e.key === 'Enter') {
        e.preventDefault();
        update();
        Toast.info('Re-evaluated');
        return;
      }
      if (meta && e.key === 'k') {
        e.preventDefault();
        dom.regexInput.focus();
        dom.regexInput.select();
        return;
      }
      if (meta && !e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        Actions.clearAll();
        return;
      }
      if (meta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        Actions.saveFavorite();
        return;
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        Actions.copyRegex();
        return;
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        Actions.applyReplace();
        return;
      }
      if (e.key === 'Escape') {
        if (!dom.helpModal.classList.contains('hidden')) {
          Actions.closeHelp();
        }
        closeDownloadMenu();
        return;
      }
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        Actions.showHelp();
      }
    });

    // Auto-save (debounced)
    const autoSave = debounce(() => {
      Storage.set(Storage.KEYS.TEXT, state.text);
      Storage.set(Storage.KEYS.PATTERN, state.pattern);
      Storage.set(Storage.KEYS.FLAGS, state.flags);
      Storage.set(Storage.KEYS.REPLACE, dom.replaceInput.value);
    }, 600);

    dom.regexInput.addEventListener('input', autoSave);
    dom.flagsInput.addEventListener('input', autoSave);
    dom.testString.addEventListener('input', autoSave);
    dom.replaceInput.addEventListener('input', autoSave);

    // Help modal backdrop click
    dom.helpModal.addEventListener('click', (e) => {
      if (e.target === dom.helpModal) Actions.closeHelp();
    });
  }

  /* =====================================================
     17. FILE LOADER
     ===================================================== */
  async function loadFile(file) {
    if (!file || typeof file.text !== 'function') { Toast.error('Choose a readable text file'); return; }
    if (file.size > 5 * 1024 * 1024) {
      Toast.error('File too large (max 5MB)');
      return;
    }
    try {
      const text = await file.text();
      dom.testString.value = text;
      update();
      Toast.success(`Loaded "${file.name}"`);
    } catch (e) {
      Toast.error('Failed to read file');
    }
  }

  /* =====================================================
     18. HELPERS
     ===================================================== */
  function insertAtCursor(input, text) {
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    input.value = before + text + after;
    const newPos = start + text.length;
    input.setSelectionRange(newPos, newPos);
  }

  /* =====================================================
     19. INITIALIZATION
     ===================================================== */
  function init() {
    // Load persistent state
    History.load();
    Favorites.load();

    const savedPattern = Storage.get(Storage.KEYS.PATTERN, '');
    const savedFlags = Storage.get(Storage.KEYS.FLAGS, 'g');
    const savedText = Storage.get(Storage.KEYS.TEXT, '');
    const savedReplace = Storage.get(Storage.KEYS.REPLACE, '');
    const savedWidth = Storage.get(Storage.KEYS.WIDTH, 320);

    if (savedWidth) {
      dom.sidebar.style.width = savedWidth + 'px';
      state.sidebarWidth = savedWidth;
    }

    // Restore UI values
    if (savedPattern) {
      dom.regexInput.value = savedPattern;
      state.pattern = savedPattern;
      lastSavedPattern = savedPattern;
    }
    if (savedFlags) {
      dom.flagsInput.value = savedFlags;
      // Sync toggles
      dom.flagToggles.forEach(input => {
        input.checked = savedFlags.includes(input.dataset.flag);
      });
    } else {
      dom.flagToggles.forEach(input => {
        input.checked = input.dataset.flag === 'g';
      });
      dom.flagsInput.value = 'g';
    }
    if (savedText) dom.testString.value = savedText;
    if (savedReplace) dom.replaceInput.value = savedReplace;

    // Initial render
    renderCheatsheet();
    renderLibrary();
    History.render();
    Favorites.render();

    // Bind events
    bindEvents();

    // First update
    update();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();