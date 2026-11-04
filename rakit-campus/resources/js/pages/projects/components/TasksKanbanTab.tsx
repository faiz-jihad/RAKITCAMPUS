import { useState } from 'react';
import {
    CheckCircle2,
    Clock,
    FolderKanban,
    Plus,
    User,
    AlertCircle,
    ArrowRight,
    Trash2,
    Layers,
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

export default function TasksKanbanTab({ project, kanban, isMember, isLeader }: Props) {
    const teamId = project.team?.id;
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('todo');
    const [submitting, setSubmitting] = useState(false);

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamId) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/workspace/${teamId}/tasks`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    title,
                    description,
                    priority,
                    status,
                }),
            });
            if (res.ok) {
                setShowAddTaskModal(false);
                setTitle('');
                setDescription('');
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal menambahkan tugas.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMoveStatus = async (taskId: number, newStatus: string) => {
        if (!teamId) return;
        try {
            const res = await fetch(`/workspace/${teamId}/tasks/${taskId}`, {
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
                window.location.reload();
            }
        } catch {
            alert('Gagal memperbarui status tugas.');
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!teamId || !confirm('Hapus tugas ini dari Kanban board?')) return;
        try {
            const res = await fetch(`/workspace/${teamId}/tasks/${taskId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch {
            alert('Gagal menghapus tugas.');
        }
    };

    const columns = [
        { key: 'todo', label: 'Belum Dikerjakan (To-Do)', items: kanban.todo || [], color: 'bg-slate-100 text-slate-700' },
        { key: 'in_progress', label: 'Sedang Dikerjakan', items: kanban.in_progress || [], color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { key: 'in_review', label: 'Tinjauan / QA Testing', items: kanban.in_review || [], color: 'bg-amber-50 text-amber-700 border-amber-200' },
        { key: 'completed', label: 'Selesai (Done)', items: kanban.completed || [], color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ];

    const totalTasks = (kanban.todo?.length || 0) + (kanban.in_progress?.length || 0) + (kanban.in_review?.length || 0) + (kanban.completed?.length || 0);
    const completedTasks = kanban.completed?.length || 0;
    const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <FolderKanban className="size-5 text-blue-600" />
                        <span>Project Implementation Kanban Board</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Manajemen tugas tim capstone berjalan beriringan dengan penyempurnaan proposal sepanjang semester.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">
                        Penyelesaian Tugas: <strong className="text-emerald-700 font-black">{completedTasks}/{totalTasks} ({taskPercent}%)</strong>
                    </span>

                    {(isMember || isLeader) && teamId && (
                        <button
                            onClick={() => setShowAddTaskModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Tambah Tugas</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 4-Column Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {columns.map((col) => (
                    <div
                        key={col.key}
                        className="glass-card rounded-2xl p-4 flex flex-col gap-3 min-h-[350px] bg-slate-50/50"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                            <span className="text-xs font-bold text-slate-800">
                                {col.label}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                                {col.items.length}
                            </span>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                            {col.items.length === 0 ? (
                                <div className="h-28 flex items-center justify-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                    Tidak ada tugas
                                </div>
                            ) : (
                                col.items.map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2 hover:border-blue-300 transition"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                                                {task.title}
                                            </h4>
                                            {(isMember || isLeader) && (
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="text-slate-300 hover:text-rose-500 transition cursor-pointer"
                                                    title="Hapus Tugas"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {task.description && (
                                            <p className="text-[11px] text-slate-500 line-clamp-2">
                                                {task.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                                            <span
                                                className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                                                    task.priority === 'urgent' || task.priority === 'high'
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : task.priority === 'low'
                                                        ? 'bg-slate-100 text-slate-600'
                                                        : 'bg-blue-50 text-blue-700'
                                                }`}
                                            >
                                                {task.priority}
                                            </span>

                                            {task.assignee && (
                                                <span className="text-slate-500 font-semibold truncate max-w-[100px]">
                                                    {task.assignee.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status Transition Action Buttons */}
                                        {(isMember || isLeader) && (
                                            <div className="flex items-center justify-end gap-1 pt-1">
                                                {col.key === 'todo' && (
                                                    <button
                                                        onClick={() => handleMoveStatus(task.id, 'in_progress')}
                                                        className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                                                    >
                                                        Mulai Kerjakan →
                                                    </button>
                                                )}
                                                {col.key === 'in_progress' && (
                                                    <button
                                                        onClick={() => handleMoveStatus(task.id, 'in_review')}
                                                        className="text-[10px] font-bold text-amber-600 hover:underline cursor-pointer"
                                                    >
                                                        Ajukan Review →
                                                    </button>
                                                )}
                                                {col.key === 'in_review' && (
                                                    <button
                                                        onClick={() => handleMoveStatus(task.id, 'completed')}
                                                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                                                    >
                                                        Tandai Selesai ✓
                                                    </button>
                                                )}
                                                {col.key === 'completed' && (
                                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle2 className="size-3" />
                                                        <span>Selesai</span>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal: Add Task */}
            {showAddTaskModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <form onSubmit={handleCreateTask} className="glass-surface rounded-3xl p-6 max-w-md w-full shadow-xl flex flex-col gap-4">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Plus className="size-5 text-blue-600" />
                            <span>Tambah Tugas Baru</span>
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Judul Tugas</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="Contoh: Implementasi skema tabel users & roles"
                                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Rincian backlog pengerjaan..."
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Prioritas</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Status Awal</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white"
                                >
                                    <option value="todo">To-Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="in_review">In Review</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setShowAddTaskModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                Simpan Tugas
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
