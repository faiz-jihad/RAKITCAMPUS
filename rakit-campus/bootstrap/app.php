<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        channels: __DIR__.'/../routes/channels.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');
        $middleware->statefulApi();
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'api/v1/*',
            'api/v1/integrations/github/webhook',
        ]);
        $middleware->redirectTo(
            guests: '/login',
            users: '/dashboard'
        );
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->alias([
            'profile.completed' => \App\Http\Middleware\EnsureStudentProfileCompleted::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, Request $request) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', 'Sesi Anda telah diperbarui. Silakan coba kembali.');
            }
            if ($request->expectsJson()) {
                return response()->json(['message' => 'CSRF token mismatch. Silakan muat ulang halaman.'], 419);
            }
            return redirect()->back()->with('error', 'Sesi Anda telah kedaluwarsa. Silakan coba kembali.');
        });
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect()->guest(route('login'));
        });
    })->create();
