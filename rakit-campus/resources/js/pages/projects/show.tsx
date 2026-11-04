import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Bookmark,
    Check,
    CheckCircle2,
    Clock,
    ExternalLink,
    FolderKanban,
    GraduationCap,
    Layers,
    Send,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    project: any;
    isBookmarked: boolean;
    isLeader: boolean;
    isMember: boolean;
    canEdit: boolean;
    applications?: any[];
}

export default function ProjectShow({
    project,
    isBookmarked: initialBookmarked,
    isLeader,
    isMember,
    canEdit,
    applications: initialApplications = [],
}: Props) {
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [applications, setApplications] = useState(initialApplications);
    const [applyingRole, setApplyingRole] = useState<any>(null);
    const [applyMessage, setApplyMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [decidingId, setDecidingId] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Project Hub', href: '/projects' },
        { title: project.title, href: `/projects/${project.id}` },
    ];

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const toggleBookmark = async () => {
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/bookmark`, {
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
            setBookmarked(json.bookmarked);
        } catch {
            alert('Gagal memperbarui bookmark.');
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/projects/${project.id}/apply`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    recruitment_role_id: applyingRole?.id || null,
                    message: applyMessage,
                }),
            });

            if (res.ok) {
                alert('Lamaran kamu berhasil dikirim ke ketua tim!');
                setApplyingRole(null);
                setApplyMessage('');
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal mengirimkan lamaran.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecideApplication = async (appId: number, action: 'accept' | 'reject') => {
        setDecidingId(appId);
        try {
            const res = await fetch(`/projects/${project.id}/applications/${appId}/respond`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                setApplications((prev: any[]) =>
                    prev.map((a: any) =>
                        a.id === appId ? { ...a, status: action === 'accept' ? 'accepted' : 'rejected' } : a
                    )
                );
                alert(`Lamaran berhasil di-${action === 'accept' ? 'terima' : 'tolak'}.`);
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal memproses lamaran.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setDecidingId(null);
        }
    };

    const handleCompleteProject = async () => {
        if (!confirm('Tandai proyek ini sebagai selesai? Seluruh anggota tim akan menerima pencapaian portofolio terverifikasi.')) return;
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/complete`, {
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
                alert('Proyek berhasil diselesaikan! Sertifikat pencapaian otomatis masuk ke portofolio tim.');
                window.location.reload();
            } else {
                alert(json.message || 'Gagal menyelesaikan proyek.');
            }
        } catch {
            alert('Terjadi kesalahan.');
        }
    };

    const handleToggleRecruitment = async (newStatus: 'open' | 'closed') => {
        if (!project.team?.id) return;
        try {
            const res = await fetch(`/api/v1/teams/${project.team.id}/recruitment`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const json = await res.json();
            if (res.ok) {
                alert(`Rekrutmen proyek berhasil di-${newStatus === 'open' ? 'buka' : 'tutup'}.`);
                window.location.reload();
            } else {
                alert(json.message || 'Gagal mengubah status rekrutmen.');
            }
        } catch {
            alert('Terjadi kesalahan.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.title} — RAKIT Campus`} />

            {/* Modern Glassmorphic Canvas */}
            <div className="min-h-screen bg-[#F8FAFC] relative text-slate-900 pb-24 overflow-hidden font-sans">
                {/* Natural ambient light diffusion */}
                <div className="pointer-events-none absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-blue-100/50 blur-[110px]" />
                <div className="pointer-events-none absolute top-48 -right-20 h-[380px] w-[380px] rounded-full bg-slate-200/50 blur-[100px]" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-6">
                    {/* Top navigation row */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-2xs transition"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Project Hub</span>
                        </Link>

                        <button
                            onClick={toggleBookmark}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                                bookmarked
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <Bookmark className="size-3.5" />
                            <span>{bookmarked ? 'Tersimpan di Profil' : 'Simpan Proyek'}</span>
                        </button>
                    </div>

                    {/* Hero Project Card — Glass Surface */}
                    <div className="glass-surface rounded-3xl p-6 sm:p-8">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                {project.category?.replace('_', ' ')}
                            </span>
                            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold capitalize border border-slate-200/60">
                                Status: {project.status?.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-500 font-medium ml-auto">
                                {project.campus?.name}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                            {project.title}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                            {project.short_description}
                        </p>

                        {/* Metadata row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
                            <div>
                                <span className="text-slate-400 block mb-0.5 text-[11px] font-semibold uppercase tracking-wider">
                                    Project Leader
                                </span>
                                <span className="font-bold text-slate-900">{project.leader?.name}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5 text-[11px] font-semibold uppercase tracking-wider">
                                    Progress Proyek
                                </span>
                                <span className="font-bold text-slate-900">{project.progress}% Selesai</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5 text-[11px] font-semibold uppercase tracking-wider">
                                    Kapasitas Tim
                                </span>
                                <span className="font-bold text-slate-900">
                                    {project.team?.members?.length || 1} / {project.team?.capacity || 5} Orang
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5 text-[11px] font-semibold uppercase tracking-wider">
                                    Visibilitas
                                </span>
                                <span className="font-bold text-slate-900 capitalize">
                                    {project.visibility || 'Kampus'}
                                </span>
                            </div>
                        </div>

                        {/* Action buttons row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
                            {project.academic_class ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-medium">
                                    <GraduationCap className="size-3.5 text-blue-600" />
                                    <span>Tugas Mata Kuliah: <strong>{project.academic_class.name}</strong></span>
                                </div>
                            ) : <div />}

                            <div className="flex items-center gap-3">
                                {isLeader && project.status !== 'completed' && (
                                    <button
                                        onClick={handleCompleteProject}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                                    >
                                        <CheckCircle2 className="size-3.5" />
                                        <span>Tandai Proyek Selesai</span>
                                    </button>
                                )}
                                {!isMember && (
                                    <button
                                        onClick={() => setApplyingRole(project.team?.recruitment?.roles?.[0] || { id: null, name: 'Anggota Tim Pengembang' })}
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                                    >
                                        <Send className="size-3.5" />
                                        <span>Lamar Posisi / Gabung Tim</span>
                                    </button>
                                )}
                                {isMember && (
                                    <Link
                                        href={`/workspace/${project.team?.id}`}
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs transition"
                                    >
                                        <FolderKanban className="size-3.5" />
                                        <span>Buka Ruang Kerja Tim</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bento Grid: Main Content & Sidebar */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Details (Left 2 cols) */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* Lecturer Guidance Note (if exists) */}
                            {project.lecturer_notes && (
                                <div className="glass-card rounded-2xl bg-blue-50/40 border-blue-200/80 p-5 shadow-xs">
                                    <div className="flex items-center gap-2 mb-2">
                                        <GraduationCap className="size-4 text-blue-600" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">
                                            Catatan Bimbingan & Evaluasi Dosen
                                        </h3>
                                        {project.lecturer_evaluation && (
                                            <span className="ml-auto px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white">
                                                {project.lecturer_evaluation}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                                        {project.lecturer_notes}
                                    </p>
                                </div>
                            )}

                            {/* Leader Management: Incoming Applications */}
                            {isLeader && applications.length > 0 && (
                                <div className="glass-card rounded-2xl p-6 shadow-xs">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <UserCheck className="size-4 text-blue-600" />
                                                <span>Aplikasi Pelamar Calon Anggota ({applications.length})</span>
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Tinjau pesan dan profil mahasiswa yang melamar posisi di proyek ini.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {applications.map((app: any) => (
                                            <div
                                                key={app.id}
                                                className="p-4 border border-slate-200 rounded-xl bg-white/70 flex flex-col gap-2"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-900">{app.user?.name || app.applicant?.name || 'Mahasiswa'}</span>
                                                        <span className="text-[11px] text-slate-500 ml-2">({app.user?.email || app.applicant?.email})</span>
                                                        <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                                                            Melamar Posisi: {app.role?.name || 'Anggota Tim'}
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                                                        app.status === 'accepted'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : app.status === 'rejected'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {app.status}
                                                    </span>
                                                </div>

                                                {app.message && (
                                                    <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70 mt-1 italic">
                                                        "{app.message}"
                                                    </div>
                                                )}

                                                {(app.status === 'pending' || app.status === 'submitted') && (
                                                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-200">
                                                        <button
                                                            onClick={() => handleDecideApplication(app.id, 'reject')}
                                                            disabled={decidingId === app.id}
                                                            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <XCircle className="size-3.5" />
                                                            <span>Tolak</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDecideApplication(app.id, 'accept')}
                                                            disabled={decidingId === app.id}
                                                            className="inline-flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                                                        >
                                                            <Check className="size-3.5" />
                                                            <span>Terima Jadi Anggota</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Permasalahan */}
                            {project.problem_statement && (
                                <div className="glass-card rounded-2xl p-6 shadow-xs">
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                                        Permasalahan yang Diselesaikan
                                    </h3>
                                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                                        {project.problem_statement}
                                    </p>
                                </div>
                            )}

                            {/* Solusi & Pendekatan */}
                            {project.proposed_solution && (
                                <div className="glass-card rounded-2xl p-6 shadow-xs">
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                                        Solusi & Pendekatan Teknis
                                    </h3>
                                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                                        {project.proposed_solution}
                                    </p>
                                </div>
                            )}

                            {/* Deskripsi Lengkap */}
                            {project.description && (
                                <div className="glass-card rounded-2xl p-6 shadow-xs">
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                                        Deskripsi Lengkap Proyek
                                    </h3>
                                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                                        {project.description}
                                    </p>
                                </div>
                            )}

                            {/* Open Recruitment Roles */}
                            {project.team?.recruitment && (
                                <div className="glass-card rounded-2xl p-6 shadow-xs">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Lowongan Posisi Terbuka
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">{project.team.recruitment.title}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                                {project.team.recruitment.status}
                                            </span>
                                            {isLeader && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleRecruitment(
                                                            project.team.recruitment.status === 'open' ? 'closed' : 'open'
                                                        )
                                                    }
                                                    className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                                                >
                                                    {project.team.recruitment.status === 'open'
                                                        ? 'Tutup Rekrutmen'
                                                        : 'Buka Rekrutmen'}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {project.team.recruitment.roles?.map((role: any) => (
                                            <div
                                                key={role.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl bg-white/70 gap-3"
                                            >
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-900">{role.name}</h4>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        Kebutuhan: {role.slots} slot • {role.requirements || 'Keahlian teknis relevan'}
                                                    </p>
                                                </div>

                                                {!isMember && project.team.recruitment.status === 'open' && (
                                                    <button
                                                        onClick={() => setApplyingRole(role)}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto shrink-0 cursor-pointer"
                                                    >
                                                        Lamar Posisi Ini
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Info (Right 1 col) */}
                        <div className="flex flex-col gap-6">
                            {/* Tech Stack Card */}
                            <div className="glass-card rounded-2xl p-6 shadow-xs">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                    Teknologi & Tools
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {project.tech_stack?.map((t: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-800 text-xs rounded-lg font-semibold border border-slate-200/60">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Required Skills Card */}
                            {project.skills && project.skills.length > 0 && (
                                <div className="glass-card rounded-2xl p-6 shadow-xs">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                        Kebutuhan Keahlian
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.skills.map((s: any) => (
                                            <span key={s.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 text-xs rounded-md font-bold">
                                                {s.name} (Min: {s.pivot?.min_proficiency || 1}/5)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Team Members Roster */}
                            <div className="glass-card rounded-2xl p-6 shadow-xs">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                    Anggota Tim ({project.team?.members?.length || 1} Orang)
                                </h3>
                                <div className="flex flex-col gap-2.5">
                                    {project.team?.members?.map((m: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/70 border border-slate-200/60">
                                            <div className="size-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                {m.user?.name?.charAt(0) || 'M'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h5 className="text-xs font-bold text-slate-900 truncate">{m.user?.name}</h5>
                                                <span className="text-[10px] text-slate-400 block">{m.role_name || 'Anggota'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* APPLY ROLE MODAL */}
            {applyingRole && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-surface bg-white/95 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                                    Lamaran Posisi Tim
                                </span>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Lamar sebagai {applyingRole.name}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Kirim pesan perkenalan singkat kepada ketua tim proyek.
                                </p>
                            </div>
                            <button
                                onClick={() => setApplyingRole(null)}
                                className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleApply} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Pesan Singkat & Portofolio Relevan *
                                </label>
                                <textarea
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Jelaskan pengalaman teknis Anda, teknologi yang pernah Anda gunakan, dan komitmen waktu per minggu..."
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setApplyingRole(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                                >
                                    {submitting ? 'Mengirim...' : 'Kirim Lamaran'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
