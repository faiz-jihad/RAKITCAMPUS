<?php

namespace App\Services\Notifications;

use App\Models\AcademicClass;
use App\Models\Achievement;
use App\Models\Competition;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionResult;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\ProjectProposal;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use App\Notifications\RakitUnifiedNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class NotificationService
{
    public function __construct(
        protected NotificationPreferenceService $preferenceService,
        protected NotificationRecipientResolver $resolver,
        protected NotificationLogService $logService,
        protected EmailDeliveryService $emailDelivery
    ) {}

    /**
     * Dispatch notification to one or multiple recipients.
     */
    public function notify(
        User|Collection|array $recipients,
        string $notificationType,
        string $category,
        string $title,
        string $message,
        array $options = []
    ): void {
        $recipientCollection = $recipients instanceof Collection
            ? $recipients
            : collect(is_array($recipients) ? $recipients : [$recipients]);

        $priority = $options['priority'] ?? 'medium';
        $actionUrl = $options['action_url'] ?? null;
        $actionText = $options['action_text'] ?? 'Lihat Detail';
        $entityType = $options['entity_type'] ?? null;
        $entityId = $options['entity_id'] ?? null;
        $details = $options['details'] ?? [];
        $baseIdempotency = $options['idempotency_key'] ?? null;

        foreach ($recipientCollection as $recipient) {
            if (!$recipient instanceof User || $recipient->status !== 'active') {
                continue;
            }

            $idempotencyKey = $baseIdempotency ? "{$baseIdempotency}_{$recipient->id}" : 'notif_' . Str::uuid();

            $notification = new RakitUnifiedNotification(
                notificationType: $notificationType,
                category: $category,
                title: $title,
                message: $message,
                priority: $priority,
                actionUrl: $actionUrl,
                actionText: $actionText,
                entityType: $entityType,
                entityId: $entityId,
                details: $details,
                idempotencyKey: $idempotencyKey
            );

            $recipient->notify($notification);
        }
    }

    // ==========================================
    // 1. ACCOUNT & AUTHENTICATION
    // ==========================================

    public function sendWelcomeNotification(User $user): void
    {
        $this->notify(
            recipients: $user,
            notificationType: 'auth_welcome',
            category: NotificationPreferenceService::CATEGORY_ACCOUNT_SECURITY,
            title: 'Selamat Datang di RAKIT Campus!',
            message: "Halo {$user->name}, akun Anda berhasil dibuat. Lengkapi profil kompetensi Anda dan mulailah berkolaborasi dalam Project Hub dan Competition Hub.",
            options: [
                'priority' => 'high',
                'action_url' => url('/dashboard'),
                'action_text' => 'Buka Dashboard RAKIT',
                'details' => [
                    'Nama' => $user->name,
                    'Email' => $user->email,
                    'Waktu Registrasi' => now()->format('d M Y, H:i T'),
                ],
                'idempotency_key' => "welcome_{$user->id}",
            ]
        );
    }

    public function sendSecurityAlert(User $user, string $activityName, array $details = []): void
    {
        $this->notify(
            recipients: $user,
            notificationType: 'auth_security_alert',
            category: NotificationPreferenceService::CATEGORY_ACCOUNT_SECURITY,
            title: "Peringatan Keamanan Akun: {$activityName}",
            message: "Aktivitas keamanan terdeteksi pada akun Anda: {$activityName}. Jika Anda tidak merasa melakukan tindakan ini, segera amankan akun Anda.",
            options: [
                'priority' => 'critical',
                'action_url' => url('/profile'),
                'action_text' => 'Periksa Keamanan Akun',
                'details' => array_merge([
                    'Aktivitas' => $activityName,
                    'Waktu' => now()->format('d M Y, H:i:s T'),
                ], $details),
            ]
        );
    }

    public function sendAccountStatusChange(User $user, string $newStatus, ?string $reason = null): void
    {
        $this->notify(
            recipients: $user,
            notificationType: 'auth_status_changed',
            category: NotificationPreferenceService::CATEGORY_ACCOUNT_SECURITY,
            title: "Status Akun RAKIT Campus: " . ucfirst($newStatus),
            message: "Status akun Anda telah diperbarui menjadi " . strtoupper($newStatus) . ($reason ? ". Catatan: {$reason}" : "."),
            options: [
                'priority' => 'critical',
                'action_url' => url('/login'),
                'action_text' => 'Akses Portal RAKIT',
                'details' => [
                    'Status Baru' => strtoupper($newStatus),
                    'Alasan' => $reason ?: '-',
                ],
            ]
        );
    }

    // ==========================================
    // 2. CLASS MANAGEMENT
    // ==========================================

    public function sendClassEnrollment(User $student, AcademicClass $class): void
    {
        $this->notify(
            recipients: $student,
            notificationType: 'class_enrolled',
            category: NotificationPreferenceService::CATEGORY_CLASS_MANAGEMENT,
            title: "Pendaftaran Kelas: {$class->name}",
            message: "Anda telah terdaftar sebagai mahasiswa dalam kelas {$class->name} ({$class->code}).",
            options: [
                'priority' => 'medium',
                'action_url' => url("/classes/{$class->id}"),
                'action_text' => 'Buka Detail Kelas',
                'entity_type' => 'academic_class',
                'entity_id' => $class->id,
                'details' => [
                    'Mata Kuliah' => $class->name,
                    'Kode Kelas' => $class->code,
                    'Semester' => $class->academic_year ?? '-',
                ],
                'idempotency_key' => "class_enroll_{$class->id}_{$student->id}",
            ]
        );
    }

    public function sendClassRemoval(User $student, AcademicClass $class): void
    {
        $this->notify(
            recipients: $student,
            notificationType: 'class_removed',
            category: NotificationPreferenceService::CATEGORY_CLASS_MANAGEMENT,
            title: "Perubahan Kelas: {$class->name}",
            message: "Anda telah dikeluarkan dari kelas {$class->name} ({$class->code}). Hubungi dosen pengampu jika terjadi kekeliruan.",
            options: [
                'priority' => 'high',
                'action_url' => url('/classes'),
                'action_text' => 'Lihat Daftar Kelas',
                'entity_type' => 'academic_class',
                'entity_id' => $class->id,
            ]
        );
    }

    public function sendLecturerClassAssignment(User $lecturer, AcademicClass $class): void
    {
        $this->notify(
            recipients: $lecturer,
            notificationType: 'class_lecturer_assigned',
            category: NotificationPreferenceService::CATEGORY_CLASS_MANAGEMENT,
            title: "Penugasan Dosen Pengampu: {$class->name}",
            message: "Anda telah ditugaskan sebagai dosen pengampu untuk kelas {$class->name} ({$class->code}).",
            options: [
                'priority' => 'high',
                'action_url' => url("/classes/{$class->id}"),
                'action_text' => 'Kelola Kelas Kuliah',
                'entity_type' => 'academic_class',
                'entity_id' => $class->id,
                'details' => [
                    'Kelas' => $class->name,
                    'Kode' => $class->code,
                ],
                'idempotency_key' => "class_assign_{$class->id}_{$lecturer->id}",
            ]
        );
    }

    // ==========================================
    // 3. PROJECT HUB
    // ==========================================

    public function sendProposalSubmission(ProjectProposal $proposal, User $submittedBy): void
    {
        $project = $proposal->project;
        if (!$project) return;

        // Notify supervisors/lecturers
        $supervisors = $this->resolver->resolveProjectSupervisors($project, $submittedBy->id);

        $this->notify(
            recipients: $supervisors,
            notificationType: 'project_proposal_submitted',
            category: NotificationPreferenceService::CATEGORY_PROJECT_HUB,
            title: "Pengajuan Proposal Proyek: {$project->title}",
            message: "Mahasiswa {$submittedBy->name} telah mengumpulkan proposal baru untuk proyek '{$project->title}'. Silakan tinjau dan berikan ulasan.",
            options: [
                'priority' => 'high',
                'action_url' => url("/projects/{$project->id}/workspace"),
                'action_text' => 'Tinjau Proposal Proyek',
                'entity_type' => 'project_proposal',
                'entity_id' => $proposal->id,
                'details' => [
                    'Proyek' => $project->title,
                    'Pengaju' => $submittedBy->name,
                    'Waktu Submit' => now()->format('d M Y, H:i T'),
                ],
            ]
        );
    }

    public function sendProposalReview(ProjectProposal $proposal, string $status, ?string $feedback = null, ?User $reviewer = null): void
    {
        $project = $proposal->project;
        if (!$project || !$project->team) return;

        $members = $this->resolver->resolveTeamMembers($project->team, $reviewer?->id);
        $statusLabel = match ($status) {
            'approved' => 'Disetujui',
            'revision_required', 'needs_revision' => 'Perlu Revisi',
            'rejected' => 'Ditolak',
            default => ucfirst($status),
        };

        $this->notify(
            recipients: $members,
            notificationType: 'project_proposal_reviewed',
            category: NotificationPreferenceService::CATEGORY_PROJECT_HUB,
            title: "Proposal Proyek {$statusLabel}: {$project->title}",
            message: "Proposal proyek Anda telah ditinjau dengan hasil: {$statusLabel}." . ($feedback ? " Catatan: {$feedback}" : ""),
            options: [
                'priority' => 'high',
                'action_url' => url("/projects/{$project->id}/workspace"),
                'action_text' => 'Buka Workspace Proyek',
                'entity_type' => 'project_proposal',
                'entity_id' => $proposal->id,
                'details' => [
                    'Proyek' => $project->title,
                    'Status Hasil' => $statusLabel,
                    'Reviewer' => $reviewer ? $reviewer->name : 'Dosen Pengampu',
                    'Ulasan' => $feedback ?: '-',
                ],
            ]
        );
    }

    public function sendProjectInvitation(Invitation $invitation): void
    {
        $invitee = $invitation->invitee;
        $team = $invitation->team;
        if (!$invitee || !$team) return;

        $inviterName = $invitation->inviter?->name ?? 'Ketua Tim';

        $this->notify(
            recipients: $invitee,
            notificationType: 'project_invitation_sent',
            category: NotificationPreferenceService::CATEGORY_PROJECT_HUB,
            title: "Undangan Bergabung Tim Proyek: {$team->name}",
            message: "{$inviterName} mengundang Anda bergabung dengan tim '{$team->name}' untuk peran: {$invitation->role_name}.",
            options: [
                'priority' => 'high',
                'action_url' => url('/matching'),
                'action_text' => 'Tanggapi Undangan',
                'entity_type' => 'invitation',
                'entity_id' => $invitation->id,
                'details' => [
                    'Tim' => $team->name,
                    'Peran' => $invitation->role_name,
                    'Pengundang' => $inviterName,
                ],
                'idempotency_key' => "invitation_{$invitation->id}",
            ]
        );
    }

    public function sendInvitationResponse(Invitation $invitation, bool $accepted): void
    {
        $team = $invitation->team;
        $invitee = $invitation->invitee;
        if (!$team || !$invitee) return;

        $leader = $this->resolver->resolveTeamLeader($team);
        if (!$leader) return;

        $actionText = $accepted ? 'menerima' : 'menolak';

        $this->notify(
            recipients: $leader,
            notificationType: 'project_invitation_responded',
            category: NotificationPreferenceService::CATEGORY_PROJECT_HUB,
            title: "Respon Undangan Tim: {$invitee->name}",
            message: "Kandidat {$invitee->name} telah {$actionText} undangan untuk bergabung dengan tim {$team->name}.",
            options: [
                'priority' => 'medium',
                'action_url' => url('/workspace'),
                'action_text' => 'Periksa Anggota Tim',
                'entity_type' => 'invitation',
                'entity_id' => $invitation->id,
                'details' => [
                    'Kandidat' => $invitee->name,
                    'Keputusan' => strtoupper($actionText),
                    'Peran' => $invitation->role_name,
                ],
            ]
        );
    }

    public function sendLecturerAllocation(User $student, Project $project, string $role): void
    {
        $this->notify(
            recipients: $student,
            notificationType: 'project_lecturer_allocation',
            category: NotificationPreferenceService::CATEGORY_PROJECT_HUB,
            title: "Alokasi Kelompok Proyek oleh Dosen: {$project->title}",
            message: "Dosen pengampu telah mengalokasikan Anda ke dalam proyek '{$project->title}' sebagai {$role}.",
            options: [
                'priority' => 'high',
                'action_url' => url("/projects/{$project->id}/workspace"),
                'action_text' => 'Konfirmasi & Masuk Workspace',
                'entity_type' => 'project',
                'entity_id' => $project->id,
                'details' => [
                    'Proyek' => $project->title,
                    'Peran yang Ditugaskan' => $role,
                ],
            ]
        );
    }

    public function sendTaskAssignment(Task $task, User $assignee, ?User $assignedBy = null): void
    {
        $teamName = $task->team?->name ?? 'Tim';
        $assignerName = $assignedBy ? $assignedBy->name : 'Ketua Tim';

        $this->notify(
            recipients: $assignee,
            notificationType: 'task_assigned',
            category: NotificationPreferenceService::CATEGORY_PROJECT_HUB,
            title: "Penugasan Tugas Baru: {$task->title}",
            message: "{$assignerName} menugaskan tugas '{$task->title}' pada tim {$teamName} kepada Anda.",
            options: [
                'priority' => 'medium',
                'action_url' => url('/workspace'),
                'action_text' => 'Buka Workspace Tugas',
                'entity_type' => 'task',
                'entity_id' => $task->id,
                'details' => [
                    'Tugas' => $task->title,
                    'Tim' => $teamName,
                    'Tenggat Waktu' => $task->due_date ? date('d M Y, H:i', strtotime($task->due_date)) : 'Fleksibel',
                ],
            ]
        );
    }

    public function sendAssessmentPublished(Project $project, string $periodName, float $score, ?string $feedback = null): void
    {
        if (!$project->team) return;

        $members = $this->resolver->resolveTeamMembers($project->team);

        $this->notify(
            recipients: $members,
            notificationType: 'project_assessment_published',
            category: NotificationPreferenceService::CATEGORY_PROJECT_HUB,
            title: "Nilai & Evaluasi {$periodName}: {$project->title}",
            message: "Dosen telah merilis hasil penilaian {$periodName} untuk proyek {$project->title}. Nilai perolehan: {$score}.",
            options: [
                'priority' => 'high',
                'action_url' => url("/projects/{$project->id}/workspace"),
                'action_text' => 'Lihat Rekapitulasi Nilai',
                'entity_type' => 'project',
                'entity_id' => $project->id,
                'details' => [
                    'Tahap Evaluasi' => $periodName,
                    'Nilai Akhir' => (string) $score,
                    'Catatan Evaluator' => $feedback ?: 'Tidak ada catatan tambahan.',
                ],
            ]
        );
    }

    // ==========================================
    // 4. COMPETITION HUB
    // ==========================================

    public function sendCompetitionPublished(Competition $competition): void
    {
        // Broadcast to students in the same campus
        $students = User::whereHas('memberships', function ($q) use ($competition) {
            $q->where('role', \App\Enums\CampusRole::Student->value)
              ->where('status', \App\Enums\MembershipStatus::Active->value);
            if ($competition->campus_id) {
                $q->where('campus_id', $competition->campus_id);
            }
        })
        ->where('status', 'active')
        ->limit(100) // Batch safeguard
        ->get();

        $this->notify(
            recipients: $students,
            notificationType: 'competition_published',
            category: NotificationPreferenceService::CATEGORY_COMPETITION_HUB,
            title: "Kompetisi Baru Dibuka: {$competition->name}",
            message: "Kompetisi '{$competition->name}' kategori {$competition->category} telah resmi dibuka. Cari teman tim dan daftarkan tim Anda!",
            options: [
                'priority' => 'medium',
                'action_url' => url("/competitions/{$competition->id}"),
                'action_text' => 'Lihat Info Kompetisi',
                'entity_type' => 'competition',
                'entity_id' => $competition->id,
                'details' => [
                    'Penyelenggara' => $competition->organizer ?? 'Official',
                    'Kategori' => $competition->category,
                    'Deadline Pendaftaran' => $competition->registration_deadline ? date('d M Y', strtotime($competition->registration_deadline)) : '-',
                ],
                'idempotency_key' => "comp_pub_{$competition->id}",
            ]
        );
    }

    public function sendCompetitionInvitation(User $invitee, Team $team, Competition $competition, string $role, ?User $inviter = null): void
    {
        $inviterName = $inviter ? $inviter->name : 'Ketua Tim';

        $this->notify(
            recipients: $invitee,
            notificationType: 'competition_invitation_sent',
            category: NotificationPreferenceService::CATEGORY_COMPETITION_HUB,
            title: "Undangan Tim Lomba: {$competition->name}",
            message: "{$inviterName} mengundang Anda bergabung ke tim '{$team->name}' untuk mengikuti kompetisi {$competition->name} sebagai {$role}.",
            options: [
                'priority' => 'high',
                'action_url' => url("/competitions/{$competition->id}"),
                'action_text' => 'Tanggapi Undangan Lomba',
                'entity_type' => 'team',
                'entity_id' => $team->id,
                'details' => [
                    'Kompetisi' => $competition->name,
                    'Tim' => $team->name,
                    'Peran yang Ditawarkan' => $role,
                    'Pengundang' => $inviterName,
                ],
            ]
        );
    }

    public function sendCompetitionInvitationResponse(Team $team, User $invitee, bool $accepted): void
    {
        $leader = $this->resolver->resolveTeamLeader($team);
        if (!$leader) return;

        $actionText = $accepted ? 'menerima' : 'menolak';

        $this->notify(
            recipients: $leader,
            notificationType: 'competition_invitation_responded',
            category: NotificationPreferenceService::CATEGORY_COMPETITION_HUB,
            title: "Respon Undangan Tim Lomba: {$invitee->name}",
            message: "Kandidat {$invitee->name} telah {$actionText} undangan untuk bergabung dengan tim lomba {$team->name}.",
            options: [
                'priority' => 'medium',
                'action_url' => url('/competitions'),
                'action_text' => 'Periksa Anggota Tim',
                'entity_type' => 'team',
                'entity_id' => $team->id,
                'details' => [
                    'Kandidat' => $invitee->name,
                    'Keputusan' => strtoupper($actionText),
                    'Tim' => $team->name,
                ],
            ]
        );
    }

    public function sendCompetitionStageChange(CompetitionParticipation $participation, string $newStage, ?string $notes = null): void
    {
        $members = $this->resolver->resolveCompetitionTeamMembers($participation);
        $competition = $participation->competition;
        $compName = $competition?->name ?? 'Kompetisi';

        $stageLabel = ucfirst(str_replace('_', ' ', $newStage));

        $this->notify(
            recipients: $members,
            notificationType: 'competition_stage_changed',
            category: NotificationPreferenceService::CATEGORY_COMPETITION_HUB,
            title: "Pembaruan Tahap Kompetisi: {$stageLabel}",
            message: "Tim Anda pada kompetisi {$compName} telah berlanjut ke tahap: {$stageLabel}." . ($notes ? " Catatan: {$notes}" : ""),
            options: [
                'priority' => 'high',
                'action_url' => url("/competitions/workspace/{$participation->id}"),
                'action_text' => 'Buka Workspace Kompetisi',
                'entity_type' => 'competition_participation',
                'entity_id' => $participation->id,
                'details' => [
                    'Kompetisi' => $compName,
                    'Tahap Terkini' => $stageLabel,
                    'Keterangan' => $notes ?: '-',
                ],
            ]
        );
    }

    public function sendCompetitionResult(CompetitionResult $result): void
    {
        $participation = $result->participation;
        if (!$participation) return;

        $members = $this->resolver->resolveCompetitionTeamMembers($participation);
        $competition = $participation->competition;
        $compName = $competition?->name ?? 'Kompetisi';

        $title = $result->is_winner ? "Selamat! Juara Kompetisi: {$compName}" : "Hasil Seleksi Akhir: {$compName}";

        $this->notify(
            recipients: $members,
            notificationType: 'competition_result_announced',
            category: NotificationPreferenceService::CATEGORY_COMPETITION_HUB,
            title: $title,
            message: "Hasil kompetisi {$compName} telah diumumkan. Capaian tim: {$result->achievement_title}.",
            options: [
                'priority' => 'high',
                'action_url' => url("/competitions/workspace/{$participation->id}"),
                'action_text' => 'Buka Hasil & Sertifikat',
                'entity_type' => 'competition_result',
                'entity_id' => $result->id,
                'details' => [
                    'Kompetisi' => $compName,
                    'Gelar / Peringkat' => $result->achievement_title,
                    'Status Verifikasi' => $result->verified_at ? 'Terverifikasi Resmi' : 'Menunggu Validasi',
                ],
            ]
        );
    }

    public function sendAchievementVerified(Achievement $achievement): void
    {
        $user = $achievement->user;
        if (!$user) return;

        $this->notify(
            recipients: $user,
            notificationType: 'achievement_verified',
            category: NotificationPreferenceService::CATEGORY_COMPETITION_HUB,
            title: "Prestasi Resmi Terverifikasi: {$achievement->title}",
            message: "Prestasi Anda '{$achievement->title}' telah divalidasi dan diarsipkan ke dalam portofolio akademik resmi Anda.",
            options: [
                'priority' => 'high',
                'action_url' => url('/portfolio'),
                'action_text' => 'Lihat Portofolio Saya',
                'entity_type' => 'achievement',
                'entity_id' => $achievement->id,
                'details' => [
                    'Judul Prestasi' => $achievement->title,
                    'Peringkat' => $achievement->rank ?? 'Pemenang',
                    'Waktu Verifikasi' => now()->format('d M Y, H:i T'),
                ],
            ]
        );
    }
}
