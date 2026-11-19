import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

interface ContextualGuideProps {
    guideKey: string;
    title: string;
    description: string;
    actionText?: string;
    onDismiss?: () => void;
    className?: string;
}

// Module-level lock so that ONLY ONE tooltip is visible across the entire application at a time
let globalActiveGuideId: string | null = null;
const listeners = new Set<() => void>();

function notifyGuideChange() {
    listeners.forEach((listener) => listener());
}

export function resetAllGuides() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('rakit_dismissed_guides');
        globalActiveGuideId = null;
        notifyGuideChange();
    }
}

export default function ContextualGuideTooltip({
    guideKey,
    title,
    description,
    actionText,
    onDismiss,
    className = '',
}: ContextualGuideProps) {
    const { isEn } = useLocale();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkVisibility = () => {
            const dismissedRaw = localStorage.getItem('rakit_dismissed_guides');
            const dismissed: string[] = dismissedRaw ? JSON.parse(dismissedRaw) : [];

            if (dismissed.includes(guideKey)) {
                if (globalActiveGuideId === guideKey) {
                    globalActiveGuideId = null;
                    notifyGuideChange();
                }
                setIsVisible(false);
                return;
            }

            // Claim the global slot if vacant or already claimed by this guide
            if (!globalActiveGuideId || globalActiveGuideId === guideKey) {
                globalActiveGuideId = guideKey;
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        checkVisibility();

        const handler = () => checkVisibility();
        listeners.add(handler);

        return () => {
            listeners.delete(handler);
            if (globalActiveGuideId === guideKey) {
                globalActiveGuideId = null;
                notifyGuideChange();
            }
        };
    }, [guideKey]);

    const handleDismiss = () => {
        if (typeof window !== 'undefined') {
            const dismissedRaw = localStorage.getItem('rakit_dismissed_guides');
            const dismissed: string[] = dismissedRaw ? JSON.parse(dismissedRaw) : [];
            if (!dismissed.includes(guideKey)) {
                dismissed.push(guideKey);
                localStorage.setItem('rakit_dismissed_guides', JSON.stringify(dismissed));
            }
        }
        if (globalActiveGuideId === guideKey) {
            globalActiveGuideId = null;
        }
        setIsVisible(false);
        notifyGuideChange();
        if (onDismiss) onDismiss();
    };

    if (!isVisible) return null;

    return (
        <div
            className={`relative z-20 p-3 sm:p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-800 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200 ${className}`}
            role="region"
            aria-label="Contextual Guide"
        >
            <div className="flex items-start gap-2.5 min-w-0">
                <div className="size-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-400/30">
                    <Sparkles className="size-3.5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                    <h5 className="text-xs font-bold text-white tracking-tight leading-snug">
                        {title}
                    </h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-[11px] font-semibold text-white transition cursor-pointer"
                >
                    {actionText || (isEn ? 'Got it' : 'Mengerti')}
                </button>
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                    title={isEn ? 'Dismiss' : 'Tutup'}
                >
                    <X className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
