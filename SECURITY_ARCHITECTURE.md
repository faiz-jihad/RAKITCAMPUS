# RAKIT CAMPUS — SECURITY ARCHITECTURE & CONTROLS SPECIFICATION

**Classification:** Engineering Specification  
**Version:** 1.0.0  
**Status:** Approved Reference  
**Author:** Principal Application Security Engineer & DevSecOps Architect  

---

## 1. Architectural Principles

RAKIT Campus follows core security design principles:
1. **Defense in Depth:** Security controls are enforced across multiple layers (Cloudflare WAF, Nginx reverse proxy, Laravel middleware, Controller/Service authorization, Database foreign key constraints).
2. **Principle of Least Privilege:** Users and services operate with the minimal permissions necessary to fulfill their responsibilities.
3. **Fail-Safe Defaults:** If an authorization check encounters unexpected state or missing attributes, it defaults to denying access (`abort(403)`).
4. **Complete Mediation:** Every incoming request to protected resources must be checked for authentication and authorization. Frontend state is treated as purely cosmetic.
5. **Separation of Duties:** Administrative operations, academic grading, and student collaboration are strictly partitioned.

---

## 2. Identity & Access Management (IAM)

### 2.1 Role Hierarchy & Permissions

```
Platform Super Admin
  └── Full system oversight, cross-campus management, global configuration
Campus Admin
  └── Campus-scoped administration, student verification, competition oversight
Lecturer / Academic Supervisor
  └── Academic class management, milestone review, UTS/UAS evaluation & grading
Student (Team Leader)
  └── Team formation, Kanban management, GitHub linking, deliverable submission
Student (Team Member)
  └── Task execution, sprint participation, discussion, profile management
Guest / Anonymous
  └── Public discovery hubs, landing page, public portfolios (view-only)
```

### 2.2 Server-Side Authorization Implementation
Authorization in RAKIT is enforced server-side through:
1. **Route Middleware:** `auth`, `profile.completed`, `throttle:*`, `can:*`
2. **Laravel Policies:** `TeamPolicy`, `TaskPolicy`, `ProjectPolicy`, `CompetitionPolicy`
3. **Domain Guards:** Domain-specific gatekeepers in Controllers and Services (e.g. `isLecturer($user)`, `hasMember($user)`, `isCampusAdminOf($campusId)`).

---

## 3. Session & Token Architecture

### 3.1 Web Sessions
- **Session Driver:** Redis (`SESSION_DRIVER=redis`) with isolated prefix.
- **Cookie Security:**
  - `HttpOnly`: Enabled (`SESSION_HTTP_ONLY=true`), preventing JavaScript access.
  - `SameSite`: Configured to `lax` to mitigate cross-site request forgery.
  - `Secure`: Enforced in production (`SESSION_SECURE_COOKIE` defaulting to true on `production`).
  - `Lifetime`: 120 minutes of inactivity.
- **CSRF Protection:** Laravel CSRF token verification enforced on all stateful web mutations.

### 3.2 Mobile & API Tokens (Laravel Sanctum)
- **Token Type:** Cryptographically random personal access tokens (SHA-256 hashed in database).
- **Token Expiration:** Enforced at 7 days (`10080` minutes). Expired tokens are rejected by middleware.
- **Revocation:** Single token revocation on logout (`$request->user()->currentAccessToken()->delete()`) or all-device logout (`$user->tokens()->delete()`).

---

## 4. File Upload & Storage Architecture

### 4.1 Storage Pipeline

```
[ User File Upload ]
         │
         ▼
[ UploadController Validation ]
  • File Size Limit (70MB)
  • Extension Whitelist (PDF, DOCX, XLSX, PPTX, ZIP, PNG, JPG, WEBP)
  • Explicit MIME Type Inspection
  • Rejection of Executables & Script formats (.html, .svg, .php, .exe, .sh)
         │
         ▼
[ Filename Randomization ]
  • Generates cryptographically random 32-character UUID/hex
  • Prevents path traversal and predictable URL enumeration
         │
         ▼
[ MinIO / S3 Object Storage ]
  • Stored in non-executable bucket path (`uploads/{type}/{hash}.{ext}`)
  • Served via streaming proxy or presigned access
```

---

## 5. AI Workspace Security Architecture

### 5.1 Boundaries & Controls
- **API Key Segregation:** Gemini API keys are retrieved from server environment configuration (`config('services.gemini.api_key')`), never exposed to frontend clients.
- **Session Isolation:** `AiSession` records are strictly bound to both `user_id` and `team_id`. A user can only view or message sessions they own or sessions explicitly marked as `shared` within their own team.
- **Agentic Action Verification:** Automated actions (`executeAction`) verify team membership and lock team database rows before creating tasks or milestones.
- **Token Quota Enforcement:** Team AI usage is tracked per team in Redis and MySQL (`team_ai_quotas`), preventing API cost overruns.

---

## 6. Network & Infrastructure Hardening

```
Internet
   │
   ▼
[ Cloudflare CDN & WAF ]
   │ Port 443 (TLS 1.3 / Strict SSL)
   ▼
[ Host Nginx Reverse Proxy ]
   │
   ├── / (HTTP Proxy to Docker App Web Port 8088)
   │     • Static asset caching
   │     • Security response headers
   │     • FastCGI buffering & timeout controls
   │
   └── Internal Docker Network (`rakit_network`)
         ├── rakit_campus_app (PHP-FPM :9000)
         ├── rakit_campus_db (MySQL :3306 - No host port exposure)
         ├── rakit_campus_redis (Redis :6379 - No host port exposure)
         └── rakit_campus_minio (MinIO S3 :9000)
```
- **Port Isolation:** Database (`3306`) and Redis (`6379`) are strictly bound to internal Docker bridge networks and are NOT exposed on public host interfaces.
- **SSH Hardening:** SSH on VPS is protected with key-based authentication, non-standard SSH ports where applicable, and automated fail2ban blocking.
