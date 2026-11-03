import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Bookmark, CheckCircle2, FolderKanban, Users, Send, ExternalLink, UserCheck, XCircle, Check } from 'lucide-react';
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

    const toggleBookmark = async () => {
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/bookmark`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
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
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
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
            } else {
                alert(json.message || 'Gagal mengirim lamaran.');
            }
        } catch {
            alert('Terjadi kesalahan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecideApplication = async (appId: number, action: 'accept' | 'reject') => {
        setDecidingId(appId);
        try {
            const res = await fetch(`/api/v1/applications/${appId}/decide`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
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
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
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
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
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

            <div className="max-w-6xl mx-auto p-6 w-full flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <Link
                        href="/projects"
                        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition"
                    >
                        <ArrowLeft className="size-3.5" />
                        Kembali ke Project Hub
                    </Link>

                    <button
                        onClick={toggleBookmark}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                            bookmarked
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                        }`}
                    >
                        <Bookmark className="size-3.5" />
                        {bookmarked ? 'Tersimpan' : 'Simpan'}
                    </button>
                </div>

                {/* Hero Card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {project.category?.replace('_', ' ')}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium capitalize">
                            Status: {project.status?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-neutral-500 ml-auto">
                            {project.campus?.name}
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-neutral-900">{project.title}</h1>
                    <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{project.short_description}</p>

                    <div className="flex flex-wrap items-center gap-6 mt-6 pt-5 border-t border-neutral-100 text-xs text-neutral-600">
                        <div>
                            <span className="text-neutral-400 block mb-0.5">Project Leader</span>
                            <span className="font-semibold text-neutral-900">{project.leader?.name}</span>
                        </div>
                        <div>
                            <span className="text-neutral-400 block mb-0.5">Progress Proyek</span>
                            <span className="font-semibold text-neutral-900">{project.progress}% Selesai</span>
                        </div>
                        <div>
                            <span className="text-neutral-400 block mb-0.5">Kapasitas Tim</span>
                            <span className="font-semibold text-neutral-900">
                                {project.team?.members?.length || 1} / {project.team?.capacity || 5} Orang
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            {isLeader && project.status !== 'completed' && (
                                <button
                                    onClick={handleCompleteProject}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs shadow-xs transition"
                                >
                                    <CheckCircle2 className="size-3.5" />
                                    Tandai Proyek Selesai
                                </button>
                            )}
                            {isMember && (
                                <Link
                                    href={`/workspace/${project.team?.id}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs shadow-sm transition"
                                >
                                    <FolderKanban className="size-3.5" />
                                    Buka Workspace Tim
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Details */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Leader Management: Incoming Applications */}
                        {isLeader && applications.length > 0 && (
                            <div className="bg-white border-2 border-blue-100 rounded-xl p-5 shadow-xs">
                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                            <UserCheck className="size-4 text-blue-600" />
                                            Aplikasi Pelamar Calon Anggota ({applications.length})
                                        </h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                            Tinjau pesan dan profil pelamar yang ingin bergabung dalam tim proyek Anda.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {applications.map((app: any) => (
                                        <div
                                            key={app.id}
                                            className="p-4 border border-neutral-200 rounded-lg bg-neutral-50/70 flex flex-col gap-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-xs font-bold text-neutral-900">{app.applicant?.name}</span>
                                                    <span className="text-[11px] text-neutral-500 ml-2">({app.applicant?.email})</span>
                                                    <div className="text-[11px] text-blue-700 font-medium mt-0.5">
                                                        Melamar Posisi: <span className="font-bold">{app.role?.name || 'Anggota Tim'}</span>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${
                                                    app.status === 'accepted'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : app.status === 'rejected'
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {app.status}
                                                </span>
                                            </div>

                                            {app.message && (
                                                <div className="text-xs text-neutral-700 bg-white p-2.5 rounded border border-neutral-200 mt-1 italic">
                                                    "{app.message}"
                                                </div>
                                            )}

                                            {app.status === 'submitted' && (
                                                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-neutral-200">
                                                    <button
                                                        onClick={() => handleDecideApplication(app.id, 'reject')}
                                                        disabled={decidingId === app.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 rounded-md text-xs font-medium transition disabled:opacity-50"
                                                    >
                                                        <XCircle className="size-3" />
                                                        Tolak
                                                    </button>
                                                    <button
                                                        onClick={() => handleDecideApplication(app.id, 'accept')}
                                                        disabled={decidingId === app.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition disabled:opacity-50"
                                                    >
                                                        <Check className="size-3" />
                                                        Terima Menjadi Anggota
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {project.problem_statement && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-5">
                                <h3 className="text-sm font-bold text-neutral-900 mb-2">Permasalahan yang Diselesaikan</h3>
                                <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                                    {project.problem_statement}
                                </p>
                            </div>
                        )}

                        {project.proposed_solution && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-5">
                                <h3 className="text-sm font-bold text-neutral-900 mb-2">Solusi & Pendekatan</h3>
                                <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                                    {project.proposed_solution}
                                </p>
                            </div>
                        )}

                        <div className="bg-white border border-neutral-200 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-neutral-900 mb-3">Teknologi & Tools</h3>
                            <div className="flex flex-wrap gap-2">
                                {project.tech_stack?.map((t: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-neutral-100 text-neutral-800 text-xs rounded-md font-medium">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Open Recruitment Section */}
                        {project.team?.recruitment && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-neutral-900">Open Recruitment Tim</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">{project.team.recruitment.title}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                            {project.team.recruitment.status.toUpperCase()}
                                        </span>
                                        {isLeader && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleToggleRecruitment(
                                                        project.team.recruitment.status === 'open' ? 'closed' : 'open'
                                                    )
                                                }
                                                className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                                            >
                                                {project.team.recruitment.status === 'open'
                                                    ? 'Tutup Rekrutmen'
                                                    : 'Buka Rekrutmen'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-4">
                                    {project.team.recruitment.roles?.map((role: any) => (
                                        <div
                                            key={role.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-neutral-200 rounded-lg bg-neutral-50 gap-3"
                                        >
                                            <div>
                                                <h4 className="text-xs font-bold text-neutral-900">{role.name}</h4>
                                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                                    Kuota: {role.slots} slot • {role.requirements || 'Keahlian teknis sesuai spesifikasi'}
                                                </p>
                                            </div>

                                            {!isMember && (
                                                <button
                                                    onClick={() => setApplyingRole(role)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition self-start sm:self-auto"
                                                >
                                                    <Send className="size-3" />
                                                    Lamar Posisi
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Team & Skills */}
                    <div className="flex flex-col gap-6">
                        {/* Team Members */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                                <Users className="size-4 text-neutral-500" />
                                Anggota Tim ({project.team?.members?.length || 1})
                            </h3>
                            <div className="flex flex-col gap-3 divide-y divide-neutral-100">
                                {project.team?.members?.map((m: any) => (
                                    <div key={m.id} className="pt-2 first:pt-0 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold text-neutral-900 block">
                                                {m.user?.name}
                                            </span>
                                            <span className="text-[11px] text-neutral-500">
                                                {m.role_name || (m.permission === 'leader' ? 'Project Leader' : 'Anggota')}
                                            </span>
                                        </div>
                                        {m.permission === 'leader' && (
                                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium">
                                                Leader
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Required Skills */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-neutral-900 mb-3">Keahlian yang Dibutuhkan</h3>
                            <div className="flex flex-col gap-2">
                                {project.skills?.map((s: any) => (
                                    <div key={s.id} className="flex items-center justify-between text-xs py-1">
                                        <span className="text-neutral-700">{s.name}</span>
                                        <span className="font-medium text-neutral-500">
                                            Min. Level {s.pivot?.min_proficiency || 1}/5
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Apply Modal */}
                {applyingRole && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95">
                            <h3 className="text-base font-bold text-neutral-900">Lamar Posisi: {applyingRole.name}</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                Tuliskan alasan dan pengalaman Anda mengapa cocok untuk posisi ini dalam proyek {project.title}.
                            </p>

                            <form onSubmit={handleApply} className="mt-4 flex flex-col gap-3">
                                <textarea
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                    placeholder="Jelaskan peran Anda, pengalaman relevan, atau link portofolio..."
                                    required
                                    rows={4}
                                    className="w-full p-3 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setApplyingRole(null)}
                                        className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                                    >
                                        {submitting ? 'Mengirim...' : 'Kirim Lamaran'}
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
