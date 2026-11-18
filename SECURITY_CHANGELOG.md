# RAKIT CAMPUS — SECURITY CHANGELOG

All notable security enhancements, vulnerability fixes, and architectural hardening measures are documented here.

---

## [1.1.0] — 2026-11-18 — Principal Security Architecture Hardening

### Added
- **`SecurityHeadersMiddleware`:** Application-level enforcement of `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **API Authentication Rate Limiting:** Enforced `throttle:auth` (5 attempts/min) on `/api/v1/auth/login` and `throttle:6,1` on `/api/v1/auth/register` to prevent credential stuffing and brute-force attacks.
- **Sanctum Token Expiration:** Configured 7-day token expiration (`10080` minutes) in `config/sanctum.php`.
- **Automated Security Test Suite:** Created `tests/Feature/Security/AuthenticationSecurityTest.php`, `tests/Feature/Security/WorkspaceAuthorizationSecurityTest.php`, `tests/Feature/Security/FileUploadSecurityTest.php`.
- **Comprehensive Documentation Suite:** Added `THREAT_MODEL.md`, `SECURITY_AUDIT.md`, `SECURITY_ROADMAP.md`, `SECURITY_ARCHITECTURE.md`, `SECURITY_CONFIGURATION.md`, `INCIDENT_RESPONSE.md`, `SECURITY_TEST_REPORT.md`.

### Changed
- **`GoogleAuthController`:** Restricted `/auth/google/demo` strictly to `local` and `testing` environments, returning HTTP 404 in production.
- **`WorkspaceWebController`:**
  - Added authorization checks in `storeTask`, `updateTask`, and `deleteTask` (must be team member, leader, assigned lecturer, or admin).
  - Added strict authorization check in `saveEvaluation` (must be the assigned class lecturer, project supervisor, or admin).
- **`GitHubWebhookController`:**
  - Enforced mandatory HMAC SHA-256 signature verification. Rejects unsigned or forged deliveries with HTTP 401.
  - Sanitized 500 error responses to prevent internal exception disclosure.
- **`UploadController`:**
  - Enforced file extension allowlists (`pdf, doc, docx, xls, xlsx, ppt, pptx, zip, rar, jpg, jpeg, png, webp`) and disallow script/executable files.
  - Sanitized path parameters in `/storage-download/{path}` to prevent path traversal attacks (`..`).
- **`config/session.php`:** Defaulted `SESSION_SECURE_COOKIE` to `true` when running in `production`.
