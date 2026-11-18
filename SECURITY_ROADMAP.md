# RAKIT CAMPUS — SECURITY REMEDIATION & ARCHITECTURE ROADMAP

**Classification:** Strategic Security Plan  
**Version:** 1.0.0  
**Status:** In Progress / Partially Implemented  
**Lead:** Principal Application Security Engineer & DevSecOps Architect  

---

## 1. Roadmap Overview & Phasing

The RAKIT security roadmap prioritizes critical architectural weaknesses and immediate exploitable vectors before implementing operational monitoring and long-term compliance controls.

```
┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
│     Phase 0 (Sprint 1)    │    │     Phase 1 (Sprint 2)    │    │     Phase 2 (Sprint 3)    │
│  Immediate Threat Defense │ ──►│   API & Data Protection   │ ──►│ Continuous Monitoring & CI│
│  • Disable Backdoors      │    │  • Strict MIME & Uploads  │    │  • Audit Logging Pipeline │
│  • Fix Workspace IDOR     │    │  • Path Sanitization      │    │  • CI/CD SAST & Secret Scan│
│  • Fix Lecturer BFLA      │    │  • Sanctum Expiration     │    │  • Incident Response Drill│
│  • Rate Limit Auth Routes │    │  • Security Headers / CSP │    │  • VPS Hardening Review   │
└───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

## 2. Prioritized Action Items

### Phase 0: Immediate Threat Defense (P0 — Immediate / Day 1)
- [x] **ACT-01:** Disable `/auth/google/demo` backdoor endpoint outside `local` and `testing` environments.
- [x] **ACT-02:** Fix BOLA/IDOR on `WorkspaceWebController::storeTask`, `updateTask`, `deleteTask` by verifying team membership/leadership.
- [x] **ACT-03:** Fix BFLA on `WorkspaceWebController::saveEvaluation` by enforcing lecturer/supervisor role verification.
- [x] **ACT-04:** Implement rate limiting on API authentication (`/api/v1/auth/login` and `/api/v1/auth/register`) to stop brute-force attacks.
- [x] **ACT-05:** Fix GitHub Webhook signature bypass when no webhook secret is configured.

### Phase 1: API, File & Data Protection (P1 — Sprint 1)
- [x] **ACT-06:** Enforce file extension and MIME type allowlists in `UploadController::store` (block `.html`, `.svg`, `.exe`, `.php`, `.js`).
- [x] **ACT-07:** Sanitize path parameter in `/storage-download/{path}` to prevent directory traversal sequences (`..`).
- [x] **ACT-08:** Configure default 7-day expiration for Sanctum personal access tokens in `config/sanctum.php`.
- [x] **ACT-09:** Enforce `SESSION_SECURE_COOKIE` fallback in production (`config/session.php`).
- [x] **ACT-10:** Implement `SecurityHeadersMiddleware` (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).

### Phase 2: Monitoring, Audit & CI/CD Security (P2 — Sprint 2)
- [x] **ACT-11:** Create structured Security Event Logging service (`SecurityLogger`) for failed logins, unauthorized access, privilege changes.
- [x] **ACT-12:** Add GitHub Actions CI security workflow with SAST, dependency vulnerability scanning, and secret checking.
- [x] **ACT-13:** Establish Incident Response Playbook (`INCIDENT_RESPONSE.md`).
- [x] **ACT-14:** Write comprehensive automated security regression tests (`tests/Feature/Security/`).

### Phase 3: Continuous DevSecOps Hardening (P3 — Ongoing)
- [ ] **ACT-15:** Quarterly third-party penetration testing and threat model revision.
- [ ] **ACT-16:** Enable automated dependency updates (Dependabot / Renovate) with test gating.
- [ ] **ACT-17:** Implement centralized SIEM / log aggregation for VPS system and Docker logs.

---

## 3. Verification & Governance Criteria

1. **Gate 1 (Unit & Feature Tests):**
   - Zero test regressions on existing business flows.
   - All newly created security test cases must pass with 100% success.
2. **Gate 2 (Static Analysis):**
   - No high/critical secrets detected by Git secret scanning.
   - Composer audit passes with zero critical CVEs.
3. **Gate 3 (Production Deployment):**
   - Verified HTTP 200 OK on production endpoints with complete security headers present.
   - No unauthorized access allowed on private workspace or admin endpoints.
