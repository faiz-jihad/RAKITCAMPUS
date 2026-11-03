#!/usr/bin/env bash
# ==============================================================================
# RAKIT Campus — VPS Server Setup Script (Ubuntu / Debian)
# Jalankan script ini di VPS Anda untuk menyiapkan direktori server & dependensi
# ==============================================================================

set -e

echo ">>> [1/6] Update paket OS dan instalasi dependensi dasar..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip zip software-properties-common ca-certificates lsb-release ufw

echo ">>> [2/6] Setup direktori web server untuk RAKIT Campus..."
WEB_DIR="/var/www/rakitcampus"
sudo mkdir -p "$WEB_DIR"
sudo chown -R $USER:$USER "$WEB_DIR"
cd "$WEB_DIR"

echo "Direktori server siap di: $WEB_DIR"

echo ">>> [3/6] Install PHP 8.4 dan ekstensi yang dibutuhkan..."
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update
sudo apt install -y php8.4 php8.4-fpm php8.4-mysql php8.4-mbstring php8.4-xml \
    php8.4-curl php8.4-zip php8.4-gd php8.4-intl php8.4-bcmath php8.4-sqlite3

echo ">>> [4/6] Install Composer & Node.js 20..."
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php
    sudo mv composer.phar /usr/local/bin/composer
fi

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo ">>> [5/6] Install Nginx & MySQL Server..."
sudo apt install -y nginx mysql-server

echo ">>> [6/6] Menyiapkan direktori penyimpanan upload..."
mkdir -p "$WEB_DIR/rakit-campus/storage/app/public/uploads/avatars"
mkdir -p "$WEB_DIR/rakit-campus/storage/app/public/uploads/documents"
mkdir -p "$WEB_DIR/rakit-campus/storage/app/public/uploads/attachments"
mkdir -p "$WEB_DIR/rakit-campus/storage/app/public/uploads/portfolios"
mkdir -p "$WEB_DIR/rakit-campus/storage/app/public/uploads/projects"

echo "================================================================="
echo " SETUP SERVER VPS BERHASIL!"
echo " Direktori kerja: $WEB_DIR"
echo " Langkah berikutnya:"
echo " 1. Clone repository: git clone https://github.com/faiz-jihad/RAKITCAMPUS.git ."
echo " 2. Konfigurasi .env: cp rakit-campus/.env.example rakit-campus/.env"
echo " 3. Jalankan: bash server_deploy/deploy.sh"
echo "================================================================="
