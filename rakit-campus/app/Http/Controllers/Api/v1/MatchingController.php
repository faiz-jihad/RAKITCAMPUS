<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Services\MatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchingController extends Controller
{
    public function __construct(
        protected MatchingService $matchingService
    ) {}

    public function candidates(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => ['required', 'exists:projects,id'],
        ]);

        $project = Project::with(['skills', 'team.members', 'campus'])->findOrFail($request->project_id);
        $this->authorize('update', $project);

        $candidates = $this->matchingService->findCandidatesForProject($project, (int) $request->input('limit', 10));

        return response()->json([
            'data' => $candidates->map(function ($item) {
                return [
                    'student' => [
                        'id' => $item['student']->id,
                        'name' => $item['student']->user?->name,
                        'study_program' => $item['student']->study_program,
                        'semester' => $item['student']->semester,
                        'bio' => $item['student']->bio,
                        'avatar' => $item['student']->photo_path,
                        'skills' => $item['student']->skills->map(fn ($s) => [
                            'name' => $s->name,
                            'proficiency' => $s->pivot->proficiency,
                        ]),
                    ],
                    'match_score' => $item['score'],
                    'matched_skills' => $item['match']['matched_skills'],
                    'missing_skills' => $item['match']['missing_skills'],
                    'role_compatibility' => $item['match']['role_compatibility'],
                    'explanation' => $item['match']['explanation'],
                    'breakdown' => $item['match']['breakdown'],
                ];
            }),
        ]);
    }

    public function recommendedProjects(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->profile()->with(['skills', 'experiences'])->firstOrFail();

        $recommended = $this->matchingService->recommendProjectsForStudent($profile, (int) $request->input('limit', 10));

        return response()->json([
            'data' => $recommended->map(function ($item) {
                return [
                    'project' => [
                        'id' => $item['project']->id,
                        'title' => $item['project']->title,
                        'slug' => $item['project']->slug,
                        'short_description' => $item['project']->short_description,
                        'category' => $item['project']->category->value,
                        'leader' => $item['project']->leader?->name,
                        'campus' => $item['project']->campus?->name,
                        'status' => $item['project']->status->value,
                    ],
                    'match_score' => $item['score'],
                    'matched_skills' => $item['match']['matched_skills'],
                    'missing_skills' => $item['match']['missing_skills'],
                    'explanation' => $item['match']['explanation'],
                    'breakdown' => $item['match']['breakdown'],
                ];
            }),
        ]);
    }

    public function analyze(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => ['required', 'exists:projects,id'],
            'student_id' => ['required', 'exists:student_profiles,id'],
        ]);

        $project = Project::findOrFail($request->project_id);
        $student = StudentProfile::findOrFail($request->student_id);

        $analysis = $this->matchingService->matchStudentToProject($student, $project);

        return response()->json([
            'data' => $analysis,
        ]);
    }
}
