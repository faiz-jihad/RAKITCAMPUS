import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Check,
    Clock,
    Plus,
    Save,
    Settings,
    Shield,
    Trash2,
    Users,
    Zap,
} from 'lucide-react';

interface Props {
    project: any;
    isLeader: boolean;
    isLecturer: boolean;
}

export default function RequirementsTab({ project, isLeader, isLecturer }: Props) {
    const { errors: pageErrors } = usePage().props as any;
    const academicClass = project.academic_class || project.academicClass;
    const classMaxCap = academicClass?.target_team_size || 10;
    const existingRecruitment = project.team?.recruitment;
    const existingRoles = existingRecruitment?.roles || [];
    const existingSkills = project.skills || [];

    const [minTeamSize, setMinTeamSize] = useState<number>(Math.min(project.min_team_size || 2, classMaxCap));
    const [maxTeamSize, setMaxTeamSize] = useState<number>(Math.min(project.max_team_size || 4, classMaxCap));
    const [weeklyHours, setWeeklyHours] = useState<number>(project.expected_weekly_hours || 10);
    const [deadline, setDeadline] = useState<string>(project.formation_deadline || '');

    const [roles, setRoles] = useState<Array<{
        name: string;
        description: string;
        slots: number;
        priority: string;
        min_proficiency: number;
    }>>(
        existingRoles.length > 0
            ? existingRoles.map((r: any) => ({
                name: r.name,
                description: r.description || '',
                slots: r.slots || 1,
                priority: r.priority || 'normal',
                min_proficiency: r.min_proficiency || 2,
            }))
            : [
                { name: 'Backend Developer', description: 'Pengembangan REST API & database', slots: 1, priority: 'high', min_proficiency: 3 },
                { name: 'Frontend Developer', description: 'Antarmuka web interaktif React', slots: 1, priority: 'high', min_proficiency: 3 },
                { name: 'UI/UX Designer', description: 'Prototyping & desain antarmuka', slots: 1, priority: 'normal', min_proficiency: 2 },
            ]
    );

    const [skills, setSkills] = useState<Array<{ name: string; min_proficiency: number }>>(
        existingSkills.length > 0
            ? existingSkills.map((s: any) => ({
                name: s.name,
                min_proficiency: s.pivot?.min_proficiency || 2,
            }))
            : [
                { name: 'Laravel', min_proficiency: 3 },
                { name: 'React', min_proficiency: 3 },
                { name: 'Figma', min_proficiency: 2 },
            ]
    );

    const [newSkillName, setNewSkillName] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAddRole = () => {
        setRoles([
            ...roles,
            { name: '', description: '', slots: 1, priority: 'normal', min_proficiency: 2 },
        ]);
    };

    const handleRemoveRole = (idx: number) => {
        setRoles(roles.filter((_, i) => i !== idx));
    };

    const handleAddSkill = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkillName.trim()) return;
        setSkills([...skills, { name: newSkillName.trim(), min_proficiency: 2 }]);
        setNewSkillName('');
    };

    const handleRemoveSkill = (idx: number) => {
        setSkills(skills.filter((_, i) => i !== idx));
    };

    const handleSave = () => {
        setSaving(true);
        router.post(
            `/projects/${project.id}/requirements`,
            {
                min_team_size: minTeamSize,
                max_team_size: maxTeamSize,
                expected_weekly_hours: weeklyHours,
                formation_deadline: deadline || null,
                roles,
                skills,
            },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            }
        );
    };

    const canConfigure = isLeader || isLecturer;

    return (
        <div className="flex flex-col gap-6">
            {/* Header Card */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold mb-2">
                            <Settings className="size-3.5" />
                            <span>Konfigurasi Kebutuhan Tim Proyek</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            Persyaratan Keahlian & Pembagian Peran
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                            Tentukan kapasitas anggota, peran spesifik yang dicari, serta standar minimal kompetensi teknis agar mesin Smart Matchmaking dapat merekomendasikan rekan yang saling melengkapi.
                        </p>
                    </div>

                    {canConfigure && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
                        >
                            <Save className="size-4" />
                            <span>{saving ? 'Menyimpan...' : 'Simpan Kebutuhan'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Validation Error */}
            {pageErrors?.max_team_size && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                    {pageErrors.max_team_size}
                </div>
            )}

            {/* Team Size & Commitment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Kapasitas Anggota</span>
                        <Users className="size-4 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Minimal</label>
                            <input
                                type="number"
                                min={2}
                                max={classMaxCap}
                                disabled={!canConfigure}
                                value={minTeamSize}
                                onChange={(e) => {
                                    const nextMin = Math.min(classMaxCap, Math.max(2, parseInt(e.target.value) || 2));
                                    setMinTeamSize(nextMin);
                                    if (maxTeamSize < nextMin) setMaxTeamSize(nextMin);
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 text-center"
                            />
                        </div>
                        <span className="text-slate-300 font-bold mt-4">—</span>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Maksimal</label>
                            <input
                                type="number"
                                min={minTeamSize}
                                max={classMaxCap}
                                disabled={!canConfigure}
                                value={maxTeamSize}
                                onChange={(e) => setMaxTeamSize(Math.min(classMaxCap, Math.max(minTeamSize, parseInt(e.target.value) || minTeamSize)))}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 text-center"
                            />
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Target kelas: {academicClass?.target_team_size || 4} orang</p>
                </div>

                <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Komitmen Waktu</span>
                        <Clock className="size-4 text-emerald-600" />
                    </div>
                    <div className="mt-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Jam / Minggu Per Anggota</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={4}
                                max={40}
                                disabled={!canConfigure}
                                value={weeklyHours}
                                onChange={(e) => setWeeklyHours(Math.max(4, parseInt(e.target.value) || 10))}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900"
                            />
                            <span className="text-xs text-slate-500 font-semibold shrink-0">Jam / Mgg</span>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Digunakan untuk evaluasi kecocokan availability.</p>
                </div>

                <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tenggat Pembentukan</span>
                        <Zap className="size-4 text-amber-600" />
                    </div>
                    <div className="mt-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Batas Akhir Formasi</label>
                        <input
                            type="date"
                            disabled={!canConfigure}
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                        />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Setelah tenggat, formasi tim diajukan ke dosen pengampu.</p>
                </div>
            </div>

            {/* Configurable Roles Section */}
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Briefcase className="size-4.5 text-blue-600" />
                            <span>Peran & Tanggung Jawab Anggota ({roles.length} Posisi)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Daftar peran yang dibutuhkan dalam tim proyek capstone ini.</p>
                    </div>

                    {canConfigure && (
                        <button
                            type="button"
                            onClick={handleAddRole}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            <span>Tambah Peran</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    {roles.map((role, idx) => (
                        <div
                            key={idx}
                            className="p-4 rounded-xl bg-white/70 border border-slate-200/80 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nama Peran</label>
                                    <input
                                        type="text"
                                        disabled={!canConfigure}
                                        value={role.name}
                                        onChange={(e) => {
                                            const updated = [...roles];
                                            updated[idx].name = e.target.value;
                                            setRoles(updated);
                                        }}
                                        placeholder="cth: Backend Developer"
                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900"
                                    />
                                    <input
                                        type="text"
                                        disabled={!canConfigure}
                                        value={role.description}
                                        onChange={(e) => {
                                            const updated = [...roles];
                                            updated[idx].description = e.target.value;
                                            setRoles(updated);
                                        }}
                                        placeholder="Deskripsi tugas utama..."
                                        className="w-full mt-1.5 px-3 py-1 rounded-lg bg-white border border-slate-100 text-[11px] text-slate-600"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Kuota Slot</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={5}
                                        disabled={!canConfigure}
                                        value={role.slots}
                                        onChange={(e) => {
                                            const updated = [...roles];
                                            updated[idx].slots = Math.max(1, parseInt(e.target.value) || 1);
                                            setRoles(updated);
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 text-center"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Prioritas</label>
                                    <select
                                        disabled={!canConfigure}
                                        value={role.priority}
                                        onChange={(e) => {
                                            const updated = [...roles];
                                            updated[idx].priority = e.target.value;
                                            setRoles(updated);
                                        }}
                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                                    >
                                        <option value="high">Krusial (Tinggi)</option>
                                        <option value="normal">Standar (Normal)</option>
                                        <option value="low">Pendukung (Rendah)</option>
                                    </select>
                                </div>
                            </div>

                            {canConfigure && roles.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRole(idx)}
                                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer self-end md:self-center"
                                    title="Hapus peran"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Technical Skills Requirements */}
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="size-4.5 text-blue-600" />
                            <span>Kebutuhan Keahlian Teknis ({skills.length} Keahlian)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Keahlian wajib yang harus dikuasai oleh anggota tim (skala profisiensi 1–5).</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {skills.map((skill, idx) => (
                        <div
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs"
                        >
                            <span>{skill.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                                Min Lvl {skill.min_proficiency}
                            </span>
                            {canConfigure && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(idx)}
                                    className="text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {canConfigure && (
                    <form onSubmit={handleAddSkill} className="flex items-center gap-2 max-w-md">
                        <input
                            type="text"
                            value={newSkillName}
                            onChange={(e) => setNewSkillName(e.target.value)}
                            placeholder="Tambah keahlian (cth: Docker, PostgreSQL)..."
                            className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                        >
                            Tambah
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
