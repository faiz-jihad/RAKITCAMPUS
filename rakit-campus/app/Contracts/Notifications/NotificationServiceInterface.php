<?php

namespace App\Contracts\Notifications;

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
use Illuminate\Support\Collection;

/**
 * High-level Notification Service Contract (Dependency Inversion Principle).
 */
interface NotificationServiceInterface extends NotificationCounterInterface
{
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
    ): void;

    /**
     * Dispatch bulk notification asynchronously via queued batches for high concurrency (O(1) memory).
     */
    public function notifyBulk(
        array $recipientIds,
        string $notificationType,
        string $category,
        string $title,
        string $message,
        array $options = []
    ): void;

    // Domain Notification Triggers
    public function sendWelcomeNotification(User $user): void;
    public function sendSecurityAlert(User $user, string $activityName, array $details = []): void;
    public function sendAccountStatusChange(User $user, string $newStatus, ?string $reason = null): void;
    public function sendClassEnrollment(User $student, AcademicClass $class): void;
    public function sendClassRemoval(User $student, AcademicClass $class): void;
    public function sendLecturerClassAssignment(User $lecturer, AcademicClass $class): void;
    public function sendProposalSubmission(ProjectProposal $proposal, User $submittedBy): void;
    public function sendProposalReview(ProjectProposal $proposal, string $status, ?string $feedback = null, ?User $reviewer = null): void;
    public function sendProjectInvitation(Invitation $invitation): void;
    public function sendInvitationResponse(Invitation $invitation, bool $accepted): void;
    public function sendLecturerAllocation(User $student, Project $project, string $role): void;
    public function sendTaskAssignment(Task $task, User $assignee, ?User $assignedBy = null): void;
    public function sendAssessmentPublished(Project $project, string $periodName, float $score, ?string $feedback = null): void;
    public function sendCompetitionPublished(Competition $competition): void;
    public function sendCompetitionInvitation(User $invitee, Team $team, Competition $competition, string $role, ?User $inviter = null): void;
    public function sendCompetitionInvitationResponse(Team $team, User $invitee, bool $accepted): void;
    public function sendCompetitionStageChange(CompetitionParticipation $participation, string $newStage, ?string $notes = null): void;
    public function sendCompetitionResult(CompetitionResult $result): void;
    public function sendAchievementVerified(Achievement $achievement): void;
}
