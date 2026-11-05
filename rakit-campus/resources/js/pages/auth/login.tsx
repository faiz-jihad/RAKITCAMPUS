import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Eye,
    EyeOff,
    GraduationCap,
    LoaderCircle,
    Lock,
    Mail,
    ShieldCheck,
    UserCircle2,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({ status, canResetPassword = true }: LoginProps) {
    const { flash } = usePage<{ flash?: { success?: string; warning?: string; error?: string; status?: string } }>().props;
    const [showPassword, setShowPassword] = useState(false);
    const [demoRole, setDemoRole] = useState<'student' | 'lecturer'>('student');

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const fillDemo = (email: string) => {
        setData({
            email,
            password: 'password123',
            remember: true,
        });
    };

    return (
        <AuthLayout
            title="Masuk ke Akun"
            description="Silakan masuk untuk mengakses kelas akademik, proyek, dan matchmaking rekan tim."
        >
            <Head title="Masuk — RAKIT Campus" />

            {/* Role Demo Switcher (1-Click Login for Testers / Students / Lecturers) */}
            <div className="mb-6 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-blue-600" />
                        Akses Cepat Akun Demo (1-Klik)
                    </span>
                    <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-medium">
                        <button
                            type="button"
                            onClick={() => setDemoRole('student')}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                                demoRole === 'student'
                                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Mahasiswa
                        </button>
                        <button
                            type="button"
                            onClick={() => setDemoRole('lecturer')}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                                demoRole === 'lecturer'
                                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Dosen
                        </button>
                    </div>
                </div>

                {demoRole === 'student' ? (
                    <div className="grid grid-cols-2 gap-1.5 text-left">
                        <button
                            type="button"
                            onClick={() => fillDemo('ahmad.fauzi@student.polindra.ac.id')}
                            className="p-2 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg transition text-left group"
                        >
                            <div className="flex items-center gap-1.5">
                                <UserCircle2 className="size-3.5 text-blue-600 shrink-0" />
                                <span className="text-xs font-semibold text-slate-800 truncate">Ahmad Fauzi</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5 truncate">Backend (Cari Rekan)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => fillDemo('siti@polindra.ac.id')}
                            className="p-2 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg transition text-left group"
                        >
                            <div className="flex items-center gap-1.5">
                                <UserCircle2 className="size-3.5 text-indigo-600 shrink-0" />
                                <span className="text-xs font-semibold text-slate-800 truncate">Siti Rahma</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5 truncate">Mobile Flutter Dev</span>
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fillDemo('budi@polindra.ac.id')}
                        className="w-full p-2 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-lg transition text-left group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <GraduationCap className="size-4 text-emerald-600 shrink-0" />
                                <div>
                                    <span className="text-xs font-semibold text-slate-800 block">Budi Santoso, M.Kom.</span>
                                    <span className="text-[10px] text-slate-500">Dosen Pengampu & Pembimbing Tim</span>
                                </div>
                            </div>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                                Masuk sebagai Dosen
                            </span>
                        </div>
                    </button>
                )}
            </div>

            <form className="flex flex-col gap-4" onSubmit={submit}>
                <div className="space-y-4">
                    {/* Email Input */}
                    <div className="space-y-1.5 text-left">
                        <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                            Email Kampus / Akun
                        </Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Mail className="size-4" />
                            </div>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="nama@student.polindra.ac.id"
                                className="pl-9 rounded-xl border-slate-200 text-xs py-2.5 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                                Kata Sandi
                            </Label>
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                    tabIndex={5}
                                >
                                    Lupa sandi?
                                </Link>
                            )}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Lock className="size-4" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Masukkan kata sandi"
                                className="pl-9 pr-9 rounded-xl border-slate-200 text-xs py-2.5 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center space-x-2 pt-0.5 text-left">
                        <Checkbox
                            id="remember"
                            name="remember"
                            tabIndex={3}
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', !!checked)}
                        />
                        <Label htmlFor="remember" className="text-xs text-slate-600 font-normal cursor-pointer">
                            Ingat saya di perangkat ini
                        </Label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        tabIndex={4}
                        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? (
                            <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                            <>
                                <span>Masuk ke Akun</span>
                                <ArrowRight className="size-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Google OAuth Login */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <a
                    href="/auth/google"
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 hover:border-slate-300"
                >
                    <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                    </svg>
                    <span>Masuk dengan Akun Google</span>
                </a>
            </div>

            {/* Register Link */}
            <div className="text-slate-500 text-center text-xs mt-5">
                Belum punya akun?{' '}
                <Link
                    href={route('register')}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    tabIndex={6}
                >
                    Daftar Akun Mahasiswa
                </Link>
            </div>

            {flash?.warning && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-center text-xs font-semibold text-amber-800 rounded-xl">
                    {flash.warning}
                </div>
            )}
            {flash?.error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-center text-xs font-semibold text-rose-800 rounded-xl">
                    {flash.error}
                </div>
            )}
            {(status || flash?.status || flash?.success) && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-center text-xs font-semibold text-emerald-800 rounded-xl">
                    {status || flash?.status || flash?.success}
                </div>
            )}
        </AuthLayout>
    );
}
