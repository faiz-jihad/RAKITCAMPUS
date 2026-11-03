<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\MatchingService;
use Illuminate\Http\Request;
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
        $profile = $user->profile()->with(['skills', 'experiences'])->first();

        $recommended = $profile
            ? $this->matchingService->recommendProjectsForStudent($profile, 10)
            : collect();

        // Projects where user is leader to find teammates
        $myLedProjects = Project::where('leader_id', $user->id)
            ->whereIn('status', ['recruiting', 'in_progress'])
            ->with(['skills', 'team.recruitment.roles'])
            ->get();

        $candidatesForLedProject = null;
        $selectedProjectId = $request->input('project_id');
        if ($selectedProjectId) {
            $selectedProj = $myLedProjects->firstWhere('id', (int) $selectedProjectId);
            if ($selectedProj) {
                $candidatesForLedProject = $this->matchingService->findCandidatesForProject($selectedProj, 10);
            }
        } elseif ($myLedProjects->isNotEmpty()) {
            $candidatesForLedProject = $this->matchingService->findCandidatesForProject($myLedProjects->first(), 10);
        }

        return Inertia::render('matching/index', [
            'recommendedProjects' => $recommended,
            'myLedProjects' => $myLedProjects,
            'candidates' => $candidatesForLedProject,
            'profileCompletion' => $profile?->completion(),
        ]);
    }
}
