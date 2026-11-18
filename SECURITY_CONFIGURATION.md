# RAKIT CAMPUS — SECURITY CONFIGURATION & DEPLOYMENT GUIDE

**Classification:** Operational Security Reference  
**Version:** 1.0.0  
**Target:** Production VPS & Container Environment  

---

## 1. Environment Variables Configuration (`.env`)

Ensure the following security-critical environment variables are configured in production:

```ini
# Application Core
APP_NAME="RAKIT Campus"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://rakitcampus.my.id

# Session Security
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax

# Sanctum Token Security
SANCTUM_STATEFUL_DOMAINS="rakitcampus.my.id"
SANCTUM_TOKEN_EXPIRATION_MINUTES=10080

# Database (Internal Docker Network)
DB_CONNECTION=mysql
DB_HOST=rakit_campus_db
DB_PORT=3306
DB_DATABASE=rakit_campus
DB_USERNAME=rakit_user
DB_PASSWORD="<STRONG_COMPLEX_PASSWORD>"

# Redis (Internal Docker Network)
REDIS_CLIENT=predis
REDIS_HOST=rakit_campus_redis
REDIS_PORT=6379

# Object Storage / MinIO S3
FILESYSTEM_DISK=minio
DEFAULT_OBJECT_DISK=minio
MINIO_ENDPOINT=http://rakit_campus_minio:9000
MINIO_URL=https://rakitcampus.my.id/storage-obj
MINIO_KEY="<MINIO_ACCESS_KEY>"
MINIO_SECRET="<MINIO_SECRET_KEY>"
MINIO_BUCKET=rakitcampus-files

# Third-Party Integrations
GITHUB_WEBHOOK_SECRET="<SECURE_RANDOM_HMAC_SECRET>"
GEMINI_API_KEY="<RESTRICTED_GOOGLE_AI_KEY>"
GEMINI_MODEL=gemini-2.5-flash
```

---

## 2. Nginx Security Configuration

Add or verify the following configuration block in `/etc/nginx/sites-available/rakitcampus.conf` or `server_deploy/nginx.conf`:

```nginx
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Hide server signatures
server_tokens off;
fastcgi_hide_header X-Powered-By;
proxy_hide_header X-Powered-By;

# Block hidden files and dotfiles (.git, .env, etc.)
location ~ /\.(?!well-known).* {
    deny all;
    access_log off;
    log_not_found off;
}

# Restrict maximum upload body size
client_max_body_size 75M;
```

---

## 3. VPS Host Hardening Checklist

- [x] **UFW Firewall:** Only ports `22` (SSH), `80` (HTTP), and `443` (HTTPS) allowed publicly.
- [x] **Docker Port Binding:** MySQL (`3306`) and Redis (`6379`) do NOT bind to `0.0.0.0`.
- [x] **File Permissions:** `storage/` and `bootstrap/cache/` owned by `www-data:www-data` (`775`), source code owned by non-root user (`ubuntu:ubuntu`).
- [x] **Fail2Ban:** Active on SSH port to prevent brute-force intrusion.
- [x] **Regular Updates:** Ubuntu unattended-upgrades active for security patches.
