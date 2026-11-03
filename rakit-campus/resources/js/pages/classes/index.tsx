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

            <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F8F6FF] relative text-[#0E121B] pb-24">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[320px] bg-gradient-to-b from-[#5448EE]/10 to-transparent blur-3xl pointer-events-none -z-0" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-neutral-200/80">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] text-xs font-semibold tracking-wide mb-3 border border-[#5448EE]/20 shadow-xs">
                                <GraduationCap className="size-3.5" />
                                <span>{isLecturer ? 'Portal Dosen Pengampu & Pembimbing' : 'Portal Mahasiswa Perkuliahan'}</span>
                                <span className="text-neutral-300">•</span>
                                <span>{campus.name}</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0E121B]">
                                {isLecturer ? 'Manajemen Kelas & Bimbingan Proyek' : 'Kelas Kuliah & Kelompok Proyek'}
                            </h1>
                            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                                {isLecturer
                                    ? 'Kelola data mahasiswa per kelas, pantau pembentukan tim proyek kelompok, dan berikan bimbingan terstruktur agar tidak ada mahasiswa yang tertinggal.'
                                    : 'Akses kelas kuliah Anda, bentuk kelompok proyek bersama rekan sekelas, dan pantau catatan bimbingan dari dosen pengampu.'}
                            </p>
                        </div>

                        {/* Top Action */}
                        <div className="flex items-center gap-3 shrink-0">
                            {isLecturer ? (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-bold shadow-md shadow-[#5448EE]/20 hover:shadow-lg transition"
                                >
                                    <Plus className="size-4" />
                                    <span>Buat Kelas Perkuliahan Baru</span>
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Join Class Box for Students */}
                    <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 shadow-sm shadow-[#5448EE]/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5448EE] mb-1">
                                <Key className="size-3.5" />
                                <span>Gabung Kelas Menggunakan Kode</span>
                            </div>
                            <h3 className="text-base font-bold text-[#0E121B]">
                                Punya Kode Gabung Kelas dari Dosen?
                            </h3>
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
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
                                className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs sm:text-sm font-mono uppercase tracking-wider font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE] w-36 sm:w-44 text-center"
                            />
                            <button
                                type="submit"
                                disabled={joinProcessing}
                                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-[#5448EE] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
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
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="size-4 text-[#5448EE]" />
                                    <h2 className="text-lg font-bold text-[#0E121B]">
                                        Kelas yang Anda Ampu ({taughtClasses.length})
                                    </h2>
                                </div>
                            </div>

                            {taughtClasses.length === 0 ? (
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-12 text-center shadow-xs">
                                    <GraduationCap className="size-12 text-neutral-300 mx-auto mb-3" />
                                    <h3 className="text-sm font-bold text-neutral-800">Belum Ada Kelas yang Dibuat</h3>
                                    <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                                        Klik tombol "Buat Kelas Perkuliahan Baru" untuk mulai mengorganisasi mahasiswa per kelas dan membentuk kelompok proyek semester ini.
                                    </p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="mt-4 px-4 py-2 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-bold transition shadow-sm"
                                    >
                                        + Buat Kelas Pertama
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {taughtClasses.map((cls) => (
                                        <div
                                            key={cls.id}
                                            className="rounded-3xl bg-white border border-neutral-200/80 hover:border-[#5448EE]/40 p-6 shadow-sm hover:shadow-xl hover:shadow-[#5448EE]/10 transition-all flex flex-col justify-between gap-5 group"
                                        >
                                            <div>
                                                {/* Header row */}
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] border border-[#5448EE]/20">
                                                        {cls.code}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-neutral-500">
                                                        {cls.semester} {cls.academic_year}
                                                    </span>
                                                </div>

                                                <Link href={`/classes/${cls.id}`} className="block group-hover:text-[#5448EE] transition">
                                                    <h3 className="text-base font-bold text-[#0E121B] leading-snug">
                                                        {cls.name}
                                                    </h3>
                                                </Link>
                                                <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                                                    {cls.study_program}
                                                </p>

                                                {/* Join Code Callout with Copy button */}
                                                <div className="mt-4 p-3 rounded-2xl bg-[#FAF8FF] border border-[#5448EE]/15 flex items-center justify-between gap-2">
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                                            Kode Gabung Mahasiswa:
                                                        </span>
                                                        <span className="font-mono text-sm font-extrabold text-[#5448EE] tracking-wider">
                                                            {cls.join_code}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => copyJoinCode(cls.join_code)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-700 hover:text-[#5448EE] hover:border-[#5448EE]/30 flex items-center gap-1 font-semibold transition"
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
                                                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-100 text-center">
                                                    <div className="p-2 rounded-xl bg-neutral-50">
                                                        <span className="text-base font-bold text-neutral-900 block">
                                                            {cls.students_count}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                                                            Mahasiswa
                                                        </span>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-neutral-50">
                                                        <span className="text-base font-bold text-neutral-900 block">
                                                            {cls.projects_count}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                                                            Kelompok Proyek
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/classes/${cls.id}`}
                                                className="w-full py-2.5 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#5448EE]/20 transition"
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
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="size-4 text-[#5448EE]" />
                                <h2 className="text-lg font-bold text-[#0E121B]">
                                    Kelas yang Anda Ikuti ({enrolledClasses.length})
                                </h2>
                            </div>
                        </div>

                        {enrolledClasses.length === 0 ? (
                            <div className="rounded-3xl bg-white border border-neutral-200/80 p-8 text-center text-xs text-neutral-500">
                                Anda belum terdaftar di kelas perkuliahan mana pun. Masukkan kode gabung kelas dari dosen Anda di atas.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {enrolledClasses.map((cls) => (
                                    <div
                                        key={cls.id}
                                        className="rounded-3xl bg-white border border-neutral-200/80 hover:border-[#5448EE]/40 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between gap-5"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE]">
                                                    {cls.code}
                                                </span>
                                                <span className="text-[11px] text-neutral-400">
                                                    {cls.academic_year}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-[#0E121B]">
                                                {cls.name}
                                            </h3>
                                            <p className="text-xs text-neutral-500 mt-1">
                                                Dosen: <span className="font-semibold text-neutral-800">{cls.lecturer?.name || 'Dosen Pengampu'}</span>
                                            </p>

                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-100 text-xs text-neutral-600">
                                                <span>👥 {cls.students_count} Teman Sekelas</span>
                                                <span>•</span>
                                                <span>📁 {cls.projects_count} Proyek Tim</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/classes/${cls.id}`}
                                            className="w-full py-2.5 rounded-full border border-[#5448EE] text-[#5448EE] hover:bg-[#5448EE] hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
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
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 flex flex-col gap-6 animate-in fade-in zoom-in-95">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-xs font-bold text-[#5448EE] uppercase tracking-wider block mb-1">
                                    Formulir Dosen Pengampu
                                </span>
                                <h2 className="text-xl font-bold text-[#0E121B]">
                                    Buat Kelas Perkuliahan Baru
                                </h2>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Sistem akan otomatis menerbitkan kode unik 6 digit untuk mahasiswa bergabung.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="size-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateClass} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-700 mb-1">
                                    Nama Kelas / Mata Kuliah *
                                </label>
                                <input
                                    type="text"
                                    value={createData.name}
                                    onChange={(e) => setCreateData('name', e.target.value)}
                                    placeholder="Contoh: TI-2A Rekayasa Perangkat Lunak"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
                                />
                                {createErrors.name && <p className="text-rose-600 text-xs mt-1">{createErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                                        Kode Kelas *
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.code}
                                        onChange={(e) => setCreateData('code', e.target.value.toUpperCase())}
                                        placeholder="TI2A-RPL"
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
                                    />
                                    {createErrors.code && <p className="text-rose-600 text-xs mt-1">{createErrors.code}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                                        Program Studi
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.study_program}
                                        onChange={(e) => setCreateData('study_program', e.target.value)}
                                        placeholder="Teknik Informatika"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                                        Tahun Akademik
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.academic_year}
                                        onChange={(e) => setCreateData('academic_year', e.target.value)}
                                        placeholder="2026/2027"
                                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                                        Semester
                                    </label>
                                    <select
                                        value={createData.semester}
                                        onChange={(e) => setCreateData('semester', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
                                    >
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                                        Target Anggota/Tim
                                    </label>
                                    <input
                                        type="number"
                                        min={2}
                                        max={10}
                                        value={createData.target_team_size}
                                        onChange={(e) => setCreateData('target_team_size', parseInt(e.target.value, 10))}
                                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 mb-1">
                                    Deskripsi & Petunjuk Tugas Akhir / Proyek Kelas
                                </label>
                                <textarea
                                    value={createData.description}
                                    onChange={(e) => setCreateData('description', e.target.value)}
                                    rows={3}
                                    placeholder="Jelaskan silabus proyek, kriteria penilaian, atau luaran yang diharapkan dari mahasiswa..."
                                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createProcessing}
                                    className="px-6 py-2.5 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-bold shadow-md shadow-[#5448EE]/20 transition disabled:opacity-50"
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
