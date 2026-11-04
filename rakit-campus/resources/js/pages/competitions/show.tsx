import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Bookmark,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    FolderKanban,
    Plus,
    Share2,
    ShieldCheck,
    Sparkles,
    Trophy,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    competition: any;
    isBookmarked: boolean;
    myParticipation?: any;
    myLedProjects?: any[];
    eligibilityCheck?: { eligible: boolean; reason?: string };
}

export default function CompetitionShow({
    competition,
    isBookmarked: initialBookmarked,
    myParticipation,
    myLedProjects = [],
    eligibilityCheck = { eligible: true },
}: Props) {
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [isParticipateModalOpen, setParticipateModalOpen] = useState(false);
    const [participationMode, setParticipationMode] = useState<'new_team' | 'existing_project'>('new_team');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [teamName, setTeamName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Competition Hub', href: '/competitions' },
        { title: competition.name, href: `/competitions/${competition.id}` },
    ];

    const toggleBookmark = () => {
        router.post(route('competitions.bookmark', competition.id), {}, {
            preserveScroll: true,
            onSuccess: () => setBookmarked(!bookmarked),
        });
    };

    const handleVerify = () => {
        if (confirm(`Verifikasi kompetisi '${competition.name}' dan publikasikan secara resmi?`)) {
            router.post(route('competitions.verify', competition.id));
        }
    };

    const handleCreateParticipation = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload: any = {
            team_name: teamName,
            description: description,
        };

        if (participationMode === 'existing_project' && selectedProjectId) {
            payload.project_id = parseInt(selectedProjectId, 10);
            const chosenProj = myLedProjects.find((p) => p.id === parseInt(selectedProjectId, 10));
            if (chosenProj && !teamName) {
                payload.team_name = chosenProj.title;
            }
        }

        router.post(route('competitions.participate', competition.id), payload, {
            onFinish: () => setSubmitting(false),
            onSuccess: () => setParticipateModalOpen(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${competition.name} — RAKIT Campus`} />

            <div className="min-h-screen bg-[#F8FAFC] relative text-slate-900 pb-24 overflow-hidden">
                <div className="pointer-events-none absolute -top-24 -left-20 h-[480px] w-[480px] rounded-full bg-blue-100/50 blur-[110px]" />
                <div className="pointer-events-none absolute top-48 -right-20 h-[380px] w-[380px] rounded-full bg-amber-100/40 blur-[100px]" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-6">
                    {/* Top Navigation Row */}
                    <div className="flex items-center justify-between">
                        <Link
                            href={route('competitions.index')}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-600 hover:text-blue-600 shadow-2xs transition"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Competition Hub</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            {competition.verification_status !== 'verified' && (
                                <button
                                    onClick={handleVerify}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                    <ShieldCheck className="size-3.5" />
                                    <span>Verifikasi & Publikasikan</span>
                                </button>
                            )}

                            <button
                                onClick={toggleBookmark}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border shadow-2xs transition cursor-pointer ${
                                    bookmarked
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <Bookmark className="size-3.5" />
                                <span>{bookmarked ? 'Tersimpan' : 'Simpan Lomba'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Hero Header Card */}
                    <div className="glass-surface rounded-3xl p-6 sm:p-10 bg-white/85 relative overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80">
                                {competition.category?.replace('_', ' ')}
                            </span>
                            {competition.level && (
                                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
                                    Tingkat: {competition.level}
                                </span>
                            )}
                            {competition.verification_status === 'verified' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    <ShieldCheck className="size-3.5" />
                                    <span>Terverifikasi Resmi</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                    <Clock className="size-3.5" />
                                    <span>Menunggu Verifikasi</span>
                                </span>
                            )}
                            <span className="text-xs text-slate-500 ml-auto hidden sm:inline-block">
                                Penyelenggara: <strong className="text-slate-800">{competition.organizer}</strong>
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                            {competition.name}
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed max-w-4xl">
                            {competition.description || 'Peluang prestasi mahasiswa untuk berkolaborasi dan berkompetisi di kancah regional maupun nasional.'}
                        </p>

                        {/* Meta Highlights Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                                    <Calendar className="size-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 font-medium block">Batas Pendaftaran</span>
                                    <span className="text-xs font-bold text-slate-900">
                                        {competition.registration_deadline
                                            ? new Date(competition.registration_deadline).toLocaleDateString('id-ID', {
                                                  day: 'numeric',
                                                  month: 'long',
                                                  year: 'numeric',
                                              })
                                            : 'Terbuka'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 font-medium block">Ukuran Tim</span>
                                    <span className="text-xs font-bold text-slate-900">
                                        {competition.min_team_size} - {competition.max_team_size} Mahasiswa / Tim
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0">
                                    <Trophy className="size-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 font-medium block">Hadiah / Apresiasi</span>
                                    <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] block">
                                        {competition.prize_info || 'Sertifikat & Penghargaan'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Row */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                {competition.official_url && (
                                    <a
                                        href={competition.official_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
                                    >
                                        <span>Website Resmi Kompetisi</span>
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {myParticipation ? (
                                    <Link
                                        href={route('competitions.workspace', myParticipation.id)}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition"
                                    >
                                        <FolderKanban className="size-4" />
                                        <span>Masuk ke Preparation Workspace ({myParticipation.team?.name})</span>
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => setParticipateModalOpen(true)}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
                                    >
                                        <Trophy className="size-4" />
                                        <span>Bentuk Tim & Ikuti Kompetisi</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left 2 Cols: Details, Eligibility, Prizes, and Participating Teams */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* Eligibility Card */}
                            {competition.eligibility && (
                                <div className="glass-card rounded-3xl p-6 bg-white/85">
                                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <Sparkles className="size-4 text-blue-600" />
                                        <span>Persyaratan & Kriteria Kelayakan</span>
                                    </h3>
                                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                                        {competition.eligibility}
                                    </p>
                                </div>
                            )}

                            {/* Registered Teams */}
                            <div className="glass-card rounded-3xl p-6 bg-white/85">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Users className="size-4 text-blue-600" />
                                        <span>Tim Kampus yang Terdaftar ({competition.participations?.length || 0})</span>
                                    </h3>
                                    <span className="text-xs text-slate-500 font-medium">Kontingen Mahasiswa</span>
                                </div>

                                {competition.participations?.length === 0 ? (
                                    <div className="text-center py-8 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                                        <Trophy className="size-8 text-slate-400 mx-auto mb-2" />
                                        <p className="text-xs font-semibold text-slate-700">Belum ada tim kampus yang mendaftar</p>
                                        <p className="text-[11px] text-slate-500 mt-1 mb-4">
                                            Jadilah kontingen pertama yang mewakili almamater di ajang ini!
                                        </p>
                                        <button
                                            onClick={() => setParticipateModalOpen(true)}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                        >
                                            Bentuk Tim Sekarang
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {competition.participations?.map((part: any) => (
                                            <div
                                                key={part.id}
                                                className="p-4 border border-slate-200/80 rounded-2xl bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-900">{part.team?.name}</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                            {part.stage?.replace('_', ' ') || 'Recruiting'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        {part.team?.members?.length || 0} Anggota • Ketua: {part.team?.members?.find((m: any) => m.permission === 'leader')?.user?.name || 'Mahasiswa'}
                                                    </p>
                                                </div>

                                                {myParticipation?.id === part.id && (
                                                    <Link
                                                        href={route('competitions.workspace', part.id)}
                                                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shrink-0"
                                                    >
                                                        Workspace Tim
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Col: Timeline & Sources */}
                        <div className="flex flex-col gap-6">
                            <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                    <Clock className="size-4 text-blue-600" />
                                    <span>Timeline Penting</span>
                                </h3>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Pendaftaran Buka:</span>
                                        <span className="font-bold text-slate-900">
                                            {competition.registration_opens_at ? new Date(competition.registration_opens_at).toLocaleDateString('id-ID') : 'Sudah Buka'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Batas Deadline:</span>
                                        <span className="font-bold text-rose-600">
                                            {competition.registration_deadline ? new Date(competition.registration_deadline).toLocaleDateString('id-ID') : 'Terbuka'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Pelaksanaan:</span>
                                        <span className="font-bold text-slate-900">
                                            {competition.starts_at ? new Date(competition.starts_at).toLocaleDateString('id-ID') : 'Menyusul'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Provenance Source */}
                            {competition.sources && competition.sources.length > 0 && (
                                <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-3">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-emerald-600" />
                                        <span>Sumber Informasi Valid</span>
                                    </h3>
                                    {competition.sources.map((src: any) => (
                                        <div key={src.id} className="text-xs space-y-1">
                                            <div className="font-semibold text-slate-800">{src.label}</div>
                                            <a
                                                href={src.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:text-blue-700 underline truncate block"
                                            >
                                                {src.url}
                                            </a>
                                            {src.notes && <p className="text-[11px] text-slate-400">{src.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MODAL PENDAFTARAN TIM */}
                {isParticipateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Trophy className="size-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Bentuk Tim Kompetisi</h3>
                                        <p className="text-[11px] text-slate-400">{competition.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setParticipateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Eligibility Check Alert */}
                            {!eligibilityCheck.eligible && (
                                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                                    <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold block">Tidak Memenuhi Syarat Pendaftaran:</span>
                                        <span>{eligibilityCheck.reason}</span>
                                    </div>
                                </div>
                            )}

                            {/* Mode Switcher */}
                            {myLedProjects.length > 0 && eligibilityCheck.eligible && (
                                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setParticipationMode('new_team')}
                                        className={`flex-1 py-1.5 rounded-lg transition ${
                                            participationMode === 'new_team' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                                        }`}
                                    >
                                        Bentuk Tim Baru
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setParticipationMode('existing_project')}
                                        className={`flex-1 py-1.5 rounded-lg transition ${
                                            participationMode === 'existing_project' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                                        }`}
                                    >
                                        Tautkan Proyek Saya
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleCreateParticipation} className="space-y-4">
                                {participationMode === 'existing_project' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Pilih Proyek yang Ingin Diikutsertakan
                                        </label>
                                        <select
                                            value={selectedProjectId}
                                            onChange={(e) => {
                                                setSelectedProjectId(e.target.value);
                                                const p = myLedProjects.find((x) => x.id === parseInt(e.target.value, 10));
                                                if (p) setTeamName(p.title);
                                            }}
                                            required
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                        >
                                            <option value="">-- Pilih Proyek Aktif --</option>
                                            {myLedProjects.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.title} ({p.status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Nama Tim Kompetisi <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Contoh: Garuda Tech, Inovasi Cemerlang"
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Deskripsi Singkat Tim & Sasaran Karya
                                            </label>
                                            <textarea
                                                rows={3}
                                                placeholder="Tuliskan gambaran inovasi yang akan dipersiapkan..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setParticipateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !eligibilityCheck.eligible}
                                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                                    >
                                        {submitting ? 'Memproses...' : 'Bentuk Tim & Masuk Workspace'}
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
