#!/usr/bin/env bash
set -e

echo "=== RAKIT Campus Server Deployment Started ==="

# Auto-detect project root and rakit-campus directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/../rakit-campus" ]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
    APP_DIR="$PROJECT_ROOT/rakit-campus"
elif [ -f "./artisan" ]; then
    APP_DIR="$(pwd)"
    PROJECT_ROOT="$(cd .. && pwd)"
else
    APP_DIR="$(pwd)/rakit-campus"
    PROJECT_ROOT="$(pwd)"
fi

echo "Project Root: $PROJECT_ROOT"
echo "App Directory: $APP_DIR"

# 1. Update codebase
echo "Fetching latest changes..."
cd "$PROJECT_ROOT"
git pull origin main

# 2. Install PHP production dependencies
echo "Installing Composer dependencies..."
cd "$APP_DIR"
composer install --no-dev --optimize-autoloader --no-interaction

# 3. Install and compile frontend assets
echo "Compiling frontend assets..."
npm ci
npm run build

# 4. Run database migrations
echo "Running database migrations..."
php artisan migrate --force

# 5. Clear and cache config/routes
echo "Caching configurations..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 6. Ensure storage link exists
echo "Verifying storage link..."
php artisan storage:link || true

# 7. Set directory permissions
echo "Setting permissions..."
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# 8. Restart queue workers
echo "Restarting queue workers..."
php artisan queue:restart || true

echo "=== RAKIT Campus Deployment Completed Successfully ==="

