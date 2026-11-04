import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Calendar,
    Check,
    Copy,
    GraduationCap,
    Key,
    Layers,
    Plus,
    Search,
    Sparkles,
    UserCheck,
    Users,
    FolderKanban,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface AcademicClass {
    id: number;
    name: string;
    code: string;
    join_code: string;
    study_program: string;
    academic_year: string;
    semester: string;
    description?: string;
    target_team_size: number;
    status: string;
    students_count: number;
    projects_count: number;
    lecturer?: { id: number; name: string; email: string };
}

interface Props {
    taughtClasses: AcademicClass[];
    enrolledClasses: AcademicClass[];
    isLecturer: boolean;
    campus: { id: number; name: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kelas Kuliah & Bimbingan', href: '/classes' },
];

export default function ClassesIndex({ taughtClasses = [], enrolledClasses = [], isLecturer = false, campus }: Props) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Form to create new class (Dosen)
    const { data: createData, setData: setCreateData, post: postCreate, processing: createProcessing, reset: resetCreate, errors: createErrors } = useForm({
        name: '',
        code: '',
        study_program: 'Teknik Informatika',
        academic_year: '2026/2027',
        semester: 'Ganjil',
        target_team_size: 4,
        description: '',
    });

    // Form to join class via code (Mahasiswa)
    const { data: joinData, setData: setJoinData, post: postJoin, processing: joinProcessing, errors: joinErrors } = useForm({
        join_code: '',
    });

    const handleCreateClass = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/classes', {
            onSuccess: () => {
                setShowCreateModal(false);
                resetCreate();
            },
        });
    };

    const handleJoinClass = (e: React.FormEvent) => {
        e.preventDefault();
        postJoin('/classes/join');
    };

    const copyJoinCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2500);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isLecturer ? 'Manajemen Kelas Dosen — RAKIT Campus' : 'Kelas Kuliah Saya — RAKIT Campus'} />

            {/* Modern Glassmorphic Canvas */}
            <div className="min-h-screen bg-[#F8FAFC] relative text-slate-900 pb-20 overflow-hidden font-sans">
                {/* Natural ambient light diffusion */}
                <div className="pointer-events-none absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-blue-100/60 blur-[110px]" />
                <div className="pointer-events-none absolute top-48 -right-20 h-[380px] w-[380px] rounded-full bg-slate-200/50 blur-[100px]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-6">
                    {/* Header Glass Surface */}
                    <div className="glass-surface rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-end justify-between gap-6 relative overflow-hidden">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide mb-3">
                                <GraduationCap className="size-3.5" />
                                <span>{isLecturer ? 'Portal Dosen Pengampu & Pembimbing' : 'Portal Mahasiswa Perkuliahan'}</span>
                                <span className="text-blue-300">•</span>
                                <span>{campus.name}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                                {isLecturer ? 'Manajemen Kelas & Bimbingan Proyek' : 'Kelas Kuliah & Kelompok Proyek'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                                {isLecturer
                                    ? 'Kelola data mahasiswa per kelas, pantau pembentukan tim proyek kelompok berimbang, dan berikan bimbingan terstruktur.'
                                    : 'Akses kelas kuliah Anda, temukan rekan dengan keahlian komplementer, dan bangun proyek semester bersama.'}
                            </p>
                        </div>

                        {/* Top Action */}
                        <div className="flex items-center gap-3 shrink-0">
                            {isLecturer && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                >
                                    <Plus className="size-4" />
                                    <span>Buat Kelas Perkuliahan Baru</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Join Class Box for Students */}
                    <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-1">
                                <Key className="size-3.5" />
                                <span>Gabung Kelas Menggunakan Kode</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900">
                                Punya Kode Gabung Kelas dari Dosen?
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Masukkan 6 digit kode unik yang diberikan dosen pengampu untuk otomatis bergabung ke dalam daftar mahasiswa kelas dan kelompok proyek.
                            </p>
                        </div>

                        <form onSubmit={handleJoinClass} className="flex items-center gap-2 w-full md:w-auto shrink-0">
                            <input
                                type="text"
                                maxLength={8}
                                placeholder="Contoh: RKC821"
                                value={joinData.join_code}
                                onChange={(e) => setJoinData('join_code', e.target.value.toUpperCase())}
                                required
                                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs sm:text-sm font-mono uppercase tracking-wider font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-36 sm:w-44 text-center"
                            />
                            <button
                                type="submit"
                                disabled={joinProcessing}
                                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {joinProcessing ? 'Mengecek...' : 'Gabung Kelas'}
                            </button>
                        </form>
                    </div>

                    {joinErrors.join_code && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                            {joinErrors.join_code}
                        </div>
                    )}

                    {/* SECTION: CLASSES TAUGHT (DOSEN) */}
                    {isLecturer && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="size-4 text-blue-600" />
                                    <h2 className="text-base font-bold text-slate-900">
                                        Kelas yang Anda Ampu ({taughtClasses.length})
                                    </h2>
                                </div>
                            </div>

                            {taughtClasses.length === 0 ? (
                                <div className="glass-surface rounded-3xl p-10 text-center max-w-lg mx-auto flex flex-col items-center">
                                    <GraduationCap className="size-12 text-slate-300 mb-3" />
                                    <h3 className="text-base font-bold text-slate-900">Belum Ada Kelas yang Dibuat</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Klik tombol "Buat Kelas Perkuliahan Baru" untuk mulai mengorganisasi mahasiswa per kelas dan membentuk kelompok proyek semester ini.
                                    </p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="mt-5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                    >
                                        + Buat Kelas Pertama
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {taughtClasses.map((cls) => (
                                        <div
                                            key={cls.id}
                                            className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-5 group"
                                        >
                                            <div>
                                                {/* Header row */}
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                                        {cls.code}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-slate-500">
                                                        {cls.semester} {cls.academic_year}
                                                    </span>
                                                </div>

                                                <Link href={`/classes/${cls.id}`} className="block group-hover:text-blue-600 transition">
                                                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                                                        {cls.name}
                                                    </h3>
                                                </Link>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                    {cls.study_program}
                                                </p>

                                                {/* Join Code Callout with Copy button */}
                                                <div className="mt-4 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2">
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                            Kode Gabung:
                                                        </span>
                                                        <span className="font-mono text-sm font-extrabold text-blue-600 tracking-wider">
                                                            {cls.join_code}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => copyJoinCode(cls.join_code)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:text-blue-600 flex items-center gap-1 font-semibold transition cursor-pointer"
                                                        title="Salin Kode Gabung"
                                                    >
                                                        {copiedCode === cls.join_code ? (
                                                            <>
                                                                <Check className="size-3 text-emerald-600" />
                                                                <span className="text-[11px] text-emerald-600">Disalin</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="size-3" />
                                                                <span className="text-[11px]">Salin</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Metrics */}
                                                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                                                    <div className="p-2 rounded-xl bg-white/70 border border-slate-200/60">
                                                        <span className="text-base font-black text-slate-900 block">
                                                            {cls.students_count}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                                            Mahasiswa
                                                        </span>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-white/70 border border-slate-200/60">
                                                        <span className="text-base font-black text-slate-900 block">
                                                            {cls.projects_count}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                                            Kelompok Proyek
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/classes/${cls.id}`}
                                                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                                            >
                                                <span>Buka Ruang Kelas & Kelompok</span>
                                                <ArrowRight className="size-3.5" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION: ENROLLED CLASSES (STUDENT) */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="size-4 text-blue-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Kelas yang Anda Ikuti ({enrolledClasses.length})
                                </h2>
                            </div>
                        </div>

                        {enrolledClasses.length === 0 ? (
                            <div className="glass-card rounded-2xl p-8 text-center text-xs text-slate-500">
                                Anda belum terdaftar di kelas perkuliahan mana pun. Masukkan kode gabung kelas dari dosen Anda di atas.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {enrolledClasses.map((cls) => (
                                    <div
                                        key={cls.id}
                                        className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-5"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                                    {cls.code}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {cls.academic_year}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-slate-900">
                                                {cls.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Dosen: <span className="font-semibold text-slate-800">{cls.lecturer?.name || 'Dosen Pengampu'}</span>
                                            </p>

                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Users className="size-3.5 text-slate-400" />
                                                    <span>{cls.students_count} Teman Sekelas</span>
                                                </span>
                                                <span>•</span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <FolderKanban className="size-3.5 text-slate-400" />
                                                    <span>{cls.projects_count} Proyek Tim</span>
                                                </span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/classes/${cls.id}`}
                                            className="w-full py-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-transparent text-xs font-bold flex items-center justify-center gap-1.5 transition"
                                        >
                                            <span>Lihat Kelas & Rekan Tim</span>
                                            <ArrowRight className="size-3.5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CREATE CLASS MODAL (DOSEN) */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-surface bg-white/95 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-white flex flex-col gap-6 animate-in fade-in zoom-in-95">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                                    Formulir Dosen Pengampu
                                </span>
                                <h2 className="text-xl font-bold text-slate-900">
                                    Buat Kelas Perkuliahan Baru
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Sistem akan otomatis menerbitkan kode unik 6 digit untuk mahasiswa bergabung.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateClass} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Nama Kelas / Mata Kuliah *
                                </label>
                                <input
                                    type="text"
                                    value={createData.name}
                                    onChange={(e) => setCreateData('name', e.target.value)}
                                    placeholder="Contoh: TI-2A Rekayasa Perangkat Lunak"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                {createErrors.name && <p className="text-rose-600 text-xs mt-1">{createErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Kode Kelas *
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.code}
                                        onChange={(e) => setCreateData('code', e.target.value.toUpperCase())}
                                        placeholder="TI2A-RPL"
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    {createErrors.code && <p className="text-rose-600 text-xs mt-1">{createErrors.code}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Program Studi
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.study_program}
                                        onChange={(e) => setCreateData('study_program', e.target.value)}
                                        placeholder="Teknik Informatika"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Tahun Akademik
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.academic_year}
                                        onChange={(e) => setCreateData('academic_year', e.target.value)}
                                        placeholder="2026/2027"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Semester
                                    </label>
                                    <select
                                        value={createData.semester}
                                        onChange={(e) => setCreateData('semester', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                                    >
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Target Anggota/Tim
                                    </label>
                                    <input
                                        type="number"
                                        min={2}
                                        max={10}
                                        value={createData.target_team_size}
                                        onChange={(e) => setCreateData('target_team_size', parseInt(e.target.value, 10))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Deskripsi & Petunjuk Tugas Akhir / Proyek Kelas
                                </label>
                                <textarea
                                    value={createData.description}
                                    onChange={(e) => setCreateData('description', e.target.value)}
                                    rows={3}
                                    placeholder="Jelaskan silabus proyek, kriteria penilaian, atau luaran yang diharapkan dari mahasiswa..."
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createProcessing}
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {createProcessing ? 'Menyimpan...' : 'Terbitkan Kelas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
