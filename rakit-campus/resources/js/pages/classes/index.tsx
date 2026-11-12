import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    Check,
    Copy,
    GraduationCap,
    Plus,
    Users,
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
    subject_code?: string;
    sks?: number;
    class_name?: string;
    team?: {
        name: string;
        members_count: number;
        target_size: number;
        project_title?: string;
        status_label?: string;
        status_color?: string;
    } | null;
}

interface Props {
    taughtClasses: AcademicClass[];
    enrolledClasses: AcademicClass[];
    isLecturer: boolean;
    campus: { id: number; name: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kelas Kuliah', href: '/classes' },
];

export default function ClassesIndex({ taughtClasses = [], enrolledClasses = [], isLecturer = false }: Props) {
    const { flash } = usePage().props as any;
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
        <AppLayout breadcrumbs={breadcrumbs} title={isLecturer ? 'Manajemen Kelas' : 'Kelas Kuliah'}>
            <Head title={isLecturer ? 'Manajemen Kelas — RakitCampus' : 'Kelas Kuliah — RakitCampus'} />

            <div className="space-y-6">
                {/* 1. Header (Title only, no above pill, no below paragraph) */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {isLecturer ? 'Manajemen Kelas' : 'Kelas Kuliah'}
                    </h1>

                    {isLecturer && (
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            <span>Buat Kelas</span>
                        </button>
                    )}
                </div>

                {flash?.success && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.info && (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-800">
                        {flash.info}
                    </div>
                )}
                {flash?.error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
                        {flash.error}
                    </div>
                )}

                {/* 2. Join Class Box for Students */}
                {!isLecturer && (
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">
                                Gabung Kelas Baru
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Masukkan 6 digit kode gabung dari dosen pengampu Anda.
                            </p>
                        </div>

                        <form onSubmit={handleJoinClass} className="flex items-center gap-2 shrink-0">
                            <input
                                type="text"
                                maxLength={12}
                                placeholder="Kode Gabung"
                                value={joinData.join_code}
                                onChange={(e) => setJoinData('join_code', e.target.value.toUpperCase())}
                                required
                                className="px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50 text-xs font-mono uppercase tracking-wider font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 w-36 text-center transition"
                            />
                            <button
                                type="submit"
                                disabled={joinProcessing}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-2xs disabled:opacity-50 cursor-pointer"
                            >
                                {joinProcessing ? 'Mengecek...' : 'Gabung'}
                            </button>
                        </form>
                    </div>
                )}

                {joinErrors.join_code && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
                        {joinErrors.join_code}
                    </div>
                )}

                {/* 3. SECTION: CLASSES TAUGHT (DOSEN) */}
                {isLecturer && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900">
                                Daftar Kelas ({taughtClasses.length})
                            </h2>
                        </div>

                        {taughtClasses.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center max-w-lg mx-auto flex flex-col items-center">
                                <GraduationCap className="size-10 text-slate-300 mb-2" />
                                <h3 className="text-sm font-bold text-slate-900">Belum Ada Kelas yang Dibuat</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Klik tombol "Buat Kelas" untuk mulai mengorganisasi mahasiswa dan kelompok proyek.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Buat Kelas Pertama</span>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                {taughtClasses.map((cls) => (
                                    <div
                                        key={cls.id}
                                        className="bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition p-5 flex flex-col justify-between gap-4 group"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                                    {cls.code}
                                                </span>
                                                <span className="text-[11px] font-semibold text-slate-400">
                                                    {cls.semester} {cls.academic_year}
                                                </span>
                                            </div>

                                            <Link href={`/classes/${cls.code || cls.id}`} className="block group-hover:text-blue-600 transition">
                                                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                                    {cls.name}
                                                </h3>
                                            </Link>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                {cls.study_program}
                                            </p>

                                            {/* Join Code Callout */}
                                            <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                        Kode Gabung:
                                                    </span>
                                                    <span className="font-mono text-xs font-extrabold text-blue-600 tracking-wider">
                                                        {cls.join_code}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyJoinCode(cls.join_code)}
                                                    className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 hover:text-blue-600 flex items-center gap-1 font-semibold transition cursor-pointer"
                                                    title="Salin Kode"
                                                >
                                                    {copiedCode === cls.join_code ? (
                                                        <>
                                                            <Check className="size-3 text-emerald-600" />
                                                            <span className="text-emerald-600">Disalin</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="size-3" />
                                                            <span>Salin</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Metrics */}
                                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                                                <div className="p-2 rounded-lg bg-slate-50/80">
                                                    <span className="text-sm font-bold text-slate-900 block">
                                                        {cls.students_count}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        Mahasiswa
                                                    </span>
                                                </div>
                                                <div className="p-2 rounded-lg bg-slate-50/80">
                                                    <span className="text-sm font-bold text-slate-900 block">
                                                        {cls.projects_count}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        Kelompok
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/classes/${cls.code || cls.id}`}
                                            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition"
                                        >
                                            <span>Buka Ruang Kelas</span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 4. SECTION: ENROLLED CLASSES (STUDENT) */}
                {!isLecturer && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900">
                                Kelas Terdaftar ({enrolledClasses.length})
                            </h2>
                        </div>

                        {enrolledClasses.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-xs text-slate-500 max-w-lg mx-auto">
                                <GraduationCap className="size-10 text-slate-300 mx-auto mb-2" />
                                <p className="font-semibold text-slate-800">Belum Terdaftar di Kelas Kuliah</p>
                                <p className="text-slate-400 mt-0.5">Masukkan kode gabung kelas dari dosen pengampu Anda di atas.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                {enrolledClasses.map((cls) => {
                                    const hasTeam = cls.team !== null && cls.team !== undefined;
                                    const membersCount = cls.team?.members_count || 0;
                                    const targetSize = cls.target_team_size || 4;
                                    const progressPercentage = Math.min(100, (membersCount / targetSize) * 100);

                                    return (
                                        <div
                                            key={cls.id}
                                            className="bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition p-5 flex flex-col justify-between gap-4 group"
                                        >
                                            <div className="space-y-3">
                                                {/* Top Meta */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                                            {cls.subject_code || cls.code}
                                                        </span>
                                                        <span className="text-[11px] font-semibold text-slate-400">
                                                            {cls.academic_year}
                                                        </span>
                                                    </div>

                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                                        cls.team?.status_color || (hasTeam ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')
                                                    }`}>
                                                        {cls.team?.status_label || (hasTeam ? 'Sudah Ada Tim' : 'Belum Ada Tim')}
                                                    </span>
                                                </div>

                                                {/* Nama Kelas & Dosen */}
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                        {cls.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        Dosen: {cls.lecturer?.name || 'Dosen Pengampu'}
                                                    </p>
                                                </div>

                                                {/* Tim Box */}
                                                {hasTeam ? (
                                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-2">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-semibold text-slate-800 truncate">
                                                                Tim: {cls.team?.name}
                                                            </span>
                                                            <span className="font-mono text-[11px] text-slate-500 shrink-0">
                                                                {membersCount}/{targetSize}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                            <div 
                                                                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                                                                style={{ width: `${progressPercentage}%` }}
                                                            />
                                                        </div>
                                                        {cls.team?.project_title && (
                                                            <p className="text-[11px] text-slate-500 truncate">
                                                                Proyek: {cls.team.project_title}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/70 text-xs space-y-1">
                                                        <span className="font-semibold text-amber-800 flex items-center gap-1">
                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                                            <span>Belum Terdaftar di Tim</span>
                                                        </span>
                                                        <p className="text-[11px] text-amber-700 leading-snug">
                                                            Bergabung dengan kelompok proyek atau inisiasi proyek baru untuk kelas ini.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Button */}
                                            <div className="pt-2">
                                                <Link
                                                    href={`/classes/${cls.code || cls.id}`}
                                                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition"
                                                >
                                                    <span>Buka Kelas</span>
                                                    <ArrowRight className="size-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CREATE CLASS MODAL (DOSEN) */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900">
                                Buat Kelas Perkuliahan Baru
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nama Kelas / Mata Kuliah <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={createData.name}
                                    onChange={(e) => setCreateData('name', e.target.value)}
                                    placeholder="Contoh: TI-2A Rekayasa Perangkat Lunak"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                />
                                {createErrors.name && <p className="text-rose-600 text-[11px] mt-1">{createErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Kode Kelas <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.code}
                                        onChange={(e) => setCreateData('code', e.target.value.toUpperCase())}
                                        placeholder="TI2A-RPL"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                    />
                                    {createErrors.code && <p className="text-rose-600 text-[11px] mt-1">{createErrors.code}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Program Studi
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.study_program}
                                        onChange={(e) => setCreateData('study_program', e.target.value)}
                                        placeholder="Teknik Informatika"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Tahun
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.academic_year}
                                        onChange={(e) => setCreateData('academic_year', e.target.value)}
                                        placeholder="2026/2027"
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Semester
                                    </label>
                                    <select
                                        value={createData.semester}
                                        onChange={(e) => setCreateData('semester', e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-[#0e172a] text-slate-800 dark:text-slate-200"
                                    >
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" title="Kapasitas ideal anggota per kelompok untuk tugas proyek di kelas ini">
                                        Ukuran Tim
                                    </label>
                                    <input
                                        type="number"
                                        min={2}
                                        max={10}
                                        value={createData.target_team_size}
                                        onChange={(e) => setCreateData('target_team_size', parseInt(e.target.value, 10) || 4)}
                                        placeholder="4"
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-[#0e172a] text-slate-800 dark:text-slate-200"
                                    />
                                    <span className="text-[10px] text-slate-400 block mt-0.5">Orang / tim</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Deskripsi / Silabus Perkuliahan (Opsional)
                                </label>
                                <textarea
                                    value={createData.description}
                                    onChange={(e) => setCreateData('description', e.target.value)}
                                    rows={3}
                                    placeholder="Jelaskan silabus mata kuliah, luaran proyek yang diharapkan, atau kontrak perkuliahan..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e172a] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createProcessing}
                                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer"
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
