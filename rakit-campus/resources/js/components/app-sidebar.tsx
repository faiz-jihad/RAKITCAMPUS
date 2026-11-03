import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Award, FolderKanban, Kanban, LayoutGrid, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const isCampusAdmin = auth?.user?.campus?.role === 'campus_admin' || auth?.user?.is_platform_admin;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
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
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
