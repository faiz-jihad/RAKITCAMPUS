import ApplyCompetitionTeamModal, {
    type ApplyTeamData,
} from '@/components/competitions/ApplyCompetitionTeamModal';
import SeoHead from '@/components/seo/SeoHead';
import RecordResultModal from '@/components/competitions/RecordResultModal';
import TrackCompetitionModal from '@/components/competitions/TrackCompetitionModal';
import UpdateStageModal from '@/components/competitions/UpdateStageModal';
import AppLayout from '@/layouts/app-layout';
import { getCompetitionCover } from '@/lib/competition-cover';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Bell,
    Bookmark,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    FolderKanban,
    GraduationCap,
    Plus,
    Settings,
    ShieldCheck,
    Sparkles,
    Trophy,
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
    const [resultModalOpen, setResultModalOpen] = useState(false);
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

    // MinSatu Apply Modal
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
            <div className="pt-2 flex flex-col gap-6">
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

                    {/* Pending Lecturer Allocations Alert (Student-Facing) */}
                    {myAllocations.length > 0 && (
                        <div className="glass-card rounded-3xl p-5 bg-amber-50/80 border border-amber-200 shadow-xs flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                                <GraduationCap className="size-4 text-amber-600" />
                                <span>Rekomendasi & Alokasi Dosen Pembimbing untuk Anda</span>
                            </div>
                            <div className="space-y-2">
                                {myAllocations.map((alloc: any) => (
                                    <div
                                        key={alloc.id}
                                        className="p-3.5 bg-white rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="text-xs">
                                            <p className="font-bold text-slate-900">
                                                Dosen {alloc.lecturer?.name || 'Pembimbing'} merekomendasikan Anda untuk bergabung ke tim{' '}
                                                <span className="text-blue-600 font-black">{alloc.team?.name || 'Kompetisi'}</span>
                                            </p>
                                            <p className="text-slate-500 mt-0.5 text-[11px]">
                                                Peran: <strong className="text-slate-700">{alloc.suggested_role || 'Anggota Tim'}</strong>
                                                {alloc.notes ? ` • Catatan: "${alloc.notes}"` : ''}
                                            </p>
                                        </div>

                                        {alloc.status === 'suggested' || alloc.status === 'pending' ? (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleConfirmAllocation(alloc.id)}
                                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                                                >
                                                    Terima & Gabung
                                                </button>
                                                <button
                                                    onClick={() => handleRejectAllocation(alloc.id)}
                                                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                                Status: {alloc.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Clear distinction notice between official registration & internal tracking */}
                    <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="size-4 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-slate-900">
                                    Pembedaan Pendaftaran Resmi & Manajemen RAKIT Campus
                                </p>
                                <p className="text-slate-600 text-[11px] mt-0.5">
                                    Pendaftaran resmi kompetisi dikelola langsung di situs resmi penyelenggara. RAKIT Campus digunakan untuk kolaborasi tim, persiapan dokumen, dan pencatatan rekam jejak prestasi.
                                </p>
                            </div>
                        </div>
                        {competition.registration_url && (
                            <a
                                href={competition.registration_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shrink-0 self-start sm:self-auto shadow-xs"
                            >
                                <span>Buka Pendaftaran Resmi ↗</span>
                            </a>
                        )}
                    </div>

                    {/* Bento Grid Header Layout (Requested .parent, .div1, .div2, .div3) */}
                    <style>{`
                        @media (min-width: 1024px) {
                            .bento-competition-parent {
                                display: grid;
                                grid-template-columns: repeat(5, 1fr);
                                grid-template-rows: repeat(5, 1fr);
                                gap: 8px;
                            }
                            .bento-competition-div1 {
                                grid-column: span 2 / span 2;
                                grid-row: span 5 / span 5;
                            }
                            .bento-competition-div2 {
                                grid-column: span 3 / span 3;
                                grid-row: span 3 / span 3;
                                grid-column-start: 3;
                            }
                            .bento-competition-div3 {
                                grid-column: span 3 / span 3;
                                grid-row: span 2 / span 2;
                                grid-column-start: 3;
                                grid-row-start: 4;
                            }
                        }
                    `}</style>

                    <div className="flex flex-col gap-2.5 bento-competition-parent lg:min-h-[460px]">
                        {/* .div1: span 2 / span 5 */}
                        <div className="bento-competition-div1 relative rounded-2xl overflow-hidden bg-slate-900 min-h-[300px] lg:min-h-0 border border-slate-200/80 shadow-xs flex flex-col justify-between p-4 sm:p-5 group">
                            <img
                                src={getCompetitionCover(competition)}
                                alt={competition.name}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/30" />

                            {/* Floating top badges */}
                            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-600/95 backdrop-blur-md text-white shadow-xs">
                                        {competition.category?.replace('_', ' ') || 'Umum'}
                                    </span>
                                    {competition.level && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-white border border-white/10">
                                            {competition.level}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={toggleBookmark}
                                    className={`p-2 rounded-full backdrop-blur-md transition cursor-pointer ${
                                        bookmarked
                                            ? 'bg-rose-500 text-white shadow-xs'
                                            : 'bg-black/30 hover:bg-black/50 text-white'
                                    }`}
                                    title={bookmarked ? 'Hapus Simpanan' : 'Simpan Kompetisi'}
                                >
                                    <Bookmark className={`size-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            {/* Floating bottom content */}
                            <div className="relative z-10 space-y-2">
                                <div className="flex items-center gap-2">
                                    {competition.verification_status === 'verified' ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-600/90 backdrop-blur-md px-2.5 py-0.5 rounded-md">
                                            <ShieldCheck className="size-3" />
                                            <span>Terverifikasi Resmi</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-amber-600/90 backdrop-blur-md px-2.5 py-0.5 rounded-md">
                                            <Clock className="size-3" />
                                            <span>Menunggu Verifikasi</span>
                                        </span>
                                    )}

                                    {daysLeft !== null && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md ${
                                            daysLeft <= 7
                                                ? 'bg-rose-500/95 text-white'
                                                : 'bg-black/50 text-white'
                                        }`}>
                                            {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Hari ini'}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className="text-[11px] font-medium text-slate-300 block truncate">
                                        Penyelenggara: <strong className="text-white font-semibold">{competition.organizer}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* .div2: span 3 / span 3 / col-start 3 */}
                        <div className="bento-competition-div2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        {competition.organizer}
                                    </span>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                        Format: {competition.competition_type || 'Tim'}
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug mt-1">
                                    {competition.name}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mt-2">
                                    {competition.description || 'Peluang prestasi mahasiswa untuk berkolaborasi dan berkompetisi di kancah regional maupun nasional.'}
                                </p>

                                {categoryTracks.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                        <span className="text-[10px] font-bold text-slate-400">Jalur:</span>
                                        {categoryTracks.slice(0, 5).map((trk, i) => (
                                            <span
                                                key={i}
                                                className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md"
                                            >
                                                {trk}
                                            </span>
                                        ))}
                                        {categoryTracks.length > 5 && (
                                            <span className="text-[10px] font-semibold text-slate-400">+{categoryTracks.length - 5} lainnya</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* CTA Action Row */}
                            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2">
                                    {competition.official_url && (
                                        <a
                                            href={competition.official_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
                                        >
                                            <span>Website Resmi</span>
                                            <ExternalLink className="size-3 text-slate-400" />
                                        </a>
                                    )}

                                    {isLecturer && (
                                        <button
                                            onClick={() => setIsAllocateModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                        >
                                            <GraduationCap className="size-3.5" />
                                            <span>Alokasikan Mahasiswa</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {myParticipation ? (
                                        <>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                                                myParticipation.lifecycle_status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {myParticipation.stage_label || myParticipation.stage}
                                            </span>
                                            <Link
                                                href={`/competition-workspace/${competition.slug || competition.id}`}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                                            >
                                                <FolderKanban className="size-3.5" />
                                                <span>Workspace Tim</span>
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setStageModalOpen(true)}
                                                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                                            >
                                                Update Tahap
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResultModalOpen(true)}
                                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                                            >
                                                Catat Prestasi
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {competition.registration_url && (
                                                <a
                                                    href={competition.registration_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-semibold shadow-2xs transition"
                                                >
                                                    <span>Daftar di Penyelenggara</span>
                                                    <ExternalLink className="size-3" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => setTrackModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                                            >
                                                <Trophy className="size-3.5" />
                                                <span>Ikuti di Lomba Saya</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* .div3: span 3 / span 2 / col-start 3 / row-start 4 */}
                        <div className="bento-competition-div3 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-center">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                                {/* Stat 1: Deadline */}
                                <div className="flex items-center gap-3 sm:pr-3">
                                    <div className="size-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                                        <Calendar className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] text-slate-400 font-medium block">Batas Pendaftaran</span>
                                        <span className="text-xs font-bold text-slate-900 block truncate">
                                            {competition.registration_deadline
                                                ? new Date(competition.registration_deadline).toLocaleDateString('id-ID', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : 'Terbuka'}
                                        </span>
                                        <span className="text-[10px] text-amber-700 font-semibold block">
                                            {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} hari lagi` : 'Hari ini') : 'Jadwal terbuka'}
                                        </span>
                                    </div>
                                </div>

                                {/* Stat 2: Team Size */}
                                <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
                                    <div className="size-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
                                        <Users className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] text-slate-400 font-medium block">Ukuran Tim</span>
                                        <span className="text-xs font-bold text-slate-900 block truncate">
                                            {competition.min_team_size} - {competition.max_team_size} Mahasiswa
                                        </span>
                                        <span className="text-[10px] text-blue-700 font-semibold block">
                                            Format: {competition.competition_type || 'Tim'}
                                        </span>
                                    </div>
                                </div>

                                {/* Stat 3: Prize */}
                                <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pl-3">
                                    <div className="size-9 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0">
                                        <Trophy className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] text-slate-400 font-medium block">Hadiah & Prestasi</span>
                                        <span className="text-xs font-bold text-slate-900 block truncate" title={competition.prize_info}>
                                            {competition.prize_info || 'Sertifikat & Apresiasi'}
                                        </span>
                                        <span className="text-[10px] text-purple-700 font-semibold block">
                                            Tercatat Portofolio
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left 2 Cols: Details, Eligibility, Open Recruiting Teams, and Registered Teams */}
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

                            {/* Open Recruiting Teams (Matchmaking Discovery) */}
                            <div className="glass-card rounded-3xl p-6 bg-white/85">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <UserPlus className="size-4 text-blue-600" />
                                            <span>Tim yang Membuka Lowongan ({openTeams.length})</span>
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                        Student-Led Open
                                    </span>
                                </div>

                                {openTeams.length === 0 ? (
                                    <div className="text-center py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                                        <Users className="size-6 text-slate-400 mx-auto mb-1.5" />
                                        <p className="text-xs font-semibold text-slate-700">Belum ada tim yang membuka rekrutmen terbuka</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Anda dapat membentuk tim baru dan mengundang kandidat potensial dari kampus.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {openTeams.map((part: any) => (
                                            <div
                                                key={part.id}
                                                className="p-4 border border-slate-200/80 rounded-2xl bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-900">{part.team?.name}</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Membuka Anggota
                                                        </span>
                                                        {part.category_track && (
                                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                                {part.category_track}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-1">
                                                        Ketua: <strong className="text-slate-700">{part.team?.leader?.name || 'Mahasiswa'}</strong> • Kapasitas:{' '}
                                                        {part.team?.members_count || part.team?.members?.length || 0} / {competition.max_team_size || 5} Anggota
                                                    </p>
                                                    {part.team?.recruitment?.roles && part.team.recruitment.roles.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {part.team.recruitment.roles.map((r: any) => (
                                                                <span
                                                                    key={r.id}
                                                                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60"
                                                                >
                                                                    {r.name} ({r.slots} slot)
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {myParticipation?.id === part.id ? (
                                                        <Link
                                                            href={route('competitions.workspace', competition?.slug || part.id)}
                                                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
                                                        >
                                                            Workspace Tim
                                                        </Link>
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
                                                                    roles: part.team?.recruitment?.roles || [],
                                                                });
                                                                setApplyModalOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
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

                            {/* Registered Teams */}
                            <div className="glass-card rounded-3xl p-6 bg-white/85">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Users className="size-4 text-blue-600" />
                                        <span>Seluruh Tim Kampus Terdaftar ({competition.participations?.length || 0})</span>
                                    </h3>
                                    <span className="text-xs text-slate-500 font-medium">Kontingen Kampus</span>
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
                                                        {part.is_formation_locked ? (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                                                Formasi Terkunci
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                                Perekrutan
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        {part.team?.members?.length || 0} Anggota • Pembimbing:{' '}
                                                        <strong className="text-slate-700">{part.mentor?.name || 'Belum Ditugaskan'}</strong>
                                                    </p>
                                                </div>

                                                {myParticipation?.id === part.id && (
                                                    <Link
                                                        href={route('competitions.workspace', competition?.slug || part.id)}
                                                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shrink-0"
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

                        {/* Right Col: Rounds & Timeline & Sources */}
                        <div className="flex flex-col gap-6">
                            {/* Competition Rounds Card */}
                            <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Clock className="size-4 text-blue-600" />
                                        <span>Tahapan & Babak Lomba ({competition.rounds?.length || 0})</span>
                                    </h3>
                                    {isLecturer && (
                                        <button
                                            onClick={() => setIsAddRoundModalOpen(true)}
                                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                                        >
                                            + Babak
                                        </button>
                                    )}
                                </div>

                                {competition.rounds?.length === 0 ? (
                                    <p className="text-xs text-slate-400">Belum ada babak khusus yang dikonfigurasi.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {competition.rounds?.map((rnd: any) => (
                                            <div
                                                key={rnd.id}
                                                className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-slate-900">
                                                        Babak {rnd.round_number}: {rnd.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                                        {rnd.status}
                                                    </span>
                                                </div>
                                                {rnd.description && <p className="text-slate-500 text-[11px] mb-1">{rnd.description}</p>}
                                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                                    <span>Mulai: {rnd.starts_at ? new Date(rnd.starts_at).toLocaleDateString('id-ID') : '-'}</span>
                                                    <span>• Selesai: {rnd.ends_at ? new Date(rnd.ends_at).toLocaleDateString('id-ID') : '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Timeline Card */}
                            <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                    <Calendar className="size-4 text-blue-600" />
                                    <span>Jadwal Utama</span>
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
                                                    placeholder="Contoh: UI/UX Design, Competitive Programming"
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
                                                placeholder="Contoh: UI/UX Designer, Frontend Dev, Hustler (pisahkan koma)"
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

                {/* Record Result Modal */}
                <RecordResultModal
                    isOpen={resultModalOpen}
                    onClose={() => setResultModalOpen(false)}
                    participation={myParticipation}
                />
        </AppLayout>
    );
}
