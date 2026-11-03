import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, ShieldCheck, Trophy, Users, Calendar, Plus, Bookmark } from 'lucide-react';
import { useState } from 'react';

interface Props {
    competition: any;
    isBookmarked: boolean;
    myParticipation?: any;
}

export default function CompetitionShow({ competition, isBookmarked: initialBookmarked, myParticipation }: Props) {
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [isParticipateModalOpen, setParticipateModalOpen] = useState(false);
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
        try {
            const res = await fetch(`/api/v1/competitions/${competition.id}/participate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ team_name: teamName, description }),
            });

            const json = await res.json();
            if (res.ok) {
                alert('Tim kompetisi berhasil dibuat! Anda sekarang dapat mengundang anggota dan membuka workspace.');
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
                        {competition.verification_status === 'verified' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <ShieldCheck className="size-3.5" />
                                Informasi Resmi Terverifikasi
                            </span>
                        )}
                        <span className="text-xs text-neutral-500 ml-auto capitalize">
                            Cakupan: {competition.scope}
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-neutral-900">{competition.name}</h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Penyelenggara:{' '}
                        <span className="text-neutral-900 font-medium">{competition.organizer}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-6 mt-6 pt-5 border-t border-neutral-100 text-xs text-neutral-600">
                        <div>
                            <span className="text-neutral-400 block mb-0.5">Batas Pendaftaran</span>
                            <span className="font-semibold text-neutral-900">
                                {competition.registration_deadline
                                    ? new Date(competition.registration_deadline).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                      })
                                    : 'Belum ditentukan'}
                            </span>
                        </div>
                        <div>
                            <span className="text-neutral-400 block mb-0.5">Ukuran Tim</span>
                            <span className="font-semibold text-neutral-900">
                                {competition.min_team_size} - {competition.max_team_size} Mahasiswa
                            </span>
                        </div>
                        <div>
                            <span className="text-neutral-400 block mb-0.5">Status Pendaftaran</span>
                            <span className="font-semibold text-emerald-600 uppercase tracking-wide">
                                {competition.status}
                            </span>
                        </div>

                        {myParticipation ? (
                            <Link
                                href={`/workspace/${myParticipation.team_id}`}
                                className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs shadow-sm transition"
                            >
                                <Users className="size-3.5" />
                                Buka Workspace Tim ({myParticipation.team?.name})
                            </Link>
                        ) : (
                            <button
                                onClick={() => setParticipateModalOpen(true)}
                                className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs shadow-sm transition"
                            >
                                <Plus className="size-3.5" />
                                Bentuk Tim Kompetisi
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Details */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="bg-white border border-neutral-200 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-neutral-900 mb-2">Tentang Kompetisi</h3>
                            <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                                {competition.description}
                            </p>
                        </div>

                        {competition.eligibility && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-5">
                                <h3 className="text-sm font-bold text-neutral-900 mb-2">Persyaratan & Ketentuan</h3>
                                <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                                    {competition.eligibility}
                                </p>
                            </div>
                        )}

                        {competition.prize_info && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-5">
                                <h3 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
                                    <Trophy className="size-4 text-amber-500" />
                                    Penghargaan & Hadiah
                                </h3>
                                <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                                    {competition.prize_info}
                                </p>
                            </div>
                        )}

                        {/* Participating Teams */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                                <Users className="size-4 text-neutral-500" />
                                Tim Terdaftar ({competition.participations?.length || 0})
                            </h3>
                            {competition.participations?.length === 0 ? (
                                <p className="text-xs text-neutral-500">
                                    Belum ada tim yang terdaftar. Jadilah tim pertama dari kampus Anda!
                                </p>
                            ) : (
                                <div className="flex flex-col gap-3 divide-y divide-neutral-100">
                                    {competition.participations.map((part: any) => (
                                        <div key={part.id} className="pt-2 first:pt-0 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xs font-semibold text-neutral-900">{part.team?.name}</h4>
                                                <p className="text-[11px] text-neutral-500">
                                                    {part.project ? `Terhubung proyek: ${part.project.title}` : 'Tim mandiri kompetisi'}
                                                </p>
                                            </div>
                                            <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium capitalize">
                                                {part.progress_status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar: Provenance & Links */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white border border-neutral-200 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-neutral-900 mb-3">Tautan Resmi</h3>
                            <div className="flex flex-col gap-2">
                                {competition.official_url && (
                                    <a
                                        href={competition.official_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 text-xs text-blue-600 hover:bg-neutral-50 transition"
                                    >
                                        <span>Website Resmi</span>
                                        <ExternalLink className="size-3" />
                                    </a>
                                )}
                                {competition.registration_url && (
                                    <a
                                        href={competition.registration_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 text-xs text-blue-600 hover:bg-neutral-50 transition"
                                    >
                                        <span>Portal Pendaftaran</span>
                                        <ExternalLink className="size-3" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Provenance Verification Source */}
                        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
                            <h3 className="text-xs font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
                                <ShieldCheck className="size-4 text-emerald-600" />
                                Integritas Data & Sumber
                            </h3>
                            <p className="text-[11px] text-neutral-600 leading-relaxed">
                                {competition.sources?.length > 0 ? (
                                    <>
                                        Diverifikasi dari sumber resmi:{' '}
                                        <span className="font-semibold">{competition.sources[0]?.label}</span>.
                                        {competition.last_verified_at && (
                                            <span className="block mt-1 text-[10px] text-neutral-400">
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

                {/* Form Team Modal */}
                {isParticipateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95">
                            <h3 className="text-base font-bold text-neutral-900">Bentuk Tim Kompetisi Baru</h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                Bentuk tim khusus untuk berpartisipasi dalam {competition.name}.
                            </p>

                            <form onSubmit={handleCreateParticipation} className="mt-4 flex flex-col gap-3">
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
                                        {submitting ? 'Membuat...' : 'Bentuk Tim'}
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
