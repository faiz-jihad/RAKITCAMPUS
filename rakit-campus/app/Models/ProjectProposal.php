<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectProposal extends Model
{
    use HasFactory;

    protected $fillable = [
        'campus_id',
        'project_id',
        'current_version_id',
        'status',
        'latest_version_number',
        'approved_at',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'latest_version_number' => 'integer',
            'approved_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(ProjectProposalVersion::class, 'current_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ProjectProposalVersion::class, 'proposal_id')->orderBy('version_number', 'desc');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Ensure a living proposal exists for the given project.
     * Seeds v1 from project attributes if newly created.
     */
    public static function ensureForProject(Project $project): self
    {
        $proposal = self::firstOrCreate(
            ['project_id' => $project->id],
            [
                'campus_id' => $project->campus_id,
                'status' => 'draft',
                'latest_version_number' => 1,
            ]
        );

        if (!$proposal->current_version_id) {
            $v1 = ProjectProposalVersion::firstOrCreate(
                [
                    'proposal_id' => $proposal->id,
                    'version_number' => 1,
                ],
                [
                    'title' => $project->title,
                    'abstract' => $project->short_description,
                    'problem_statement' => $project->problem_statement,
                    'objectives' => $project->objectives,
                    'target_users' => 'Mahasiswa dan Civitas Akademika',
                    'proposed_solution' => $project->proposed_solution,
                    'needs_analysis' => "Kebutuhan Fungsional:\n- Autentikasi pengguna & hak akses peran\n- Manajemen data dan proses inti\n- Laporan dan rekapitulasi progres\n\nKebutuhan Non-Fungsional:\n- Response time < 500ms\n- Keamanan data dan proteksi otorisasi\n- Antarmuka responsif ramah seluler",
                    'system_architecture' => "Arsitektur Sistem:\n- Frontend: React dengan Tailwind CSS & Inertia.js\n- Backend: Laravel 12 Framework MVC & REST Services\n- Database: Relasional PostgreSQL / MySQL dengan Foreign Keys & Transaction Locks",
                    'methodology' => "Metodologi Agile Scrum:\n- Sprint 1: Perencanaan backlog & perancangan basis data\n- Sprint 2: Implementasi modul inti & integrasi antarmuka\n- Sprint 3: Pengujian fungsional & deployment",
                    'timeline_plan' => "Pekan 1-2: Setup & Living Proposal\nPekan 3-7: Sprint Pengembangan Utama\nPekan 8: Evaluasi Tengah Semester (UTS)\nPekan 9-15: Finalisasi Fitur & UAT\nPekan 16: Evaluasi Akhir Semester (UAS)",
                    'tech_stack' => is_array($project->tech_stack) ? $project->tech_stack : ['Laravel', 'React', 'MySQL', 'Tailwind CSS'],
                    'change_summary' => 'Inisiasi rancangan proposal awal proyek.',
                    'status' => 'draft',
                    'created_by' => $project->leader_id,
                    'is_locked' => false,
                ]
            );

            $proposal->update([
                'current_version_id' => $v1->id,
                'latest_version_number' => 1,
            ]);
        }

        return $proposal;
    }
}
