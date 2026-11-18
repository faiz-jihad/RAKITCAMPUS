#!/bin/bash
set -e

echo "=== 1. Pulling latest main on VPS ==="
cd /var/www/rakitcampus
git pull origin main

echo "=== 2. Ensuring directory permissions for build ==="
echo '@Hackathon123' | sudo -S chown -R ubuntu:ubuntu /var/www/rakitcampus/rakit-campus/public

echo "=== 3. Building frontend assets ==="
cd /var/www/rakitcampus/rakit-campus
npm run build

echo "=== 4. Setting permissions for web server ==="
echo '@Hackathon123' | sudo -S chown -R www-data:www-data /var/www/rakitcampus/rakit-campus/storage /var/www/rakitcampus/rakit-campus/bootstrap/cache /var/www/rakitcampus/rakit-campus/public/build
echo '@Hackathon123' | sudo -S chmod -R 775 /var/www/rakitcampus/rakit-campus/storage /var/www/rakitcampus/rakit-campus/bootstrap/cache

echo "=== 5. Database migrations ==="
docker exec rakit_campus_app php artisan migrate --force

echo "=== 6. Optimizing Laravel Cache ==="
docker exec rakit_campus_app php artisan optimize:clear
docker exec rakit_campus_app php artisan config:cache
docker exec rakit_campus_app php artisan route:cache
docker exec rakit_campus_app php artisan view:cache
docker exec rakit_campus_app php artisan event:cache

echo "=== 7. Restarting Queue Workers ==="
docker exec rakit_campus_app php artisan queue:restart
docker restart rakit_campus_queue

echo "=== 8. Status Check ==="
docker ps --format "table {{.Names}}\t{{.Status}}"
echo "=== VPS UPDATE COMPLETED SUCCESSFULLY ==="