import AppLayout from '@/layouts/app-layout';
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
    HardDrive,
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
    storageQuota?: {
        used_bytes: number;
        used_mb: number;
        max_bytes: number;
        max_mb: number;
        remaining_bytes: number;
        remaining_mb: number;
        percent_used: number;
    };
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
    storageQuota,
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

    // Trello-style Drag & Drop state
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);

    // Trello-style Inline Quick Add Card per column
    const [inlineAddingCol, setInlineAddingCol] = useState<string | null>(null);
    const [inlineTitle, setInlineTitle] = useState('');
    const [inlineSubmitting, setInlineSubmitting] = useState(false);

    // AI Agent orchestrating state
    const [orchestrating, setOrchestrating] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);

    // Lecturer evaluation form
    const [evalGrade, setEvalGrade] = useState(project?.lecturer_evaluation || '85/100 (A)');
    const [evalNotes, setEvalNotes] = useState(project?.lecturer_notes || '');
    const [savingEval, setSavingEval] = useState(false);
    const [evalSavedMsg, setEvalSavedMsg] = useState(false);

    // Sprint / Milestone Management
    const [isSprintModalOpen, setSprintModalOpen] = useState(false);
    const [sprintToEdit, setSprintToEdit] = useState<any>(null);
    const [sprintTitle, setSprintTitle] = useState('');
    const [sprintDescription, setSprintDescription] = useState('');
    const [sprintStatus, setSprintStatus] = useState('planned');
    const [sprintDueOn, setSprintDueOn] = useState('');
    const [sprintStartsOn, setSprintStartsOn] = useState('');
    const [sprintSubmitting, setSprintSubmitting] = useState(false);

    const openAddSprint = () => {
        setSprintToEdit(null);
        setSprintTitle('');
        setSprintDescription('');
        setSprintStatus('planned');
        setSprintDueOn('');
        setSprintStartsOn('');
        setSprintModalOpen(true);
    };

    const openEditSprint = (m: any) => {
        setSprintToEdit(m);
        setSprintTitle(m.title || '');
        setSprintDescription(m.description || '');
        setSprintStatus(m.status?.toLowerCase().replace(' ', '_') || 'planned');
        setSprintDueOn(m.due_on || '');
        setSprintStartsOn(m.starts_on || '');
        setSprintModalOpen(true);
    };

    const handleSaveSprint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sprintTitle.trim()) return;
        setSprintSubmitting(true);

        const isEditing = Boolean(sprintToEdit);
        const url = isEditing
            ? `/workspace/${team.id}/milestones/${sprintToEdit.id}`
            : `/workspace/${team.id}/milestones`;
        const method = isEditing ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    title: sprintTitle,
                    description: sprintDescription || null,
                    status: sprintStatus,
                    starts_on: sprintStartsOn || null,
                    due_on: sprintDueOn || null,
                }),
            });

            const json = await res.json();
            if (res.ok) {
                if (isEditing) {
                    setMilestones((prev) =>
                        prev.map((item) => (item.id === sprintToEdit.id ? { ...item, ...json.data } : item))
                    );
                } else {
                    setMilestones((prev) => [...prev, json.data]);
                }
                setSprintModalOpen(false);
            } else {
                alert(json.message || 'Gagal menyimpan sprint.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSprintSubmitting(false);
        }
    };

    const handleDeleteSprint = async (mId: number, mTitle: string) => {
        if (!confirm(`Hapus sprint "${mTitle}"? Semua tugas terkait akan tetap tersimpan di board (tugas dilepas dari sprint ini).`)) {
            return;
        }

        try {
            const res = await fetch(`/workspace/${team.id}/milestones/${mId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });

            const json = await res.json();
            if (res.ok) {
                setMilestones((prev) => prev.filter((item) => item.id !== mId));
                setKanban((prev: any) => {
                    const next: any = {};
                    Object.keys(prev).forEach((col) => {
                        next[col] = prev[col].map((t: any) =>
                            t.milestone_id === mId ? { ...t, milestone_id: null, milestone: null } : t
                        );
                    });
                    return next;
                });
            } else {
                alert(json.message || 'Gagal menghapus sprint.');
            }
        } catch {
            alert('Terjadi kendala saat menghapus sprint.');
        }
    };

    // Search and View
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<'board' | 'list'>('board');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Cari Proyek', href: '/projects' },
        { title: 'Ruang Kerja Tim', href: '/workspace' },
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

    // Trello Quick Add
    const handleQuickAdd = async (colKey: string) => {
        if (!inlineTitle.trim() || !team.id) return;

        const tempId = Date.now();
        const newTempTask = {
            id: tempId,
            title: inlineTitle.trim(),
            description: null,
            priority: 'medium',
            status: colKey,
            created_at: new Date().toISOString(),
        };

        setKanban((prev: any) => ({
            ...prev,
            [colKey]: [...(prev[colKey] || []), newTempTask],
        }));

        const submittedTitle = inlineTitle.trim();
        setInlineTitle('');
        setInlineSubmitting(true);

        try {
            const res = await fetch(`/workspace/${team.id}/tasks`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    title: submittedTitle,
                    status: colKey,
                    priority: 'medium',
                }),
            });

            const json = await res.json();
            if (res.ok && json.data) {
                setKanban((prev: any) => ({
                    ...prev,
                    [colKey]: (prev[colKey] || []).map((t: any) => (t.id === tempId ? json.data : t)),
                }));
            } else if (!res.ok) {
                setKanban((prev: any) => ({
                    ...prev,
                    [colKey]: (prev[colKey] || []).filter((t: any) => t.id !== tempId),
                }));
                alert(json.message || 'Gagal menambahkan kartu.');
            }
        } catch {
            setKanban((prev: any) => ({
                ...prev,
                [colKey]: (prev[colKey] || []).filter((t: any) => t.id !== tempId),
            }));
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setInlineSubmitting(false);
        }
    };

    // Trello Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, taskId: number, fromCol: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('application/json', JSON.stringify({ taskId, fromCol }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, colKey: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverCol !== colKey) {
            setDragOverCol(colKey);
        }
    };

    const handleDragLeave = (e: React.DragEvent, colKey: string) => {
        if (dragOverCol === colKey) {
            setDragOverCol(null);
        }
    };

    const handleDrop = (e: React.DragEvent, targetCol: string) => {
        e.preventDefault();
        setDragOverCol(null);
        setDraggedTaskId(null);

        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;

        try {
            const { taskId, fromCol } = JSON.parse(dataStr);
            if (fromCol === targetCol) return;

            const task = (kanban as any)[fromCol]?.find((t: any) => t.id === taskId);
            if (!task) return;

            handleMoveStatus(task, targetCol);
        } catch {
            // ignore
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
        { key: 'todo', label: 'To Do', colorDot: 'bg-slate-400', badgeColor: 'bg-slate-200 text-slate-700' },
        { key: 'in_progress', label: 'In Process', colorDot: 'bg-blue-500', badgeColor: 'bg-blue-100 text-blue-700' },
        { key: 'in_review', label: 'In Review', colorDot: 'bg-amber-500', badgeColor: 'bg-amber-100 text-amber-800' },
        { key: 'completed', label: 'Completed', colorDot: 'bg-emerald-500', badgeColor: 'bg-emerald-100 text-emerald-800' },
    ];

    const priorityBadge: Record<string, { label: string; cls: string; dot: string }> = {
        urgent: { label: 'Urgent', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
        high: { label: 'High Priority', cls: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
        medium: { label: 'Standard', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
        low: { label: 'Low', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
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
        <AppLayout breadcrumbs={breadcrumbs} activeTab="task">
            <Head title={`Workspace & Roadmap — ${team.name}`} />

            <div className="space-y-6 pt-2">
                {/* Top Row: Back & Team Identity */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/workspace"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 hover:text-blue-600 shadow-2xs transition"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Ruang Kerja Tim</span>
                            </Link>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-400">/</span>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    {team.name}
                                </h1>
                                {project && (
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:underline border border-blue-200/80"
                                    >
                                        Proyek: {project.title}
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Top Action Pills: Capacity, Progress, & Add Task */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Capacity Pill */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white border border-slate-200/90 text-slate-700 shadow-2xs">
                                <Users className="size-3.5 text-slate-400" />
                                <span>{team.members?.length || 1} / {team.capacity} Anggota</span>
                                {isFull ? (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-black">
                                        Penuh
                                    </span>
                                ) : (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-black">
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
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
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
                        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
                                        <GraduationCap className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                                            Evaluasi & Catatan Penilaian Dosen
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Tinjau progres tugas tim mahasiswa, berikan nilai, dan tulis catatan perbaikan.
                                        </p>
                                    </div>
                                </div>

                                {/* Overall Progress Gauge */}
                                <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200/80 self-start sm:self-auto">
                                    <TrendingUp className="size-4 text-emerald-600" />
                                    <div className="text-xs">
                                        <span className="text-slate-400 block text-[10px]">Progres Penyelesaian</span>
                                        <span className="font-bold text-slate-900">
                                            {completedTasksCount} / {totalTasksCount} Tugas ({progressPercent}%)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSaveEvaluation} className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-4 flex flex-col gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Nilai / Status Evaluasi Tim <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={evalGrade}
                                            onChange={(e) => setEvalGrade(e.target.value)}
                                            placeholder="Contoh: 88/100 (A) atau Revisi Tahap 2"
                                            required
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                        />
                                    </div>

                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed">
                                        Nilai dan catatan arahan ini akan langsung tampil di dashboard mahasiswa dan rekap bimbingan kelas.
                                    </div>
                                </div>

                                <div className="md:col-span-8 flex flex-col gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Catatan Arahan & Saran Perbaikan <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            value={evalNotes}
                                            onChange={(e) => setEvalNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Tuliskan arahan perbaikan teknis, saran solusi, atau tugas yang wajib direvisi oleh mahasiswa..."
                                            required
                                            className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition resize-none leading-relaxed"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        {evalSavedMsg ? (
                                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                                                <CheckCircle2 className="size-4" />
                                                Nilai dan catatan berhasil disimpan!
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-slate-400">
                                                Klik tombol di samping untuk mempublikasikan evaluasi.
                                            </span>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={savingEval}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                                        >
                                            <Save className="size-3.5" />
                                            <span>{savingEval ? 'Menyimpan...' : 'Simpan Nilai & Catatan'}</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    ) : (
                        /* Tampilan untuk Mahasiswa jika sudah ada penilaian dosen */
                        (project?.lecturer_evaluation || project?.lecturer_notes) && (
                            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
                                            <GraduationCap className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-900">
                                                Catatan & Nilai dari Dosen Pengampu
                                            </h3>
                                            <p className="text-[11px] text-slate-500">
                                                Dosen: {project.academicClass?.lecturer?.name || 'Dosen Pembimbing'}
                                            </p>
                                        </div>
                                    </div>

                                    {project.lecturer_evaluation && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold text-xs">
                                            <Award className="size-3.5" />
                                            <span>Nilai: {project.lecturer_evaluation}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                    <strong className="block text-slate-900 mb-1">Catatan Arahan & Tindak Lanjut:</strong>
                                    {project.lecturer_notes}
                                </div>
                            </div>
                        )
                    )}

                    {/* Object Storage Quota Widget */}
                    {storageQuota && (
                        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
                                    <HardDrive className="size-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-slate-900">
                                            Kapasitas Penyimpanan Berkas Tim (Object Storage)
                                        </h3>
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                                            Batas 70 MB / Tim
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Terpakai <strong className="text-slate-800">{storageQuota.used_mb} MB</strong> dari kuota maksimal <strong className="text-slate-800">{storageQuota.max_mb} MB</strong> ({storageQuota.percent_used}% terpakai, sisa {storageQuota.remaining_mb} MB)
                                    </p>
                                </div>
                            </div>
                            <div className="w-full sm:w-48 flex items-center gap-2.5">
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            storageQuota.percent_used > 85 ? 'bg-rose-500' : 'bg-blue-600'
                                        }`}
                                        style={{ width: `${Math.min(100, storageQuota.percent_used)}%` }}
                                    />
                                </div>
                                <span className="text-[11px] font-mono font-bold text-slate-700 shrink-0">
                                    {storageQuota.percent_used}%
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 2. ROADMAP & JADWAL PENGERJAAN TIM */}
                    <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-2xs">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
                                    <Bot className="size-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                                            Roadmap & Jadwal Pengerjaan Tim
                                        </h2>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                            Tahapan Sprint
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Target pengerjaan bertahap dan pembagian tugas otomatis sesuai keahlian tiap anggota tim.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Link
                                    href={`/ai-workspace?team_id=${team.id}`}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700 rounded-lg text-xs font-semibold shadow-2xs transition shrink-0 cursor-pointer"
                                >
                                    <Bot className="size-3.5 text-blue-600" />
                                    <span>AI Workspace</span>
                                </Link>
                                <button
                                    onClick={openAddSprint}
                                    type="button"
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition shrink-0 cursor-pointer"
                                >
                                    <Plus className="size-3.5 text-blue-600" />
                                    <span>Tambah Sprint</span>
                                </button>
                                <button
                                    onClick={handleTriggerAiAgent}
                                    disabled={orchestrating}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition disabled:opacity-50 shrink-0 cursor-pointer"
                                >
                                    <Wand2 className="size-3.5 text-blue-400" />
                                    <span>{orchestrating ? 'Menyusun roadmap...' : 'Bagi Tugas & Roadmap Otomatis'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Visual Milestones / Sprint Cards (Trello Roadmap) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                            {milestones.length === 0 ? (
                                <div className="col-span-full py-8 px-4 text-center border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                                    <Calendar className="size-8 text-neutral-400 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-neutral-700">Belum ada roadmap pengerjaan</p>
                                    <p className="text-[11px] text-neutral-500 mt-0.5 max-w-sm mx-auto mb-3">
                                        Klik tombol "Tambah Sprint" atau "Bagi Tugas & Roadmap Otomatis" di atas untuk membuat tahapan pengerjaan tim.
                                    </p>
                                </div>
                            ) : (
                                milestones.map((m: any, idx: number) => (
                                    <div
                                        key={m.id || idx}
                                        className="group p-4 rounded-2xl border border-purple-100/80 bg-gradient-to-b from-[#FAF8FF] to-white flex flex-col justify-between shadow-2xs hover:shadow-xs transition relative"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-1 mb-2">
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-extrabold">
                                                    Sprint {idx + 1}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600 font-semibold capitalize">
                                                        {m.status?.replace('_', ' ') || 'Planned'}
                                                    </span>
                                                    {(isLeader || isLecturer) && (
                                                        <div className="flex items-center gap-0.5 ml-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditSprint(m)}
                                                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                                                                title="Edit Sprint"
                                                            >
                                                                <Edit3 className="size-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSprint(m.id, m.title)}
                                                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                                                title="Hapus Sprint"
                                                            >
                                                                <Trash2 className="size-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
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
                                                    className="bg-[#2563EB] h-1.5 rounded-full transition-all duration-500"
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
                                        ? 'bg-white shadow-xs text-[#2563EB]'
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
                                        ? 'bg-white shadow-xs text-[#2563EB]'
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
                                    className="w-full pl-9 pr-3.5 py-1.5 rounded-full border border-neutral-200/80 text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. KANBAN BOARD 4 COLUMNS (Trello Style) */}
                    {activeView === 'board' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                            {columns.map((col) => {
                                const tasks = filterTasks((kanban as any)[col.key] || []);
                                const isDragTarget = dragOverCol === col.key;
                                const isAddingHere = inlineAddingCol === col.key;

                                return (
                                    <div
                                        key={col.key}
                                        onDragOver={(e) => handleDragOver(e, col.key)}
                                        onDragLeave={(e) => handleDragLeave(e, col.key)}
                                        onDrop={(e) => handleDrop(e, col.key)}
                                        className={`rounded-2xl p-3 flex flex-col gap-2.5 min-h-[480px] transition-all duration-150 ${
                                            isDragTarget
                                                ? 'bg-blue-50/90 border-2 border-dashed border-blue-400 ring-2 ring-blue-500/20'
                                                : 'bg-[#F1F2F4] border border-slate-200/80 shadow-2xs'
                                        }`}
                                    >
                                        {/* Column Header */}
                                        <div className="flex items-center justify-between px-1.5 py-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`size-2 rounded-full ${col.colorDot}`} />
                                                <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                                                    {col.label}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                                                    {tasks.length}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setInlineAddingCol(col.key);
                                                        setInlineTitle('');
                                                    }}
                                                    className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 transition cursor-pointer"
                                                    title={`Tambah kartu ke ${col.label}`}
                                                >
                                                    <Plus className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Cards Stack */}
                                        <div className="flex flex-col gap-2.5 flex-1">
                                            {tasks.length === 0 && !isAddingHere && (
                                                <div className="h-28 flex flex-col items-center justify-center p-3 text-center border border-dashed border-slate-300 rounded-xl text-slate-400">
                                                    <span className="text-[11px] font-medium">
                                                        Belum ada kartu di kolom ini
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setInlineAddingCol(col.key);
                                                            setInlineTitle('');
                                                        }}
                                                        className="mt-1 text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                                                    >
                                                        + Tambah kartu
                                                    </button>
                                                </div>
                                            )}

                                            {tasks.map((task: any) => {
                                                const priority = priorityBadge[task.priority] || priorityBadge.medium;
                                                const isBeingDragged = draggedTaskId === task.id;

                                                return (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, task.id, col.key)}
                                                        onClick={() => handleOpenEditModal(task)}
                                                        className={`group bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative flex flex-col gap-2 select-none ${
                                                            isBeingDragged ? 'opacity-40 scale-95 border-blue-400' : ''
                                                        }`}
                                                    >
                                                        {/* Priority Chip & Actions */}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span
                                                                className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priority.cls}`}
                                                            >
                                                                <span className={`size-1.5 rounded-full ${priority.dot}`} />
                                                                <span>{priority.label}</span>
                                                            </span>

                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenEditModal(task);
                                                                    }}
                                                                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition opacity-0 group-hover:opacity-100"
                                                                    title="Edit Kartu"
                                                                >
                                                                    <Edit3 className="size-3" />
                                                                </button>

                                                                {/* Quick shift status select */}
                                                                <select
                                                                    value={task.status}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMoveStatus(task, e.target.value);
                                                                    }}
                                                                    className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600 focus:outline-none hover:bg-slate-100 cursor-pointer"
                                                                >
                                                                    <option value="todo">To Do</option>
                                                                    <option value="in_progress">In Process</option>
                                                                    <option value="in_review">In Review</option>
                                                                    <option value="completed">Completed</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Task Title */}
                                                        <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug break-words">
                                                            {task.title}
                                                        </h4>

                                                        {/* Task Description */}
                                                        {task.description && (
                                                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                                                {task.description}
                                                            </p>
                                                        )}

                                                        {/* Card Footer: Assignee & Milestone Sprint */}
                                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] mt-1">
                                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                                <div className="size-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                                                                    {task.assignee?.name
                                                                        ? task.assignee.name.substring(0, 1).toUpperCase()
                                                                        : '?'}
                                                                </div>
                                                                <span className="truncate max-w-[90px] text-[10px] font-medium text-slate-700">
                                                                    {task.assignee?.name?.split(' ')[0] || 'Unassigned'}
                                                                </span>
                                                            </div>

                                                            {task.milestone && (
                                                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-semibold truncate max-w-[100px]">
                                                                    {task.milestone.title?.split(':')[0] || task.milestone.title}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Inline Card Composer (Trello Style) */}
                                            {isAddingHere && (
                                                <div className="bg-white rounded-xl p-3 border border-blue-400 shadow-sm flex flex-col gap-2 animate-in fade-in">
                                                    <textarea
                                                        autoFocus
                                                        value={inlineTitle}
                                                        onChange={(e) => setInlineTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleQuickAdd(col.key);
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setInlineAddingCol(null);
                                                            }
                                                        }}
                                                        placeholder="Masukkan judul untuk kartu ini..."
                                                        rows={2}
                                                        className="w-full text-xs text-slate-900 border-0 p-0 focus:outline-none focus:ring-0 resize-none placeholder:text-slate-400"
                                                    />
                                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleQuickAdd(col.key)}
                                                                disabled={inlineSubmitting || !inlineTitle.trim()}
                                                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                                            >
                                                                {inlineSubmitting ? 'Menyimpan...' : 'Tambah Kartu'}
                                                            </button>
                                                            <button
                                                                onClick={() => setInlineAddingCol(null)}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                                            >
                                                                <X className="size-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Column Bottom "+ Add a card" button (Trello Signature) */}
                                        {!isAddingHere && (
                                            <button
                                                onClick={() => {
                                                    setInlineAddingCol(col.key);
                                                    setInlineTitle('');
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition w-full text-left cursor-pointer"
                                            >
                                                <Plus className="size-4 text-slate-500" />
                                                <span>Tambah kartu</span>
                                            </button>
                                        )}
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
                                                        <div className="size-2 rounded-full bg-[#2563EB]" />
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
                                                            className="p-1 rounded text-neutral-400 hover:text-[#2563EB] transition"
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

                            <div className="flex items-center gap-3 mb-2">
                                <div className="size-8 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
                                    <Kanban className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Buat Tugas Baru</h3>
                                    <p className="text-xs text-slate-500">Papan: {team.name}</p>
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
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
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
                                        className="w-full p-3.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
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
                                            className="w-full px-3 py-2 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
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
                                            className="w-full px-3 py-2 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
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
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
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
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
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
                                        className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-indigo-500/25"
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

                            <div className="flex items-center gap-3 mb-2">
                                <div className="size-8 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
                                    <Edit3 className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Edit Kartu Tugas</h3>
                                    <p className="text-xs text-slate-500">Perbarui rincian atau delegasikan ulang</p>
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
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] outline-none transition"
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
                                        className="w-full p-3.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] outline-none transition"
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
                                            className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-indigo-500/25"
                                        >
                                            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Sprint / Milestone Modal (Add & Edit) */}
                {isSprintModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 flex flex-col gap-4">
                            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        {sprintToEdit ? 'Ubah Sprint / Milestone' : 'Tambah Sprint Baru'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {sprintToEdit
                                            ? 'Perbarui target, status tahapan, atau tenggat waktu sprint.'
                                            : 'Tentukan target pengerjaan dan batas waktu sprint tim Anda.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSprintModalOpen(false)}
                                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveSprint} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Judul Sprint <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={sprintTitle}
                                        onChange={(e) => setSprintTitle(e.target.value)}
                                        placeholder="Contoh: Sprint 1: Perancangan Arsitektur & Wireframe"
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Status Sprint
                                        </label>
                                        <select
                                            value={sprintStatus}
                                            onChange={(e) => setSprintStatus(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="planned">Direncanakan (Planned)</option>
                                            <option value="in_progress">Sedang Dikerjakan (In Progress)</option>
                                            <option value="completed">Selesai (Completed)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Tenggat Waktu (Due Date)
                                        </label>
                                        <input
                                            type="date"
                                            value={sprintDueOn}
                                            onChange={(e) => setSprintDueOn(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Deskripsi & Sasaran Target
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={sprintDescription}
                                        onChange={(e) => setSprintDescription(e.target.value)}
                                        placeholder="Tuliskan tujuan spesifik sprint ini dan output yang diharapkan..."
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                                    {sprintToEdit && (isLeader || isLecturer) ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSprintModalOpen(false);
                                                handleDeleteSprint(sprintToEdit.id, sprintToEdit.title);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                        >
                                            <Trash2 className="size-3.5" />
                                            <span>Hapus Sprint</span>
                                        </button>
                                    ) : <div />}

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSprintModalOpen(false)}
                                            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={sprintSubmitting}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-xs cursor-pointer"
                                        >
                                            {sprintSubmitting ? 'Menyimpan...' : (sprintToEdit ? 'Simpan Perubahan' : 'Buat Sprint')}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </AppLayout>
    );
}
