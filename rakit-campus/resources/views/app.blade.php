<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        @php
            $component = $page['component'] ?? '';
            $props = $page['props'] ?? [];
            $appName = config('app.name', 'RAKIT Campus');
            $baseUrl = rtrim(config('app.url', 'https://rakitcampus.my.id'), '/');
            $currentUrl = url()->current();

            // Private components that must NEVER be indexed by search engines
            $privateComponents = [
                'dashboard',
                'workspace/index',
                'workspace/show',
                'competitions/workspace',
                'settings/profile',
                'settings/password',
                'settings/appearance',
                'admin/index',
                'admin/competitions/index',
                'admin/notifications/index',
                'admin/students',
                'notifications/index',
                'onboarding/index',
                'classes/index',
                'classes/show',
                'leaderboard/admin',
            ];

            $isPrivate = in_array($component, $privateComponents, true)
                || \Illuminate\Support\Str::startsWith($component, ['admin/', 'settings/']);

            $atContext = '@context';
            $atId = '@id';
            $atType = '@type';
            $atGraph = '@graph';

            // Default Global SEO Meta
            $seoTitle = 'RAKIT Campus — Platform Kolaborasi, Matchmaking Tim Mahasiswa & Hub Kompetisi Kampus';
            $seoDescription = 'Platform terpadu mahasiswa Indonesia untuk matchmaking tim proyek akademik, living proposal, penilaian transparan, dan hub kompetisi kampus berbasis AI.';
            $seoKeywords = 'RAKIT Campus, matchmaking mahasiswa, proyek kampus, kompetisi mahasiswa, hackathon Indonesia, tim proyek, living proposal, portofolio mahasiswa';
            $seoImage = asset('favicon.png');
            $ogType = 'website';
            $jsonLdGraph = [
                [
                    $atType => 'WebSite',
                    $atId => $baseUrl . '/#website',
                    'url' => $baseUrl,
                    'name' => 'RAKIT Campus',
                    'description' => 'Platform Kolaborasi Mahasiswa, Matchmaking Tim, Manajemen Proyek Akademik, dan Kompetisi Kampus Terintegrasi.',
                    'publisher' => [
                        $atId => $baseUrl . '/#organization',
                    ],
                    'potentialAction' => [
                        $atType => 'SearchAction',
                        'target' => $baseUrl . '/competitions?search={search_term_string}',
                        'query-input' => 'required name=search_term_string',
                    ],
                ],
                [
                    $atType => 'EducationalOrganization',
                    $atId => $baseUrl . '/#organization',
                    'name' => 'RAKIT Campus',
                    'url' => $baseUrl,
                    'logo' => asset('favicon.png'),
                    'description' => 'Ekosistem kolaborasi akademik dan kompetisi mahasiswa inter-disiplin.',
                ],
                [
                    $atType => 'SoftwareApplication',
                    'name' => 'RAKIT Campus Platform',
                    'operatingSystem' => 'All',
                    'applicationCategory' => 'EducationalApplication',
                    'offers' => [
                        $atType => 'Offer',
                        'price' => '0',
                        'priceCurrency' => 'IDR',
                    ],
                ],
            ];

            // Context-specific SEO
            if ($component === 'competitions/show' && isset($props['competition'])) {
                $c = $props['competition'];
                $cName = is_array($c) ? ($c['name'] ?? '') : ($c->name ?? '');
                $cDesc = is_array($c) ? ($c['description'] ?? '') : ($c->description ?? '');
                $cCover = is_array($c) ? ($c['cover_image'] ?? '') : ($c->cover_image ?? '');
                $cOrganizer = is_array($c) ? ($c['organizer'] ?? '') : ($c->organizer ?? '');
                $cLevel = is_array($c) ? ($c['level'] ?? '') : ($c->level ?? '');
                $cCategory = is_array($c) ? ($c['category'] ?? '') : ($c->category ?? '');
                $cStart = is_array($c) ? ($c['starts_at'] ?? null) : ($c->starts_at ?? null);
                $cEnd = is_array($c) ? ($c['ends_at'] ?? null) : ($c->ends_at ?? null);
                $cRegDeadline = is_array($c) ? ($c['registration_deadline'] ?? null) : ($c->registration_deadline ?? null);

                $seoTitle = ($cName ?: 'Detail Kompetisi') . ' — Info Lomba & Pendaftaran Mahasiswa | RAKIT Campus';
                $cleanDesc = trim(preg_replace('/\s+/', ' ', strip_tags($cDesc ?: '')));
                $seoDescription = \Illuminate\Support\Str::limit($cleanDesc ?: "Daftar dan ikuti kompetisi {$cName} tingkat {$cLevel} oleh {$cOrganizer}. Bangun tim kolaborasi dan unggah karya di RAKIT Campus.", 160);
                $seoKeywords = "kompetisi {$cName}, lomba {$cCategory}, hackathon {$cLevel}, {$cOrganizer}, tim lomba mahasiswa, RAKIT Campus";
                if ($cCover) {
                    $seoImage = \Illuminate\Support\Str::startsWith($cCover, ['http://', 'https://']) ? $cCover : asset($cCover);
                }
                $ogType = 'article';

                $jsonLdGraph[] = [
                    $atType => 'EducationEvent',
                    $atId => $currentUrl . '#event',
                    'name' => $cName,
                    'description' => $seoDescription,
                    'url' => $currentUrl,
                    'image' => $seoImage,
                    'startDate' => $cStart ? \Illuminate\Support\Carbon::parse($cStart)->toIso8601String() : now()->toIso8601String(),
                    'endDate' => $cEnd ? \Illuminate\Support\Carbon::parse($cEnd)->toIso8601String() : null,
                    'eventAttendanceMode' => 'https://schema.org/OnlineEventAttendanceMode',
                    'eventStatus' => 'https://schema.org/EventScheduled',
                    'organizer' => [
                        $atType => 'Organization',
                        'name' => $cOrganizer ?: 'Penyelenggara Kompetisi',
                    ],
                    'offers' => [
                        $atType => 'Offer',
                        'price' => '0',
                        'priceCurrency' => 'IDR',
                        'availability' => 'https://schema.org/InStock',
                        'validThrough' => $cRegDeadline ? \Illuminate\Support\Carbon::parse($cRegDeadline)->toIso8601String() : null,
                        'url' => $currentUrl,
                    ],
                ];
            } elseif ($component === 'projects/show' && isset($props['project'])) {
                $p = $props['project'];
                $pTitle = is_array($p) ? ($p['title'] ?? '') : ($p->title ?? '');
                $pDesc = is_array($p) ? ($p['description'] ?? $p['short_description'] ?? '') : ($p->description ?? $p->short_description ?? '');
                $pCover = is_array($p) ? ($p['cover_image'] ?? '') : ($p->cover_image ?? '');
                $pCategory = is_array($p) ? ($p['category'] ?? '') : ($p->category ?? '');
                $pLeaderName = is_array($p) ? ($p['leader']['name'] ?? '') : ($p->leader?->name ?? '');
                $pCreated = is_array($p) ? ($p['created_at'] ?? null) : ($p->created_at ?? null);

                $seoTitle = ($pTitle ?: 'Detail Proyek') . ' — Showcase Inovasi & Portofolio Mahasiswa | RAKIT Campus';
                $cleanDesc = trim(preg_replace('/\s+/', ' ', strip_tags($pDesc ?: '')));
                $seoDescription = \Illuminate\Support\Str::limit($cleanDesc ?: "Eksplor proyek mahasiswa {$pTitle} kategori {$pCategory} di RAKIT Campus.", 160);
                $seoKeywords = "proyek {$pTitle}, {$pCategory}, karya mahasiswa, portofolio inovasi, living proposal, RAKIT Campus";
                if ($pCover) {
                    $seoImage = \Illuminate\Support\Str::startsWith($pCover, ['http://', 'https://']) ? $pCover : asset($pCover);
                }
                $ogType = 'article';

                $jsonLdGraph[] = [
                    $atType => 'CreativeWork',
                    $atId => $currentUrl . '#work',
                    'name' => $pTitle,
                    'headline' => $pTitle,
                    'description' => $seoDescription,
                    'image' => $seoImage,
                    'url' => $currentUrl,
                    'dateCreated' => $pCreated ? \Illuminate\Support\Carbon::parse($pCreated)->toIso8601String() : null,
                    'author' => [
                        $atType => 'Person',
                        'name' => $pLeaderName ?: 'Mahasiswa RAKIT Campus',
                    ],
                ];
            } elseif ($component === 'competitions/index') {
                $seoTitle = 'Eksplor Lomba & Hackathon Mahasiswa Nasional & Internasional — RAKIT Campus';
                $seoDescription = 'Katalog kompetisi, hackathon, business plan, UI/UX design, dan olimpiade mahasiswa terkurasi. Temukan lomba impian, cari rekan tim, dan raih prestasi.';
                $seoKeywords = 'lomba mahasiswa, hackathon indonesia 2026, kompetisi mahasiswa, cari tim lomba, business plan competition, ui ux competition, rakit campus';
            } elseif ($component === 'projects/index') {
                $seoTitle = 'Katalog Proyek & Portofolio Karya Mahasiswa — RAKIT Campus';
                $seoDescription = 'Jelajahi inovasi proyek mahasiswa, prototipe open-source, riset akademik, dan living proposal tugas akhir perguruan tinggi di RAKIT Campus.';
                $seoKeywords = 'proyek mahasiswa, portofolio teknologi, living proposal, tugas akhir inovatif, riset kampus, kolaborasi proyek, rakit campus';
            } elseif ($component === 'leaderboard/index') {
                $seoTitle = 'Klasemen & Peringkat Mahasiswa Berprestasi Nasional — RAKIT Campus';
                $seoDescription = 'Papan peringkat mahasiswa berprestasi, kontributor proyek teraktif, dan tim juara kompetisi kampus terverifikasi di seluruh Indonesia.';
                $seoKeywords = 'peringkat mahasiswa, klasemen kampus, mahasiswa berprestasi, juara lomba, leaderboard rakit campus';
            } elseif ($component === 'matching/index') {
                $seoTitle = 'Smart Matchmaking Tim Mahasiswa & Rekomendasi Partner — RAKIT Campus';
                $seoDescription = 'Temukan partner proyek dan rekan lomba yang tepat dengan algoritma AI Smart Matchmaking berdasarkan keahlian komplementer dan minat akademik.';
                $seoKeywords = 'cari teman tim, matchmaking mahasiswa, partner hackathon, kolaborasi tim, rakit campus';
            } elseif ($component === 'portfolio/public' && isset($props['profile'])) {
                $prof = $props['profile'];
                $uName = is_array($prof) ? ($prof['user']['name'] ?? 'Mahasiswa') : ($prof->user?->name ?? 'Mahasiswa');
                $headline = is_array($prof) ? ($prof['headline'] ?? '') : ($prof->headline ?? '');
                $seoTitle = "Portofolio & Rekam Jejak {$uName} — RAKIT Campus";
                $seoDescription = "Lihat rekam jejak akademik, portofolio karya, dan riwayat prestasi kompetisi {$uName}" . ($headline ? " ({$headline})" : '') . " di RAKIT Campus.";
                $seoKeywords = "portofolio {$uName}, prestasi mahasiswa, rekam jejak, karya mahasiswa, rakit campus";
            }
        @endphp

        <title inertia>{{ $seoTitle }}</title>

        <!-- Primary Meta Tags -->
        <meta name="title" content="{{ $seoTitle }}">
        <meta name="description" content="{{ $seoDescription }}">
        <meta name="keywords" content="{{ $seoKeywords }}">
        <meta name="author" content="RAKIT Campus Team">
        <meta name="application-name" content="{{ $appName }}">

        <!-- Search Engine & AI Crawler Directives -->
        @if ($isPrivate)
            <meta name="robots" content="noindex, nofollow, noarchive">
            <meta name="googlebot" content="noindex, nofollow">
        @else
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
            <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
            <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
            <link rel="canonical" href="{{ $currentUrl }}">
        @endif

        <!-- Open Graph / Facebook / WhatsApp -->
        <meta property="og:type" content="{{ $ogType }}">
        <meta property="og:site_name" content="RAKIT Campus">
        <meta property="og:url" content="{{ $currentUrl }}">
        <meta property="og:title" content="{{ $seoTitle }}">
        <meta property="og:description" content="{{ $seoDescription }}">
        <meta property="og:image" content="{{ $seoImage }}">
        <meta property="og:locale" content="id_ID">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{{ $currentUrl }}">
        <meta name="twitter:title" content="{{ $seoTitle }}">
        <meta name="twitter:description" content="{{ $seoDescription }}">
        <meta name="twitter:image" content="{{ $seoImage }}">

        <!-- Favicons -->
        <link rel="icon" type="image/png" href="/favicon.png">
        <link rel="icon" type="image/x-icon" href="/favicon.ico">

        <!-- DNS Prefetch & Preconnect for High-Speed Assets -->
        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        <link rel="dns-prefetch" href="https://fonts.bunny.net">
        <link rel="preconnect" href="https://images.unsplash.com" crossorigin>
        <link rel="dns-prefetch" href="https://images.unsplash.com">

        <!-- Structured Data (JSON-LD) for Search Engines & AI LLMs -->
        @if (!$isPrivate)
        <script type="application/ld+json">
        {!! json_encode([
            $atContext => 'https://schema.org',
            $atGraph => $jsonLdGraph,
        ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) !!}
        </script>
        @endif

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800|cormorant-infant:400,500,600,700|playfair-display:400,600,700,900" rel="stylesheet" />

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
                    <li><a href="{{ url('/competitions') }}">Competition Hub</a>: Temukan kompetisi terverifikasi, bentuk tim, dan unggah deliverable lomba.</li>
                    <li><a href="{{ url('/projects') }}">Project Hub</a>: Jelajahi dan gabung dengan proyek riset, tugas akhir, dan inovasi kampus.</li>
                    <li><a href="{{ url('/leaderboard') }}">Leaderboard & Klasemen</a>: Pantau rekam jejak prestasi mahasiswa dan kampus se-Indonesia.</li>
                    <li><a href="{{ url('/matching') }}">Smart Matchmaking Engine</a>: Algoritma pencocokan anggota tim berdasarkan skill, role, dan keahlian komplementer.</li>
                    <li><a href="{{ url('/login') }}">Masuk</a> atau <a href="{{ url('/register') }}">Daftar Akun Baru</a> untuk mulai berkolaborasi.</li>
                </ul>
            </div>
        </noscript>
    </body>
</html>
