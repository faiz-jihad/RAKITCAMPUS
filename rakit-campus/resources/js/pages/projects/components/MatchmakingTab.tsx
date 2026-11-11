import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Award,
    Check,
    CheckCircle2,
    Clock,
    Filter,
    HelpCircle,
    Info,
    Mail,
    Plus,
    Search,
    Send,
    Shield,
    Sparkles,
    UserCheck,
    Users,
    X,
    Zap,
} from 'lucide-react';

interface Props {
    project: any;
    sameClassCandidates: any[];
    classStudents: any[];
    teamOptimization?: any;
    teamBalance?: any;
    isLeader: boolean;
    isLecturer: boolean;
    userHasActiveProject?: boolean;
}

export default function MatchmakingTab({
    project,
    sameClassCandidates = [],
    classStudents = [],
    teamOptimization,
    isLeader,
    isLecturer,
    userHasActiveProject,
}: Props) {
    const [subTab, setSubTab] = useState<'recommendations' | 'manual' | 'optimal'>('recommendations');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkillFilter, setSelectedSkillFilter] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
    const [invitingCandidate, setInvitingCandidate] = useState<any>(null);
    const [inviteMessage, setInviteMessage] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
    const [sendingInvite, setSendingInvite] = useState(false);

    const recruitmentRoles = project.team?.recruitment?.roles || [];

    // Filter class students for Mode A Manual Search
    const filteredClassStudents = classStudents.filter((student) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesName = student.name?.toLowerCase().includes(q);
            const matchesNim = student.student_number?.toLowerCase().includes(q);
            const matchesSkill = student.skills?.some((s: any) => s.name?.toLowerCase().includes(q));
            if (!matchesName && !matchesNim && !matchesSkill) return false;
        }

        if (selectedSkillFilter) {
            const hasSkill = student.skills?.some((s: any) =>
                s.name?.toLowerCase() === selectedSkillFilter.toLowerCase()
            );
            if (!hasSkill) return false;
        }

        if (selectedRoleFilter) {
            const hasRole = student.preferred_roles?.some((r: string) =>
                r.toLowerCase().includes(selectedRoleFilter.toLowerCase())
            );
            if (!hasRole) return false;
        }

        return true;
    });

    const handleOpenInvite = (candidateUser: any) => {
        setInvitingCandidate(candidateUser);
        setInviteMessage(`Hai ${candidateUser.name}, kami mengundang Anda untuk bergabung ke dalam tim proyek "${project.title}" pada peran yang sesuai dengan keahlian Anda.`);
        if (recruitmentRoles.length > 0) {
            setSelectedRoleId(recruitmentRoles[0].id);
        }
    };

    const handleSendInvitation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!invitingCandidate) return;

        setSendingInvite(true);
        router.post(
            `/projects/${project.id}/invitations`,
            {
                invitee_id: invitingCandidate.id || invitingCandidate.user_id,
                recruitment_role_id: selectedRoleId || null,
                message: inviteMessage,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setInvitingCandidate(null);
                    setInviteMessage('');
                },
                onFinish: () => setSendingInvite(false),
            }
        );
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Class Boundary Notice Banner */}
            <div className="glass-card rounded-2xl p-5 border-l-4 border-l-blue-600 bg-blue-50/40">
                <div className="flex items-start gap-3">
                    <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                            Batas Ekosistem Kelas Perkuliahan (Strictly Class-Based)
                        </h4>
                        <p className="text-xs text-blue-800/90 mt-0.5 leading-relaxed">
                            Proyek ini terikat pada kelas perkuliahan <strong className="text-blue-950 font-bold">{project.academicClass?.name} ({project.academicClass?.code})</strong>.
                            Hanya mahasiswa yang terdaftar resmi pada kelas ini yang dapat dicari, direkomendasikan, dan diundang ke dalam tim.
                        </p>
                    </div>
                </div>
            </div>

            {/* Sub-mode Navigation Selector */}
            <div className="glass-surface p-1.5 rounded-2xl flex flex-wrap items-center gap-1">
                <button
                    onClick={() => setSubTab('recommendations')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        subTab === 'recommendations'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                >
                    <Sparkles className="size-3.5" />
                    <span>Mode B: Rekomendasi Cerdas ({sameClassCandidates.length})</span>
                </button>

                <button
                    onClick={() => setSubTab('manual')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        subTab === 'manual'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                >
                    <Search className="size-3.5" />
                    <span>Mode A: Cari Rekan Sekelas ({classStudents.length})</span>
                </button>

                {teamOptimization && (
                    <button
                        onClick={() => setSubTab('optimal')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                            subTab === 'optimal'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                    >
                        <Zap className="size-3.5 text-amber-500" />
                        <span>Kombinasi Tim Optimal</span>
                    </button>
                )}
            </div>

            {/* SUB-TAB 1: MODE B - SMART RECOMMENDATIONS */}
            {subTab === 'recommendations' && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Rekomendasi Kandidat Terbaik Berdasarkan Kebutuhan Tim
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Dihitung otomatis menggunakan formula 6-komponen transparan (Skill 30%, Peran 20%, Minat 15%, Availability 10%, Diversitas 15%, Fairness 10%).
                            </p>
                        </div>
                    </div>

                    {sameClassCandidates.length === 0 ? (
                        <div className="glass-card rounded-2xl p-10 text-center">
                            <Users className="size-10 text-slate-300 mx-auto mb-2" />
                            <h4 className="text-sm font-bold text-slate-700">Belum Ada Kandidat Tersedia</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                Seluruh mahasiswa di kelas ini telah memiliki kelompok atau belum melengkapi profil keahlian mereka.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sameClassCandidates.map((cand: any, idx: number) => {
                                const u = cand.user || cand;
                                const score = cand.match_score ?? cand.score ?? 75;
                                const breakdown = cand.breakdown || {};

                                return (
                                    <div
                                        key={idx}
                                        className="glass-card rounded-2xl p-5 hover:border-blue-300 transition flex flex-col justify-between gap-4"
                                    >
                                        <div>
                                            {/* Candidate Header */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-11 rounded-xl bg-blue-600/10 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-500/20">
                                                        {u.name?.charAt(0) || 'M'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900">{u.name}</h4>
                                                        <span className="text-[11px] text-slate-500 font-medium">
                                                            {u.email}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                                                        {score}% Cocok
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Explanation */}
                                            <p className="text-xs text-slate-600 mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 leading-relaxed">
                                                {cand.explanation || 'Kandidat memiliki keahlian komplementer yang melengkapi komposisi tim.'}
                                            </p>

                                            {/* 6-Component Score Breakdown Pills */}
                                            <div className="grid grid-cols-3 gap-1.5 mt-3 text-[10px]">
                                                <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200 text-center">
                                                    <span className="text-slate-400 block font-semibold">Skill (30%)</span>
                                                    <strong className="text-slate-900 font-bold">{breakdown.skill ?? 70}%</strong>
                                                </div>
                                                <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200 text-center">
                                                    <span className="text-slate-400 block font-semibold">Peran (20%)</span>
                                                    <strong className="text-slate-900 font-bold">{breakdown.role ?? 70}%</strong>
                                                </div>
                                                <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200 text-center">
                                                    <span className="text-slate-400 block font-semibold">Minat (15%)</span>
                                                    <strong className="text-slate-900 font-bold">{breakdown.interest ?? 70}%</strong>
                                                </div>
                                                <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200 text-center">
                                                    <span className="text-slate-400 block font-semibold">Waktu (10%)</span>
                                                    <strong className="text-slate-900 font-bold">{breakdown.availability ?? 70}%</strong>
                                                </div>
                                                <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200 text-center">
                                                    <span className="text-slate-400 block font-semibold">Diversitas (15%)</span>
                                                    <strong className="text-slate-900 font-bold">{breakdown.diversity ?? 70}%</strong>
                                                </div>
                                                <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200 text-center">
                                                    <span className="text-slate-400 block font-semibold">Fairness (10%)</span>
                                                    <strong className="text-emerald-700 font-bold">{breakdown.fairness ?? 70}%</strong>
                                                </div>
                                            </div>

                                            {/* Complementary & Matched Skills */}
                                            {cand.matched_skills && cand.matched_skills.length > 0 && (
                                                <div className="mt-3">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                        Keahlian Sesuai Kebutuhan
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {cand.matched_skills.map((s: string, si: number) => (
                                                            <span key={si} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 inline-flex items-center gap-1">
                                                                <Check className="w-3 h-3 stroke-[2.5]" />
                                                                <span>{s}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action */}
                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                                            {isLeader && (
                                                <button
                                                    onClick={() => handleOpenInvite(u)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                                                >
                                                    <Send className="size-3.5" />
                                                    <span>Undang ke Tim</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* SUB-TAB 2: MODE A - MANUAL SAME-CLASS SEARCH */}
            {subTab === 'manual' && (
                <div className="flex flex-col gap-4">
                    {/* Search & Filters */}
                    <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
                        <div className="relative flex-1 w-full">
                            <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama rekan, NIM, atau keahlian..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                value={selectedSkillFilter}
                                onChange={(e) => setSelectedSkillFilter(e.target.value)}
                                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                            >
                                <option value="">Semua Keahlian</option>
                                <option value="Laravel">Laravel</option>
                                <option value="React">React</option>
                                <option value="Figma">Figma</option>
                                <option value="Flutter">Flutter</option>
                                <option value="MySQL">MySQL</option>
                            </select>

                            <select
                                value={selectedRoleFilter}
                                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                            >
                                <option value="">Semua Peran</option>
                                <option value="Backend">Backend</option>
                                <option value="Frontend">Frontend</option>
                                <option value="UI/UX">UI/UX</option>
                                <option value="Mobile">Mobile</option>
                            </select>
                        </div>
                    </div>

                    {/* Student List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClassStudents.map((st: any) => {
                            const isEligible = !st.has_active_project && !st.is_member;

                            return (
                                <div
                                    key={st.id}
                                    className={`glass-card rounded-2xl p-5 flex flex-col justify-between gap-3 ${
                                        !isEligible ? 'opacity-60 bg-slate-50/50' : 'hover:border-blue-300'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900">{st.name}</h4>
                                                <span className="text-[11px] text-slate-500 font-mono">
                                                    NIM: {st.student_number || '—'}
                                                </span>
                                            </div>
                                            {st.is_member ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                    Anggota Tim Ini
                                                </span>
                                            ) : st.has_active_project ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                                    Sudah Punya Tim
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                                    Tersedia
                                                </span>
                                            )}
                                        </div>

                                        {/* Preferred roles */}
                                        {st.preferred_roles && st.preferred_roles.length > 0 && (
                                            <div className="mt-2.5">
                                                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Minat Peran</span>
                                                <span className="text-xs font-bold text-slate-800">
                                                    {st.preferred_roles.join(', ')}
                                                </span>
                                            </div>
                                        )}

                                        {/* Skills with proficiency */}
                                        <div className="mt-2.5">
                                            <span className="text-[10px] text-slate-400 block font-semibold uppercase mb-1">Keahlian</span>
                                            <div className="flex flex-wrap gap-1">
                                                {st.skills && st.skills.length > 0 ? (
                                                    st.skills.map((sk: any, ski: number) => (
                                                        <span key={ski} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                            {sk.name} (Lvl {sk.proficiency})
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">Belum mengisi keahlian</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-2.5 text-[11px] text-slate-500">
                                            Komitmen: <strong>{st.availability_hours || 10} jam/minggu</strong>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                                        {isLeader && isEligible && (
                                            <button
                                                onClick={() => handleOpenInvite(st)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>Undang</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SUB-TAB 3: TEAM OPTIMIZATION ENGINE RESULTS */}
            {subTab === 'optimal' && teamOptimization && (
                <div className="flex flex-col gap-4">
                    <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-50/50 via-white to-slate-50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold mb-2">
                                    <Zap className="size-3.5 text-amber-600" />
                                    <span>Hasil Optimasi Kombinasi Kelompok (TeamOptimizationService)</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    Kombinasi Rekan Komplementer Terbaik
                                </h3>
                                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    Algoritma mengevaluasi kumpulan kandidat sekelas secara terpadu untuk memaksimalkan cakupan peran dan keahlian tanpa terjadi penumpukan peran sejenis (*anti-clique*).
                                </p>
                            </div>

                            <div className="text-right shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skor Sinergi Tim</span>
                                <div className="text-3xl font-black text-blue-600 tracking-tight">
                                    {teamOptimization.team_balance_score}%
                                </div>
                            </div>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                            <div className="p-3 rounded-xl bg-white border border-slate-200">
                                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Cakupan Keahlian</span>
                                <strong className="text-slate-900 font-bold text-base">{teamOptimization.skill_coverage_percent}%</strong>
                            </div>
                            <div className="p-3 rounded-xl bg-white border border-slate-200">
                                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Cakupan Peran</span>
                                <strong className="text-slate-900 font-bold text-base">{teamOptimization.role_coverage_percent}%</strong>
                            </div>
                            <div className="p-3 rounded-xl bg-white border border-slate-200">
                                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Keahlian Terpenuhi</span>
                                <strong className="text-emerald-700 font-bold text-base">{teamOptimization.covered_skills?.length || 0} Keahlian</strong>
                            </div>
                            <div className="p-3 rounded-xl bg-white border border-slate-200">
                                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Slot Lowong</span>
                                <strong className="text-amber-700 font-bold text-base">{teamOptimization.unfilled_roles?.length || 0} Posisi</strong>
                            </div>
                        </div>

                        {/* Explanation */}
                        <p className="text-xs text-slate-600 mt-4 p-3 rounded-xl bg-white border border-slate-200 leading-relaxed">
                            {teamOptimization.explanation}
                        </p>
                    </div>

                    {/* Recommended Optimal Combination Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teamOptimization.optimal_candidates?.map((item: any, idx: number) => (
                            <div key={idx} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-3">
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                                                {item.user?.name?.charAt(0) || 'M'}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900">{item.user?.name}</h4>
                                                <span className="text-[11px] font-semibold text-blue-700">
                                                    Ditugaskan: {item.assigned_role}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {item.individual_score}% Match
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-600 mt-2.5 p-2 rounded-lg bg-slate-50">
                                        {item.marginal_contribution}
                                    </p>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    {isLeader && (
                                        <button
                                            onClick={() => handleOpenInvite(item.user)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                                        >
                                            <Send className="size-3.5" />
                                            <span>Undang Kandidat Ini</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SEND INVITATION MODAL */}
            {invitingCandidate && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Mail className="size-4.5 text-blue-600" />
                                <span>Undang {invitingCandidate.name} ke Tim</span>
                            </h3>
                            <button
                                onClick={() => setInvitingCandidate(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSendInvitation} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Peran Lowongan</label>
                                <select
                                    value={selectedRoleId}
                                    onChange={(e) => setSelectedRoleId(e.target.value ? parseInt(e.target.value) : '')}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                                >
                                    <option value="">Peran Kolaborator Umum</option>
                                    {recruitmentRoles.map((r: any) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} (Sisa Kuota: {r.vacancies ?? r.slots} orang)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Pesan Undangan / Tawaran</label>
                                <textarea
                                    rows={4}
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    placeholder="Tuliskan alasan mengapa rekan ini cocok bergabung dengan proyek..."
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setInvitingCandidate(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingInvite}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    {sendingInvite ? 'Mengirim...' : 'Kirim Undangan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
