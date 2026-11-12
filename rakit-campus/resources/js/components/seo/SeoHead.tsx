import { Head } from '@inertiajs/react';
import React from 'react';

interface SeoHeadProps {
    title: string;
    description?: string;
    keywords?: string;
    canonicalUrl?: string;
    ogImage?: string;
    ogType?: 'website' | 'article' | 'profile';
    noIndex?: boolean;
}

const DEFAULT_DESCRIPTION =
    'RAKIT Campus adalah platform terpadu untuk matchmaking tim mahasiswa, living proposal, penilaian akademik UTS/UAS, dan hub kompetisi kampus berbasis AI.';
const DEFAULT_KEYWORDS =
    'RAKIT Campus, matchmaking mahasiswa, proyek kampus, kompetisi mahasiswa, kolaborasi akademik, hackathon indonesia, tim proyek, living proposal, portofolio mahasiswa';
const DEFAULT_IMAGE = 'https://rakitcampus.my.id/favicon.png';

export default function SeoHead({
    title,
    description = DEFAULT_DESCRIPTION,
    keywords = DEFAULT_KEYWORDS,
    canonicalUrl,
    ogImage = DEFAULT_IMAGE,
    ogType = 'website',
    noIndex = false,
}: SeoHeadProps) {
    // Strip trailing brand suffix if already present so app.tsx title formatter doesn't duplicate
    const cleanTitle = title.replace(/\s*[-—|]\s*RAKIT\s*Campus.*$/i, '').trim();

    return (
        <Head title={cleanTitle}>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Search Engine Robots */}
            <meta
                name="robots"
                content={
                    noIndex
                        ? 'noindex, nofollow, noarchive'
                        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
                }
            />

            {/* Canonical Link */}
            {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:site_name" content="RAKIT Campus" />
            <meta property="og:title" content={cleanTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
            <meta property="og:locale" content="id_ID" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={cleanTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
            {canonicalUrl ? <meta name="twitter:url" content={canonicalUrl} /> : null}
        </Head>
    );
}
