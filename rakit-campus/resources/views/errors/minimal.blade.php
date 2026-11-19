<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('code', '404') — @yield('title', 'Halaman Tidak Ditemukan') | RAKIT Campus</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
</head>
<body class="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-blue-600 selection:text-white text-slate-800 relative overflow-hidden">
    <!-- Apple Ambient Soft Blurred Background Glows -->
    <div class="absolute top-[-15%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-200/40 blur-[130px] pointer-events-none"></div>
    <div class="absolute bottom-[-15%] right-[20%] w-[550px] h-[550px] rounded-full bg-indigo-200/35 blur-[140px] pointer-events-none"></div>

    <!-- Top Navigation Bar: Brand -->
    <header class="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-between">
        <a href="/dashboard" class="inline-flex items-center gap-2.5 group">
            <div class="size-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <svg class="size-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
            </div>
            <div class="flex flex-col">
                <span class="text-sm font-black tracking-tight text-slate-900">
                    RAKIT <span class="text-blue-600">CAMPUS</span>
                </span>
                <span class="text-[10px] font-bold text-slate-400 -mt-1 tracking-wider uppercase">
                    National Platform
                </span>
            </div>
        </a>
    </header>

    <!-- Main Center Hero: iOS Frosted Card with Mascot -->
    <main class="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div class="w-full max-w-lg bg-white/85 backdrop-blur-2xl rounded-[32px] sm:rounded-[40px] border border-slate-200/80 shadow-[0_12px_45px_-8px_rgba(0,0,0,0.06)] p-7 sm:p-10 text-center flex flex-col items-center">
            <!-- Mascot Squircle Container -->
            <div class="relative mb-6">
                <div class="size-32 sm:size-40 rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.06)] flex items-center justify-center p-3.5 group">
                    <img
                        src="@yield('mascot', '/images/mascot/mascot-thinking.png')"
                        alt="RAKIT Mascot"
                        class="w-full h-full object-contain drop-shadow-sm select-none pointer-events-none transform group-hover:scale-105 transition-transform duration-300"
                    />
                </div>

                <!-- Status Code Floater Badge -->
                <div class="absolute -bottom-2.5 -right-2.5 px-3 py-1 rounded-full bg-slate-900 text-white font-mono font-extrabold text-xs shadow-md border border-slate-800">
                    @yield('code', '404')
                </div>
            </div>

            <!-- Pill Status Indicator -->
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 text-blue-700 border border-blue-200/60 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                <span class="size-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                <span>@yield('code', '404') · @yield('title', 'Page Not Found')</span>
            </div>

            <!-- Headline -->
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                @yield('headline', 'Tersesat di Kampus?')
            </h1>

            <!-- Descriptive copy -->
            <p class="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
                @yield('message', 'Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan.')
            </p>

            <!-- Action CTAs -->
            <div class="mt-7 flex flex-wrap items-center justify-center gap-3 w-full">
                <a
                    href="/dashboard"
                    class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all w-full sm:w-auto"
                >
                    <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    <span>Kembali ke Dashboard</span>
                </a>

                <button
                    type="button"
                    onclick="window.history.back()"
                    class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70 text-xs sm:text-sm font-semibold active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
                >
                    <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    <span>Halaman Sebelumnya</span>
                </button>
            </div>

            <!-- Quick Hub Navigation Dock (iOS Segmented Style) -->
            <div class="mt-8 pt-6 border-t border-slate-100 w-full">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                    Navigasi Cepat
                </span>
                <div class="flex flex-wrap items-center justify-center gap-2">
                    <a
                        href="/competitions"
                        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200/70 text-xs font-semibold text-slate-600 transition"
                    >
                        <span>Kompetisi</span>
                    </a>
                    <a
                        href="/projects"
                        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-blue-50 hover:text-blue-800 border border-slate-200/70 text-xs font-semibold text-slate-600 transition"
                    >
                        <span>Proyek</span>
                    </a>
                    <a
                        href="/leaderboard"
                        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-purple-50 hover:text-purple-800 border border-slate-200/70 text-xs font-semibold text-slate-600 transition"
                    >
                        <span>Klasemen</span>
                    </a>
                </div>
            </div>
        </div>
    </main>

    <!-- Apple HIG Footer -->
    <footer class="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-slate-400">
        <p>RAKIT Campus · Didesain presisi untuk mahasiswa & inovator kampus</p>
    </footer>
</body>
</html>
