import { useForm } from '@inertiajs/react';
import { AlertCircle, Check, Pencil, X } from 'lucide-react';
import React from 'react';

export interface EditableAcademicClass {
    id: number;
    name: string;
    code: string;
    study_program?: string;
    academic_year?: string;
    semester?: string;
    target_team_size?: number;
    description?: string;
    status?: string;
}

interface EditClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    academicClass: EditableAcademicClass | null;
}

export default function EditClassModal({ isOpen, onClose, academicClass }: EditClassModalProps) {
    if (!isOpen || !academicClass) return null;

    return <EditClassForm academicClass={academicClass} onClose={onClose} />;
}

function EditClassForm({
    academicClass,
    onClose,
}: {
    academicClass: EditableAcademicClass;
    onClose: () => void;
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: academicClass.name || '',
        code: academicClass.code || '',
        study_program: academicClass.study_program || 'Teknik Informatika',
        academic_year: academicClass.academic_year || '2026/2027',
        semester: academicClass.semester || 'Ganjil',
        target_team_size: academicClass.target_team_size || 4,
        description: academicClass.description || '',
        status: academicClass.status || 'active',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/classes/${academicClass.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Pencil className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 leading-tight">
                                Edit Ruang Kelas
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nama Kelas */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Nama Kelas / Mata Kuliah <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Contoh: TI-2A Rekayasa Perangkat Lunak"
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                        />
                        {errors.name && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.name}</p>}
                    </div>

                    {/* Kode Kelas & Program Studi */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                Kode Kelas <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                placeholder="TI2A-RPL"
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                            />
                            {errors.code && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.code}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                Program Studi
                            </label>
                            <input
                                type="text"
                                value={data.study_program}
                                onChange={(e) => setData('study_program', e.target.value)}
                                placeholder="Teknik Informatika"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                            />
                            {errors.study_program && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.study_program}</p>}
                        </div>
                    </div>

                    {/* Tahun Akademik, Semester, Ukuran Tim */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                Tahun Akademik
                            </label>
                            <input
                                type="text"
                                value={data.academic_year}
                                onChange={(e) => setData('academic_year', e.target.value)}
                                placeholder="2026/2027"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                            />
                            {errors.academic_year && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.academic_year}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                Semester
                            </label>
                            <select
                                value={data.semester}
                                onChange={(e) => setData('semester', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                            >
                                <option value="Ganjil">Ganjil</option>
                                <option value="Genap">Genap</option>
                            </select>
                            {errors.semester && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.semester}</p>}
                        </div>

                        <div>
                            <label
                                className="block text-xs font-bold text-slate-800 mb-1.5"
                                title="Kapasitas ideal anggota per kelompok untuk tugas proyek di kelas ini"
                            >
                                Ukuran Tim
                            </label>
                            <input
                                type="number"
                                min={2}
                                max={10}
                                value={data.target_team_size}
                                onChange={(e) => setData('target_team_size', parseInt(e.target.value, 10) || 4)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                            />
                            {errors.target_team_size && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.target_team_size}</p>}
                        </div>
                    </div>

                    {/* Status Kelas */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Status Kelas
                        </label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                        >
                            <option value="active">Aktif — Menerima pendaftaran mahasiswa & kelompok</option>
                            <option value="archived">Diarsipkan — Selesai perkuliahan (Read Only)</option>
                        </select>
                        {errors.status && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.status}</p>}
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Deskripsi / Silabus Perkuliahan (Opsional)
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            placeholder="Jelaskan silabus mata kuliah, luaran proyek yang diharapkan, atau kontrak perkuliahan..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                        />
                        {errors.description && <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.description}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <span>Simpan Perubahan</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

