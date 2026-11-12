<?php

namespace App\Services\Notifications;

use App\Contracts\Notifications\NotificationLogServiceInterface;
use App\Contracts\Notifications\NotificationRecipientResolverInterface;
use App\Models\CompetitionDocument;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DeadlineReminderService
{
    public function __construct(
        protected NotificationLogServiceInterface $logService,
        protected NotificationRecipientResolverInterface $resolver
    ) {}

    /**
     * Process all upcoming deadlines and dispatch idempotent reminders.
     */
    public function sendUpcomingDeadlineReminders(int $hoursAhead = 48): array
    {
        $taskCount = $this->sendTaskDeadlineReminders($hoursAhead);
        $deliverableCount = $this->sendDeliverableDeadlineReminders($hoursAhead);

        return [
            'task_reminders_sent' => $taskCount,
            'deliverable_reminders_sent' => $deliverableCount,
            'total_sent' => $taskCount + $deliverableCount,
        ];
    }

    /**
     * Send reminders for pending tasks approaching deadline.
     */
    public function sendTaskDeadlineReminders(int $hoursAhead = 48): int
    {
        $now = now();
        $cutoff = now()->addHours($hoursAhead);

        $upcomingTasks = Task::with(['team', 'assignee'])
            ->whereNotNull('due_on')
            ->where('due_on', '>=', $now->toDateString())
            ->where('due_on', '<=', $cutoff->toDateString())
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->get();

        $sentCount = 0;

        foreach ($upcomingTasks as $task) {
            $dueDate = $task->due_on;
            if (!$dueDate) {
                continue;
            }

            $recipients = collect();

            if ($task->assignee) {
                $recipients->push($task->assignee);
            } elseif ($task->team) {
                // If unassigned, remind team leader
                $leader = $this->resolver->resolveTeamLeader($task->team);
                if ($leader) {
                    $recipients->push($leader);
                }
            }

            foreach ($recipients as $recipient) {
                $dueDateStr = Carbon::parse($dueDate)->format('Y-m-d');
                $idempotencyKey = "deadline_task_{$task->id}_{$recipient->id}_{$dueDateStr}";

                if ($this->logService->hasDuplicate($idempotencyKey, 86400)) {
                    continue; // Skip if already reminded today
                }

                $timeRemaining = Carbon::parse($dueDate)->diffForHumans();
                $teamName = $task->team?->name ?? 'Proyek';

                $notification = new \App\Notifications\RakitUnifiedNotification(
                    notificationType: 'task_deadline_reminder',
                    category: NotificationPreferenceService::CATEGORY_DEADLINE_REMINDERS,
                    title: "Pengingat Deadline Tugas: {$task->title}",
                    message: "Tugas '{$task->title}' pada tim {$teamName} memiliki batas waktu pengumpulan {$timeRemaining}.",
                    priority: 'high',
                    actionUrl: url('/workspace'),
                    actionText: 'Buka Workspace Tugas',
                    entityType: 'task',
                    entityId: $task->id,
                    details: [
                        'Tugas' => $task->title,
                        'Tim' => $teamName,
                        'Tenggat Waktu' => Carbon::parse($dueDate)->format('d M Y, H:i T'),
                        'Sisa Waktu' => $timeRemaining,
                    ],
                    idempotencyKey: $idempotencyKey
                );

                $recipient->notify($notification);
                $sentCount++;
            }
        }

        return $sentCount;
    }

    /**
     * Send reminders for competition deliverables approaching deadline.
     */
    public function sendDeliverableDeadlineReminders(int $hoursAhead = 48): int
    {
        $now = now();
        $cutoff = now()->addHours($hoursAhead);

        $upcomingDocs = CompetitionDocument::with(['participation.team', 'participation.competition'])
            ->whereNotNull('deadline')
            ->where('deadline', '>', $now)
            ->where('deadline', '<=', $cutoff)
            ->whereNull('submitted_at')
            ->whereIn('status', ['draft', 'revision_required', 'pending'])
            ->get();

        $sentCount = 0;

        foreach ($upcomingDocs as $doc) {
            $participation = $doc->participation;
            if (!$participation || !$participation->team) {
                continue;
            }

            $members = $this->resolver->resolveCompetitionTeamMembers($participation);
            $deadlineStr = Carbon::parse($doc->deadline)->format('Y-m-d');

            foreach ($members as $member) {
                $idempotencyKey = "deadline_comp_doc_{$doc->id}_{$member->id}_{$deadlineStr}";

                if ($this->logService->hasDuplicate($idempotencyKey, 86400)) {
                    continue;
                }

                $timeRemaining = Carbon::parse($doc->deadline)->diffForHumans();
                $compName = $participation->competition?->name ?? 'Kompetisi';

                $notification = new \App\Notifications\RakitUnifiedNotification(
                    notificationType: 'deliverable_deadline_reminder',
                    category: NotificationPreferenceService::CATEGORY_DEADLINE_REMINDERS,
                    title: "Pengingat Deadline Deliverable: {$doc->name}",
                    message: "Berkas deliverable '{$doc->name}' untuk kompetisi {$compName} harus diunggah {$timeRemaining}.",
                    priority: 'high',
                    actionUrl: url("/competitions/workspace/{$participation->id}"),
                    actionText: 'Buka Workspace Kompetisi',
                    entityType: 'competition_document',
                    entityId: $doc->id,
                    details: [
                        'Deliverable' => $doc->name,
                        'Kompetisi' => $compName,
                        'Batas Waktu' => Carbon::parse($doc->deadline)->format('d M Y, H:i T'),
                        'Sisa Waktu' => $timeRemaining,
                    ],
                    idempotencyKey: $idempotencyKey
                );

                $member->notify($notification);
                $sentCount++;
            }
        }

        return $sentCount;
    }
}
