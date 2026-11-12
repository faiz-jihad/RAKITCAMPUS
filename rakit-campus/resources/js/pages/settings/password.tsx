import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan Akun',
        href: '/settings/profile',
    },
    {
        title: 'Keamanan Sandi',
        href: '/settings/password',
    },
];

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Keamanan Kata Sandi — RAKIT Campus" />

            <SettingsLayout>
                <div className="space-y-6 max-w-2xl">
                    {/* Main Password Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <KeyRound className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Perbarui Kata Sandi
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pastikan akun Anda menggunakan kata sandi yang aman dan sulit ditebak.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={updatePassword} className="space-y-5">
                            {/* Current Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="current_password" className="text-xs font-semibold text-slate-700">
                                    Kata Sandi Saat Ini
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        value={data.current_password}
                                        onChange={(e) => setData('current_password', e.target.value)}
                                        type={showCurrent ? 'text' : 'password'}
                                        className="rounded-xl text-xs py-2.5 pr-10 border-slate-200 bg-white"
                                        autoComplete="current-password"
                                        placeholder="Masukkan kata sandi lama Anda"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        tabIndex={-1}
                                    >
                                        {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.current_password} />
                            </div>

                            {/* New Password */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                                        Kata Sandi Baru
                                    </Label>
                                    <span className="text-[11px] text-slate-400">Minimal 8 karakter</span>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        ref={passwordInput}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        type={showNew ? 'text' : 'password'}
                                        className="rounded-xl text-xs py-2.5 pr-10 border-slate-200 bg-white"
                                        autoComplete="new-password"
                                        placeholder="Masukkan kata sandi baru"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        tabIndex={-1}
                                    >
                                        {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation" className="text-xs font-semibold text-slate-700">
                                    Ulangi Kata Sandi Baru
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        type={showConfirm ? 'text' : 'password'}
                                        className="rounded-xl text-xs py-2.5 pr-10 border-slate-200 bg-white"
                                        autoComplete="new-password"
                                        placeholder="Ketik ulang kata sandi baru"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Kata Sandi'}
                                </button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out duration-200"
                                    enterFrom="opacity-0 translate-y-1"
                                    enterTo="opacity-100 translate-y-0"
                                    leave="transition ease-in-out duration-200"
                                    leaveTo="opacity-0"
                                >
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                                        <CheckCircle2 className="size-3.5" />
                                        <span>Kata sandi berhasil diperbarui</span>
                                    </span>
                                </Transition>
                            </div>
                        </form>
                    </div>

                    {/* Security Tip Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-start gap-3">
                        <ShieldCheck className="size-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                            Gunakan kombinasi huruf kapital, huruf kecil, angka, dan simbol untuk keamanan maksimal akun Anda. Jangan gunakan kata sandi yang sama dengan akun lain.
                        </p>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
