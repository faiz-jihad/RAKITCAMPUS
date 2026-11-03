import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
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
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
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
            title="Masuk ke Akun Anda"
            description="Silakan masukkan email kampus dan kata sandi Anda untuk mengakses portal kolaborasi."
        >
            <Head title="Masuk — RAKIT Campus" />

            {/* Quick Demo Login Pills */}
            <div className="mb-5 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 mb-2">
                    <Sparkles className="size-3.5 text-[#5448EE]" />
                    Pilih Akun Demo Pilot (1-Klik):
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                        type="button"
                        onClick={() => fillDemo('budi@polindra.ac.id')}
                        className="p-1.5 bg-white hover:bg-purple-50 text-neutral-700 hover:text-purple-700 border border-neutral-200 rounded-lg text-left transition font-medium"
                    >
                        <span className="font-bold block">Budi Santoso</span>
                        <span className="text-[10px] text-neutral-400">Project Leader IoT</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => fillDemo('siti@polindra.ac.id')}
                        className="p-1.5 bg-white hover:bg-blue-50 text-neutral-700 hover:text-blue-700 border border-neutral-200 rounded-lg text-left transition font-medium"
                    >
                        <span className="font-bold block">Siti Rahma</span>
                        <span className="text-[10px] text-neutral-400">Mobile Flutter Dev</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => fillDemo('agus@polindra.ac.id')}
                        className="p-1.5 bg-white hover:bg-emerald-50 text-neutral-700 hover:text-emerald-700 border border-neutral-200 rounded-lg text-left transition font-medium"
                    >
                        <span className="font-bold block">Agus Prasetyo</span>
                        <span className="text-[10px] text-neutral-400">Backend Engineer</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => fillDemo('dewi@polindra.ac.id')}
                        className="p-1.5 bg-white hover:bg-amber-50 text-neutral-700 hover:text-amber-700 border border-neutral-200 rounded-lg text-left transition font-medium"
                    >
                        <span className="font-bold block">Dewi Lestari</span>
                        <span className="text-[10px] text-neutral-400">Smart City / SIKC</span>
                    </button>
                </div>
            </div>

            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div className="grid gap-4">
                    <div className="grid gap-1.5 text-left">
                        <Label htmlFor="email" className="text-xs font-semibold text-neutral-700">
                            Email Kampus
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="nama@polindra.ac.id"
                            className="rounded-xl border-neutral-200 text-xs py-2.5 focus-visible:ring-[#5448EE] focus-visible:border-[#5448EE]"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-1.5 text-left">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-xs font-semibold text-neutral-700">
                                Kata Sandi
                            </Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="text-xs text-[#5448EE] hover:underline" tabIndex={5}>
                                    Lupa kata sandi?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            className="rounded-xl border-neutral-200 text-xs py-2.5 focus-visible:ring-[#5448EE] focus-visible:border-[#5448EE]"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-2 pt-1 text-left">
                        <Checkbox
                            id="remember"
                            name="remember"
                            tabIndex={3}
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', !!checked)}
                        />
                        <Label htmlFor="remember" className="text-xs text-neutral-600 font-normal cursor-pointer">
                            Ingat saya di perangkat ini
                        </Label>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        tabIndex={4}
                        className="mt-2 w-full bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full py-3 text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Masuk Sekarang
                    </button>
                </div>

                <div className="text-neutral-500 text-center text-xs mt-2">
                    Belum memiliki akun?{' '}
                    <TextLink href={route('register')} className="font-semibold text-[#5448EE] hover:underline" tabIndex={5}>
                        Daftar Akun Mahasiswa
                    </TextLink>
                </div>
            </form>

            {status && <div className="mt-4 text-center text-xs font-medium text-emerald-600">{status}</div>}
        </AuthLayout>
    );
}
