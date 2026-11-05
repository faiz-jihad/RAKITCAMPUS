<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Matchmaking & Membership Configuration
    |--------------------------------------------------------------------------
    |
    | 'membership_mode':
    | - 'flexible': Default policy. Max 1 active academic project in Project Hub,
    |   AND max 1 active team per competition in Competition Hub. Students may
    |   participate in different competitions simultaneously.
    | - 'strict': Exactly 1 active activity across all modules.
    |
    */
    'membership_mode' => env('MATCHMAKING_MEMBERSHIP_MODE', 'flexible'),

    'weights' => [
        'skill_match' => 0.40,
        'role_fit' => 0.20,
        'availability' => 0.20,
        'fair_opportunity' => 0.20,
    ],
];
