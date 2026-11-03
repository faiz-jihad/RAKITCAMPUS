import { Link } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative min-h-svh flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#EAE6FF] via-[#F6F4FE] to-white overflow-hidden selection:bg-[#5448EE] selection:text-white">
            {/* Ambient ethereal orbs */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-violet-300/30 via-indigo-200/40 to-purple-300/30 blur-3xl rounded-full pointer-events-none -z-10" />
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/70 blur-3xl rounded-full pointer-events-none -z-10" />
            <div className="absolute top-40 -right-20 w-80 h-80 bg-white/70 blur-3xl rounded-full pointer-events-none -z-10" />

            <div className="w-full max-w-md">
                {/* Floating Glass Card */}
                <div className="bg-white/95 backdrop-blur-xl border border-white/90 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(84,72,238,0.12)]">
                    {/* Header: Logo & Title */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <Link href="/" className="flex items-center gap-2 mb-3 group">
                            <div className="size-10 rounded-2xl bg-[#5448EE] flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                                <Sparkles className="size-5 fill-white/20" />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight text-neutral-900">
                                RAKIT<span className="text-[#5448EE]">Campus</span>
                            </span>
                        </Link>

                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                                {description}
                            </p>
                        )}
                    </div>

                    {children}
                </div>

                {/* Footer copyright */}
                <p className="text-center text-[11px] text-neutral-400 mt-6">
                    &copy; {new Date().getFullYear()} RAKIT Campus • Politeknik Negeri Indramayu
                </p>
            </div>
        </div>
    );
}
