# RAKIT CAMPUS — THREAT MODEL & ATTACK SURFACE ANALYSIS

**Classification:** Internal Security Architecture & Engineering  
**Version:** 1.0.0  
**Date:** November 2026  
**Status:** Active  
**Author:** Principal Application Security Engineer & DevSecOps Architect  

---

## 1. Executive Summary & Architecture Overview

RAKIT Campus is an integrated student ecosystem platform powering project collaboration, competition matchmaking, academic guidance, and AI-assisted workflows. The application is built on:
- **Backend:** Laravel 12 (PHP 8.4) with Inertia.js 2.0 (SSR/SPA hybrid)
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Database:** MySQL 8.0 InnoDB with strict relational foreign keys and transaction isolation
- **Caching & Queues:** Redis (Predis)
- **Object Storage:** MinIO S3-compatible object store / AWS S3 with local fallback
- **Real-Time / WebSockets:** Laravel Reverb (Pusher protocol)
- **AI Workspace:** Google Gemini 2.5 Flash API integration
- **Third-Party Integrations:** GitHub REST API & Webhooks, Google OAuth 2.0
- **Infrastructure:** Ubuntu Linux VPS, Docker Compose containers, Nginx reverse proxy, Cloudflare CDN/WAF

---

## 2. Trust Boundaries & Data Flow Diagrams

```
[ External User / Attacker Browser / Flutter Mobile App ]
                       │
                       │ HTTPS / TLS (Port 443)
                       ▼
            ┌──────────────────────┐
            │   Cloudflare WAF     │ (DDoS Protection, Edge SSL)
            └──────────┬───────────┘
                       │
                       ▼
       ┌────────────────────────────────┐
       │ Nginx Reverse Proxy (:80/:8088)│ (Host & SSL Termination, Static Assets)
       └───────────────┬────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│ MinIO S3 (:9000) │       │ PHP-FPM (:9000)  │
│ (Object Storage) │       │ (Laravel 12 App) │
└──────────────────┘       └─────────┬────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│     MySQL 8.0 DB     │  │   Redis 7 (Queues    │  │ External APIs:       │
│ (:3306 Container)    │  │   & Session/Cache)   │  │ • Gemini AI API      │
└──────────────────────┘  └──────────────────────┘  │ • GitHub Webhook/REST│
                                                    │ • Google OAuth       │
                                                    └──────────────────────┘
```

### Trust Boundary Definitions
1. **TB-01: Public Internet to Ingress (Cloudflare / Nginx)**
   - Untrusted zone. Ingress points for web requests, API calls (`/api/v1/*`), and webhooks (`/api/v1/integrations/github/webhook`).
2. **TB-02: Nginx to Laravel Application Container (PHP-FPM)**
   - Boundary where HTTP headers (`X-Forwarded-For`, `X-Forwarded-Proto`, cookies, Authorization bearer tokens) are parsed.
3. **TB-03: Laravel Application to Database & Cache Tier**
   - Protected internal Docker network (`rakit_network`). Only accessible by application containers.
4. **TB-04: Application to S3 / MinIO Object Storage**
   - Object upload and download stream endpoints (`/uploads`, `/storage-download/{path}`).
5. **TB-05: Application to External AI Services (Gemini API)**
   - Outbound HTTPS boundary. Student prompts, living proposals, and uploaded files are sent to Gemini.
6. **TB-06: External GitHub Webhooks to Ingress**
   - Webhook ingress receiving repository push, PR, and commit events.

---

## 3. Threat Actor Persona Matrix

| Actor ID | Persona | Motivation | Capabilities | Access Level |
|---|---|---|---|---|
| **TA-01** | Anonymous External Attacker | Financial gain, disruption, data harvesting | Automated vulnerability scanners, brute-force tools, public exploits | Unauthenticated public endpoints |
| **TA-02** | Authenticated Malicious Student | Grades manipulation, competitor sabotage, unauthorized prize access | Legitimate student account, API exploration (Burp Suite, Postman) | Authenticated student role |
| **TA-03** | Rogue Team Member | Internal project tampering, intellectual property theft | Legitimate team member access | Read/write access within assigned workspace |
| **TA-04** | Malicious / Compromised Lecturer | Grade inflation, academic fraud | Academic supervisor credentials | Academic class grading, reviews |
| **TA-05** | Compromised Third-Party Service | Supply chain attack, pivot into campus DB | Forged webhook deliveries, compromised API credentials | Webhook receiver, OAuth callback |
| **TA-06** | VPS / Network Intruder | Complete host compromise, persistence | Shell access, container escape, host file access | Root or docker socket access |

---

## 4. STRIDE Threat Analysis Across System Components

### 4.1 Authentication & Session Management
- **Spoofing (Critical):** Direct access to test backdoors (`/auth/google/demo`) bypasses all authentication and immediately establishes an active session as a verified student without credentials.
- **Tampering (High):** Replay or manipulation of Sanctum Personal Access Tokens when tokens have no expiration configured (`sanctum.expiration = null`).
- **Information Disclosure (Medium):** Missing `secure` attribute on session cookies in environments where `SESSION_SECURE_COOKIE` is unconfigured, allowing session hijacking over unencrypted local networks.
- **Denial of Service (High):** Automated credential stuffing against `/api/v1/auth/login` due to missing rate limiting on API authentication routes.

### 4.2 Workspace & Kanban Task Management
- **Tampering / IDOR (Critical):** Missing ownership and membership checks on `/workspace/{teamId}/tasks`, `/workspace/{teamId}/tasks/{taskId}`, and `/workspace/{teamId}/evaluation`. Any authenticated user can modify tasks or submit lecturer evaluations on any team project.
- **Elevation of Privilege (Critical):** Student calling `POST /workspace/{teamId}/evaluation` to assign themselves an 'A' grade and mark the project completed.
- **Information Disclosure (Medium):** Leaking tasks and team internal sprint milestones across teams through predictable team IDs.

### 4.3 File Uploads & Object Storage Proxy
- **Tampering / Malicious Upload (High):** File uploads via `/uploads` accepting arbitrary file extensions (HTML, SVG, JS, executable scripts) without MIME type or extension allowlisting.
- **Information Disclosure / Path Traversal (High):** Route `/storage-download/{path}` taking unvalidated path parameters that could allow reading arbitrary files from local fallback disks via `../` sequences.
- **Denial of Service (Medium):** Exhaustion of disk storage by repeatedly uploading files up to 70MB without per-user or daily upload limits.

### 4.4 GitHub Webhook & Integrations
- **Spoofing / Tampering (High):** Conditional webhook verification in `GitHubWebhookController` (`if ($hasSecret && !$isValid)`) allowing forged commits, pull requests, and activity points when no secret is configured.
- **Information Disclosure (Low):** Leaking raw exception stack traces in 500 error responses during webhook delivery processing.

### 4.5 AI Workspace & LLM Integration
- **Prompt Injection (High):** Untrusted user messages or uploaded documents containing prompt injection payloads designed to override instructions, leak system prompts, or forge evaluation outputs.
- **Information Disclosure (High):** Cross-session message leakage if session isolation queries fail to enforce team membership and user ownership.
- **Denial of Service / Financial Exhaustion (Medium):** Unbounded prompt sizes (up to 200,000 characters) driving up Gemini token quotas and API costs.

### 4.6 Administration & Platform Management
- **Elevation of Privilege (High):** Missing explicit middleware authorization on `/api/v1/admin/*` endpoints, relying solely on controller-level method calls that could be missed on newly introduced routes.
- **Repudiation (Medium):** Administrative actions (modifying competition status, adjusting leaderboard points, student verification) missing structured security audit log entries.

---

## 5. Critical Assets & High-Value Targets

1. **Student Personal Data & Academic Records:**
   - Names, emails, student registration numbers (NIM), hashed passwords, campus affiliations.
2. **Project Intellectual Property & Proposals:**
   - Confidential project ideas, research papers, living proposals, architecture diagrams, source code repositories.
3. **Competition Submissions & Deliverables:**
   - Competition deliverables, judges' scoring, finalist rankings, leaderboard point transactions.
4. **Third-Party Credentials & API Keys:**
   - Gemini API keys, GitHub App private keys & webhook secrets, Google OAuth secrets, MinIO root credentials, database passwords.
5. **System Availability & Infrastructure Integrity:**
   - MySQL database, Redis queue workers, Nginx reverse proxy, production VPS shell.

---

## 6. Threat Mitigation Matrix

| Threat ID | Component | Vulnerability | Severity | Mitigation Strategy | Status |
|---|---|---|---|---|---|
| **TH-01** | Auth | `/auth/google/demo` backdoor accessible in production | **Critical** | Disable route entirely in production (`app()->environment('local', 'testing')`) | Implemented |
| **TH-02** | Workspace | IDOR / Missing Auth on `/workspace/{teamId}/tasks` | **Critical** | Enforce `TeamPolicy::manageWorkspace` & `TaskPolicy` checks | Implemented |
| **TH-03** | Workspace | BFLA on `/workspace/{teamId}/evaluation` | **Critical** | Restrict to assigned class lecturer or platform admin | Implemented |
| **TH-04** | API Auth | Brute-force attacks against `/api/v1/auth/login` | **High** | Implement `throttle:auth` (5 attempts / minute per IP/email) | Implemented |
| **TH-05** | Webhooks | Insecure fallback when GitHub webhook secret is missing | **High** | Enforce mandatory HMAC SHA-256 signature verification | Implemented |
| **TH-06** | File Storage | Dangerous file extension & MIME type bypass | **High** | Strict whitelist validation for file extensions and MIME signatures | Implemented |
| **TH-07** | File Storage | Path traversal on `/storage-download/{path}` | **High** | Sanitize path against directory traversal (`basename`, `Str::replace`) | Implemented |
| **TH-08** | HTTP Headers | Missing security headers (CSP, HSTS, X-Frame-Options) | **Medium** | Implement dedicated `SecurityHeadersMiddleware` | Implemented |
| **TH-09** | AI Workspace | Cross-user session leakage & prompt abuse | **Medium** | Strict session ownership validation & character limits | Implemented |
| **TH-10** | Tokens | Infinite lifetime on Sanctum personal access tokens | **Medium** | Configure 7-day token expiration in `sanctum.php` | Implemented |
