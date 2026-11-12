import AppLayout from '@/layouts/app-layout';
import SeoHead from '@/components/seo/SeoHead';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronRight, Database, EyeOff, Key, Lock, Mail, Shield, ShieldCheck, UserCheck } from 'lucide-react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kebijakan Privasi', href: '/privacy' },
];

export default function PrivacyIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SeoHead
                title="Kebijakan Privasi Data Mahasiswa — RAKIT Campus"
                description="Kebijakan privasi resmi dan perlindungan data pribadi mahasiswa di RAKIT Campus sesuai Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022)."
                keywords="kebijakan privasi, data pribadi mahasiswa, keamanan NIM, privasi rakit campus, perlindungan data kampus"
                canonicalUrl="https://rakitcampus.my.id/privacy"
            />

            <div className="max-w-4xl mx-auto space-y-8 pb-16">
                {/* Header Judulnya Aja */}
                <div className="border-b border-slate-100 pb-5">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        Kebijakan Privasi Data
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Terakhir diperbarui: 12 November 2026 • Kompatibel penuh dengan UU PDP No. 27/2022 Republik Indonesia
                    </p>
                </div>

                {/* Komitmen Perlindungan Privasi */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                            <ShieldCheck className="size-4 text-emerald-600" />
                            <span>Kepatuhan UU PDP No. 27/2022</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            Data pribadi mahasiswa diproses secara transparan, terbatas untuk keperluan akademik dan kolaborasi resmi.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                        <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                            <EyeOff className="size-4 text-blue-600" />
                            <span>Kontak Pribadi Terlindungi</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            Nomor WhatsApp atau kontak langsung hanya diberikan kepada anggota tim resmi setelah proses rekrutmen disetujui.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                            <Lock className="size-4 text-slate-700" />
                            <span>Enkripsi Standar Industri</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            Kredensial dan data tersimpan dengan standar keamanan kata sandi bcrypt dan komunikasi terenkripsi SSL/TLS.
                        </p>
                    </div>
                </div>

                {/* Konten Kebijakan */}
                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {/* Bagian 1 */}
                    <section id="principles" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            1. Komitmen Privasi Kami
                        </h2>
                        <p>
                            Di <strong>RAKIT Campus</strong>, privasi dan kedaulatan data mahasiswa adalah prioritas tertinggi kami. Dokumen Kebijakan Privasi ini menguraikan jenis informasi pribadi yang kami kumpulkan, bagaimana informasi tersebut digunakan, disimpan, dan dilindungi saat Anda menggunakan layanan kami di platform <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-xs">rakitcampus.my.id</code>.
                        </p>
                    </section>

                    {/* Bagian 2 */}
                    <section id="data-collected" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            2. Data Pribadi yang Kami Kumpulkan
                        </h2>
                        <p>Kami hanya mengumpulkan data yang relevan dan dibutuhkan untuk menunjang kolaborasi dan administrasi tim:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>
                                <strong>Data Identitas Akademik:</strong> Nama lengkap, alamat surel (email), asal perguruan tinggi, program studi, jenjang pendidikan, dan Nomor Induk Mahasiswa (NIM). <em>Pengisian NIM bersifat opsional pada saat registrasi.</em>
                            </li>
                            <li>
                                <strong>Profil Keahlian & Portofolio:</strong> Kategori minat keahlian (contoh: Frontend, Backend, UI/UX, AI/ML, Pitching, Business Plan), ringkasan bio, tautan portofolio eksternal (GitHub, LinkedIn, Figma, dsb.).
                            </li>
                            <li>
                                <strong>Data Kolaborasi Tim:</strong> Proyek yang Anda ikuti, formasi peran dalam tim, tugas papan kanban, berkas karya persiapan lomba, dan status pendaftaran kompetisi.
                            </li>
                            <li>
                                <strong>Data Kontak Rekrutmen:</strong> Nomor telepon / WhatsApp yang dicantumkan saat melamar tim rekan. Data ini berstatus privat dan tidak disajikan pada indeks publik.
                            </li>
                            <li>
                                <strong>Log Teknis & Keamanan:</strong> Alamat IP, jenis peramban (browser), stempel waktu akses, preferensi tema tampilan, dan data cookie otentikasi sesi.
                            </li>
                        </ul>
                    </section>

                    {/* Bagian 3 */}
                    <section id="purposes" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            3. Tujuan Penggunaan & Pemrosesan Data
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                <span className="font-bold text-slate-900 block">AI Smart Fair Matchmaking</span>
                                <span className="text-slate-600 block text-xs">
                                    Menganalisis kecocokan keahlian antar mahasiswa untuk membentuk tim kompetisi yang sinergis dan bebas bias subjektif.
                                </span>
                            </div>
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                <span className="font-bold text-slate-900 block">Notifikasi & Push Alerts</span>
                                <span className="text-slate-600 block text-xs">
                                    Mengirimkan pembaruan status lamaran tim, penugasan tugas baru, tenggat waktu lomba, dan email transaksional langsung ke peramban atau perangkat Anda.
                                </span>
                            </div>
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                <span className="font-bold text-slate-900 block">Klasemen & Verifikasi Prestasi</span>
                                <span className="text-slate-600 block text-xs">
                                    Mencatat skor kontribusi proyek terverifikasi dan prestasi juara pada Leaderboard Nasional secara transparan.
                                </span>
                            </div>
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                <span className="font-bold text-slate-900 block">Keamanan & Pencegahan Akses Ilegal</span>
                                <span className="text-slate-600 block text-xs">
                                    Mencegah serangan brute force, pencurian sesi login, dan menjamin kepatuhan terhadap standar keamanan server.
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Bagian 4 */}
                    <section id="sharing" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            4. Kerahasiaan & Batasan Pembagian Data ke Pihak Ketiga
                        </h2>
                        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-emerald-950 font-medium">
                            <p className="font-bold text-emerald-900">
                                RAKIT Campus Tidak Menjual Data Pribadi:
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                                Kami tidak pernah dan tidak akan pernah menjual, menyewakan, atau memperdagangkan data pribadi mahasiswa kepada perusahaan periklanan pihak ketiga.
                            </p>
                        </div>
                        <p>Data pribadi Anda hanya dapat diakses dalam kondisi berikut:</p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                            <li>Oleh anggota tim yang telah Anda terima atau tempat Anda bergabung dalam ruang kerja privat.</li>
                            <li>Dosen pembimbing yang Anda undang secara eksplisit untuk meninjau progres tugas atau proposal lomba.</li>
                            <li>Kewajiban kepatuhan hukum apabila diperintahkan oleh aparat penegak hukum yang sah di wilayah Republik Indonesia sesuai perundang-undangan yang berlaku.</li>
                        </ul>
                    </section>

                    {/* Bagian 5 */}
                    <section id="rights" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            5. Hak Pengguna sebagai Subjek Data (Sesuai UU PDP)
                        </h2>
                        <p>Berdasarkan regulasi perlindungan data pribadi Indonesia, Anda memiliki hak penuh untuk:</p>
                        <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                            <li><strong>Hak Akses:</strong> Melihat seluruh data profil akademik dan riwayat aktivitas yang tersimpan.</li>
                            <li><strong>Hak Pembaruan:</strong> Mengubah atau memperbarui informasi profil, NIM, dan portofolio sewaktu-waktu melalui menu Pengaturan Profil.</li>
                            <li><strong>Hak Penghapusan (Right to be Forgotten):</strong> Meminta penutupan akun dan penghapusan data identitas pribadi melalui menu Pengaturan Akun.</li>
                            <li><strong>Hak Pengendalian Notifikasi:</strong> Menyetujui atau menonaktifkan izin push notifikasi peramban dan email berkala.</li>
                        </ul>
                    </section>

                    {/* Bagian 6 */}
                    <section id="security" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            6. Keamanan Data & Penyimpanan
                        </h2>
                        <p>
                            Data disimpan pada infrastruktur peladen aman dengan proteksi firewall, isolasi kontainer Docker, enkripsi transmisi HTTPS dengan sertifikat SSL valid, serta cadangan basis data berkala. Kredensial kata sandi di-hash menggunakan algoritma modern satu arah dan tidak dapat dibaca oleh staf kami.
                        </p>
                    </section>

                    {/* Bagian 7 */}
                    <section id="contact-dpo" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            7. Kontak Petugas Perlindungan Data (DPO)
                        </h2>
                        <p>
                            Apabila Anda memiliki pertanyaan, keluhan, atau permohonan terkait privasi data Anda di RAKIT Campus, silakan sampaikan kepada Petugas Perlindungan Data kami:
                        </p>
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800">
                            dpo@rakitcampus.my.id • privacy@rakitcampus.my.id
                        </div>
                    </section>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <Link href="/terms" className="hover:text-blue-600 transition flex items-center gap-1">
                        <span>Baca Syarat & Ketentuan Layanan</span>
                        <ChevronRight className="size-3.5" />
                    </Link>
                    <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">
                        Kembali ke Dashboard
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
