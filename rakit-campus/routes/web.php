<?php

use App\Enums\CampusRole;
use App\Http\Controllers\Web\AcademicClassWebController;
use App\Http\Controllers\Web\AdminWebController;
use App\Http\Controllers\Web\CompetitionWebController;
use App\Http\Controllers\Web\DashboardWebController;
use App\Http\Controllers\Web\MatchingWebController;
use App\Http\Controllers\Web\PortfolioWebController;
use App\Http\Controllers\Web\ProjectWebController;
use App\Http\Controllers\Web\WorkspaceWebController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/p/{slug}', [PortfolioWebController::class, 'publicView'])->name('portfolio.public');

// Public Discovery Hubs (Open for browsing, enriched when authenticated)
Route::get('/projects', [ProjectWebController::class, 'index'])->name('projects.index');
Route::get('/projects/{id}', [ProjectWebController::class, 'show'])->name('projects.show')->whereNumber('id');
Route::get('/competitions', [CompetitionWebController::class, 'index'])->name('competitions.index');
Route::get('/competitions/{id}', [CompetitionWebController::class, 'show'])->name('competitions.show')->whereNumber('id');
Route::get('/matching', [MatchingWebController::class, 'index'])->name('matching.index');

Route::middleware(['auth', 'profile.completed'])->group(function () {
    Route::get('/dashboard', [DashboardWebController::class, 'index'])->name('dashboard');

    // Project Actions
    Route::get('/projects/create', [ProjectWebController::class, 'create'])->name('projects.create');
    Route::post('/projects', [ProjectWebController::class, 'store'])->name('projects.store');
    Route::post('/projects/{id}/apply', [ProjectWebController::class, 'apply'])->name('projects.apply');
    Route::post('/projects/{id}/applications/{appId}/respond', [ProjectWebController::class, 'respondApplication'])->name('projects.applications.respond');

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
    Route::get('/classes/{id}', [AcademicClassWebController::class, 'show'])->name('classes.show')->whereNumber('id');
    Route::post('/classes/join', [AcademicClassWebController::class, 'join'])->name('classes.join');
    Route::post('/classes/{id}/students', [AcademicClassWebController::class, 'addStudent'])->name('classes.students.add');
    Route::delete('/classes/{id}/students/{studentId}', [AcademicClassWebController::class, 'removeStudent'])->name('classes.students.remove');
    Route::post('/classes/{id}/guidance', [AcademicClassWebController::class, 'addGuidance'])->name('classes.guidance.store');
    Route::post('/classes/{id}/auto-form-teams', [AcademicClassWebController::class, 'autoFormTeams'])->name('classes.auto-form-teams');
    Route::post('/classes/{id}/invite-student', [AcademicClassWebController::class, 'inviteStudent'])->name('classes.invite-student');
    Route::post('/classes/{id}/simulate-allocation', [AcademicClassWebController::class, 'simulateAllocation'])->name('classes.simulate-allocation');
    Route::post('/classes/{id}/approve-allocation/{sessionId}', [AcademicClassWebController::class, 'approveAllocation'])->name('classes.approve-allocation');

    // Quick Role Switcher for Testing (Mahasiswa <-> Dosen)
    Route::post('/switch-role', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
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
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
