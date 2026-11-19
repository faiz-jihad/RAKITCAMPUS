import { useCallback, useEffect, useState } from 'react';
import { Locale, translations } from '../lib/translations';

export type { Locale };

const applyLocale = (locale: Locale) => {
    document.documentElement.lang = locale;
    localStorage.setItem('locale', locale);
};

export function initializeLocale() {
    if (typeof window === 'undefined') return;
    const savedLocale = (localStorage.getItem('locale') as Locale) || 'id';
    applyLocale(savedLocale === 'en' ? 'en' : 'id');
}

export function useLocale() {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window === 'undefined') return 'id';
        const saved = localStorage.getItem('locale');
        return saved === 'en' ? 'en' : 'id';
    });

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        applyLocale(newLocale);
        window.dispatchEvent(new CustomEvent('locale-change', { detail: { locale: newLocale } }));
    }, []);

    const toggleLocale = useCallback(() => {
        setLocale(locale === 'id' ? 'en' : 'id');
    }, [locale, setLocale]);

    useEffect(() => {
        const handleLocaleChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ locale?: Locale }>;
            const nextLocale = customEvent.detail?.locale || (localStorage.getItem('locale') as Locale) || 'id';
            setLocaleState(nextLocale === 'en' ? 'en' : 'id');
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'locale' && e.newValue) {
                const nextLocale = e.newValue === 'en' ? 'en' : 'id';
                setLocaleState(nextLocale);
                document.documentElement.lang = nextLocale;
            }
        };

        window.addEventListener('locale-change', handleLocaleChange);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('locale-change', handleLocaleChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    /**
     * Resolves a nested key string like 'nav.competitions' or 'workspace.tabs.overview'
     * Supports basic interpolation: t('key', { count: 5 }) -> replaces :count or {count}
     */
    const t = useCallback(
        (key: string, paramsOrFallback?: Record<string, string | number> | string): string => {
            const dict = translations[locale] || translations.id;
            const keys = key.split('.');
            let current: any = dict;

            for (const k of keys) {
                if (current && typeof current === 'object' && k in current) {
                    current = current[k];
                } else {
                    current = undefined;
                    break;
                }
            }

            let result = typeof current === 'string' ? current : undefined;

            if (result === undefined) {
                // Try fallback to Indonesian if English missed the key
                if (locale !== 'id') {
                    let idCurrent: any = translations.id;
                    for (const k of keys) {
                        if (idCurrent && typeof idCurrent === 'object' && k in idCurrent) {
                            idCurrent = idCurrent[k];
                        } else {
                            idCurrent = undefined;
                            break;
                        }
                    }
                    if (typeof idCurrent === 'string') {
                        result = idCurrent;
                    }
                }
            }

            if (result === undefined) {
                if (typeof paramsOrFallback === 'string') {
                    return paramsOrFallback;
                }
                return key;
            }

            if (paramsOrFallback && typeof paramsOrFallback === 'object') {
                for (const [pKey, pVal] of Object.entries(paramsOrFallback)) {
                    result = result.replace(new RegExp(`:${pKey}|\\{${pKey}\\}`, 'g'), String(pVal));
                }
            }

            return result;
        },
        [locale]
    );

    return {
        locale,
        isId: locale === 'id',
        isEn: locale === 'en',
        setLocale,
        toggleLocale,
        t,
        translations: translations[locale] || translations.id,
    };
}
