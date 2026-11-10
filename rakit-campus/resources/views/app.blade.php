<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'RAKIT Campus') }} — Platform Kolaborasi & Matchmaking Tim Mahasiswa</title>

        <!-- Primary Meta Tags -->
        <meta name="title" content="RAKIT Campus — Platform Kolaborasi & Matchmaking Tim Mahasiswa">
        <meta name="description" content="RAKIT Campus adalah platform terpadu untuk matchmaking tim mahasiswa, living proposal, penilaian akademik UTS/UAS, dan hub kompetisi kampus berbasis AI.">
        <meta name="keywords" content="RAKIT Campus, matchmaking mahasiswa, proyek kampus, kompetisi mahasiswa, kolaborasi akademik, hackathon, tim proyek, living proposal, manajemen kelas, portofolio mahasiswa">
        <meta name="author" content="RAKIT Campus Team">
        <meta name="application-name" content="{{ config('app.name', 'RAKIT Campus') }}">

        <!-- Search Engine & AI Crawler Directives -->
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
        <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
        <link rel="canonical" href="{{ url()->current() }}">

        <!-- Open Graph / Facebook / WhatsApp -->
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="RAKIT Campus">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:title" content="RAKIT Campus — Platform Kolaborasi & Matchmaking Tim Mahasiswa">
        <meta property="og:description" content="Platform kolaborasi cerdas untuk matchmaking tim mahasiswa, living proposal, penilaian UTS/UAS, dan kompetisi kampus.">
        <meta property="og:image" content="{{ asset('favicon.png') }}">
        <meta property="og:locale" content="id_ID">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{{ url()->current() }}">
        <meta name="twitter:title" content="RAKIT Campus — Platform Kolaborasi & Matchmaking Tim Mahasiswa">
        <meta name="twitter:description" content="Platform kolaborasi cerdas untuk matchmaking tim mahasiswa, living proposal, penilaian UTS/UAS, dan kompetisi kampus.">
        <meta name="twitter:image" content="{{ asset('favicon.png') }}">

        <!-- Favicons -->
        <link rel="icon" type="image/png" href="/favicon.png">
        <link rel="icon" type="image/x-icon" href="/favicon.ico">

        <!-- Structured Data (JSON-LD) for Google & AI Search Engines -->
        <script type="application/ld+json">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@graph' => [
                [
                    '@type' => 'WebSite',
                    '@id' => config('app.url') . '/#website',
                    'url' => config('app.url'),
                    'name' => 'RAKIT Campus',
                    'description' => 'Platform Kolaborasi Mahasiswa, Matchmaking Tim, Manajemen Proyek Akademik, dan Kompetisi Kampus Terintegrasi.',
                    'publisher' => [
                        '@id' => config('app.url') . '/#organization',
                    ],
                    'potentialAction' => [
                        '@type' => 'SearchAction',
                        'target' => config('app.url') . '/projects?search={search_term_string}',
                        'query-input' => 'required name=search_term_string',
                    ],
                ],
                [
                    '@type' => 'EducationalOrganization',
                    '@id' => config('app.url') . '/#organization',
                    'name' => 'RAKIT Campus',
                    'url' => config('app.url'),
                    'logo' => asset('favicon.png'),
                    'description' => 'Ekosistem kolaborasi akademik dan kompetisi mahasiswa inter-disiplin.',
                ],
                [
                    '@type' => 'SoftwareApplication',
                    'name' => 'RAKIT Campus Platform',
                    'operatingSystem' => 'All',
                    'applicationCategory' => 'EducationalApplication',
                    'offers' => [
                        '@type' => 'Offer',
                        'price' => '0',
                        'priceCurrency' => 'IDR',
                    ],
                ],
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) !!}
        </script>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-[#F8FAFC]">
        @inertia

        <!-- Noscript fallback for search engine crawlers without JavaScript execution -->
        <noscript>
            <div style="padding: 2rem; max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
                <h1>RAKIT Campus — Platform Kolaborasi & Matchmaking Tim Mahasiswa</h1>
                <p>RAKIT Campus adalah ekosistem kolaborasi kampus modern yang menghubungkan mahasiswa, dosen, dan institusi untuk membentuk tim proyek akademik seimbang, mengikuti kompetisi nasional & internasional, serta mengelola living proposal dan penilaian UTS/UAS secara transparan.</p>
                <h2>Fitur Utama Platform:</h2>
                <ul>
                    <li><a href="{{ url('/projects') }}">Project Hub</a>: Jelajahi dan gabung dengan proyek riset, tugas akhir, dan inovasi kampus.</li>
                    <li><a href="{{ url('/competitions') }}">Competition Hub</a>: Temukan kompetisi terverifikasi, bentuk tim, dan unggah deliverable lomba.</li>
                    <li><a href="{{ url('/matching') }}">Smart Matchmaking Engine</a>: Algoritma pencocokan anggota tim berdasarkan skill, role, dan keahlian komplementer.</li>
                    <li><a href="{{ url('/login') }}">Masuk</a> atau <a href="{{ url('/register') }}">Daftar Akun Baru</a> untuk mulai berkolaborasi.</li>
                </ul>
            </div>
        </noscript>
    </body>
</html>
