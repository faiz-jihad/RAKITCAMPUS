import { Calendar, CheckCircle2, ExternalLink, GitBranch, GitCommit, GitPullRequest, User, X } from 'lucide-react';
import React from 'react';

interface MemberData {
    user_id?: number;
    contributor_id?: number;
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
    is_mapped: boolean;
    github_login?: string;
    github_avatar?: string;
    total_commits: number;
    total_additions: number;
    total_deletions: number;
    active_days: number;
    branches?: string[];
    prs_created?: number;
    reviews_given?: number;
    last_activity?: string;
    recent_timeline?: { date: string; commits: number }[];
}

interface Props {
    member: MemberData | null;
    onClose: () => void;
    repoFullName?: string;
}

export default function GitHubMemberDetailModal({ member, onClose, repoFullName }: Props) {
    if (!member) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3.5">
                        <div className="size-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                            {member.avatar || member.github_avatar ? (
                                <img
                                    src={member.avatar || member.github_avatar}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="size-6 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-bold text-slate-900">{member.name}</h2>
                                {member.role && (
                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                                        {member.role}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                {member.github_login ? (
                                    <a
                                        href={`https://github.com/${member.github_login}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 hover:underline flex items-center gap-1 font-mono font-medium"
                                    >
                                        <span>@{member.github_login}</span>
                                        <ExternalLink className="size-3 text-slate-400" />
                                    </a>
                                ) : (
                                    <span className="text-amber-600 font-medium">Belum dipetakan ke akun GitHub</span>
                                )}
                                {member.email && <span>• {member.email}</span>}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="size-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* 4 Metric Bento Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                        <span className="text-[10px] text-slate-400 font-semibold block">Total Commit</span>
                        <div className="text-lg font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                            <GitCommit className="size-4 text-blue-600 shrink-0" />
                            <span>{member.total_commits}</span>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                        <span className="text-[10px] text-slate-400 font-semibold block">Hari Aktif</span>
                        <div className="text-lg font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                            <Calendar className="size-4 text-emerald-600 shrink-0" />
                            <span>{member.active_days} Hari</span>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                        <span className="text-[10px] text-slate-400 font-semibold block">Pull Request</span>
                        <div className="text-lg font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                            <GitPullRequest className="size-4 text-purple-600 shrink-0" />
                            <span>{member.prs_created ?? 0} PR</span>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                        <span className="text-[10px] text-slate-400 font-semibold block">Baris Kode</span>
                        <div className="text-xs font-bold text-slate-800 mt-1">
                            <span className="text-emerald-600">+{member.total_additions.toLocaleString()}</span> /{' '}
                            <span className="text-rose-600">-{member.total_deletions.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Branch Participation */}
                {member.branches && member.branches.length > 0 && (
                    <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <GitBranch className="size-3.5 text-blue-600" />
                            <span>Partisipasi Branch ({member.branches.length})</span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {member.branches.map((b) => (
                                <span
                                    key={b}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono font-medium text-slate-700"
                                >
                                    {b}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 14-Day Timeline Bar */}
                {member.recent_timeline && member.recent_timeline.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-800">
                            Frekuensi Commit (14 Hari Terakhir)
                        </h4>
                        <div className="flex items-end gap-1.5 h-16 pt-2">
                            {member.recent_timeline.map((item, idx) => {
                                const heightPercent = item.commits > 0 ? Math.min(100, Math.max(20, item.commits * 15)) : 6;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                                        <div
                                            style={{ height: `${heightPercent}%` }}
                                            className={`w-full rounded-t-sm transition-all duration-300 ${
                                                item.commits > 0 ? 'bg-blue-600 group-hover:bg-blue-700' : 'bg-slate-200'
                                            }`}
                                            title={`${item.commits} commit pada ${item.date}`}
                                        />
                                        <span className="text-[8px] text-slate-400 font-mono">
                                            {item.date.slice(8, 10)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                        Aktivitas Terakhir:{' '}
                        {member.last_activity
                            ? new Date(member.last_activity).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : 'Belum ada aktivitas'}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
