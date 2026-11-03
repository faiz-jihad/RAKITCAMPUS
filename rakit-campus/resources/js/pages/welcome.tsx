import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Award, 
    CheckCircle2, 
    ChevronRight, 
    FolderKanban, 
    Sparkles, 
    Trophy, 
    Users, 
    Zap,
    Rocket,
    Clock,
    ShieldCheck,
    ArrowRight
} from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
            <Head title="RAKIT Campus — Platform Kolaborasi Mahasiswa & Pembentukan Tim" />

            {/* Top Navigation */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
                            <Rocket className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-lg font-bold tracking-tight text-slate-900">RAKIT Campus</span>
                            <span className="ml-2 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">Pilot Polindra</span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                        <Link href="/projects" className="hover:text-blue-600 transition">Jelajah Proyek</Link>
                        <Link href="/competitions" className="hover:text-blue-600 transition">Kompetisi Hub</Link>
                        <Link href="/matching" className="hover:text-blue-600 transition">Smart Matching</Link>
                        <Link href="/portfolio" className="hover:text-blue-600 transition">Portofolio</Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                            >
                                Buka Dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                                >
                                    Daftar Mahasiswa
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 mb-6">
                            <Sparkles className="h-3.5 w-3.5" />
                            Platform Kolaborasi & Pembentukan Tim Mahasiswa Politeknik Negeri Indramayu
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                            Build the Right Team, <br />
                            <span className="text-blue-600">Build Something Real.</span>
                        </h1>
                        <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                            Hubungkan ide dengan rekan tim terbaik. Temukan proyek nyata, ikuti kompetisi bergengsi, 
                            dapatkan rekomendasi kolaborator dengan algoritma matching transparan, dan dokumentasikan hasil karya di portofolio terverifikasi.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <Link
                                href={auth.user ? "/projects" : "/register"}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition"
                            >
                                {auth.user ? "Jelajahi Proyek Sekarang" : "Mulai Bergabung (Gratis)"}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/projects"
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                            >
                                <FolderKanban className="h-4 w-4 text-blue-600" />
                                Katalog Proyek & Lomba
                            </Link>
                        </div>
                    </div>

                    {/* Interactive Demo Cards Showcase */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Card 1: Project Highlight */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-4">
                                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">PROYEK TERBARU</span>
                                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">2 Posisi Dibuka</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Sistem Monitoring IoT Pertanian Indramayu</h3>
                            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                                Pengembangan sensor tanah dan mobile dashboard untuk efisiensi irigasi sawah di kawasan Indramayu.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">IoT</span>
                                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">Flutter</span>
                                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">Laravel</span>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-500">Inisiator: <strong>Budi Santoso (TI)</strong></span>
                                <Link href="/projects/1" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                                    Detail <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Explainable Match Highlight */}
                        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-4">
                                <span className="rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200">SMART MATCHING</span>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">88% Match</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Kandidat: Siti Nurhaliza</h3>
                            <p className="mt-2 text-sm text-slate-600">
                                Mahasiswa D3 Teknik Informatika Polindra • Ketersediaan 15 jam/minggu.
                            </p>
                            <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                                <div className="flex justify-between">
                                    <span>Skill Match (40%)</span>
                                    <span className="font-bold text-blue-700">90%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Role Fit (25%)</span>
                                    <span className="font-bold text-blue-700">85%</span>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-blue-100 flex items-center justify-between">
                                <span className="text-xs text-slate-500">Keahlian: Flutter, UI/UX</span>
                                <Link href="/matching" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                                    Lihat Rekomendasi <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>

                        {/* Card 3: Competition Highlight */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-4">
                                <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">KOMPETISI NASIONAL</span>
                                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Terverifikasi
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">GEMASTIK XVI 2026</h3>
                            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                                Divisi Pengembangan Perangkat Lunak & Aplikasi Smart City skala nasional oleh Kemendikbudristek.
                            </p>
                            <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-red-500" />
                                <span>Deadline: <strong>20 November 2026</strong></span>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-500">Tim: 3-5 Mahasiswa</span>
                                <Link href="/competitions/1" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                                    Bentuk Tim <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features Overview */}
            <section className="bg-white py-16 border-y border-slate-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="text-3xl font-extrabold text-slate-900">Modul Unggulan RAKIT Campus</h2>
                        <p className="mt-3 text-slate-600">Alur kerja terpadu untuk mengubah ide menjadi hasil karya nyata mahasiswa.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FolderKanban className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Project Hub</h4>
                                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                    Buat dan publikasikan proyek akademik, riset, atau startup. Tetapkan peran rekrutmen dan seleksi pelamar secara transparan.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Competition Hub</h4>
                                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                    Temukan lomba & hackathon terverifikasi. Bentuk tim lintas program studi dan koordinasikan berkas persyaratan.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <Zap className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Explainable Matching</h4>
                                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                    Pencocokan calon rekan tim berbasis keahlian teknis (40%), kesesuaian peran (25%), ketersediaan waktu (20%), dan minat (15%).
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Workspace & Kanban</h4>
                                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                    Kelola progres tugas secara interaktif (To Do, In Progress, Review, Completed) dan milestone tim yang terstruktur.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                <Award className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Portofolio & Prestasi</h4>
                                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                    Dokumentasikan pencapaian proyek dan sertifikat kompetisi secara terverifikasi untuk persiapan karir industri.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Multi-Tenancy Kampus</h4>
                                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                    Siap digunakan multi-perguruan tinggi dengan isolasi data dan dashboard administrasi kampus tersendiri.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Demo Access Box */}
            <section className="py-12 bg-slate-100">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-slate-300 bg-white p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                            <h3 className="text-lg font-bold text-slate-900">Akun Uji Coba Pilot (Politeknik Negeri Indramayu)</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-6">
                            Anda dapat langsung masuk ke sistem web dengan salah satu akun demo mahasiswa berikut:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <span className="font-bold text-blue-700">Project Leader IoT:</span>
                                <p className="mt-1 text-slate-800 font-mono">budi@polindra.ac.id</p>
                                <p className="text-slate-500 font-mono">Password: password123</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <span className="font-bold text-purple-700">Mahasiswa TI (Mobile Dev):</span>
                                <p className="mt-1 text-slate-800 font-mono">siti@polindra.ac.id</p>
                                <p className="text-slate-500 font-mono">Password: password123</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <span className="font-bold text-emerald-700">Mahasiswa RPL (Backend):</span>
                                <p className="mt-1 text-slate-800 font-mono">agus@polindra.ac.id</p>
                                <p className="text-slate-500 font-mono">Password: password123</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <span className="font-bold text-amber-700">Mahasiswa SIKC (Smart City):</span>
                                <p className="mt-1 text-slate-800 font-mono">dewi@polindra.ac.id</p>
                                <p className="text-slate-500 font-mono">Password: password123</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                            >
                                Masuk ke Halaman Login Web
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
                <p>© 2026 RAKIT Campus. Pilot Implementation at Politeknik Negeri Indramayu (Polindra).</p>
                <p className="mt-1">D3 Teknik Informatika • D4 Rekayasa Perangkat Lunak • D4 Sistem Informasi Kota Cerdas</p>
            </footer>
        </div>
    );
}
