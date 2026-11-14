#!/usr/bin/env bash
set -e

echo "=== RAKIT Campus Server Deployment Started ==="

# 1. Update codebase
echo "Fetching latest changes..."
git pull origin main

# 2. Install PHP production dependencies
echo "Installing Composer dependencies..."
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
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# 8. Restart queue workers
echo "Restarting queue workers..."
php artisan queue:restart || true

echo "=== RAKIT Campus Deployment Completed Successfully ==="
