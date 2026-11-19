import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle, FolderKanban, MessageSquare, ShieldAlert, ShieldCheck, Trophy, Users } from 'lucide-react';
import { useState } from 'react';

interface Props {
    stats: {
        total_students: number;
        verified_students: number;
        unverified_students: number;
        active_projects: number;
        completed_projects: number;
        active_competitions: number;
        total_teams: number;
        google_students?: number;
        total_feedback?: number;
        pending_feedback?: number;
    };
    pendingVerifications: any[];
    recentProjects: any[];
    recentFeedbacks?: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ruang Kerja Admin', href: '/admin' },
];

export default function AdminIndex({ stats, pendingVerifications: initialPending, recentProjects, recentFeedbacks = [] }: Props) {
    const [pending, setPending] = useState(initialPending);

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const handleVerify = async (membershipId: number, status: 'verified' | 'rejected') => {
        try {
            const res = await fetch(`/api/v1/admin/students/${membershipId}/verify`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                setPending(pending.filter((p) => p.id !== membershipId));
                alert(`Mahasiswa berhasil di-${status === 'verified' ? 'verifikasi' : 'tolak'}.`);
            }
        } catch {
            alert('Gagal memproses verifikasi.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard — RAKIT Campus" />

            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
                    <div className="flex items-center gap-3.5">
                        <div className="size-11 rounded-xl bg-white border border-slate-200 shadow-2xs p-1.5 shrink-0 flex items-center justify-center">
                            <img
                                src="/images/rakit-mark.png"
                                alt="RAKIT"
                                className="size-8 object-contain"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                                Panel Administrasi Kampus
                            </h1>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                                Admin
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            href="/admin/teams"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <FolderKanban className="size-3.5 text-blue-600" />
                            <span>Kelola Tim</span>
                        </Link>
                        <Link
                            href="/admin/feedback"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <MessageSquare className="size-3.5 text-blue-600" />
                            <span>Saran & Masukan</span>
                            {(stats.pending_feedback ?? 0) > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                                    {stats.pending_feedback}
                                </span>
                            )}
                        </Link>
                        <Link
                            href="/admin/competitions"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
                        >
                            <Trophy className="size-3.5" />
                            <span>Kelola Kompetisi</span>
                        </Link>
                        <Link
                            href="/admin/students"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <Users className="size-3.5" />
                            <span>Kelola Mahasiswa</span>
                        </Link>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Link
                        href="/admin/students"
                        className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-5 shadow-xs transition group block"
                    >
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-600 transition">Mahasiswa Terdaftar</span>
                            <Users className="size-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stats.total_students}</div>
                        <div className="flex items-center justify-between text-[11px] mt-1">
                            <span className="text-slate-500 font-medium">
                                {stats.verified_students} verified
                            </span>
                            {(stats.google_students ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60" title="Akun yang mendaftar/login via Google">
                                    <svg className="size-2.5 shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                    <span>{stats.google_students} Google</span>
                                </span>
                            )}
                        </div>
                    </Link>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Proyek Aktif</span>
                            <FolderKanban className="size-4 text-slate-700" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stats.active_projects}</div>
                        <span className="text-[11px] text-slate-500 block mt-1">
                            {stats.completed_projects} proyek selesai
                        </span>
                    </div>

                    <Link
                        href="/admin/competitions"
                        className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-5 shadow-xs transition group block"
                    >
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-600 transition">Kompetisi Terbuka</span>
                            <Trophy className="size-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stats.active_competitions}</div>
                        <span className="text-[11px] text-blue-600 font-semibold block mt-1">
                            Atur Masa Aktif & Deadline →
                        </span>
                    </Link>

                    <Link
                        href="/admin/teams"
                        className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-5 shadow-xs transition group block"
                    >
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-600 transition">Total Tim Kolaborasi</span>
                            <CheckCircle className="size-4 text-slate-700 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stats.total_teams}</div>
                        <span className="text-[11px] text-blue-600 font-semibold block mt-1">
                            Kelola & Hapus Tim →
                        </span>
                    </Link>

                    <Link
                        href="/admin/feedback"
                        className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-5 shadow-xs transition group block"
                    >
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-600 transition">
                                Saran & Masukan
                            </span>
                            <MessageSquare className="size-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stats.total_feedback ?? 0}</div>
                        <span className="text-[11px] text-blue-600 font-semibold block mt-1">
                            {(stats.pending_feedback ?? 0) > 0 ? `${stats.pending_feedback} belum ditinjau →` : 'Tinjau Masukan →'}
                        </span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Verifications */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900">
                                Verifikasi Mahasiswa Baru ({pending.length})
                            </h3>
                            <Link href="/admin/students" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                                Lihat Semua
                            </Link>
                        </div>

                        {pending.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
                                <span className="text-xs text-slate-400">
                                    Semua mahasiswa telah diverifikasi.
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {pending.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 bg-slate-50/70"
                                    >
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900">{item.user?.name}</h4>
                                            <p className="text-[11px] text-slate-500">{item.user?.email}</p>
                                            <span className="text-[10px] text-slate-400">
                                                NIM: {item.student_number || 'Belum diisi'}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleVerify(item.id, 'verified')}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer"
                                            >
                                                Verifikasi
                                            </button>
                                            <button
                                                onClick={() => handleVerify(item.id, 'rejected')}
                                                className="px-2.5 py-1 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                            >
                                                Tolak
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Moderation Projects */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900 mb-4">Aktivitas Proyek Kampus</h3>
                        <div className="flex flex-col gap-3">
                            {recentProjects.map((proj) => (
                                <div
                                    key={proj.id}
                                    className="p-3 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3"
                                >
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">{proj.title}</h4>
                                        <p className="text-[11px] text-slate-500">
                                            Leader: {proj.leader?.name} • Status: {proj.status}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/projects/${proj.id}`}
                                        className="text-xs text-blue-600 hover:underline font-semibold"
                                    >
                                        Buka
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent System Feedback Panel */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <MessageSquare className="size-4 text-blue-600" />
                                <span>Saran, Ide & Laporan Kendala Terbaru</span>
                                {(stats.pending_feedback ?? 0) > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                        {stats.pending_feedback} Menunggu
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Aspirasi dan masukan yang dikirim mahasiswa melalui formulir landing page platform.
                            </p>
                        </div>
                        <Link
                            href="/admin/feedback"
                            className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                        >
                            Buka Semua Masukan →
                        </Link>
                    </div>

                    {recentFeedbacks && recentFeedbacks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {recentFeedbacks.map((fb: any) => (
                                <div
                                    key={fb.id}
                                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition flex flex-col justify-between gap-2.5"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                {fb.category.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{fb.created_at}</span>
                                        </div>
                                        <p className="text-xs font-semibold text-slate-800 truncate mt-1">
                                            {fb.name} <span className="text-slate-400 font-normal">({fb.email})</span>
                                        </p>
                                        <p className="text-xs text-slate-600 line-clamp-2 mt-1 italic">
                                            "{fb.message}"
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                        <span className={`text-[10px] font-bold ${
                                            fb.status === 'pending'
                                                ? 'text-amber-600'
                                                : fb.status === 'resolved'
                                                ? 'text-emerald-600'
                                                : 'text-blue-600'
                                        }`}>
                                            ● {fb.status.toUpperCase()}
                                        </span>
                                        <Link
                                            href="/admin/feedback"
                                            className="text-[11px] font-bold text-blue-600 hover:underline"
                                        >
                                            Detail & Tanggapi →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            Belum ada saran atau laporan masuk saat ini.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
