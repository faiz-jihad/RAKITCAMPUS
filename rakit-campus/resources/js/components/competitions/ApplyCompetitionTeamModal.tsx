import { router } from '@inertiajs/react';
import {
    Briefcase,
    CheckCircle2,
    Globe,
    MessageSquare,
    Phone,
    Send,
    User,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

export interface ApplyTeamData {
    participationId: number;
    teamName: string;
    competitionName: string;
    organizer?: string;
    leaderName?: string;
    isMember?: boolean;
    isLeader?: boolean;
    roles?: Array<{
        id: number;
        name: string;
        slots: number;
        requirements?: string;
    }>;
}

interface Props {
    isOpen?: boolean;
    open?: boolean;
    onClose?: () => void;
    onOpenChange?: (open: boolean) => void;
    teamData: ApplyTeamData | null;
    currentUserInfo?: {
        name?: string;
        phone?: string;
        portfolio_url?: string;
        study_program?: string;
    } | null;
}

export function formatWhatsAppUrl(phone: string, text: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
        clean = '62' + clean;
    }
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export default function ApplyCompetitionTeamModal({
    isOpen,
    open,
    onClose,
    onOpenChange,
    teamData,
    currentUserInfo,
}: Props) {
    const isModalOpen = open ?? isOpen ?? false;
    const handleClose = () => {
        if (onClose) onClose();
        if (onOpenChange) onOpenChange(false);
    };

    if (!isModalOpen || !teamData) return null;

    const availableRoles = teamData.roles || [];
    const [selectedRoleId, setSelectedRoleId] = useState<string>(
        availableRoles.length > 0 ? String(availableRoles[0].id) : 'custom'
    );
    const [customRoleName, setCustomRoleName] = useState('');
    const [message, setMessage] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState(
        currentUserInfo?.phone || ''
    );
    const [portfolioUrl, setPortfolioUrl] = useState(
        currentUserInfo?.portfolio_url || ''
    );
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!message.trim()) {
            setErrorMessage('Silakan tuliskan pesan pengenalan diri Anda.');
            return;
        }

        const roleIdNumber =
            selectedRoleId !== 'custom' ? Number(selectedRoleId) : null;
        const roleName =
            selectedRoleId === 'custom'
                ? customRoleName.trim()
                : availableRoles.find((r) => String(r.id) === selectedRoleId)
                      ?.name;

        if (selectedRoleId === 'custom' && !customRoleName.trim()) {
            setErrorMessage('Silakan sebutkan nama peran yang ingin Anda ajukan.');
            return;
        }

        setSubmitting(true);

        router.post(
            `/competitions/teams/${teamData.participationId}/apply`,
            {
                recruitment_role_id: roleIdNumber,
                role_name: roleName,
                message: message.trim(),
                whatsapp_number: whatsappNumber.trim(),
                portfolio_url: portfolioUrl.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    handleClose();
                },
                onError: (errors) => {
                    setSubmitting(false);
                    const firstErr = Object.values(errors)[0];
                    setErrorMessage(
                        typeof firstErr === 'string'
                            ? firstErr
                            : 'Gagal mengirimkan lamaran. Periksa data kembali.'
                    );
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative my-8">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Ajukan Diri ke Tim
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {teamData.teamName} • {teamData.competitionName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {errorMessage && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                        {errorMessage}
                    </div>
                )}

                {(teamData.isMember || teamData.isLeader) && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span>Anda sudah bergabung dalam tim ini. Anda tidak dapat mengajukan diri lagi ke tim ini.</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Role Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                            <Briefcase className="size-3.5 text-blue-600" />
                            <span>Peran yang Ingin Anda Ambil</span>
                            <span className="text-rose-500">*</span>
                        </label>

                        {availableRoles.length > 0 ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 gap-2">
                                    {availableRoles.map((role) => (
                                        <label
                                            key={role.id}
                                            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                                                selectedRoleId === String(role.id)
                                                    ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/20'
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={String(role.id)}
                                                    checked={selectedRoleId === String(role.id)}
                                                    onChange={(e) => setSelectedRoleId(e.target.value)}
                                                    className="size-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800">
                                                        {role.name}
                                                    </div>
                                                    {role.requirements && (
                                                        <div className="text-[10px] text-slate-500">
                                                            {role.requirements}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                                {role.slots} Slot
                                            </span>
                                        </label>
                                    ))}

                                    <label
                                        className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                                            selectedRoleId === 'custom'
                                                ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/20'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value="custom"
                                            checked={selectedRoleId === 'custom'}
                                            onChange={(e) => setSelectedRoleId(e.target.value)}
                                            className="size-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-xs font-bold text-slate-800">
                                            Peran Lainnya (Tulis Sendiri)
                                        </span>
                                    </label>
                                </div>

                                {selectedRoleId === 'custom' && (
                                    <input
                                        type="text"
                                        placeholder="Contoh: Machine Learning Engineer, Hustler, Pitcher..."
                                        value={customRoleName}
                                        onChange={(e) => setCustomRoleName(e.target.value)}
                                        className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                        required
                                    />
                                )}
                            </div>
                        ) : (
                            <input
                                type="text"
                                placeholder="Contoh: UI/UX Designer, Frontend Developer, Paper Writer..."
                                value={customRoleName}
                                onChange={(e) => {
                                    setCustomRoleName(e.target.value);
                                    setSelectedRoleId('custom');
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                required
                            />
                        )}
                    </div>

                    {/* WhatsApp Contact */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                            <Phone className="size-3.5 text-emerald-600" />
                            <span>Nomor WhatsApp Aktif</span>
                            <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="08123456789"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        />
                    </div>

                    {/* Portfolio / GitHub Link */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                            <Globe className="size-3.5 text-slate-500" />
                            <span>Link Portofolio / GitHub / LinkedIn</span>
                            <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                        </label>
                        <input
                            type="url"
                            placeholder="https://github.com/... atau https://behance.net/..."
                            value={portfolioUrl}
                            onChange={(e) => setPortfolioUrl(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        />
                    </div>

                    {/* Intro Pitch Message */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                            <MessageSquare className="size-3.5 text-blue-600" />
                            <span>Perkenalan Diri & Alasan Bergabung</span>
                            <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Ceritakan keahlian, pengalaman terkait topik lomba ini, atau apa yang bisa Anda kontribusikan ke tim..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
                            required
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || teamData.isMember || teamData.isLeader}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                            <Send className="size-3.5" />
                            <span>{submitting ? 'Mengirim...' : (teamData.isMember || teamData.isLeader) ? 'Sudah Bergabung' : 'Kirim Lamaran'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
