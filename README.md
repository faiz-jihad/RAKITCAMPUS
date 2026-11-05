# RAKIT Campus

<p align="center">
  <img src="rakit-campus/public/images/rakit-logo.png" alt="RAKIT Campus Logo" width="280" />
</p>

<p align="center">
  <strong>Build the Right Team, Build Something Real.</strong><br />
  Platform Ekosistem Pembentukan Tim Berimbang, Manajemen Kelas Akademik, Project Hub, dan Competition Hub Mahasiswa.
</p>

<p align="center">
  <a href="https://rakitcampus.mataceria.my.id" target="_blank">
    <img src="https://img.shields.io/badge/Production%20Live-rakitcampus.mataceria.my.id-2563EB?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Live Production" />
  </a>
  <img src="https://img.shields.io/badge/Tests-65%20Passed%20(361%20assertions)-emerald?style=for-the-badge&logo=php" alt="65 Tests Passed" />
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12" />
  <img src="https://img.shields.io/badge/Inertia.js-React%2019-9333EA?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Flutter-3.x-02569B?style=for-the-badge&logo=flutter&logoColor=white" alt="Flutter" />
</p>

---

## 1. Ikhtisar Platform

**RAKIT Campus** adalah platform kolaborasi mahasiswa dan perguruan tinggi yang menghubungkan mahasiswa dengan proyek capstone akademik, bimbingan dosen, serta keikutsertaan kompetisi nasional maupun internasional. RAKIT Campus menjawab tantangan klasik di lingkungan kampus: **ketimpangan pembentukan kelompok, fenomena "teman satu geng" (*social loafing* & *free rider*), serta minimnya pemantauan terstruktur dari dosen pengampu**.

Platform ini mengintegrasikan empat pilar utama:
1. **Portal Kelas Akademik & Bimbingan Dosen (`/classes`)**: Manajemen kelas perkuliahan berbasis kode gabung instan, penugasan multi-dosen (*co-lecturers*), pembagian kelompok otomatis berkeadilan (*Smart Team Balancing*), dan pencatatan bimbingan terpusat.
2. **Project Hub — Living Proposal & Continuous Development (`/projects`)**: Siklus hidup proyek lengkap dari awal semester hingga UAS. Menerapkan konsep *One Project — One Proposal*, di mana proposal terus berkembang seiring implementasi Kanban dengan snapshot penilaian UTS dan evaluasi akhir UAS.
3. **Competition Hub & Verified Achievement Portfolio (`/competitions`)**: Modul end-to-end partisipasi kompetisi mahasiswa: *Discovery → Detail & Provenance → Team Formation → Fair Matchmaking → Preparation Workspace → Deliverables Upload → Selection Stage Tracking → Verified Achievement Portfolio*.
4. **Unified Membership System (Rule 1)**: Kebijakan 1 mahasiswa 1 aktivitas aktif lintas Project Hub dan Competition Hub untuk mencegah over-alokasi beban kerja dan monopoli talenta.
5. **Modern Frosted Glassmorphism UI**: Desain antarmuka bersih berbasis kaca buram berkabut (*frosted glass*), pencahayaan ambien natural, dan skema warna resmi *Royal Electric Blue* (`#2563EB`) & *Deep Slate* (`#0F172A`) tanpa teks tumpang tindih (*zero overlap*) dan bebas ungu neon AI generik.

---

## 2. Live Demo & Kredensial Pilot (Polindra)

Aplikasi telah terpasang dan siap uji secara langsung di server production:

* **URL Web Production:** [https://rakitcampus.mataceria.my.id](https://rakitcampus.mataceria.my.id)
* **Katalog Kompetisi:** [https://rakitcampus.mataceria.my.id/competitions](https://rakitcampus.mataceria.my.id/competitions)
* **Katalog Proyek:** [https://rakitcampus.mataceria.my.id/projects](https://rakitcampus.mataceria.my.id/projects)
* **Demo Cepat 1-Klik:** Tersedia tombol *1-Click Demo Login* di halaman login untuk beralih instan antara akun **Mahasiswa** dan **Dosen**.

### Kredensial Uji Coba:

| Role | Nama | Email Akun | Password | Deskripsi Akses |
| :--- | :--- | :--- | :--- | :--- |
| **Dosen** | **Budi Santoso, M.Kom.** | `budi@polindra.ac.id` | `password123` | Buat kelas, supervisi bimbingan, verifikasi lomba & hasil prestasi |
| **Mahasiswa** | **Ahmad Fauzi** | `ahmad.fauzi@student.polindra.ac.id` | `password123` | Mahasiswa Backend (Ketua Tim, cari rekan komplementer) |
| **Mahasiswa** | **Siti Rahma** | `siti@polindra.ac.id` | `password123` | Mahasiswa Mobile Flutter & IoT |
| **Mahasiswa** | **Agus Pratama** | `agus@polindra.ac.id` | `password123` | Mahasiswa Rekayasa Perangkat Lunak |
| **Mahasiswa** | **Dewi Sartika** | `dewi@polindra.ac.id` | `password123` | Mahasiswa UI/UX Designer & Data |

---

## 3. Fitur Unggulan Sistem

### A. Project Hub: Living Proposal & Continuous Development
- **One Project — One Proposal:** Satu proposal terpadu yang terus berevolusi bersama implementasi riil mahasiswa sepanjang satu semester.
- **Siklus Hidup Akademik Terpadu (18 Tahapan):**
  $$\text{Class Setup} \rightarrow \text{Lecturer Assignment} \rightarrow \text{Competency Profiling} \rightarrow \text{Project Creation} \rightarrow \text{Proposal Draft} \rightarrow \text{Team Formation} \rightarrow \text{Fair Matchmaking} \rightarrow \text{Lecturer Review} \rightarrow \text{Workspace Activation} \rightarrow \text{Kanban Tasks} \rightarrow \text{UTS Submission} \rightarrow \text{UTS Assessment} \rightarrow \text{Revision} \rightarrow \text{Final Implementation} \rightarrow \text{UAS Submission} \rightarrow \text{Final Grading} \rightarrow \text{Project Completion} \rightarrow \text{Portfolio}$$
- **Snapshot Imutabel UTS/UAS:** Pengumpulan UTS menyimpan snapshot status proposal dan progres implementasi tanpa merusak riwayat revisi pasca-UTS.
- **Workspace Gatekeeper:** Ruang kerja proyek hanya dapat diakses setelah susunan tim dan perizinan proposal disetujui dosen pembimbing.

### B. Competition Hub: Manajemen Lomba & Prestasi Terverifikasi
- **Validasi Sumber Resmi (Anti-Hoax):** Kompetisi yang didaftarkan mahasiswa berstatus *unverified* dan wajib mencantumkan tautan resmi penyelenggara sebelum diverifikasi oleh dosen/admin.
- **Dedicated Preparation Workspace:** Ruang persiapan tim lomba dengan *Readiness Progress Score*, Papan Kanban tugas, dan catatan strategi bimbingan.
- **Document & Deliverables Management:** Mendukung aneka luaran lomba (Proposal, Pitch Deck, Video Demo, Source Code Repo, Poster) dengan sistem pelacakan versi (*versioning*) dan pencatatan bukti pengiriman eksternal (*External Submission Proof URL*).
- **Pipeline Pelacakan 10 Tahapan Seleksi:**
  `Recruiting → Team Formation → Preparing → Registered → Submitted → Administrative Selection → Shortlisted → Finalist → Final Presentation → Winner / Finished`
- **Kunci Formasi Tim (*Lock Formation*):** Mencegah perubahan anggota tim ilegal saat kompetisi sudah berjalan.
- **Verified Achievement Portfolio:** Hasil kejuaraan diverifikasi oleh dosen/admin sebelum otomatis diterbitkan ke profil publik portofolio seluruh anggota tim.

### C. Smart Fair Matchmaking System (`App\Services\Matchmaking`)
- **Formula Kecocokan Komplementer Transparan (Project Hub):**
  $$\text{Score} = (0.30 \times \text{Skill}) + (0.20 \times \text{Role}) + (0.15 \times \text{Interest}) + (0.10 \times \text{Availability}) + (0.15 \times \text{Diversity}) + (0.10 \times \text{Fairness})$$
- **Formula Kecocokan Kompetisi (Competition Hub):**
  $$\text{Match Score} = (0.40 \times \text{Skill}) + (0.20 \times \text{Role}) + (0.20 \times \text{Availability}) + (0.20 \times \text{Opportunity Fairness})$$
- **Afirmasi Mahasiswa Pemula (*Beginner Boost*):** Menjamin mahasiswa baru atau mahasiswa tanpa rekam jejak juara tetap mendapatkan peluang masuk ke dalam tim kompetitif.
- **3 Moda Matchmaking:** Mode A (Manual Matchmaking), Mode B (Rekomendasi Cerdas Transparan), Mode C (Simulasi Alokasi Berimbang Kelas Berbimbingan Dosen).

### D. Unified Membership System (Rule 1 Integration)
- **Aturan Ketat:** Mahasiswa hanya dapat menjadi anggota aktif pada **1 proyek atau 1 kompetisi aktif** dalam satu waktu untuk mencegah penumpukan beban kerja dan *free-riding*.
- **Konfigurasi Fleksibel (`config/matchmaking.php`):**
  - `STRICT` *(Default)*: 1 aktivitas aktif lintas Project Hub & Competition Hub.
  - `FLEXIBLE`: Batas partisipasi akademik dan lomba dihitung terpisah.
- **Database Concurrency Protection:** Ditegakkan dengan transaksi database atomik dan *pessimistic locking* (`lockForUpdate`).
- **Pelepasan Slot Otomatis:** Saat proyek dinyatakan *completed* atau keikutsertaan kompetisi berstatus *winner*, *not_selected*, atau *withdrawn*, kuota partisipasi mahasiswa otomatis terbebas.

### E. Bebas Kueri N+1 & Kinerja Tinggi
- Mengaktifkan `Model::preventLazyLoading(!app()->isProduction())` di `AppServiceProvider` yang menggagalkan eksekusi jika terjadi kueri lazy loading tidak sengaja.
- Seluruh kueri pada controller dan service menggunakan *eager loading* teroptimasi (`with(...)`, `withCount(...)`, `loadMissing(...)`).
- Hasil eksekusi test suite: **65 Test Cases Lulus 100% (361 assertions)**.

---

## 4. Arsitektur Repositori

```
RakitCampus/
│
├── rakit-campus/                 # Laravel 12 + Inertia.js (React 19 + TypeScript + Tailwind v4)
│   ├── app/
│   │   ├── Enums/                # Domain Enums (Stages, Outcomes, Roles, Categories, Priorities)
│   │   ├── Http/Controllers/Api/ # REST API v1 Handlers
│   │   ├── Http/Controllers/Web/ # Inertia Web Controllers (Classes, Projects, Competitions, Workspace)
│   │   ├── Models/               # Eloquent Models & Hubungan Relasional
│   │   ├── Policies/             # IDOR Security & Permission Policies
│   │   └── Services/Matchmaking/ # EligibilityService, MembershipService, CompetitionMatchmakingService
│   ├── config/matchmaking.php    # Konfigurasi bobot matchmaking & mode membership (strict/flexible)
│   ├── database/migrations/      # 16 Migrasi Database Lengkap (Skema Project & Competition Hub)
│   ├── resources/
│   │   ├── css/app.css           # Glassmorphism Design Tokens (.glass-surface, .glass-card)
│   │   └── js/
│   │       ├── components/       # UI Shell, Sidebar, Icons, Forms
│   │       ├── layouts/          # AppLayout & AuthLayout
│   │       └── pages/            # Classes, Projects, Competitions, Workspace, Dashboard
│   └── tests/Feature/            # PHPUnit Feature Test Suites (ProjectHub, CompetitionHub, Matchmaking)
│
├── mobile/                       # Flutter Cross-Platform Client
│   ├── lib/                      # Clean Architecture (Core, Features, Routing)
│   └── test/                     # Flutter Smoke & Widget Tests
│
├── server_deploy/                # Asset Deployment Server VPS Docker
│   ├── docker-compose.yml        # Dockerized App, MySQL, Nginx
│   └── README_DEPLOY.md          # Petunjuk pemeliharaan server production
│
└── docs/                         # Dokumen Spesifikasi Teknis & Panduan
```

---

## 5. Cara Menjalankan Secara Lokal

### Prasyarat
- PHP 8.2+ (diuji pada PHP 8.4) dengan ekstensi `pdo_mysql`, `pdo_sqlite`, `mbstring`, `curl`
- Composer 2.x
- Node.js 20+ & npm
- MySQL 8.0 atau SQLite

### Langkah Instalasi Web & Backend:
```bash
# 1. Masuk ke direktori web
cd rakit-campus

# 2. Pasang dependencies PHP dan Node.js
composer install
npm install

# 3. Konfigurasi file environment
cp .env.example .env
php artisan key:generate

# 4. Jalankan migrasi dan seeder data pilot Polindra
php artisan migrate:fresh --seed

# 5. Bangun aset frontend Vite
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
php artisan test
```
> **Hasil Verifikasi:** `Tests: 65 passed (361 assertions)` — **100% Passing**.
> Termasuk pengujian `CompetitionHubTest`, `ProjectHubLifecycleTest`, `ProjectHubLivingProposalAndAssessmentTest`, `SmartFairMatchmakingTest`, dan `WebPageRenderTest`.

### Mobile Static Analysis:
```bash
cd mobile
flutter analyze
flutter test
```
> **Hasil Verifikasi:** `No issues found!` — 0 warnings / errors.

---

## 7. Lisensi & Tim Pengembang

Dikembangkan dengan dedikasi untuk memajukan kolaborasi mahasiswa, transparansi tim, dan pendidikan tinggi berprestasi di Indonesia.  
© 2026 **RAKIT Campus** — All Rights Reserved.
