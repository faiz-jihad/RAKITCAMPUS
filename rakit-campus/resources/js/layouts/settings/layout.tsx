import Heading from '@/components/heading';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { KeyRound, Palette, Sparkles, User } from 'lucide-react';

const sidebarNavItems = [
    {
        title: 'Profil & Keahlian',
        url: '/settings/profile',
        icon: User,
        desc: 'Biodata, skill, & ketersediaan',
    },
    {
        title: 'Keamanan Sandi',
        url: '/settings/password',
        icon: KeyRound,
        desc: 'Ubah password & otentikasi',
    },
    {
        title: 'Tema & Tampilan',
        url: '/settings/appearance',
        icon: Palette,
        desc: 'Mode gelap, terang, & sistem',
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/settings/profile';

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F8F6FF] relative text-[#0E121B] pb-24 selection:bg-[#5448EE] selection:text-white">
            {/* Top Atmospheric Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[340px] bg-gradient-to-b from-[#5448EE]/10 to-transparent blur-3xl pointer-events-none -z-0" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-8">
                {/* Header */}
                <div className="border-b border-neutral-200/80 pb-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] text-xs font-semibold mb-2 border border-[#5448EE]/20">
                        <Sparkles className="size-3.5" />
                        <span>Pusat Pengaturan Akun & Preferensi</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E121B]">
                        Pengaturan Akun & Profil
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-500 mt-1 leading-relaxed">
                        Kelola informasi akademik, portofolio keahlian untuk AI Smart Matching, kata sandi, dan preferensi tampilan.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Navigation Sidebar */}
                    <aside className="w-full lg:w-72 shrink-0">
                        <div className="bg-white border border-neutral-200/80 rounded-3xl p-3 shadow-sm flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 pt-2 pb-1 block">
                                Navigasi Pengaturan
                            </span>
                            {sidebarNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPath === item.url;

                                return (
                                    <Link
                                        key={item.url}
                                        href={item.url}
                                        className={cn(
                                            'flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all',
                                            isActive
                                                ? 'bg-[#EEEDFD] text-[#5448EE] shadow-xs font-bold'
                                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'size-8 rounded-xl flex items-center justify-center shrink-0 transition',
                                                isActive
                                                    ? 'bg-[#5448EE] text-white shadow-xs'
                                                    : 'bg-neutral-100 text-neutral-500'
                                            )}
                                        >
                                            <Icon className="size-4" />
                                        </div>
                                        <div>
                                            <div className="leading-tight">{item.title}</div>
                                            <div className="text-[10px] text-neutral-400 font-normal mt-0.5">
                                                {item.desc}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Main Content Area: Spacious & Unconstrained */}
                    <main className="flex-1 min-w-0 w-full">{children}</main>
                </div>
            </div>
        </div>
    );
}