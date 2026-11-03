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

    const handleVerify = async (membershipId: number, status: 'verified' | 'rejected') => {
        try {
            const res = await fetch(`/api/v1/admin/students/${membershipId}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
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
                <div className="border-b border-neutral-200 pb-5">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-1 rounded bg-blue-50 text-blue-600">
                            <ShieldCheck className="size-4" />
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                            Panel Administrasi Kampus
                        </h1>
                    </div>
                    <p className="text-sm text-neutral-500">
                        Statistik aktivitas dan moderasi civitas kampus berdasarkan data nyata database.
                    </p>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-neutral-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Mahasiswa Terdaftar</span>
                            <Users className="size-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-neutral-900">{stats.total_students}</div>
                        <span className="text-[11px] text-emerald-600 font-medium block mt-1">
                            {stats.verified_students} terverifikasi • {stats.unverified_students} pending
                        </span>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-neutral-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Proyek Aktif</span>
                            <FolderKanban className="size-4 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-bold text-neutral-900">{stats.active_projects}</div>
                        <span className="text-[11px] text-neutral-500 block mt-1">
                            {stats.completed_projects} proyek selesai
                        </span>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-neutral-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Kompetisi Terbuka</span>
                            <Trophy className="size-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-neutral-900">{stats.active_competitions}</div>
                        <span className="text-[11px] text-neutral-500 block mt-1">
                            GEMASTIK & kompetisi terverifikasi
                        </span>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-neutral-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Tim Kolaborasi</span>
                            <CheckCircle className="size-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-neutral-900">{stats.total_teams}</div>
                        <span className="text-[11px] text-neutral-500 block mt-1">
                            Tim proyek & tim kompetisi
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Verifications */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-neutral-900">
                                Verifikasi Mahasiswa Baru ({pending.length})
                            </h3>
                            <Link href="/admin/students" className="text-xs text-blue-600 hover:underline">
                                Lihat Semua
                            </Link>
                        </div>

                        {pending.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-neutral-200 rounded-lg">
                                <span className="text-xs text-neutral-400">
                                    Semua mahasiswa telah diverifikasi.
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {pending.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between gap-3 bg-neutral-50"
                                    >
                                        <div>
                                            <h4 className="text-xs font-bold text-neutral-900">{item.user?.name}</h4>
                                            <p className="text-[11px] text-neutral-500">{item.user?.email}</p>
                                            <span className="text-[10px] text-neutral-400">
                                                NIM: {item.student_number || 'Belum diisi'}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleVerify(item.id, 'verified')}
                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition"
                                            >
                                                Verifikasi
                                            </button>
                                            <button
                                                onClick={() => handleVerify(item.id, 'rejected')}
                                                className="px-2.5 py-1 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded text-[11px] font-medium transition"
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
                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                        <h3 className="text-sm font-bold text-neutral-900 mb-4">Aktivitas Proyek Kampus</h3>
                        <div className="flex flex-col gap-3">
                            {recentProjects.map((proj) => (
                                <div
                                    key={proj.id}
                                    className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between gap-3"
                                >
                                    <div>
                                        <h4 className="text-xs font-bold text-neutral-900">{proj.title}</h4>
                                        <p className="text-[11px] text-neutral-500">
                                            Leader: {proj.leader?.name} • Status: {proj.status}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/projects/${proj.id}`}
                                        className="text-xs text-blue-600 hover:underline font-medium"
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
