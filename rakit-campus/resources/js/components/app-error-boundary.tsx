import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidMount() {
        // If the error was caused by a stale bundle chunk after deploy, auto-reload immediately
        if (this.state.hasError) {
            const msg = String(this.state.error?.message || '');
            if (
                msg.includes('Failed to fetch') ||
                msg.includes('dynamically imported module') ||
                msg.includes('Importing a module script failed') ||
                msg.includes('Loading chunk')
            ) {
                setTimeout(() => window.location.reload(), 300);
            }
        }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught React error caught by AppErrorBoundary:', error, errorInfo);
        const msg = String(error?.message || '');
        if (
            msg.includes('Failed to fetch') ||
            msg.includes('dynamically imported module') ||
            msg.includes('Importing a module script failed') ||
            msg.includes('Loading chunk')
        ) {
            window.location.reload();
        }
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-xl text-center space-y-5 animate-in fade-in duration-200">
                        <div className="size-14 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                            <AlertCircle className="size-7 stroke-[2.2]" />
                        </div>

                        <div className="space-y-1.5">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                Memperbarui Sesi Tampilan
                            </h2>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                                Sistem telah memperbarui versi aplikasi terbaru. Silakan muat ulang halaman untuk melanjutkan dengan lancar.
                            </p>
                        </div>

                        <div className="space-y-2 pt-2">
                            <button
                                type="button"
                                onClick={this.handleReload}
                                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                            >
                                <RefreshCw className="size-3.5" />
                                <span>Muat Ulang Halaman</span>
                            </button>

                            <button
                                type="button"
                                onClick={this.handleGoHome}
                                className="w-full py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Home className="size-3.5" />
                                <span>Kembali ke Beranda</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
export default AppErrorBoundary;
