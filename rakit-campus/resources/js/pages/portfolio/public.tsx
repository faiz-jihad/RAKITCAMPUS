import SeoHead from '@/components/seo/SeoHead';
import { Link } from '@inertiajs/react';
import {
    Award,
    Building2,
    Calendar,
    ChevronRight,
    ExternalLink,
    FolderKanban,
    Globe,
    GraduationCap,
    MapPin,
    ShieldCheck,
    Sparkles,
    Trophy,
} from 'lucide-react';
import React from 'react';

interface Props {
    profile: {
        id: number;
        slug: string;
        headline?: string;
        bio?: string;
        study_program?: string;
        academic_year?: string;
        linkedin_url?: string;
        github_url?: string;
        website_url?: string;
        campus?: {
            id: number;
            name: string;
            slug?: string;
        };
        user: {
            id: number;
            name: string;
            avatar?: string;
            email?: string;
        };
        skills?: Array<{
            id: number;
            name: string;
            category?: string;
        }>;
        experiences?: Array<{
            id: number;
            title: string;
            company: string;
            period?: string;
        }>;
    };
    achievements: Array<{
        id: number;
        title: string;
        badge_level?: string;
        category?: string;
        description?: string;
        achieved_on?: string;
        evidence_url?: string;
        competition?: {
            id: number;
            name: string;
            slug?: string;
        };
        project?: {
            id: number;
            title: string;
            slug?: string;
        };
    }>;
    items: Array<{
        id: number;
        title: string;
        kind: string;
        url?: string;
        description?: string;
    }>;
}

export default function PortfolioPublic({ profile, achievements = [], items = [] }: Props) {
    const userName = profile?.user?.name || 'Mahasiswa';
    const headline = profile?.headline || 'Mahasiswa & Inovator Kampus';
    const canonicalUrl = `https://rakitcampus.my.id/p/${encodeURIComponent(profile.slug)}`;

    const personJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
            '@type': 'Person',
            name: userName,
            description: profile?.bio || headline,
            image: profile?.user?.avatar || 'https://rakitcampus.my.id/favicon.png',
            jobTitle: headline,
            affiliation: profile?.campus?.name
                ? {
                      '@type': 'EducationalOrganization',
                      name: profile.campus.name,
                  }
                : undefined,
            sameAs: [profile?.linkedin_url, profile?.github_url, profile?.website_url].filter(Boolean),
            knowsAbout: profile?.skills?.map((s) => s.name) || [],
        },
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
            <SeoHead
                title={`Portofolio & Rekam Jejak ${userName}`}
                description={`Lihat rekam jejak akademik, portofolio karya, dan riwayat prestasi kompetisi ${userName} (${headline}) di RAKIT Campus.`}
                keywords={`portofolio ${userName}, prestasi mahasiswa, rekam jejak ${userName}, ${profile?.campus?.name || ''}, rakit campus`}
                canonicalUrl={canonicalUrl}
                ogType="profile"
                jsonLd={personJsonLd}
                breadcrumbs={[
                    { name: 'Beranda', url: '/' },
                    { name: 'Portofolio Mahasiswa', url: '/p/' + profile.slug },
                    { name: userName, url: canonicalUrl },
                ]}
            />

            {/* Public Header */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
                <Link href="/" className="inline-flex items-center gap-2 group">
                    <div className="size-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xs shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        R
                    </div>
                    <span className="font-black text-base tracking-tight text-slate-900">
                        RAKIT <span className="text-blue-600">CAMPUS</span>
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    <Link
                        href="/competitions"
                        className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
                    >
                        Eksplor Lomba
                    </Link>
                    <Link
                        href="/projects"
                        className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
                    >
                        Proyek
                    </Link>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                    >
                        <span>Bergabung</span>
                        <ChevronRight className="size-3.5" />
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
                {/* Profile Hero Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-3xl flex items-center justify-center shrink-0 shadow-md">
                            {profile?.user?.avatar ? (
                                <img
                                    src={profile.user.avatar}
                                    alt={userName}
                                    className="w-full h-full object-cover rounded-2xl"
                                />
                            ) : (
                                userName.charAt(0).toUpperCase()
                            )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                    {userName}
                                </h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                    <ShieldCheck className="size-3 text-blue-600" />
                                    <span>Terverifikasi RAKIT</span>
                                </span>
                            </div>

                            <p className="text-sm font-semibold text-blue-600">{headline}</p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
                                {profile?.campus && (
                                    <div className="inline-flex items-center gap-1.5">
                                        <Building2 className="size-3.5 text-slate-400" />
                                        <span>{profile.campus.name}</span>
                                    </div>
                                )}
                                {profile?.study_program && (
                                    <div className="inline-flex items-center gap-1.5">
                                        <GraduationCap className="size-3.5 text-slate-400" />
                                        <span>{profile.study_program}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {profile?.bio && (
                        <div className="mt-6 pt-6 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {profile.bio}
                        </div>
                    )}

                    {/* Skills Chips */}
                    {profile?.skills && profile.skills.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-100 space-y-2.5">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Keahlian & Tech Stack
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill) => (
                                    <span
                                        key={skill.id}
                                        className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/70"
                                    >
                                        {skill.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Achievements Section */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Trophy className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                    Prestasi & Pencapaian
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Rekam jejak kompetisi dan pencapaian akademik terverifikasi.
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                            {achievements.length} Prestasi
                        </span>
                    </div>

                    {achievements.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400">
                            Belum ada prestasi publik yang ditampilkan.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {achievements.map((ach) => (
                                <div
                                    key={ach.id}
                                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all flex flex-col justify-between gap-3"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                                                {ach.badge_level || 'Prestasi'}
                                            </span>
                                            {ach.achieved_on && (
                                                <span className="text-[10px] text-slate-400">
                                                    {ach.achieved_on}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-900 line-clamp-2">
                                            {ach.title}
                                        </h3>
                                        {ach.description && (
                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                                {ach.description}
                                            </p>
                                        )}
                                    </div>

                                    {ach.evidence_url && (
                                        <a
                                            href={ach.evidence_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline self-start"
                                        >
                                            <span>Lihat Bukti Sertifikat</span>
                                            <ExternalLink className="size-3" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Portfolio Showcase Items */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FolderKanban className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                    Karya & Proyek Terpilih
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Tautan proyek, riset, publikasi, dan living proposal.
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                            {items.length} Karya
                        </span>
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400">
                            Belum ada karya publik yang ditautkan.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all flex items-start justify-between gap-4"
                                >
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-bold text-slate-900">
                                            {item.title}
                                        </h3>
                                        {item.description && (
                                            <p className="text-[11px] text-slate-500">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>

                                    {item.url && (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition shrink-0 shadow-2xs"
                                        >
                                            <ExternalLink className="size-3.5" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Public Footer */}
            <footer className="border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500">
                <p>
                    Ditenagai oleh{' '}
                    <Link href="/" className="font-bold text-blue-600 hover:underline">
                        RAKIT Campus
                    </Link>{' '}
                    — Platform Kolaborasi & Matchmaking Mahasiswa Indonesia.
                </p>
            </footer>
        </div>
    );
}
