import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Eye,
    EyeOff,
    LoaderCircle,
    Lock,
    Mail,
    User,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { AnimatedJigsawBackground } from '@/components/animated-jigsaw-background';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    [key: string]: string;
};

export default function Register() {
    const { flash } = usePage<{ flash?: { success?: string; warning?: string; error?: string; status?: string } }>().props;
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedTerms, setAgreedTerms] = useState(true);

    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!agreedTerms) return;

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen lg:h-screen w-full bg-[#F8FAFC] text-slate-800 flex flex-col lg:flex-row selection:bg-blue-600 selection:text-white relative font-sans overflow-x-hidden lg:overflow-hidden">
            <Head>
                <title>Daftar Akun Mahasiswa — RAKIT Campus</title>
            </Head>

            {/* Global Light Theme Lock, Custom Plus Jakarta Sans Font & Zero Horizontal Scroll */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap');

                #nprogress,
                #nprogress .bar,
                #nprogress .peg,
                #nprogress .spinner {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    height: 0 !important;
                }

                html, body, #app, button, input, textarea, select, h1, h2, h3, h4, p, span, a {
                    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
                }
                html, body {
                    background-color: #F8FAFC !important;
                    overflow-x: hidden !important;
                    margin: 0;
                    padding: 0;
                }
                @media (min-width: 1024px) {
                    html, body {
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                }
            `}</style>

            {/* ============================================================== */}
            {/* LEFT SIDE: Visual Brand Showcase with Living Jigsaw Background */}
            {/* ============================================================== */}
            <div className="hidden lg:flex relative w-full lg:w-[50%] xl:w-[52%] lg:h-full flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-hidden select-none">
                {/* Authentic Animated Jigsaw Puzzle Background (Image 2 style: pieces connect one by one to whole) */}
                <AnimatedJigsawBackground />

                {/* Top Brand Header */}
                <header className="relative z-10 flex items-center shrink-0">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <img
                            src="/images/rakit-mark.png"
                            alt="RAKIT CAMPUS"
                            className="size-8 sm:size-9 object-contain transition-transform group-hover:scale-105"
                        />
                        <span className="font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                            RAKIT CAMPUS
                        </span>
                    </Link>
                </header>

                {/* Center Content: Hero Headline */}
                <div className="relative z-10 my-auto py-8 sm:py-12 flex flex-col items-center lg:items-start text-center lg:text-left w-full max-w-[540px] mx-auto lg:mx-0">
                    <h1 className="text-4xl sm:text-5xl lg:text-[50px] xl:text-[54px] font-black tracking-tight text-slate-900 leading-[1.16]">
                        Mulai dari satu <br className="hidden sm:inline" />
                        keping:{' '}
                        <span className="relative inline-block text-blue-600 whitespace-nowrap">
                            kamu.
                            <svg
                                className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-2.5 sm:h-3.5 text-blue-600 pointer-events-none overflow-visible"
                                viewBox="0 0 120 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                preserveAspectRatio="none"
                            >
                                <path
                                    d="M 3 9 C 35 2.5, 80 2.5, 117 7.5"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-700 mt-5 leading-relaxed max-w-lg font-medium">
                        Lengkapi profilmu, lalu rakit tim perkuliahan dan kompetisi dengan keahlian yang saling melengkapi.
                    </p>
                </div>
            </div>

            {/* ============================================================== */}
            {/* RIGHT SIDE: Clean Registration Form (Frameless Direct Form)    */}
            {/* ============================================================== */}
            <div className="relative w-full lg:w-[50%] xl:w-[48%] min-h-screen lg:min-h-0 lg:h-full flex flex-col items-center justify-center p-4 sm:p-8 lg:px-10 xl:px-14 lg:py-6 xl:py-8 bg-white border-t lg:border-t-0 lg:border-l border-slate-200/80 z-20 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="w-full max-w-[440px] my-auto py-4 sm:py-6">
                    {/* Mobile Brand Header */}
                    <div className="flex items-center pb-4 mb-3 border-b border-slate-100 lg:hidden">
                        <Link href="/" className="flex items-center gap-2">
                            <img
                                src="/images/rakit-mark.png"
                                alt="RAKIT CAMPUS"
                                className="size-7 object-contain"
                            />
                            <span className="font-black text-base text-slate-900 tracking-tight">
                                RAKIT CAMPUS
                            </span>
                        </Link>
                    </div>

                    {/* Form Header (Clean Typographic) */}
                    <div className="mb-4 sm:mb-5 text-left">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Buat akun mahasiswa
                        </h2>
                    </div>

                    {/* Stepper Kapsul (Segmented Pill Stepper) */}
                    <div className="bg-slate-100/90 border border-slate-200/60 p-1 rounded-xl flex items-center mb-4 select-none">
                        {/* Step 1: Active Pill */}
                        <div className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 bg-white rounded-lg shadow-2xs border border-slate-200/50">
                            <span className="size-5 rounded-full bg-blue-600 text-white text-[10.5px] font-extrabold flex items-center justify-center">
                                1
                            </span>
                            <span className="text-xs font-bold text-slate-900 tracking-tight">
                                Akun Mahasiswa
                            </span>
                        </div>

                        {/* Step 2: Inactive Pill */}
                        <div className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 text-slate-400">
                            <span className="size-5 rounded-full bg-slate-200/80 text-slate-500 text-[10.5px] font-semibold flex items-center justify-center">
                                2
                            </span>
                            <span className="text-xs font-medium text-slate-500 tracking-tight">
                                Lengkapi Profil
                            </span>
                        </div>
                    </div>

                    {/* Form Inputs (Pure Light Theme - Clean White Backgrounds & Spacious Inputs) */}
                    <form className="flex flex-col gap-2.5 sm:gap-3" onSubmit={submit}>
                        {/* Nama Lengkap */}
                        <div className="space-y-1 text-left">
                            <label htmlFor="name" className="text-xs sm:text-sm font-semibold text-slate-700">
                                Nama lengkap
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <User className="size-4" />
                                </div>
                                <input
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
                                    className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 sm:py-2.5 text-base sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60 shadow-2xs"
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

                        {/* Email Kampus */}
                        <div className="space-y-1 text-left">
                            <label htmlFor="email" className="text-xs sm:text-sm font-semibold text-slate-700">
                                Email kampus
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Mail className="size-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    disabled={processing}
                                    placeholder="nama@student.polindra.ac.id"
                                    className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 sm:py-2.5 text-base sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60 shadow-2xs"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Kata Sandi */}
                        <div className="space-y-1 text-left">
                            <label htmlFor="password" className="text-xs sm:text-sm font-semibold text-slate-700">
                                Kata sandi
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="size-4" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    disabled={processing}
                                    placeholder="Minimal 8 karakter"
                                    className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl pl-10 pr-10 py-3 sm:py-2.5 text-base sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60 shadow-2xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Konfirmasi Kata Sandi */}
                        <div className="space-y-1 text-left">
                            <label htmlFor="password_confirmation" className="text-xs sm:text-sm font-semibold text-slate-700">
                                Konfirmasi kata sandi
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="size-4" />
                                </div>
                                <input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    disabled={processing}
                                    placeholder="Ulangi kata sandi"
                                    className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl pl-10 pr-10 py-3 sm:py-2.5 text-base sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60 shadow-2xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            <InputError message={errors.password_confirmation} />
                        </div>

                        {/* Terms & Conditions Checkbox */}
                        <div className="flex items-start gap-2 pt-0.5 text-left">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedTerms}
                                onChange={(e) => setAgreedTerms(e.target.checked)}
                                className="size-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label
                                htmlFor="terms"
                                className="text-xs sm:text-sm leading-tight text-slate-600 select-none cursor-pointer"
                            >
                                Saya menyetujui{' '}
                                <a href="#" className="font-medium text-blue-600 hover:underline">
                                    Ketentuan Penggunaan
                                </a>{' '}
                                dan{' '}
                                <a href="#" className="font-medium text-blue-600 hover:underline">
                                    Kebijakan Privasi
                                </a>
                            </label>
                        </div>

                        {/* Primary Submit Button */}
                        <button
                            type="submit"
                            disabled={processing || !agreedTerms}
                            tabIndex={5}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-3 text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-1"
                        >
                            {processing ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <span>Daftar & Lanjutkan</span>
                            )}
                        </button>
                    </form>

                    {/* Divider ATAU */}
                    <div className="relative my-3 sm:my-3.5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400">
                                ATAU
                            </span>
                        </div>
                    </div>

                    {/* Google OAuth Register Button */}
                    <div>
                        <a
                            href="/auth/google"
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl py-3 sm:py-2.5 px-3.5 text-xs sm:text-sm font-semibold shadow-2xs transition-all flex items-center justify-center gap-2.5 hover:border-slate-300"
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
                            <span>Daftar dengan Google</span>
                        </a>
                    </div>

                    {/* Link to Login */}
                    <div className="text-slate-500 text-center text-xs sm:text-sm mt-3.5 sm:mt-4">
                        Sudah punya akun?{' '}
                        <Link
                            href={route('login')}
                            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                            tabIndex={6}
                        >
                            Masuk di sini
                        </Link>
                    </div>

                    {/* Flash Alert Messages */}
                    {flash?.warning && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-center text-xs font-semibold text-amber-800 rounded-xl">
                            {flash.warning}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mt-2 p-2 bg-rose-50 border border-rose-200 text-center text-xs font-semibold text-rose-800 rounded-xl">
                            {flash.error}
                        </div>
                    )}
                    {flash?.success && (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 text-center text-xs font-semibold text-emerald-800 rounded-xl">
                            {flash.success}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
