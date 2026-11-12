import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Award,
    Briefcase,
    Calendar,
    Camera,
    CheckCircle2,
    Clock,
    Code2,
    ExternalLink,
    Github,
    Globe,
    GraduationCap,
    Linkedin,
    Plus,
    Save,
    ShieldCheck,
    Sparkles,
    Trash2,
    User,
    Users,
    X,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
    isMandatory?: boolean;
    profile: {
        id: number;
        slug?: string | null;
        department: string | null;
        study_program: string | null;
        semester: number | null;
        bio: string | null;
        github_url: string | null;
        linkedin_url: string | null;
        portfolio_url: string | null;
        interests: string[];
        preferred_roles: string[];
        availability_hours: number | null;
        availability_note: string | null;
        portfolio_public: boolean;
        open_to_invites: boolean;
        skills: Array<{ id: number; name: string; type: string; proficiency: number }>;
        completion?: { percent: number; missing: string[] };
    } | null;
    allSkills: Array<{ id: number; name: string; type: string }>;
    campus?: string;
    nim?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan Profil',
        href: '/settings/profile',
    },
];

const popularSkillSuggestions = [
    'Flutter',
    'Laravel',
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Node.js',
    'Python',
    'UI/UX Design',
    'Figma',
    'PostgreSQL',
    'FastAPI',
    'Git',
];

export default function Profile({
    mustVerifyEmail,
    status,
    isMandatory = false,
    profile,
    allSkills = [],
    campus,
    nim,
}: Props) {
    const { auth } = usePage<SharedData>().props;

    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillProf, setNewSkillProf] = useState(3);
    const [newInterest, setNewInterest] = useState('');
    const [newRole, setNewRole] = useState('');

    const initialNim = nim && !nim.startsWith('REG-') ? nim : '';

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
        student_number: initialNim,
        department: profile?.department || '',
        study_program: profile?.study_program || '',
        semester: profile?.semester || 4,
        bio: profile?.bio || '',
        github_url: profile?.github_url || '',
        linkedin_url: profile?.linkedin_url || '',
        portfolio_url: profile?.portfolio_url || '',
        interests: profile?.interests || ['Mobile App', 'IoT', 'Smart Agriculture'],
        preferred_roles: profile?.preferred_roles || ['Project Leader', 'IoT Engineer'],
        availability_hours: profile?.availability_hours || 15,
        availability_note: profile?.availability_note || 'Tersedia sore hari dan akhir pekan',
        portfolio_public: profile?.portfolio_public ?? true,
        open_to_invites: profile?.open_to_invites ?? true,
        skills: profile?.skills || [],
        redirect_to_dashboard: isMandatory,
    });

    const handleAddSkill = (skillNameToAdd?: string, prof?: number) => {
        const nameToAdd = (skillNameToAdd || newSkillName).trim();
        if (!nameToAdd) return;

        const existing = data.skills.find(
            (s) => s.name.toLowerCase() === nameToAdd.toLowerCase()
        );
        if (existing) {
            alert(`Keahlian "${nameToAdd}" sudah ada di profil Anda.`);
            return;
        }

        const skillObj = allSkills.find(
            (s) => s.name.toLowerCase() === nameToAdd.toLowerCase()
        );

        setData('skills', [
            ...data.skills,
            {
                id: skillObj?.id || 0,
                name: nameToAdd,
                type: 'technical',
                proficiency: prof || newSkillProf,
            },
        ]);
        setNewSkillName('');
    };

    const handleRemoveSkill = (skillName: string) => {
        setData(
            'skills',
            data.skills.filter((s) => s.name !== skillName)
        );
    };

    const handleAddInterest = () => {
        if (!newInterest.trim()) return;
        if (!data.interests.includes(newInterest.trim())) {
            setData('interests', [...data.interests, newInterest.trim()]);
        }
        setNewInterest('');
    };

    const handleRemoveInterest = (item: string) => {
        setData(
            'interests',
            data.interests.filter((i) => i !== item)
        );
    };

    const handleAddRole = () => {
        if (!newRole.trim()) return;
        if (!data.preferred_roles.includes(newRole.trim())) {
            setData('preferred_roles', [...data.preferred_roles, newRole.trim()]);
        }
        setNewRole('');
    };

    const handleRemoveRole = (item: string) => {
        setData(
            'preferred_roles',
            data.preferred_roles.filter((r) => r !== item)
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    const completionPercent = profile?.completion?.percent ?? 85;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Profil Mahasiswa — RAKIT Campus" />

            <SettingsLayout>
                <div className="flex flex-col gap-6 w-full">
                    {/* Onboarding Notice for Incomplete Profile */}
                    {isMandatory && (
                        <div className="rounded-3xl bg-amber-50/90 border border-amber-300/80 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950">
                            <div className="flex items-start gap-3.5">
                                <div className="p-2.5 rounded-2xl bg-amber-200/70 text-amber-900 shrink-0 mt-0.5">
                                    <Sparkles className="size-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-amber-950">
                                            Langkah Awal: Lengkapi Data Profil Mahasiswa
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 uppercase">
                                            Wajib
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-2xl">
                                        Selamat datang di RAKIT Campus! Agar kamu bisa bergabung ke perkuliahan dan mendapatkan rekomendasi rekan tim yang keahliannya paling sesuai, silakan isi <strong>Program Studi</strong>, <strong>Ketersediaan Waktu</strong>, dan minimal <strong>2 Keahlian Teknis</strong> di bawah ini (NIM bersifat opsional).
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    document.getElementById('nim-input')?.focus();
                                }}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition"
                            >
                                Mulai Isi Sekarang
                            </button>
                        </div>
                    )}

                    {/* 1. LinkedIn-Style Hero Card with Clean Cover Banner & Overlapping Avatar */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
                        {/* Cover Banner with Geometric Blue Abstract Wallpaper */}
                        <div className="h-40 sm:h-48 w-full bg-[#0B1536] bg-[url('/images/profile-banner-abstract.jpg')] bg-cover bg-center relative">
                            <div className="absolute inset-0 bg-slate-950/25" />
                            <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
                                <Link
                                    href={profile?.slug ? `/p/${encodeURIComponent(profile.slug)}` : '#'}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-semibold shadow-xs backdrop-blur-md transition border border-white/20"
                                >
                                    <ExternalLink className="size-3 text-blue-300" />
                                    <span>Lihat Profil Publik</span>
                                </Link>
                            </div>
                        </div>

                        {/* Content Below Banner with Overlapping Avatar */}
                        <div className="px-6 pb-6 pt-0">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
                                <div className="relative inline-block">
                                    <div className="size-24 sm:size-28 rounded-full border-4 border-white bg-slate-900 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md">
                                        {data.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase() || 'U'}
                                    </div>
                                    <div className="absolute bottom-0 right-0 size-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 shadow-xs cursor-pointer transition" title="Ganti Foto Profil">
                                        <Camera className="size-3.5" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 self-start sm:self-auto py-1">
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Kekuatan Profil
                                        </span>
                                        <div className="text-xs font-bold text-slate-800">
                                            {completionPercent >= 100 ? 'Profil Lengkap' : `${completionPercent}% Menengah`}
                                        </div>
                                    </div>
                                    <div className="size-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-600">
                                        {completionPercent}%
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                                        {data.name}
                                    </h2>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <ShieldCheck className="size-3" />
                                        Mahasiswa Terverifikasi
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium">
                                    {data.study_program || 'Program Studi Mahasiswa'} • Semester {data.semester || 1} • {campus || 'Perguruan Tinggi Indonesia'}
                                </p>
                                {nim && !nim.startsWith('REG-') && (
                                    <p className="text-[11px] font-mono text-slate-400">
                                        NIM: {nim}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Main Bento Form */}
                    <form onSubmit={submit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left Column: Academic & Skills Core (7 Columns on LG) */}
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                {/* Card A: Informasi Akun */}
                                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
                                        <User className="size-4 text-[#2563EB]" />
                                        <h3 className="text-sm font-bold text-neutral-900">
                                            Informasi Identitas & Akun
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="name" className="text-xs font-semibold text-neutral-700">
                                                Nama Lengkap
                                            </Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                                className="rounded-2xl text-xs py-2.5 border-neutral-200/90 focus:ring-2 focus:ring-[#2563EB]"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-xs font-semibold text-neutral-700">
                                                Email Resmi Kampus
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                                className="rounded-2xl text-xs py-2.5 border-neutral-200/90 focus:ring-2 focus:ring-[#2563EB]"
                                            />
                                            <InputError message={errors.email} />
                                        </div>
                                    </div>
                                </div>

                                {/* Card B: Studi & Afiliasi Akademik */}
                                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
                                        <GraduationCap className="size-4 text-[#2563EB]" />
                                        <h3 className="text-sm font-bold text-neutral-900">
                                            Studi & Afiliasi Perkuliahan
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="nim-input" className="text-xs font-semibold text-neutral-700 flex items-center justify-between">
                                                <span>Nomor Induk Mahasiswa (NIM) <span className="text-xs text-slate-400 font-normal">(Opsional)</span></span>
                                            </Label>
                                            <Input
                                                id="nim-input"
                                                value={data.student_number}
                                                onChange={(e) => setData('student_number', e.target.value)}
                                                placeholder="Contoh: 2201001 (Opsional)"
                                                className="rounded-2xl text-xs py-2.5 border-neutral-200/90 focus:ring-2 focus:ring-[#2563EB]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-neutral-700">
                                                Semester Berjalan <span className="text-rose-500">*</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={14}
                                                value={data.semester}
                                                onChange={(e) => setData('semester', parseInt(e.target.value, 10))}
                                                required
                                                className="rounded-2xl text-xs py-2.5 border-neutral-200/90 focus:ring-2 focus:ring-[#2563EB]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-neutral-700">
                                                Jurusan / Departemen <span className="text-rose-500">*</span>
                                            </Label>
                                            <Input
                                                value={data.department}
                                                onChange={(e) => setData('department', e.target.value)}
                                                placeholder="Contoh: Teknik Informatika"
                                                required
                                                className="rounded-2xl text-xs py-2.5 border-neutral-200/90 focus:ring-2 focus:ring-[#2563EB]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-neutral-700">
                                                Program Studi <span className="text-rose-500">*</span>
                                            </Label>
                                            <select
                                                value={data.study_program}
                                                onChange={(e) => setData('study_program', e.target.value)}
                                                required
                                                className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] outline-none"
                                            >
                                                <option value="">-- Pilih Program Studi --</option>
                                                <option value="Teknik Informatika">D4 Teknik Informatika</option>
                                                <option value="Rekayasa Perangkat Lunak">D4 Rekayasa Perangkat Lunak</option>
                                                <option value="Sistem Informasi Kota Cerdas">D4 Sistem Informasi Kota Cerdas</option>
                                                <option value="Teknik Mesin">D3 Teknik Mesin</option>
                                                <option value="Teknik Pendingin">D3 Teknik Pendingin</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-neutral-700">
                                            Biografi & Minat Penelitian
                                        </Label>
                                        <textarea
                                            value={data.bio}
                                            onChange={(e) => setData('bio', e.target.value)}
                                            rows={3}
                                            placeholder="Deskripsikan latar belakang teknis Anda, teknologi yang sering Anda gunakan, dan sasaran proyek kolaborasi..."
                                            className="w-full p-3.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] outline-none leading-relaxed"
                                        />
                                    </div>
                                </div>

                                {/* Card C: Keahlian Teknis (Matching Engine Source) */}
                                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                                        <div className="flex items-center gap-2">
                                            <Code2 className="size-4 text-[#2563EB]" />
                                            <div>
                                                <h3 className="text-sm font-bold text-neutral-900">
                                                    Keahlian Teknis & Soft Skills
                                                </h3>
                                                <p className="text-[11px] text-neutral-500">
                                                    Sumber utama rekomendasi tim dan kecocokan algoritma Smart Matching
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-[#2563EB] px-2.5 py-0.5 rounded-full bg-[#EFF6FF]">
                                            {data.skills.length} Keahlian
                                        </span>
                                    </div>

                                    {/* Input Row for New Skill */}
                                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
                                        <Input
                                            value={newSkillName}
                                            onChange={(e) => setNewSkillName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddSkill();
                                                }
                                            }}
                                            placeholder="Ketik keahlian (misal: Flutter, Laravel, Figma, IoT)..."
                                            className="rounded-2xl text-xs flex-1 py-2.5 border-neutral-200/90"
                                        />
                                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                            <select
                                                value={newSkillProf}
                                                onChange={(e) => setNewSkillProf(parseInt(e.target.value, 10))}
                                                className="px-3 py-2 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 outline-none flex-1 sm:flex-initial"
                                            >
                                                <option value={1}>Lv 1 (Dasar)</option>
                                                <option value={2}>Lv 2 (Pemula)</option>
                                                <option value={3}>Lv 3 (Menengah)</option>
                                                <option value={4}>Lv 4 (Mahir)</option>
                                                <option value={5}>Lv 5 (Ahli)</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleAddSkill()}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl text-xs font-bold shadow-xs transition"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>Tambah</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Suggestions Chips */}
                                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                                        <span className="text-[11px] text-neutral-400 font-medium">Saran Cepat:</span>
                                        {popularSkillSuggestions.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => handleAddSkill(s, 3)}
                                                className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-100 hover:bg-[#EFF6FF] hover:text-[#2563EB] text-neutral-600 font-medium transition"
                                            >
                                                + {s}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Active Skills List */}
                                    <div className="p-4 rounded-2xl bg-[#F8F6FE]/60 border border-purple-100/70 min-h-[100px] flex flex-wrap gap-2 items-start">
                                        {data.skills.map((s) => (
                                            <span
                                                key={s.name}
                                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-200/80 text-xs text-neutral-800 shadow-2xs font-medium group hover:border-[#2563EB] transition"
                                            >
                                                <span className="font-semibold text-neutral-900">{s.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#EFF6FF] text-[#2563EB] font-extrabold">
                                                    Lv {s.proficiency}/5
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(s.name)}
                                                    className="text-neutral-400 hover:text-rose-600 transition"
                                                    title="Hapus keahlian"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </span>
                                        ))}

                                        {data.skills.length === 0 && (
                                            <p className="text-xs text-neutral-400 italic py-2">
                                                Belum ada keahlian ditambahkan. Ketik atau pilih dari saran cepat di atas.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Roles, Availability, Links, Privacy (5 Columns on LG) */}
                            <div className="lg:col-span-5 flex flex-col gap-6">
                                {/* Card D: Minat & Peran yang Diminati */}
                                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
                                        <Briefcase className="size-4 text-[#2563EB]" />
                                        <h3 className="text-sm font-bold text-neutral-900">
                                            Peran Tim & Topik Proyek
                                        </h3>
                                    </div>

                                    {/* Preferred Roles */}
                                    <div className="mb-5">
                                        <Label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                                            Peran yang Diminati dalam Tim
                                        </Label>
                                        <div className="flex gap-2 mb-2">
                                            <Input
                                                value={newRole}
                                                onChange={(e) => setNewRole(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddRole();
                                                    }
                                                }}
                                                placeholder="Contoh: Mobile Dev, UI Designer"
                                                className="rounded-2xl text-xs py-2 border-neutral-200/90"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddRole}
                                                className="px-3.5 py-2 bg-[#181135] hover:bg-neutral-900 text-white rounded-2xl text-xs font-semibold transition"
                                            >
                                                Tambah
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {data.preferred_roles.map((r) => (
                                                <span
                                                    key={r}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-[#2563EB] border border-purple-200/60 rounded-full text-xs font-medium"
                                                >
                                                    {r}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRole(r)}
                                                        className="text-purple-400 hover:text-rose-600"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Topic Interests */}
                                    <div>
                                        <Label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                                            Topik & Bidang Minat
                                        </Label>
                                        <div className="flex gap-2 mb-2">
                                            <Input
                                                value={newInterest}
                                                onChange={(e) => setNewInterest(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddInterest();
                                                    }
                                                }}
                                                placeholder="Contoh: Smart Agriculture, AI"
                                                className="rounded-2xl text-xs py-2 border-neutral-200/90"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddInterest}
                                                className="px-3.5 py-2 bg-[#181135] hover:bg-neutral-900 text-white rounded-2xl text-xs font-semibold transition"
                                            >
                                                Tambah
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {data.interests.map((i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-medium"
                                                >
                                                    {i}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveInterest(i)}
                                                        className="text-neutral-400 hover:text-rose-600"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Card E: Ketersediaan Jam Kerja */}
                                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
                                        <Clock className="size-4 text-[#2563EB]" />
                                        <div>
                                            <h3 className="text-sm font-bold text-neutral-900">
                                                Ketersediaan Jam Kerja Mingguan
                                            </h3>
                                            <p className="text-[11px] text-neutral-500">
                                                Bobot 20% pada perhitungan kompatibilitas Smart Matching
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <Label className="font-semibold text-neutral-700">
                                                    Komitmen Jam / Minggu
                                                </Label>
                                                <span className="font-bold text-[#2563EB]">
                                                    {data.availability_hours || 0} Jam / Minggu
                                                </span>
                                            </div>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={80}
                                                value={data.availability_hours}
                                                onChange={(e) =>
                                                    setData('availability_hours', parseInt(e.target.value, 10))
                                                }
                                                className="rounded-2xl text-xs py-2.5 border-neutral-200/90"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-neutral-700">
                                                Catatan Waktu Kerja
                                            </Label>
                                            <Input
                                                value={data.availability_note}
                                                onChange={(e) => setData('availability_note', e.target.value)}
                                                placeholder="Contoh: Tersedia malam hari & akhir pekan"
                                                className="rounded-2xl text-xs py-2.5 border-neutral-200/90"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Card F: Tautan Eksternal & Portofolio */}
                                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
                                        <Globe className="size-4 text-[#2563EB]" />
                                        <h3 className="text-sm font-bold text-neutral-900">
                                            Tautan Karya & Media Sosial
                                        </h3>
                                    </div>

                                    <div className="space-y-3.5">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                                                <Github className="size-3.5" />
                                                <span>Profil GitHub</span>
                                            </Label>
                                            <Input
                                                value={data.github_url}
                                                onChange={(e) => setData('github_url', e.target.value)}
                                                placeholder="https://github.com/username"
                                                className="rounded-2xl text-xs py-2 border-neutral-200/90"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                                                <Linkedin className="size-3.5 text-blue-600" />
                                                <span>Profil LinkedIn</span>
                                            </Label>
                                            <Input
                                                value={data.linkedin_url}
                                                onChange={(e) => setData('linkedin_url', e.target.value)}
                                                placeholder="https://linkedin.com/in/username"
                                                className="rounded-2xl text-xs py-2 border-neutral-200/90"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                                                <ExternalLink className="size-3.5" />
                                                <span>Website / Portofolio Pribadi</span>
                                            </Label>
                                            <Input
                                                value={data.portfolio_url}
                                                onChange={(e) => setData('portfolio_url', e.target.value)}
                                                placeholder="https://myportfolio.com"
                                                className="rounded-2xl text-xs py-2 border-neutral-200/90"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Card G: Privasi & Visibilitas Publik */}
                                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 mb-2 pb-3 border-b border-neutral-100">
                                        <ShieldCheck className="size-4 text-[#2563EB]" />
                                        <h3 className="text-sm font-bold text-neutral-900">
                                            Privasi & Visibilitas Publik
                                        </h3>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-bold text-neutral-800 block">
                                                Portofolio Publik Terbuka
                                            </span>
                                            <span className="text-[11px] text-neutral-500">
                                                Izinkan portofolio Anda diakses publik (`/p/slug`)
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={data.portfolio_public}
                                            onChange={(e) => setData('portfolio_public', e.target.checked)}
                                            className="size-4 rounded text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                                        <div>
                                            <span className="text-xs font-bold text-neutral-800 block">
                                                Buka untuk Undangan Kolaborasi
                                            </span>
                                            <span className="text-[11px] text-neutral-500">
                                                Project Leader dapat mengirim undangan langsung
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={data.open_to_invites}
                                            onChange={(e) => setData('open_to_invites', e.target.checked)}
                                            className="size-4 rounded text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Sticky Action Save Bar */}
                        <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                                        <CheckCircle2 className="size-4 shrink-0" />
                                        Data profil & keahlian berhasil diperbarui dan disinkronkan ke AI Matching!
                                    </p>
                                </Transition>
                                {!recentlySuccessful && (
                                    <p className="text-xs text-neutral-500">
                                        Pastikan seluruh isian sudah sesuai sebelum menyimpan perubahan.
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50 shrink-0 w-full sm:w-auto"
                            >
                                <Save className="size-4" />
                                <span>{processing ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
