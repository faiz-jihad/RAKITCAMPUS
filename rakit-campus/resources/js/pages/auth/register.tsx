import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    LoaderCircle,
    Lock,
    Mail,
    Sparkles,
    User,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function Register() {
    const { flash } = usePage<{ flash?: { success?: string; warning?: string; error?: string; status?: string } }>().props;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Daftar Akun Mahasiswa"
            description="Buat akun untuk menemukan proyek, membentuk tim berkomplementer, dan bimbingan kelas."
        >
            <Head title="Daftar Mahasiswa — RAKIT Campus" />

            {/* Clear Onboarding Notice */}
            <div className="mb-5 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-left">
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-blue-900">Alur Pendaftaran Singkat</p>
                        <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                            Setelah akun dibuat, kamu akan diarahkan mengisi <strong>NIM & 2 Keahlian</strong> agar matchmaking rekan sekelas otomatis aktif.
                        </p>
                    </div>
                </div>
            </div>

            <form className="flex flex-col gap-4" onSubmit={submit}>
                <div className="space-y-3.5 text-left">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                            Nama Lengkap
                        </Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <User className="size-4" />
                            </div>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                disabled={processing}
                                placeholder="Contoh: Muhammad Farhan"
                                className="pl-9 rounded-xl border-slate-200 text-xs py-2.5 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                            />
                        </div>
                        <InputError message={errors.name} />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                            Email Kampus / Mahasiswa
                        </Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Mail className="size-4" />
                            </div>
                            <Input
                                id="email"
                                type="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                disabled={processing}
                                placeholder="nama@student.polindra.ac.id"
                                className="pl-9 rounded-xl border-slate-200 text-xs py-2.5 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                            Kata Sandi
                        </Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Lock className="size-4" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                disabled={processing}
                                placeholder="Minimal 8 karakter"
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

                    {/* Password Confirmation */}
                    <div className="space-y-1.5">
                        <Label htmlFor="password_confirmation" className="text-xs font-semibold text-slate-700">
                            Konfirmasi Kata Sandi
                        </Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Lock className="size-4" />
                            </div>
                            <Input
                                id="password_confirmation"
                                type={showPassword ? 'text' : 'password'}
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                disabled={processing}
                                placeholder="Ulangi kata sandi"
                                className="pl-9 rounded-xl border-slate-200 text-xs py-2.5 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                            />
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        tabIndex={5}
                        className="mt-1 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? (
                            <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                            <>
                                <span>Daftar Sekarang & Lanjut</span>
                                <ArrowRight className="size-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Google OAuth Register */}
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
                    <span>Daftar Cepat dengan Google</span>
                </a>
            </div>

            {/* Login Link */}
            <div className="text-slate-500 text-center text-xs mt-5">
                Sudah memiliki akun?{' '}
                <Link
                    href={route('login')}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    tabIndex={6}
                >
                    Masuk di sini
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
            {flash?.success && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-center text-xs font-semibold text-emerald-800 rounded-xl">
                    {flash.success}
                </div>
            )}
        </AuthLayout>
    );
}
