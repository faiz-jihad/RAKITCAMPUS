<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(
            \App\Contracts\Feedback\FeedbackServiceInterface::class,
            \App\Services\Feedback\FeedbackService::class
        );

        $this->app->singleton(
            \App\Contracts\Workspace\TaskServiceInterface::class,
            \App\Services\Workspace\TaskService::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Strict Eloquent check: Disallow N+1 and lazy loading in non-production environments
        Model::preventLazyLoading(! $this->app->isProduction());

        $this->configureRateLimiting();
    }

    /**
     * Configure application rate limiters.
     *
     * Protects heavy endpoints from being hammered by individual users.
     * At 100-200 concurrent users, limiting per-user (not global) is correct:
     * you want to allow many users while throttling any single abuser.
     */
    protected function configureRateLimiting(): void
    {
        // Dashboard — heavy page, max 30 hits/minute per user (1 req/2s sustained)
        RateLimiter::for('dashboard', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // AI workspace — expensive LLM calls
        RateLimiter::for('ai', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Matchmaking — CPU intensive scoring
        RateLimiter::for('matchmaking', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        // General API — applied to authenticated API routes
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });
    }
}

