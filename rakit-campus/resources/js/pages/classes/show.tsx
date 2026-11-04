import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Award,
    BookOpen,
    Check,
    CheckCircle2,
    Copy,
    FolderKanban,
    GraduationCap,
    HelpCircle,
    Layers,
    Lock,
    MessageSquare,
    Plus,
    RefreshCw,
    Scale,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
    Zap,
    X,
} from 'lucide-react';
import Premium3dIcon from '@/components/ui/premium-3d-icon';
import { useState } from 'react';

interface Student {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    student_number: string;
    study_program: string;
    semester: number;
    has_team: boolean;
    project?: { id: number; title: string; role_name: string } | null;
    skills: string[];
    enrolled_at: string;
}

interface ProjectItem {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    category: string;
    status: string;
    progress: number;
    leader: { id: number; name: string; email: string };
    members_count: number;
    members: { user_id: number; name: string; role_name: string }[];
    lecturer_notes?: string;
    lecturer_evaluation?: string;
}

interface Guidance {
    id: number;
    title: string;
    content: string;
    type: string;
    lecturer_name: string;
    project_title?: string;
    created_at: string;
}

interface Props {
    academicClass: {
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
        lecturer?: { id: number; name: string; email: string };
        campus?: { id: number; name: string };
    };
    students: Student[];
    peerMatches?: Array<{
        student: Student;
        match_score: number;
        match_grade: string;
        shared_skills: string[];
        complementary_skills: string[];
        explanation: string;
        can_invite?: boolean;
        invite_block_reason?: string | null;
        fills_team_need?: string | null;
    }>;
    myClassProject?: {
        id: number;
        title: string;
        is_leader: boolean;
        team_id: number;
        members_count: number;
        capacity: number;
    } | null;
    projects: ProjectItem[];
    guidances: Guidance[];
    classRules?: {
        target_team_size: number;
        max_same_role: number;
        balance_score: number;
        is_strict: boolean;
        rules: Array<{
            title: string;
            desc: string;
        }>;
    };
    stats: {
        total_students: number;
        students_with_team: number;
        students_without_team: number;
        total_projects: number;
    };
    isLecturer: boolean;
}

export default function ClassShow({
    academicClass,
    students = [],
    peerMatches = [],
    myClassProject = null,
    projects = [],
    guidances = [],
    classRules,
    stats,
    isLecturer = false,
}: Props) {
    const [tab, setTab] = useState<'students' | 'projects' | 'smart_group' | 'guidances'>('students');
    const [studentFilter, setStudentFilter] = useState<'all' | 'without_team' | 'with_team'>('all');
    const [searchStudent, setSearchStudent] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showGuidanceModal, setShowGuidanceModal] = useState(false);
    const [selectedProjectForGuidance, setSelectedProjectForGuidance] = useState<number | null>(null);
    const [invitingId, setInvitingId] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Kelas Kuliah', href: '/classes' },
        { title: academicClass.name, href: `/classes/${academicClass.id}` },
    ];

    // Form to manually add student
    const { data: addStudentData, setData: setAddStudentData, post: postAddStudent, processing: addStudentProcessing, reset: resetAddStudent, errors: addStudentErrors } = useForm({
        student_identifier: '',
    });

    // Form to add guidance/announcement
    const { data: guidanceData, setData: setGuidanceData, post: postGuidance, processing: guidanceProcessing, reset: resetGuidance, errors: guidanceErrors } = useForm({
        title: '',
        content: '',
        type: 'guidance',
        project_id: '' as any,
    });

    const copyJoinCode = () => {
        navigator.clipboard.writeText(academicClass.join_code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
    };

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        postAddStudent(`/classes/${academicClass.id}/students`, {
            onSuccess: () => {
                setShowAddStudentModal(false);
                resetAddStudent();
            },
        });
    };

    const handleRemoveStudent = (studentId: number, studentName: string) => {
        if (confirm(`Yakin ingin mengeluarkan ${studentName} dari kelas ini?`)) {
            router.delete(`/classes/${academicClass.id}/students/${studentId}`);
        }
    };

    const handleInviteStudent = (studentId: number) => {
        if (!myClassProject?.id) return;
        setInvitingId(studentId);
        router.post(
            `/classes/${academicClass.id}/invite-student`,
            {
                student_id: studentId,
                project_id: myClassProject.id,
            },
            {
                preserveScroll: true,
                onFinish: () => setInvitingId(null),
            }
        );
    };

    const handleAddGuidance = (e: React.FormEvent) => {
        e.preventDefault();
        postGuidance(`/classes/${academicClass.id}/guidance`, {
            onSuccess: () => {
                setShowGuidanceModal(false);
                resetGuidance();
            },
        });
    };

    const handleAutoFormTeams = (resetAll = false) => {
        const msg = resetAll
            ? `PENTING (Anti-Clique Re-Balance): Seluruh ${stats.total_students} mahasiswa di kelas ini akan didistribusikan ulang secara adil ke dalam kelompok proyek beranggotakan ${academicClass.target_team_size} orang berdasarkan keahlian teknis (Backend + Frontend + UI/UX) untuk mencegah ketimpangan. Lanjutkan perombakan total?`
            : `Sistem akan otomatis mengelompokkan ${stats.students_without_team} mahasiswa yang belum memiliki kelompok ke dalam tim proyek berimbang (kapasitas: ${academicClass.target_team_size} orang) berdasarkan keahlian komplementer. Lanjutkan?`;

        if (confirm(msg)) {
            router.post(`/classes/${academicClass.id}/auto-form-teams`, {
                reset_all: resetAll,
            });
        }
    };

    const filteredStudents = students.filter((s) => {
        if (studentFilter === 'without_team' && s.has_team) return false;
        if (studentFilter === 'with_team' && !s.has_team) return false;
        if (!searchStudent) return true;
        const q = searchStudent.toLowerCase();
        return (
            s.name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            s.student_number.toLowerCase().includes(q) ||
            s.skills.some((sk) => sk.toLowerCase().includes(q))
        );
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${academicClass.name} — Manajemen Kelas RAKIT Campus`} />

            <div className="min-h-screen bg-slate-50/50 pb-20 text-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-5">
                    {/* Top Bar: Back Link & Join Code */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Link
                            href="/classes"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition shadow-2xs"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Daftar Kelas</span>
                        </Link>

                        {/* Compact Join Code Pill */}
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                            <span className="text-[11px] font-medium text-slate-500">Kode Kelas:</span>
                            <span className="font-mono text-sm font-black text-blue-600 tracking-wider">
                                {academicClass.join_code}
                            </span>
                            <button
                                onClick={copyJoinCode}
                                className="ml-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                title="Salin Kode Kelas"
                            >
                                {copiedCode ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Class Summary Header (Clean, No Redundant Headings) */}
                    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                        {academicClass.code}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        {academicClass.study_program}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-xs text-slate-500">
                                        Semester {academicClass.semester} ({academicClass.academic_year})
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    {academicClass.name}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 shrink-0">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                                    <GraduationCap className="size-3.5 text-slate-400" />
                                    <span>Dosen: <strong className="text-slate-800">{academicClass.lecturer?.name || 'Dosen Pengampu'}</strong></span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                                    <Users className="size-3.5 text-slate-400" />
                                    <span>Kuota: <strong className="text-slate-800">{academicClass.target_team_size} Mhs/Tim</strong></span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards — Clean & Responsive, ZERO Overlap */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                        {/* Card 1: Total Mahasiswa */}
                        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold text-slate-500">Total Mahasiswa</span>
                                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                    <Users className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                    {stats.total_students}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    Terdaftar di kelas {academicClass.code}
                                </p>
                            </div>
                        </div>

                        {/* Card 2: Sudah Ada Tim */}
                        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold text-emerald-600">Sudah Ada Tim</span>
                                <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                                    <UserCheck className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                                    {stats.students_with_team}
                                </div>
                                <p className="text-[11px] text-emerald-600/80 mt-0.5 truncate">
                                    Aktif dalam kelompok
                                </p>
                            </div>
                        </div>

                        {/* Card 3: Belum Ada Tim */}
                        <div className={`rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between ${
                            stats.students_without_team > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200/90'
                        }`}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold text-amber-700">Belum Ada Tim</span>
                                <div className="size-8 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                                    <AlertCircle className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight">
                                    {stats.students_without_team}
                                </div>
                                <p className="text-[11px] text-amber-700/80 mt-0.5 truncate">
                                    {stats.students_without_team > 0 ? 'Perlu pemerataan' : 'Semua sudah punya tim'}
                                </p>
                            </div>
                        </div>

                        {/* Card 4: Kelompok Proyek */}
                        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold text-indigo-600">Kelompok Proyek</span>
                                <div className="size-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                    <FolderKanban className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-black text-indigo-700 tracking-tight">
                                    {stats.total_projects}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    Tim proyek aktif
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                onClick={() => setTab('students')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    tab === 'students'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                <Users className="size-3.5" />
                                <span>Mahasiswa ({students.length})</span>
                            </button>

                            <button
                                onClick={() => setTab('projects')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    tab === 'projects'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                <FolderKanban className="size-3.5" />
                                <span>Kelompok ({projects.length})</span>
                            </button>

                            <button
                                onClick={() => setTab('smart_group')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    tab === 'smart_group'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                <Sparkles className="size-3.5 text-amber-500" />
                                <span>{isLecturer ? 'Smart Balancing' : `Matchmaking (${peerMatches.length})`}</span>
                                {stats.students_without_team > 0 && (
                                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                )}
                            </button>

                            <button
                                onClick={() => setTab('guidances')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    tab === 'guidances'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                <MessageSquare className="size-3.5" />
                                <span>Bimbingan ({guidances.length})</span>
                            </button>
                        </div>

                        {/* Actions for current tab */}
                        <div className="flex items-center gap-2">
                            {tab === 'students' && isLecturer && (
                                <button
                                    onClick={() => setShowAddStudentModal(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                    <UserPlus className="size-3.5" />
                                    <span>Tambah Mahasiswa</span>
                                </button>
                            )}
                            {tab === 'guidances' && isLecturer && (
                                <button
                                    onClick={() => {
                                        setSelectedProjectForGuidance(null);
                                        setShowGuidanceModal(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Buat Catatan</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* TAB 1: MAHASISWA PER KELAS */}
                    {tab === 'students' && (
                        <div className="flex flex-col gap-5">
                            {/* Filter and Search Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setStudentFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            studentFilter === 'all'
                                                ? 'bg-[#EEEDFD] text-[#5448EE]'
                                                : 'text-neutral-500 hover:text-neutral-900'
                                        }`}
                                    >
                                        Semua ({students.length})
                                    </button>
                                    <button
                                        onClick={() => setStudentFilter('with_team')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            studentFilter === 'with_team'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'text-neutral-500 hover:text-neutral-900'
                                        }`}
                                    >
                                        Sudah Ada Tim ({stats.students_with_team})
                                    </button>
                                    <button
                                        onClick={() => setStudentFilter('without_team')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            studentFilter === 'without_team'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'text-neutral-500 hover:text-neutral-900'
                                        }`}
                                    >
                                        Belum Ada Kelompok ({stats.students_without_team})
                                    </button>
                                </div>

                                <div className="relative max-w-xs w-full">
                                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={searchStudent}
                                        onChange={(e) => setSearchStudent(e.target.value)}
                                        placeholder="Cari nama, NIM, keahlian..."
                                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
                                    />
                                </div>
                            </div>

                            {/* Students Grid */}
                            {filteredStudents.length === 0 ? (
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-10 text-center text-xs text-neutral-500">
                                    Tidak ada mahasiswa yang sesuai dengan filter pencarian.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredStudents.map((st) => (
                                        <div
                                            key={st.id}
                                            className="rounded-3xl bg-white border border-neutral-200/80 hover:border-[#5448EE]/30 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-4"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-11 rounded-full bg-[#EEEDFD] text-[#5448EE] font-bold text-sm flex items-center justify-center border border-[#5448EE]/20 overflow-hidden shrink-0">
                                                            {st.avatar ? (
                                                                <img src={st.avatar} alt={st.name} className="size-full object-cover" />
                                                            ) : (
                                                                st.name.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-[#0E121B] leading-tight">
                                                                {st.name}
                                                            </h4>
                                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                                NIM: <span className="font-mono font-semibold">{st.student_number}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                                        st.has_team
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {st.has_team ? (
                                                            <>
                                                                <CheckCircle2 className="size-3 text-emerald-600" />
                                                                <span>Sudah Ada Tim</span>
                                                            </>
                                                        ) : (
                                                            <span>Belum Ada Tim</span>
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Project info if enrolled in a team */}
                                                {st.project ? (
                                                    <div className="mt-3 p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
                                                        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                                            Proyek Tim Kelas:
                                                        </span>
                                                        <Link href={`/projects/${st.project.id}`} className="font-bold text-[#5448EE] hover:underline block truncate mt-0.5">
                                                            {st.project.title}
                                                        </Link>
                                                        <span className="text-[11px] text-neutral-500">
                                                            Peran: {st.project.role_name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 p-2 rounded-xl bg-amber-50/50 border border-amber-100 text-[11px] text-amber-800 flex items-center gap-1.5">
                                                        <HelpCircle className="size-3.5 shrink-0" />
                                                        <span>Belum tergabung dalam kelompok proyek kelas.</span>
                                                    </div>
                                                )}

                                                {/* Skills tags */}
                                                {st.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-3">
                                                        {st.skills.map((skill, sIdx) => (
                                                            <span
                                                                key={sIdx}
                                                                className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                                                <span className="text-[11px] text-neutral-400">
                                                    Masuk: {st.enrolled_at}
                                                </span>
                                                {isLecturer && (
                                                    <button
                                                        onClick={() => handleRemoveStudent(st.id, st.name)}
                                                        className="text-neutral-400 hover:text-rose-600 transition p-1"
                                                        title="Keluarkan mahasiswa dari kelas"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: KELOMPOK PROYEK KELAS */}
                    {tab === 'projects' && (
                        <div className="flex flex-col gap-5">
                            {projects.length === 0 ? (
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-12 text-center shadow-xs">
                                    <FolderKanban className="size-12 text-neutral-300 mx-auto mb-3" />
                                    <h3 className="text-sm font-bold text-neutral-800">Belum Ada Kelompok Proyek di Kelas Ini</h3>
                                    <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 leading-relaxed">
                                        Mahasiswa dapat membuat proyek dan mengaitkannya ke kelas ini, atau Dosen dapat menjalankan fitur <strong>Smart Team Balancing</strong> untuk otomatis membagi kelompok.
                                    </p>
                                    {isLecturer && (
                                        <button
                                            onClick={handleAutoFormTeams}
                                            className="mt-4 px-5 py-2.5 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-bold transition shadow-md shadow-[#5448EE]/20 flex items-center gap-2 mx-auto"
                                        >
                                            <Sparkles className="size-4" />
                                            <span>Bentuk Kelompok Otomatis Sekarang</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {projects.map((proj) => (
                                        <div
                                            key={proj.id}
                                            className="rounded-3xl bg-white border border-neutral-200/80 hover:border-[#5448EE]/40 p-6 shadow-sm hover:shadow-lg transition flex flex-col justify-between gap-5"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE]">
                                                        {proj.category}
                                                    </span>
                                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                        Progress: {proj.progress}%
                                                    </span>
                                                </div>

                                                <Link href={`/projects/${proj.id}`} className="block group">
                                                    <h3 className="text-base font-bold text-[#0E121B] group-hover:text-[#5448EE] transition">
                                                        {proj.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                                                    {proj.short_description}
                                                </p>

                                                {/* Team Members */}
                                                <div className="mt-4 p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                                                    <div className="flex items-center justify-between text-xs mb-2">
                                                        <span className="font-bold text-neutral-700">
                                                            Anggota Tim ({proj.members_count} orang):
                                                        </span>
                                                        <span className="text-neutral-400 text-[11px]">
                                                            Ketua: {proj.leader?.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {proj.members.map((m, mIdx) => (
                                                            <span
                                                                key={mIdx}
                                                                className="text-[11px] font-semibold bg-white border border-neutral-200 text-neutral-800 px-2.5 py-1 rounded-full shadow-2xs"
                                                            >
                                                                {m.name} ({m.role_name})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Lecturer Evaluation if present */}
                                                {proj.lecturer_notes && (
                                                    <div className="mt-3 p-3 rounded-2xl bg-[#FAF8FF] border border-[#5448EE]/20 text-xs">
                                                        <div className="flex items-center gap-1.5 font-bold text-[#5448EE] mb-1">
                                                            <CheckCircle2 className="size-3.5" />
                                                            <span>Catatan Bimbingan Dosen:</span>
                                                        </div>
                                                        <p className="text-neutral-700 text-[11px] leading-relaxed">
                                                            {proj.lecturer_notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 gap-2">
                                                <Link
                                                    href={`/projects/${proj.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#5448EE] hover:underline"
                                                >
                                                    <span>Lihat Workspace Proyek</span>
                                                    <ArrowRight className="size-3.5" />
                                                </Link>

                                                {isLecturer && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProjectForGuidance(proj.id);
                                                            setGuidanceData('project_id', proj.id);
                                                            setGuidanceData('title', `Review Bimbingan: ${proj.title}`);
                                                            setShowGuidanceModal(true);
                                                        }}
                                                        className="px-3.5 py-1.5 rounded-full bg-[#EEEDFD] hover:bg-[#5448EE] text-[#5448EE] hover:text-white text-xs font-bold transition"
                                                    >
                                                        + Beri Catatan Bimbingan
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: SMART TEAM BALANCING & MATCHMAKING */}
                    {tab === 'smart_group' && (
                        <div className="flex flex-col gap-5">
                            {/* ATURAN KELAS & STANDAR ANTI-KETIMPANGAN (Compact, Clean, No Bloat) */}
                            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-blue-600 shrink-0" />
                                        <span className="text-xs font-bold text-slate-900">Ketentuan Pembentukan Kelompok (Anti-Ketimpangan)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-500 font-medium">Keseimbangan Kelas:</span>
                                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
                                            {classRules?.balance_score ?? 100}%
                                        </span>
                                    </div>
                                </div>

                                {/* 4 Compact Rule Badges */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3">
                                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                                        <span className="font-bold text-slate-800 block">1. Kuota {academicClass.target_team_size} Orang</span>
                                        <span className="text-[11px] text-slate-500">Terkunci otomatis saat tim penuh</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                                        <span className="font-bold text-slate-800 block">2. Wajib Komplementer</span>
                                        <span className="text-[11px] text-slate-500">Maks. 2 spesialis sejenis</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                                        <span className="font-bold text-slate-800 block">3. Anti-Teman Satu Geng</span>
                                        <span className="text-[11px] text-slate-500">Prioritas skill pelengkap tim</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                                        <span className="font-bold text-slate-800 block">4. Hak Dosen</span>
                                        <span className="text-[11px] text-slate-500">Auto-balance jika tim timpang</span>
                                    </div>
                                </div>
                            </div>

                            {isLecturer ? (
                                /* DOSEN VIEW: SMART TEAM BALANCING */
                                <div className="flex flex-col gap-5">
                                    <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white shadow-xs">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold mb-1.5">
                                                    <Sparkles className="size-3 text-amber-300" />
                                                    <span>Pemerataan Tim Berkeadilan</span>
                                                </div>
                                                <h3 className="text-base sm:text-lg font-bold">
                                                    Smart Team Balancing
                                                </h3>
                                                <p className="text-xs text-blue-100 mt-0.5">
                                                    Distribusikan mahasiswa secara proporsional berdasarkan keahlian (Backend, Frontend, UI/UX).
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleAutoFormTeams(false)}
                                                    disabled={stats.students_without_team === 0}
                                                    className="px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <Zap className="size-3.5 text-amber-500" />
                                                    <span>Ratakan ({stats.students_without_team} Mahasiswa)</span>
                                                </button>

                                                <button
                                                    onClick={() => handleAutoFormTeams(true)}
                                                    className="px-4 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-900 text-white border border-white/20 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <RefreshCw className="size-3.5" />
                                                    <span>Rombak Seluruh Kelas</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unassigned Students List */}
                                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-bold text-slate-800">
                                                Mahasiswa Tanpa Kelompok ({stats.students_without_team})
                                            </h4>
                                            {stats.students_without_team === 0 && (
                                                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                    Semua mahasiswa telah memiliki tim
                                                </span>
                                            )}
                                        </div>

                                        {stats.students_without_team === 0 ? (
                                            <div className="p-6 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
                                                <CheckCircle2 className="size-4 text-emerald-600" />
                                                <span>Seluruh {stats.total_students} mahasiswa di kelas ini telah terdistribusi ke dalam kelompok proyek berimbang.</span>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                {students.filter((s) => !s.has_team).map((st) => (
                                                    <div key={st.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2.5">
                                                        <div className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                                                            {st.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h5 className="text-xs font-bold text-slate-900 truncate">{st.name}</h5>
                                                            <p className="text-[10px] text-slate-400 font-mono">{st.student_number}</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {st.skills.slice(0, 2).map((sk, idx) => (
                                                                    <span key={idx} className="text-[9px] bg-white px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                                                                        {sk}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* MAHASISWA VIEW: CLASSROOM PEER MATCHMAKING */
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Rekomendasi Rekan Sekelas</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Pilih rekan dengan keahlian yang melengkapi slot tim kamu.</p>
                                        </div>

                                        <div className="text-xs shrink-0">
                                            {myClassProject ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                                                    Tim: <strong className="text-blue-700 truncate max-w-[140px]">{myClassProject.title}</strong>
                                                    <span>({myClassProject.members_count}/{academicClass.target_team_size})</span>
                                                </span>
                                            ) : (
                                                <span className="text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                                                    Belum Punya Kelompok
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Peer Match Cards Grid */}
                                    {peerMatches.length === 0 ? (
                                        <div className="rounded-2xl bg-white border border-slate-200/80 p-10 text-center text-xs text-slate-500 shadow-xs">
                                            Belum ada data teman sekelas untuk dilakukan matchmaking. Ajak rekan sekelas kamu bergabung dengan kode: <strong>{academicClass.join_code}</strong>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {peerMatches.map((item, idx) => {
                                                const peer = item.student;
                                                const canInvitePeer = item.can_invite ?? (!peer.has_team && (!myClassProject || myClassProject.members_count < academicClass.target_team_size));

                                                return (
                                                    <div
                                                        key={peer.id || idx}
                                                        className="rounded-3xl bg-white border border-slate-200/90 hover:border-blue-400/60 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-4 relative overflow-hidden"
                                                    >
                                                        <div>
                                                            {/* Top row: Avatar + Name + Score Badge */}
                                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="size-11 rounded-2xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center border border-blue-200/80 shrink-0">
                                                                        {peer.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                                                            {peer.name}
                                                                        </h4>
                                                                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                                                            {peer.student_number}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right shrink-0">
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                        <Zap className="size-3 text-emerald-600" />
                                                                        <span>{item.match_score}%</span>
                                                                    </span>
                                                                    <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                                                                        {item.match_grade}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Team Status Badge */}
                                                            <div className="mb-2.5">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                                                                    peer.has_team
                                                                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                }`}>
                                                                    {peer.has_team ? 'Sudah Ada Tim' : 'Belum Ada Kelompok (Siap Gabung)'}
                                                                </span>
                                                            </div>

                                                            {/* Anti-Ketimpangan Need Banner */}
                                                            {item.fills_team_need && (
                                                                <div className="mb-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-[10px] font-bold flex items-center gap-1.5">
                                                                    <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                                                                    <span className="truncate">{item.fills_team_need}</span>
                                                                </div>
                                                            )}

                                                            {/* Block Reason Warning if Cannot Invite */}
                                                            {!canInvitePeer && item.invite_block_reason && (
                                                                <div className="mb-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-medium flex items-start gap-1.5">
                                                                    <Lock className="size-3 text-amber-600 mt-0.5 shrink-0" />
                                                                    <span>{item.invite_block_reason}</span>
                                                                </div>
                                                            )}

                                                            {/* Complementary Skills Highlight */}
                                                            {item.complementary_skills && item.complementary_skills.length > 0 && (
                                                                <div className="mb-2.5">
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                                                        Keahlian Pelengkap:
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {item.complementary_skills.map((cSkill, sIdx) => (
                                                                            <span
                                                                                key={sIdx}
                                                                                className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md"
                                                                            >
                                                                                + {cSkill}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Shared Skills */}
                                                            {item.shared_skills && item.shared_skills.length > 0 && (
                                                                <div className="mb-3">
                                                                    <span className="text-[10px] font-medium text-slate-400 block mb-1">
                                                                        Keahlian Bersama:
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {item.shared_skills.map((sSkill, sIdx) => (
                                                                            <span
                                                                                key={sIdx}
                                                                                className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                                                                            >
                                                                                {sSkill}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Explanation Box */}
                                                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                                                                {item.explanation}
                                                            </p>
                                                        </div>

                                                        {/* Card Actions */}
                                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                                            <span className="text-[11px] text-slate-400">
                                                                {peer.availability_hours ? `${peer.availability_hours} jam/minggu` : 'Waktu fleksibel'}
                                                            </span>

                                                            {myClassProject ? (
                                                                <button
                                                                    onClick={() => handleInviteStudent(peer.id)}
                                                                    disabled={invitingId === peer.id || !canInvitePeer}
                                                                    className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                                                                >
                                                                    {canInvitePeer ? (
                                                                        <>
                                                                            <UserPlus className="size-3" />
                                                                            <span>{invitingId === peer.id ? 'Mengundang...' : 'Undang ke Kelompok'}</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Lock className="size-3" />
                                                                            <span>Terkunci (Aturan Kelas)</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <Link
                                                                    href={`/projects/create?academic_class_id=${academicClass.id}`}
                                                                    className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5"
                                                                >
                                                                    <Plus className="size-3" />
                                                                    <span>Ajak Bikin Proyek</span>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: CATATAN BIMBINGAN & PENGUMUMAN */}
                    {tab === 'guidances' && (
                        <div className="flex flex-col gap-5">
                            {guidances.length === 0 ? (
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-10 text-center text-xs text-neutral-500 shadow-xs">
                                    Belum ada catatan bimbingan atau pengumuman yang diterbitkan untuk kelas ini.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {guidances.map((g) => (
                                        <div
                                            key={g.id}
                                            className="rounded-3xl bg-white border border-neutral-200/80 p-6 shadow-xs flex flex-col gap-2"
                                        >
                                            <div className="flex items-center justify-between text-xs text-neutral-500">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#5448EE] px-2.5 py-0.5 rounded-full bg-[#EEEDFD] uppercase text-[10px]">
                                                        {g.type}
                                                    </span>
                                                    {g.project_title && (
                                                        <span className="font-semibold text-neutral-700">
                                                            Untuk Proyek: {g.project_title}
                                                        </span>
                                                    )}
                                                </div>
                                                <span>{g.created_at}</span>
                                            </div>

                                            <h4 className="text-base font-bold text-[#0E121B] mt-1">
                                                {g.title}
                                            </h4>
                                            <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                                                {g.content}
                                            </p>
                                            <div className="text-[11px] text-neutral-400 mt-2 pt-2 border-t border-neutral-100">
                                                Diterbitkan oleh: <strong className="text-neutral-700">{g.lecturer_name}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: MANUAL ADD STUDENT (DOSEN) */}
            {showAddStudentModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-bold text-[#0E121B]">
                                    Tambah Mahasiswa ke Kelas
                                </h3>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    Masukkan Email institusi kampus atau NIM mahasiswa.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddStudentModal(false)}
                                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold transition"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddStudent} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-700 mb-1">
                                    NIM atau Email Mahasiswa *
                                </label>
                                <input
                                    type="text"
                                    value={addStudentData.student_identifier}
                                    onChange={(e) => setAddStudentData('student_identifier', e.target.value)}
                                    placeholder="Contoh: 2105001 atau student@polindra.ac.id"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
                                />
                                {addStudentErrors.student_identifier && (
                                    <p className="text-rose-600 text-xs mt-1">{addStudentErrors.student_identifier}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddStudentModal(false)}
                                    className="px-4 py-2 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={addStudentProcessing}
                                    className="px-5 py-2 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-bold transition disabled:opacity-50"
                                >
                                    {addStudentProcessing ? 'Menambahkan...' : 'Daftarkan Mahasiswa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD GUIDANCE / FEEDBACK (DOSEN) */}
            {showGuidanceModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-bold text-[#0E121B]">
                                    Terbitkan Catatan Bimbingan / Pengumuman
                                </h3>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    Catatan ini akan langsung terlihat oleh mahasiswa dan tim proyek terkait.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowGuidanceModal(false)}
                                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold transition"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddGuidance} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-700 mb-1">
                                    Judul Bimbingan / Pengumuman *
                                </label>
                                <input
                                    type="text"
                                    value={guidanceData.title}
                                    onChange={(e) => setGuidanceData('title', e.target.value)}
                                    placeholder="Contoh: Evaluasi Milestone 1 & Review Arsitektur Basis Data"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
                                />
                                {guidanceErrors.title && <p className="text-rose-600 text-xs mt-1">{guidanceErrors.title}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                                        Jenis Catatan
                                    </label>
                                    <select
                                        value={guidanceData.type}
                                        onChange={(e) => setGuidanceData('type', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
                                    >
                                        <option value="guidance">Bimbingan Proyek</option>
                                        <option value="announcement">Pengumuman Kelas</option>
                                        <option value="milestone_feedback">Review Milestone</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                                        Target Proyek Tertentu (Opsional)
                                    </label>
                                    <select
                                        value={guidanceData.project_id || ''}
                                        onChange={(e) => setGuidanceData('project_id', e.target.value ? parseInt(e.target.value, 10) : '')}
                                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
                                    >
                                        <option value="">Seluruh Kelas</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 mb-1">
                                    Isi Arahan & Catatan Bimbingan Dosen *
                                </label>
                                <textarea
                                    value={guidanceData.content}
                                    onChange={(e) => setGuidanceData('content', e.target.value)}
                                    rows={4}
                                    placeholder="Tuliskan arahan teknis, perbaikan diagram alur data, atau tenggat waktu revisi..."
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
                                />
                                {guidanceErrors.content && <p className="text-rose-600 text-xs mt-1">{guidanceErrors.content}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => setShowGuidanceModal(false)}
                                    className="px-4 py-2 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={guidanceProcessing}
                                    className="px-5 py-2 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-bold transition disabled:opacity-50"
                                >
                                    {guidanceProcessing ? 'Menerbitkan...' : 'Terbitkan Catatan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
