import { useState, useMemo } from 'react';
import {
    CheckCircle2,
    Clock,
    FolderKanban,
    Plus,
    User as UserIcon,
    AlertCircle,
    ArrowRight,
    Trash2,
    Search,
    X,
    Edit3,
    Calendar,
    Tag,
    GripVertical,
    Check,
    AlignLeft,
} from 'lucide-react';

interface Props {
    project: any;
    kanban: {
        todo: any[];
        in_progress: any[];
        in_review: any[];
        completed: any[];
    };
    isMember: boolean;
    isLeader: boolean;
}

type ColumnKey = 'todo' | 'in_progress' | 'in_review' | 'completed';

export default function TasksKanbanTab({ project, kanban: initialKanban, isMember, isLeader }: Props) {
    const teamId = project.team?.id;
    const canEdit = isMember || isLeader;

    // Local state for optimistic, instant Trello-like updates
    const [kanbanState, setKanbanState] = useState<{
        todo: any[];
        in_progress: any[];
        in_review: any[];
        completed: any[];
    }>({
        todo: initialKanban.todo || [],
        in_progress: initialKanban.in_progress || [],
        in_review: initialKanban.in_review || [],
        completed: initialKanban.completed || [],
    });

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');

    // Drag and drop state
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverCol, setDragOverCol] = useState<ColumnKey | null>(null);

    // Inline "Add Card" state per column
    const [inlineAddingCol, setInlineAddingCol] = useState<ColumnKey | null>(null);
    const [inlineTitle, setInlineTitle] = useState('');
    const [inlineSubmitting, setInlineSubmitting] = useState(false);

    // Full Card Detail & Edit Modal
    const [activeTaskModal, setActiveTaskModal] = useState<any | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editPriority, setEditPriority] = useState('medium');
    const [editStatus, setEditStatus] = useState<ColumnKey>('todo');
    const [editAssigneeId, setEditAssigneeId] = useState<string>('');
    const [editDueOn, setEditDueOn] = useState<string>('');
    const [modalSubmitting, setModalSubmitting] = useState(false);

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    // Columns definition in standard Trello flow
    const columns: { key: ColumnKey; title: string; colorDot: string; headerBadge: string }[] = [
        { key: 'todo', title: 'Belum Dikerjakan (To-Do)', colorDot: 'bg-slate-400', headerBadge: 'bg-slate-200 text-slate-700' },
        { key: 'in_progress', title: 'Sedang Dikerjakan (In Progress)', colorDot: 'bg-blue-500', headerBadge: 'bg-blue-100 text-blue-700' },
        { key: 'in_review', title: 'Ulasan & QA (In Review)', colorDot: 'bg-amber-500', headerBadge: 'bg-amber-100 text-amber-800' },
        { key: 'completed', title: 'Selesai (Done)', colorDot: 'bg-emerald-500', headerBadge: 'bg-emerald-100 text-emerald-800' },
    ];

    // Priority color mapping (Trello Label Style)
    const priorityConfig: Record<string, { label: string; badgeCls: string; dotCls: string }> = {
        urgent: { label: 'Urgent', badgeCls: 'bg-rose-50 text-rose-700 border-rose-200', dotCls: 'bg-rose-500' },
        high: { label: 'Tinggi', badgeCls: 'bg-amber-50 text-amber-800 border-amber-200', dotCls: 'bg-amber-500' },
        medium: { label: 'Menengah', badgeCls: 'bg-blue-50 text-blue-700 border-blue-200', dotCls: 'bg-blue-500' },
        low: { label: 'Rendah', badgeCls: 'bg-slate-100 text-slate-600 border-slate-200', dotCls: 'bg-slate-400' },
    };

    // Team members for assignment dropdown
    const teamMembers = useMemo(() => {
        const members = project.team?.members || [];
        return members.map((m: any) => m.user || m).filter(Boolean);
    }, [project.team?.members]);

    // Calculate total stats
    const totalCount =
        kanbanState.todo.length +
        kanbanState.in_progress.length +
        kanbanState.in_review.length +
        kanbanState.completed.length;
    const completedCount = kanbanState.completed.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Filter tasks based on search and priority
    const filterList = (tasks: any[]) => {
        return tasks.filter((t) => {
            const matchSearch =
                !searchQuery ||
                t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.assignee?.name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchPriority = selectedPriorityFilter === 'all' || t.priority === selectedPriorityFilter;
            return matchSearch && matchPriority;
        });
    };

    // ==========================================
    // 1. INLINE QUICK ADD TASK (Trello UX)
    // ==========================================
    const handleQuickAdd = async (colKey: ColumnKey) => {
        if (!inlineTitle.trim() || !teamId) return;

        const newTempTask = {
            id: Date.now(),
            title: inlineTitle.trim(),
            description: null,
            priority: 'medium',
            status: colKey,
            created_at: new Date().toISOString(),
        };

        // Optimistic update
        setKanbanState((prev) => ({
            ...prev,
            [colKey]: [...prev[colKey], newTempTask],
        }));

        const submittedTitle = inlineTitle.trim();
        setInlineTitle('');
        setInlineSubmitting(true);

        try {
            const res = await fetch(`/workspace/${teamId}/tasks`, {
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
                // Replace temp task with real saved task from backend
                setKanbanState((prev) => ({
                    ...prev,
                    [colKey]: prev[colKey].map((t) => (t.id === newTempTask.id ? json.data : t)),
                }));
            } else if (!res.ok) {
                // Revert
                setKanbanState((prev) => ({
                    ...prev,
                    [colKey]: prev[colKey].filter((t) => t.id !== newTempTask.id),
                }));
                alert(json.message || 'Gagal menambahkan kartu tugas.');
            }
        } catch {
            setKanbanState((prev) => ({
                ...prev,
                [colKey]: prev[colKey].filter((t) => t.id !== newTempTask.id),
            }));
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setInlineSubmitting(false);
        }
    };

    // ==========================================
    // 2. DRAG AND DROP HANDLERS (Native HTML5)
    // ==========================================
    const handleDragStart = (e: React.DragEvent, taskId: number, fromCol: ColumnKey) => {
        if (!canEdit) return;
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('application/json', JSON.stringify({ taskId, fromCol }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, colKey: ColumnKey) => {
        if (!canEdit) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverCol !== colKey) {
            setDragOverCol(colKey);
        }
    };

    const handleDragLeave = (e: React.DragEvent, colKey: ColumnKey) => {
        if (dragOverCol === colKey) {
            setDragOverCol(null);
        }
    };

    const handleDrop = async (e: React.DragEvent, targetCol: ColumnKey) => {
        e.preventDefault();
        setDragOverCol(null);
        if (!canEdit || !teamId) return;

        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;

        try {
            const { taskId, fromCol } = JSON.parse(dataStr);
            if (fromCol === targetCol) return;

            // Find the task
            const task = kanbanState[fromCol as ColumnKey]?.find((t) => t.id === taskId);
            if (!task) return;

            const updatedTask = { ...task, status: targetCol };

            // Optimistic move
            setKanbanState((prev) => ({
                ...prev,
                [fromCol]: prev[fromCol as ColumnKey].filter((t) => t.id !== taskId),
                [targetCol]: [...prev[targetCol], updatedTask],
            }));

            // Sync with backend
            const res = await fetch(`/workspace/${teamId}/tasks/${taskId}`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ status: targetCol }),
            });

            if (!res.ok) {
                // Revert on failure
                setKanbanState((prev) => ({
                    ...prev,
                    [targetCol]: prev[targetCol].filter((t) => t.id !== taskId),
                    [fromCol]: [...prev[fromCol as ColumnKey], task],
                }));
                alert('Gagal memindahkan kartu tugas.');
            }
        } catch {
            alert('Gagal memindahkan tugas.');
        } finally {
            setDraggedTaskId(null);
        }
    };

    // ==========================================
    // 3. QUICK STATUS CHANGE (Dropdown / Buttons)
    // ==========================================
    const handleMoveStatus = async (task: any, newStatus: ColumnKey) => {
        if (!canEdit || !teamId || task.status === newStatus) return;
        const oldCol = task.status as ColumnKey;
        const updatedTask = { ...task, status: newStatus };

        setKanbanState((prev) => ({
            ...prev,
            [oldCol]: prev[oldCol].filter((t) => t.id !== task.id),
            [newStatus]: [...prev[newStatus], updatedTask],
        }));

        try {
            const res = await fetch(`/workspace/${teamId}/tasks/${task.id}`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                // Revert
                setKanbanState((prev) => ({
                    ...prev,
                    [newStatus]: prev[newStatus].filter((t) => t.id !== task.id),
                    [oldCol]: [...prev[oldCol], task],
                }));
                alert('Gagal memindahkan status kartu.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        }
    };

    // ==========================================
    // 4. DELETE TASK
    // ==========================================
    const handleDeleteTask = async (taskId: number, statusCol: ColumnKey) => {
        if (!canEdit || !teamId || !confirm('Hapus kartu tugas ini dari papan Kanban?')) return;

        const taskToDelete = kanbanState[statusCol].find((t) => t.id === taskId);

        setKanbanState((prev) => ({
            ...prev,
            [statusCol]: prev[statusCol].filter((t) => t.id !== taskId),
        }));

        if (activeTaskModal?.id === taskId) {
            setActiveTaskModal(null);
        }

        try {
            const res = await fetch(`/workspace/${teamId}/tasks/${taskId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });

            if (!res.ok) {
                if (taskToDelete) {
                    setKanbanState((prev) => ({
                        ...prev,
                        [statusCol]: [...prev[statusCol], taskToDelete],
                    }));
                }
                alert('Gagal menghapus tugas dari server.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        }
    };

    // ==========================================
    // 5. OPEN & SAVE CARD DETAIL MODAL
    // ==========================================
    const openCardModal = (task: any) => {
        setActiveTaskModal(task);
        setEditTitle(task.title || '');
        setEditDescription(task.description || '');
        setEditPriority(task.priority || 'medium');
        setEditStatus(task.status || 'todo');
        setEditAssigneeId(task.assignee_id ? String(task.assignee_id) : '');
        setEditDueOn(task.due_on || '');
    };

    const handleSaveCardModal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTaskModal || !teamId) return;

        setModalSubmitting(true);
        const oldStatus = activeTaskModal.status as ColumnKey;

        try {
            const res = await fetch(`/workspace/${teamId}/tasks/${activeTaskModal.id}`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDescription,
                    priority: editPriority,
                    status: editStatus,
                    assignee_id: editAssigneeId ? parseInt(editAssigneeId, 10) : null,
                    due_on: editDueOn || null,
                }),
            });

            const json = await res.json();
            if (res.ok) {
                const updated = json.data || {
                    ...activeTaskModal,
                    title: editTitle,
                    description: editDescription,
                    priority: editPriority,
                    status: editStatus,
                    assignee_id: editAssigneeId ? parseInt(editAssigneeId, 10) : null,
                    assignee: teamMembers.find((m: any) => String(m.id) === String(editAssigneeId)),
                    due_on: editDueOn || null,
                };

                setKanbanState((prev) => {
                    const next = { ...prev };
                    // remove from old col
                    next[oldStatus] = next[oldStatus].filter((t) => t.id !== activeTaskModal.id);
                    // add to new col
                    next[editStatus] = [updated, ...next[editStatus].filter((t) => t.id !== activeTaskModal.id)];
                    return next;
                });

                setActiveTaskModal(null);
            } else {
                alert(json.message || 'Gagal menyimpan perubahan.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setModalSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Trello Board Top Bar: Progress, Search & Filters */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                        <FolderKanban className="size-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                                Papan Tugas Kanban Tim (Trello Style)
                            </h3>
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {completedCount}/{totalCount} Selesai
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Geser dan lepas (drag & drop) kartu tugas antar kolom untuk memperbarui progres tim secara instan.
                        </p>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                        <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kartu tugas..."
                            className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44 sm:w-56"
                        />
                    </div>

                    <select
                        value={selectedPriorityFilter}
                        onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                        className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="all">Semua Prioritas</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">Tinggi</option>
                        <option value="medium">Menengah</option>
                        <option value="low">Rendah</option>
                    </select>

                    {/* Progress Bar */}
                    <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{progressPercent}%</span>
                    </div>
                </div>
            </div>

            {/* 4-Column Trello Board Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {columns.map((col) => {
                    const rawTasks = kanbanState[col.key] || [];
                    const tasks = filterList(rawTasks);
                    const isDragTarget = dragOverCol === col.key;
                    const isAddingHere = inlineAddingCol === col.key;

                    return (
                        <div
                            key={col.key}
                            onDragOver={(e) => handleDragOver(e, col.key)}
                            onDragLeave={(e) => handleDragLeave(e, col.key)}
                            onDrop={(e) => handleDrop(e, col.key)}
                            className={`rounded-2xl p-3 flex flex-col gap-2.5 min-h-[460px] transition-all duration-150 ${
                                isDragTarget
                                    ? 'bg-blue-50/90 border-2 border-dashed border-blue-400 ring-2 ring-blue-500/20'
                                    : 'bg-[#F1F2F4] border border-slate-200/80 shadow-2xs'
                            }`}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between px-1.5 py-1">
                                <div className="flex items-center gap-2">
                                    <span className={`size-2 rounded-full ${col.colorDot}`} />
                                    <h4 className="text-xs font-bold text-slate-800 tracking-tight">{col.title}</h4>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.headerBadge}`}>
                                    {tasks.length}
                                </span>
                            </div>

                            {/* Cards Stack */}
                            <div className="flex flex-col gap-2.5 flex-1">
                                {tasks.length === 0 && !isAddingHere && (
                                    <div className="h-28 flex flex-col items-center justify-center text-center p-3 rounded-xl border border-dashed border-slate-300 text-slate-400">
                                        <p className="text-[11px] font-medium">Belum ada kartu di kolom ini</p>
                                        {canEdit && (
                                            <button
                                                onClick={() => {
                                                    setInlineAddingCol(col.key);
                                                    setInlineTitle('');
                                                }}
                                                className="mt-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                                            >
                                                + Tambah kartu
                                            </button>
                                        )}
                                    </div>
                                )}

                                {tasks.map((task: any) => {
                                    const priority = priorityConfig[task.priority] || priorityConfig.medium;
                                    const isBeingDragged = draggedTaskId === task.id;

                                    return (
                                        <div
                                            key={task.id}
                                            draggable={canEdit}
                                            onDragStart={(e) => handleDragStart(e, task.id, col.key)}
                                            onClick={() => openCardModal(task)}
                                            className={`group bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative flex flex-col gap-2 select-none ${
                                                isBeingDragged ? 'opacity-40 scale-95 border-blue-400' : ''
                                            }`}
                                        >
                                            {/* Priority Label Strip (Trello Style) */}
                                            <div className="flex items-center justify-between gap-1">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priority.badgeCls}`}
                                                >
                                                    <span className={`size-1.5 rounded-full ${priority.dotCls}`} />
                                                    <span>{priority.label}</span>
                                                </span>

                                                {/* Hover Edit Pencil */}
                                                {canEdit && (
                                                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openCardModal(task);
                                                            }}
                                                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                                                            title="Edit Kartu"
                                                        >
                                                            <Edit3 className="size-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTask(task.id, col.key);
                                                            }}
                                                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                                                            title="Hapus Kartu"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Title */}
                                            <h5 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug break-words">
                                                {task.title}
                                            </h5>

                                            {/* Description snippet if present */}
                                            {task.description && (
                                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed flex items-start gap-1">
                                                    <AlignLeft className="size-3 text-slate-400 shrink-0 mt-0.5" />
                                                    <span>{task.description}</span>
                                                </p>
                                            )}

                                            {/* Card Footer: Assignee, Due Date & Fast Move */}
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                                                {/* Assignee Avatar */}
                                                <div className="flex items-center gap-1.5">
                                                    <div className="size-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                                                        {task.assignee?.name
                                                            ? task.assignee.name.substring(0, 1).toUpperCase()
                                                            : '?'}
                                                    </div>
                                                    <span className="text-[10px] text-slate-600 font-medium truncate max-w-[80px]">
                                                        {task.assignee?.name?.split(' ')[0] || 'Unassigned'}
                                                    </span>
                                                </div>

                                                {/* Due Date or Fast Shift */}
                                                <div className="flex items-center gap-1">
                                                    {task.due_on && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                            <Clock className="size-2.5 text-slate-400" />
                                                            <span>{task.due_on}</span>
                                                        </span>
                                                    )}

                                                    {/* Quick Move for mobile or click lovers */}
                                                    {canEdit && (
                                                        <select
                                                            value={col.key}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handleMoveStatus(task, e.target.value as ColumnKey);
                                                            }}
                                                            className="text-[10px] bg-slate-50 border border-slate-200/90 rounded-md px-1 py-0.5 font-bold text-slate-600 focus:outline-none hover:bg-slate-100 cursor-pointer"
                                                        >
                                                            <option value="todo">To-Do</option>
                                                            <option value="in_progress">In Progress</option>
                                                            <option value="in_review">Review</option>
                                                            <option value="completed">Done</option>
                                                        </select>
                                                    )}
                                                </div>
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
                            {canEdit && !isAddingHere && (
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

            {/* CARD DETAIL & EDIT MODAL (Trello Card View) */}
            {activeTaskModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
                    <div
                        className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <FolderKanban className="size-5 text-blue-600 shrink-0" />
                                <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Rincian Kartu Tugas
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        Di kolom: <strong className="text-slate-800">{columns.find((c) => c.key === activeTaskModal.status)?.title}</strong>
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTaskModal(null)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCardModal} className="flex flex-col gap-4">
                            {/* Judul Tugas */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Kartu</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    required
                                    placeholder="Contoh: Desain wireframe halaman profil"
                                    className="w-full text-xs font-bold text-slate-900 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            {/* Deskripsi Lengkap */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Pengerjaan</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={4}
                                    placeholder="Jelaskan instruksi tugas, kriteria pengerjaan, atau link referensi..."
                                    className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                                />
                            </div>

                            {/* Options Grid: Status, Prioritas, Penanggung Jawab, Deadline */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Kolom Status</label>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value as ColumnKey)}
                                        className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white font-medium"
                                    >
                                        <option value="todo">Belum Dikerjakan (To-Do)</option>
                                        <option value="in_progress">Sedang Dikerjakan</option>
                                        <option value="in_review">Ulasan & QA</option>
                                        <option value="completed">Selesai (Done)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Prioritas (Label)</label>
                                    <select
                                        value={editPriority}
                                        onChange={(e) => setEditPriority(e.target.value)}
                                        className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white font-medium"
                                    >
                                        <option value="low">Rendah (Low)</option>
                                        <option value="medium">Menengah (Medium)</option>
                                        <option value="high">Tinggi (High)</option>
                                        <option value="urgent">Mendesak (Urgent)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Anggota Pelaksana</label>
                                    <select
                                        value={editAssigneeId}
                                        onChange={(e) => setEditAssigneeId(e.target.value)}
                                        className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white font-medium"
                                    >
                                        <option value="">Belum Ditugaskan</option>
                                        {teamMembers.map((m: any) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Batas Waktu (Due Date)</label>
                                    <input
                                        type="date"
                                        value={editDueOn}
                                        onChange={(e) => setEditDueOn(e.target.value)}
                                        className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white font-medium"
                                    />
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                                <button
                                    type="button"
                                    onClick={() => handleDeleteTask(activeTaskModal.id, activeTaskModal.status)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                                >
                                    <Trash2 className="size-3.5" />
                                    <span>Hapus Kartu</span>
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTaskModal(null)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                                    >
                                        Tutup
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modalSubmitting || !editTitle.trim()}
                                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                                    >
                                        {modalSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
