# Panduan Deploy & Upload ke Server — RAKIT Campus

Direktori ini (`server_deploy/`) disiapkan khusus untuk mempermudah upload dan deployment sistem **RAKIT Campus** ke server produksi (VPS, Cloud Hosting, atau Docker).

---

## Pilihan 1: Deploy Menggunakan Docker Compose (Direkomendasikan)

1. Upload seluruh folder `RakitCampus/` ke server (misalnya ke `/var/www/rakit-campus` atau `/home/deploy/rakit-campus`).
2. Masuk ke direktori `server_deploy/`:
   ```bash
   cd server_deploy
   ```
3. Sesuaikan password database di file `docker-compose.yml`.
4. Jalankan kontainer:
   ```bash
   docker compose up -d --build
   ```
5. Jalankan migrasi dan seeder awal:
   ```bash
   docker compose exec app php artisan migrate --seed --force
   docker compose exec app php artisan storage:link
   ```

---

## Pilihan 2: Deploy Standar ke VPS Linux (Ubuntu / Debian / Nginx)

1. Buat direktori di server target:
   ```bash
   sudo mkdir -p /var/www/rakit-campus
   sudo chown -R $USER:$USER /var/www/rakit-campus
   ```
2. Upload atau `git clone` proyek ke `/var/www/rakit-campus`.
3. Salin konfigurasi environment:
   ```bash
   cd /var/www/rakit-campus/rakit-campus
   cp .env.example .env
   # Sesuaikan DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD di .env
   php artisan key:generate
   ```
4. Jalankan script deploy otomatis:
   ```bash
   bash ../server_deploy/deploy.sh
   ```
5. Salin konfigurasi Nginx:
   ```bash
   sudo cp ../server_deploy/nginx.conf /etc/nginx/sites-available/rakitcampus
   sudo ln -s /etc/nginx/sites-available/rakitcampus /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## Pilihan 3: Upload ke cPanel / Shared Hosting

1. **Build asset secara lokal terlebih dahulu:**
   ```bash
   cd rakit-campus
   npm run build
   ```
2. Compress / Zip isi folder `rakit-campus` (kecuali folder `node_modules` dan `.git`).
3. Di File Manager cPanel:
   - Ekstrak file zip ke folder di luar root publik, misalnya `/home/username/rakit-campus`.
   - Pindahkan seluruh isi folder `rakit-campus/public` ke folder `public_html`.
   - Edit file `public_html/index.php` dan sesuaikan path ke autoload dan bootstrap:
     ```php
     require __DIR__.'/../rakit-campus/vendor/autoload.php';
     $app = require_once __DIR__.'/../rakit-campus/bootstrap/app.php';
     ```
4. Buat database MySQL di cPanel dan import skema atau jalankan `php artisan migrate --force`.
5. Buat symlink storage dari terminal cPanel:
   ```bash
   php artisan storage:link
   ```

---

## Lokasi Direktori File Upload di Server

Di server, seluruh file yang diunggah mahasiswa (foto profil, dokumen lomba, lampiran tugas, dan sertifikat) tersimpan di:
- **Lokasi fisik:** `/var/www/rakit-campus/rakit-campus/storage/app/public/uploads/`
  - `uploads/avatars/`: Foto profil pengguna
  - `uploads/documents/`: Dokumen dan proposal kompetisi
  - `uploads/attachments/`: Lampiran tugas workspace
  - `uploads/portfolios/`: Bukti portofolio dan sertifikat
- **URL Akses Publik:** `http://<domain-server>/storage/uploads/<kategori>/<nama-file>`
- **API Endpoint:** `POST /api/v1/uploads` (Multipart/form-data: `file`, `type`)
