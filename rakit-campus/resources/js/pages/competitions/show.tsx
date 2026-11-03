import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, ShieldCheck, Trophy, Users, Calendar, Plus, Bookmark, FolderKanban, CheckCircle2 } from 'lucide-react';
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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Competition Hub', href: '/competitions' },
        { title: competition.name, href: `/competitions/${competition.id}` },
    ];

    const toggleBookmark = async () => {
        try {
            const res = await fetch(`/api/v1/competitions/${competition.id}/bookmark`, {
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
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (res.ok) {
                alert('Partisipasi kompetisi berhasil didaftarkan! Workspace tim kini dapat diakses.');
                window.location.reload();
            } else {
                alert(json.message || 'Gagal mendaftar kompetisi.');
            }
        } catch {
            alert('Terjadi kesalahan.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${competition.name} — RAKIT Campus`} />

            <div className="max-w-6xl mx-auto p-6 w-full flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <Link
                        href="/competitions"
                        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition"
                    >
                        <ArrowLeft className="size-3.5" />
                        Kembali ke Competition Hub
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

                {/* Hero */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {competition.category?.replace('_', ' ')}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium capitalize">
                            Status: {competition.status}
                        </span>
                        {competition.scope === 'global' && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                                Nasional / Multi-Kampus
                            </span>
                        )}
                        <span className="text-xs text-neutral-500 ml-auto">
                            Diselenggarakan oleh: <strong className="text-neutral-800">{competition.organizer}</strong>
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-neutral-900">{competition.name}</h1>
                    <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{competition.description}</p>

                    <div className="flex flex-wrap items-center gap-6 mt-6 pt-5 border-t border-neutral-100 text-xs text-neutral-600">
                        <div>
                            <span className="text-neutral-400 block mb-0.5">Batas Registrasi</span>
                            <span className="font-semibold text-neutral-900">
                                {competition.registration_deadline
                                    ? new Date(competition.registration_deadline).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                      })
                                    : 'Segera Diumumkan'}
                            </span>
                        </div>
                        <div>
                            <span className="text-neutral-400 block mb-0.5">Ukuran Tim</span>
                            <span className="font-semibold text-neutral-900">
                                {competition.min_team_size} - {competition.max_team_size} Orang / Tim
                            </span>
                        </div>
                        <div>
                            <span className="text-neutral-400 block mb-0.5">Verifikasi Kampus</span>
                            <span className="font-semibold text-neutral-900 capitalize">
                                {competition.verification_status === 'verified' ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600">
                                        <ShieldCheck className="size-3.5" /> Terverifikasi Resmi
                                    </span>
                                ) : (
                                    'Belum Terverifikasi'
                                )}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="ml-auto flex items-center gap-3">
                            {competition.official_url && (
                                <a
                                    href={competition.official_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-medium transition"
                                >
                                    Web Resmi <ExternalLink className="size-3" />
                                </a>
                            )}

                            {myParticipation ? (
                                <Link
                                    href={`/workspace/${myParticipation.team_id}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                >
                                    <FolderKanban className="size-3.5" />
                                    Buka Workspace Tim ({myParticipation.team?.name})
                                </Link>
                            ) : (
                                <button
                                    onClick={() => setParticipateModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                >
                                    <Trophy className="size-3.5" />
                                    Daftarkan / Bentuk Tim
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Details */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {competition.eligibility && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-5">
                                <h3 className="text-sm font-bold text-neutral-900 mb-2">Persyaratan & Ketentuan Peserta</h3>
                                <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                                    {competition.eligibility}
                                </p>
                            </div>
                        )}

                        {competition.prize_info && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-5">
                                <h3 className="text-sm font-bold text-neutral-900 mb-2">Penghargaan & Hadiah</h3>
                                <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                                    {competition.prize_info}
                                </p>
                            </div>
                        )}

                        {/* Registered Teams for this Competition */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                                <Users className="size-4 text-neutral-500" />
                                Tim Kampus yang Berpartisipasi ({competition.participations?.length || 0})
                            </h3>

                            {competition.participations?.length === 0 ? (
                                <p className="text-xs text-neutral-500 py-2">
                                    Belum ada tim kampus yang mendaftar. Jadilah tim pertama yang mewakili kampus!
                                </p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {competition.participations?.map((part: any) => (
                                        <div
                                            key={part.id}
                                            className="p-3.5 border border-neutral-200 rounded-lg bg-neutral-50 flex items-center justify-between"
                                        >
                                            <div>
                                                <h4 className="text-xs font-bold text-neutral-900">{part.team?.name}</h4>
                                                {part.project && (
                                                    <span className="text-[11px] text-blue-600 block mt-0.5">
                                                        Proyek: {part.project.title}
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-neutral-500">
                                                    Anggota: {part.team?.members?.map((m: any) => m.user?.name).join(', ')}
                                                </span>
                                            </div>
                                            <span className="text-xs px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                                                {part.registration_status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Details */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3 text-xs text-neutral-700">
                            <h3 className="text-sm font-bold text-neutral-900 mb-2">Timeline Pelaksanaan</h3>
                            <div className="flex justify-between py-1 border-b border-neutral-100">
                                <span className="text-neutral-500">Buka Pendaftaran:</span>
                                <span className="font-semibold text-neutral-900">
                                    {competition.registration_opens_at
                                        ? new Date(competition.registration_opens_at).toLocaleDateString('id-ID')
                                        : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-100">
                                <span className="text-neutral-500">Tutup Pendaftaran:</span>
                                <span className="font-semibold text-neutral-900">
                                    {competition.registration_deadline
                                        ? new Date(competition.registration_deadline).toLocaleDateString('id-ID')
                                        : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-100">
                                <span className="text-neutral-500">Mulai Kompetisi:</span>
                                <span className="font-semibold text-neutral-900">
                                    {competition.starts_at ? new Date(competition.starts_at).toLocaleDateString('id-ID') : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-neutral-500">Selesai / Final:</span>
                                <span className="font-semibold text-neutral-900">
                                    {competition.ends_at ? new Date(competition.ends_at).toLocaleDateString('id-ID') : '-'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5">
                            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                                <ShieldCheck className="size-4 text-blue-700" />
                                Validitas Sumber Lomba
                            </h4>
                            <p className="text-[11px] text-blue-800 leading-relaxed">
                                {competition.verification_status === 'verified' ? (
                                    <>
                                        Kompetisi ini telah diverifikasi validitasnya oleh Administrator Kampus.
                                        {competition.last_verified_at && (
                                            <span className="block mt-1 text-[10px] text-blue-600">
                                                Terakhir diverifikasi:{' '}
                                                {new Date(competition.last_verified_at).toLocaleDateString('id-ID')}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    'Kompetisi ini diajukan oleh mahasiswa dan sedang menunggu verifikasi admin kampus.'
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form / Register Team Modal */}
                {isParticipateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95">
                            <h3 className="text-base font-bold text-neutral-900">Daftarkan Tim ke Kompetisi</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                Ikuti {competition.name} dengan membentuk tim baru atau menghubungkan proyek yang sudah ada.
                            </p>

                            {/* Mode Switcher */}
                            {myLedProjects.length > 0 && (
                                <div className="flex border border-neutral-200 rounded-lg p-1 mt-3 bg-neutral-50 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setParticipationMode('new_team')}
                                        className={`flex-1 py-1 rounded-md font-semibold transition ${
                                            participationMode === 'new_team' ? 'bg-white shadow-xs text-blue-600' : 'text-neutral-500'
                                        }`}
                                    >
                                        Bentuk Tim Baru
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setParticipationMode('existing_project')}
                                        className={`flex-1 py-1 rounded-md font-semibold transition ${
                                            participationMode === 'existing_project' ? 'bg-white shadow-xs text-blue-600' : 'text-neutral-500'
                                        }`}
                                    >
                                        Hubungkan Proyek Saya
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleCreateParticipation} className="mt-4 flex flex-col gap-3">
                                {participationMode === 'existing_project' ? (
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
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
                                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        >
                                            <option value="">-- Pilih Proyek Aktif Anda --</option>
                                            {myLedProjects.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.title} ({p.status})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-neutral-500 mt-1">
                                            Tim proyek dan anggota yang sudah ada akan otomatis ditautkan ke kompetisi ini tanpa membuat duplikasi data.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                                Nama Tim *
                                            </label>
                                            <input
                                                type="text"
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                                placeholder="Contoh: Garuda Tech Polindra"
                                                required
                                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                                Deskripsi / Sasaran Tim
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Fokus gagasan karya atau divisi lomba..."
                                                rows={3}
                                                className="w-full p-3 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setParticipateModalOpen(false)}
                                        className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                                    >
                                        {submitting ? 'Memproses...' : 'Konfirmasi Pendaftaran'}
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
