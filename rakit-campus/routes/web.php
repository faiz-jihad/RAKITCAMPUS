<?php

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

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardWebController::class, 'index'])->name('dashboard');

    // Project Hub
    Route::get('/projects', [ProjectWebController::class, 'index'])->name('projects.index');
    Route::get('/projects/create', [ProjectWebController::class, 'create'])->name('projects.create');
    Route::get('/projects/{id}', [ProjectWebController::class, 'show'])->name('projects.show');

    // Competition Hub
    Route::get('/competitions', [CompetitionWebController::class, 'index'])->name('competitions.index');
    Route::get('/competitions/{id}', [CompetitionWebController::class, 'show'])->name('competitions.show');

    // Smart Team Matching
    Route::get('/matching', [MatchingWebController::class, 'index'])->name('matching.index');

    // Team Workspace
    Route::get('/workspace', [WorkspaceWebController::class, 'index'])->name('workspace.index');
    Route::get('/workspace/{teamId}', [WorkspaceWebController::class, 'show'])->name('workspace.show');

    // Portfolio
    Route::get('/portfolio', [PortfolioWebController::class, 'index'])->name('portfolio.index');

    // Campus / Platform Admin
    Route::prefix('admin')->group(function () {
        Route::get('/', [AdminWebController::class, 'index'])->name('admin.index');
        Route::get('/students', [AdminWebController::class, 'students'])->name('admin.students');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
