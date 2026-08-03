# Security Policy

## 🛡️ Supported Versions

This project is a **client-side only** static web application. It does not transmit, store, or process any data on remote servers. All user input is processed locally in the browser.

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | ✅ Active          |
| < 1.0   | ❌ End of life     |

---

## 📋 Reporting a Vulnerability

We take the security of Regex Pro seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do **NOT** open a public issue

Vulnerabilities should be reported **privately** to give us time to investigate and release a fix before disclosure.

### 2. Email the maintainers

Send a detailed report to: **[Wanheda.work@gmail.com]**

Include the following information:
- **Type of vulnerability** (e.g., XSS, CSRF, code injection)
- **Affected component(s)** (e.g., `script.js`, `index.html`)
- **Steps to reproduce** the issue
- **Proof-of-concept code** if applicable
- **Potential impact** of the vulnerability
- **Your name/handle** (optional, for credit)

### 3. Response timeline

- ⏱️ **Acknowledgment** — within 48 hours
- 🔍 **Investigation** — within 7 days
- 🛠️ **Fix & disclosure** — coordinated with reporter

---

## 🔐 Security Considerations

### What this app does NOT do
- ❌ No backend server
- ❌ No API calls
- ❌ No authentication
- ❌ No database
- ❌ No external data transmission
- ❌ No telemetry or analytics

### What this app DOES
- ✅ Processes regex entirely in your browser
- ✅ Stores data only in your browser's `localStorage`
- ✅ Loads only Google Fonts (CSS-only) as external resource
- ✅ Uses `Content-Security-Policy` recommended practices via inline styles

### User-controlled input

The regex pattern and test text are user-provided and evaluated using JavaScript's native `RegExp` constructor. Malicious patterns can cause:
- **Performance issues** — catastrophic backtracking (e.g., `/^(a+)+$/` on long input)
- **Infinite loops** — extremely rare with native regex, mitigated by iteration limits

The app includes a **50,000-iteration safety limit** to prevent runaway execution.

---

## 🏆 Recognition

We appreciate security researchers who help keep Regex Pro safe. Reporters who follow responsible disclosure will be:
- Credited in the release notes (unless anonymity is requested)
- Listed in a `SECURITY_ACKNOWLEDGMENTS.md` file

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [MDN: Regular Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)

---

**Last updated:** 2026-08-03