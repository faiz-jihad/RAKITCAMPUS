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
