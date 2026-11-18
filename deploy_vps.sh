#!/bin/bash
set -e

echo "=== 1. Pulling latest main on VPS ==="
cd /var/www/rakitcampus
git pull origin main

echo "=== 2. Building frontend assets ==="
cd /var/www/rakitcampus/rakit-campus
npm run build

echo "=== 3. Running database migrations ==="
docker exec rakit_campus_app php artisan migrate --force

echo "=== 4. Updating Docker Services (Concurrency & PHP-FPM) ==="
cd /var/www/rakitcampus/server_deploy
docker compose up -d

echo "=== 5. Optimizing Laravel Cache ==="
docker exec rakit_campus_app php artisan optimize:clear
docker exec rakit_campus_app php artisan config:cache
docker exec rakit_campus_app php artisan route:cache
docker exec rakit_campus_app php artisan view:cache
docker exec rakit_campus_app php artisan event:cache

echo "=== 6. Restarting Queue Workers ==="
docker exec rakit_campus_app php artisan queue:restart
docker restart rakit_campus_queue

echo "=== 7. Status Check ==="
docker ps --format "table {{.Names}}\t{{.Status}}"
