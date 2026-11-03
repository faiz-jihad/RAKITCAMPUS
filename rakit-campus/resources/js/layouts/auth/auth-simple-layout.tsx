import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative min-h-svh flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50/60 selection:bg-blue-600 selection:text-white">
            {/* Subtle architectural background grid */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                }}
            />

            <div className="relative w-full max-w-md">
                {/* Brand Logo & Campus Badge */}
                <div className="flex flex-col items-center text-center mb-6">
                    <Link href="/" className="inline-block transition-transform hover:scale-[1.02] mb-3">
                        <img
                            src="/images/rakit-logo.png"
                            alt="RAKIT Campus"
                            className="h-10 sm:h-11 w-auto object-contain mx-auto"
                        />
                    </Link>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-medium text-slate-600">
                        <span className="size-1.5 rounded-full bg-blue-600" />
                        Politeknik Negeri Indramayu
                    </div>
                </div>

                {/* Main Auth Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
                    {(title || description) && (
                        <div className="mb-6 text-center">
                            {title && (
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                                    {title}
                                </h1>
                            )}
                            {description && (
                                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}

                    {children}
                </div>

                {/* Footer copyright */}
                <div className="text-center text-[11px] text-slate-400 mt-6 space-y-1">
                    <p>&copy; {new Date().getFullYear()} RAKIT Campus • Hak Cipta Dilindungi</p>
                    <p className="text-[10px] text-slate-400">Portal Kolaborasi Proyek & Komunitas Mahasiswa</p>
                </div>
            </div>
        </div>
    );
}
