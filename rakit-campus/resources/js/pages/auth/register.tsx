import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
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
            description="Bergabunglah dengan RAKIT Campus untuk menemukan proyek, membentuk tim, dan meraih prestasi kompetisi."
        >
            <Head title="Daftar — RAKIT Campus" />

            {/* Google Authentication Button */}
            <div className="mb-4">
                <a
                    href="/auth/google"
                    className="w-full bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-full py-2.5 px-4 text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2.5 hover:border-neutral-400 group"
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

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-neutral-400 font-medium">atau daftar dengan email</span>
                    </div>
                </div>
            </div>

            <form className="flex flex-col gap-4" onSubmit={submit}>
                <div className="grid gap-3.5 text-left">
                    <div className="grid gap-1.5">
                        <Label htmlFor="name" className="text-xs font-semibold text-neutral-700">
                            Nama Lengkap
                        </Label>
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
                            placeholder="Contoh: Budi Santoso"
                            className="rounded-xl border-neutral-200 text-xs py-2.5 focus-visible:ring-[#5448EE] focus-visible:border-[#5448EE]"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="email" className="text-xs font-semibold text-neutral-700">
                            Email Kampus
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="nama@polindra.ac.id"
                            className="rounded-xl border-neutral-200 text-xs py-2.5 focus-visible:ring-[#5448EE] focus-visible:border-[#5448EE]"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="password" className="text-xs font-semibold text-neutral-700">
                            Kata Sandi
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="Minimal 8 karakter"
                            className="rounded-xl border-neutral-200 text-xs py-2.5 focus-visible:ring-[#5448EE] focus-visible:border-[#5448EE]"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="password_confirmation" className="text-xs font-semibold text-neutral-700">
                            Konfirmasi Kata Sandi
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Ulangi kata sandi"
                            className="rounded-xl border-neutral-200 text-xs py-2.5 focus-visible:ring-[#5448EE] focus-visible:border-[#5448EE]"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        tabIndex={5}
                        className="mt-2 w-full bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full py-3 text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Daftar Sekarang
                    </button>
                </div>

                <div className="text-neutral-500 text-center text-xs mt-2">
                    Sudah memiliki akun?{' '}
                    <TextLink href={route('login')} className="font-semibold text-[#5448EE] hover:underline" tabIndex={6}>
                        Masuk di sini
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
