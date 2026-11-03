import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Award, CheckCircle2, Globe, Plus, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
    profile: {
        id: number;
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

export default function Profile({ mustVerifyEmail, status, profile, allSkills = [], campus, nim }: Props) {
    const { auth } = usePage<SharedData>().props;

    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillProf, setNewSkillProf] = useState(3);
    const [newInterest, setNewInterest] = useState('');
    const [newRole, setNewRole] = useState('');

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
        department: profile?.department || 'Teknik Informatika',
        study_program: profile?.study_program || 'Teknik Informatika',
        semester: profile?.semester || 5,
        bio: profile?.bio || '',
        github_url: profile?.github_url || '',
        linkedin_url: profile?.linkedin_url || '',
        portfolio_url: profile?.portfolio_url || '',
        interests: profile?.interests || ['Mobile App', 'IoT', 'Smart Agriculture'],
        preferred_roles: profile?.preferred_roles || ['Project Leader', 'IoT Engineer'],
        availability_hours: profile?.availability_hours || 20,
        availability_note: profile?.availability_note || 'Tersedia sore hari dan akhir pekan',
        portfolio_public: profile?.portfolio_public ?? true,
        open_to_invites: profile?.open_to_invites ?? true,
        skills: profile?.skills || [],
    });

    const handleAddSkill = () => {
        if (!newSkillName.trim()) return;
        const existing = data.skills.find((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
        if (existing) {
            alert('Keahlian ini sudah ditambahkan.');
            return;
        }

        const skillObj = allSkills.find((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
        setData('skills', [
            ...data.skills,
            {
                id: skillObj?.id || 0,
                name: newSkillName.trim(),
                type: 'technical',
                proficiency: newSkillProf,
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Profil Mahasiswa" />

            <SettingsLayout>
                <div className="space-y-8 max-w-4xl">
                    {/* Header with Completion Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-purple-50/80 to-white border border-purple-200/80 rounded-2xl shadow-2xs">
                        <div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="size-4 text-[#5448EE]" />
                                <h2 className="text-base font-bold text-neutral-900">Profil & Rekam Akademik Mahasiswa</h2>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                {campus || 'Politeknik Negeri Indramayu'} {nim && `• NIM: ${nim}`}
                            </p>
                        </div>

                        {profile?.completion && (
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <span className="text-[11px] text-neutral-500 block">Kelengkapan Profil</span>
                                    <span className="text-sm font-bold text-[#5448EE]">{profile.completion.percent}%</span>
                                </div>
                                <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-xs text-[#5448EE]">
                                    {profile.completion.percent}%
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {/* 1. Basic Account Info */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                            <HeadingSmall title="Informasi Akun" description="Nama lengkap dan email resmi kampus Anda" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name" className="text-xs font-semibold">Nama Lengkap</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        className="rounded-xl text-xs py-2"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="email" className="text-xs font-semibold">Email Kampus</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        className="rounded-xl text-xs py-2"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                            </div>
                        </div>

                        {/* 2. Academic Program & Study Information */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                            <HeadingSmall title="Studi & Afiliasi Kampus" description="Informasi program studi untuk kalkulasi tenant dan kecocokan tim" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-semibold">Jurusan / Departemen</Label>
                                    <Input
                                        value={data.department}
                                        onChange={(e) => setData('department', e.target.value)}
                                        placeholder="Contoh: Teknik Informatika"
                                        className="rounded-xl text-xs py-2"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-semibold">Program Studi</Label>
                                    <select
                                        value={data.study_program}
                                        onChange={(e) => setData('study_program', e.target.value)}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE]"
                                    >
                                        <option value="Teknik Informatika">D4 Teknik Informatika</option>
                                        <option value="Rekayasa Perangkat Lunak">D4 Rekayasa Perangkat Lunak</option>
                                        <option value="Sistem Informasi Kota Cerdas">D4 Sistem Informasi Kota Cerdas</option>
                                        <option value="Teknik Mesin">D3 Teknik Mesin</option>
                                        <option value="Teknik Pendingin">D3 Teknik Pendingin</option>
                                    </select>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-semibold">Semester Saat Ini</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={14}
                                        value={data.semester}
                                        onChange={(e) => setData('semester', parseInt(e.target.value, 10))}
                                        className="rounded-xl text-xs py-2"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs font-semibold">Biografi & Minat Penelitian</Label>
                                <textarea
                                    value={data.bio}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    rows={3}
                                    placeholder="Ceritakan latar belakang teknis, fokus keahlian, dan tujuan kolaborasi proyek Anda..."
                                    className="w-full p-3 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#5448EE] focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* 3. Skills Management (Smart Matching Core) */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                            <div>
                                <HeadingSmall title="Keahlian Teknis & Soft Skills" description="Sumber data utama untuk algoritma kecocokan (Matching Engine)" />
                            </div>

                            {/* Add Skill Row */}
                            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                                <Input
                                    value={newSkillName}
                                    onChange={(e) => setNewSkillName(e.target.value)}
                                    placeholder="Ketik keahlian (contoh: Flutter, Laravel, IoT, Figma)"
                                    className="rounded-xl text-xs flex-1"
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                    <select
                                        value={newSkillProf}
                                        onChange={(e) => setNewSkillProf(parseInt(e.target.value, 10))}
                                        className="px-3 py-2 border border-neutral-200 rounded-xl text-xs text-neutral-900"
                                    >
                                        <option value={1}>Tingkat 1 (Pemula)</option>
                                        <option value={2}>Tingkat 2 (Dasar)</option>
                                        <option value={3}>Tingkat 3 (Menengah)</option>
                                        <option value={4}>Tingkat 4 (Mahir)</option>
                                        <option value={5}>Tingkat 5 (Ahli)</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddSkill}
                                        className="inline-flex items-center gap-1 px-4 py-2 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-xl text-xs font-semibold transition"
                                    >
                                        <Plus className="size-3.5" />
                                        Tambah
                                    </button>
                                </div>
                            </div>

                            {/* Active Skills List */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {data.skills.map((s) => (
                                    <span
                                        key={s.name}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-xs text-purple-900 font-medium"
                                    >
                                        <span>{s.name}</span>
                                        <span className="text-[10px] px-1.5 py-0.2 bg-purple-200 text-purple-800 rounded font-bold">
                                            Lv {s.proficiency}/5
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(s.name)}
                                            className="text-purple-400 hover:text-red-600 transition"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 4. Interests & Preferred Roles */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                            <HeadingSmall title="Minat & Peran yang Diminati" description="Bantu ketua proyek menemukan Anda untuk posisi yang sesuai" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Preferred Roles */}
                                <div>
                                    <Label className="text-xs font-semibold block mb-1">Peran dalam Tim</Label>
                                    <div className="flex gap-2 mb-2">
                                        <Input
                                            value={newRole}
                                            onChange={(e) => setNewRole(e.target.value)}
                                            placeholder="Contoh: Mobile Developer"
                                            className="rounded-xl text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddRole}
                                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium"
                                        >
                                            Tambah
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.preferred_roles.map((r) => (
                                            <span key={r} className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 rounded-lg text-xs text-neutral-800">
                                                {r}
                                                <button type="button" onClick={() => handleRemoveRole(r)}>
                                                    <X className="size-2.5 text-neutral-400 hover:text-red-500" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Interests */}
                                <div>
                                    <Label className="text-xs font-semibold block mb-1">Topik & Bidang Minat</Label>
                                    <div className="flex gap-2 mb-2">
                                        <Input
                                            value={newInterest}
                                            onChange={(e) => setNewInterest(e.target.value)}
                                            placeholder="Contoh: Smart City"
                                            className="rounded-xl text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddInterest}
                                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium"
                                        >
                                            Tambah
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.interests.map((i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 rounded-lg text-xs text-neutral-800">
                                                {i}
                                                <button type="button" onClick={() => handleRemoveInterest(i)}>
                                                    <X className="size-2.5 text-neutral-400 hover:text-red-500" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Availability & Collaboration Settings */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                            <HeadingSmall title="Ketersediaan Jam Kerja Mingguan" description="Faktor penting (20%) pada algoritma pencocokan tim" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-semibold">Komitmen Jam / Minggu</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={80}
                                        value={data.availability_hours}
                                        onChange={(e) => setData('availability_hours', parseInt(e.target.value, 10))}
                                        className="rounded-xl text-xs py-2"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-semibold">Catatan Ketersediaan</Label>
                                    <Input
                                        value={data.availability_note}
                                        onChange={(e) => setData('availability_note', e.target.value)}
                                        placeholder="Contoh: Tersedia malam hari dan akhir pekan"
                                        className="rounded-xl text-xs py-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 6. External Links & Portfolio URLs */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
                            <HeadingSmall title="Tautan Eksternal & Portofolio" description="Lampirkan profil GitHub, LinkedIn, dan website karya Anda" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-semibold">GitHub URL</Label>
                                    <Input
                                        value={data.github_url}
                                        onChange={(e) => setData('github_url', e.target.value)}
                                        placeholder="https://github.com/username"
                                        className="rounded-xl text-xs py-2"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-semibold">LinkedIn URL</Label>
                                    <Input
                                        value={data.linkedin_url}
                                        onChange={(e) => setData('linkedin_url', e.target.value)}
                                        placeholder="https://linkedin.com/in/username"
                                        className="rounded-xl text-xs py-2"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-semibold">Website Portofolio</Label>
                                    <Input
                                        value={data.portfolio_url}
                                        onChange={(e) => setData('portfolio_url', e.target.value)}
                                        placeholder="https://myportfolio.com"
                                        className="rounded-xl text-xs py-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 7. Privacy & Permissions */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
                            <HeadingSmall title="Visibilitas & Undangan" description="Kendali privasi rekam jejak Anda" />

                            <div className="flex items-center justify-between pt-2">
                                <div>
                                    <span className="text-xs font-semibold text-neutral-800 block">Jadikan Portofolio Publik</span>
                                    <span className="text-[11px] text-neutral-500">
                                        Izinkan rekam jejak prestasi Anda diakses melalui link publik (`/p/username`)
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.portfolio_public}
                                    onChange={(e) => setData('portfolio_public', e.target.checked)}
                                    className="size-4 rounded text-[#5448EE] focus:ring-[#5448EE]"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                                <div>
                                    <span className="text-xs font-semibold text-neutral-800 block">Buka untuk Undangan Tim</span>
                                    <span className="text-[11px] text-neutral-500">
                                        Izinkan Project Leader kampus mengirimi Anda undangan kolaborasi
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.open_to_invites}
                                    onChange={(e) => setData('open_to_invites', e.target.checked)}
                                    className="size-4 rounded text-[#5448EE] focus:ring-[#5448EE]"
                                />
                            </div>
                        </div>

                        {/* Submit Button Bar */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="size-4" />
                                        Perubahan profil dan keahlian berhasil disimpan!
                                    </p>
                                </Transition>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="px-7 py-3 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                            </button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
