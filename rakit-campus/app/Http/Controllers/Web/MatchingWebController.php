<?php

namespace App\Http\Controllers\Web;

use App\Enums\ProjectStatus;
use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Services\MatchingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MatchingWebController extends Controller
{
    public function __construct(
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
                    'headline' => 'Mahasiswa ' . ($membership?->campus?->name ?? 'Politeknik Negeri Indramayu'),
                ]
            );
            $profile->loadMissing(['skills', 'experiences', 'campus']);
        }

        $recommended = $this->matchingService->recommendProjectsForStudent($profile, 12);

        // Projects where user is leader to find teammates
        $myLedProjects = Project::where('leader_id', $user->id)
            ->whereIn('status', ['recruiting', 'in_progress'])
            ->with(['skills', 'team.recruitment.roles'])
            ->get();

        $selectedProjectId = (int) ($request->input('project_id') ?: ($myLedProjects->first()?->id ?? 0));
        $selectedProj = $selectedProjectId > 0 ? $myLedProjects->firstWhere('id', $selectedProjectId) : null;
        
        $candidatesForLedProject = $selectedProj 
            ? $this->matchingService->findCandidatesForProject($selectedProj, 12)
            : collect();

        // Format recommended projects
        $recommendedData = $recommended->map(function ($item) {
            $p = $item['project'];
            $m = $item['match'];
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
                'match_score' => (int) ($m['match_score'] ?? $item['score'] ?? 0),
                'matched_skills' => $m['matched_skills'] ?? [],
                'missing_skills' => $m['missing_skills'] ?? [],
                'role_compatibility' => $m['role_compatibility'] ?? 'Cocok',
                'explanation' => $m['explanation'] ?? 'Kecocokan berdasarkan profil dan keahlian Anda.',
                'breakdown' => $m['breakdown'] ?? [
                    'skills' => 0,
                    'roles' => 0,
                    'interests' => 0,
                    'experience' => 0,
                    'availability' => 0,
                ],
            ];
        });

        // Format candidates
        $candidatesData = $candidatesForLedProject->map(function ($cand) {
            $st = $cand['student'];
            $m = $cand['match'];
            return [
                'user_id' => $st->user_id,
                'profile_slug' => $st->slug,
                'name' => $st->user?->name ?? 'Mahasiswa',
                'email' => $st->user?->email,
                'avatar' => $st->user?->avatar,
                'department' => $st->department ?? 'Teknik',
                'study_program' => $st->study_program ?? 'Teknik Informatika',
                'semester' => $st->semester ?? 4,
                'headline' => $st->headline ?? 'Mahasiswa Aktif',
                'bio' => $st->bio,
                'availability_hours' => $st->availability_hours ?? 10,
                'skills' => $st->skills->map(fn ($s) => [
                    'name' => $s->name,
                    'proficiency' => $s->pivot?->proficiency ?? 1,
                ])->all(),
                'preferred_roles' => $st->preferred_roles ?? [],
                'score' => (int) ($m['match_score'] ?? $cand['score'] ?? 0),
                'matched_skills' => $m['matched_skills'] ?? [],
                'missing_skills' => $m['missing_skills'] ?? [],
                'explanation' => $m['explanation'] ?? 'Kandidat memiliki keahlian relevan.',
                'breakdown' => $m['breakdown'] ?? [],
            ];
        });

        $ledProjectsData = $myLedProjects->map(fn ($p) => [
            'id' => $p->id,
            'title' => $p->title,
            'slug' => $p->slug,
            'open_roles' => $p->team?->recruitment?->roles?->pluck('name')->all() ?? [],
        ]);

        return Inertia::render('matching/index', [
            'recommendedProjects' => $recommendedData,
            'myLedProjects' => $ledProjectsData,
            'selectedProjectId' => $selectedProjectId,
            'candidates' => $candidatesData,
            'profileCompletion' => $profile->completion(),
            'userSkills' => $profile->skills->pluck('name')->all(),
            'isGuest' => false,
        ]);
    }
}
