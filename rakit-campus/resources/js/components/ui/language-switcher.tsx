import { useLocale, Locale } from '@/hooks/use-locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, Globe } from 'lucide-react';

interface LanguageSwitcherProps {
    variant?: 'pill' | 'select' | 'buttons';
    className?: string;
    showLabel?: boolean;
}

export function LanguageSwitcher({
    variant = 'pill',
    className = '',
    showLabel = true,
}: LanguageSwitcherProps) {
    const { locale, setLocale, isId, isEn, t } = useLocale();

    const languages: { code: Locale; name: string; nativeName: string; short: string }[] = [
        { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', short: 'ID' },
        { code: 'en', name: 'English', nativeName: 'English (US)', short: 'EN' },
    ];

    const currentLang = languages.find((l) => l.code === locale) || languages[0];

    if (variant === 'buttons') {
        return (
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 w-full ${className}`}>
                {languages.map((lang) => {
                    const isSelected = locale === lang.code;
                    return (
                        <button
                            key={lang.code}
                            type="button"
                            onClick={() => setLocale(lang.code)}
                            className={`group relative flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                                isSelected
                                    ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                                    : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                <div className={`size-9 rounded-xl flex items-center justify-center text-xs font-extrabold border ${
                                    isSelected
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                    {lang.short}
                                </div>
                                <div>
                                    <div className={`text-sm font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                        {lang.nativeName}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {lang.code === 'id'
                                            ? 'Bahasa Indonesia sebagai bahasa utama antarmuka'
                                            : 'Use English as the platform interface language'}
                                    </div>
                                </div>
                            </div>
                            <div
                                className={`size-6 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                                    isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-slate-300 group-hover:border-slate-400 bg-white'
                                }`}
                            >
                                {isSelected && <Check className="size-3.5 stroke-[3]" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={`Pilih Bahasa / Select Language (Aktif: ${currentLang.nativeName})`}
                    title={`Pilih Bahasa / Select Language (Aktif: ${currentLang.nativeName})`}
                    className={`h-[34px] sm:h-[38px] px-2.5 sm:px-3 rounded-full flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400/40 active:scale-95 shrink-0 ${className}`}
                >
                    <Globe className="size-3.5 text-slate-600 shrink-0" />
                    {showLabel && (
                        <span className="text-[11px] sm:text-xs font-bold tracking-tight text-slate-700">
                            {currentLang.short}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-48 p-1.5 rounded-2xl shadow-xl border border-slate-200/90 bg-white z-50 animate-in fade-in-80 zoom-in-95"
            >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {locale === 'id' ? 'Pilih Bahasa' : 'Select Language'}
                </div>
                {languages.map((lang) => {
                    const isSelected = locale === lang.code;
                    return (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => setLocale(lang.code)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                                isSelected
                                    ? 'bg-blue-50 text-blue-700 font-bold'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className={`size-5 rounded-md border flex items-center justify-center text-[10px] font-extrabold ${
                                    isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                    {lang.short}
                                </span>
                                <span>{lang.nativeName}</span>
                            </div>
                            {isSelected && <Check className="size-4 text-blue-600 stroke-[2.5]" />}
                        </DropdownMenuItem>
                    );
                })}
                <div className="mt-1 pt-1.5 border-t border-slate-100 px-3 py-1 text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{locale === 'en' ? 'AI Auto-Translates Data' : 'Terjemah Otomatis Aktif'}</span>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default LanguageSwitcher;
