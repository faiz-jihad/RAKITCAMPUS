import { LucideIcon } from 'lucide-react';
import React from 'react';

interface Props {
    icon: LucideIcon;
    variant?: 'purple' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const variantStyles = {
    purple: {
        bg: 'bg-blue-50/80 backdrop-blur-md',
        border: 'border border-blue-200/80',
        shadow: 'shadow-2xs',
        text: 'text-blue-600',
    },
    indigo: {
        bg: 'bg-slate-100/80 backdrop-blur-md',
        border: 'border border-slate-200/80',
        shadow: 'shadow-2xs',
        text: 'text-slate-800',
    },
    emerald: {
        bg: 'bg-emerald-50/80 backdrop-blur-md',
        border: 'border border-emerald-200/80',
        shadow: 'shadow-2xs',
        text: 'text-emerald-600',
    },
    amber: {
        bg: 'bg-amber-50/80 backdrop-blur-md',
        border: 'border border-amber-200/80',
        shadow: 'shadow-2xs',
        text: 'text-amber-600',
    },
    rose: {
        bg: 'bg-rose-50/80 backdrop-blur-md',
        border: 'border border-rose-200/80',
        shadow: 'shadow-2xs',
        text: 'text-rose-600',
    },
    cyan: {
        bg: 'bg-sky-50/80 backdrop-blur-md',
        border: 'border border-sky-200/80',
        shadow: 'shadow-2xs',
        text: 'text-sky-600',
    },
};

const sizeStyles = {
    sm: {
        box: 'size-8 rounded-xl',
        icon: 'size-4',
    },
    md: {
        box: 'size-10 rounded-xl',
        icon: 'size-5',
    },
    lg: {
        box: 'size-12 rounded-2xl',
        icon: 'size-6',
    },
    xl: {
        box: 'size-16 rounded-2xl',
        icon: 'size-8',
    },
};

export default function Premium3dIcon({
    icon: Icon,
    variant = 'purple',
    size = 'md',
    className = '',
}: Props) {
    const v = variantStyles[variant] || variantStyles.purple;
    const s = sizeStyles[size] || sizeStyles.md;

    return (
        <div
            className={`relative flex items-center justify-center shrink-0 ${v.bg} ${v.border} ${v.shadow} ${v.text} ${s.box} ${className} transition-all duration-200 hover:scale-105`}
        >
            <Icon
                className={`${s.icon} relative z-10 stroke-[2]`}
            />
        </div>
    );
}