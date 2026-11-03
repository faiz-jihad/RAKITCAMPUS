import AppLayout from '@/layouts/app-layout';
import Premium3dIcon from '@/components/ui/premium-3d-icon';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Award,
    Bot,
    Calendar,
    CheckCircle2,
    Clock,
    Edit3,
    FileText,
    Filter,
    FolderKanban,
    GraduationCap,
    Kanban,
    LayoutGrid,
    List,
    MoreHorizontal,
    Plus,
    Save,
    Search,
    ShieldCheck,
    Sparkles,
    Trash2,
    TrendingUp,
    Users,
    Wand2,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    team: any;
    kanban: {
        todo: any[];
        in_progress: any[];
        in_review: any[];
        completed: any[];
    };
    milestones: any[];
    activities: any[];
    allMembers: any[];
    isLeader: boolean;
    isLecturer: boolean;
    isFull: boolean;
    project?: any;
}

export default function WorkspaceShow({
    team,
    kanban: initialKanban,
    milestones: initialMilestones = [],
    activities,
    allMembers = [],
    isLeader,
    isLecturer,
    isFull,
    project: initialProject,
}: Props) {
    const [kanban, setKanban] = useState(initialKanban);
    const [milestones, setMilestones] = useState(initialMilestones);
    const [project, setProject] = useState(initialProject || team.project);

    // Modals
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<any>(null);

    // Create Task form
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskPriority, setTaskPriority] = useState('medium');
    const [taskAssignee, setTaskAssignee] = useState('');
    const [taskMilestone, setTaskMilestone] = useState('');
    const [targetColumn, setTargetColumn] = useState('todo');
    const [submitting, setSubmitting] = useState(false);

    // AI Agent orchestrating state
    const [orchestrating, setOrchestrating] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);

    // Lecturer evaluation form
    const [evalGrade, setEvalGrade] = useState(project?.lecturer_evaluation || '85/100 (A)');
    const [evalNotes, setEvalNotes] = useState(project?.lecturer_notes || '');
    const [savingEval, setSavingEval] = useState(false);
    const [evalSavedMsg, setEvalSavedMsg] = useState(false);

    // Search and View
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<'board' | 'list'>('board');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Project Hub', href: '/projects' },
        { title: 'Workspace Tim', href: '/workspace' },
        { title: team.name, href: `/workspace/${team.id}` },
    ];

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    // Calculate total progress
    const allTasks = [
        ...(kanban.todo || []),
        ...(kanban.in_progress || []),
        ...(kanban.in_review || []),
        ...(kanban.completed || []),
    ];
    const totalTasksCount = allTasks.length;
    const completedTasksCount = (kanban.completed || []).length;
    const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : (project?.progress || 0);

    // AI Orchestrator Agent Trigger
    const handleTriggerAiAgent = async () => {
        setOrchestrating(true);
        setAiFeedback(null);

        try {
            const res = await fetch(`/workspace/${team.id}/orchestrate-roadmap`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });

            const json = await res.json();
            if (res.ok) {
                setAiFeedback(json.message || 'AI Agent berhasil menyusun roadmap dan mendelegasikan tugas!');
                setTimeout(() => {
                    window.location.reload();
                }, 1200);
            } else {
                alert(json.message || 'Gagal menjalankan AI Agent.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setOrchestrating(false);
        }
    };

    // Create Task
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/workspace/${team.id}/tasks`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    title: taskTitle,
                    description: taskDescription,
                    priority: taskPriority,
                    assignee_id: taskAssignee ? parseInt(taskAssignee, 10) : null,
                    milestone_id: taskMilestone ? parseInt(taskMilestone, 10) : null,
                    status: targetColumn,
                }),
            });

            const json = await res.json();
            if (res.ok) {
                setKanban((prev) => ({
                    ...prev,
                    [targetColumn]: [json.data, ...(prev as any)[targetColumn]],
                }));
                setTaskModalOpen(false);
                setTaskTitle('');
                setTaskDescription('');
            } else {
                alert(json.message || 'Gagal menambahkan tugas.');
            }
        } catch {
            alert('Terjadi kendala jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit Task
    const handleOpenEditModal = (task: any) => {
        setTaskToEdit({ ...task });
        setEditModalOpen(true);
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskToEdit) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/workspace/${team.id}/tasks/${taskToEdit.id}`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    title: taskToEdit.title,
                    description: taskToEdit.description,
                    priority: taskToEdit.priority,
                    status: taskToEdit.status,
                    assignee_id: taskToEdit.assignee_id ? parseInt(taskToEdit.assignee_id, 10) : null,
                    milestone_id: taskToEdit.milestone_id ? parseInt(taskToEdit.milestone_id, 10) : null,
                    due_on: taskToEdit.due_on || null,
                }),
            });

            const json = await res.json();
            if (res.ok) {
                const updated = json.data || taskToEdit;
                // Reconstruct Kanban lists
                setKanban((prev: any) => {
                    const nextKanban: any = { todo: [], in_progress: [], in_review: [], completed: [] };
                    ['todo', 'in_progress', 'in_review', 'completed'].forEach((col) => {
                        nextKanban[col] = (prev[col] || [])
                            .filter((t: any) => t.id !== taskToEdit.id)
                            .concat(col === updated.status ? [updated] : []);
                    });
                    return nextKanban;
                });
                setEditModalOpen(false);
                setTaskToEdit(null);
            } else {
                alert(json.message || 'Gagal memperbarui tugas.');
            }
        } catch {
            alert('Gagal menyimpan perubahan.');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Task
    const handleDeleteTask = async (taskId: number) => {
        if (!confirm('Hapus kartu tugas ini dari papan Kanban?')) return;

        try {
            const res = await fetch(`/workspace/${team.id}/tasks/${taskId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });

            if (res.ok) {
                setKanban((prev: any) => {
                    const nextKanban: any = { todo: [], in_progress: [], in_review: [], completed: [] };
                    ['todo', 'in_progress', 'in_review', 'completed'].forEach((col) => {
                        nextKanban[col] = (prev[col] || []).filter((t: any) => t.id !== taskId);
                    });
                    return nextKanban;
                });
                if (isEditModalOpen) setEditModalOpen(false);
            } else {
                alert('Gagal menghapus tugas.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        }
    };

    // Move Status
    const handleMoveStatus = async (task: any, newStatus: string) => {
        if (task.status === newStatus) return;
        const oldCol = task.status;
        const updatedTask = { ...task, status: newStatus };

        setKanban((prev: any) => ({
            ...prev,
            [oldCol]: prev[oldCol].filter((t: any) => t.id !== task.id),
            [newStatus]: [updatedTask, ...prev[newStatus]],
        }));

        try {
            const res = await fetch(`/workspace/${team.id}/tasks/${task.id}`, {
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

            if (!res.ok) {
                setKanban((prev: any) => ({
                    ...prev,
                    [newStatus]: prev[newStatus].filter((t: any) => t.id !== task.id),
                    [oldCol]: [...prev[oldCol], task],
                }));
                alert('Gagal memindahkan tugas di server.');
            }
        } catch {
            alert('Gagal memindahkan tugas.');
        }
    };

    // Lecturer Save Evaluation
    const handleSaveEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingEval(true);
        setEvalSavedMsg(false);

        try {
            const res = await fetch(`/workspace/${team.id}/evaluation`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    lecturer_evaluation: evalGrade,
                    lecturer_notes: evalNotes,
                }),
            });

            const json = await res.json();
            if (res.ok) {
                setProject((prev: any) => ({
                    ...prev,
                    lecturer_evaluation: evalGrade,
                    lecturer_notes: evalNotes,
                }));
                setEvalSavedMsg(true);
                setTimeout(() => setEvalSavedMsg(false), 3000);
            } else {
                alert(json.message || 'Gagal menyimpan evaluasi.');
            }
        } catch {
            alert('Terjadi kesalahan.');
        } finally {
            setSavingEval(false);
        }
    };

    const columns = [
        { key: 'todo', label: 'To Do', badgeColor: 'bg-purple-100 text-[#5448EE]' },
        { key: 'in_progress', label: 'In Process', badgeColor: 'bg-indigo-100 text-indigo-700' },
        { key: 'in_review', label: 'In Review', badgeColor: 'bg-amber-100 text-amber-800' },
        { key: 'completed', label: 'Completed', badgeColor: 'bg-emerald-100 text-emerald-800' },
    ];

    const priorityBadge: Record<string, { label: string; cls: string }> = {
        urgent: { label: 'Urgent', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
        high: { label: 'High Priority', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
        medium: { label: 'Standard', cls: 'bg-[#EEEDFD] text-[#5448EE] border-[#5448EE]/20' },
        low: { label: 'Low', cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
    };

    const filterTasks = (list: any[]) => {
        if (!searchQuery) return list;
        const q = searchQuery.toLowerCase();
        return list.filter(
            (t) =>
                t.title.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q) ||
                t.assignee?.name?.toLowerCase().includes(q)
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Workspace & Roadmap — ${team.name}`} />

            <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F8F6FF] relative text-[#0E121B] pb-24 selection:bg-[#5448EE] selection:text-white">
                {/* Atmosphere background radial glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[340px] bg-gradient-to-b from-[#5448EE]/10 to-transparent blur-3xl pointer-events-none -z-0" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-6">
                    {/* Top Row: Back & Team Identity */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/workspace"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-600 hover:text-[#5448EE] shadow-xs transition"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Workspace Tim</span>
                            </Link>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-neutral-400">/</span>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0E121B] tracking-tight">
                                    {team.name}
                                </h1>
                                {project && (
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="text-xs px-2.5 py-0.5 rounded-full bg-[#EEEDFD] text-[#5448EE] font-semibold hover:underline"
                                    >
                                        Proyek: {project.title}
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Top Action Pills: Capacity, Progress, & Add Task */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Capacity Pill */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white border border-neutral-200/90 text-neutral-700 shadow-2xs">
                                <Users className="size-3.5 text-neutral-400" />
                                <span>{team.members?.length || 1} / {team.capacity} Anggota</span>
                                {isFull ? (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold">
                                        Penuh
                                    </span>
                                ) : (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-extrabold">
                                        Slot Terbuka
                                    </span>
                                )}
                            </span>

                            {/* Add Task Button */}
                            <button
                                onClick={() => {
                                    setTargetColumn('todo');
                                    setTaskModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-bold shadow-md shadow-indigo-500/25 transition active:scale-95"
                            >
                                <Plus className="size-4" />
                                <span>Tambah Tugas</span>
                            </button>
                        </div>
                    </div>

                    {/* AI Feedback Banner */}
                    {aiFeedback && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                            <span>{aiFeedback}</span>
                        </div>
                    )}

                    {/* 1. DOSEN EVALUATION & FEEDBACK PANEL */}
                    {isLecturer ? (
                        /* Panel Input Khusus Dosen */
                        <div className="bg-gradient-to-r from-[#181135] via-[#231752] to-[#181135] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#5448EE]/20 blur-3xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <Premium3dIcon icon={GraduationCap} variant="purple" size="md" />
                                        <div>
                                            <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                                                Panel Evaluasi, Penilaian & Perbaikan Dosen
                                            </h2>
                                            <p className="text-xs text-neutral-300 mt-0.5">
                                                Tinjau progres Kanban tim mahasiswa, berikan grade nilai, dan tulis instruksi revisi yang harus dikerjakan.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Overall Progress Gauge */}
                                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 self-start sm:self-auto">
                                        <TrendingUp className="size-4 text-emerald-400" />
                                        <div className="text-xs">
                                            <span className="text-neutral-400 block text-[10px]">Progres Penyelesaian</span>
                                            <span className="font-bold text-white">
                                                {completedTasksCount} / {totalTasksCount} Tugas ({progressPercent}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveEvaluation} className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                    {/* Grade / Evaluation Status */}
                                    <div className="md:col-span-4 flex flex-col gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-200 mb-1.5">
                                                Nilai / Status Evaluasi Tim *
                                            </label>
                                            <input
                                                type="text"
                                                value={evalGrade}
                                                onChange={(e) => setEvalGrade(e.target.value)}
                                                placeholder="Contoh: 88/100 (A) atau Revisi Milestone 2"
                                                required
                                                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#8E84FC]"
                                            />
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-neutral-300 leading-relaxed">
                                            Penilaian dan catatan arahan ini akan otomatis tersinkronisasi ke rekap bimbingan kelas dan tampil mencolok pada mahasiswa.
                                        </div>
                                    </div>

                                    {/* Improvement Notes Textarea */}
                                    <div className="md:col-span-8 flex flex-col gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-200 mb-1.5">
                                                Catatan Arahan & Saran Perbaikan (Feedback) *
                                            </label>
                                            <textarea
                                                value={evalNotes}
                                                onChange={(e) => setEvalNotes(e.target.value)}
                                                rows={3}
                                                placeholder="Tuliskan arahan perbaikan teknis, saran arsitektur, atau tugas yang wajib direvisi oleh mahasiswa..."
                                                required
                                                className="w-full p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#8E84FC] leading-relaxed"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            {evalSavedMsg ? (
                                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                                    <CheckCircle2 className="size-4" />
                                                    Nilai & catatan perbaikan berhasil diterbitkan!
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-neutral-400">
                                                    Klik tombol di samping untuk mempublikasikan evaluasi.
                                                </span>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={savingEval}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-bold shadow-md shadow-indigo-500/30 transition active:scale-95 disabled:opacity-50"
                                            >
                                                <Save className="size-3.5" />
                                                <span>{savingEval ? 'Menyimpan...' : 'Simpan Nilai & Arahan Dosen'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        /* Tampilan untuk Mahasiswa jika sudah ada penilaian dosen */
                        (project?.lecturer_evaluation || project?.lecturer_notes) && (
                            <div className="bg-gradient-to-r from-[#FAF8FF] via-white to-[#F6F4FE] border border-purple-200/90 rounded-3xl p-6 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
                                    <div className="flex items-center gap-2.5">
                                        <Premium3dIcon icon={GraduationCap} variant="purple" size="sm" />
                                        <div>
                                            <h3 className="text-xs font-bold text-neutral-900">
                                                Evaluasi & Catatan Perbaikan Dosen Pengampu
                                            </h3>
                                            <p className="text-[11px] text-neutral-500">
                                                Dosen: {project.academicClass?.lecturer?.name || 'Dosen Pembimbing'}
                                            </p>
                                        </div>
                                    </div>

                                    {project.lecturer_evaluation && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] border border-[#5448EE]/20 font-bold text-xs">
                                            <Award className="size-3.5" />
                                            <span>Nilai / Status: {project.lecturer_evaluation}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3.5 p-4 rounded-2xl bg-white border border-purple-100 text-xs text-neutral-700 leading-relaxed whitespace-pre-line">
                                    <strong className="block text-neutral-900 mb-1">Arahan & Tindak Lanjut:</strong>
                                    {project.lecturer_notes}
                                </div>
                            </div>
                        )
                    )}

                    {/* 2. AI PROJECT ORCHESTRATOR & SPRINT ROADMAP (TRELLO-LIKE TIMELINE) */}
                    <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
                            <div className="flex items-center gap-3.5">
                                <Premium3dIcon icon={Bot} variant="cyan" size="md" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-extrabold text-[#0E121B]">
                                            AI Sprint Roadmap & Schedule
                                        </h2>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEEDFD] text-[#5448EE] border border-[#5448EE]/20">
                                            Trello-Like Timeline
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        Target sprint bertahap dan delegasi tugas otomatis sesuai kompetensi keahlian masing-masing anggota.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleTriggerAiAgent}
                                disabled={orchestrating}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#181135] to-[#2E205E] hover:from-neutral-900 hover:to-neutral-800 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-950/20 transition active:scale-95 disabled:opacity-50 shrink-0"
                            >
                                <Wand2 className="size-3.5 text-[#8E84FC]" />
                                <span>{orchestrating ? 'AI Sedang Menyusun Roadmap...' : 'Jalankan AI Agent: Susun Roadmap & Task'}</span>
                            </button>
                        </div>

                        {/* Visual Milestones / Sprint Cards (Trello Roadmap) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                            {milestones.length === 0 ? (
                                <div className="col-span-full py-8 px-4 text-center border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                                    <Calendar className="size-8 text-neutral-400 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-neutral-700">Belum ada Sprint Roadmap terdaftar</p>
                                    <p className="text-[11px] text-neutral-500 mt-0.5 max-w-sm mx-auto mb-3">
                                        Gunakan tombol AI Agent di atas untuk menyusun 4 sprint roadmap dan delegasi tugas Kanban secara otomatis.
                                    </p>
                                </div>
                            ) : (
                                milestones.map((m: any, idx: number) => (
                                    <div
                                        key={m.id || idx}
                                        className="p-4 rounded-2xl border border-purple-100/80 bg-gradient-to-b from-[#FAF8FF] to-white flex flex-col justify-between shadow-2xs hover:shadow-xs transition"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-1 mb-2">
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5448EE]/10 text-[#5448EE] font-extrabold">
                                                    Sprint {idx + 1}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600 font-semibold capitalize">
                                                    {m.status?.replace('_', ' ') || 'Planned'}
                                                </span>
                                            </div>

                                            <h4 className="text-xs font-bold text-[#0E121B] line-clamp-1 leading-snug">
                                                {m.title}
                                            </h4>

                                            {m.description && (
                                                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                                                    {m.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-purple-100/60">
                                            <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-3 text-neutral-400" />
                                                    <span>{m.due_on || 'Tenggat Waktu'}</span>
                                                </span>
                                                <span className="font-bold text-neutral-800">
                                                    {m.completed_tasks_count || 0}/{m.tasks_count || 0} Selesai
                                                </span>
                                            </div>
                                            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-[#5448EE] h-1.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${m.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 3. TASK BOARDS CONTROL BAR */}
                    <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: View Tabs */}
                        <div className="flex items-center gap-1.5 bg-neutral-100/70 p-1 rounded-full text-xs self-start">
                            <button
                                onClick={() => setActiveView('board')}
                                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold transition ${
                                    activeView === 'board'
                                        ? 'bg-white shadow-xs text-[#5448EE]'
                                        : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                            >
                                <LayoutGrid className="size-3.5" />
                                <span>Board View</span>
                            </button>
                            <button
                                onClick={() => setActiveView('list')}
                                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold transition ${
                                    activeView === 'list'
                                        ? 'bg-white shadow-xs text-[#5448EE]'
                                        : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                            >
                                <List className="size-3.5" />
                                <span>List View</span>
                            </button>
                        </div>

                        {/* Right: Search Filter */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari tugas di papan..."
                                    className="w-full pl-9 pr-3.5 py-1.5 rounded-full border border-neutral-200/80 text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. KANBAN BOARD 4 COLUMNS */}
                    {activeView === 'board' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
                            {columns.map((col) => {
                                const tasks = filterTasks((kanban as any)[col.key] || []);

                                return (
                                    <div
                                        key={col.key}
                                        className="bg-[#F8F6FE]/70 border border-purple-100/80 rounded-3xl p-4 flex flex-col min-h-[520px] transition"
                                    >
                                        {/* Column Header */}
                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-100/80">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xs font-bold text-neutral-900 tracking-tight">
                                                    {col.label}
                                                </h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                                                    {tasks.length}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setTargetColumn(col.key);
                                                    setTaskModalOpen(true);
                                                }}
                                                className="p-1 rounded-full text-neutral-400 hover:text-[#5448EE] hover:bg-white transition"
                                                title={`Tambah tugas ke ${col.label}`}
                                            >
                                                <Plus className="size-4" />
                                            </button>
                                        </div>

                                        {/* Cards Container */}
                                        <div className="flex flex-col gap-3 flex-1">
                                            {tasks.map((task: any) => {
                                                const priority = priorityBadge[task.priority] || priorityBadge.medium;

                                                return (
                                                    <div
                                                        key={task.id}
                                                        className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-purple-200 transition group relative flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            {/* Priority Chip & Actions */}
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <span
                                                                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priority.cls}`}
                                                                >
                                                                    {priority.label}
                                                                </span>

                                                                <div className="flex items-center gap-1">
                                                                    {/* Edit button */}
                                                                    <button
                                                                        onClick={() => handleOpenEditModal(task)}
                                                                        className="p-1 rounded text-neutral-400 hover:text-[#5448EE] hover:bg-neutral-50 transition"
                                                                        title="Edit Tugas"
                                                                    >
                                                                        <Edit3 className="size-3" />
                                                                    </button>

                                                                    {/* Quick shift status select */}
                                                                    <select
                                                                        value={task.status}
                                                                        onChange={(e) => handleMoveStatus(task, e.target.value)}
                                                                        className="text-[10px] font-semibold bg-neutral-50 border border-neutral-200/80 rounded-full px-2 py-0.5 text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#5448EE] cursor-pointer"
                                                                    >
                                                                        <option value="todo">To Do</option>
                                                                        <option value="in_progress">In Process</option>
                                                                        <option value="in_review">In Review</option>
                                                                        <option value="completed">Completed</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            {/* Task Title */}
                                                            <h4 className="text-xs font-bold text-neutral-900 leading-snug">
                                                                {task.title}
                                                            </h4>

                                                            {/* Task Description */}
                                                            {task.description && (
                                                                <p className="text-[11px] text-neutral-500 mt-1.5 line-clamp-2 leading-relaxed">
                                                                    {task.description}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Card Footer: Assignee & Milestone Sprint */}
                                                        <div className="mt-3.5 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                                                            <div className="flex items-center gap-1.5 text-neutral-600">
                                                                <div className="size-5 rounded-full bg-[#181135] text-white text-[9px] font-bold flex items-center justify-center">
                                                                    {task.assignee?.name
                                                                        ? task.assignee.name.substring(0, 1).toUpperCase()
                                                                        : '?'}
                                                                </div>
                                                                <span className="truncate max-w-[100px] text-[10px] font-medium">
                                                                    {task.assignee?.name || 'Unassigned'}
                                                                </span>
                                                            </div>

                                                            {task.milestone && (
                                                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#5448EE]/10 text-[#5448EE] font-semibold truncate max-w-[110px]">
                                                                    {task.milestone.title?.split(':')[0] || task.milestone.title}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {tasks.length === 0 && (
                                                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-purple-200/60 rounded-2xl">
                                                    <span className="text-xs text-neutral-400 font-medium">
                                                        Belum ada tugas di kolom ini
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setTargetColumn(col.key);
                                                            setTaskModalOpen(true);
                                                        }}
                                                        className="mt-2 text-[11px] text-[#5448EE] font-semibold hover:underline"
                                                    >
                                                        + Buat tugas
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* List View */
                        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm">
                            <div className="flex flex-col gap-3">
                                {columns.map((col) => {
                                    const tasks = filterTasks((kanban as any)[col.key] || []);
                                    return (
                                        <div key={col.key} className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 py-2 border-b border-neutral-100">
                                                <span className="text-xs font-bold text-neutral-900">{col.label}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${col.badgeColor}`}>
                                                    {tasks.length}
                                                </span>
                                            </div>

                                            {tasks.map((task: any) => (
                                                <div
                                                    key={task.id}
                                                    className="p-3.5 border border-neutral-200/70 rounded-2xl flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-2 rounded-full bg-[#5448EE]" />
                                                        <div>
                                                            <h4 className="text-xs font-bold text-neutral-900">{task.title}</h4>
                                                            <p className="text-[11px] text-neutral-500">{task.description}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] text-neutral-600 font-medium">
                                                            {task.assignee?.name || 'Unassigned'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleOpenEditModal(task)}
                                                            className="p-1 rounded text-neutral-400 hover:text-[#5448EE] transition"
                                                            title="Edit Tugas"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </button>
                                                        <select
                                                            value={task.status}
                                                            onChange={(e) => handleMoveStatus(task, e.target.value)}
                                                            className="text-[10px] border border-neutral-200 rounded-full px-2 py-1 text-neutral-700 outline-none"
                                                        >
                                                            <option value="todo">To Do</option>
                                                            <option value="in_progress">In Process</option>
                                                            <option value="in_review">In Review</option>
                                                            <option value="completed">Completed</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL: TAMBAH TUGAS BARU */}
                {isTaskModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 relative">
                            <button
                                onClick={() => setTaskModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-2">
                                <Premium3dIcon icon={Kanban} variant="purple" size="sm" />
                                <div>
                                    <h3 className="text-base font-bold text-neutral-900">Buat Tugas Baru</h3>
                                    <p className="text-xs text-neutral-500">Papan: {team.name}</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateTask} className="mt-5 flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        Judul Tugas *
                                    </label>
                                    <input
                                        type="text"
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        placeholder="Contoh: Implementasi Layar Auth di Flutter"
                                        required
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        Deskripsi / Catatan Tambahan
                                    </label>
                                    <textarea
                                        value={taskDescription}
                                        onChange={(e) => setTaskDescription(e.target.value)}
                                        placeholder="Rincian subtask, referensi desain, atau acceptance criteria..."
                                        rows={3}
                                        className="w-full p-3.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                            Prioritas Tugas
                                        </label>
                                        <select
                                            value={taskPriority}
                                            onChange={(e) => setTaskPriority(e.target.value)}
                                            className="w-full px-3 py-2 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                        >
                                            <option value="urgent">Urgent</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                            Kolom Awal
                                        </label>
                                        <select
                                            value={targetColumn}
                                            onChange={(e) => setTargetColumn(e.target.value)}
                                            className="w-full px-3 py-2 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in_progress">In Process</option>
                                            <option value="in_review">In Review</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        Sprint / Milestone Terkait
                                    </label>
                                    <select
                                        value={taskMilestone}
                                        onChange={(e) => setTaskMilestone(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                    >
                                        <option value="">-- Tanpa Sprint Khusus --</option>
                                        {milestones.map((m: any) => (
                                            <option key={m.id} value={m.id}>
                                                {m.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        Pemberian Tugas (Assignee)
                                    </label>
                                    <select
                                        value={taskAssignee}
                                        onChange={(e) => setTaskAssignee(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                    >
                                        <option value="">-- Belum Ditugaskan (Unassigned) --</option>
                                        {allMembers.map((m: any) => (
                                            <option key={m.id} value={m.user_id}>
                                                {m.name} ({m.role_name || m.permission})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2.5 mt-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setTaskModalOpen(false)}
                                        className="px-4 py-2 border border-neutral-200 rounded-full text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-indigo-500/25"
                                    >
                                        {submitting ? 'Menyimpan...' : 'Tambah Tugas'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL: EDIT TUGAS (TRELLO CARD EDIT) */}
                {isEditModalOpen && taskToEdit && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 relative">
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-2">
                                <Premium3dIcon icon={Edit3} variant="purple" size="sm" />
                                <div>
                                    <h3 className="text-base font-bold text-neutral-900">Edit Kartu Tugas</h3>
                                    <p className="text-xs text-neutral-500">Perbarui rincian atau delegasikan ulang</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateTask} className="mt-5 flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        Judul Tugas *
                                    </label>
                                    <input
                                        type="text"
                                        value={taskToEdit.title}
                                        onChange={(e) => setTaskToEdit({ ...taskToEdit, title: e.target.value })}
                                        required
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        Deskripsi / Acceptance Criteria
                                    </label>
                                    <textarea
                                        value={taskToEdit.description || ''}
                                        onChange={(e) => setTaskToEdit({ ...taskToEdit, description: e.target.value })}
                                        rows={3}
                                        className="w-full p-3.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] outline-none transition"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                            Prioritas
                                        </label>
                                        <select
                                            value={taskToEdit.priority}
                                            onChange={(e) => setTaskToEdit({ ...taskToEdit, priority: e.target.value })}
                                            className="w-full px-3 py-2 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 outline-none"
                                        >
                                            <option value="urgent">Urgent</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                            Status Kolom
                                        </label>
                                        <select
                                            value={taskToEdit.status}
                                            onChange={(e) => setTaskToEdit({ ...taskToEdit, status: e.target.value })}
                                            className="w-full px-3 py-2 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 outline-none"
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in_progress">In Process</option>
                                            <option value="in_review">In Review</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        Penerima Tugas (Assignee)
                                    </label>
                                    <select
                                        value={taskToEdit.assignee_id || ''}
                                        onChange={(e) => setTaskToEdit({ ...taskToEdit, assignee_id: e.target.value })}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 outline-none"
                                    >
                                        <option value="">-- Belum Ditugaskan --</option>
                                        {allMembers.map((m: any) => (
                                            <option key={m.id} value={m.user_id}>
                                                {m.name} ({m.role_name || m.permission})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        Sprint / Milestone Terkait
                                    </label>
                                    <select
                                        value={taskToEdit.milestone_id || ''}
                                        onChange={(e) => setTaskToEdit({ ...taskToEdit, milestone_id: e.target.value })}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 outline-none"
                                    >
                                        <option value="">-- Tanpa Sprint --</option>
                                        {milestones.map((m: any) => (
                                            <option key={m.id} value={m.id}>
                                                {m.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center justify-between gap-2.5 mt-4 pt-3 border-t border-neutral-100">
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTask(taskToEdit.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-full transition"
                                    >
                                        <Trash2 className="size-3.5" />
                                        <span>Hapus Tugas</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditModalOpen(false)}
                                            className="px-4 py-2 border border-neutral-200 rounded-full text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-6 py-2 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-indigo-500/25"
                                        >
                                            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}