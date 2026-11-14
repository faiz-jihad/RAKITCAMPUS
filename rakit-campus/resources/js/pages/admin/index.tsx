import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle, FolderKanban, ShieldAlert, ShieldCheck, Trophy, Users } from 'lucide-react';
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
    };
    pendingVerifications: any[];
    recentProjects: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Campus Admin', href: '/admin' },
];

export default function AdminIndex({ stats, pendingVerifications: initialPending, recentProjects }: Props) {
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

                    <div className="flex items-center gap-2.5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mahasiswa Terdaftar</span>
                            <Users className="size-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stats.total_students}</div>
                        <span className="text-[11px] text-slate-500 font-medium block mt-1">
                            {stats.verified_students} terverifikasi • {stats.unverified_students} pending
                        </span>
                    </div>

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

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Tim Kolaborasi</span>
                            <CheckCircle className="size-4 text-slate-700" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stats.total_teams}</div>
                        <span className="text-[11px] text-slate-500 block mt-1">
                            Tim proyek & tim kompetisi
                        </span>
                    </div>
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
            </div>
        </AppLayout>
    );
}
