import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    Filter,
    FolderKanban,
    Kanban,
    LayoutGrid,
    List,
    MoreHorizontal,
    Plus,
    Search,
    ShieldCheck,
    Sparkles,
    Users,
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
    activities: any[];
    isLeader: boolean;
}

export default function WorkspaceShow({
    team,
    kanban: initialKanban,
    activities,
    isLeader,
}: Props) {
    const [kanban, setKanban] = useState(initialKanban);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskPriority, setTaskPriority] = useState('medium');
    const [taskAssignee, setTaskAssignee] = useState('');
    const [targetColumn, setTargetColumn] = useState('todo');
    const [submitting, setSubmitting] = useState(false);
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

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/api/v1/teams/${team.id}/tasks`, {
                method: 'POST',
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

    const handleMoveStatus = async (task: any, newStatus: string) => {
        if (task.status === newStatus) return;
        const oldCol = task.status;
        const updatedTask = { ...task, status: newStatus };

        // Optimistic UI update
        setKanban((prev: any) => ({
            ...prev,
            [oldCol]: prev[oldCol].filter((t: any) => t.id !== task.id),
            [newStatus]: [updatedTask, ...prev[newStatus]],
        }));

        try {
            const res = await fetch(`/api/v1/tasks/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                // Revert if error
                setKanban((prev: any) => ({
                    ...prev,
                    [newStatus]: prev[newStatus].filter((t: any) => t.id !== task.id),
                    [oldCol]: [...prev[oldCol], task],
                }));
                alert('Gagal memindahkan status tugas di server.');
            }
        } catch {
            alert('Gagal memindahkan tugas.');
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
            <Head title={`Workspace — ${team.name}`} />

            <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F8F6FF] relative text-[#0E121B] pb-24 selection:bg-[#5448EE] selection:text-white">
                {/* Atmosphere background radial glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[320px] bg-gradient-to-b from-[#5448EE]/10 to-transparent blur-3xl pointer-events-none -z-0" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-6">
                    {/* Top Row: Back & Team Title */}
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
                                {team.project && (
                                    <Link
                                        href={`/projects/${team.project.id}`}
                                        className="text-xs px-2.5 py-0.5 rounded-full bg-[#EEEDFD] text-[#5448EE] font-semibold hover:underline"
                                    >
                                        Proyek: {team.project.title}
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Team Members Avatar Stack */}
                        <div className="flex items-center gap-3 self-start md:self-auto">
                            <div className="flex items-center -space-x-2 overflow-hidden">
                                {team.members?.map((m: any, idx: number) => (
                                    <div
                                        key={m.id || idx}
                                        title={`${m.user?.name} (${m.role_name || m.permission})`}
                                        className="inline-flex items-center justify-center size-8 rounded-full ring-2 ring-white bg-[#181135] text-white text-[11px] font-bold"
                                    >
                                        {m.user?.name?.substring(0, 2).toUpperCase() || 'M'}
                                    </div>
                                ))}
                            </div>

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

                    {/* Task Boards Control Bar (matching the TaskGo reference image) */}
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

                    {/* Kanban Board 4 Columns */}
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
                                                        className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-purple-200 transition group relative"
                                                    >
                                                        {/* Priority Chip & Actions */}
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            <span
                                                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priority.cls}`}
                                                            >
                                                                {priority.label}
                                                            </span>

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

                                                        {/* Card Footer: Assignee & Milestone */}
                                                        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
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
                                                                <span className="text-[10px] text-[#5448EE] font-medium truncate max-w-[90px]">
                                                                    {task.milestone.title}
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

                {/* Add Task Modal */}
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
                                <span className="p-2 rounded-xl bg-[#EEEDFD] text-[#5448EE]">
                                    <Kanban className="size-5" />
                                </span>
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
                                        placeholder="Rincian subtask, referensi desain, atau kriteria selesai..."
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
                                        Pemberian Tugas (Assignee)
                                    </label>
                                    <select
                                        value={taskAssignee}
                                        onChange={(e) => setTaskAssignee(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                    >
                                        <option value="">-- Belum Ditugaskan (Unassigned) --</option>
                                        {team.members?.map((m: any) => (
                                            <option key={m.id} value={m.user_id}>
                                                {m.user?.name} ({m.role_name || m.permission})
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
            </div>
        </AppLayout>
    );
}