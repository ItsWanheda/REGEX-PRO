# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.1] - 2026-10-22

### Fixed
- Validate flags even when the regex pattern is empty.
- Report split output truncation only when segments actually exceed the configured cap.
- Bound highlighted preview rendering for large inputs while preserving full-input match counts.

### Added
- Regression coverage for empty-pattern flag validation, exact split limits, and bounded HTML-safe previews.

## [1.1.0] - 2026-10-22

### Fixed
- Correct capture data shape and character offsets used by match summaries and group highlighting.
- Advance zero-width matches according to Unicode code-point boundaries.
- Reject duplicate flags and the incompatible u/v flag combination with clear errors.
- Fix file upload and drag-and-drop handling to read the selected File rather than the FileList.
- Fix history removal and validate restored localStorage data before rendering.
- Keep saved empty flags consistent with the flag toggles.

### Added
- Worker-isolated regex matching, replacement, and split operations with a 2.5-second timeout and a manual Stop control.
- Explicit warnings when the match or split result cap is reached.
- Resource limits for pattern/text/replacement/output size and favorites count.
- Automated regression tests and a GitHub Actions test workflow.
- d (indices) and v (Unicode sets) flag toggles.

## [1.0.0] - 2024-08-03

### ✨ Initial Release

#### Added
- **Core Regex Testing**
  - Real-time pattern matching with live syntax validation
  - Live highlight of matches and capture groups
  - Support for all JavaScript regex flags (g, i, m, s, u, y)
  - Instant error detection and reporting

- **Advanced Tools**
  - Replace Tool with backreference support ($1, $2, $&, $\`, $', $$)
  - Split Tool for string segmentation by regex delimiter
  - Pattern Explanation generator (human-readable regex breakdown)
  - Match Information panel with detailed statistics

- **Match Display**
  - Highlighted output with color-coded matches and groups
  - Match count badge
  - First/Last match display
  - Complete match list with indices
  - Real-time statistics (total matches, character/word/line counts)

- **Storage & History**
  - Persistent storage of patterns, flags, and test text via localStorage
  - Auto-saving of all work (no manual save required)
  - History tracking with timestamps
  - Favorites management with one-click recall
  - Clear history / clear favorites functions

- **Productivity Features**
  - Copy regex pattern (Ctrl+Shift+C)
  - Copy matches as JSON
  - Copy replace results
  - Download as JSON (full configuration)
  - Download as TXT (matches)
  - File upload support (up to 5MB)
  - Drag & drop file loading
  - Sample pattern loading

- **User Interface**
  - Modern glassmorphism design
  - Responsive dark theme
  - Smooth animations and transitions
  - Sidebar with resizable handle
  - Tabbed navigation (Cheatsheet, Library, History, Favorites)
  - Toast notifications for feedback
  - Help modal with keyboard shortcuts

- **Accessibility**
  - Full ARIA labels and semantic HTML
  - Keyboard navigation support
  - Focus management
  - Screen reader friendly
  - Proper heading hierarchy
  - Role attributes for dynamic content

- **Keyboard Shortcuts**
  - Ctrl+K: Focus regex input
  - Ctrl+Enter: Force re-run matching
  - Ctrl+L: Clear all
  - Ctrl+D: Save to favorites
  - Ctrl+Shift+C: Copy regex
  - Ctrl+Shift+R: Replace all
  - Esc: Close modals
  - ?: Show help

- **Reference Materials**
  - Built-in regex cheatsheet
  - Common pattern library
  - Inline pattern examples
  - Pattern suggestions

#### Technical Details
- **No Dependencies**: Pure vanilla HTML5, CSS3, and JavaScript
- **No Backend**: Completely client-side processing
- **Offline-First**: Works without internet connection
- **Performance Optimized**: Debounced updates, efficient rendering
- **Secure**: No data collection or transmission
- **Modular Code**: IIFE pattern, organized functions, clear separation of concerns

---

## [Unreleased]

### Planned Features
- [ ] Dark/Light theme toggle
- [ ] Custom color scheme editor
- [ ] Regular expression builder (visual pattern constructor)
- [ ] Regex pattern explanation export
- [ ] Multi-pattern testing (test multiple patterns against same text)
- [ ] Performance metrics (milliseconds to match, etc.)
- [ ] Regex flavor selection (JavaScript, PCRE, Python, etc.)
- [ ] Browser extension
- [ ] Mobile app version
- [ ] Community pattern library
- [ ] Pattern testing templates
- [ ] Regex learning mode with interactive tutorials

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 1.0.0 | 2024-08-03 | ✅ Stable Release |
| 0.9.x | (beta) | Previous development |

---

## Bug Fixes & Improvements Timeline

### Path Resolution (Fixed)
- ✅ Fixed incorrect CSS path reference (`./Style/style.css` → `./style.css`)
- ✅ Fixed incorrect JS path reference (`./Script/script.js` → `./script.js`)

### Performance
- ✅ Debounced regex matching (prevents excessive re-evaluation)
- ✅ Optimized highlight rendering for large text
- ✅ Efficient localStorage access with try-catch error handling

### Accessibility
- ✅ Proper ARIA labels on all interactive elements
- ✅ Keyboard navigation throughout
- ✅ Focus indicators and management
- ✅ Semantic HTML structure

---

## Future Roadmap

### Short Term (Next Release)
- Theme customization options
- Export/share patterns via URL
- Regex syntax highlighting in input field
- Batch pattern testing

### Medium Term
- Performance metrics
- Pattern complexity analysis
- Regex to English translation
- Learning mode with tutorials

### Long Term
- Community pattern repository
- Collaborative regex testing
- Team workspace features
- Advanced analytics

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting improvements, reporting bugs, and suggesting features.

---

## Support

For issues, questions, or suggestions:
1. Check existing issues on GitHub
2. Review the README troubleshooting section
3. Open a new issue with detailed information

---

**Last Updated**: 2026-08-03  
**Maintained By**: ItsWanheda