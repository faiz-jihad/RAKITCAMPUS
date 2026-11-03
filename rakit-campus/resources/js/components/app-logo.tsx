import { Link } from '@inertiajs/react';

export default function AppLogo({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2.5 py-1 ${className}`}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs p-1 shrink-0">
                <img
                    src="/images/rakit-mark.png"
                    alt="RAKIT"
                    className="size-6 object-contain"
                />
            </div>
            <div className="grid flex-1 text-left leading-none">
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-black text-[#0F172A] tracking-tight text-sm">RAKIT</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 tracking-wider">
                        Campus
                    </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate">Ruang Kolaborasi Mahasiswa</span>
            </div>
        </div>
    );
}
