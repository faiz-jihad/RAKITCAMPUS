import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
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
import { useState } from 'react';

interface Props {
    competition: any;
    isBookmarked: boolean;
    myParticipation?: any;
    myLedProjects?: any[];
}

export default function CompetitionShow({
    competition,
    isBookmarked: initialBookmarked,
    myParticipation,
    myLedProjects = [],
}: Props) {
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [isParticipateModalOpen, setParticipateModalOpen] = useState(false);
    const [participationMode, setParticipationMode] = useState<'new_team' | 'existing_project'>('new_team');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [teamName, setTeamName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Competition Hub', href: '/competitions' },
        { title: competition.name, href: `/competitions/${competition.id}` },
    ];

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const toggleBookmark = async () => {
        try {
            const res = await fetch(`/api/v1/competitions/${competition.id}/bookmark`, {
                method: 'POST',
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

    const handleCreateParticipation = async (e: React.FormEvent) => {
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

        try {
            const res = await fetch(`/api/v1/competitions/${competition.id}/participate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (res.ok) {
                setToastMessage('Tim berhasil didaftarkan ke kompetisi! Mengarahkan ke halaman workspace...');
                setTimeout(() => {
                    window.location.reload();
                }, 1200);
            } else {
                alert(json.message || 'Gagal mendaftar kompetisi.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${competition.name} — RAKIT Campus`} />

            <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F8F6FF] relative text-[#0E121B] pb-24 selection:bg-[#5448EE] selection:text-white">
                {/* Atmosphere background radial glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[340px] bg-gradient-to-b from-[#5448EE]/10 to-transparent blur-3xl pointer-events-none -z-0" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-6">
                    {/* Top Navigation Row */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/competitions"
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-600 hover:text-[#5448EE] hover:border-[#5448EE]/30 shadow-xs transition"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Competition Hub</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleBookmark}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border shadow-xs transition ${
                                    bookmarked
                                        ? 'bg-[#EEEDFD] text-[#5448EE] border-[#5448EE]/30'
                                        : 'bg-white text-neutral-700 border-neutral-200/80 hover:bg-neutral-50'
                                }`}
                            >
                                <Bookmark className="size-3.5" />
                                {bookmarked ? 'Tersimpan' : 'Simpan Lomba'}
                            </button>
                        </div>
                    </div>

                    {/* Toast Notification */}
                    {toastMessage && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            <span>{toastMessage}</span>
                        </div>
                    )}

                    {/* Hero Header Card */}
                    <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 shadow-lg shadow-[#5448EE]/5 relative overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] border border-[#5448EE]/20">
                                {competition.category?.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium capitalize">
                                Status: {competition.status}
                            </span>
                            {competition.scope === 'global' ? (
                                <span className="text-[11px] px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 font-semibold">
                                    Nasional / Multi-Kampus
                                </span>
                            ) : (
                                <span className="text-[11px] px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold">
                                    Internal Kampus
                                </span>
                            )}
                            <span className="text-xs text-neutral-500 ml-auto hidden sm:inline-block">
                                Penyelenggara: <strong className="text-neutral-800">{competition.organizer}</strong>
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E121B]">
                            {competition.name}
                        </h1>

                        <p className="text-xs sm:text-sm text-neutral-600 mt-3 leading-relaxed max-w-4xl">
                            {competition.description}
                        </p>

                        {/* Meta Highlights Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-neutral-100">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                                    <Calendar className="size-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] text-neutral-400 font-medium block">Batas Registrasi</span>
                                    <span className="text-xs font-bold text-neutral-900">
                                        {competition.registration_deadline
                                            ? new Date(competition.registration_deadline).toLocaleDateString('id-ID', {
                                                  day: 'numeric',
                                                  month: 'long',
                                                  year: 'numeric',
                                              })
                                            : 'Segera Diumumkan'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-[#5448EE] shrink-0">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] text-neutral-400 font-medium block">Ukuran Tim</span>
                                    <span className="text-xs font-bold text-neutral-900">
                                        {competition.min_team_size} - {competition.max_team_size} Mahasiswa / Tim
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] text-neutral-400 font-medium block">Verifikasi Kampus</span>
                                    <span className="text-xs font-bold text-neutral-900">
                                        {competition.verification_status === 'verified'
                                            ? 'Terverifikasi Resmi'
                                            : 'Menunggu Verifikasi'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Call to action buttons row */}
                        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                {competition.official_url && (
                                    <a
                                        href={competition.official_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-200/90 hover:bg-neutral-50 text-neutral-700 rounded-full text-xs font-semibold shadow-xs transition"
                                    >
                                        <span>Website Resmi Kompetisi</span>
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {myParticipation ? (
                                    <Link
                                        href={`/workspace/${myParticipation.team_id}`}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#181135] hover:bg-neutral-900 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-900/10 transition"
                                    >
                                        <FolderKanban className="size-4" />
                                        <span>Buka Workspace Tim ({myParticipation.team?.name})</span>
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => setParticipateModalOpen(true)}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-bold shadow-md shadow-indigo-500/25 transition active:scale-95"
                                    >
                                        <Trophy className="size-4" />
                                        <span>Daftarkan / Bentuk Tim Lomba</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main 2-Column Bento Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left 2 Cols: Details, Eligibility, Prizes, and Registered Teams */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* Eligibility Card */}
                            {competition.eligibility && (
                                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs">
                                    <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                                        <Sparkles className="size-4 text-[#5448EE]" />
                                        Persyaratan & Ketentuan Peserta
                                    </h3>
                                    <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                                        {competition.eligibility}
                                    </p>
                                </div>
                            )}

                            {/* Prize Info Card */}
                            {competition.prize_info && (
                                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs">
                                    <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                                        <Trophy className="size-4 text-amber-500" />
                                        Penghargaan & Hadiah
                                    </h3>
                                    <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                                        {competition.prize_info}
                                    </p>
                                </div>
                            )}

                            {/* Registered Teams */}
                            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                        <Users className="size-4 text-[#5448EE]" />
                                        Tim Kampus yang Berpartisipasi ({competition.participations?.length || 0})
                                    </h3>
                                    <span className="text-xs text-neutral-500 font-medium">
                                        Perwakilan Mahasiswa
                                    </span>
                                </div>

                                {competition.participations?.length === 0 ? (
                                    <div className="text-center py-8 px-4 bg-neutral-50/70 rounded-2xl border border-dashed border-neutral-200">
                                        <Trophy className="size-8 text-neutral-400 mx-auto mb-2" />
                                        <p className="text-xs font-semibold text-neutral-700">Belum ada tim kampus yang mendaftar</p>
                                        <p className="text-[11px] text-neutral-500 mt-1 mb-4">
                                            Jadilah kontingen pertama yang mewakili almamater Anda di ajang ini!
                                        </p>
                                        <button
                                            onClick={() => setParticipateModalOpen(true)}
                                            className="px-5 py-2 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-semibold transition"
                                        >
                                            Bentuk Tim Sekarang
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {competition.participations?.map((part: any) => (
                                            <div
                                                key={part.id}
                                                className="p-4 border border-neutral-200/80 rounded-2xl bg-neutral-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50 transition"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-xs font-bold text-neutral-900">{part.team?.name}</h4>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEEDFD] text-[#5448EE] font-bold">
                                                            {part.registration_status}
                                                        </span>
                                                    </div>
                                                    {part.project && (
                                                        <span className="text-[11px] text-[#5448EE] block mt-0.5 font-medium">
                                                            Taut Proyek: {part.project.title}
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] text-neutral-500 mt-1 block">
                                                        Anggota: {part.team?.members?.map((m: any) => m.user?.name).join(', ') || 'Belum ada anggota lain'}
                                                    </span>
                                                </div>

                                                {part.team_id && (
                                                    <Link
                                                        href={`/workspace/${part.team_id}`}
                                                        className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 hover:border-[#5448EE] text-neutral-700 hover:text-[#5448EE] text-xs font-semibold transition shrink-0 self-start sm:self-auto"
                                                    >
                                                        Lihat Workspace
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar: Timeline & Verification Status */}
                        <div className="flex flex-col gap-6">
                            {/* Timeline Card */}
                            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-2xs space-y-3.5 text-xs text-neutral-700">
                                <h3 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
                                    <Clock className="size-4 text-[#5448EE]" />
                                    Timeline Pelaksanaan
                                </h3>
                                <div className="flex justify-between py-2 border-b border-neutral-100">
                                    <span className="text-neutral-500">Buka Pendaftaran:</span>
                                    <span className="font-semibold text-neutral-900">
                                        {competition.registration_opens_at
                                            ? new Date(competition.registration_opens_at).toLocaleDateString('id-ID')
                                            : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-neutral-100">
                                    <span className="text-neutral-500">Tutup Pendaftaran:</span>
                                    <span className="font-semibold text-neutral-900">
                                        {competition.registration_deadline
                                            ? new Date(competition.registration_deadline).toLocaleDateString('id-ID')
                                            : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-neutral-100">
                                    <span className="text-neutral-500">Mulai Kompetisi:</span>
                                    <span className="font-semibold text-neutral-900">
                                        {competition.starts_at ? new Date(competition.starts_at).toLocaleDateString('id-ID') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-neutral-500">Selesai / Final:</span>
                                    <span className="font-semibold text-neutral-900">
                                        {competition.ends_at ? new Date(competition.ends_at).toLocaleDateString('id-ID') : '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Verification Card */}
                            <div className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/90 rounded-3xl p-6 shadow-2xs">
                                <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-2 mb-2">
                                    <ShieldCheck className="size-4 text-[#5448EE]" />
                                    Validitas Sumber Lomba
                                </h4>
                                <p className="text-xs text-neutral-600 leading-relaxed">
                                    {competition.verification_status === 'verified' ? (
                                        <>
                                            Kompetisi ini telah diverifikasi validitasnya oleh Administrator Kampus resmi.
                                            {competition.last_verified_at && (
                                                <span className="block mt-2 text-[11px] text-[#5448EE] font-medium">
                                                    Terakhir diverifikasi:{' '}
                                                    {new Date(competition.last_verified_at).toLocaleDateString('id-ID')}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        'Kompetisi ini diajukan oleh komunitas mahasiswa dan saat ini sedang menunggu verifikasi kurator kampus.'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form / Register Team Modal */}
                {isParticipateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 relative">
                            <button
                                onClick={() => setParticipateModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-2">
                                <span className="p-2 rounded-xl bg-[#EEEDFD] text-[#5448EE]">
                                    <Trophy className="size-5" />
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-neutral-900">Daftarkan Tim ke Kompetisi</h3>
                                    <p className="text-xs text-neutral-500">{competition.name}</p>
                                </div>
                            </div>

                            {/* Mode Switcher */}
                            {myLedProjects.length > 0 && (
                                <div className="flex border border-neutral-200/80 rounded-full p-1 mt-4 bg-neutral-100/70 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setParticipationMode('new_team')}
                                        className={`flex-1 py-1.5 rounded-full font-semibold transition ${
                                            participationMode === 'new_team' ? 'bg-white shadow-xs text-[#5448EE]' : 'text-neutral-500'
                                        }`}
                                    >
                                        Bentuk Tim Baru
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setParticipationMode('existing_project')}
                                        className={`flex-1 py-1.5 rounded-full font-semibold transition ${
                                            participationMode === 'existing_project' ? 'bg-white shadow-xs text-[#5448EE]' : 'text-neutral-500'
                                        }`}
                                    >
                                        Tautkan Proyek Saya
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleCreateParticipation} className="mt-5 flex flex-col gap-4">
                                {participationMode === 'existing_project' ? (
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                            Pilih Proyek yang Ingin Didaftarkan *
                                        </label>
                                        <select
                                            value={selectedProjectId}
                                            onChange={(e) => {
                                                setSelectedProjectId(e.target.value);
                                                const p = myLedProjects.find((x) => x.id === parseInt(e.target.value, 10));
                                                if (p) setTeamName(p.title);
                                            }}
                                            required
                                            className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                        >
                                            <option value="">-- Pilih Proyek Aktif yang Anda Pimpin --</option>
                                            {myLedProjects.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.title} ({p.status})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-neutral-500 mt-1.5">
                                            Data tim dan seluruh anggota aktif akan langsung terhubung ke kompetisi ini tanpa duplikasi basis data.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                                Nama Tim Mahasiswa *
                                            </label>
                                            <input
                                                type="text"
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                                placeholder="Contoh: Garuda Tech Polindra"
                                                required
                                                className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                                Deskripsi / Sasaran Karya Tim
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Tuliskan fokus ide karya inovasi atau pembagian peran divisi tim..."
                                                rows={3}
                                                className="w-full p-3.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:border-transparent outline-none transition"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end gap-2.5 mt-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setParticipateModalOpen(false)}
                                        className="px-4 py-2 border border-neutral-200 rounded-full text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-indigo-500/25"
                                    >
                                        {submitting ? 'Memproses Pendaftaran...' : 'Konfirmasi & Bentuk Tim'}
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