<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $dbPath = dirname(__DIR__) . '/database/testing.sqlite';
        if (! file_exists($dbPath)) {
            @touch($dbPath);
        }

        putenv('APP_ENV=testing');
        $_ENV['APP_ENV'] = 'testing';
        $_SERVER['APP_ENV'] = 'testing';

        putenv('DB_CONNECTION=sqlite');
        putenv('DB_DATABASE='.$dbPath);
        $_ENV['DB_CONNECTION'] = 'sqlite';
        $_ENV['DB_DATABASE'] = $dbPath;
        $_SERVER['DB_CONNECTION'] = 'sqlite';
        $_SERVER['DB_DATABASE'] = $dbPath;

        $app = parent::createApplication();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => $dbPath,
            'inertia.testing.page_paths' => [resource_path('js/pages')],
        ]);

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
    }

    protected function migrateFreshUsing()
    {
        return [
            '--drop-views' => true,
            '--force' => true,
        ];
    }
}

