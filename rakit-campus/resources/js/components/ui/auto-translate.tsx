import React from 'react';
import { useAutoTranslate } from '@/hooks/use-auto-translate';
import { useLocale } from '@/hooks/use-locale';

interface AutoTranslateProps extends React.HTMLAttributes<HTMLElement> {
    text?: string | null;
    as?: any;
    className?: string;
    showBadge?: boolean;
    children?: React.ReactNode;
}

/**
 * AutoTranslate Component — Drops into any view to translate dynamic text
 * into English automatically when the EN locale is selected.
 */
export const AutoTranslate: React.FC<AutoTranslateProps> = ({
    text,
    as: Component = 'span',
    className = '',
    showBadge = false,
    children,
    ...rest
}) => {
    const rawContent = text ?? (typeof children === 'string' ? children : '');
    const { text: translated, isTranslating } = useAutoTranslate(rawContent);
    const { isEn } = useLocale();

    const isDifferent = isEn && translated !== rawContent;

    return (
        <Component
            className={`${className} ${isTranslating ? 'opacity-80 transition-opacity' : ''}`}
            {...rest}
        >
            {translated}
            {showBadge && isDifferent && (
                <span
                    title="Auto-translated from Indonesian"
                    className="ml-1.5 inline-flex items-center px-1.5 py-0.2 text-[9px] font-semibold bg-blue-50 text-blue-600 border border-blue-200/60 rounded-md select-none"
                >
                    AI EN
                </span>
            )}
        </Component>
    );
};

export default AutoTranslate;
