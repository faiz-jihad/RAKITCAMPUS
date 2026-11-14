import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, GraduationCap, Search, ShieldAlert, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
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

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const handleRoleChange = (membershipId: number, targetRole: 'student' | 'lecturer') => {
        if (!confirm(`Ubah peran anggota ini menjadi ${targetRole === 'lecturer' ? 'Dosen' : 'Mahasiswa'}?`)) return;
        router.patch(`/admin/memberships/${membershipId}/role`, { role: targetRole }, {
            preserveScroll: true,
        });
    };

    const handleVerify = async (membershipId: number, newStatus: 'verified' | 'rejected') => {
        if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${newStatus}?`)) return;

        setProcessingId(membershipId);
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
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                router.reload();
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
                                Manajemen Mahasiswa Kampus
                            </h1>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                                Admin
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-full w-fit">
                        Total {students.total} Mahasiswa
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau email mahasiswa..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        />
                    </form>

                    <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => handleFilterStatus('')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                status === ''
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterStatus('verified')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                status === 'verified'
                                    ? 'bg-white text-blue-600 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Terverifikasi
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterStatus('unverified')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                status === 'unverified'
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Pending
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterStatus('rejected')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                status === 'rejected'
                                    ? 'bg-white text-slate-900 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Ditolak
                        </button>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3.5">Mahasiswa</th>
                                    <th className="px-6 py-3.5">NIM & Program Studi</th>
                                    <th className="px-6 py-3.5">Status Verifikasi</th>
                                    <th className="px-6 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada data mahasiswa yang cocok dengan kriteria.
                                        </td>
                                    </tr>
                                ) : (
                                    students.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{item.user.name}</div>
                                                <div className="text-xs text-slate-500">{item.user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs font-semibold text-slate-800">
                                                    {item.student_number || 'Belum diisi'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {item.user.profile?.study_program || item.user.profile?.department || 'Umum'}
                                                    {item.user.profile?.semester ? ` • Sem ${item.user.profile.semester}` : ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.verification_status === 'verified' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                        <ShieldCheck className="size-3.5" />
                                                        Terverifikasi
                                                    </span>
                                                )}
                                                {item.verification_status === 'unverified' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                        <ShieldAlert className="size-3.5" />
                                                        Menunggu
                                                    </span>
                                                )}
                                                {item.verification_status === 'rejected' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                                                        <XCircle className="size-3.5" />
                                                        Ditolak
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRoleChange(item.id, 'lecturer')}
                                                        title="Beri Otorisasi Peran Dosen"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                                    >
                                                        <GraduationCap className="size-3.5 text-blue-600" />
                                                        Jadikan Dosen
                                                    </button>
                                                    {item.verification_status !== 'verified' && (
                                                        <button
                                                            type="button"
                                                            disabled={processingId === item.id}
                                                            onClick={() => handleVerify(item.id, 'verified')}
                                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
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
                                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
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
