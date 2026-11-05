import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Clock,
    FileText,
    Inbox,
    MailCheck,
    Send,
    ShieldAlert,
    Trash2,
    UserCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';

interface Props {
    project: any;
    sentInvitations: any[];
    receivedInvitations: any[];
    isLeader: boolean;
    isLecturer: boolean;
    userHasActiveProject?: boolean;
}

export default function InvitationsTab({
    project,
    sentInvitations = [],
    receivedInvitations = [],
    isLeader,
    isLecturer,
    userHasActiveProject = false,
}: Props) {
    const [submittingId, setSubmittingId] = useState<number | null>(null);
    const [declineModalId, setDeclineModalId] = useState<number | null>(null);
    const [declineReason, setDeclineReason] = useState<string>('');

    const handleCancelInvitation = (invitationId: number) => {
        if (!confirm('Apakah kamu yakin ingin membatalkan undangan rekrutmen ini?')) return;
        setSubmittingId(invitationId);
        router.post(`/invitations/${invitationId}/cancel`, {}, {
            preserveScroll: true,
            onFinish: () => setSubmittingId(null),
        });
    };

    const handleAcceptInvitation = (invitationId: number) => {
        if (userHasActiveProject) {
            alert('Perhatian: Anda sudah memiliki keanggotaan proyek aktif lain. Sesuai aturan RAKIT Campus (Unified Membership), satu mahasiswa hanya dapat menjadi anggota 1 proyek aktif sekaligus.');
            return;
        }

        if (!confirm('Terima undangan ini dan resmi bergabung ke dalam kelompok proyek?')) return;
        setSubmittingId(invitationId);
        router.post(`/invitations/${invitationId}/accept`, {}, {
            preserveScroll: true,
            onFinish: () => setSubmittingId(null),
        });
    };

    const handleDeclineInvitation = () => {
        if (!declineModalId) return;
        setSubmittingId(declineModalId);
        router.post(
            `/invitations/${declineModalId}/decline`,
            { declined_reason: declineReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDeclineModalId(null);
                    setDeclineReason('');
                },
                onFinish: () => setSubmittingId(null),
            }
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="size-3" />
                        Menunggu Respons
                    </span>
                );
            case 'accepted':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="size-3" />
                        Diterima
                    </span>
                );
            case 'declined':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="size-3" />
                        Ditolak
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                        Dibatalkan
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                        Kedaluwarsa
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Section 1: Received Invitations (Directly relevant to current user) */}
            {receivedInvitations.length > 0 && (
                <div className="glass-surface p-6 rounded-3xl border border-blue-200/90 bg-gradient-to-br from-blue-50/50 via-white to-slate-50/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-blue-600 text-white">
                                <Inbox className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Undangan Diterima Untuk Anda ({receivedInvitations.length})
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Anda telah diundang untuk bergabung ke proyek tim berikut.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {receivedInvitations.map((inv) => (
                            <div
                                key={inv.id}
                                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="space-y-1 max-w-xl">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-slate-900">
                                            {inv.team?.project?.title || 'Proyek RAKIT'}
                                        </h4>
                                        {getStatusBadge(inv.status)}
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        Diundang oleh <span className="font-semibold text-slate-800">{inv.inviter?.name || 'Ketua Tim'}</span>
                                        {inv.role && <> untuk posisi <span className="font-bold text-blue-600">{inv.role.name}</span></>}
                                    </p>
                                    {inv.message && (
                                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                                            "{inv.message}"
                                        </p>
                                    )}
                                </div>

                                {inv.status === 'pending' && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleAcceptInvitation(inv.id)}
                                            disabled={submittingId === inv.id}
                                            className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                        >
                                            <Check className="size-3.5" />
                                            <span>Terima Undangan</span>
                                        </button>
                                        <button
                                            onClick={() => setDeclineModalId(inv.id)}
                                            disabled={submittingId === inv.id}
                                            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                        >
                                            <X className="size-3.5" />
                                            <span>Tolak</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 2: Sent Invitations (Project Team's Recruitment Outbox) */}
            <div className="glass-surface p-6 rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-900 text-white">
                            <Send className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Daftar Undangan Terkirim ({sentInvitations.length})
                            </h3>
                            <p className="text-xs text-slate-500">
                                Histori dan status seluruh undangan rekrutmen yang dikirimkan oleh tim ini.
                            </p>
                        </div>
                    </div>
                </div>

                {sentInvitations.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-3 px-4">Kandidat Diundang</th>
                                    <th className="py-3 px-4">Posisi Peran</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Waktu Dikirim</th>
                                    <th className="py-3 px-4">Keterangan / Alasan</th>
                                    {(isLeader || isLecturer) && (
                                        <th className="py-3 px-4 text-center">Aksi</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sentInvitations.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-900">
                                                {inv.invitee?.name || 'Mahasiswa'}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                {inv.invitee?.email || ''}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                                            {inv.role?.name || 'Anggota Tim'}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {getStatusBadge(inv.status)}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500">
                                            {new Date(inv.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                                            {inv.declined_reason ? (
                                                <span className="text-rose-600 font-medium">
                                                    Alasan ditolak: "{inv.declined_reason}"
                                                </span>
                                            ) : inv.message ? (
                                                <span className="text-slate-500">"{inv.message}"</span>
                                            ) : (
                                                <span className="text-slate-400 italic">—</span>
                                            )}
                                        </td>
                                        {(isLeader || isLecturer) && (
                                            <td className="py-3.5 px-4 text-center">
                                                {inv.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleCancelInvitation(inv.id)}
                                                        disabled={submittingId === inv.id}
                                                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                                                    >
                                                        <Trash2 className="size-3" />
                                                        <span>Batalkan</span>
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80">
                        <Send className="size-10 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-slate-800">Belum Ada Undangan Terkirim</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Gunakan tab <span className="font-semibold text-blue-600">"Matchmaking"</span> untuk menemukan dan mengundang teman sekelas yang memiliki keahlian komplementer.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal Decline Reason */}
            {declineModalId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900">Tolak Undangan Proyek</h3>
                            <button
                                onClick={() => setDeclineModalId(null)}
                                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 mb-4">
                            Berikan alasan penolakan secara sopan agar ketua tim dapat mencari rekan lainnya:
                        </p>
                        <textarea
                            rows={3}
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Contoh: Maaf, saya sedang fokus pada topik lain atau jadwal bentrok..."
                            className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                        <div className="flex items-center justify-end gap-2 mt-4">
                            <button
                                onClick={() => setDeclineModalId(null)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeclineInvitation}
                                disabled={submittingId === declineModalId}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50"
                            >
                                Konfirmasi Tolak
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
