import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Award, Bell, FolderKanban, GraduationCap, Kanban, LayoutGrid, Repeat, ShieldCheck, Sparkles, Trophy, User, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const isCampusAdmin = auth?.user?.campus?.role === 'campus_admin' || auth?.user?.is_platform_admin;
    const isLecturer = auth?.user?.is_lecturer || auth?.user?.campus?.role === 'lecturer' || auth?.user?.role === 'lecturer';

    const mainNavItems: NavItem[] = [
        {
            title: isLecturer ? 'Dashboard Dosen' : 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: isLecturer ? 'Kelola Kelas' : 'Kelas Kuliah',
            url: '/classes',
            icon: GraduationCap,
        },
        {
            title: 'Cari Proyek',
            url: '/projects',
            icon: FolderKanban,
        },
        {
            title: 'Lomba & Kompetisi',
            url: '/competitions',
            icon: Trophy,
        },
        {
            title: 'Ruang Kerja Tim',
            url: '/workspace',
            icon: Kanban,
        },
        {
            title: 'Cari Teman Tim',
            url: '/matching',
            icon: Sparkles,
        },
        {
            title: 'Portofolio Saya',
            url: '/portfolio',
            icon: Award,
        },
        {
            title: 'Notifikasi',
            url: '/notifications',
            icon: Bell,
        },
    ];

    if (isCampusAdmin) {
        mainNavItems.push({
            title: 'Admin Notifikasi',
            url: '/admin/notifications',
            icon: ShieldCheck,
        });
        mainNavItems.push({
            title: 'Admin Kampus',
            url: '/admin',
            icon: ShieldCheck,
        });
    }

    const switchRole = (targetRole: 'lecturer' | 'student') => {
        router.post('/switch-role', { role: targetRole });
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {/* Role Switcher Pill for Testing / Demonstration */}
                {auth?.user && (
                    <div className="px-3.5 py-3 mx-2 my-2 rounded-2xl bg-slate-100/70 border border-slate-200/80 backdrop-blur-sm text-xs">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Mode Akun:
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                                {isLecturer ? (
                                    <>
                                        <GraduationCap className="size-3" />
                                        <span>Dosen</span>
                                    </>
                                ) : (
                                    <>
                                        <User className="size-3" />
                                        <span>Mahasiswa</span>
                                    </>
                                )}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-2 leading-tight">
                            {isLecturer
                                ? 'Akses kelola kelas, bagi kelompok, dan bimbingan proyek.'
                                : 'Akses kelas kuliah, matchmaking kelompok, dan proyek tim.'}
                        </p>
                        <button
                            onClick={() => switchRole(isLecturer ? 'student' : 'lecturer')}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold text-[11px] border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                            <Repeat className="size-3 text-slate-400" />
                            <span>Ganti ke Akun {isLecturer ? 'Mahasiswa' : 'Dosen'}</span>
                        </button>
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
