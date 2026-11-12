import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Award, Bell, BookOpen, BotMessageSquare, Clock, FolderKanban, GraduationCap, Kanban, LayoutGrid, Repeat, ShieldCheck, Sparkles, Trophy, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogo from './app-logo';

function AiQuotaIndicator({ teamId }: { teamId?: number }) {
    const [quota, setQuota] = useState<{
        quota_used: number;
        quota_limit: number;
        quota_remaining: number;
        reset_in_seconds: number | null;
        is_exhausted: boolean;
    } | null>(null);

    useEffect(() => {
        if (!teamId) return;
        fetch(`/ai-workspace/quota/${teamId}`)
            .then((r) => r.json())
            .then((d) => setQuota(d))
            .catch(() => {});
    }, [teamId]);

    if (!teamId || !quota) return null;

    const pct = Math.round((quota.quota_used / quota.quota_limit) * 100);
    const resetLabel = quota.reset_in_seconds
        ? (() => {
              const h = Math.floor(quota.reset_in_seconds / 3600);
              const d = Math.floor(h / 24);
              return d > 0 ? `${d} hari` : `${h} jam`;
          })()
        : null;

    return (
        <div className="mx-2 mb-1 px-3 py-2.5 rounded-xl bg-slate-100/60 border border-slate-200/70 text-xs">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Kuota Tim</span>
                {quota.is_exhausted && (
                    <span className="text-[9px] font-bold text-red-500 uppercase">Habis</span>
                )}
            </div>
            <div className="flex items-center gap-1.5 mb-1">
                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${quota.is_exhausted ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className="text-[10px] text-slate-500 tabular-nums whitespace-nowrap">
                    {quota.quota_used}/{quota.quota_limit}
                </span>
            </div>
            {resetLabel && (
                <p className="text-[10px] text-slate-400 leading-tight">
                    Reset dalam {resetLabel}
                </p>
            )}
        </div>
    );
}

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const isCampusAdmin = auth?.user?.campus?.role === 'campus_admin' || auth?.user?.is_platform_admin;
    const isLecturer = auth?.user?.is_lecturer || auth?.user?.campus?.role === 'lecturer' || auth?.user?.role === 'lecturer';

    // Get active team_id from URL or props for quota indicator
    const page = usePage();
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const activeTeamId = urlParams.get('team_id') ? parseInt(urlParams.get('team_id')!) : undefined;

    const mainNavItems: NavItem[] = isLecturer
        ? [
              {
                  title: 'Dashboard Dosen',
                  url: '/dashboard',
                  icon: LayoutGrid,
              },
              {
                  title: 'Kelola Kelas',
                  url: '/classes',
                  icon: GraduationCap,
              },
              {
                  title: 'Proyek Bimbingan',
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
                  title: 'Notifikasi',
                  url: '/notifications',
                  icon: Bell,
              },
          ]
        : [
              {
                  title: 'Dashboard',
                  url: '/dashboard',
                  icon: LayoutGrid,
              },
              {
                  title: 'Kelas Kuliah',
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
            title: 'Kelola Kompetisi',
            url: '/admin/competitions',
            icon: Trophy,
        });
        mainNavItems.push({
            title: 'Admin Kampus',
            url: '/admin',
            icon: ShieldCheck,
        });
        mainNavItems.push({
            title: 'Admin Notifikasi',
            url: '/admin/notifications',
            icon: Bell,
        });
    }

    const aiNavItems = [
        { title: 'AI Project Assistant', url: '/ai-workspace?assistant=project', icon: FolderKanban },
        { title: 'Competition Assistant', url: '/ai-workspace?assistant=competition', icon: Trophy },
        { title: 'Team Assistant', url: '/ai-workspace?assistant=team', icon: Users },
        { title: 'Document Reviewer', url: '/ai-workspace?assistant=document', icon: BookOpen },
        { title: 'Riwayat AI', url: '/ai-workspace/history', icon: Clock },
    ];

    const switchRole = (targetRole: 'lecturer' | 'student') => {
        router.post('/switch-role', { role: targetRole });
    };

    // Determine if any AI page is active
    const isAiActive = page.url.startsWith('/ai-workspace');

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

                {/* AI Workspace Section */}
                <div className="px-2 py-0 mt-1">
                    <div className="mb-1 px-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <BotMessageSquare className="size-3 text-blue-500" />
                            AI Workspace
                        </span>
                    </div>
                    <SidebarMenu>
                        {aiNavItems.map((item) => {
                            const isActive = page.url === item.url || page.url.startsWith(item.url.split('?')[0] + (item.url.includes('?') ? '?' : '/')) && item.url.includes('?')
                                ? page.url.includes(item.url.split('?')[1] ?? '')
                                : page.url.startsWith(item.url);
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={isActive}>
                                        <Link href={item.url} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </div>

                {/* AI Quota Indicator (compact) */}
                {isAiActive && <AiQuotaIndicator teamId={activeTeamId} />}

                {/* Account Mode Status Badge */}
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
                        <p className="text-[11px] text-slate-500 leading-tight">
                            {isLecturer
                                ? 'Akses kelola kelas, bagi kelompok, dan bimbingan proyek.'
                                : 'Akses kelas kuliah, matchmaking kelompok, dan proyek tim.'}
                        </p>
                        {isCampusAdmin && (
                            <button
                                onClick={() => switchRole(isLecturer ? 'student' : 'lecturer')}
                                className="w-full mt-2.5 py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold text-[11px] border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                                <Repeat className="size-3 text-slate-400" />
                                <span>Ganti ke Akun {isLecturer ? 'Mahasiswa' : 'Dosen'} (Admin)</span>
                            </button>
                        )}
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
