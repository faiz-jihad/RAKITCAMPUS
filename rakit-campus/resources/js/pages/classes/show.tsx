import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Award,
    BookOpen,
    Check,
    CheckCircle2,
    Clock,
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
    Target,
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
    availability_hours?: number;
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
        co_lecturers?: Array<{ id: number; name: string; email: string }>;
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
    fairnessMetrics?: {
        overview: {
            total_eligible_students: number;
            assigned_students_count: number;
            unassigned_students_count: number;
            total_projects: number;
            total_positions: number;
            filled_positions: number;
            open_positions: number;
        };
        fairness_indicators: {
            participation_rate: number;
            position_fill_rate: number;
            first_timers_count: number;
            first_time_participation_rate: number;
            repeated_rejection_count: number;
            average_wait_days: number;
            demand_imbalance_ratio: number;
        };
        skills_distribution: Record<string, number>;
        unassigned_students: Array<{
            id: number;
            name: string;
            email: string;
            student_number: string;
            study_program: string;
            skills: string[];
            preferred_roles: string[];
            availability_hours: number;
        }>;
    };
    latestSimulation?: {
        id: number;
        title: string;
        status: string;
        summary_metrics?: any;
        approved_at?: string;
        allocations: Array<{
            id: number;
            user: { id: number; name: string; email: string };
            project_id?: number;
            project: { id: number; title: string };
            recruitmentRole?: { id: number; name: string };
            score: number;
            explanation: string;
            status: string;
        }>;
    } | null;
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
    fairnessMetrics,
    latestSimulation = null,
}: Props) {
    const { flash } = usePage().props as any;
    const initialTabParam = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('tab')
        : null;
    const validTabs = ['students', 'projects', 'smart_group', 'guidances', 'fairness'] as const;
    const initialTab = validTabs.includes(initialTabParam as any)
        ? (initialTabParam as typeof validTabs[number])
        : 'students';

    const [tab, setTab] = useState<'students' | 'projects' | 'smart_group' | 'guidances' | 'fairness'>(initialTab);
    const [studentFilter, setStudentFilter] = useState<'all' | 'without_team' | 'with_team'>('all');
    const [searchStudent, setSearchStudent] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showGuidanceModal, setShowGuidanceModal] = useState(false);
    const [selectedProjectForGuidance, setSelectedProjectForGuidance] = useState<number | null>(null);
    const [invitingId, setInvitingId] = useState<number | null>(null);
    const [simulating, setSimulating] = useState(false);
    const [approving, setApproving] = useState(false);
    const [adjustingAlloc, setAdjustingAlloc] = useState<any | null>(null);
    const [adjustProjectId, setAdjustProjectId] = useState<number>(0);
    const [adjustReason, setAdjustReason] = useState<string>('');
    const [submittingAdjust, setSubmittingAdjust] = useState<boolean>(false);

    const handleAdjustAllocation = () => {
        if (!adjustingAlloc || !adjustProjectId || !adjustReason.trim()) {
            alert('Pilih kelompok tujuan dan isi alasan penyesuaian alokasi.');
            return;
        }

        setSubmittingAdjust(true);
        router.post(
            `/classes/${academicClass.id}/adjust-allocation/${latestSimulation?.id}/${adjustingAlloc.id}`,
            {
                project_id: adjustProjectId,
                reason: adjustReason,
            },
            {
                onSuccess: () => {
                    setAdjustingAlloc(null);
                    setAdjustReason('');
                    setAdjustProjectId(0);
                },
                onFinish: () => setSubmittingAdjust(false),
            }
        );
    };

    const handleSimulateAllocation = () => {
        setSimulating(true);
        router.post(`/classes/${academicClass.id}/simulate-allocation`, {}, {
            onFinish: () => setSimulating(false),
        });
    };

    const handleApproveAllocation = (sessionId: number) => {
        if (confirm('Setujui dan aktifkan seluruh alokasi kelompok yang diusulkan oleh sistem simulasi berimbang ini?')) {
            setApproving(true);
            router.post(`/classes/${academicClass.id}/approve-allocation/${sessionId}`, {}, {
                onFinish: () => setApproving(false),
            });
        }
    };

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

            {/* Modern Glassmorphic Canvas with Subtle Ambient Depth */}
            <div className="min-h-screen bg-[#F8FAFC] relative text-slate-900 pb-20 overflow-hidden font-sans">
                {/* Ambient natural light washes behind the frosted glass panels (No AI neon purple!) */}
                <div className="pointer-events-none absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-blue-100/60 blur-[110px]" />
                <div className="pointer-events-none absolute top-48 -right-20 h-[380px] w-[380px] rounded-full bg-slate-200/50 blur-[100px]" />
                <div className="pointer-events-none absolute top-2/3 left-8 h-[360px] w-[360px] rounded-full bg-sky-100/50 blur-[100px]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-6">

                    {flash?.success && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}
                    {flash?.info && (
                        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-800">
                            {flash.info}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
                            {flash.error}
                        </div>
                    )}

                    {/* HERO HEADER: Modern Frosted Glass Card */}
                    <div className="glass-surface rounded-3xl p-6 sm:p-7 relative overflow-hidden">
                        {/* Top specular reflection line */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

                        {/* Top Bar: Back Link + Live Status Badge */}
                        <div className="flex items-center justify-between gap-3 mb-5">
                            <Link
                                href="/classes"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 hover:text-blue-600 transition shadow-2xs backdrop-blur-sm cursor-pointer"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Kembali ke Daftar Kelas</span>
                            </Link>

                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[11px] font-bold">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Kelas Aktif</span>
                                </span>
                            </div>
                        </div>

                        {/* Main Header Information & Join Code Grid */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="max-w-3xl">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-2xs">
                                        {academicClass.code}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700">
                                        {academicClass.study_program}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-xs text-slate-500">
                                        Semester {academicClass.semester} ({academicClass.academic_year})
                                    </span>
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                    {academicClass.name}
                                </h1>

                                {academicClass.description && (
                                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                                        {academicClass.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/5 border border-slate-900/10 text-slate-700 font-medium backdrop-blur-xs">
                                        <GraduationCap className="size-3.5 text-slate-500" />
                                        <span>Dosen Utama: <strong className="text-slate-900 font-bold">{academicClass.lecturer?.name || 'Dosen Pengampu'}</strong></span>
                                    </span>
                                    {academicClass.co_lecturers && academicClass.co_lecturers.length > 0 && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-800 font-medium backdrop-blur-xs">
                                            <Users className="size-3.5 text-blue-600" />
                                            <span>Dosen Mitra ({academicClass.co_lecturers.length}): <strong className="text-blue-900 font-bold">{academicClass.co_lecturers.map(cl => cl.name).join(', ')}</strong></span>
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/5 border border-slate-900/10 text-slate-700 font-medium backdrop-blur-xs">
                                        <Users className="size-3.5 text-slate-500" />
                                        <span>Target: <strong className="text-slate-900 font-bold">{academicClass.target_team_size} Mahasiswa / Kelompok</strong></span>
                                    </span>
                                </div>
                            </div>

                            {/* Frosted Glass Join Code Widget */}
                            <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center shrink-0 min-w-[210px] bg-white/85">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                    KODE GABUNG KELAS
                                </span>
                                <div className="font-mono text-2xl font-black text-blue-600 tracking-widest my-1 select-all">
                                    {academicClass.join_code}
                                </div>
                                <button
                                    onClick={copyJoinCode}
                                    className="mt-1.5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold transition cursor-pointer"
                                >
                                    {copiedCode ? (
                                        <>
                                            <Check className="size-3.5 text-emerald-600" />
                                            <span className="text-emerald-700">Kode Disalin!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3.5" />
                                            <span>Salin Kode Kelas</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* KPI STATS GRID: 4-Column Modern Glass Cards (Zero Overlap) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Total Mahasiswa */}
                        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Mahasiswa</span>
                                <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center shrink-0">
                                    <Users className="size-4.5" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-slate-900 tracking-tight">
                                    {stats.total_students}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1 truncate">
                                    Terdaftar di kelas {academicClass.code}
                                </p>
                            </div>
                        </div>

                        {/* 2. Sudah Memiliki Tim */}
                        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Sudah Ada Tim</span>
                                <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                    <UserCheck className="size-4.5" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-emerald-700 tracking-tight">
                                    {stats.students_with_team}
                                </div>
                                <p className="text-[11px] text-emerald-600/80 mt-1 truncate">
                                    Aktif kolaborasi kelompok
                                </p>
                            </div>
                        </div>

                        {/* 3. Belum Memiliki Kelompok */}
                        <div className={`glass-card rounded-2xl p-5 flex flex-col justify-between ${
                            stats.students_without_team > 0 ? 'bg-amber-50/40 border-amber-200/80' : ''
                        }`}>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Belum Ada Tim</span>
                                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                                    <AlertCircle className="size-4.5" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-amber-800 tracking-tight">
                                    {stats.students_without_team}
                                </div>
                                <p className="text-[11px] text-amber-700/80 mt-1 truncate">
                                    {stats.students_without_team > 0 ? 'Perlu pemerataan tim' : 'Semua telah memiliki tim'}
                                </p>
                            </div>
                        </div>

                        {/* 4. Kelompok Proyek Kelas */}
                        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Kelompok Proyek</span>
                                <div className="size-9 rounded-xl bg-slate-900/5 text-slate-700 border border-slate-900/10 flex items-center justify-center shrink-0">
                                    <FolderKanban className="size-4.5" />
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-slate-900 tracking-tight">
                                    {stats.total_projects}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1 truncate">
                                    Kelompok aktif berjalan
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SEGMENTED GLASS NAVIGATION TABS & ACTION BUTTONS */}
                    <div className="glass-surface p-2 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1">
                            <button
                                onClick={() => setTab('students')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                    tab === 'students'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <Users className="size-3.5" />
                                <span>Mahasiswa ({students.length})</span>
                            </button>

                            <button
                                onClick={() => setTab('projects')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                    tab === 'projects'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <FolderKanban className="size-3.5" />
                                <span>Kelompok ({projects.length})</span>
                            </button>

                            <button
                                onClick={() => setTab('smart_group')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                    tab === 'smart_group'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <Sparkles className="size-3.5 text-amber-400" />
                                <span>{isLecturer ? 'Smart Balancing' : `Matchmaking (${peerMatches.length})`}</span>
                                {stats.students_without_team > 0 && (
                                    <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                                )}
                            </button>

                            <button
                                onClick={() => setTab('guidances')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                    tab === 'guidances'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <MessageSquare className="size-3.5" />
                                <span>Bimbingan ({guidances.length})</span>
                            </button>

                            <button
                                onClick={() => setTab('fairness')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                    tab === 'fairness'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <ShieldCheck className="size-3.5 text-blue-500" />
                                <span>Fairness & Alokasi</span>
                            </button>
                        </div>

                        {/* Right side tab action */}
                        <div className="flex items-center gap-2 px-1">
                            {tab === 'students' && isLecturer && (
                                <button
                                    onClick={() => setShowAddStudentModal(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
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
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
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
                            {students.length === 0 ? (
                                /* ELEGANT GLASS EMPTY STATE (No yawning empty boxes) */
                                <div className="glass-surface rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto flex flex-col items-center">
                                    <div className="size-14 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
                                        <Users className="size-7" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                                        Belum Ada Mahasiswa di Kelas Ini
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1.5 leading-relaxed">
                                        Bagikan Kode Gabung kepada mahasiswa kelas Anda, atau daftarkan mahasiswa secara manual untuk memulai matchmaking kelompok.
                                    </p>

                                    <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                                        <button
                                            onClick={copyJoinCode}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                        >
                                            {copiedCode ? <Check className="size-4 text-emerald-300" /> : <Copy className="size-4" />}
                                            <span>Salin Kode Kelas ({academicClass.join_code})</span>
                                        </button>

                                        {isLecturer && (
                                            <button
                                                onClick={() => setShowAddStudentModal(true)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                                            >
                                                <UserPlus className="size-4 text-slate-500" />
                                                <span>Tambah Mahasiswa Manual</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Filter and Search Bar */}
                                    <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <button
                                                onClick={() => setStudentFilter('all')}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                    studentFilter === 'all'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                }`}
                                            >
                                                Semua ({students.length})
                                            </button>
                                            <button
                                                onClick={() => setStudentFilter('with_team')}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                    studentFilter === 'with_team'
                                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                }`}
                                            >
                                                Sudah Ada Tim ({stats.students_with_team})
                                            </button>
                                            <button
                                                onClick={() => setStudentFilter('without_team')}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                    studentFilter === 'without_team'
                                                        ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                }`}
                                            >
                                                Belum Ada Kelompok ({stats.students_without_team})
                                            </button>
                                        </div>

                                        <div className="relative max-w-xs w-full">
                                            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchStudent}
                                                onChange={(e) => setSearchStudent(e.target.value)}
                                                placeholder="Cari nama, NIM, keahlian..."
                                                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Students Grid */}
                                    {filteredStudents.length === 0 ? (
                                        <div className="glass-card rounded-2xl p-8 text-center text-xs text-slate-500">
                                            Tidak ada mahasiswa yang sesuai dengan filter pencarian.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {filteredStudents.map((st) => (
                                                <div
                                                    key={st.id}
                                                    className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-11 rounded-xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center border border-blue-200/80 overflow-hidden shrink-0 shadow-2xs">
                                                                    {st.avatar ? (
                                                                        <img src={st.avatar} alt={st.name} className="size-full object-cover" />
                                                                    ) : (
                                                                        st.name.charAt(0).toUpperCase()
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                                                        {st.name}
                                                                    </h4>
                                                                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                                                        NIM: {st.student_number}
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
                                                                        <span>Ada Tim</span>
                                                                    </>
                                                                ) : (
                                                                    <span>Belum Ada Tim</span>
                                                                )}
                                                            </span>
                                                        </div>

                                                        {/* Project info if enrolled in a team */}
                                                        {st.project ? (
                                                            <div className="mt-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs">
                                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                                                    Proyek Tim Kelas:
                                                                </span>
                                                                <Link href={`/projects/${st.project.id}`} className="font-bold text-blue-600 hover:underline block truncate mt-0.5">
                                                                    {st.project.title}
                                                                </Link>
                                                                <span className="text-[11px] text-slate-500">
                                                                    Peran: {st.project.role_name}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-3 p-2 rounded-xl bg-amber-50/50 border border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-1.5">
                                                                <HelpCircle className="size-3.5 shrink-0" />
                                                                <span>Belum tergabung dalam kelompok kelas.</span>
                                                            </div>
                                                        )}

                                                        {/* Skills tags */}
                                                        {st.skills.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-3">
                                                                {st.skills.map((skill, sIdx) => (
                                                                    <span
                                                                        key={sIdx}
                                                                        className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60"
                                                                    >
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action footer */}
                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                                                        <span className="text-[11px] text-slate-400">
                                                            Masuk: {st.enrolled_at}
                                                        </span>
                                                        {isLecturer && (
                                                            <button
                                                                onClick={() => handleRemoveStudent(st.id, st.name)}
                                                                className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
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
                                </>
                            )}
                        </div>
                    )}

                    {/* TAB 2: KELOMPOK PROYEK KELAS */}
                    {tab === 'projects' && (
                        <div className="flex flex-col gap-5">
                            {projects.length === 0 ? (
                                <div className="glass-surface rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto flex flex-col items-center">
                                    <div className="size-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mb-4 shadow-2xs">
                                        <FolderKanban className="size-7" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                                        Belum Ada Kelompok Proyek di Kelas Ini
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1.5 leading-relaxed">
                                        Mahasiswa dapat membentuk kelompok mandiri atau Dosen dapat memanfaatkan fitur <strong>Smart Team Balancing</strong> untuk otomatis membagi kelompok secara proporsional.
                                    </p>
                                    {isLecturer && (
                                        <button
                                            onClick={() => setTab('smart_group')}
                                            className="mt-6 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                                        >
                                            <Sparkles className="size-4 text-amber-300" />
                                            <span>Buka Smart Team Balancing</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {projects.map((proj) => (
                                        <div
                                            key={proj.id}
                                            className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-5"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                                        {proj.category}
                                                    </span>
                                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                        Progress: {proj.progress}%
                                                    </span>
                                                </div>

                                                <Link href={`/projects/${proj.id}`} className="block group">
                                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                        {proj.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                    {proj.short_description}
                                                </p>

                                                {/* Team Members */}
                                                <div className="mt-4 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
                                                    <div className="flex items-center justify-between text-xs mb-2">
                                                        <span className="font-bold text-slate-700">
                                                            Anggota Tim ({proj.members_count} orang):
                                                        </span>
                                                        <span className="text-slate-400 text-[11px]">
                                                            Ketua: {proj.leader?.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {proj.members.map((m, mIdx) => (
                                                            <span
                                                                key={mIdx}
                                                                className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg shadow-2xs"
                                                            >
                                                                {m.name} ({m.role_name})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Lecturer Evaluation if present */}
                                                {proj.lecturer_notes && (
                                                    <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs">
                                                        <div className="flex items-center gap-1.5 font-bold text-blue-700 mb-1">
                                                            <CheckCircle2 className="size-3.5 text-blue-600" />
                                                            <span>Catatan Bimbingan Dosen:</span>
                                                        </div>
                                                        <p className="text-slate-700 text-[11px] leading-relaxed">
                                                            {proj.lecturer_notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2">
                                                <Link
                                                    href={`/projects/${proj.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
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
                                                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
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
                            {/* ATURAN KELAS & STANDAR ANTI-KETIMPANGAN (Modern Glassmorphic Chips) */}
                            <div className="glass-surface rounded-2xl p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-blue-600 shrink-0" />
                                        <span className="text-xs font-bold text-slate-900">Ketentuan Pembentukan Kelompok (Anti-Ketimpangan)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-500 font-medium">Keseimbangan Kelas:</span>
                                        <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/80">
                                            {classRules?.balance_score ?? 100}%
                                        </span>
                                    </div>
                                </div>

                                {/* 4 Clean Rule Chips */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3">
                                    <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 text-xs">
                                        <span className="font-bold text-slate-800 block">1. Kuota {academicClass.target_team_size} Orang</span>
                                        <span className="text-[11px] text-slate-500">Terkunci saat kuota tim penuh</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 text-xs">
                                        <span className="font-bold text-slate-800 block">2. Wajib Komplementer</span>
                                        <span className="text-[11px] text-slate-500">Maks. 2 spesialis sejenis</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 text-xs">
                                        <span className="font-bold text-slate-800 block">3. Anti-Teman Satu Geng</span>
                                        <span className="text-[11px] text-slate-500">Prioritas skill pelengkap tim</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 text-xs">
                                        <span className="font-bold text-slate-800 block">4. Hak Dosen</span>
                                        <span className="text-[11px] text-slate-500">Auto-balance jika tim timpang</span>
                                    </div>
                                </div>
                            </div>

                            {isLecturer ? (
                                /* DOSEN VIEW: SMART TEAM BALANCING */
                                <div className="flex flex-col gap-5">
                                    {/* Professional Balanced Control Card (Deep Slate / Navy Glass) */}
                                    <div className="rounded-2xl bg-slate-900 p-5 sm:p-6 text-white shadow-sm border border-slate-800">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold mb-1.5">
                                                    <Sparkles className="size-3 text-amber-300" />
                                                    <span>Pemerataan Tim Berkeadilan</span>
                                                </div>
                                                <h3 className="text-base sm:text-lg font-bold">
                                                    Smart Team Balancing
                                                </h3>
                                                <p className="text-xs text-slate-300 mt-0.5">
                                                    Distribusikan mahasiswa secara proporsional berdasarkan keahlian (Backend, Frontend, UI/UX).
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleAutoFormTeams(false)}
                                                    disabled={stats.students_without_team === 0}
                                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <Zap className="size-3.5 text-amber-300" />
                                                    <span>Ratakan ({stats.students_without_team} Mahasiswa)</span>
                                                </button>

                                                <button
                                                    onClick={() => handleAutoFormTeams(true)}
                                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <RefreshCw className="size-3.5 text-slate-400" />
                                                    <span>Rombak Seluruh Kelas</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unassigned Students List */}
                                    <div className="glass-card rounded-2xl p-5">
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
                                                    <div key={st.id} className="p-3 rounded-xl border border-slate-200 bg-white/70 flex items-center gap-2.5">
                                                        <div className="size-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                            {st.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h5 className="text-xs font-bold text-slate-900 truncate">{st.name}</h5>
                                                            <p className="text-[10px] text-slate-400 font-mono">{st.student_number}</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {st.skills.slice(0, 2).map((sk, idx) => (
                                                                    <span key={idx} className="text-[9px] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-medium">
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
                                    <div className="glass-surface p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Rekomendasi Rekan Sekelas</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Pilih rekan dengan keahlian yang melengkapi slot tim Anda.</p>
                                        </div>

                                        <div className="text-xs shrink-0">
                                            {myClassProject ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
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
                                        <div className="glass-card rounded-2xl p-10 text-center text-xs text-slate-500">
                                            Belum ada data rekan sekelas untuk dilakukan matchmaking. Ajak rekan sekelas bergabung dengan kode: <strong>{academicClass.join_code}</strong>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {peerMatches.map((item, idx) => {
                                                const peer = item.student;
                                                const canInvitePeer = item.can_invite ?? (!peer.has_team && (!myClassProject || myClassProject.members_count < academicClass.target_team_size));

                                                return (
                                                    <div
                                                        key={peer.id || idx}
                                                        className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4"
                                                    >
                                                        <div>
                                                            {/* Top row: Avatar + Name + Score Badge */}
                                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="size-11 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center border border-blue-200/80 shrink-0">
                                                                        {peer.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                                                            {peer.name}
                                                                        </h4>
                                                                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
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
                                                            <p className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200/70 leading-relaxed">
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
                                                                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                                                                >
                                                                    {canInvitePeer ? (
                                                                        <>
                                                                            <UserPlus className="size-3" />
                                                                            <span>{invitingId === peer.id ? 'Mengundang...' : 'Undang ke Kelompok'}</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Lock className="size-3" />
                                                                            <span>Terkunci (Aturan)</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <Link
                                                                    href={`/projects/create?academic_class_id=${academicClass.id}`}
                                                                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
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
                                <div className="glass-surface rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto flex flex-col items-center">
                                    <div className="size-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mb-4 shadow-2xs">
                                        <MessageSquare className="size-7" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                                        Belum Ada Catatan Bimbingan
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1.5 leading-relaxed">
                                        Dosen pengampu dapat memberikan arahan teknis, evaluasi milestone, atau pengumuman kelas di sini.
                                    </p>
                                    {isLecturer && (
                                        <button
                                            onClick={() => {
                                                setSelectedProjectForGuidance(null);
                                                setShowGuidanceModal(true);
                                            }}
                                            className="mt-6 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Plus className="size-4" />
                                            <span>Buat Catatan Pertama</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {guidances.map((g) => (
                                        <div
                                            key={g.id}
                                            className="glass-card rounded-2xl p-6 flex flex-col gap-2"
                                        >
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-blue-700 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 uppercase text-[10px]">
                                                        {g.type}
                                                    </span>
                                                    {g.project_title && (
                                                        <span className="font-semibold text-slate-700">
                                                            Untuk Proyek: {g.project_title}
                                                        </span>
                                                    )}
                                                </div>
                                                <span>{g.created_at}</span>
                                            </div>

                                            <h4 className="text-base font-bold text-slate-900 mt-1">
                                                {g.title}
                                            </h4>
                                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                                                {g.content}
                                            </p>
                                            <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                                                Diterbitkan oleh: <strong className="text-slate-700">{g.lecturer_name}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 5: FAIRNESS ANALYTICS & ASSISTED ALLOCATION (MODE C) */}
                    {tab === 'fairness' && (
                        <div className="flex flex-col gap-6">
                            {/* Fairness KPI Indicators (4-Column Glass Cards) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between bg-white/85">
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tingkat Partisipasi</span>
                                        <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center shrink-0">
                                            <Users className="size-4.5" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                                            {fairnessMetrics?.fairness_indicators?.participation_rate ?? 0}%
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1 truncate">
                                            {fairnessMetrics?.overview?.assigned_students_count ?? 0} dari {fairnessMetrics?.overview?.total_eligible_students ?? 0} mahasiswa bertim
                                        </p>
                                    </div>
                                </div>

                                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between bg-white/85">
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Keterisian Posisi</span>
                                        <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                            <Target className="size-4.5" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                                            {fairnessMetrics?.fairness_indicators?.position_fill_rate ?? 0}%
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1 truncate">
                                            {fairnessMetrics?.overview?.filled_positions ?? 0} / {fairnessMetrics?.overview?.total_positions ?? 0} kuota terisi
                                        </p>
                                    </div>
                                </div>

                                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between bg-white/85">
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Afirmasi Perdana</span>
                                        <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                                            <Sparkles className="size-4.5" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                                            {fairnessMetrics?.fairness_indicators?.first_time_participation_rate ?? 0}%
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1 truncate">
                                            {fairnessMetrics?.fairness_indicators?.first_timers_count ?? 0} mahasiswa proyek pertama
                                        </p>
                                    </div>
                                </div>

                                <div className="glass-card rounded-2xl p-5 flex flex-col justify-between bg-white/85">
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Rata-rata Tunggu</span>
                                        <div className="size-9 rounded-xl bg-slate-900/5 text-slate-700 border border-slate-900/10 flex items-center justify-center shrink-0">
                                            <Clock className="size-4.5" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                                            {fairnessMetrics?.fairness_indicators?.average_wait_days ?? 0} <span className="text-lg font-bold text-slate-500">Hari</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1 truncate">
                                            Masa tunggu sebelum dapat tim
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mode C: Assisted Team Allocation Simulation Panel */}
                            <div className="glass-surface rounded-3xl p-6 sm:p-7 relative overflow-hidden bg-white/90">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold mb-2">
                                            <Sparkles className="size-3" />
                                            <span>Mode C: Assisted Team Allocation</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900">
                                            Simulasi Alokasi Berimbang Dosen
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Algoritma global cerdas memasangkan mahasiswa tanpa tim ke proyek yang membutuhkan keahlian pelengkap tanpa memicu ketimpangan.
                                        </p>
                                    </div>

                                    {isLecturer && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={handleSimulateAllocation}
                                                disabled={simulating}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50 cursor-pointer"
                                            >
                                                <Sparkles className="size-3.5" />
                                                <span>{simulating ? 'Menjalankan Simulasi...' : 'Jalankan Simulasi Alokasi'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Simulation Details & Proposed Allocations Table */}
                                {latestSimulation ? (
                                    <div className="mt-5 flex flex-col gap-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                                            <div>
                                                <span className="font-bold text-slate-900 block">{latestSimulation.title}</span>
                                                <span className="text-slate-500 text-[11px]">
                                                    Status: <strong className={latestSimulation.status === 'approved' ? 'text-emerald-700' : 'text-blue-700'}>
                                                        {latestSimulation.status === 'approved' ? 'Disetujui & Aktif' : 'Draft Simulasi (Menunggu Persetujuan Dosen)'}
                                                    </strong>
                                                </span>
                                            </div>

                                            {latestSimulation.status === 'simulation' && isLecturer && (
                                                <button
                                                    onClick={() => handleApproveAllocation(latestSimulation.id)}
                                                    disabled={approving}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50 cursor-pointer"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    <span>{approving ? 'Mengaktifkan...' : 'Setujui & Aktifkan Kelompok'}</span>
                                                </button>
                                            )}

                                            {latestSimulation.status === 'approved' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                                                    <Check className="size-3.5 text-emerald-600" />
                                                    <span>Alokasi Resmi Aktif</span>
                                                </span>
                                            )}
                                        </div>

                                        {latestSimulation.allocations && latestSimulation.allocations.length > 0 ? (
                                            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                                                <table className="w-full text-left text-xs text-slate-600">
                                                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-4 py-3">Mahasiswa</th>
                                                            <th className="px-4 py-3">Kelompok Ditugaskan</th>
                                                            <th className="px-4 py-3">Peran Diusulkan</th>
                                                            <th className="px-4 py-3">Skor Kecocokan</th>
                                                            <th className="px-4 py-3">Analisis Keselarasan</th>
                                                            <th className="px-4 py-3 text-right">Status</th>
                                                            {isLecturer && (
                                                                <th className="px-4 py-3 text-center">Aksi</th>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {latestSimulation.allocations.map((alloc) => (
                                                            <tr key={alloc.id} className="hover:bg-slate-50/80 transition">
                                                                <td className="px-4 py-3 font-bold text-slate-900">
                                                                    {alloc.user?.name}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="font-semibold text-blue-700">{alloc.project?.title}</span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                                                                        {alloc.recruitmentRole?.name ?? 'Anggota Pelengkap'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                        {alloc.score}%
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 max-w-xs truncate text-[11px] text-slate-500">
                                                                    {alloc.explanation}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                                                        alloc.status === 'activated'
                                                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                                    }`}>
                                                                        {alloc.status === 'activated' ? 'Aktif' : 'Diusulkan'}
                                                                    </span>
                                                                </td>
                                                                {isLecturer && (
                                                                    <td className="px-4 py-3 text-center">
                                                                        {alloc.status !== 'activated' && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setAdjustingAlloc(alloc);
                                                                                    setAdjustProjectId(alloc.project_id || alloc.project?.id || projects[0]?.id || 0);
                                                                                    setAdjustReason('');
                                                                                }}
                                                                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold transition cursor-pointer"
                                                                            >
                                                                                Sesuaikan
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 p-4 text-center">
                                                Tidak ada penugasan baru yang diperlukan dalam simulasi ini.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-6 text-center p-8 border border-dashed border-slate-200 rounded-2xl">
                                        <Users className="size-8 text-slate-300 mx-auto mb-2" />
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-700">Belum Ada Simulasi Alokasi Berjalan</h4>
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Dosen pengampu dapat mengklik tombol di atas untuk menjalankan kalkulasi simulasi penugasan anggota berimbang.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Unassigned Students Table */}
                            {fairnessMetrics?.unassigned_students && fairnessMetrics.unassigned_students.length > 0 && (
                                <div className="glass-card rounded-2xl p-6 bg-white/85">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                                        <span>Mahasiswa Menunggu Kelompok ({fairnessMetrics.unassigned_students.length})</span>
                                        <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                            Prioritas Afirmasi
                                        </span>
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {fairnessMetrics.unassigned_students.map((st) => (
                                            <div key={st.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex flex-col justify-between gap-2">
                                                <div>
                                                    <div className="font-bold text-xs text-slate-900">{st.name}</div>
                                                    <div className="text-[11px] text-slate-400">{st.student_number} • {st.study_program}</div>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {st.skills.slice(0, 3).map((s, idx) => (
                                                            <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                                                    <span>{st.availability_hours} jam/minggu</span>
                                                    <span className="text-blue-600 font-semibold">Siap Bergabung</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: MANUAL ADD STUDENT (DOSEN) */}
            {showAddStudentModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-surface bg-white/95 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Tambah Mahasiswa ke Kelas
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Masukkan Email institusi kampus atau NIM mahasiswa.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddStudentModal(false)}
                                className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddStudent} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    NIM atau Email Mahasiswa *
                                </label>
                                <input
                                    type="text"
                                    value={addStudentData.student_identifier}
                                    onChange={(e) => setAddStudentData('student_identifier', e.target.value)}
                                    placeholder="Contoh: 2105001 atau student@polindra.ac.id"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                {addStudentErrors.student_identifier && (
                                    <p className="text-rose-600 text-xs mt-1">{addStudentErrors.student_identifier}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddStudentModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={addStudentProcessing}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
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
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-surface bg-white/95 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Terbitkan Catatan Bimbingan / Pengumuman
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Catatan ini akan langsung terlihat oleh mahasiswa dan tim proyek terkait.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowGuidanceModal(false)}
                                className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddGuidance} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Judul Bimbingan / Pengumuman *
                                </label>
                                <input
                                    type="text"
                                    value={guidanceData.title}
                                    onChange={(e) => setGuidanceData('title', e.target.value)}
                                    placeholder="Contoh: Evaluasi Milestone 1 & Review Arsitektur Basis Data"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                {guidanceErrors.title && <p className="text-rose-600 text-xs mt-1">{guidanceErrors.title}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Jenis Catatan
                                    </label>
                                    <select
                                        value={guidanceData.type}
                                        onChange={(e) => setGuidanceData('type', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                                    >
                                        <option value="guidance">Bimbingan Proyek</option>
                                        <option value="announcement">Pengumuman Kelas</option>
                                        <option value="milestone_feedback">Review Milestone</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Target Proyek Tertentu (Opsional)
                                    </label>
                                    <select
                                        value={guidanceData.project_id || ''}
                                        onChange={(e) => setGuidanceData('project_id', e.target.value ? parseInt(e.target.value, 10) : '')}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
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
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Isi Arahan & Catatan Bimbingan Dosen *
                                </label>
                                <textarea
                                    value={guidanceData.content}
                                    onChange={(e) => setGuidanceData('content', e.target.value)}
                                    rows={4}
                                    placeholder="Tuliskan arahan teknis, perbaikan diagram alur data, atau tenggat waktu revisi..."
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                {guidanceErrors.content && <p className="text-rose-600 text-xs mt-1">{guidanceErrors.content}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowGuidanceModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={guidanceProcessing}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                                >
                                    {guidanceProcessing ? 'Menerbitkan...' : 'Terbitkan Catatan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Adjust Allocation (Lecturer Manual Intervention) */}
            {adjustingAlloc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Sesuaikan Alokasi Simulasi
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pindahkan mahasiswa <strong className="text-slate-800">{adjustingAlloc.user?.name}</strong> ke kelompok lain.
                                </p>
                            </div>
                            <button
                                onClick={() => setAdjustingAlloc(null)}
                                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Pilih Proyek Tujuan *
                                </label>
                                <select
                                    value={adjustProjectId}
                                    onChange={(e) => setAdjustProjectId(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                                >
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Alasan Penyesuaian Akademik *
                                </label>
                                <textarea
                                    rows={3}
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="Contoh: Mahasiswa memiliki minat riset khusus atau kesepakatan topik bimbingan..."
                                    className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setAdjustingAlloc(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAdjustAllocation}
                                    disabled={submittingAdjust}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                                >
                                    {submittingAdjust ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
