import React from 'react';
import { Link } from '@inertiajs/react';
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    className?: string;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    className = '',
}: EmptyStateProps) {
    return (
        <div className={`p-6 sm:p-8 rounded-2xl bg-white/80 border border-slate-200/80 text-center flex flex-col items-center justify-center shadow-2xs ${className}`}>
            <div className="size-11 sm:size-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3 border border-slate-200/60 shadow-2xs">
                <Icon className="size-5 sm:size-5.5 text-slate-700" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {title}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                {description}
            </p>
            {actionLabel && (actionHref || onAction) && (
                <div className="mt-4">
                    {actionHref ? (
                        <Link
                            href={actionHref}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold shadow-xs transition"
                        >
                            <span>{actionLabel}</span>
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={onAction}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                            <span>{actionLabel}</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
