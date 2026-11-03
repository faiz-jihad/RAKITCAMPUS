import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Clock, FolderKanban, MessageSquare, MoreHorizontal, Plus, Users, Flag, ArrowRight } from 'lucide-react';
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

export default function WorkspaceShow({ team, kanban: initialKanban, activities, isLeader }: Props) {
    const [kanban, setKanban] = useState(initialKanban);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskPriority, setTaskPriority] = useState('medium');
    const [taskAssignee, setTaskAssignee] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Project Hub', href: '/projects' },
        { title: team.name, href: `/workspace/${team.id}` },
    ];

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/api/v1/teams/${team.id}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    title: taskTitle,
                    description: taskDescription,
                    priority: taskPriority,
                    assignee_id: taskAssignee ? parseInt(taskAssignee, 10) : null,
                }),
            });

            const json = await res.json();
            if (res.ok) {
                setKanban((prev) => ({
                    ...prev,
                    todo: [json.data, ...prev.todo],
                }));
                setTaskModalOpen(false);
                setTaskTitle('');
                setTaskDescription('');
            } else {
                alert(json.message || 'Gagal menambahkan tugas.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMoveStatus = async (task: any, newStatus: string) => {
        try {
            const res = await fetch(`/api/v1/tasks/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                // Refresh kanban state
                const oldCol = task.status;
                const updatedTask = { ...task, status: newStatus };

                setKanban((prev: any) => ({
                    ...prev,
                    [oldCol]: prev[oldCol].filter((t: any) => t.id !== task.id),
                    [newStatus]: [...prev[newStatus], updatedTask],
                }));
            }
        } catch {
            alert('Gagal memindahkan status tugas.');
        }
    };

    const columns = [
        { key: 'todo', label: 'To Do', color: 'border-neutral-300 text-neutral-700' },
        { key: 'in_progress', label: 'In Progress', color: 'border-blue-400 text-blue-700' },
        { key: 'in_review', label: 'In Review', color: 'border-amber-400 text-amber-700' },
        { key: 'completed', label: 'Completed', color: 'border-emerald-400 text-emerald-700' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Workspace — ${team.name}`} />

            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1 rounded bg-blue-50 text-blue-600">
                                <FolderKanban className="size-4" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{team.name}</h1>
                        </div>
                        <p className="text-xs text-neutral-500">
                            {team.project ? `Terhubung proyek: ${team.project.title}` : team.description}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setTaskModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                            <Plus className="size-4" />
                            Tambah Tugas
                        </button>
                    </div>
                </div>

                {/* Team Members Strip */}
                <div className="flex items-center justify-between p-3.5 bg-white border border-neutral-200 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Users className="size-4 text-neutral-400" />
                        <span className="text-xs font-bold text-neutral-700">Anggota Tim:</span>
                        <div className="flex flex-wrap gap-1.5 ml-2">
                            {team.members?.map((m: any) => (
                                <span
                                    key={m.id}
                                    className="text-xs bg-neutral-100 text-neutral-800 px-2.5 py-0.5 rounded-full font-medium"
                                >
                                    {m.user?.name} {m.permission === 'leader' && '👑'}
                                </span>
                            ))}
                        </div>
                    </div>

                    <span className="text-xs text-neutral-400 font-medium">
                        Kapasitas: {team.members?.length || 1} / {team.capacity}
                    </span>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    {columns.map((col) => (
                        <div
                            key={col.key}
                            className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 flex flex-col min-h-[500px]"
                        >
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200">
                                <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                                    {col.label}
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600">
                                    {(kanban as any)[col.key]?.length || 0}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2.5 flex-1">
                                {(kanban as any)[col.key]?.map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-300 shadow-xs transition"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-xs font-bold text-neutral-900 leading-snug">
                                                {task.title}
                                            </h4>
                                            <span
                                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                                    task.priority === 'urgent'
                                                        ? 'bg-red-50 text-red-600'
                                                        : task.priority === 'high'
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-neutral-100 text-neutral-600'
                                                }`}
                                            >
                                                {task.priority}
                                            </span>
                                        </div>

                                        {task.description && (
                                            <p className="text-[11px] text-neutral-500 mt-1.5 line-clamp-2">
                                                {task.description}
                                            </p>
                                        )}

                                        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                                            <span className="font-medium text-neutral-700 truncate max-w-[120px]">
                                                {task.assignee?.name || 'Belum di-assign'}
                                            </span>

                                            {/* Quick status mover dropdown */}
                                            <select
                                                value={task.status}
                                                onChange={(e) => handleMoveStatus(task, e.target.value)}
                                                className="text-[10px] bg-neutral-50 border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-700 focus:outline-none"
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="in_review">In Review</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}

                                {(kanban as any)[col.key]?.length === 0 && (
                                    <div className="flex-1 flex items-center justify-center p-4 text-center">
                                        <span className="text-[11px] text-neutral-400">Tidak ada tugas</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Task Modal */}
                {isTaskModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
                            <h3 className="text-base font-bold text-neutral-900">Buat Tugas Baru</h3>

                            <form onSubmit={handleCreateTask} className="mt-4 flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                        Judul Tugas *
                                    </label>
                                    <input
                                        type="text"
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        placeholder="Contoh: Implementasi Layar Auth di Flutter"
                                        required
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        value={taskDescription}
                                        onChange={(e) => setTaskDescription(e.target.value)}
                                        placeholder="Instruksi pengerjaan tugas..."
                                        rows={3}
                                        className="w-full p-3 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                            Prioritas
                                        </label>
                                        <select
                                            value={taskPriority}
                                            onChange={(e) => setTaskPriority(e.target.value)}
                                            className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                            Tugaskan Ke
                                        </label>
                                        <select
                                            value={taskAssignee}
                                            onChange={(e) => setTaskAssignee(e.target.value)}
                                            className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Belum Ditugaskan</option>
                                            {team.members?.map((m: any) => (
                                                <option key={m.user_id} value={m.user_id}>
                                                    {m.user?.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => setTaskModalOpen(false)}
                                        className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                                    >
                                        {submitting ? 'Menyimpan...' : 'Simpan Tugas'}
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
