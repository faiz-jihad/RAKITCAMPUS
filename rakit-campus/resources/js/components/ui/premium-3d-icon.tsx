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
        bg: 'bg-gradient-to-tr from-[#4336D6] via-[#5448EE] to-[#8E84FC]',
        shadow: 'shadow-lg shadow-indigo-500/30',
        ring: 'ring-4 ring-purple-100/60',
        text: 'text-white',
    },
    indigo: {
        bg: 'bg-gradient-to-tr from-[#0F0A24] via-[#181135] to-[#3B2D71]',
        shadow: 'shadow-lg shadow-indigo-950/40',
        ring: 'ring-4 ring-neutral-200/60',
        text: 'text-white',
    },
    emerald: {
        bg: 'bg-gradient-to-tr from-[#047857] via-[#059669] to-[#34D399]',
        shadow: 'shadow-lg shadow-emerald-500/25',
        ring: 'ring-4 ring-emerald-100/60',
        text: 'text-white',
    },
    amber: {
        bg: 'bg-gradient-to-tr from-[#B45309] via-[#D97706] to-[#FBBF24]',
        shadow: 'shadow-lg shadow-amber-500/25',
        ring: 'ring-4 ring-amber-100/60',
        text: 'text-white',
    },
    rose: {
        bg: 'bg-gradient-to-tr from-[#BE123C] via-[#E11D48] to-[#FB7185]',
        shadow: 'shadow-lg shadow-rose-500/25',
        ring: 'ring-4 ring-rose-100/60',
        text: 'text-white',
    },
    cyan: {
        bg: 'bg-gradient-to-tr from-[#0369A1] via-[#0284C7] to-[#38BDF8]',
        shadow: 'shadow-lg shadow-sky-500/25',
        ring: 'ring-4 ring-sky-100/60',
        text: 'text-white',
    },
};

const sizeStyles = {
    sm: {
        box: 'size-8 rounded-xl',
        icon: 'size-4',
    },
    md: {
        box: 'size-11 rounded-2xl',
        icon: 'size-5',
    },
    lg: {
        box: 'size-14 rounded-3xl',
        icon: 'size-7',
    },
    xl: {
        box: 'size-18 rounded-3xl',
        icon: 'size-9',
    },
};

export default function Premium3dIcon({
    icon: Icon,
    variant = 'purple',
    size = 'md',
    className = '',
}: Props) {
    const v = variantStyles[variant];
    const s = sizeStyles[size];

    return (
        <div
            className={`relative flex items-center justify-center shrink-0 ${v.bg} ${v.shadow} ${v.ring} ${v.text} ${s.box} ${className} transition-transform hover:scale-105 active:scale-95`}
        >
            {/* Glossy top-half reflection highlight */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-[inherit] pointer-events-none" />
            
            {/* Embossed icon with drop shadow */}
            <Icon
                className={`${s.icon} relative z-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] stroke-[2.2]`}
            />
        </div>
    );
}