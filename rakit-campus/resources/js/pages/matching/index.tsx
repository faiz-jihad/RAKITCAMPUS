import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, ChevronRight, Sparkles, UserCheck, Users, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    recommendedProjects: any[];
    myLedProjects: any[];
    candidates?: any[];
    profileCompletion?: { percent: number; missing: string[] };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Smart Team Matching', href: '/matching' },
];

export default function MatchingIndex({ recommendedProjects, myLedProjects, candidates, profileCompletion }: Props) {
    const [tab, setTab] = useState<'projects' | 'candidates'>('projects');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Smart Team Matching — RAKIT Campus" />

            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="border-b border-neutral-200 pb-5">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-1 rounded bg-blue-50 text-blue-600">
                            <Sparkles className="size-4" />
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Smart Team Matching</h1>
                    </div>
                    <p className="text-sm text-neutral-500">
                        Sistem rekomendasi berbasis kecocokan keahlian, peran, ketersediaan jam kerja, dan minat nyata mahasiswa.
                    </p>
                </div>

                {/* Profile Completion Callout if not complete */}
                {profileCompletion && profileCompletion.percent < 80 && (
                    <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0">
                                {profileCompletion.percent}%
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-blue-900">Tingkatkan Kelengkapan Profil Anda</h4>
                                <p className="text-[11px] text-blue-700 mt-0.5">
                                    Lengkapi keahlian dan jam ketersediaan agar rekomendasi proyek semakin presisi.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/settings/profile"
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shrink-0 transition"
                        >
                            Lengkapi Profil
                        </Link>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 border-b border-neutral-200">
                    <button
                        onClick={() => setTab('projects')}
                        className={`pb-3 text-sm font-semibold border-b-2 transition ${
                            tab === 'projects'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900'
                        }`}
                    >
                        Rekomendasi Proyek Untuk Anda ({recommendedProjects.length})
                    </button>
                    {myLedProjects.length > 0 && (
                        <button
                            onClick={() => setTab('candidates')}
                            className={`pb-3 text-sm font-semibold border-b-2 transition ${
                                tab === 'candidates'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                            }`}
                        >
                            Cari Calon Kolaborator Tim Saya
                        </button>
                    )}
                </div>

                {/* Tab 1: Recommended Projects */}
                {tab === 'projects' && (
                    <div className="flex flex-col gap-4">
                        {recommendedProjects.length === 0 ? (
                            <div className="p-8 text-center bg-white rounded-xl border border-neutral-200">
                                <p className="text-sm text-neutral-500">
                                    Belum ada rekomendasi proyek baru saat ini.
                                </p>
                            </div>
                        ) : (
                            recommendedProjects.map((item: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                                {item.project.category}
                                            </span>
                                            <span className="text-xs text-neutral-400">•</span>
                                            <span className="text-xs text-neutral-500 font-medium">
                                                {item.project.campus}
                                            </span>
                                        </div>

                                        <Link href={`/projects/${item.project.id}`} className="group">
                                            <h3 className="text-base font-bold text-neutral-900 group-hover:text-blue-600 transition">
                                                {item.project.title}
                                            </h3>
                                        </Link>
                                        <p className="text-xs text-neutral-600 mt-1 line-clamp-1">
                                            {item.project.short_description}
                                        </p>

                                        {/* Transparent explanation */}
                                        <div className="mt-3 flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-lg">
                                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                                            <span>{item.explanation}</span>
                                        </div>
                                    </div>

                                    {/* Match Score Gauge */}
                                    <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-neutral-100 pt-4 md:pt-0 md:pl-5">
                                        <div className="text-center">
                                            <div className="text-2xl font-extrabold text-blue-600">
                                                {item.match_score}%
                                            </div>
                                            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                                Match Score
                                            </span>
                                        </div>

                                        <Link
                                            href={`/projects/${item.project.id}`}
                                            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition"
                                        >
                                            Lihat Proyek
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Tab 2: Find Candidates for Led Project */}
                {tab === 'candidates' && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs text-neutral-600">
                            Menampilkan mahasiswa aktif kampus Anda yang membuka status kolaborasi dan memiliki keahlian yang dibutuhkan untuk proyek yang Anda pimpin.
                        </div>

                        {candidates && candidates.length > 0 ? (
                            candidates.map((cand: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-bold text-neutral-900">{cand.student.name}</h3>
                                            <span className="text-xs text-neutral-400">•</span>
                                            <span className="text-xs text-neutral-500">
                                                {cand.student.study_program} (Semester {cand.student.semester})
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-600 line-clamp-1">{cand.student.bio}</p>

                                        {/* Skill tags */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {cand.student.skills?.map((s: any, i: number) => (
                                                <span key={i} className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                                                    {s.name} ({s.proficiency}/5)
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-[11px] text-blue-700 mt-2 font-medium">
                                            {cand.explanation}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-neutral-100 pt-3 md:pt-0 md:pl-5">
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-blue-600">{cand.score}%</div>
                                            <span className="text-[10px] text-neutral-400 block uppercase">Kecocokan</span>
                                        </div>

                                        <Link
                                            href={`/students/${cand.student.id}`}
                                            className="px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-lg text-xs font-medium transition"
                                        >
                                            Profil Lengkap
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-neutral-500">Belum ada kandidat yang terdaftar.</p>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
