import { useState } from 'react';
import {
    Activity,
    AlertCircle,
    Award,
    CheckCircle2,
    Clock,
    HelpCircle,
    Info,
    Layers,
    PieChart,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    UserCheck,
    Users,
} from 'lucide-react';

interface Props {
    project: any;
    teamBalance: {
        overall_score: number;
        team_size: {
            current: number;
            target: number;
            max: number;
            is_full: boolean;
            vacancies: number;
        };
        competencies_table: Array<{
            name: string;
            type: string;
            required: number;
            available: number;
            status: 'complete' | 'partial' | 'missing' | 'overrepresented';
            contributors: string[];
        }>;
        radar_data: Array<{
            axis: string;
            label: string;
            score: number;
        }>;
        member_contributions: Array<{
            user_id: number;
            name: string;
            role: string;
            skills: string[];
            primary_archetype: string;
        }>;
        missing_competencies: string[];
        overrepresented_competencies: string[];
        analysis_summary: string;
    };
    teamOptimization?: {
        optimal_candidates: Array<{
            user: any;
            assigned_role: string;
            marginal_contribution: string;
            individual_score: number;
        }>;
        team_balance_score: number;
        skill_coverage_percent: number;
        role_coverage_percent: number;
        covered_skills: string[];
        unmet_skills: string[];
        filled_roles: string[];
        unfilled_roles: string[];
        explanation: string;
        is_fully_covered: boolean;
    } | null;
}

export default function TeamBalanceTab({ project, teamBalance, teamOptimization }: Props) {
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const radar = teamBalance?.radar_data || [
        { axis: 'frontend', label: 'Frontend', score: 30 },
        { axis: 'backend', label: 'Backend', score: 30 },
        { axis: 'ui_ux', label: 'UI/UX Design', score: 30 },
        { axis: 'mobile_cloud', label: 'Mobile & Cloud', score: 30 },
        { axis: 'database_qa', label: 'Database & QA', score: 30 },
        { axis: 'management', label: 'Collaboration', score: 30 },
    ];

    const overallScore = teamBalance?.overall_score || 0;
    const teamSize = teamBalance?.team_size || { current: 1, target: 4, vacancies: 3, is_full: false };
    const missing = teamBalance?.missing_competencies || [];
    const overrepresented = teamBalance?.overrepresented_competencies || [];
    const competencies = teamBalance?.competencies_table || [];
    const members = teamBalance?.member_contributions || [];

    const filteredCompetencies = competencies.filter((item) => {
        if (filterStatus === 'all') return true;
        return item.status === filterStatus;
    });

    // Radar math calculations (Center 180, 180, radius 120)
    const cx = 180;
    const cy = 180;
    const maxR = 115;
    const numAxes = radar.length;
    const angleStep = (2 * Math.PI) / numAxes;

    // Grid rings (25%, 50%, 75%, 100%)
    const ringLevels = [0.25, 0.5, 0.75, 1.0];
    const ringPolygons = ringLevels.map((lvl) => {
        const points = radar.map((_, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const r = maxR * lvl;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
        return points;
    });

    // Actual Data polygon
    const dataPoints = radar.map((item, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const normScore = Math.min(100, Math.max(10, item.score)) / 100;
        const r = maxR * normScore;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return { x, y, score: item.score, label: item.label, angle };
    });

    const dataPolygonString = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

    const getScoreBadgeColor = (score: number) => {
        if (score >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        if (score >= 50) return 'text-blue-700 bg-blue-50 border-blue-200';
        if (score >= 35) return 'text-amber-700 bg-amber-50 border-amber-200';
        return 'text-rose-700 bg-rose-50 border-rose-200';
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Top Stat Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Overall Balance Score */}
                <div className="glass-surface p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Skor Keseimbangan Tim
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-extrabold text-slate-900">{overallScore}</span>
                            <span className="text-xs font-semibold text-slate-400">/ 100</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">
                            {overallScore >= 75
                                ? 'Komposisi sangat seimbang'
                                : overallScore >= 50
                                ? 'Komposisi cukup seimbang'
                                : 'Perlu melengkapi spesialisasi'}
                        </p>
                    </div>
                    <div className={`size-14 rounded-2xl border flex flex-col items-center justify-center font-black text-lg ${getScoreBadgeColor(overallScore)}`}>
                        <TrendingUp className="size-5 mb-0.5" />
                        <span className="text-xs font-extrabold">{overallScore}%</span>
                    </div>
                </div>

                {/* 2. Team Capacity */}
                <div className="glass-surface p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Kapasitas Anggota
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-extrabold text-slate-900">{teamSize.current}</span>
                            <span className="text-xs font-semibold text-slate-400">/ {teamSize.target} Mahasiswa</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">
                            {teamSize.vacancies > 0 ? `${teamSize.vacancies} slot masih kosong` : 'Tim telah penuh'}
                        </p>
                    </div>
                    <div className="size-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                        <Users className="size-6" />
                    </div>
                </div>

                {/* 3. Missing Competencies */}
                <div className="glass-surface p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Kekurangan Peran/Skill
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-extrabold text-amber-600">{missing.length}</span>
                            <span className="text-xs font-semibold text-slate-400">item belum terpenuhi</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">
                            {missing.length === 0 ? 'Semua kebutuhan terpenuhi' : 'Prioritas rekrutmen'}
                        </p>
                    </div>
                    <div className="size-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                        <AlertCircle className="size-6" />
                    </div>
                </div>

                {/* 4. Active Roles Filled */}
                <div className="glass-surface p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Keahlian Terpenuhi
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-extrabold text-emerald-600">
                                {competencies.filter((c) => c.status === 'complete').length}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">/ {competencies.length || 1} kompetensi</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">
                            Cakupan spesifikasi proyek
                        </p>
                    </div>
                    <div className="size-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck className="size-6" />
                    </div>
                </div>
            </div>

            {/* Radar Chart & Qualitative Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Dynamic SVG Radar Chart */}
                <div className="lg:col-span-6 glass-surface p-6 rounded-3xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                    <PieChart className="size-5" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Radar Distribusi Kompetensi Tim
                                </h3>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                6 Sumbu Analisis
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Diagram dihitung secara real-time dari gabungan profil keahlian anggota aktif tim saat ini.
                        </p>
                    </div>

                    {/* SVG Graphic */}
                    <div className="flex justify-center items-center py-4">
                        <svg
                            viewBox="0 0 360 360"
                            className="w-full max-w-[340px] h-auto overflow-visible select-none drop-shadow-xs"
                        >
                            {/* Spider Web Rings */}
                            {ringPolygons.map((pts, idx) => (
                                <polygon
                                    key={idx}
                                    points={pts}
                                    fill={idx === 3 ? 'rgba(241, 245, 249, 0.5)' : 'none'}
                                    stroke="#E2E8F0"
                                    strokeWidth="1.2"
                                    strokeDasharray={idx < 3 ? '3 3' : 'none'}
                                />
                            ))}

                            {/* Axis Lines */}
                            {radar.map((_, i) => {
                                const angle = -Math.PI / 2 + i * angleStep;
                                const x2 = cx + maxR * Math.cos(angle);
                                const y2 = cy + maxR * Math.sin(angle);
                                return (
                                    <line
                                        key={i}
                                        x1={cx}
                                        y1={cy}
                                        x2={x2}
                                        y2={y2}
                                        stroke="#CBD5E1"
                                        strokeWidth="1"
                                    />
                                );
                            })}

                            {/* Polygon Area Fill */}
                            <polygon
                                points={dataPolygonString}
                                fill="rgba(37, 99, 235, 0.22)"
                                stroke="#2563EB"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                            />

                            {/* Vertices & Badges */}
                            {dataPoints.map((pt, i) => (
                                <g key={i}>
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r="5"
                                        fill="#2563EB"
                                        stroke="#FFFFFF"
                                        strokeWidth="2"
                                    />
                                    {/* Text Labels at Axis Ends */}
                                    {(() => {
                                        const labelR = maxR + 24;
                                        const lx = cx + labelR * Math.cos(pt.angle);
                                        const ly = cy + labelR * Math.sin(pt.angle);
                                        const cosA = Math.cos(pt.angle);
                                        const anchor = cosA < -0.15 ? 'end' : cosA > 0.15 ? 'start' : 'middle';

                                        return (
                                            <g>
                                                <text
                                                    x={lx}
                                                    y={ly - 2}
                                                    textAnchor={anchor}
                                                    className="text-[11px] font-bold fill-slate-700"
                                                >
                                                    {pt.label}
                                                </text>
                                                <text
                                                    x={lx}
                                                    y={ly + 11}
                                                    textAnchor={anchor}
                                                    className="text-[10px] font-black fill-blue-600"
                                                >
                                                    {pt.score}%
                                                </text>
                                            </g>
                                        );
                                    })()}
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        {radar.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-blue-600 shrink-0" />
                                <span className="text-slate-600 truncate">{r.label}:</span>
                                <span className="font-bold text-slate-900">{r.score}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Analysis Summary & Redundancy Warnings */}
                <div className="lg:col-span-6 flex flex-col gap-5">
                    {/* Diagnostic Summary */}
                    <div className="glass-surface p-6 rounded-3xl flex-1 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                    <Sparkles className="size-5" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Evaluasi & Kesimpulan Analisis
                                </h3>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed font-normal">
                                {teamBalance?.analysis_summary || 'Belum ada data analisis untuk susunan tim ini.'}
                            </div>
                        </div>

                        {/* Critical Alerts */}
                        <div className="space-y-3 mt-4">
                            {missing.length > 0 && (
                                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3">
                                    <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-amber-900">
                                            Kebutuhan Belum Terpenuhi ({missing.length})
                                        </h4>
                                        <p className="text-[11px] text-amber-800 mt-0.5">
                                            Tim belum memiliki anggota yang menguasai atau mengisi posisi:
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {missing.map((item, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {overrepresented.length > 0 && (
                                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3">
                                    <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-blue-900">
                                            Potensi Redundansi ({overrepresented.length})
                                        </h4>
                                        <p className="text-[11px] text-blue-800 mt-0.5">
                                            Keahlian berikut dimiliki oleh 3 atau lebih anggota, pastikan pembagian peran spesifik:
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {overrepresented.map((item, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-semibold border border-blue-200"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Combinatorial Synergy Recommendation Card */}
                    {teamOptimization && teamOptimization.optimal_candidates?.length > 0 && (
                        <div className="glass-surface p-5 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-slate-50/50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                                        <TrendingUp className="size-4" />
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-900">
                                        Rekomendasi Kombinasi Pelengkap Tim
                                    </h4>
                                </div>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                                    Potensi Skor: {teamOptimization.team_balance_score}%
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">
                                {teamOptimization.explanation}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Member Contributions Breakdown */}
            <div className="glass-surface p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-900 text-white">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Profil Kontribusi Anggota Aktif ({members.length})
                            </h3>
                            <p className="text-xs text-slate-500">
                                Peran terdaftar, arketipe keahlian, dan penguasaan teknologi masing-masing mahasiswa.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                        <div
                            key={member.user_id}
                            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 transition"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                                    <span className="inline-block mt-0.5 text-xs font-semibold text-blue-600">
                                        {member.role || 'Member'}
                                    </span>
                                </div>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                    {member.primary_archetype}
                                </span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                                    Keahlian Utama:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {member.skills?.length > 0 ? (
                                        member.skills.map((s, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 text-[10px] font-semibold border border-slate-200"
                                            >
                                                {s}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[11px] text-slate-400 italic">Belum mengisi profil keahlian</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detailed Competencies Status Table */}
            <div className="glass-surface p-6 rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Matriks Pemenuhan Kebutuhan Proyek
                        </h3>
                        <p className="text-xs text-slate-500">
                            Evaluasi per item kebutuhan keahlian teknis dan peran rekrutmen terhadap anggota aktif.
                        </p>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs">
                        {[
                            { id: 'all', label: 'Semua' },
                            { id: 'complete', label: 'Lengkap' },
                            { id: 'partial', label: 'Sebagian' },
                            { id: 'missing', label: 'Kosong' },
                            { id: 'overrepresented', label: 'Berlebih' },
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setFilterStatus(btn.id)}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                                    filterStatus === btn.id
                                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Kebutuhan / Spesifikasi</th>
                                <th className="py-3 px-4">Tipe</th>
                                <th className="py-3 px-4 text-center">Target Proyek</th>
                                <th className="py-3 px-4 text-center">Tersedia</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Kontributor Anggota</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCompetencies.length > 0 ? (
                                filteredCompetencies.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                                        <td className="py-3.5 px-4 font-bold text-slate-900">
                                            {row.name}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100">
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                            {row.type === 'Keahlian Teknis' ? `Lvl ${row.required}` : `${row.required} Slot`}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                                            {row.type === 'Keahlian Teknis' ? `Lvl ${row.available}` : `${row.available} Terisi`}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {row.status === 'complete' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="size-3" />
                                                    Lengkap
                                                </span>
                                            )}
                                            {row.status === 'partial' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                                    <AlertCircle className="size-3" />
                                                    Sebagian
                                                </span>
                                            )}
                                            {row.status === 'missing' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                                    <AlertCircle className="size-3" />
                                                    Kosong
                                                </span>
                                            )}
                                            {row.status === 'overrepresented' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                                    <Info className="size-3" />
                                                    Berlebih
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600">
                                            {row.contributors?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {row.contributors.map((c, cIdx) => (
                                                        <span
                                                            key={cIdx}
                                                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                                                        >
                                                            {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic text-[11px]">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                                        Tidak ada item kebutuhan dalam kategori filter ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
