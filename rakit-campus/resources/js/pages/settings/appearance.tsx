import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useLocale } from '@/hooks/use-locale';
import { type BreadcrumbItem } from '@/types';
import { Globe, Palette } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    const { t } = useLocale();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.title', 'Pengaturan Akun'),
            href: '/settings/profile',
        },
        {
            title: t('nav.appearance', 'Tema & Tampilan'),
            href: '/settings/appearance',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('nav.appearance', 'Tema & Tampilan')} - RAKIT Campus`} />

            <SettingsLayout>
                <div className="space-y-6 max-w-2xl">
                    {/* 1. Language & Localization Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Globe className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    {t('settings.language_title', 'Bahasa & Lokalisasi')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {t('settings.language_sub', 'Pilih bahasa antarmuka aplikasi RakitCampus (Bahasa Indonesia atau English).')}
                                </p>
                            </div>
                        </div>

                        <LanguageSwitcher variant="buttons" />
                    </div>

                    {/* 2. Theme & Appearance Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Palette className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    {t('settings.theme_title', 'Tema & Tampilan Antarmuka')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {t('settings.theme_sub', 'Pilih preferensi tema warna tampilan aplikasi yang paling nyaman untuk Anda.')}
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
