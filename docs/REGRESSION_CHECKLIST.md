# Regression Checklist

**Automation coverage:** 10/10 requested regression scenarios are represented in `tests/regex-core.test.js`. A checked item means an automated regression assertion has been added; it does not imply the latest CI run passed.

## Regex engine and UI regressions

- [x] **Capture offsets** — Verify `/(a)(b)/` highlights both capture groups at the correct positions.
- [x] **Named groups** — Verify `/(?<word>hello)/` produces the correct named-group data.
- [x] **Unmatched groups** — Verify `/(a)?b/` handles the absent capture without errors.
- [x] **Zero-width matches** — Verify `/^/gm` terminates and reports each expected line boundary.
- [x] **Unicode boundaries** — Verify zero-width matches with `/u` do not split surrogate pairs.
- [x] **Invalid flags** — Reject duplicate flags and incompatible combinations with a useful error.
- [x] **Large match counts** — Verify the match cap produces an explicit partial-results warning.
- [x] **ReDoS responsiveness** — Verify the worker client terminates a non-responsive worker when the timeout expires.
- [x] **HTML injection** — Verify user text containing HTML is rendered as escaped text, not executable markup.
- [x] **Persistence recovery** — Verify malformed stored history and favorites safely fall back to normalized defaults.

## Verification

Run `npm test` with Node.js 18 or later. GitHub Actions runs the same suite on pushes and pull requests. Treat the latest workflow result as the test pass/fail status; checkmarks above track coverage, not successful execution.
