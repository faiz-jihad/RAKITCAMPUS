<?php

return [

    /*
    |--------------------------------------------------------------------------
    | GitHub App Credentials
    |--------------------------------------------------------------------------
    |
    | RAKIT uses a GitHub App as the primary authentication mechanism for
    | repository contribution monitoring. The App private key is used to sign
    | RS256 JSON Web Tokens (JWT) to request installation access tokens.
    |
    */

    'app_id' => env('GITHUB_APP_ID'),

    'private_key' => env('GITHUB_APP_PRIVATE_KEY'),

    'private_key_path' => env('GITHUB_APP_PRIVATE_KEY_PATH'),

    'webhook_secret' => env('GITHUB_APP_WEBHOOK_SECRET'),

    'client_id' => env('GITHUB_APP_CLIENT_ID'),

    'client_secret' => env('GITHUB_APP_CLIENT_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Fallback Personal Access Token (Optional)
    |--------------------------------------------------------------------------
    |
    | When GitHub App credentials are not yet configured or for public repositories,
    | an optional personal access token can be used for API requests.
    |
    */

    'token' => env('GITHUB_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | API Base URL & User Agent
    |--------------------------------------------------------------------------
    */

    'api_url' => env('GITHUB_API_URL', 'https://api.github.com'),

    'user_agent' => env('GITHUB_USER_AGENT', 'RAKIT-Campus-Integration/1.0'),

    /*
    |--------------------------------------------------------------------------
    | Synchronization Limits & Timeouts
    |--------------------------------------------------------------------------
    */

    'sync' => [
        'timeout_seconds' => (int) env('GITHUB_SYNC_TIMEOUT', 45),
        'commits_per_page' => 100,
        'max_commit_pages' => (int) env('GITHUB_MAX_COMMIT_PAGES', 30), // up to 3000 commits per initial sync
        'prs_per_page' => 100,
        'max_pr_pages' => 10,
        'rate_limit_pause_threshold' => 10, // pause if remaining rate limit drops below 10
    ],

];
