# RAKIT Campus — Security Architecture & Threat Mitigation

## 1. Authentication & Session Security

RAKIT Campus implements a dual-mode authentication scheme:
1. **Web Frontend (Inertia.js + React):**
   - HTTP-only, secure, SameSite cookies.
   - Encrypted CSRF tokens refreshed on each request lifecycle.
2. **Mobile Client (Flutter):**
   - Laravel Sanctum personal access tokens (`Bearer` tokens) stored securely using Android Keystore / iOS Keychain via device storage.
   - Tokens can be scoped and revoked at any time (`POST /auth/logout`).

---

## 2. Authorization & Scoped Permission Model

Permissions in RAKIT Campus are strictly compartmentalized:

| Persona / Role | Scope | Permitted Actions |
| :--- | :--- | :--- |
| **Super Admin** | Platform Wide | Campus onboarding, global metrics, system health, platform audit logs. |
| **Campus Admin** | Institutional Tenant | Manage student verification, review campus projects, monitor campus metrics. Cannot access another campus. |
| **Project Leader** | Specific Project Scope | Edit project details, create roles, accept/reject applicants, manage milestones and tasks. |
| **Team Member** | Specific Workspace | View workspace, edit assigned tasks, comment on discussions, upload deliverable files. |
| **Student** | Campus Wide | Discover projects/competitions, apply to open roles, manage personal profile & portfolio. |

### IDOR Mitigation
To prevent Insecure Direct Object References:
- All controller mutations invoke `$this->authorize('action', $model)`.
- Eloquent policies (`ProjectPolicy`, `TeamPolicy`, `TaskPolicy`) ensure that:
  - Non-members cannot view private workspace boards.
  - Non-leaders cannot modify recruitment statuses or accept candidates.
  - Users cannot modify or delete portfolios/profiles belonging to others.

---

## 3. Multi-Tenant Isolation Guarantees

1. **Campus Scoping in Models:**
   - Every opportunity query is bound by `where('campus_id', $user->campus_id)`.
   - Cross-campus read operations are limited to verified national or international competitions.
2. **Preventing Tenant Impersonation:**
   - Registration enforces email domain validation matching the institutional domain (`domain` column in `campuses` table).

---

## 4. Input Validation & Mass-Assignment Protection

1. **Strict Form Requests:**
   - All input data passes through dedicated Laravel `FormRequest` classes with rigorous validation rules (e.g. `RegistrationRequest`, `ProjectCreateRequest`, `ApplicationRequest`).
2. **Eloquent Mass-Assignment Guards:**
   - Sensitive attributes (`id`, `campus_id`, `is_verified`, `global_role`) are strictly controlled.
3. **Database Injection Protection:**
   - 100% of queries use Eloquent ORM prepared statements with parameterized inputs.
   - Zero raw concatenated SQL statements exist in the codebase.

---

## 5. Concurrency & Race Condition Defense

In competitive recruitment drives, multiple candidates applying simultaneously could cause over-allocation of limited team slots.
- **Defense:** Pessimistic row locking (`lockForUpdate()`) wraps the capacity validation and status increment within atomic database transactions.

---

## 6. Audit Trails & Incident Monitoring

The `audit_logs` table records:
- User login events.
- Role transitions (promotions to Project Leader, Team Leader assignment).
- Administrative actions (student verification, campus settings update).
- Record creation with IP addresses and user agents.
