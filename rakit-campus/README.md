# RAKIT Campus — Web Application & Backend API

Aplikasi terintegrasi **Laravel 12** + **Inertia.js (React 19 + TypeScript + Tailwind CSS v4)** yang menjadi pusat sistem RAKIT Campus:
- **Portal Kelas Akademik Dosen (`/classes`)**: Manajemen kode kelas, Smart Team Balancing, anti-ketimpangan, dan bimbingan proyek.
- **Matchmaking Engine (`/matching`)**: Algoritma pencocokan 4-dimensi komplementer dan pembagian adil (*fair multi-archetype distribution*).
- **Workspace Proyek (`/projects/{id}`)**: Papan Kanban interaktif, milestone roadmap, dan evaluasi berkala dari dosen.
- **Modern Glassmorphism UI**: Tampilan bertema kaca buram (*frosted glass*), pencahayaan ambien alami, dan palet resmi *Royal Electric Blue* & *Deep Slate*.

Dokumentasi arsitektur lengkap dan panduan mobile tersedia di [Root README](../README.md).

---

## Live Production Server

* **Live URL:** [https://rakitcampus.mataceria.my.id](https://rakitcampus.mataceria.my.id)
* **Demo Cepat 1-Klik:** Tersedia di halaman `/login` untuk langsung mencoba akun Dosen atau Mahasiswa.

### Kredensial Uji Coba (Pilot Polindra):
- **Dosen Pengampu:** `budi@polindra.ac.id` / `password123`
- **Mahasiswa Backend:** `ahmad.fauzi@student.polindra.ac.id` / `password123`
- **Mahasiswa Mobile:** `siti@polindra.ac.id` / `password123`
- **Mahasiswa RPL:** `agus@polindra.ac.id` / `password123`
- **Mahasiswa UI/UX:** `dewi@polindra.ac.id` / `password123`

---

## Perintah Penting Pengembang

```bash
# Jalankan migrasi & seeder data pilot
php artisan migrate:fresh --seed

# Kompilasi aset frontend Vite
npm run build

# Menjalankan unit & feature tests (PHPUnit)
php vendor/phpunit/phpunit/phpunit

# Menjalankan server lokal
php artisan serve
```
