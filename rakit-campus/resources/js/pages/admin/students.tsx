import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, FolderKanban, GraduationCap, MessageSquare, Search, ShieldAlert, ShieldCheck, Trophy, Users, XCircle } from 'lucide-react';
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
        avatar?: string | null;
        google_id?: string | null;
        created_at?: string;
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
    stats?: {
        total: number;
        google_users: number;
        email_users: number;
        verified: number;
        unverified: number;
    };
    filters: {
        search?: string;
        status?: string;
        auth_provider?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ruang Kerja Admin', href: '/admin' },
    { title: 'Kelola Mahasiswa', href: '/admin/students' },
];

export default function AdminStudents({ students, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [authProvider, setAuthProvider] = useState(filters.auth_provider || '');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const applyFilters = (newParams: { search?: string; status?: string; auth_provider?: string }) => {
        router.get('/admin/students', {
            search: (newParams.search !== undefined ? newParams.search : search) || undefined,
            status: (newParams.status !== undefined ? newParams.status : status) || undefined,
            auth_provider: (newParams.auth_provider !== undefined ? newParams.auth_provider : authProvider) || undefined,
        }, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleFilterStatus = (newStatus: string) => {
        setStatus(newStatus);
        applyFilters({ status: newStatus });
    };

    const handleFilterAuthProvider = (newProvider: string) => {
        setAuthProvider(newProvider);
        applyFilters({ auth_provider: newProvider });
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
            <Head title="Manajemen Mahasiswa & Akun — Admin RAKIT Campus" />

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
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                                    Manajemen Mahasiswa & Akun
                                </h1>
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                                    Admin
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Pantau verifikasi identitas, peran akun, dan metode login mahasiswa
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/admin/teams"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <FolderKanban className="size-3.5 text-blue-600" />
                            <span>Kelola Tim</span>
                        </Link>
                        <Link
                            href="/admin/competitions"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <Trophy className="size-3.5 text-amber-500" />
                            <span>Kelola Kompetisi</span>
                        </Link>
                        <Link
                            href="/admin/feedback"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <MessageSquare className="size-3.5 text-slate-600" />
                            <span>Feedback</span>
                        </Link>
                    </div>
                </div>

                {/* Stats Summary Pills */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Mahasiswa</span>
                                <span className="text-xl font-black text-slate-900 mt-0.5 block">{stats.total}</span>
                            </div>
                            <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Users className="size-4" />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleFilterAuthProvider(authProvider === 'google' ? '' : 'google')}
                            className={`rounded-2xl p-4 border text-left transition-all cursor-pointer flex items-center justify-between ${
                                authProvider === 'google'
                                    ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                                    : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                            }`}
                        >
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Login by Google</span>
                                <span className="text-xl font-black text-slate-900 mt-0.5 block">{stats.google_users}</span>
                            </div>
                            <div className="size-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                                <svg className="size-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterAuthProvider(authProvider === 'email' ? '' : 'email')}
                            className={`rounded-2xl p-4 border text-left transition-all cursor-pointer flex items-center justify-between ${
                                authProvider === 'email'
                                    ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                                    : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                            }`}
                        >
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Email & Sandi</span>
                                <span className="text-xl font-black text-slate-900 mt-0.5 block">{stats.email_users}</span>
                            </div>
                            <div className="size-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 flex items-center justify-center">
                                <span className="text-xs font-mono font-bold">@</span>
                            </div>
                        </button>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Terverifikasi</span>
                                <span className="text-xl font-black text-slate-900 mt-0.5 block">{stats.verified}</span>
                            </div>
                            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <ShieldCheck className="size-4" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, email, atau NIM mahasiswa..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        />
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Auth Provider Filter */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => handleFilterAuthProvider('')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    authProvider === ''
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Semua Akun
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterAuthProvider('google')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    authProvider === 'google'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg className="size-3 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                <span>Login Google</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterAuthProvider('email')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    authProvider === 'email'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Email/Sandi
                            </button>
                        </div>

                        {/* Status Verification Filter */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    status === ''
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Semua Status
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('verified')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    status === 'rejected'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Ditolak
                            </button>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3.5">Mahasiswa & Akun</th>
                                    <th className="px-6 py-3.5">Metode Login</th>
                                    <th className="px-6 py-3.5">NIM & Program Studi</th>
                                    <th className="px-6 py-3.5">Status Verifikasi</th>
                                    <th className="px-6 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada data mahasiswa yang cocok dengan kriteria filter.
                                        </td>
                                    </tr>
                                ) : (
                                    students.data.map((item) => {
                                        const isGoogleUser = Boolean(item.user.google_id);

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                                                            {item.user.avatar ? (
                                                                <img src={item.user.avatar} alt={item.user.name} className="size-full object-cover" />
                                                            ) : (
                                                                item.user.name.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 leading-snug">{item.user.name}</div>
                                                            <div className="text-xs text-slate-500">{item.user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isGoogleUser ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50/80 text-blue-800 border border-blue-200/80 text-xs font-bold shadow-2xs">
                                                            <svg className="size-3.5 shrink-0" viewBox="0 0 24 24">
                                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                                            </svg>
                                                            <span>Google Login</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 text-xs font-medium">
                                                            <span className="font-mono text-[10px] text-slate-400">@</span>
                                                            <span>Email & Sandi</span>
                                                        </span>
                                                    )}
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
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <ShieldCheck className="size-3.5" />
                                                            Terverifikasi
                                                        </span>
                                                    )}
                                                    {item.verification_status === 'unverified' && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <ShieldAlert className="size-3.5" />
                                                            Menunggu
                                                        </span>
                                                    )}
                                                    {item.verification_status === 'rejected' && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
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
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {students.links && students.links.length > 3 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                Menampilkan {students.data.length} dari total {students.total} mahasiswa
                            </div>
                            <div className="flex items-center gap-1">
                                {students.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                            link.active
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
