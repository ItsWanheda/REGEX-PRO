# Contributing to Regex Pro

Thank you for interest in contributing to Regex Pro! We welcome bug reports, feature suggestions, code improvements, and documentation enhancements.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please read and follow our Code of Conduct.

---

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor or IDE (VS Code, Sublime, etc.)
- Git for version control
- Basic knowledge of HTML5, CSS3, and JavaScript

### Local Setup
```bash
# 1. Clone the repository
git clone https://github.com/ItsWanheda/regex-pro.git
cd regex-pro

# 2. Open in browser
open index.html
# or
python3 -m http.server 8000
# then visit http://localhost:8000

# 3. Make changes
# - Edit index.html, style.css, or script.js
# - Browser auto-reloads (or refresh manually)
# - Test your changes thoroughly
```

---

## How to Contribute

### 1. Bug Reports 🐛
Found a bug? Help us fix it!

**Before submitting:**
- Check if bug already exists in Issues
- Test with latest version
- Gather information:
  - Browser and OS
  - Regex pattern that triggers bug
  - Expected vs actual behavior
  - Console errors (F12 → Console)

**Submit bug report:**
```markdown
## Bug: [Short Description]

### Steps to Reproduce
1. Open Regex Pro
2. Enter pattern: `[pattern]`
3. Input text: `[text]`
4. Observe error...

### Expected Behavior
Should display matches

### Actual Behavior
Shows error message

### Environment
- Browser: Chrome 115
- OS: macOS 13
- Regex Pattern: `\d+`
```

### 2. Feature Requests ✨
Have an idea for improvement? We'd love to hear it!

**Before submitting:**
- Check if feature already requested
- Explain use case and benefits
- Provide examples

**Submit feature request:**
```markdown
## Feature: [Title]

### Problem
Users struggle with X because Y

### Proposed Solution
Add feature that allows users to Z

### Example Use Case
When I use regex for [purpose], I need [feature]

### Additional Context
Related to similar tools in X, Y, Z
```

### 3. Code Improvements 💻
Improve existing code, fix issues, add optimizations.

**Good candidates for contribution:**
- Performance optimizations
- Bug fixes
- Code refactoring
- Accessibility improvements
- Documentation updates
- Test coverage

---

## Development Setup

### File Responsibilities

**index.html**
- Semantic HTML5 structure
- ARIA labels and accessibility
- Form elements and containers
- Do NOT add classes or IDs without purpose

**style.css**
- Visual design and layout
- CSS variables for theming
- Responsive design rules
- Animations and transitions
- Keep organized by sections (marked with comments)

**script.js**
- Application logic
- Event handling
- DOM manipulation
- Storage management
- Follows modular IIFE pattern

---

## Coding Standards

### JavaScript Guidelines

#### Code Style
```javascript
// ✅ Good - Use const/let, meaningful names
const matchCount = matches.length;
let isValid = pattern.length > 0;

// ❌ Avoid - var, unclear names
var c = matches.length;
var v = pattern.length > 0;

// ✅ Good - Clear comments for complex logic
function validateRegex(pattern, flags) {
  try {
    new RegExp(pattern, flags);
    return true;
  } catch (e) {
    return false; // Invalid regex syntax
  }
}

// ✅ Good - Arrow functions for callbacks
dom.regexInput.addEventListener('input', () => update());

// ✅ Good - Template literals
const message = `Found ${count} matches`;
```

#### Function Organization
- Keep functions focused and single-purpose
- Max ~50 lines per function (refactor if longer)
- Use clear, descriptive names
- Document complex logic with comments
- Use IIFE pattern to avoid global scope

#### Error Handling
```javascript
// ✅ Good - Handle errors gracefully
try {
  const text = await file.text();
  // process file
} catch (e) {
  Toast.error('Failed to read file');
}

// ✅ Good - localStorage errors
try {
  localStorage.setItem(key, value);
} catch (e) {
  console.warn('Storage unavailable'); // silent fail
}
```

### CSS Guidelines

#### Naming Convention
```css
/* ✅ Good - BEM-like naming */
.button { }
.button--primary { }
.button:hover { }

/* ✅ Good - Descriptive classes */
.toast-container { }
.modal-overlay { }
.sidebar-tabs { }

/* ❌ Avoid - Vague names */
.red { }
.big-text { }
.container2 { }
```

#### CSS Variables
```css
/* ✅ Use variables for consistency */
:root {
  --primary-color: #667eea;
  --spacing-unit: 8px;
  --shadow-md: 0 8px 32px rgba(0,0,0,0.3);
}

.button {
  background: var(--primary-color);
  padding: var(--spacing-unit);
  box-shadow: var(--shadow-md);
}
```

#### Responsive Design
```css
/* ✅ Mobile-first approach */
.sidebar {
  width: 100%;
}

@media (min-width: 768px) {
  .sidebar {
    width: 320px;
  }
}
```

### HTML Guidelines
```html
<!-- ✅ Good - Semantic, accessible -->
<button class="btn" data-action="copy" aria-label="Copy regex">
  Copy
</button>

<!-- ✅ Good - Proper form structure -->
<input type="text" id="regexInput" placeholder="..." aria-label="..." />

<!-- ❌ Avoid - Non-semantic, unclear -->
<div onclick="copy()" title="Click to copy">Click me</div>
```

---

## Git Workflow

### 1. Fork & Clone
```bash
# Fork repo on GitHub, then:
git clone https://github.com/ItsWanheda/regex-pro.git
cd regex-pro
git remote add upstream https://github.com/ORIGINAL_OWNER/regex-pro.git
```

### 2. Create Branch
```bash
# Use descriptive branch names
git checkout -b fix/css-path-issue
git checkout -b feature/dark-mode
git checkout -b docs/update-readme
```

### Naming Convention
- `fix/` - Bug fixes
- `feature/` - New features
- `refactor/` - Code improvements
- `docs/` - Documentation
- `perf/` - Performance improvements

### 3. Make Changes
```bash
# Edit files
# Test changes thoroughly
# Commit with clear messages

git add .
git commit -m "fix: correct CSS import path"
git commit -m "feat: add theme customization"
git commit -m "docs: update README with examples"
```

### Commit Message Format
```
<type>: <subject>

<body>

<footer>
```

**Types:** fix, feat, docs, refactor, perf, test  
**Subject:** Present tense, max 50 chars, lowercase  
**Body:** Explain what and why (not how)

#### Examples
```
fix: correct CSS import path

The index.html file referenced './Style/style.css' but the actual file
was at './style.css'. This prevented styles from loading correctly.

Fixes #123
```

```
feat: add regex explanation generator

Implement automatic pattern explanation feature that breaks down
complex regex into human-readable format. Includes support for
capture groups and alternation patterns.

Closes #456
```

### 4. Keep in Sync
```bash
# Before submitting PR
git fetch upstream
git rebase upstream/main
git push origin fix/css-path-issue
```

---

## Pull Request Process

### Before Submitting
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated (README, CHANGELOG)
- [ ] Tested in multiple browsers (Chrome, Firefox, Safari)
- [ ] No console errors or warnings
- [ ] Accessibility not degraded (test with keyboard)
- [ ] Performance not impacted
- [ ] Commit history is clean

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
Tested on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari
- [ ] Mobile (describe)

## Checklist
- [ ] Code follows style guidelines
- [ ] Changes tested thoroughly
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process
1. Maintainer reviews code
2. Requested changes discussed
3. Updates made if needed
4. Final approval
5. Branch merged to main

### After Merge
- Branch is deleted
- Changes appear in next release
- You're awesome! Thank you! 🎉

---

## Reporting Bugs

### Good Bug Report Checklist
- [ ] Searched existing issues
- [ ] Tested with latest version
- [ ] Clear, descriptive title
- [ ] Steps to reproduce (numbered)
- [ ] Expected vs actual behavior
- [ ] Screenshots/videos (if helpful)
- [ ] Browser and OS info
- [ ] Console errors (if any)

### Example Bug Report
```markdown
## Bug: Regex flag toggles not updating pattern

### Steps to Reproduce
1. Open Regex Pro
2. Click the 'i' (case-insensitive) flag toggle
3. Observe pattern input field

### Expected Behavior
The 'i' flag should appear in flags input field

### Actual Behavior
Toggles work but pattern doesn't update

### Browser & OS
Chrome 115.0 on macOS 13.5

### Console Error
No errors shown
```

---

## Suggesting Enhancements

### Good Enhancement Suggestion
- [ ] Searched existing suggestions
- [ ] Clear use case and benefits
- [ ] Specific examples
- [ ] No duplicates
- [ ] Relates to project scope

### Example Enhancement
```markdown
## Enhancement: Add regex complexity rating

### Problem
Users want to know if their regex is overly complex

### Proposed Solution
Add visual indicator (color bar) showing regex complexity (simple to advanced)

### Example Use Case
When I create complex regex patterns, I want to see if there's a simpler way

### Additional Context
- Complexity could be based on: groups, lookaround, backtracking
- Similar to RegExr complexity visualization
```

---

## Questions?

- 💬 Open a Discussion
- 📧 Email maintainers
- 🐦 Twitter mention
- 📖 Check existing docs

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- CHANGELOG.md release notes
- GitHub contributors page

Thank you for helping make Regex Pro better! 🙌

---

**Last Updated:** 2026-08-03  
**Maintained By:** ItsWanheda