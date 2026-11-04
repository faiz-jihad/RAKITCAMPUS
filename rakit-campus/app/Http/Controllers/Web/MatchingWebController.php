<?php

namespace App\Http\Controllers\Web;

use App\Enums\ProjectStatus;
use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Services\MatchingService;
use App\Services\Matchmaking\MatchmakingEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MatchingWebController extends Controller
{
    public function __construct(
        protected MatchmakingEngine $matchmakingEngine,
        protected MatchingService $matchingService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        // 1. Guest Handling: show live public recruiting projects with guest callout
        if (! $user) {
            $publicProjects = Project::where('moderation_status', 'visible')
                ->where('visibility', Visibility::Public->value)
                ->whereIn('status', [ProjectStatus::Recruiting->value, ProjectStatus::InProgress->value])
                ->with(['campus:id,name', 'team.recruitment.roles', 'skills'])
                ->latest()
                ->take(12)
                ->get();

            $recommendedData = $publicProjects->map(function ($p, $index) {
                $baseScore = max(72, 96 - ($index * 3));
                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'slug' => $p->slug,
                    'short_description' => $p->short_description,
                    'category' => $p->category?->label() ?? ($p->category?->value ?? 'Proyek'),
                    'campus_name' => $p->campus?->name ?? 'Politeknik Negeri Indramayu',
                    'tech_stack' => $p->tech_stack ?? [],
                    'status' => $p->status?->value ?? 'recruiting',
                    'open_roles_count' => $p->team?->recruitment?->roles?->count() ?? 0,
                    'open_roles' => $p->team?->recruitment?->roles?->pluck('name')->all() ?? [],
                    'match_score' => $baseScore,
                    'matched_skills' => $p->skills->pluck('name')->take(3)->all(),
                    'missing_skills' => [],
                    'role_compatibility' => 'Tersedia Rekrutmen',
                    'explanation' => 'Proyek terbuka ini aktif merekrut anggota. Masuk untuk kalkulasi skor kecocokan profil Anda.',
                    'breakdown' => [
                        'skills' => 88,
                        'roles' => 90,
                        'interests' => 85,
                        'experience' => 78,
                        'availability' => 80,
                    ],
                ];
            });

            return Inertia::render('matching/index', [
                'recommendedProjects' => $recommendedData,
                'myLedProjects' => [],
                'selectedProjectId' => 0,
                'candidates' => [],
                'profileCompletion' => null,
                'userSkills' => [],
                'isGuest' => true,
            ]);
        }

        // 2. Authenticated user handling
        $membership = $user->activeMembership();
        $profile = $user->profile()->with(['skills', 'experiences', 'campus'])->first();

        if (! $profile) {
            $campusId = $membership?->campus_id ?? Campus::where('slug', 'polindra')->value('id') ?? Campus::value('id');
            $profile = StudentProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'campus_id' => $campusId,
                    'slug' => Str::slug($user->name) . '-' . Str::random(4),
                    'bio' => 'Mahasiswa ' . ($membership?->campus?->name ?? 'Politeknik Negeri Indramayu'),
                ]
            );
            $profile->loadMissing(['skills', 'experiences', 'campus']);
        }

        $hasActiveProject = $user->hasActiveProject();
        $activeMembership = $user->activeProjectMembership();

        // Mode B: Smart Recommendation Engine
        $engineRecommendations = $this->matchmakingEngine->recommendProjectsForStudent($user, null, 15);

        // Projects where user is leader to find teammates
        $myLedProjects = Project::where('leader_id', $user->id)
            ->whereIn('status', [ProjectStatus::Recruiting->value, ProjectStatus::InProgress->value])
            ->with(['skills', 'team.recruitment.roles'])
            ->get();

        $selectedProjectId = (int) ($request->input('project_id') ?: ($myLedProjects->first()?->id ?? 0));
        $selectedProj = $selectedProjectId > 0 ? $myLedProjects->firstWhere('id', $selectedProjectId) : null;
        
        $engineCandidates = $selectedProj 
            ? $this->matchmakingEngine->recommendCandidatesForProject($selectedProj, 12)
            : [];

        // Format recommended projects using the 6-component scoring formula
        $recommendedData = collect($engineRecommendations)->map(function ($item) {
            $p = $item['project'];
            return [
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'short_description' => $p->short_description,
                'category' => $p->category?->label() ?? ($p->category?->value ?? 'Proyek'),
                'campus_name' => $p->campus?->name ?? 'Politeknik Negeri Indramayu',
                'tech_stack' => $p->tech_stack ?? [],
                'status' => $p->status?->value ?? 'recruiting',
                'open_roles_count' => $p->team?->recruitment?->roles?->count() ?? 0,
                'open_roles' => $p->team?->recruitment?->roles?->pluck('name')->all() ?? [],
                'match_score' => $item['match_score'],
                'matched_skills' => $item['matched_skills'] ?? [],
                'missing_skills' => $item['missing_skills'] ?? [],
                'complementary_skills' => $item['complementary_skills'] ?? [],
                'role_compatibility' => !empty($item['matched_roles']) ? implode(', ', $item['matched_roles']) : 'Rekomendasi Fleksibel',
                'explanation' => $item['explanation'] ?? 'Kecocokan dihitung secara adil berdasarkan keahlian, peran, minat, dan ketersediaan waktu Anda.',
                'breakdown' => [
                    'skills' => $item['breakdown']['skill'] ?? 70,
                    'roles' => $item['breakdown']['role'] ?? 70,
                    'interests' => $item['breakdown']['interest'] ?? 70,
                    'experience' => $item['breakdown']['fairness'] ?? 70,
                    'availability' => $item['breakdown']['availability'] ?? 70,
                    'diversity' => $item['breakdown']['diversity'] ?? 70,
                ],
            ];
        });

        // Format candidates
        $candidatesData = collect($engineCandidates)->map(function ($cand) {
            $u = $cand['user'];
            $st = $u->profile;
            return [
                'user_id' => $u->id,
                'profile_slug' => $st?->slug ?? ('user-' . $u->id),
                'name' => $u->name,
                'email' => $u->email,
                'avatar' => $u->avatar,
                'department' => $st?->department ?? 'Teknik',
                'study_program' => $st?->study_program ?? 'Teknik Informatika',
                'semester' => $st?->semester ?? 4,
                'headline' => $st?->headline ?? 'Mahasiswa Aktif',
                'bio' => $st?->bio,
                'availability_hours' => $st?->availability_hours ?? 10,
                'skills' => $st ? $st->skills->map(fn ($s) => [
                    'name' => $s->name,
                    'proficiency' => $s->pivot?->proficiency ?? 1,
                ])->all() : [],
                'preferred_roles' => $st?->preferred_roles ?? [],
                'score' => $cand['match_score'],
                'matched_skills' => $cand['matched_skills'] ?? [],
                'missing_skills' => $cand['missing_skills'] ?? [],
                'complementary_skills' => $cand['complementary_skills'] ?? [],
                'explanation' => $cand['explanation'] ?? 'Kandidat memiliki keahlian dan peran yang sesuai dengan kebutuhan proyek.',
                'breakdown' => $cand['breakdown'] ?? [],
            ];
        });

        $ledProjectsData = $myLedProjects->map(fn ($p) => [
            'id' => $p->id,
            'title' => $p->title,
            'slug' => $p->slug,
            'open_roles' => $p->team?->recruitment?->roles?->pluck('name')->all() ?? [],
        ]);

        return Inertia::render('matching/index', [
            'recommendedProjects' => $recommendedData->values(),
            'myLedProjects' => $ledProjectsData,
            'selectedProjectId' => $selectedProjectId,
            'candidates' => $candidatesData->values(),
            'profileCompletion' => $profile->completion(),
            'userSkills' => $profile->skills->pluck('name')->all(),
            'isGuest' => false,
            'hasActiveProject' => $hasActiveProject,
            'activeProject' => $activeMembership ? [
                'id' => $activeMembership->team?->project?->id,
                'title' => $activeMembership->team?->project?->title,
                'role_name' => $activeMembership->role_name,
            ] : null,
        ]);
    }
}
