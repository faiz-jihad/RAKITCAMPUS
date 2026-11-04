# RAKIT Campus

<p align="center">
  <img src="rakit-campus/public/images/rakit-logo.png" alt="RAKIT Campus Logo" width="280" />
</p>

<p align="center">
  <strong>Build the Right Team, Build Something Real.</strong><br />
  Platform Ekosistem Pembentukan Tim Berimbang, Manajemen Kelas Akademik Dosen, dan Workspace Proyek Mahasiswa.
</p>

<p align="center">
  <a href="https://rakitcampus.mataceria.my.id" target="_blank">
    <img src="https://img.shields.io/badge/Production%20Live-rakitcampus.mataceria.my.id-2563EB?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Live Production" />
  </a>
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12" />
  <img src="https://img.shields.io/badge/Inertia.js-React%2019-9333EA?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Flutter-3.x-02569B?style=for-the-badge&logo=flutter&logoColor=white" alt="Flutter" />
</p>

---

## 1. Ikhtisar Platform

**RAKIT Campus** hadir menjawab problematika klasik perkuliahan dan kompetisi mahasiswa: **ketimpangan pembentukan kelompok, fenomena "teman satu geng" (*social loafing* & *free rider*), serta minimnya pemantauan terstruktur dari dosen pengampu**.

Platform ini mengintegrasikan:
1. **Portal Kelas Akademik & Dosen Pengampu (`/classes`)**: Manajemen kelas perkuliahan berbasis Kode Gabung unik, pembagian kelompok otomatis berkeadilan (*Smart Team Balancing*), dan pencatatan bimbingan proyek terpusat.
2. **Mesin Matchmaking Anti-Ketimpangan**: Algoritma pencocokan 4-dimensi komplementer yang memastikan tiap kelompok memiliki kombinasi peran teknis berimbang (Backend, Frontend, Mobile, UI/UX, Data/AI) serta mengunci kuota tim secara ketat.
3. **Workspace Proyek Kolaboratif (`/projects/{id}`)**: Papan Kanban interaktif ala Trello (`todo`, `in_progress`, `in_review`, `completed`), visualisasi roadmap tenggat waktu, dan catatan evaluasi/nilai dari dosen.
4. **Desain Modern Glassmorphism**: Antarmuka bersih berestetika kaca buram (*frosted glass*), pencahayaan ambien alami, dan skema warna resmi *Royal Electric Blue* & *Deep Slate* yang bebas dari gradien ungu khas AI generik.

---

## 2. Live Demo & Kredensial Pilot (Polindra)

Aplikasi telah terpasang dan siap uji secara langsung di server production:

* **URL Web Production:** [https://rakitcampus.mataceria.my.id](https://rakitcampus.mataceria.my.id)
* **Demo Cepat 1-Klik:** Tersedia tombol *1-Click Demo Login* di halaman login untuk beralih instan antara mode **Mahasiswa** dan **Dosen**.

### Kredensial Uji Coba:

| Role | Nama | Email Akun | Password | Deskripsi Akses |
| :--- | :--- | :--- | :--- | :--- |
| **Dosen** | **Budi Santoso, M.Kom.** | `budi@polindra.ac.id` | `password123` | Buat kelas, kunci aturan kelompok, auto-balance tim, & beri nilai |
| **Mahasiswa** | **Ahmad Fauzi** | `ahmad.fauzi@student.polindra.ac.id` | `password123` | Mahasiswa Backend (cari rekan komplementer kelas) |
| **Mahasiswa** | **Siti Rahma** | `siti@polindra.ac.id` | `password123` | Mahasiswa Mobile Flutter & IoT |
| **Mahasiswa** | **Agus Pratama** | `agus@polindra.ac.id` | `password123` | Mahasiswa Rekayasa Perangkat Lunak |
| **Mahasiswa** | **Dewi Sartika** | `dewi@polindra.ac.id` | `password123` | Mahasiswa UI/UX Designer & Data |

---

## 3. Fitur Unggulan

### A. Smart Fair Matchmaking System (`App\Services\Matchmaking`)
* **Aturan Ketat 1 Mahasiswa 1 Proyek Aktif (Rule 1):**
  * Mahasiswa hanya dapat menjadi anggota aktif pada **1 proyek aktif** dalam satu waktu (berlaku lintas Project Hub dan Competition Hub).
  * Menghindari ketimpangan beban kerja, monopoli talenta, dan *free-riding*.
  * Dijamin dengan transaksi database atomik dan *pessimistic locking* (`lockForUpdate`) untuk mencegah *race condition*.
  * Ketika proyek selesai secara resmi (*completed*), status mahasiswa terbebas untuk bergabung ke proyek berikutnya.
* **Model Pembobotan Kecocokan 6-Komponen (Formula Transparan):**
  $$\text{Final Score} = (0.30 \times \text{Skill}) + (0.20 \times \text{Role}) + (0.15 \times \text{Interest}) + (0.10 \times \text{Availability}) + (0.15 \times \text{Diversity}) + (0.10 \times \text{Fairness})$$
  * **Skill Compatibility (30%):** Cakupan skill kunci, level profisiensi (pemula/menengah/mahir), dan fleksibilitas proyek pemula.
  * **Role Compatibility (20%):** Keselarasan peran yang diminati dengan posisi rekrutmen yang lowong.
  * **Interest Compatibility (15%):** Kesesuaian minat topik mahasiswa dengan kategori proyek.
  * **Availability Compatibility (10%):** Keselarasan jam komitmen mingguan.
  * **Team Diversity (15%):** Komposisi komplementer (menghindari penumpukan peran sejenis).
  * **Opportunity Fairness (10%):** Afirmasi kesempatan bagi mahasiswa proyek perdana (*first-timers*) dan mahasiswa yang pernah ditolak agar tidak tereksklusi berulang kali.
* **Tiga Moda Matchmaking:**
  1. **Mode A — Manual Matching:** Ketua tim memilih kandidat secara manual dengan validasi kelayakan dan kuota ketat.
  2. **Mode B — Smart Recommendation:** Rekomendasi personal bagi mahasiswa dan ketua tim dengan transparansi alasan & radar skor.
  3. **Mode C — Assisted Team Allocation:** Simulasi alokasi kelas cerdas bagi dosen pengampu, lengkap dengan pratinjau matriks, metriks fairness, dan persetujuan dosen sebelum aktivasi keanggotaan.
* **Fairness Analytics Dashboard (`/classes/{id}`):**
  * Metriks real-time dari database: Tingkat Partisipasi (%), Tingkat Keterisian Kuota (%), Afirmasi Mahasiswa Perdana (%), Rata-rata Waktu Menunggu, dan Rasio Ketimpangan Permintaan.

### B. Arsitektur Database & Bebas N+1 Query
* **Strict Anti N+1 Prevention:** Mengaktifkan `Model::preventLazyLoading(!app()->isProduction())` di `AppServiceProvider` yang menggagalkan eksekusi bila terjadi query N+1.
* Seluruh kueri pada controller, service, dan resource menggunakan *eager loading* teroptimasi (`with(...)`, `loadMissing(...)`, `withCount(...)`), meminimalkan beban basis data.
* **Hasil Pengujian Otomatis:** 50 Test Cases Lulus 100% (232 assertions) termasuk test alokasi, pembobotan, dan transaksi keanggotaan.

### C. Portal Kelas & Bimbingan Dosen (`/classes`)
* **Kode Gabung Instan:** Dosen membuat kelas mata kuliah dan sistem menerbitkan kode unik 6 digit (contoh: `LKYFZ4`).
* **Multi-Dosen & Supervisi:** Mendukung pembimbing utama dan ko-pembimbing untuk bimbingan milestone serta evaluasi berkala.
* **Catatan Bimbingan & Pengumuman:** Dosen dapat menerbitkan arahan teknis umum maupun umpan balik privat untuk kelompok proyek tertentu.

### D. Workspace Proyek & Kanban Roadmap (`/workspace/{teamId}`)
* **Papan Kanban Interaktif:** Pengelolaan tugas tim (`todo`, `in_progress`, `in_review`, `completed`) dengan prioritas dan penanggung jawab.
* **Desain Glassmorphism Bersatu:** Menggunakan palet resmi *Royal Electric Blue* (`#2563EB`) dan *Deep Slate* (`#0F172A`) di atas kanvas kabut kaca buram bebas dari elemen ungu AI generik.

---

## 4. Arsitektur Repositori

```
RakitCampus/
│
├── rakit-campus/                 # Laravel 12 + Inertia.js (React 19 + TypeScript + Tailwind)
│   ├── app/
│   │   ├── Enums/                # Domain Enums (State Machines, Levels, Categories)
│   │   ├── Http/Controllers/Api/ # REST API v1 Handlers
│   │   ├── Http/Controllers/Web/ # Inertia.js Web Handlers (Class, Project, Matching, Auth)
│   │   ├── Models/               # Eloquent Models & Active Relations
│   │   ├── Policies/             # IDOR Security & Permission Policies
│   │   └── Services/             # MatchingService (Fair Distribution & Team Synergy)
│   ├── database/                 # Migrations & Real Pilot Seeders (Polindra)
│   ├── resources/
│   │   ├── css/app.css           # Modern Glassmorphism Utilities (.glass-surface, .glass-card)
│   │   └── js/
│   │       ├── components/       # UI Shell, Sidebar, Icons, Forms
│   │       ├── layouts/          # AppLayout & AuthLayout
│   │       └── pages/            # Classes, Projects, Matching, Dashboard, Auth
│   └── tests/                    # PHPUnit Test Suite (41 tests, 196 assertions)
│
├── mobile/                       # Flutter Cross-Platform Mobile Client
│   ├── lib/
│   │   ├── core/                 # Dio Client, Sanctum Interceptors, Router, Theme
│   │   └── features/             # Clean Architecture: Auth, Projects, Matching, Profile
│   └── test/                     # Flutter Smoke & Widget Test Suite
│
├── server_deploy/                # Production VPS Deployment Assets
│   ├── docker-compose.yml        # Dockerized App, MySQL, Nginx configuration
│   └── README_DEPLOY.md          # Server provision & SSL maintenance guide
│
└── docs/                         # Technical Specs & Architecture Docs
```

---

## 5. Cara Menjalankan Secara Lokal

### Prasyarat
- PHP 8.2+ (diuji pada PHP 8.4) dengan ekstensi `pdo_mysql`, `mbstring`, `openssl`, `curl`
- Composer 2.x
- Node.js 20+ & npm
- MySQL 8.0

### Langkah Instalasi Web & Backend:
```bash
# 1. Masuk ke direktori web
cd rakit-campus

# 2. Pasang dependencies PHP dan JavaScript
composer install
npm install

# 3. Konfigurasi file environment
cp .env.example .env
php artisan key:generate

# 4. Jalankan migrasi dan seeder data pilot Polindra
php artisan migrate:fresh --seed

# 5. Bangun aset frontend
npm run build

# 6. Jalankan server lokal
php artisan serve
```
Buka browser pada `http://127.0.0.1:8000`.

### Menjalankan Aplikasi Mobile (Flutter):
```bash
cd mobile
flutter pub get
flutter run
```

---

## 6. Verifikasi & Pengujian Otomatis

### Backend Test Suite (PHPUnit):
```bash
cd rakit-campus
php vendor/phpunit/phpunit/phpunit
```
> **Hasil Verifikasi:** `OK (41 tests, 196 assertions)` — 100% Passing.

### Mobile Static Analysis:
```bash
cd mobile
flutter analyze
flutter test
```
> **Hasil Verifikasi:** `No issues found!` — 0 warnings / errors.

---

## 7. Lisensi & Tim Pengembang

Dikembangkan dengan bangga untuk memajukan kolaborasi mahasiswa dan pendidikan vokasi/akademik di Indonesia.  
© 2026 **RAKIT Campus** — All Rights Reserved.
