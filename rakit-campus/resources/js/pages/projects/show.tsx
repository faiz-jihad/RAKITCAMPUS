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
        if (!project.team?.recruitment?.id) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/v1/recruitments/${project.team.recruitment.id}/apply`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    recruitment_role_id: applyingRole?.id,
                    message: applyMessage,
                }),
            });

            const json = await res.json();
            if (res.ok) {
                alert('Lamaran Anda berhasil dikirim! Ketua tim akan meninjau profil dan keahlian Anda.');
                setApplyingRole(null);
                setApplyMessage('');
                window.location.reload();
            } else {
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
            const res = await fetch(`/api/v1/applications/${appId}/decide`, {
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

            const json = await res.json();
            if (res.ok) {
                setApplications((prev: any[]) =>
                    prev.map((a: any) =>
                        a.id === appId ? { ...a, status: action === 'accept' ? 'accepted' : 'rejected' } : a
                    )
                );
                alert(json.message || `Aplikasi berhasil di-${action === 'accept' ? 'terima' : 'tolak'}.`);
                if (action === 'accept') {
                    window.location.reload();
                }
            } else {
                alert(json.message || 'Gagal memproses aplikasi.');
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

            <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F8F6FF] relative text-[#0E121B] pb-24">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-gradient-to-b from-[#5448EE]/10 to-transparent blur-3xl pointer-events-none -z-0" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-6">
                    {/* Top navigation row */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-600 hover:text-[#5448EE] hover:border-[#5448EE]/30 shadow-2xs transition"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Project Hub</span>
                        </Link>

                        <button
                            onClick={toggleBookmark}
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full border transition ${
                                bookmarked
                                    ? 'bg-[#EEEDFD] text-[#5448EE] border-[#5448EE]/30'
                                    : 'bg-white text-neutral-700 border-neutral-200/80 hover:bg-neutral-50'
                            }`}
                        >
                            <Bookmark className="size-3.5" />
                            <span>{bookmarked ? 'Tersimpan di Profil' : 'Simpan Proyek'}</span>
                        </button>
                    </div>

                    {/* Hero Project Card */}
                    <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] border border-[#5448EE]/20">
                                {project.category?.replace('_', ' ')}
                            </span>
                            <span className="text-xs px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 font-semibold capitalize border border-neutral-200/60">
                                Status: {project.status?.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-neutral-500 font-medium ml-auto">
                                {project.campus?.name}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0E121B] leading-tight">
                            {project.title}
                        </h1>
                        <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
                            {project.short_description}
                        </p>

                        {/* Metadata row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-100 text-xs">
                            <div>
                                <span className="text-neutral-400 block mb-0.5 text-[11px] font-semibold uppercase tracking-wider">
                                    Project Leader
                                </span>
                                <span className="font-bold text-neutral-900">{project.leader?.name}</span>
                            </div>
                            <div>
                                <span className="text-neutral-400 block mb-0.5 text-[11px] font-semibold uppercase tracking-wider">
                                    Progress Proyek
                                </span>
                                <span className="font-bold text-neutral-900">{project.progress}% Selesai</span>
                            </div>
                            <div>
                                <span className="text-neutral-400 block mb-0.5 text-[11px] font-semibold uppercase tracking-wider">
                                    Kapasitas Tim
                                </span>
                                <span className="font-bold text-neutral-900">
                                    {project.team?.members?.length || 1} / {project.team?.capacity || 5} Orang
                                </span>
                            </div>
                            <div>
                                <span className="text-neutral-400 block mb-0.5 text-[11px] font-semibold uppercase tracking-wider">
                                    Visibilitas
                                </span>
                                <span className="font-bold text-neutral-900 capitalize">
                                    {project.visibility || 'Kampus'}
                                </span>
                            </div>
                        </div>

                        {/* Action buttons row */}
                        <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                            {isLeader && project.status !== 'completed' && (
                                <button
                                    onClick={handleCompleteProject}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs shadow-xs transition"
                                >
                                    <CheckCircle2 className="size-3.5" />
                                    <span>Tandai Proyek Selesai</span>
                                </button>
                            )}
                            {isMember && (
                                <Link
                                    href={`/workspace/${project.team?.id}`}
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#5448EE] hover:bg-[#4336D9] text-white rounded-full font-bold text-xs shadow-md shadow-[#5448EE]/20 transition"
                                >
                                    <FolderKanban className="size-3.5" />
                                    <span>Buka Papan Kanban Tim</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Bento Grid: Main Content & Sidebar */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Details (Left 2 cols) */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* Lecturer Guidance Note (if exists) */}
                            {project.lecturer_notes && (
                                <div className="rounded-3xl bg-gradient-to-r from-[#FAF8FF] to-[#F1EEFD] border border-[#5448EE]/30 p-6 shadow-xs">
                                    <div className="flex items-center gap-2 mb-2">
                                        <GraduationCap className="size-4 text-[#5448EE]" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5448EE]">
                                            Catatan Bimbingan & Evaluasi Dosen
                                        </h3>
                                        {project.lecturer_evaluation && (
                                            <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5448EE] text-white">
                                                {project.lecturer_evaluation}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-800 whitespace-pre-line leading-relaxed">
                                        {project.lecturer_notes}
                                    </p>
                                </div>
                            )}

                            {/* Leader Management: Incoming Applications */}
                            {isLeader && applications.length > 0 && (
                                <div className="rounded-3xl bg-white border-2 border-[#5448EE]/30 p-6 shadow-xs">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                                        <div>
                                            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                                <UserCheck className="size-4 text-[#5448EE]" />
                                                <span>Aplikasi Pelamar Calon Anggota ({applications.length})</span>
                                            </h3>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                Tinjau pesan dan profil mahasiswa yang melamar posisi di proyek ini.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {applications.map((app: any) => (
                                            <div
                                                key={app.id}
                                                className="p-4 border border-neutral-200 rounded-2xl bg-neutral-50/70 flex flex-col gap-2"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>
                                                        <span className="text-xs font-bold text-neutral-900">{app.applicant?.name}</span>
                                                        <span className="text-[11px] text-neutral-500 ml-2">({app.applicant?.email})</span>
                                                        <div className="text-[11px] text-[#5448EE] font-semibold mt-0.5">
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
                                                    <div className="text-xs text-neutral-700 bg-white p-3 rounded-xl border border-neutral-200/70 mt-1 italic">
                                                        "{app.message}"
                                                    </div>
                                                )}

                                                {app.status === 'submitted' && (
                                                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-neutral-200">
                                                        <button
                                                            onClick={() => handleDecideApplication(app.id, 'reject')}
                                                            disabled={decidingId === app.id}
                                                            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-neutral-200 rounded-full text-xs font-bold transition disabled:opacity-50"
                                                        >
                                                            <XCircle className="size-3.5" />
                                                            <span>Tolak</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDecideApplication(app.id, 'accept')}
                                                            disabled={decidingId === app.id}
                                                            className="inline-flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition disabled:opacity-50 shadow-xs"
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
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 shadow-xs">
                                    <h3 className="text-sm font-bold text-[#0E121B] mb-2">
                                        Permasalahan yang Diselesaikan
                                    </h3>
                                    <p className="text-xs text-neutral-600 whitespace-pre-line leading-relaxed">
                                        {project.problem_statement}
                                    </p>
                                </div>
                            )}

                            {/* Solusi & Pendekatan */}
                            {project.proposed_solution && (
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 shadow-xs">
                                    <h3 className="text-sm font-bold text-[#0E121B] mb-2">
                                        Solusi & Pendekatan Teknis
                                    </h3>
                                    <p className="text-xs text-neutral-600 whitespace-pre-line leading-relaxed">
                                        {project.proposed_solution}
                                    </p>
                                </div>
                            )}

                            {/* Deskripsi Lengkap */}
                            {project.description && (
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 shadow-xs">
                                    <h3 className="text-sm font-bold text-[#0E121B] mb-2">
                                        Deskripsi Lengkap Proyek
                                    </h3>
                                    <p className="text-xs text-neutral-600 whitespace-pre-line leading-relaxed">
                                        {project.description}
                                    </p>
                                </div>
                            )}

                            {/* Open Recruitment Roles */}
                            {project.team?.recruitment && (
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 shadow-xs">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                                        <div>
                                            <h3 className="text-sm font-bold text-[#0E121B]">
                                                Lowongan Posisi Terbuka
                                            </h3>
                                            <p className="text-xs text-neutral-500 mt-0.5">{project.team.recruitment.title}</p>
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
                                                    className="text-xs text-[#5448EE] hover:underline font-bold"
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
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-neutral-200/80 rounded-2xl bg-neutral-50/60 gap-3"
                                            >
                                                <div>
                                                    <h4 className="text-xs font-bold text-[#0E121B]">{role.name}</h4>
                                                    <p className="text-[11px] text-neutral-500 mt-0.5">
                                                        Kebutuhan: {role.slots} slot • {role.requirements || 'Keahlian teknis relevan'}
                                                    </p>
                                                </div>

                                                {!isMember && project.team.recruitment.status === 'open' && (
                                                    <button
                                                        onClick={() => setApplyingRole(role)}
                                                        className="px-4 py-2 bg-[#5448EE] hover:bg-[#4336D9] text-white rounded-full text-xs font-bold transition shadow-xs self-start sm:self-auto shrink-0"
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
                            <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 shadow-xs">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                                    Teknologi & Tools
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {project.tech_stack?.map((t: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-neutral-100 text-neutral-800 text-xs rounded-full font-semibold">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Required Skills Card */}
                            {project.skills && project.skills.length > 0 && (
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 shadow-xs">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                                        Kebutuhan Keahlian
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.skills.map((s: any) => (
                                            <span key={s.id} className="px-2.5 py-1 bg-[#EEEDFD] text-[#5448EE] border border-[#5448EE]/20 text-xs rounded-lg font-bold">
                                                {s.name} (Min: {s.pivot?.min_proficiency || 1}/5)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Team Members Roster */}
                            <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 shadow-xs">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                                    Anggota Tim ({project.team?.members?.length || 1} Orang)
                                </h3>
                                <div className="flex flex-col gap-2.5">
                                    {project.team?.members?.map((m: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-neutral-50">
                                            <div className="size-8 rounded-full bg-[#EEEDFD] text-[#5448EE] flex items-center justify-center font-bold text-xs shrink-0">
                                                {m.user?.name?.charAt(0) || 'M'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h5 className="text-xs font-bold text-[#0E121B] truncate">{m.user?.name}</h5>
                                                <span className="text-[10px] text-neutral-400 block">{m.role_name || 'Anggota'}</span>
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
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-xs font-bold text-[#5448EE] uppercase tracking-wider block mb-1">
                                    Lamaran Posisi Tim
                                </span>
                                <h3 className="text-lg font-bold text-[#0E121B]">
                                    Lamar sebagai {applyingRole.name}
                                </h3>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    Kirim pesan perkenalan singkat kepada ketua tim proyek.
                                </p>
                            </div>
                            <button
                                onClick={() => setApplyingRole(null)}
                                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleApply} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-700 mb-1">
                                    Pesan Singkat & Portofolio Relevan *
                                </label>
                                <textarea
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Jelaskan pengalaman teknis Anda, teknologi yang pernah Anda gunakan, dan komitmen waktu per minggu..."
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => setApplyingRole(null)}
                                    className="px-4 py-2 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-bold transition disabled:opacity-50 shadow-xs"
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
