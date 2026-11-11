import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Compass,
    Eye,
    EyeOff,
    GraduationCap,
    LoaderCircle,
    Lock,
    Mail,
    Plus,
    Sparkles,
    User,
    UserPlus,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';

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
        <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative font-sans overflow-x-hidden">
            <Head>
                <title>Daftar Akun Mahasiswa — RAKIT Campus</title>
            </Head>

            {/* Global Light Theme Lock & Zero Horizontal Scroll */}
            <style>{`
                html, body {
                    background-color: #F8FAFC !important;
                    overflow-x: hidden !important;
                    margin: 0;
                    padding: 0;
                }
            `}</style>

            {/* Distinct Faint Blue Polka Dot Pattern (Fades Out Towards Edges) */}
            <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #93C5FD 1.5px, transparent 0)',
                    backgroundSize: '24px 24px',
                    WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, #000 30%, transparent 85%)',
                    maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, #000 30%, transparent 85%)',
                }}
            />

            {/* Ambient Pastel Lighting (Contained within viewport width) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/60 via-sky-50/30 to-transparent rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4" />
                <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-gradient-to-tl from-purple-100/40 via-rose-50/20 to-transparent rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
            </div>

            {/* Top Navigation Bar */}
            <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img
                            src="/images/rakit-mark.png"
                            alt="RAKIT"
                            className="size-8 object-contain transition-transform group-hover:scale-105"
                        />
                        <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                            RAKIT
                        </span>
                    </Link>

                    <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                    <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs">
                        <GraduationCap className="size-3.5 text-blue-600" />
                        <span>Platform Kolaborasi Kampus</span>
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Sistem Aktif 2026</span>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14 flex-1 flex items-center justify-center">
                <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 xl:gap-20 relative">
                    
                    {/* Left Column: Hero Headline & Puzzle Card */}
                    <div className="w-full lg:w-[500px] xl:w-[520px] flex flex-col shrink-0 relative">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs w-fit mb-3.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>Mulai Kolaborasi Kampus</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-slate-900 leading-[1.16]">
                            Mulai dari satu <br />
                            keping:{' '}
                            <span className="text-blue-600 bg-blue-50/90 px-3 py-0.5 rounded-xl border border-blue-200/80 inline-block">
                                kamu.
                            </span>
                        </h1>

                        <p className="text-sm sm:text-base text-slate-600 mt-3.5 leading-relaxed max-w-lg">
                            Lengkapi profilmu, lalu rakit tim perkuliahan dan kompetisi dengan keahlian yang saling melengkapi.
                        </p>

                        {/* Interactive Puzzle Visual Card */}
                        <div className="relative mt-7 w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
                            {/* Card Top Pill Badge */}
                            <div className="flex justify-end mb-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-[11px] font-semibold text-white shadow-xs">
                                    <span className="size-1.5 rounded-full bg-white animate-pulse" />
                                    Kepingan Tim Terbuka
                                </span>
                            </div>

                            {/* 2x3 Puzzle Board Container */}
                            <div className="bg-[#FFFDF7] border-2 border-dashed border-amber-300 rounded-2xl p-4 sm:p-5 relative">
                                <div className="grid grid-cols-3 gap-3 sm:gap-3.5">
                                    {/* Piece 1: UI/UX */}
                                    <div className="border border-dashed border-amber-300 bg-white/90 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                                        <Plus className="size-4 text-amber-500 mb-1" />
                                        <span className="font-bold text-xs sm:text-sm text-amber-950">UI/UX</span>
                                        <span className="text-[10px] text-amber-700/80 mt-0.5">Slot terbuka</span>
                                    </div>

                                    {/* Piece 2: Kamu (Hero Center Piece with Interlocking Tabs) */}
                                    <div className="relative bg-gradient-to-b from-blue-600 to-blue-700 text-white rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-md shadow-blue-600/30 ring-2 ring-blue-400/50 scale-[1.03] z-10">
                                        <div className="size-6 rounded-full bg-white/20 flex items-center justify-center mb-1">
                                            <User className="size-3.5 text-white" />
                                        </div>
                                        <span className="font-extrabold text-xs sm:text-sm text-white">Kamu</span>
                                        <span className="text-[10px] text-blue-100 font-medium mt-0.5">Profil kamu</span>
                                        {/* Puzzle Interlocking Tabs */}
                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-blue-600 border border-blue-400 hidden sm:block" />
                                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-blue-600 border border-blue-400 hidden sm:block" />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 size-3.5 rounded-full bg-blue-600 border border-blue-400 hidden sm:block" />
                                    </div>

                                    {/* Piece 3: Frontend */}
                                    <div className="border border-dashed border-amber-300 bg-white/90 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                                        <Plus className="size-4 text-amber-500 mb-1" />
                                        <span className="font-bold text-xs sm:text-sm text-amber-950">Frontend</span>
                                        <span className="text-[10px] text-amber-700/80 mt-0.5">Slot terbuka</span>
                                    </div>

                                    {/* Piece 4: Database */}
                                    <div className="border border-dashed border-amber-300 bg-white/90 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                                        <Plus className="size-4 text-amber-500 mb-1" />
                                        <span className="font-bold text-xs sm:text-sm text-amber-950">Database</span>
                                        <span className="text-[10px] text-amber-700/80 mt-0.5">Slot terbuka</span>
                                    </div>

                                    {/* Piece 5: Backend */}
                                    <div className="border border-dashed border-amber-300 bg-white/90 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                                        <Plus className="size-4 text-amber-500 mb-1" />
                                        <span className="font-bold text-xs sm:text-sm text-amber-950">Backend</span>
                                        <span className="text-[10px] text-amber-700/80 mt-0.5">Slot terbuka</span>
                                    </div>

                                    {/* Piece 6: Testing */}
                                    <div className="border border-dashed border-amber-300 bg-white/90 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                                        <Plus className="size-4 text-amber-500 mb-1" />
                                        <span className="font-bold text-xs sm:text-sm text-amber-950">Testing</span>
                                        <span className="text-[10px] text-amber-700/80 mt-0.5">Slot terbuka</span>
                                    </div>
                                </div>

                                {/* Progress: Cakupan keahlian 1 dari 6 */}
                                <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-center gap-2 text-xs font-medium text-slate-700">
                                    <span>Cakupan keahlian 1 dari 6</span>
                                    <div className="flex items-center gap-1 ml-1">
                                        <span className="h-2 w-6 rounded-full bg-blue-600" />
                                        <span className="h-2 w-3 rounded-full bg-amber-200" />
                                        <span className="h-2 w-3 rounded-full bg-amber-200" />
                                        <span className="h-2 w-3 rounded-full bg-amber-200" />
                                        <span className="h-2 w-3 rounded-full bg-amber-200" />
                                        <span className="h-2 w-3 rounded-full bg-amber-200" />
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
                                <div className="inline-flex items-center gap-1.5 font-medium">
                                    <Compass className="size-3.5 text-blue-600" />
                                    <span>Algoritma Komposisi Seimbang</span>
                                </div>
                                <div className="font-semibold text-blue-600">
                                    Status: Siap Melengkapi
                                </div>
                            </div>

                            {/* Connector Line Matching Reference Exactly */}
                            <div className="hidden lg:flex items-center absolute -right-10 lg:-right-16 xl:-right-20 top-1/2 -translate-y-1/2 w-10 lg:w-16 xl:w-20 z-20 pointer-events-none">
                                {/* Subtle Dashed Connector Line */}
                                <div className="w-full h-0 border-t-2 border-dashed border-blue-300 relative flex items-center justify-center">
                                    {/* Concentric Circle: Light Blue Ring with Solid Blue Dot inside */}
                                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 size-6 rounded-full border-2 border-blue-300 bg-white flex items-center justify-center shadow-2xs">
                                        <div className="size-2.5 rounded-full bg-blue-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Register Form Card (Pure Light Theme) */}
                    <div className="w-full lg:w-[420px] xl:w-[440px] shrink-0 relative">
                        <div className="relative w-full bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-8 shadow-xl shadow-slate-200/50 overflow-hidden">
                            {/* Blue Top Accent Line */}
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

                            {/* Card Header */}
                            <div className="flex items-center gap-3.5 mb-5">
                                <div className="size-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <UserPlus className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                                        Buat akun mahasiswa
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Hanya butuh satu menit.
                                    </p>
                                </div>
                            </div>

                            {/* Stepper (Sesuai Alur Nyata: 1. Buat Akun -> 2. Lengkapi Profil) */}
                            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="size-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                                        1
                                    </span>
                                    <span className="text-xs font-bold text-blue-600">
                                        Buat akun
                                    </span>
                                </div>

                                <div className="h-px flex-1 bg-slate-200 mx-3 border-t border-dashed border-slate-300" />

                                <div className="flex items-center gap-2">
                                    <span className="size-5 rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-[11px] font-medium flex items-center justify-center">
                                        2
                                    </span>
                                    <span className="text-xs font-medium text-slate-400">
                                        Lengkapi profil
                                    </span>
                                </div>
                            </div>

                            {/* Form Inputs (Pure Light Theme - Clean White Backgrounds & Spacious Inputs) */}
                            <form className="flex flex-col gap-3.5" onSubmit={submit}>
                                {/* Nama Lengkap */}
                                <div className="space-y-1 text-left">
                                    <label htmlFor="name" className="text-xs font-semibold text-slate-700">
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
                                            className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60"
                                        />
                                    </div>
                                    <InputError message={errors.name} />
                                </div>

                                {/* Email Kampus */}
                                <div className="space-y-1 text-left">
                                    <label htmlFor="email" className="text-xs font-semibold text-slate-700">
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
                                            className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60"
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                {/* Kata Sandi */}
                                <div className="space-y-1 text-left">
                                    <label htmlFor="password" className="text-xs font-semibold text-slate-700">
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
                                            className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Konfirmasi Kata Sandi */}
                                <div className="space-y-1 text-left">
                                    <label htmlFor="password_confirmation" className="text-xs font-semibold text-slate-700">
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
                                            className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password_confirmation} />
                                </div>

                                {/* Terms & Conditions Checkbox */}
                                <div className="flex items-start gap-2 pt-1 text-left">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={agreedTerms}
                                        onChange={(e) => setAgreedTerms(e.target.checked)}
                                        className="size-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label
                                        htmlFor="terms"
                                        className="text-xs leading-snug text-slate-600 select-none cursor-pointer"
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
                                        <>
                                            <span>Daftar & Lanjutkan</span>
                                            <ArrowRight className="size-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Divider ATAU */}
                            <div className="relative my-4">
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
                                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 hover:border-slate-300"
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
                            <div className="text-slate-500 text-center text-xs mt-4">
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
                                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 text-center text-xs font-semibold text-amber-800 rounded-xl">
                                    {flash.warning}
                                </div>
                            )}
                            {flash?.error && (
                                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-center text-xs font-semibold text-rose-800 rounded-xl">
                                    {flash.error}
                                </div>
                            )}
                            {flash?.success && (
                                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-center text-xs font-semibold text-emerald-800 rounded-xl">
                                    {flash.success}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="relative z-10 w-full text-center py-5 text-xs text-slate-400 shrink-0">
                <p>&copy; {new Date().getFullYear()} RAKIT Campus. All rights reserved.</p>
            </footer>
        </div>
    );
}
