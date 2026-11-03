import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Search, ShieldAlert, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import { useState } from 'react';

interface StudentItem {
    id: number;
    student_number: string;
    role: string;
    verification_status: 'verified' | 'unverified' | 'rejected';
    joined_at: string;
    campus: {
        id: number;
        name: string;
    };
    user: {
        id: number;
        name: string;
        email: string;
        profile?: {
            department?: string;
            study_program?: string;
            semester?: number;
            headline?: string;
        };
    };
}

interface Props {
    students: {
        data: StudentItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
    filters: {
        search?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Campus Admin', href: '/admin' },
    { title: 'Manajemen Mahasiswa', href: '/admin/students' },
];

export default function AdminStudents({ students, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/students', { search: search || undefined, status: status || undefined }, { preserveState: true });
    };

    const handleFilterStatus = (newStatus: string) => {
        setStatus(newStatus);
        router.get('/admin/students', { search: search || undefined, status: newStatus || undefined }, { preserveState: true });
    };

    const handleVerify = async (membershipId: number, newStatus: 'verified' | 'rejected') => {
        if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${newStatus}?`)) return;

        setProcessingId(membershipId);
        try {
            const res = await fetch(`/api/v1/admin/students/${membershipId}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                router.reload({ preserveScroll: true });
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal memproses verifikasi.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Mahasiswa — Admin RAKIT Campus" />

            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1 rounded-lg bg-purple-50 text-purple-600">
                                <UserCheck className="size-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                                Manajemen Mahasiswa Kampus
                            </h1>
                        </div>
                        <p className="text-sm text-neutral-500">
                            Verifikasi status keaktifan NIM, moderasi akses profil, dan audit mahasiswa terdaftar.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full">
                        Total {students.total} Mahasiswa
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau email mahasiswa..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                        />
                    </form>

                    <div className="flex items-center gap-2 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => handleFilterStatus('')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                status === ''
                                    ? 'bg-neutral-900 text-white shadow-xs'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterStatus('verified')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                status === 'verified'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                            Terverifikasi
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterStatus('unverified')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                status === 'unverified'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                        >
                            Pending
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterStatus('rejected')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                status === 'rejected'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                        >
                            Ditolak
                        </button>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-neutral-600">
                            <thead className="bg-neutral-50/80 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3.5">Mahasiswa</th>
                                    <th className="px-6 py-3.5">NIM & Program Studi</th>
                                    <th className="px-6 py-3.5">Status Verifikasi</th>
                                    <th className="px-6 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {students.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-400">
                                            Tidak ada data mahasiswa yang cocok dengan kriteria.
                                        </td>
                                    </tr>
                                ) : (
                                    students.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-neutral-900">{item.user.name}</div>
                                                <div className="text-xs text-neutral-500">{item.user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs font-medium text-neutral-800">
                                                    {item.student_number || 'Belum diisi'}
                                                </div>
                                                <div className="text-xs text-neutral-500">
                                                    {item.user.profile?.study_program || item.user.profile?.department || 'Umum'}
                                                    {item.user.profile?.semester ? ` • Sem ${item.user.profile.semester}` : ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.verification_status === 'verified' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <ShieldCheck className="size-3.5" />
                                                        Terverifikasi
                                                    </span>
                                                )}
                                                {item.verification_status === 'unverified' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                        <ShieldAlert className="size-3.5" />
                                                        Menunggu
                                                    </span>
                                                )}
                                                {item.verification_status === 'rejected' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                                        <XCircle className="size-3.5" />
                                                        Ditolak
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.verification_status !== 'verified' && (
                                                        <button
                                                            type="button"
                                                            disabled={processingId === item.id}
                                                            onClick={() => handleVerify(item.id, 'verified')}
                                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="size-3.5" />
                                                            Verifikasi
                                                        </button>
                                                    )}
                                                    {item.verification_status !== 'rejected' && (
                                                        <button
                                                            type="button"
                                                            disabled={processingId === item.id}
                                                            onClick={() => handleVerify(item.id, 'rejected')}
                                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <XCircle className="size-3.5" />
                                                            Tolak
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
