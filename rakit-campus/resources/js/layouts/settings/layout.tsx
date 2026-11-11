import Heading from '@/components/heading';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { KeyRound, LogOut, Palette, Sparkles, User } from 'lucide-react';

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
        <div className="space-y-6 pt-2">
            {/* Header */}
            <div className="border-b border-slate-100 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200/60">
                    <Sparkles className="size-3.5" />
                    <span>Pusat Pengaturan Akun & Preferensi</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Pengaturan Akun & Profil
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
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
                                                ? 'bg-[#EFF6FF] text-[#2563EB] shadow-xs font-bold'
                                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'size-8 rounded-xl flex items-center justify-center shrink-0 transition',
                                                isActive
                                                    ? 'bg-[#2563EB] text-white shadow-xs'
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

                            <div className="pt-2 mt-2 border-t border-neutral-100">
                                <Link
                                    method="post"
                                    href="/logout"
                                    as="button"
                                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer text-left"
                                >
                                    <div className="size-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                        <LogOut className="size-4" />
                                    </div>
                                    <div>
                                        <div className="leading-tight font-bold">Keluar Akun</div>
                                        <div className="text-[10px] text-rose-400 font-normal mt-0.5">
                                            Akhiri sesi login di perangkat ini
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area: Spacious & Unconstrained */}
                    <main className="flex-1 min-w-0 w-full">{children}</main>
                </div>
            </div>
    );
}
