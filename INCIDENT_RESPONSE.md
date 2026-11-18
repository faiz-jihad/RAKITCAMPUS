# RAKIT CAMPUS — SECURITY INCIDENT RESPONSE PLAYBOOK

**Classification:** Operational Security Procedure  
**Version:** 1.0.0  
**Target:** DevSecOps Team, System Administrators, Security Engineers  

---

## 1. Incident Severity Classification

| Level | Severity | Description | Response SLA |
|---|---|---|---|
| **SEV-1** | **Critical** | Active database compromise, authentication bypass in production, unauthorized data exfiltration, ransomware | < 15 minutes |
| **SEV-2** | **High** | IDOR on core records, administrative account compromised, denial of service impacting active competitions | < 1 hour |
| **SEV-3** | **Medium** | Isolated rate limit abuse, minor unauthorized record modification, failed brute force spikes | < 4 hours |
| **SEV-4** | **Low** | Informational security alerts, dependency warnings, non-critical misconfiguration | < 24 hours |

---

## 2. Six-Step Incident Response Lifecycle

```
1. Preparation ──► 2. Identification ──► 3. Containment ──► 4. Eradication ──► 5. Recovery ──► 6. Post-Mortem
```

### Step 1: Preparation
- Maintain access credentials in a secure offline vault.
- Ensure Docker container backups and MySQL database dumps are taken daily and stored offsite.
- Pre-install incident response tools on VPS: `htop`, `netstat`, `fail2ban-client`, `docker logs`.

### Step 2: Identification & Triage
- Detect suspicious traffic through Cloudflare analytics, Nginx access logs, or Laravel exception logs (`storage/logs/laravel.log`).
- Confirm whether the event is a false positive or an active security incident.
- Assign an Incident Commander and establish a secure coordination channel.

### Step 3: Containment
- **IP Blocking:** If attack originates from specific IP ranges, block immediately at Cloudflare WAF:
  ```bash
  # Alternatively on VPS host:
  sudo ufw insert 1 deny from <ATTACKER_IP> to any
  ```
- **Session Termination:** If compromised user accounts are identified:
  ```bash
  docker exec rakit_campus_app php artisan auth:clear-resets
  # Flush user sessions from Redis
  docker exec rakit_campus_redis redis-cli keys "*session*" | xargs -r docker exec -i rakit_campus_redis redis-cli del
  ```
- **Service Isolation:** If database or app container is compromised, stop external traffic via Nginx maintenance mode or stop containers:
  ```bash
  docker stop rakit_campus_web rakit_campus_app
  ```

### Step 4: Eradication
- Identify and patch root-cause vulnerabilities in the code or configuration.
- Revoke all potentially compromised API keys (Gemini, GitHub App secrets, MinIO credentials).
- Rotate database passwords and regenerate `APP_KEY` if application secrets were leaked.

### Step 5: Recovery & Verification
- Restore clean state from verified backups if database corruption occurred.
- Re-run security test suite and static analysis scanners.
- Gradually restore external traffic and monitor error rates and latency in real time.

### Step 6: Post-Mortem & Reporting
- Conduct a blameless post-mortem within 48 hours.
- Document timeline, root cause, impact, and actionable preventative improvements in `SECURITY_CHANGELOG.md`.
