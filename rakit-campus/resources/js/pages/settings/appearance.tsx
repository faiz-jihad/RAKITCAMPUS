import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import { type BreadcrumbItem } from '@/types';
import { Palette } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan Akun',
        href: '/settings/profile',
    },
    {
        title: 'Tema & Tampilan',
        href: '/settings/appearance',
    },
];

export default function Appearance() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tema & Tampilan RAKIT Campus" />

            <SettingsLayout>
                <div className="space-y-6 max-w-2xl">
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Palette className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Tema & Tampilan Antarmuka
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pilih preferensi tema warna tampilan aplikasi yang paling nyaman untuk Anda.
                                </p>
                            </div>
                        </div>

                        <AppearanceTabs />
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
