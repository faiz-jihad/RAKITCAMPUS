import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    Clock,
    Edit3,
    History,
    RefreshCw,
    Save,
    Scale,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Trash2,
    Users,
    X,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    rules: any[];
    auditLogs: any[];
    recentTransactions: any[];
    students: any[];
    teams: any[];
    projects: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Leaderboard', href: '/leaderboard' },
    { title: 'Kelola Leaderboard', href: '/leaderboard/admin' },
];

export default function LeaderboardAdmin({
    rules = [],
    auditLogs = [],
    recentTransactions = [],
    students = [],
    teams = [],
    projects = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'rules' | 'adjust' | 'audit'>('rules');
    const [recalculating, setRecalculating] = useState(false);

    // Adjustment Form
    const adjustForm = useForm({
        target_type: 'user',
        target_id: students[0]?.id || '',
        hub: 'general',
        points_delta: 50,
        reason: '',
    });

    const handleAdjustSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustForm.data.reason.trim()) {
            alert('Alasan penyesuaian skor wajib diisi untuk audit log resmi.');
            return;
        }

        adjustForm.post(route('leaderboard.admin.adjust'), {
            onSuccess: () => {
                adjustForm.reset('reason', 'points_delta');
                alert('Penyesuaian skor berhasil dicatat!');
            },
        });
    };

    const handleRecalculate = () => {
        if (confirm('Jalankan rekalkulasi penuh seluruh ledger skor dan snapshot klasemen? Proses ini memverifikasi ulang seluruh aktivitas historis.')) {
            setRecalculating(true);
            router.post(
                route('leaderboard.admin.recalculate'),
                {},
                {
                    onFinish: () => setRecalculating(false),
                }
            );
        }
    };

    const handleUpdateRulePoints = (ruleId: number, newPoints: number, isActive: boolean) => {
        router.patch(route('leaderboard.rules.update', ruleId), {
            base_points: newPoints,
            is_active: isActive,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen & Audit Leaderboard — RAKIT Campus" />

            <div className="max-w-7xl mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <div>
                        <Link
                            href="/leaderboard"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-1"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Klasemen</span>
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <Shield className="size-7 text-blue-600" />
                            <span>Manajemen & Audit Continuous Leaderboard</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Kendali aturan penilaian, audit trail transaksi poin, dan rekalkulasi klasemen RAKIT Campus.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={handleRecalculate}
                            disabled={recalculating}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`size-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                            <span>{recalculating ? 'Merekalkulasi...' : 'Rekalkulasi Klasemen'}</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('rules')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeTab === 'rules'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Scale className="size-3.5" />
                        <span>Aturan Penilaian ({rules.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('adjust')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeTab === 'adjust'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Edit3 className="size-3.5" />
                        <span>Penyesuaian Skor Manual</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('audit')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeTab === 'audit'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <History className="size-3.5" />
                        <span>Audit Trail & Transaksi Terakhir</span>
                    </button>
                </div>

                {/* 1. ATURAN PENILAIAN */}
                {activeTab === 'rules' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="text-sm font-extrabold text-slate-900">
                                Daftar Aturan Poin Terdaftar
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Base poin dan bobot multiplier dihitung secara deterministik server-side.
                            </p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {rules.map((rule: any) => (
                                <div key={rule.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                                rule.hub === 'competition'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : rule.hub === 'project'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                            }`}>
                                                {rule.hub}
                                            </span>
                                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                                                {rule.name}
                                            </h4>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                ({rule.activity_type})
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {rule.description}
                                        </p>
                                        {rule.multiplier_config && (
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 font-mono">
                                                <span>Level Multiplier:</span>
                                                {Object.entries(rule.multiplier_config).map(([k, v]) => (
                                                    <span key={k} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                                        {k}: {String(v)}x
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-slate-400">Base Poin:</span>
                                            <input
                                                type="number"
                                                defaultValue={rule.base_points}
                                                onBlur={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val) && val !== rule.base_points) {
                                                        handleUpdateRulePoints(rule.id, val, rule.is_active);
                                                    }
                                                }}
                                                className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono font-bold text-right"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleUpdateRulePoints(rule.id, rule.base_points, !rule.is_active)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                rule.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                            }`}
                                        >
                                            {rule.is_active ? 'Aktif' : 'Nonaktif'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. MANUAL SCORE ADJUSTMENT */}
                {activeTab === 'adjust' && (
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs max-w-2xl mx-auto space-y-5">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                <ShieldAlert className="size-4 text-amber-500" />
                                <span>Formulir Penyesuaian Skor Resmi</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Setiap penyesuaian skor dicatat dalam Point Transaction Ledger dan Leaderboard Audit Log dengan identitas admin penanggung jawab.
                            </p>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Tipe Entitas Sasaran:
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'user', label: 'Mahasiswa (User)' },
                                        { id: 'team', label: 'Tim Kompetisi/Proyek' },
                                        { id: 'project', label: 'Proyek Kelas' },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => adjustForm.setData('target_type', t.id as any)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                                                adjustForm.data.target_type === t.id
                                                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Pilih {adjustForm.data.target_type === 'user' ? 'Mahasiswa' : adjustForm.data.target_type === 'team' ? 'Tim' : 'Proyek'}:
                                </label>
                                <select
                                    value={adjustForm.data.target_id}
                                    onChange={(e) => adjustForm.setData('target_id', Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-600"
                                >
                                    {adjustForm.data.target_type === 'user' &&
                                        students.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.email})
                                            </option>
                                        ))}

                                    {adjustForm.data.target_type === 'team' &&
                                        teams.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}

                                    {adjustForm.data.target_type === 'project' &&
                                        projects.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.title}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Perubahan Poin (+ atau -):
                                    </label>
                                    <input
                                        type="number"
                                        value={adjustForm.data.points_delta}
                                        onChange={(e) => adjustForm.setData('points_delta', parseInt(e.target.value, 10))}
                                        placeholder="Contoh: 100 atau -50"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Kategori Hub:
                                    </label>
                                    <select
                                        value={adjustForm.data.hub}
                                        onChange={(e) => adjustForm.setData('hub', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium"
                                    >
                                        <option value="general">Umum / Keseluruhan</option>
                                        <option value="competition">Competition Hub</option>
                                        <option value="project">Project Hub</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Alasan Resmi Penyesuaian Skor (Wajib):
                                </label>
                                <textarea
                                    value={adjustForm.data.reason}
                                    onChange={(e) => adjustForm.setData('reason', e.target.value)}
                                    rows={3}
                                    placeholder="Contoh: Koreksi sertifikat Juara 2 Gemastik yang telah divalidasi keabsahannya oleh dewan juri."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-blue-600"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={adjustForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                                >
                                    {adjustForm.processing ? 'Menyimpan...' : 'Terapkan Penyesuaian Skor'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 3. AUDIT TRAIL & LEDGER TRANSACTIONS */}
                {activeTab === 'audit' && (
                    <div className="space-y-6">
                        {/* Audit Logs */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-blue-600" />
                                    <span>Riwayat Audit Log Admin ({auditLogs.length})</span>
                                </h3>
                                <span className="text-xs text-slate-400">Tercatat permanen</span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {auditLogs.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400">
                                        Belum ada catatan audit admin.
                                    </div>
                                ) : (
                                    auditLogs.map((log: any) => (
                                        <div key={log.id} className="p-4 sm:px-6 flex items-start justify-between gap-4 text-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <strong className="font-bold text-slate-900">{log.admin?.name}</strong>
                                                    <span className="text-slate-400">({log.action})</span>
                                                    {log.points_delta && (
                                                        <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${
                                                            log.points_delta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                        }`}>
                                                            {log.points_delta > 0 ? `+${log.points_delta}` : log.points_delta} pts
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-600 leading-relaxed">{log.reason}</p>
                                            </div>
                                            <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                                                {new Date(log.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Point Ledger Transactions */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            <div className="p-4 sm:px-6 border-b border-slate-100">
                                <h3 className="text-sm font-extrabold text-slate-900">
                                    50 Transaksi Poin Terakhir (Ledger)
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Setiap transaksi diverifikasi dengan idempotency key unik untuk mencegah skor duplikat.
                                </p>
                            </div>

                            <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
                                {recentTransactions.map((tx: any) => (
                                    <div key={tx.id} className="p-3.5 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
                                                tx.hub === 'competition' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {tx.hub}
                                            </span>
                                            <div className="min-w-0 truncate">
                                                <h5 className="font-extrabold text-slate-900 truncate">
                                                    {tx.description}
                                                </h5>
                                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                                    Key: {tx.idempotency_key} • {tx.user?.name || tx.team?.name || 'Sistem'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-mono font-black text-slate-900 text-sm">
                                                +{tx.points}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">
                                                {new Date(tx.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
