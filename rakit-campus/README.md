# RAKIT Campus — Web Application & Backend API

Aplikasi terintegrasi **Laravel 12** + **Inertia.js (React 19 + TypeScript + Tailwind CSS v4)** yang menjadi pusat ekosistem RAKIT Campus:
- **Portal Kelas Akademik Dosen (`/classes`)**: Manajemen kode kelas 6-digit, penugasan multi-dosen (*co-lecturers*), Smart Team Balancing, anti-ketimpangan, dan bimbingan proyek.
- **Project Hub — Living Proposal & Continuous Development (`/projects`)**: Siklus hidup proyek lengkap dari awal semester hingga UAS. Menerapkan konsep *One Project — One Proposal*, di mana proposal terus berkembang seiring implementasi Kanban dengan snapshot penilaian UTS dan evaluasi akhir UAS.
- **Competition Hub & Verified Achievement (`/competitions`)**: Modul keikutsertaan kompetisi terpadu: *Discovery → Detail Lomba & Provenansi Anti-Hoax → Formasi Tim → Fair Matchmaking → Preparation Workspace → Manajemen Dokumen & Versioning → Pelacakan 10 Tahapan Seleksi → Verifikasi Prestasi ke Portofolio*.
- **Smart Fair Matchmaking Engine (`/matching`)**: Algoritma pencocokan multi-dimensi komplementer dengan afirmasi mahasiswa pemula (*beginner boost*) dan pembagian adil (*fair multi-archetype distribution*).
- **Unified Membership System (Rule 1)**: Penegakan aturan 1 mahasiswa 1 proyek/kompetisi aktif lintas hub dengan opsi mode `STRICT` atau `FLEXIBLE` via konfigurasi `config/matchmaking.php`.
- **Modern Frosted Glassmorphism UI**: Tampilan bertema kaca buram lembut (*frosted glass*), pencahayaan ambien alami, dan palet resmi *Royal Electric Blue* (`#2563EB`) & *Deep Slate* (`#0F172A`) tanpa teks bertumpuk (*zero overlap*).

Dokumentasi arsitektur menyeluruh dan panduan aplikasi mobile tersedia di [Root README](../README.md).

---

## Live Production Server

* **Live URL:** [https://rakitcampus.mataceria.my.id](https://rakitcampus.mataceria.my.id)
* **Katalog Kompetisi:** [https://rakitcampus.mataceria.my.id/competitions](https://rakitcampus.mataceria.my.id/competitions)
* **Katalog Proyek:** [https://rakitcampus.mataceria.my.id/projects](https://rakitcampus.mataceria.my.id/projects)
* **Demo Cepat 1-Klik:** Tersedia di halaman `/login` untuk langsung mencoba akun Dosen atau Mahasiswa.

### Kredensial Uji Coba (Pilot Polindra):
- **Dosen Pengampu:** `budi@polindra.ac.id` / `password123`
- **Mahasiswa Backend:** `ahmad.fauzi@student.polindra.ac.id` / `password123`
- **Mahasiswa Mobile:** `siti@polindra.ac.id` / `password123`
- **Mahasiswa RPL:** `agus@polindra.ac.id` / `password123`
- **Mahasiswa UI/UX:** `dewi@polindra.ac.id` / `password123`

---

## Fitur Inti & Smart Fair Matchmaking

1. **Aturan 1 Mahasiswa 1 Proyek/Kompetisi Aktif (Rule 1):** Mahasiswa hanya boleh aktif di 1 aktivitas proyek/kompetisi sekaligus. Dilindungi transaksi database atomik & row locking. Slot otomatis dilepas saat aktivitas selesai.
2. **Formula Pembobotan Cerdas Komplementer:**
   - **Proyek Akademik:** $(0.30 \times \text{Skill}) + (0.20 \times \text{Role}) + (0.15 \times \text{Interest}) + (0.10 \times \text{Availability}) + (0.15 \times \text{Diversity}) + (0.10 \times \text{Fairness})$
   - **Kompetisi:** $(0.40 \times \text{Skill}) + (0.20 \times \text{Role}) + (0.20 \times \text{Availability}) + (0.20 \times \text{Beginner Fairness Boost})$
3. **Dedicated Preparation Workspace:** Dilengkapi indikator kesiapan tim (*Readiness Score*), Papan Kanban tugas terpadu, dan pelacakan 10 tahapan seleksi (*Selection Stage Tracker*).
4. **Document Versioning & External Submission Proof:** Manajemen berkas luaran (Proposal, Pitch Deck, Video Demo, Repo URL, Poster) dengan pencatatan versi bertahap dan audit status pengiriman eksternal.
5. **Zero N+1 Query Guarantee:** Dilengkapi `Model::preventLazyLoading(!app()->isProduction())` dengan eager loading teroptimasi di seluruh query.
6. **Desain Glassmorphism Bersatu:** Menggunakan Royal Electric Blue (`#2563EB`) & Deep Slate (`#0F172A`) di seluruh halaman (bebas ungu AI dan bebas overlap).
7. **Passing Tests:** **65 test cases lulus 100% (361 assertions)** termasuk alur Project Hub, Competition Hub, dan Matchmaking.

---

## Perintah Penting Pengembang

```bash
# Jalankan migrasi & seeder data pilot
php artisan migrate:fresh --seed

# Kompilasi aset frontend Vite
npm run build

# Menjalankan unit & feature tests (PHPUnit)
php artisan test

# Menjalankan server lokal
php artisan serve
```
