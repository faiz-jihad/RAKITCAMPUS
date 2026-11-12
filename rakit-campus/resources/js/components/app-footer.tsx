import { Link } from '@inertiajs/react';
import { Award, FolderKanban, GraduationCap, Lock, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import React from 'react';

export default function AppFooter() {
    return (
        <footer className="w-full bg-white border-t border-slate-200/90 text-slate-600 text-xs mt-12">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
                    {/* Brand column (2 cols on lg) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <span className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-base shadow-sm">
                                R
                            </span>
                            <div>
                                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                                    RAKIT <span className="text-blue-600 font-bold">CAMPUS</span>
                                </span>
                                <span className="block text-[10px] text-slate-400 font-medium">
                                    Pusat Akselerasi Kolaborasi Mahasiswa Indonesia
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                            Platform kolaborasi proyek terstruktur, bursa pembentukan tim kompetisi, dan klasemen prestasi akademik mahasiswa terintegrasi kampus se-Indonesia.
                        </p>

                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                <ShieldCheck className="size-3 text-emerald-600" />
                                <span>UU PDP Kompatibel</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                                <Lock className="size-3 text-blue-600" />
                                <span>Hak Cipta 100% Milik Mahasiswa</span>
                            </span>
                        </div>
                    </div>

                    {/* Nav: Ekosistem */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Ekosistem
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/dashboard" className="hover:text-blue-600 transition flex items-center gap-1.5">
                                    <span>Dashboard Utama</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/projects" className="hover:text-blue-600 transition flex items-center gap-1.5">
                                    <FolderKanban className="size-3 text-slate-400" />
                                    <span>Project Hub</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/competitions" className="hover:text-blue-600 transition flex items-center gap-1.5">
                                    <Trophy className="size-3 text-slate-400" />
                                    <span>Competition Hub</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/competitions?tab=teams" className="hover:text-blue-600 transition flex items-center gap-1.5">
                                    <Users className="size-3 text-slate-400" />
                                    <span>Cari Rekan Tim</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/leaderboard" className="hover:text-blue-600 transition flex items-center gap-1.5">
                                    <Award className="size-3 text-slate-400" />
                                    <span>Klasemen Nasional</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Nav: Bantuan & Panduan */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Panduan & Fitur
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/projects/create" className="hover:text-blue-600 transition">
                                    Inisiasi Proyek Baru
                                </Link>
                            </li>
                            <li>
                                <Link href="/competitions" className="hover:text-blue-600 transition">
                                    Daftar & Lacak Lomba
                                </Link>
                            </li>
                            <li>
                                <Link href="/settings/profile" className="hover:text-blue-600 transition">
                                    Portofolio & Keahlian
                                </Link>
                            </li>
                            <li>
                                <Link href="/notifications" className="hover:text-blue-600 transition">
                                    Pusat Notifikasi & Undangan
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Nav: Legalitas & Kebijakan */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Kebijakan & Legalitas
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/terms"
                                    className="font-semibold text-slate-800 hover:text-blue-600 transition block"
                                >
                                    Syarat & Ketentuan Layanan
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className="font-semibold text-slate-800 hover:text-blue-600 transition block"
                                >
                                    Kebijakan Privasi Data
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms#intellectual-property"
                                    className="text-slate-500 hover:text-blue-600 transition block"
                                >
                                    Perlindungan Hak Cipta (IP)
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms#code-of-conduct"
                                    className="text-slate-500 hover:text-blue-600 transition block"
                                >
                                    Kode Etik Kolaborasi
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Sub-footer copyright & badges */}
                <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                        <span>&copy; {new Date().getFullYear()} RAKIT Campus. Seluruh hak cipta dilindungi undang-undang.</span>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <Link href="/terms" className="hover:text-slate-900 underline underline-offset-4">
                            Syarat & Ketentuan
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link href="/privacy" className="hover:text-slate-900 underline underline-offset-4">
                            Kebijakan Privasi
                        </Link>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">Versi 2.4.0 — Production</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
