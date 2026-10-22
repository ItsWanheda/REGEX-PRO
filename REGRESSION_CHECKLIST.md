# Regression Checklist

**Review progress:** 3/10 reviewed.  
A checked item means it has been reviewed, not necessarily that its regression test passes.

## Regex engine and UI regressions

- [x] **Capture offsets** — Verify `/(a)(b)/` highlights both capture groups at the correct positions.
- [x] **Named groups** — Verify `/(?<word>hello)/` produces the correct named-group data.
- [x] **Unmatched groups** — Verify `/(a)?b/` handles the absent capture without errors.
- [ ] **Zero-width matches** — Verify `/^/gm` terminates and reports each expected line boundary.
- [ ] **Unicode boundaries** — Verify zero-width matches with `/u` do not split surrogate pairs.
- [ ] **Invalid flags** — Reject duplicate flags and unsupported combinations with a useful error.
- [ ] **Large match counts** — Verify the match cap produces an explicit partial-results warning.
- [ ] **ReDoS responsiveness** — Verify expensive patterns can be stopped without freezing the main UI.
- [ ] **HTML injection** — Verify user text containing HTML is rendered as text, not executed markup.
- [ ] **Persistence recovery** — Verify malformed stored history and favorites safely fall back to defaults.

## Test execution notes

For each item, record the regression test name and the observed result when the test is implemented and run. Do not mark an item as passing solely because the checklist item has been reviewed.
