<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Strict Eloquent check: Disallow N+1 and lazy loading in non-production environments
        Model::preventLazyLoading(! $this->app->isProduction());

        if ($this->app->environment('production') || request()->header('X-Forwarded-Proto') === 'https') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}
