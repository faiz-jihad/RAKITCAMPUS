import { useEffect, useState } from 'react';
import { useLocale } from './use-locale';
import { translationService } from '@/services/translation-service';

interface UseAutoTranslateOptions {
    targetLang?: 'en' | 'id';
    enabled?: boolean;
}

/**
 * Hook to automatically translate dynamic database content based on active language setting.
 */
export function useAutoTranslate(text?: string | null, options?: UseAutoTranslateOptions) {
    const { locale } = useLocale();
    const raw = text || '';
    const target = options?.targetLang || locale;
    const enabled = options?.enabled !== false;

    const [translated, setTranslated] = useState<string>(raw);
    const [isTranslating, setIsTranslating] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;

        if (!enabled || !raw.trim() || target === 'id') {
            setTranslated(raw);
            setIsTranslating(false);
            return;
        }

        setIsTranslating(true);

        translationService
            .translate(raw, target)
            .then((res) => {
                if (isMounted) {
                    setTranslated(res);
                    setIsTranslating(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setTranslated(raw);
                    setIsTranslating(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [raw, target, enabled]);

    return {
        text: translated,
        isTranslating,
        originalText: raw,
    };
}
