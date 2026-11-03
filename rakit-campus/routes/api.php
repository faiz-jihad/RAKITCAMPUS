<?php

use App\Http\Controllers\Api\v1\AdminController;
use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\CompetitionController;
use App\Http\Controllers\Api\v1\MatchingController;
use App\Http\Controllers\Api\v1\NotificationController;
use App\Http\Controllers\Api\v1\PortfolioController;
use App\Http\Controllers\Api\v1\ProfileController;
use App\Http\Controllers\Api\v1\ProjectController;
use App\Http\Controllers\Api\v1\RecruitmentController;
use App\Http\Controllers\Api\v1\TeamWorkspaceController;
use App\Http\Controllers\Api\v1\UploadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — RAKIT Campus v1
|--------------------------------------------------------------------------
| All mobile application (Flutter) and third-party integrations communicate
| via these versioned REST endpoints authenticated with Laravel Sanctum tokens.
*/

Route::prefix('v1')->group(function () {

    // Public / Guest Auth
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Public Profiles & Portfolios
    Route::get('/students/{identifier}', [ProfileController::class, 'publicProfile']);
    Route::get('/portfolio/public/{slug}', [PortfolioController::class, 'publicPortfolio']);

    // Authenticated Endpoints (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {

        // Session & Current User
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Student Profile & Skills
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::patch('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/skills', [ProfileController::class, 'syncSkills']);
        Route::post('/profile/experiences', [ProfileController::class, 'addExperience']);
        Route::delete('/profile/experiences/{id}', [ProfileController::class, 'deleteExperience']);

        // Project Hub
        Route::get('/projects', [ProjectController::class, 'index']);
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::get('/projects/{id}', [ProjectController::class, 'show']);
        Route::patch('/projects/{id}', [ProjectController::class, 'update']);
        Route::post('/projects/{id}/bookmark', [ProjectController::class, 'toggleBookmark']);
        Route::post('/projects/{id}/complete', [ProjectController::class, 'complete']);

        // Competition Hub
        Route::get('/competitions', [CompetitionController::class, 'index']);
        Route::post('/competitions', [CompetitionController::class, 'store']);
        Route::get('/competitions/{id}', [CompetitionController::class, 'show']);
        Route::post('/competitions/{id}/participate', [CompetitionController::class, 'participate']);
        Route::post('/competitions/{id}/bookmark', [CompetitionController::class, 'toggleBookmark']);

        // Smart Team Matching
        Route::get('/matching/candidates', [MatchingController::class, 'candidates']);
        Route::get('/matching/projects', [MatchingController::class, 'recommendedProjects']);
        Route::get('/matching/analyze', [MatchingController::class, 'analyze']);

        // Recruitment & Applications
        Route::get('/recruitments/{id}', [RecruitmentController::class, 'show']);
        Route::post('/teams/{teamId}/recruitment', [RecruitmentController::class, 'manage']);
        Route::post('/recruitments/{id}/apply', [RecruitmentController::class, 'apply']);
        Route::get('/recruitments/{id}/applications', [RecruitmentController::class, 'applications']);
        Route::patch('/applications/{id}/decide', [RecruitmentController::class, 'decideApplication']);
        Route::post('/invitations', [RecruitmentController::class, 'invite']);
        Route::get('/invitations/me', [RecruitmentController::class, 'myInvitations']);
        Route::patch('/invitations/{id}/respond', [RecruitmentController::class, 'respondInvitation']);

        // Team Workspace
        Route::get('/teams/{id}/overview', [TeamWorkspaceController::class, 'overview']);
        Route::get('/teams/{id}/kanban', [TeamWorkspaceController::class, 'kanban']);
        Route::post('/teams/{id}/tasks', [TeamWorkspaceController::class, 'storeTask']);
        Route::patch('/tasks/{id}', [TeamWorkspaceController::class, 'updateTask']);
        Route::delete('/tasks/{id}', [TeamWorkspaceController::class, 'deleteTask']);
        Route::post('/tasks/{id}/comments', [TeamWorkspaceController::class, 'addComment']);
        Route::get('/teams/{id}/milestones', [TeamWorkspaceController::class, 'milestones']);
        Route::post('/teams/{id}/milestones', [TeamWorkspaceController::class, 'storeMilestone']);
        Route::get('/teams/{id}/posts', [TeamWorkspaceController::class, 'posts']);
        Route::post('/teams/{id}/posts', [TeamWorkspaceController::class, 'storePost']);

        // Portfolio & Achievements
        Route::get('/portfolio/me', [PortfolioController::class, 'me']);
        Route::post('/portfolio/items', [PortfolioController::class, 'storeItem']);
        Route::delete('/portfolio/items/{id}', [PortfolioController::class, 'deleteItem']);

        // In-App Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

        // File Uploads
        Route::post('/uploads', [UploadController::class, 'store']);

        // Campus / Platform Admin
        Route::prefix('admin')->group(function () {
            Route::get('/stats', [AdminController::class, 'stats']);
            Route::get('/students', [AdminController::class, 'students']);
            Route::patch('/students/{id}/verify', [AdminController::class, 'verifyStudent']);
            Route::patch('/projects/{id}/moderate', [AdminController::class, 'moderateProject']);
            Route::patch('/competitions/{id}/verify', [AdminController::class, 'verifyCompetition']);
        });
    });
});
