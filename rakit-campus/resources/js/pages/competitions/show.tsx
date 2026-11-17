import ApplyCompetitionTeamModal, {
    type ApplyTeamData,
} from '@/components/competitions/ApplyCompetitionTeamModal';
import SeoHead from '@/components/seo/SeoHead';
import TrackCompetitionModal from '@/components/competitions/TrackCompetitionModal';
import UpdateStageModal from '@/components/competitions/UpdateStageModal';
import AppLayout from '@/layouts/app-layout';
import { getCompetitionCover } from '@/lib/competition-cover';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Bell,
    Bookmark,
    Briefcase,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    ExternalLink,
    FileText,
    Flame,
    FolderKanban,
    Globe,
    GraduationCap,
    Info,
    Lock,
    Plus,
    Share2,
    ShieldCheck,
    Sparkles,
    Trophy,
    User,
    UserCheck,
    UserPlus,
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
    openTeams?: any[];
    currentUserInfo?: {
        id?: number;
        name?: string;
        email?: string;
        phone?: string;
        portfolio_url?: string;
        study_program?: string;
    } | null;
    isLecturer?: boolean;
    campusStudents?: any[];
    myAllocations?: any[];
}

export default function CompetitionShow({
    competition,
    isBookmarked: initialBookmarked,
    myParticipation,
    myLedProjects = [],
    eligibilityCheck = { eligible: true },
    openTeams = [],
    currentUserInfo,
    isLecturer = false,
    campusStudents = [],
    myAllocations = [],
}: Props) {
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [trackModalOpen, setTrackModalOpen] = useState(false);
    const [stageModalOpen, setStageModalOpen] = useState(false);
    const [isParticipateModalOpen, setParticipateModalOpen] = useState(false);
    const [isAllocateModalOpen, setAllocateModalOpen] = useState(false);
    const setIsAllocateModalOpen = setAllocateModalOpen;
    const [isAddRoundModalOpen, setAddRoundModalOpen] = useState(false);
    const setIsAddRoundModalOpen = setAddRoundModalOpen;
    const [teamName, setTeamName] = useState('');
    const [categoryTrack, setCategoryTrack] = useState('');
    const [description, setDescription] = useState('');
    const [rolesNeeded, setRolesNeeded] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [copiedShare, setCopiedShare] = useState(false);

    // Apply Modal
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [selectedTeamData, setSelectedTeamData] = useState<ApplyTeamData | null>(null);

    // Allocation Form State
    const [allocStudentId, setAllocStudentId] = useState('');
    const [allocTeamId, setAllocTeamId] = useState('');
    const [allocRole, setAllocRole] = useState('Anggota Tim');
    const [allocNotes, setAllocNotes] = useState('');

    // Round Form State
    const [roundNumber, setRoundNumber] = useState(1);
    const [roundName, setRoundName] = useState('');
    const [roundDesc, setRoundDesc] = useState('');
    const [roundStartsAt, setRoundStartsAt] = useState('');
    const [roundEndsAt, setRoundEndsAt] = useState('');
    const [roundIsFinal, setRoundIsFinal] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Competition Hub', href: '/competitions' },
        { title: competition.name, href: `/competitions/${competition.slug || competition.id}` },
    ];

    const categoryTracks: string[] = Array.isArray(competition.category_tracks)
        ? competition.category_tracks
        : (typeof competition.category_tracks === 'string'
            ? JSON.parse(competition.category_tracks || '[]')
            : []);

    const deadlineDate = competition.registration_deadline ? new Date(competition.registration_deadline) : null;
    const now = new Date();
    const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const isExpired = deadlineDate ? deadlineDate < now : false;
    const isRegistrationClosed = isExpired || competition.status === 'closed' || competition.status === 'completed' || competition.status === 'cancelled';

    const toggleBookmark = () => {
        router.post(route('competitions.bookmark', competition.id), {}, {
            preserveScroll: true,
            onSuccess: () => setBookmarked(!bookmarked),
        });
    };

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
            setCopiedShare(true);
            setTimeout(() => setCopiedShare(false), 2000);
        }
    };

    const handleVerify = () => {
        if (confirm(`Verifikasi kompetisi '${competition.name}' dan publikasikan secara resmi?`)) {
            router.post(route('competitions.verify', competition.id));
        }
    };

    const handleCreateParticipation = (e: React.FormEvent) => {
        e.preventDefault();
        if (isRegistrationClosed) {
            alert('Pendaftaran untuk kompetisi ini telah ditutup.');
            return;
        }
        setSubmitting(true);

        const payload: any = {
            team_name: teamName,
            category_track: categoryTrack || null,
            description: description,
            roles_needed: rolesNeeded || null,
        };

        router.post(route('competitions.participate', competition.id), payload, {
            onFinish: () => setSubmitting(false),
            onSuccess: () => setParticipateModalOpen(false),
        });
    };

    const handleAllocateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!allocStudentId || !allocTeamId) {
            alert('Silakan pilih mahasiswa dan tim sasaran.');
            return;
        }

        router.post(route('competitions.allocate-student', competition.id), {
            student_id: allocStudentId,
            team_id: allocTeamId,
            suggested_role: allocRole,
            notes: allocNotes,
        }, {
            onSuccess: () => {
                setIsAllocateModalOpen(false);
                setAllocStudentId('');
                setAllocNotes('');
            },
        });
    };

    const handleConfirmAllocation = (allocId: number) => {
        if (confirm('Terima alokasi ini dan resmi bergabung ke tim kompetisi?')) {
            router.post(route('competitions.allocations.confirm', allocId));
        }
    };

    const handleRejectAllocation = (allocId: number) => {
        const reason = prompt('Masukkan alasan penolakan alokasi:');
        if (reason !== null) {
            router.post(route('competitions.allocations.reject', allocId), { reason });
        }
    };

    const handleAddRound = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('competitions.rounds.store', competition.id), {
            round_number: roundNumber,
            name: roundName,
            description: roundDesc,
            starts_at: roundStartsAt || null,
            ends_at: roundEndsAt || null,
            is_final_round: roundIsFinal,
        }, {
            onSuccess: () => {
                setIsAddRoundModalOpen(false);
                setRoundName('');
                setRoundDesc('');
                setRoundStartsAt('');
                setRoundEndsAt('');
            },
        });
    };

    const canonicalUrl = `https://rakitcampus.my.id/competitions/${competition.slug || competition.id}`;
    const cleanDesc = competition.description
        ? competition.description.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 180)
        : `Daftar dan ikuti kompetisi ${competition.name} (${competition.level || 'Mahasiswa'}) diselenggarakan oleh ${competition.organizer || 'penyelenggara'}. Bentuk tim dan kirim berkas di RAKIT Campus.`;

    const coverUrl = getCompetitionCover(competition);

    return (
        <AppLayout breadcrumbs={breadcrumbs} activeTab="lomba" title={`${competition.name} — RakitCampus`}>
            <SeoHead
                title={`${competition.name} — Info Lomba & Pendaftaran Mahasiswa`}
                description={cleanDesc}
                keywords={`kompetisi ${competition.name}, lomba ${competition.category || ''}, hackathon ${competition.level || ''}, ${competition.organizer || ''}, tim lomba mahasiswa, rakit campus`}
                canonicalUrl={canonicalUrl}
                ogImage={competition.cover_image || undefined}
                ogType="article"
            />

            <div className="pt-2 pb-16 flex flex-col gap-6 max-w-7xl mx-auto w-full">
                {/* Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={route('competitions.index')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-200 shadow-2xs transition"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke Competition Hub</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {competition.verification_status !== 'verified' && (
                            <button
                                onClick={handleVerify}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                                <ShieldCheck className="size-3.5" />
                                <span>Verifikasi & Publikasikan</span>
                            </button>
                        )}

                        <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition cursor-pointer"
                            title="Bagikan Tautan"
                        >
                            {copiedShare ? (
                                <>
                                    <Check className="size-3.5 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Tersalin!</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="size-3.5 text-slate-500" />
                                    <span>Bagikan</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={toggleBookmark}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-2xl border shadow-2xs transition cursor-pointer ${
                                bookmarked
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <Bookmark className={`size-3.5 ${bookmarked ? 'fill-current text-rose-600' : ''}`} />
                            <span>{bookmarked ? 'Tersimpan' : 'Simpan'}</span>
                        </button>
                    </div>
                </div>

                {/* Pending Lecturer Allocations Alert (Student-Facing) */}
                {myAllocations.length > 0 && (
                    <div className="rounded-3xl p-5 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200 shadow-xs flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                            <GraduationCap className="size-4 text-amber-600" />
                            <span>Rekomendasi & Alokasi Dosen Pembimbing untuk Anda</span>
                        </div>
                        <div className="space-y-2">
                            {myAllocations.map((alloc: any) => (
                                <div
                                    key={alloc.id}
                                    className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                >
                                    <div className="text-xs">
                                        <p className="font-bold text-slate-900">
                                            Dosen {alloc.lecturer?.name || 'Pembimbing'} merekomendasikan Anda untuk bergabung ke tim{' '}
                                            <span className="text-blue-600 font-black">{alloc.team?.name || 'Kompetisi'}</span>
                                        </p>
                                        <p className="text-slate-500 mt-1 text-[11px]">
                                            Peran Disarankan: <strong className="text-slate-800">{alloc.suggested_role || 'Anggota Tim'}</strong>
                                            {alloc.notes ? ` • Catatan: "${alloc.notes}"` : ''}
                                        </p>
                                    </div>

                                    {alloc.status === 'suggested' || alloc.status === 'pending' ? (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleConfirmAllocation(alloc.id)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                                            >
                                                Terima & Gabung
                                            </button>
                                            <button
                                                onClick={() => handleRejectAllocation(alloc.id)}
                                                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                                            >
                                                Tolak
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                                            Status: {alloc.status}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Distinction Notice: Official Registration vs Internal Rakit Campus Workspace */}
                <div className="bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 border border-blue-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-slate-900">
                                Pembedaan Pendaftaran Resmi & Manajemen Tim RAKIT Campus
                            </p>
                            <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                                Pendaftaran resmi kompetisi dikelola di portal resmi penyelenggara. RAKIT Campus digunakan mahasiswa untuk menemukan rekan tim lintas prodi, sinkronisasi berkas, dan pencatatan poin portofolio kampus.
                            </p>
                        </div>
                    </div>
                    {competition.registration_url && (
                        <a
                            href={competition.registration_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shrink-0 self-start sm:self-auto shadow-xs"
                        >
                            <span>Buka Pendaftaran Resmi ↗</span>
                        </a>
                    )}
                </div>

                {/* ========================================================
                    BENTO GRID SECTION
                   ======================================================== */}
                <div className="flex flex-col gap-5">
                    {/* BENTO ROW 1: Master Hero Bento (Poster Left + Identity Card Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                        {/* Bento Tile 1: 4:5 Full-Bleed Artwork Poster (4 cols) */}
                        <div className="lg:col-span-4 flex flex-col">
                            <div className="relative rounded-[28px] overflow-hidden bg-slate-950 aspect-[4/5] border border-slate-200/90 shadow-sm flex flex-col justify-between p-4 sm:p-5 group w-full h-full min-h-[380px]">
                                <img
                                    src={coverUrl}
                                    alt={competition.name}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-black/30 pointer-events-none" />

                                {/* Top Floating Chips */}
                                <div className="relative z-10 flex items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-blue-600/90 backdrop-blur-md text-white shadow-xs">
                                            {competition.category?.replace('_', ' ') || 'Umum'}
                                        </span>
                                        {competition.level && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md text-white border border-white/15">
                                                ⭐ {competition.level}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={toggleBookmark}
                                        className={`size-9 rounded-full backdrop-blur-md flex items-center justify-center transition cursor-pointer ${
                                            bookmarked
                                                ? 'bg-rose-500 text-white shadow-xs'
                                                : 'bg-black/35 hover:bg-black/60 text-white border border-white/20'
                                        }`}
                                        title={bookmarked ? 'Hapus Simpanan' : 'Simpan Kompetisi'}
                                    >
                                        <Bookmark className={`size-4 ${bookmarked ? 'fill-current' : ''}`} />
                                    </button>
                                </div>

                                {/* Bottom Floating Info on Poster */}
                                <div className="relative z-10 space-y-2.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {competition.verification_status === 'verified' ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-2xs">
                                                <ShieldCheck className="size-3.5" />
                                                <span>Terverifikasi Resmi</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-amber-600/90 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-2xs">
                                                <Clock className="size-3.5" />
                                                <span>Menunggu Verifikasi</span>
                                            </span>
                                        )}

                                        {daysLeft !== null && (
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-md shadow-2xs ${
                                                isRegistrationClosed
                                                    ? 'bg-rose-600/95 text-white'
                                                    : daysLeft <= 7
                                                    ? 'bg-amber-500/95 text-white animate-pulse'
                                                    : 'bg-black/60 text-white border border-white/10'
                                            }`}>
                                                {isRegistrationClosed
                                                    ? 'Pendaftaran Tutup'
                                                    : daysLeft > 0
                                                    ? `⏳ ${daysLeft} Hari Lagi`
                                                    : '🔥 Hari Terakhir'}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-[11px] text-slate-300 font-medium">Penyelenggara</p>
                                        <p className="text-xs font-bold text-white truncate drop-shadow-xs">
                                            {competition.organizer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bento Tile 2: Master Identity & Primary Action Deck (8 cols) */}
                        <div className="lg:col-span-8 flex flex-col justify-between bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-8 shadow-xs">
                            <div className="space-y-4">
                                {/* Header Tags */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                        <Award className="size-3.5 text-blue-600" />
                                        <span>{competition.organizer}</span>
                                    </span>

                                    <span className="text-slate-300">·</span>

                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                                        Format: {competition.competition_type === 'individual' ? 'Individu' : 'Tim Mahasiswa'}
                                    </span>

                                    {competition.scope && (
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
                                            Cakupan: {competition.scope === 'global' ? 'Nasional / Terbuka' : 'Internal Kampus'}
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                    {competition.name}
                                </h1>

                                {/* Description Excerpt */}
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                                    {competition.description || 'Peluang prestasi mahasiswa untuk berkolaborasi dan berkompetisi di kancah regional maupun nasional bersama komunitas kampus.'}
                                </p>

                                {/* Jalur Lomba / Tracks Bento Tags */}
                                {categoryTracks.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Jalur / Track Kompetisi:
                                        </span>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {categoryTracks.map((trk, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs font-semibold px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50/60 text-blue-800 border border-blue-200/70 rounded-xl"
                                                >
                                                    {trk}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Deck Bar */}
                            <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    {competition.official_url && (
                                        <a
                                            href={competition.official_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
                                        >
                                            <Globe className="size-3.5 text-slate-400" />
                                            <span>Website Resmi</span>
                                            <ExternalLink className="size-3 text-slate-400" />
                                        </a>
                                    )}

                                    {isLecturer && (
                                        <button
                                            onClick={() => setIsAllocateModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                                        >
                                            <GraduationCap className="size-3.5" />
                                            <span>Alokasikan Mahasiswa</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    {myParticipation ? (
                                        <>
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                                                myParticipation.lifecycle_status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                Tahap: {myParticipation.stage_label || myParticipation.stage}
                                            </span>

                                            <Link
                                                href={`/competition-workspace/${competition.slug || competition.id}`}
                                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                                            >
                                                <FolderKanban className="size-3.5" />
                                                <span>Workspace Tim</span>
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => setStageModalOpen(true)}
                                                className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                                            >
                                                Update Tahap
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {competition.registration_url && (
                                                <a
                                                    href={competition.registration_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-2xs transition"
                                                >
                                                    <span>Daftar di Penyelenggara</span>
                                                    <ExternalLink className="size-3" />
                                                </a>
                                            )}

                                            {!isRegistrationClosed && (
                                                <button
                                                    onClick={() => setParticipateModalOpen(true)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                                                >
                                                    <UserPlus className="size-3.5 text-blue-600" />
                                                    <span>Bentuk Tim Baru</span>
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setTrackModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                                            >
                                                <Trophy className="size-4" />
                                                <span>Ikuti di Lomba Saya</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BENTO ROW 2: 3-Card High-Impact Key Metrics Bento Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Bento Metric 1: Batas Pendaftaran */}
                        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-[24px] border border-amber-200/80 p-5 flex items-start gap-4 shadow-2xs">
                            <div className="size-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Calendar className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-amber-900/70 uppercase tracking-wider block">
                                    Batas Pendaftaran
                                </span>
                                <span className="text-base font-black text-slate-900 block truncate mt-0.5">
                                    {competition.registration_deadline
                                        ? new Date(competition.registration_deadline).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'long',
                                              year: 'numeric',
                                          })
                                        : 'Terbuka'}
                                </span>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <span className={`text-xs font-bold inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg ${
                                        isRegistrationClosed
                                            ? 'bg-rose-100 text-rose-800'
                                            : daysLeft !== null && daysLeft <= 7
                                            ? 'bg-amber-200 text-amber-900 font-extrabold'
                                            : 'bg-amber-100 text-amber-900'
                                    }`}>
                                        <Clock className="size-3" />
                                        {isRegistrationClosed
                                            ? 'Pendaftaran Ditutup'
                                            : daysLeft !== null
                                            ? (daysLeft > 0 ? `${daysLeft} Hari Lagi` : 'Hari Terakhir!')
                                            : 'Jadwal Fleksibel'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bento Metric 2: Kapasitas Tim */}
                        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent rounded-[24px] border border-blue-200/80 p-5 flex items-start gap-4 shadow-2xs">
                            <div className="size-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Users className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-blue-900/70 uppercase tracking-wider block">
                                    Kapasitas & Format
                                </span>
                                <span className="text-base font-black text-slate-900 block truncate mt-0.5">
                                    {competition.min_team_size} - {competition.max_team_size} Mahasiswa
                                </span>
                                <div className="mt-1">
                                    <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-lg inline-block">
                                        {competition.competition_type === 'individual' ? 'Kategori Individu' : 'Format Tim / Kelompok'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bento Metric 3: Hadiah & Apresiasi */}
                        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent rounded-[24px] border border-purple-200/80 p-5 flex items-start gap-4 shadow-2xs">
                            <div className="size-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Trophy className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-purple-900/70 uppercase tracking-wider block">
                                    Hadiah & Apresiasi
                                </span>
                                <span className="text-sm font-black text-slate-900 block line-clamp-1 mt-0.5" title={competition.prize_info}>
                                    {competition.prize_info || 'Sertifikat & Apresiasi'}
                                </span>
                                <div className="mt-1">
                                    <span className="text-xs font-bold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-lg inline-block">
                                        ✨ Portofolio Terverifikasi
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BENTO ROW 3: Main Modular Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* LEFT COLUMN: 8 COLS (Overview, Eligibility, Open Teams, Registered Teams) */}
                        <div className="lg:col-span-8 flex flex-col gap-5">
                            {/* Bento Tile 4: Deskripsi & Problem Statement */}
                            <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-7 shadow-xs">
                                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                                    <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <FileText className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">
                                            Tentang Kompetisi & Deskripsi Masalah
                                        </h2>
                                        <p className="text-[11px] text-slate-400">Ringkasan tujuan, ruang lingkup pengerjaan, dan sasaran inovasi</p>
                                    </div>
                                </div>

                                <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                                    {competition.description ? (
                                        competition.description.split('\n\n').map((paragraph: string, idx: number) => (
                                            <p key={idx} className="whitespace-pre-line">
                                                {paragraph}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 italic">Belum ada deskripsi lengkap untuk kompetisi ini.</p>
                                    )}
                                </div>
                            </div>

                            {/* Bento Tile 5: Persyaratan & Kriteria Kelayakan */}
                            {competition.eligibility && (
                                <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-7 shadow-xs">
                                    <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                                        <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                            <Sparkles className="size-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900">
                                                Persyaratan & Kriteria Kelayakan Peserta
                                            </h2>
                                            <p className="text-[11px] text-slate-400">Ketentuan resmi dari penyelenggara yang wajib dipenuhi</p>
                                        </div>
                                    </div>

                                    <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                                        {competition.eligibility}
                                    </div>
                                </div>
                            )}

                            {/* Bento Tile 6: Lowongan Tim Terbuka (Matchmaking Discovery) */}
                            <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-7 shadow-xs">
                                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <UserPlus className="size-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900">
                                                Lowongan Anggota Tim Terbuka ({openTeams.length})
                                            </h2>
                                            <p className="text-[11px] text-slate-400">Gabung dengan tim mahasiswa yang sedang mencari anggota</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href="/competitions?tab=teams&view=radar"
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-200 transition"
                                            title="Buka Radar Rekrutmen talenta kampus untuk tim lomba"
                                        >
                                            <Sparkles className="size-3 text-amber-500" />
                                            <span>Radar Rekrutmen</span>
                                        </Link>
                                    </div>
                                </div>

                                {openTeams.length === 0 ? (
                                    <div className="text-center py-8 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                                        <Users className="size-8 text-slate-400 mx-auto mb-2 opacity-60" />
                                        <p className="text-xs font-bold text-slate-700">Belum ada tim yang membuka lowongan saat ini</p>
                                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                                            Anda bisa membentuk tim baru terlebih dahulu dan membuka lowongan untuk merekrut mahasiswa lain.
                                        </p>
                                        {!isRegistrationClosed && (
                                            <button
                                                onClick={() => setParticipateModalOpen(true)}
                                                className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>Bentuk Tim Sekarang</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {openTeams.map((part: any) => (
                                            <div
                                                key={part.id}
                                                className="p-4 border border-slate-200/80 rounded-2xl bg-slate-50/40 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-black text-slate-900">{part.team?.name}</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Mencari Rekan
                                                        </span>
                                                        {part.category_track && (
                                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                                                                {part.category_track}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        <span className="text-[11px] text-slate-500">
                                                            Ketua: <strong className="text-slate-800">{part.team?.leader?.name || 'Mahasiswa'}</strong>
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: competition.max_team_size || 5 }).map((_, idx) => {
                                                                const isFilled = idx < (part.team?.members_count || part.team?.members?.length || 1);
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={`flex items-center justify-center size-5 rounded-md ${
                                                                            isFilled
                                                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                                                : 'border border-dashed border-slate-300 text-slate-300 bg-white'
                                                                        }`}
                                                                        title={isFilled ? `Anggota #${idx + 1} Terisi` : `Slot #${idx + 1} Kosong`}
                                                                    >
                                                                        <User className="size-3 stroke-[2]" />
                                                                    </div>
                                                                );
                                                            })}
                                                            <span className="text-[11px] font-bold text-slate-700 ml-1">
                                                                {part.team?.members_count || part.team?.members?.length || 1}/{competition.max_team_size || 5}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {part.team?.recruitment?.roles && part.team.recruitment.roles.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2.5">
                                                            {part.team.recruitment.roles.map((r: any) => (
                                                                <span
                                                                    key={r.id}
                                                                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60"
                                                                >
                                                                    {r.name} ({r.slots} slot)
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {myParticipation?.id === part.id || part.is_member || part.is_leader ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                                <span>Anggota Aktif</span>
                                                            </span>
                                                            <Link
                                                                href={route('competitions.workspace', competition?.slug || part.id)}
                                                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs"
                                                            >
                                                                Workspace
                                                            </Link>
                                                        </div>
                                                    ) : part.my_application ? (
                                                        <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                                                            Lamaran Terkirim
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTeamData({
                                                                    participationId: part.id,
                                                                    teamName: part.team?.name || 'Tim Kompetisi',
                                                                    competitionName: competition.name,
                                                                    organizer: competition.organizer,
                                                                    leaderName: part.team?.leader?.name,
                                                                    isMember: part.is_member,
                                                                    isLeader: part.is_leader,
                                                                    roles: part.team?.recruitment?.roles || [],
                                                                });
                                                                setApplyModalOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                                                        >
                                                            <Sparkles className="size-3" />
                                                            <span>Ajukan Diri</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bento Tile 7: Kontingen Kampus Terdaftar */}
                            <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-7 shadow-xs">
                                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                            <Users className="size-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900">
                                                Kontingen Kampus Terdaftar ({competition.participations?.length || 0})
                                            </h2>
                                            <p className="text-[11px] text-slate-400">Tim perwakilan mahasiswa yang sedang mempersiapkan karya</p>
                                        </div>
                                    </div>

                                    <span className="text-xs text-slate-500 font-semibold">Almamater Squad</span>
                                </div>

                                {isRegistrationClosed ? (
                                    <div className="text-center py-6 px-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                                        <Trophy className="size-7 text-slate-400 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-700">Pendaftaran Telah Berakhir</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Tahapan pembentukan tim baru telah ditutup sesuai jadwal penyelenggara.
                                        </p>
                                    </div>
                                ) : competition.participations?.length === 0 ? (
                                    <div className="text-center py-8 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                                        <Trophy className="size-8 text-slate-400 mx-auto mb-2 opacity-60" />
                                        <p className="text-xs font-bold text-slate-700">Belum ada tim kampus yang mendaftar</p>
                                        <p className="text-[11px] text-slate-500 mt-1 mb-3">
                                            Jadilah kontingen pertama yang mewakili almamater di ajang ini!
                                        </p>
                                        <button
                                            onClick={() => setParticipateModalOpen(true)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
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
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                                            {part.stage?.replace('_', ' ') || 'Recruiting'}
                                                        </span>
                                                        {part.is_formation_locked ? (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                                                                Formasi Terkunci
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                                                                Perekrutan
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-1">
                                                        {part.team?.members?.length || 0} Anggota • Pembimbing:{' '}
                                                        <strong className="text-slate-700">{part.mentor?.name || 'Belum Ditugaskan'}</strong>
                                                    </p>
                                                </div>

                                                {myParticipation?.id === part.id && (
                                                    <Link
                                                        href={route('competitions.workspace', competition?.slug || part.id)}
                                                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 shadow-2xs"
                                                    >
                                                        Masuk Workspace Tim
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: 4 COLS (Rounds Timeline, Schedule, Sources, Tips) */}
                        <div className="lg:col-span-4 flex flex-col gap-5">
                            {/* Bento Tile 8: Tahapan & Babak Lomba */}
                            <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Clock className="size-3.5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Tahapan Babak ({competition.rounds?.length || 0})
                                        </h3>
                                    </div>
                                    {isLecturer && (
                                        <button
                                            onClick={() => setIsAddRoundModalOpen(true)}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                                        >
                                            + Tambah
                                        </button>
                                    )}
                                </div>

                                {competition.rounds?.length === 0 ? (
                                    <div className="p-4 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                                        <p className="text-xs text-slate-500">Belum ada babak bertingkat.</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Penilaian mengacu langsung pada batas akhir pendaftaran.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {competition.rounds?.map((rnd: any) => (
                                            <div
                                                key={rnd.id}
                                                className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-xs space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-black text-slate-900">
                                                        Babak {rnd.round_number}: {rnd.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                                                        {rnd.status || 'Active'}
                                                    </span>
                                                </div>
                                                {rnd.description && <p className="text-slate-600 text-[11px]">{rnd.description}</p>}
                                                <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                                                    <span>Mulai: {rnd.starts_at ? new Date(rnd.starts_at).toLocaleDateString('id-ID') : '-'}</span>
                                                    <span>• Selesai: {rnd.ends_at ? new Date(rnd.ends_at).toLocaleDateString('id-ID') : '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bento Tile 9: Linimasa Utama */}
                            <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <div className="size-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Calendar className="size-3.5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Jadwal & Linimasa Kegiatan
                                    </h3>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Pendaftaran Buka:</span>
                                        <span className="font-bold text-slate-900">
                                            {competition.registration_opens_at ? new Date(competition.registration_opens_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sudah Buka'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Batas Deadline:</span>
                                        <span className={`font-black ${isRegistrationClosed ? 'text-rose-600' : 'text-amber-700'}`}>
                                            {competition.registration_deadline ? new Date(competition.registration_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Terbuka'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Pelaksanaan / Babak Utama:</span>
                                        <span className="font-bold text-slate-900">
                                            {competition.starts_at ? new Date(competition.starts_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Menyusul'}
                                        </span>
                                    </div>

                                    {competition.ends_at && (
                                        <div className="flex justify-between py-2">
                                            <span className="text-slate-500">Pengumuman & Awarding:</span>
                                            <span className="font-bold text-slate-900">
                                                {new Date(competition.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bento Tile 10: Sumber Validasi & Keabsahan (Provenance) */}
                            {competition.sources && competition.sources.length > 0 && (
                                <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-xs space-y-3">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <div className="size-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <ShieldCheck className="size-3.5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Sumber Informasi Valid
                                        </h3>
                                    </div>

                                    {competition.sources.map((src: any) => (
                                        <div key={src.id} className="text-xs space-y-1 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                                            <div className="font-bold text-slate-800">{src.label}</div>
                                            <a
                                                href={src.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:text-blue-700 underline truncate block text-[11px]"
                                            >
                                                {src.url}
                                            </a>
                                            {src.notes && <p className="text-[10px] text-slate-500">{src.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Bento Tile 11: Tips Sukses & Keuntungan Kampus */}
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[28px] p-6 text-white shadow-xs space-y-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-amber-300" />
                                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-100">
                                        Keuntungan Mahasiswa
                                    </h4>
                                </div>
                                <p className="text-xs text-blue-100/90 leading-relaxed">
                                    Semua keikutsertaan lomba di RAKIT Campus dapat diverifikasi dosen pembimbing untuk konversi SKS mata kuliah proyek atau SKPI (Surat Keterangan Pendamping Ijazah).
                                </p>
                                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200 font-semibold">
                                    <span>Tercatat di Portofolio</span>
                                    <CheckCircle2 className="size-4 text-emerald-300" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL PENDAFTARAN TIM (STUDENT-LED) */}
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

                        <form onSubmit={handleCreateParticipation} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Nama Tim Kompetisi <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Tim Inovasi Cemerlang"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                                />
                            </div>

                            {categoryTracks.length > 0 ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Pilih Kategori / Jalur Lomba
                                    </label>
                                    <select
                                        value={categoryTrack}
                                        onChange={(e) => setCategoryTrack(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                    >
                                        <option value="">-- Umum / Tanpa Jalur Khusus --</option>
                                        {categoryTracks.map((trk, i) => (
                                            <option key={i} value={trk}>
                                                {trk}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Jalur / Kategori (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: UI/UX Design, Strategic Case"
                                        value={categoryTrack}
                                        onChange={(e) => setCategoryTrack(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Deskripsi Singkat Tim & Sasaran Karya
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Tuliskan gambaran inovasi yang akan dipersiapkan..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase className="size-3.5 text-blue-600" />
                                        <span>Peran yang Dibutuhkan</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Business Analyst, UI/UX Designer, Pitch Lead (pisahkan koma)"
                                    value={rolesNeeded}
                                    onChange={(e) => setRolesNeeded(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Peran ini akan langsung tampil di pencarian rekan tim agar mahasiswa lain dapat melamar.
                                </p>
                            </div>

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

            {/* MODAL LECTURER-LED ALLOCATION */}
            {isAllocateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <GraduationCap className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Alokasikan Mahasiswa ke Tim</h3>
                                    <p className="text-[11px] text-slate-400">Pembimbingan & Penataan Tim Kompetisi (Lecturer-Led)</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAllocateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAllocateStudent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Pilih Mahasiswa Kampus <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={allocStudentId}
                                    onChange={(e) => setAllocStudentId(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                >
                                    <option value="">-- Pilih Mahasiswa --</option>
                                    {campusStudents.map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.study_program} • Sem {s.semester}) {s.has_team_in_competition ? '[Sudah ada tim]' : '[Tersedia]'}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Mendukung kolaborasi lintas prodi dan lintas kelas di lingkungan kampus.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Tim Sasaran <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={allocTeamId}
                                    onChange={(e) => setAllocTeamId(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                >
                                    <option value="">-- Pilih Tim Kompetisi --</option>
                                    {competition.participations?.map((p: any) => (
                                        <option key={p.team_id} value={p.team_id}>
                                            {p.team?.name} ({p.stage})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Peran yang Disarankan
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Frontend Developer, Pitch Lead, AI Engineer"
                                    value={allocRole}
                                    onChange={(e) => setAllocRole(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Catatan / Alasan Rekomendasi
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Tuliskan alasan penugasan atau saran fokus pengerjaan karya..."
                                    value={allocNotes}
                                    onChange={(e) => setAllocNotes(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAllocateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                >
                                    Alokasikan Mahasiswa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL TAMBAH BABAK KOMPETISI */}
            {isAddRoundModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">Tambah Babak Kompetisi</h3>
                            <button onClick={() => setIsAddRoundModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddRound} className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Babak</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={roundNumber}
                                        onChange={(e) => setRoundNumber(parseInt(e.target.value, 10))}
                                        required
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Babak</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Seleksi Proposal, Final"
                                        value={roundName}
                                        onChange={(e) => setRoundName(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Sasaran</label>
                                <textarea
                                    rows={2}
                                    value={roundDesc}
                                    onChange={(e) => setRoundDesc(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                                    <input
                                        type="date"
                                        value={roundStartsAt}
                                        onChange={(e) => setRoundStartsAt(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                                    <input
                                        type="date"
                                        value={roundEndsAt}
                                        onChange={(e) => setRoundEndsAt(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="roundIsFinal"
                                    checked={roundIsFinal}
                                    onChange={(e) => setRoundIsFinal(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-4"
                                />
                                <label htmlFor="roundIsFinal" className="text-xs font-bold text-slate-700 cursor-pointer">
                                    Ini adalah Babak Final (Penentu Juara)
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddRoundModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                >
                                    Simpan Babak
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MinSatu Apply Modal */}
            <ApplyCompetitionTeamModal
                isOpen={applyModalOpen}
                onClose={() => setApplyModalOpen(false)}
                teamData={selectedTeamData}
                currentUserInfo={currentUserInfo}
            />

            {/* Track Competition Lifecycle Modal */}
            <TrackCompetitionModal
                isOpen={trackModalOpen}
                onClose={() => setTrackModalOpen(false)}
                competition={competition}
            />

            {/* Update Stage Modal */}
            <UpdateStageModal
                isOpen={stageModalOpen}
                onClose={() => setStageModalOpen(false)}
                participation={myParticipation}
            />
        </AppLayout>
    );
}
