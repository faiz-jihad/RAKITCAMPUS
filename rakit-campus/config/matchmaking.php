<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Matchmaking & Membership Configuration
    |--------------------------------------------------------------------------
    |
    | 'membership_mode':
    | - 'strict': Exactly 1 active activity across both Project Hub and Competition Hub.
    | - 'flexible': Max 1 active academic project AND max 1 active competition concurrently.
    |
    */
    'membership_mode' => env('MATCHMAKING_MEMBERSHIP_MODE', 'strict'),

    'weights' => [
        'skill_match' => 0.40,
        'role_fit' => 0.20,
        'availability' => 0.20,
        'fair_opportunity' => 0.20,
    ],
];
