<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Kasera Pay API Key
    |--------------------------------------------------------------------------
    |
    | Bearer token used to authenticate with Kasera Pay API.
    | Sandbox keys start with "kp_test_", while Production keys start with "kp_live_".
    |
    */
    'api_key' => env('KASERA_PAY_API_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Kasera Pay Webhook Secret
    |--------------------------------------------------------------------------
    |
    | Secret key used to verify HMAC-SHA256 signature in Kasera-Signature-V1 header.
    | Usually starts with "whsec_".
    |
    */
    'webhook_secret' => env('KASERA_PAY_WEBHOOK_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Base URL
    |--------------------------------------------------------------------------
    |
    | The base URL for the Kasera Pay API endpoint.
    | Defaults to https://pay.kasera.id
    |
    */
    'base_url' => env('KASERA_PAY_BASE_URL', 'https://pay.kasera.id'),

    /*
    |--------------------------------------------------------------------------
    | Environment
    |--------------------------------------------------------------------------
    |
    | Payment environment: "sandbox" or "production".
    |
    */
    'environment' => env('KASERA_PAY_ENVIRONMENT', 'sandbox'),

    /*
    |--------------------------------------------------------------------------
    | Webhook Timestamp Tolerance (Seconds)
    |--------------------------------------------------------------------------
    |
    | Maximum allowed age of the webhook timestamp to prevent replay attacks.
    | Default is 300 seconds (5 minutes).
    |
    */
    'webhook_tolerance' => (int) env('KASERA_PAY_WEBHOOK_TOLERANCE', 300),

    /*
    |--------------------------------------------------------------------------
    | HTTP Request Timeout (Seconds)
    |--------------------------------------------------------------------------
    |
    */
    'timeout' => (int) env('KASERA_PAY_TIMEOUT', 15),
];
