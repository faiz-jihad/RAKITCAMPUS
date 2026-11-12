import { Head } from '@inertiajs/react';
import React from 'react';

interface BreadcrumbItem {
    name: string;
    url: string;
}

interface SeoHeadProps {
    title: string;
    description?: string;
    keywords?: string;
    canonicalUrl?: string;
    ogImage?: string;
    ogType?: 'website' | 'article' | 'profile';
    jsonLd?: Record<string, any> | Array<Record<string, any>>;
    breadcrumbs?: BreadcrumbItem[];
    noIndex?: boolean;
}

const DEFAULT_DESCRIPTION =
    'RAKIT Campus adalah platform terpadu untuk matchmaking tim mahasiswa, living proposal, penilaian akademik UTS/UAS, dan hub kompetisi kampus berbasis AI.';
const DEFAULT_KEYWORDS =
    'RAKIT Campus, matchmaking mahasiswa, proyek kampus, kompetisi mahasiswa, kolaborasi akademik, hackathon indonesia, tim proyek, living proposal, portofolio mahasiswa';
const DEFAULT_IMAGE = 'https://rakitcampus.my.id/favicon.png';
const BASE_URL = 'https://rakitcampus.my.id';

export default function SeoHead({
    title,
    description = DEFAULT_DESCRIPTION,
    keywords = DEFAULT_KEYWORDS,
    canonicalUrl,
    ogImage = DEFAULT_IMAGE,
    ogType = 'website',
    jsonLd,
    breadcrumbs,
    noIndex = false,
}: SeoHeadProps) {
    const formattedTitle = title.includes('RAKIT Campus') ? title : `${title} — RAKIT Campus`;

    // Construct BreadcrumbList schema if provided
    const breadcrumbSchema =
        breadcrumbs && breadcrumbs.length > 0
            ? {
                  '@context': 'https://schema.org',
                  '@type': 'BreadcrumbList',
                  itemListElement: breadcrumbs.map((item, index) => ({
                      '@type': 'ListItem',
                      position: index + 1,
                      name: item.name,
                      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
                  })),
              }
            : null;

    return (
        <Head>
            <title>{formattedTitle}</title>
            <meta name="title" content={formattedTitle} />
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {noIndex ? (
                <>
                    <meta name="robots" content="noindex, nofollow, noarchive" />
                    <meta name="googlebot" content="noindex, nofollow" />
                </>
            ) : (
                <>
                    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
                    <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
                    {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
                </>
            )}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:site_name" content="RAKIT Campus" />
            <meta property="og:title" content={formattedTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
            <meta property="og:locale" content="id_ID" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={formattedTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
            {canonicalUrl && <meta name="twitter:url" content={canonicalUrl} />}

            {/* Structured Data JSON-LD */}
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(jsonLd),
                    }}
                />
            )}

            {breadcrumbSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(breadcrumbSchema),
                    }}
                />
            )}
        </Head>
    );
}
