import { Link } from '@inertiajs/react';
import React from 'react';

export default function AppFooter() {
    return (
        <footer className="w-full bg-white border-t border-slate-200/80 text-slate-500 text-xs mt-12 sm:mt-16 pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    {/* Brand & Copyright */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-2.5">
                        <Link href="/" className="flex items-center gap-2 group">
                            <img
                                src="/images/rakit-mark.png"
                                alt="RAKIT"
                                className="h-6 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                            <div className="flex items-center">
                                <span className="font-black text-sm text-slate-900 tracking-tight">
                                    RAKIT CAMPUS
                                </span>
                            </div>
                        </Link>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400 text-xs">
                            &copy; {new Date().getFullYear()} Akselerasi Kolaborasi Mahasiswa
                        </span>
                    </div>

                    {/* Clean Nav Links */}
                    <div className="flex items-center gap-5 flex-wrap text-xs font-medium text-slate-600">
                        <Link href="/projects" className="hover:text-blue-600 transition">
                            Proyek
                        </Link>
                        <Link href="/competitions" className="hover:text-blue-600 transition">
                            Kompetisi
                        </Link>
                        <Link href="/leaderboard" className="hover:text-blue-600 transition">
                            Klasemen
                        </Link>
                        <span className="text-slate-300">·</span>
                        <Link href="/terms" className="hover:text-blue-600 transition">
                            Syarat & Ketentuan
                        </Link>
                        <Link href="/privacy" className="hover:text-blue-600 transition">
                            Kebijakan Privasi
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
