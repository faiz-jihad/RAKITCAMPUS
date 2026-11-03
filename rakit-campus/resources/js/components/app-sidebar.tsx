import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Award, FolderKanban, GraduationCap, Kanban, LayoutGrid, Repeat, ShieldCheck, Sparkles, Trophy, User, Users } from 'lucide-react';
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
            title: isLecturer ? 'Manajemen Kelas' : 'Kelas Kuliah',
            url: '/classes',
            icon: GraduationCap,
        },
        {
            title: 'Project Hub',
            url: '/projects',
            icon: FolderKanban,
        },
        {
            title: 'Competition Hub',
            url: '/competitions',
            icon: Trophy,
        },
        {
            title: 'Workspace Tim',
            url: '/workspace',
            icon: Kanban,
        },
        {
            title: 'Smart Matching',
            url: '/matching',
            icon: Sparkles,
        },
        {
            title: 'Portfolio & Prestasi',
            url: '/portfolio',
            icon: Award,
        },
    ];

    if (isCampusAdmin) {
        mainNavItems.push({
            title: 'Campus Admin',
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
                    <div className="px-4 py-3 mx-2 my-2 rounded-2xl bg-[#EEEDFD]/70 border border-[#5448EE]/20 text-xs">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5448EE]">
                                Mode Akun Aktif:
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5448EE] text-white">
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
                        <p className="text-[11px] text-neutral-600 mb-2 leading-tight">
                            {isLecturer
                                ? 'Anda memiliki akses penuh untuk mengelola kelas & kelompok proyek mahasiswa.'
                                : 'Anda terdaftar sebagai mahasiswa aktif kelas & pencari kolaborasi tim.'}
                        </p>
                        <button
                            onClick={() => switchRole(isLecturer ? 'student' : 'lecturer')}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-white hover:bg-neutral-50 text-[#5448EE] font-bold text-[11px] border border-[#5448EE]/30 shadow-xs flex items-center justify-center gap-1.5 transition"
                        >
                            <Repeat className="size-3" />
                            <span>Ganti ke Mode {isLecturer ? 'Mahasiswa' : 'Dosen'}</span>
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
