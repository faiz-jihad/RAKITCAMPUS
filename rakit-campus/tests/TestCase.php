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
        ]);

        return $app;
    }
}

