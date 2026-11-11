<?php

use App\Enums\CampusRole;
use App\Http\Controllers\OnboardingWebController;
use App\Http\Controllers\Web\AcademicClassWebController;
use App\Http\Controllers\Web\AdminWebController;
use App\Http\Controllers\Web\Admin\AdminCompetitionWebController;
use App\Http\Controllers\Web\Admin\AdminNotificationWebController;
use App\Http\Controllers\Web\AssessmentWebController;
use App\Http\Controllers\Web\CompetitionWebController;
use App\Http\Controllers\Web\DashboardWebController;
use App\Http\Controllers\Web\FeedbackWebController;
use App\Http\Controllers\Web\MatchingWebController;
use App\Http\Controllers\Web\NotificationWebController;
use App\Http\Controllers\Web\PortfolioWebController;
use App\Http\Controllers\Web\ProjectProposalWebController;
use App\Http\Controllers\Web\ProjectWebController;
use App\Http\Controllers\Web\SitemapWebController;
use App\Http\Controllers\Web\WorkspaceWebController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::post('/feedback', [FeedbackWebController::class, 'store'])->name('feedback.store');

Route::get('/sitemap.xml', [SitemapWebController::class, 'index'])->name('sitemap');

Route::get('/p/{slug}', [PortfolioWebController::class, 'publicView'])->name('portfolio.public');

// Public Discovery Hubs (Open for browsing, enriched when authenticated)
Route::get('/dashboard', [DashboardWebController::class, 'index'])->name('dashboard');
Route::get('/projects', [ProjectWebController::class, 'index'])->name('projects.index');
Route::get('/projects/{slug}', [ProjectWebController::class, 'show'])->name('projects.show')->where('slug', '^(?!create$).*$');
Route::get('/competitions', [CompetitionWebController::class, 'index'])->name('competitions.index');
Route::get('/competitions/{slug}', [CompetitionWebController::class, 'show'])->name('competitions.show')->where('slug', '^(?!create$).*$');
Route::get('/matching', [MatchingWebController::class, 'index'])->name('matching.index');

Route::middleware(['auth'])->group(function () {
    Route::get('/onboarding', [OnboardingWebController::class, 'show'])->name('onboarding');
    Route::post('/onboarding', [OnboardingWebController::class, 'store'])->name('onboarding.store');
    Route::post('/onboarding/skip', [OnboardingWebController::class, 'skip'])->name('onboarding.skip');
});

Route::middleware(['auth', 'profile.completed'])->group(function () {
    // Competition Hub Management, Team Formation & Workspace
    Route::get('/competitions/create', [CompetitionWebController::class, 'create'])->name('competitions.create');
    Route::post('/competitions', [CompetitionWebController::class, 'store'])->name('competitions.store');
    Route::post('/competitions/{id}/verify', [CompetitionWebController::class, 'verify'])->name('competitions.verify');
    Route::post('/competitions/{id}/participate', [CompetitionWebController::class, 'participate'])->name('competitions.participate');
    Route::post('/competitions/{id}/bookmark', [CompetitionWebController::class, 'toggleBookmark'])->name('competitions.bookmark');
    Route::post('/competitions/{id}/rounds', [CompetitionWebController::class, 'storeRound'])->name('competitions.rounds.store');
    Route::patch('/competitions/{id}/rounds/{roundId}', [CompetitionWebController::class, 'updateRound'])->name('competitions.rounds.update');
    Route::post('/competitions/{id}/allocate-student', [CompetitionWebController::class, 'allocateStudent'])->name('competitions.allocate-student');
    Route::post('/competition-allocations/{allocationId}/confirm', [CompetitionWebController::class, 'confirmAllocation'])->name('competitions.allocations.confirm');
    Route::post('/competition-allocations/{allocationId}/reject', [CompetitionWebController::class, 'rejectAllocation'])->name('competitions.allocations.reject');
    Route::post('/competition-invitations/{invitationId}/accept', [CompetitionWebController::class, 'acceptInvitation'])->name('competitions.invitations.accept');
    Route::post('/competition-invitations/{invitationId}/decline', [CompetitionWebController::class, 'declineInvitation'])->name('competitions.invitations.decline');

    // MinSatu Flow: Apply to Recruiting Competition Team & Process Applications
    Route::post('/competitions/teams/{participationId}/apply', [CompetitionWebController::class, 'applyTeam'])->name('competitions.teams.apply');
    Route::post('/competitions/teams/{participationId}/applications/{applicationId}/respond', [CompetitionWebController::class, 'respondApplication'])->name('competitions.teams.applications.respond');
    Route::post('/competition-workspace/{participationId}/roles', [CompetitionWebController::class, 'storeRecruitmentRole'])->name('competitions.roles.store');
    Route::delete('/competition-workspace/{participationId}/roles/{roleId}', [CompetitionWebController::class, 'deleteRecruitmentRole'])->name('competitions.roles.delete');

    // Dedicated Competition Preparation Workspace
    Route::get('/competitions/{slug}/workspace', [CompetitionWebController::class, 'workspace'])->name('competitions.workspace.slug');
    Route::get('/competition-workspace', [CompetitionWebController::class, 'workspaceIndex'])->name('competitions.workspace.index');
    Route::get('/competition-workspace/{participationId}', [CompetitionWebController::class, 'workspace'])->name('competitions.workspace');
    Route::post('/competition-workspace/{participationId}/stage', [CompetitionWebController::class, 'updateStage'])->name('competitions.stage.update');
    Route::match(['post', 'patch'], '/competitions/participations/{participationId}/stage', [CompetitionWebController::class, 'updateStage'])->name('competitions.participations.stage');
    Route::post('/competition-workspace/{participationId}/lock-formation', [CompetitionWebController::class, 'lockFormation'])->name('competitions.lock-formation');
    Route::post('/competition-workspace/{participationId}/invite-member', [CompetitionWebController::class, 'inviteCandidate'])->name('competitions.invite-member');
    Route::post('/competition-workspace/{participationId}/send-invitation', [CompetitionWebController::class, 'sendTeamInvitation'])->name('competitions.invitations.send');
    Route::post('/competition-workspace/{participationId}/formation/approve', [CompetitionWebController::class, 'approveFormation'])->name('competitions.formation.approve');
    Route::post('/competition-workspace/{participationId}/documents', [CompetitionWebController::class, 'uploadDocument'])->name('competitions.documents.upload');
    Route::post('/competition-workspace/{participationId}/documents/{docId}/review', [CompetitionWebController::class, 'reviewDocument'])->name('competitions.documents.review');
    Route::post('/competition-workspace/{participationId}/deliverables', [CompetitionWebController::class, 'submitDeliverable'])->name('competitions.deliverables.submit');
    Route::post('/competition-workspace/{participationId}/deliverables/{docId}/review', [CompetitionWebController::class, 'reviewDeliverable'])->name('competitions.deliverables.review');
    Route::post('/competition-workspace/{participationId}/members/{userId}/withdraw', [CompetitionWebController::class, 'withdrawMember'])->name('competitions.members.withdraw');
    Route::post('/competition-workspace/{participationId}/result', [CompetitionWebController::class, 'recordResult'])->name('competitions.result.record');
    Route::post('/competitions/participations/{participationId}/result', [CompetitionWebController::class, 'recordResult'])->name('competitions.participations.result');
    Route::post('/competition-workspace/{participationId}/result/verify', [CompetitionWebController::class, 'verifyResult'])->name('competitions.result.verify');
    Route::post('/competition-workspace/{participationId}/mentors', [CompetitionWebController::class, 'assignMentor'])->name('competitions.mentors.assign');
    Route::post('/competition-workspace/{participationId}/tasks', [CompetitionWebController::class, 'createTask'])->name('competitions.tasks.create');
    Route::post('/competition-workspace/{participationId}/tasks/ai-generate', [CompetitionWebController::class, 'generateTasksWithAi'])->name('competitions.tasks.ai-generate');
    Route::patch('/competition-workspace/{participationId}/tasks/{taskId}', [CompetitionWebController::class, 'updateTask'])->name('competitions.tasks.update');
    Route::get('/storage-download/{path}', [\App\Http\Controllers\Api\v1\UploadController::class, 'download'])->where('path', '.*')->name('storage.download');

    // Project Actions
    Route::get('/projects/create', [ProjectWebController::class, 'create'])->name('projects.create');
    Route::post('/projects', [ProjectWebController::class, 'store'])->name('projects.store');
    Route::post('/projects/{id}/apply', [ProjectWebController::class, 'apply'])->name('projects.apply');
    Route::post('/projects/{id}/applications/{appId}/respond', [ProjectWebController::class, 'respondApplication'])->name('projects.applications.respond');
    Route::post('/projects/{id}/activate-team', [ProjectWebController::class, 'activateTeam'])->name('projects.activate-team');
    Route::post('/projects/{id}/submit-final', [ProjectWebController::class, 'submitFinal'])->name('projects.submit-final');
    Route::post('/projects/{id}/evaluate', [ProjectWebController::class, 'evaluate'])->name('projects.evaluate');

    // Project Team Requirements & Formation Lifecycle
    Route::post('/projects/{id}/requirements', [ProjectWebController::class, 'updateRequirements'])->name('projects.requirements.update');
    Route::post('/projects/{id}/formation/open', [ProjectWebController::class, 'openMatchmaking'])->name('projects.formation.open');
    Route::post('/projects/{id}/formation/submit', [ProjectWebController::class, 'submitFormation'])->name('projects.formation.submit');
    Route::post('/projects/{id}/formation/review', [ProjectWebController::class, 'reviewFormation'])->name('projects.formation.review');
    Route::post('/projects/{id}/formation/activate-workspace', [ProjectWebController::class, 'activateWorkspace'])->name('projects.formation.activate-workspace');
    Route::post('/projects/{id}/invitations', [ProjectWebController::class, 'sendInvitation'])->name('projects.invitations.send');
    Route::post('/invitations/{id}/accept', [ProjectWebController::class, 'acceptInvitation'])->name('invitations.accept');
    Route::post('/invitations/{id}/decline', [ProjectWebController::class, 'declineInvitation'])->name('invitations.decline');
    Route::post('/invitations/{id}/cancel', [ProjectWebController::class, 'cancelInvitation'])->name('invitations.cancel');

    // Living Proposal Management (Continuous Development & Version History)
    Route::post('/projects/{id}/proposal/draft', [ProjectProposalWebController::class, 'saveDraft'])->name('projects.proposal.draft');
    Route::post('/projects/{id}/proposal/submit', [ProjectProposalWebController::class, 'submit'])->name('projects.proposal.submit');
    Route::post('/projects/{id}/proposal/revise', [ProjectProposalWebController::class, 'revise'])->name('projects.proposal.revise');
    Route::post('/projects/{id}/proposal/{versionId}/review', [ProjectProposalWebController::class, 'review'])->name('projects.proposal.review');
    Route::get('/projects/{id}/proposal/compare', [ProjectProposalWebController::class, 'compare'])->name('projects.proposal.compare');

    // UTS & UAS Assessment Periods & Immutable Snapshots
    Route::post('/projects/{id}/assessments/{periodId}/submit', [AssessmentWebController::class, 'submit'])->name('projects.assessments.submit');
    Route::post('/submissions/{id}/review', [AssessmentWebController::class, 'review'])->name('submissions.review');

    // Team Workspace
    Route::get('/workspace', [WorkspaceWebController::class, 'index'])->name('workspace.index');
    Route::get('/workspace/{teamId}', [WorkspaceWebController::class, 'show'])->name('workspace.show');
    Route::post('/workspace/{teamId}/orchestrate-roadmap', [WorkspaceWebController::class, 'orchestrateRoadmap'])->name('workspace.orchestrate-roadmap');
    Route::post('/workspace/{teamId}/tasks', [WorkspaceWebController::class, 'storeTask'])->name('workspace.tasks.store');
    Route::patch('/workspace/{teamId}/tasks/{taskId}', [WorkspaceWebController::class, 'updateTask'])->name('workspace.tasks.update');
    Route::delete('/workspace/{teamId}/tasks/{taskId}', [WorkspaceWebController::class, 'deleteTask'])->name('workspace.tasks.delete');
    Route::post('/workspace/{teamId}/evaluation', [WorkspaceWebController::class, 'saveEvaluation'])->name('workspace.evaluation.save');

    // Portfolio
    Route::get('/portfolio', [PortfolioWebController::class, 'index'])->name('portfolio.index');

    // Academic Classes (Kelas Kuliah & Bimbingan Dosen)
    Route::get('/classes', [AcademicClassWebController::class, 'index'])->name('classes.index');
    Route::post('/classes', [AcademicClassWebController::class, 'store'])->name('classes.store');
    Route::get('/classes/{code}', [AcademicClassWebController::class, 'show'])->name('classes.show');
    Route::post('/classes/join', [AcademicClassWebController::class, 'join'])->name('classes.join');
    Route::post('/classes/{id}/students', [AcademicClassWebController::class, 'addStudent'])->name('classes.students.add');
    Route::delete('/classes/{id}/students/{studentId}', [AcademicClassWebController::class, 'removeStudent'])->name('classes.students.remove');
    Route::post('/classes/{id}/guidance', [AcademicClassWebController::class, 'addGuidance'])->name('classes.guidance.store');
    Route::post('/classes/{id}/auto-form-teams', [AcademicClassWebController::class, 'autoFormTeams'])->name('classes.auto-form-teams');
    Route::post('/classes/{id}/invite-student', [AcademicClassWebController::class, 'inviteStudent'])->name('classes.invite-student');
    Route::post('/classes/{id}/simulate-allocation', [AcademicClassWebController::class, 'simulateAllocation'])->name('classes.simulate-allocation');
    Route::post('/classes/{id}/adjust-allocation/{sessionId}/{allocationId}', [AcademicClassWebController::class, 'adjustAllocation'])->name('classes.adjust-allocation');
    Route::post('/classes/{id}/approve-allocation/{sessionId}', [AcademicClassWebController::class, 'approveAllocation'])->name('classes.approve-allocation');
    Route::post('/classes/{id}/co-lecturers', [AcademicClassWebController::class, 'addCoLecturer'])->name('classes.co-lecturers.add');
    Route::delete('/classes/{id}/co-lecturers/{lecturerId}', [AcademicClassWebController::class, 'removeCoLecturer'])->name('classes.co-lecturers.remove');

    // Quick Role Switcher for Testing (Restricted to Campus / Platform Admin)
    Route::post('/switch-role', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        if (!$user->isCampusAdmin() && !$user->isPlatformAdmin()) {
            abort(403, 'Hanya administrator yang berwenang mengubah peran akun.');
        }
        $targetRole = $request->input('role', 'lecturer');
        $membership = $user->activeMembership();
        if ($membership) {
            $membership->update(['role' => $targetRole === 'lecturer' ? CampusRole::Lecturer->value : CampusRole::Student->value]);
        }
        return back()->with('success', 'Peran akun berhasil diubah menjadi: ' . ($targetRole === 'lecturer' ? 'Dosen' : 'Mahasiswa'));
    })->name('role.switch');

    // Campus / Platform Admin
    Route::prefix('admin')->group(function () {
        Route::get('/', [AdminWebController::class, 'index'])->name('admin.index');
        Route::get('/students', [AdminWebController::class, 'students'])->name('admin.students');
        Route::patch('/memberships/{id}/role', [AdminWebController::class, 'updateMemberRole'])->name('admin.memberships.role');
        Route::get('/notifications', [AdminNotificationWebController::class, 'index'])->name('admin.notifications.index');
        Route::post('/notifications/send-test', [AdminNotificationWebController::class, 'sendTestEmail'])->name('admin.notifications.send-test');
        Route::post('/notifications/retry/{id}', [AdminNotificationWebController::class, 'retryLog'])->name('admin.notifications.retry');

        // Admin Competitions Management & Deadline/Active Period Controls
        Route::get('/competitions', [AdminCompetitionWebController::class, 'index'])->name('admin.competitions.index');
        Route::post('/competitions', [AdminCompetitionWebController::class, 'store'])->name('admin.competitions.store');
        Route::put('/competitions/{id}', [AdminCompetitionWebController::class, 'update'])->name('admin.competitions.update');
        Route::patch('/competitions/{id}/status', [AdminCompetitionWebController::class, 'updateStatus'])->name('admin.competitions.status');
        Route::delete('/competitions/{id}', [AdminCompetitionWebController::class, 'destroy'])->name('admin.competitions.destroy');
    });

    // Central Notification Center
    Route::get('/notifications', [NotificationWebController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{id}/read', [NotificationWebController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::post('/notifications/read-all', [NotificationWebController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::delete('/notifications/{id}', [NotificationWebController::class, 'destroy'])->name('notifications.destroy');
    Route::post('/notifications/preferences', [NotificationWebController::class, 'updatePreferences'])->name('notifications.preferences.update');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
