import AppLayout from '@/layouts/app-layout';
import SeoHead from '@/components/seo/SeoHead';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, CheckCircle2, ChevronRight, FileText, Globe, GraduationCap, Lock, Scale, Shield, ShieldCheck, Users } from 'lucide-react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Syarat & Ketentuan', href: '/terms' },
];

export default function TermsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SeoHead
                title="Syarat dan Ketentuan Layanan — RAKIT Campus"
                description="Syarat dan ketentuan resmi penggunaan platform RAKIT Campus bagi mahasiswa, pimpinan tim, dan civitas akademika di seluruh Indonesia."
                keywords="syarat dan ketentuan, terms of service, aturan kolaborasi mahasiswa, hak cipta proyek kampus, rakit campus"
                canonicalUrl="https://rakitcampus.my.id/terms"
            />

            <div className="max-w-4xl mx-auto space-y-8 pb-16">
                {/* Header Judulnya Aja */}
                <div className="border-b border-slate-100 pb-5">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        Syarat & Ketentuan Layanan
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Terakhir diperbarui: 12 November 2026 • Berlaku bagi seluruh civitas akademika pengguna RAKIT Campus
                    </p>
                </div>

                {/* Ringkasan Komitmen Penting */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                        <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                            <Lock className="size-4 text-blue-600" />
                            <span>100% Hak Cipta Mahasiswa</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            Kode sumber, proposal, karya inovasi, dan aset proyek tetap menjadi hak milik intelektual mahasiswa sepenuhnya.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                            <ShieldCheck className="size-4 text-emerald-600" />
                            <span>Zero Tolerance Joki & Plagiasi</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            Sistem melarang keras praktik perjokian, kecurangan akademik, dan klaim sepihak atas kontribusi rekan tim.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                            <Scale className="size-4 text-slate-700" />
                            <span>Kepatuhan Hukum Indonesia</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                            Tunduk pada ketentuan perundang-undangan RI, termasuk UU ITE dan UU Perlindungan Data Pribadi (UU PDP).
                        </p>
                    </div>
                </div>

                {/* Konten Pasal demi Pasal */}
                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {/* Bagian 1 */}
                    <section id="general" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            1. Penerimaan Ketentuan & Definisi
                        </h2>
                        <p>
                            Selamat datang di <strong>RAKIT Campus</strong> ("Platform", "Kami", "Layanan"). Dengan mendaftar, mengakses, atau menggunakan layanan pada domain <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-xs">rakitcampus.my.id</code> maupun subdomain terkait, Anda ("Pengguna", "Mahasiswa", "Dosen", atau "Penyelenggara") menyatakan telah membaca, memahami, dan menyetujui untuk terikat secara hukum oleh Syarat dan Ketentuan ini.
                        </p>
                        <p>
                            Jika Anda tidak menyetujui salah satu klausul dalam dokumen ini, Anda dipersilakan untuk menghentikan akses dan penggunaan platform secara sukarela.
                        </p>
                    </section>

                    {/* Bagian 2 */}
                    <section id="eligibility" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            2. Akun Mahasiswa, Kelayakan & Data Akademik
                        </h2>
                        <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                            <li>
                                Pengguna utama platform adalah mahasiswa aktif, alumni perguruan tinggi, dosen pembimbing, atau civitas akademika di wilayah Republik Indonesia.
                            </li>
                            <li>
                                Pengisian Nomor Induk Mahasiswa (NIM) pada saat registrasi bersifat <strong>opsional</strong>. Mahasiswa dapat memperbarui NIM dan status verifikasi kampus di kemudian hari pada halaman Pengaturan Akun & Profil.
                            </li>
                            <li>
                                Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi akun Anda serta seluruh aktivitas yang terjadi di bawah kredensial akun Anda.
                            </li>
                            <li>
                                Dilarang menggunakan identitas palsu, menyamar sebagai mahasiswa atau dosen lain, atau membuat akun tiruan untuk memanipulasi kuota pendaftaran tim atau klasemen.
                            </li>
                        </ul>
                    </section>

                    {/* Bagian 3: Hak Cipta */}
                    <section id="intellectual-property" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            3. Hak Kekayaan Intelektual (HKI) & Kepemilikan Karya
                        </h2>
                        <div className="p-4 bg-blue-50/50 border border-blue-200/70 rounded-2xl text-blue-950 font-medium space-y-1">
                            <p className="font-bold text-blue-900">
                                Prinsip Utama Kepemilikan Intelektual Mahasiswa:
                            </p>
                            <p className="text-xs text-slate-600">
                                <strong>RAKIT Campus tidak pernah mengklaim hak kepemilikan atas karya cipta apa pun yang Anda unggah ke platform ini.</strong>
                            </p>
                        </div>
                        <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                            <li>
                                Seluruh hak cipta atas materi, dokumen proposal, kode pemrograman, diagram arsitektur, desain antarmuka, prototipe fungsional, dan video demonstrasi yang diunggah ke Project Hub atau Competition Workspace tetap sepenuhnya menjadi hak milik Pengguna dan/atau tim kolaborator terkait.
                            </li>
                            <li>
                                Pengguna memberikan lisensi terbatas, non-eksklusif, bebas royalti kepada RAKIT Campus semata-mata untuk tujuan menampilkan, mendistribusikan secara internal tim, mengindeks pencarian keahlian (AI Smart Matching), dan menyajikan portofolio publik sesuai pengaturan privasi yang Anda pilih.
                            </li>
                            <li>
                                Pembagian kepemilikan kontribusi antar anggota tim diatur secara musyawarah mufakat di antara anggota tim internal yang bersangkutan.
                            </li>
                        </ul>
                    </section>

                    {/* Bagian 4: Kode Etik */}
                    <section id="code-of-conduct" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            4. Kode Etik Kolaborasi & Larangan Keras
                        </h2>
                        <p>
                            Untuk menjaga iklim akademis yang sehat, aman, dan berintegritas tinggi, seluruh pengguna dilarang keras melakukan hal-hal berikut:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 text-rose-950 text-xs space-y-1">
                                <span className="font-bold block">1. Perjokian & Kecurangan Akademik</span>
                                <span className="text-slate-600 block">Menjualbelikan jasa pengerjaan tugas akhir, skripsi joki, atau tugas kelas berbayar tanpa proses belajar mandiri.</span>
                            </div>
                            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 text-rose-950 text-xs space-y-1">
                                <span className="font-bold block">2. Plagiarisme & Pencurian Karya</span>
                                <span className="text-slate-600 block">Menyalin karya, proposal lomba, atau kode orang lain tanpa atribusi lisensi resmi yang sah.</span>
                            </div>
                            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 text-rose-950 text-xs space-y-1">
                                <span className="font-bold block">3. Perpeloncoan & Pelecehan</span>
                                <span className="text-slate-600 block">Melakukan diskriminasi SARA, intimidasi verbal, doxxing, atau pelecehan dalam ruang pesan dan rekrutmen tim.</span>
                            </div>
                            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 text-rose-950 text-xs space-y-1">
                                <span className="font-bold block">4. Manipulasi Poin Leaderboard</span>
                                <span className="text-slate-600 block">Mengunggah aktivitas fiktif, transaksi poin buatan, atau bersekongkol untuk memanipulasi klasemen prestasi.</span>
                            </div>
                        </div>
                    </section>

                    {/* Bagian 5: Kompetisi */}
                    <section id="competition-terms" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            5. Batasan Hubungan dengan Penyelenggara Kompetisi Eksternal
                        </h2>
                        <p>
                            Fitur <strong>Competition Hub</strong> dan <strong>Workspace Lomba</strong> pada RAKIT Campus bertindak sebagai sarana manajemen persiapan mandiri, pembentukan formasi tim mahasiswa, koordinasi pembimbingan dosen, dan rekam jejak prestasi internal.
                        </p>
                        <p>
                            Pendaftaran resmi keikutsertaan kompetisi (seperti Gemastik, PKM, Imagine Cup, ICPC, dsb.) tetap menjadi tanggung jawab individu atau perwakilan tim di portal resmi penyelenggara eksternal terkait. RAKIT Campus tidak memungut biaya pendaftaran kompetisi eksternal kecuali dinyatakan secara tertulis dalam kerja sama resmi.
                        </p>
                    </section>

                    {/* Bagian 6 */}
                    <section id="termination" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            6. Penangguhan & Penutupan Akun
                        </h2>
                        <p>
                            RAKIT Campus berhak menangguhkan sementara atau mencabut akses akun Pengguna secara permanen apabila ditemukan pelanggaran terhadap integritas akademik, laporan kecurangan terverifikasi dari kampus atau penyelenggara lomba, atau pelanggaran terhadap ketentuan perundang-undangan yang berlaku.
                        </p>
                    </section>

                    {/* Bagian 7 */}
                    <section id="contact" className="space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                            7. Pertanyaan & Bantuan Hukum
                        </h2>
                        <p>
                            Apabila Anda memiliki pertanyaan, klarifikasi klausul, atau ingin melaporkan dugaan pelanggaran hak cipta atau kecurangan di platform, silakan hubungi tim legal kami melalui surel resmi:
                        </p>
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800">
                            support@rakitcampus.my.id • legal@rakitcampus.my.id
                        </div>
                    </section>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <Link href="/privacy" className="hover:text-blue-600 transition flex items-center gap-1">
                        <span>Baca Kebijakan Privasi Data Mahasiswa</span>
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
