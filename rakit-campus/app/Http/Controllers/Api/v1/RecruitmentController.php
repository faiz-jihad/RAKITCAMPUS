<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\ApplicationStatus;
use App\Enums\InvitationStatus;
use App\Enums\RecruitmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Invitation;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Team;
use App\Models\User;
use App\Services\MatchingService;
use App\Services\RecruitmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RecruitmentController extends Controller
{
    public function __construct(
        protected RecruitmentService $recruitmentService,
        protected MatchingService $matchingService
    ) {}

    public function show(int $id): JsonResponse
    {
        $recruitment = Recruitment::with([
            'team.project',
            'team.members.user:id,name',
            'roles.members.user:id,name',
        ])->findOrFail($id);

        return response()->json([
            'data' => $recruitment,
        ]);
    }

    public function manage(Request $request, int $teamId): JsonResponse
    {
        $user = $request->user();
        $team = Team::with('project')->findOrFail($teamId);

        $this->authorize('manageRecruitment', $team);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::enum(RecruitmentStatus::class)],
            'closes_at' => ['nullable', 'date', 'after:now'],
            'roles' => ['nullable', 'array'],
            'roles.*.name' => ['required', 'string', 'max:80'],
            'roles.*.slots' => ['required', 'integer', 'min:1', 'max:10'],
            'roles.*.requirements' => ['nullable', 'string', 'max:500'],
        ]);

        $recruitment = DB::transaction(function () use ($validated, $team) {
            $rec = Recruitment::updateOrCreate(
                ['team_id' => $team->id],
                [
                    'campus_id' => $team->campus_id,
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'status' => $validated['status'],
                    'closes_at' => $validated['closes_at'] ?? null,
                ]
            );

            if (isset($validated['roles'])) {
                // Keep roles synchronized
                $existingRoleIds = [];
                foreach ($validated['roles'] as $r) {
                    $role = RecruitmentRole::updateOrCreate(
                        ['recruitment_id' => $rec->id, 'name' => $r['name']],
                        ['slots' => $r['slots'], 'requirements' => $r['requirements'] ?? null]
                    );
                    $existingRoleIds[] = $role->id;
                }
            }

            return $rec->load('roles');
        });

        return response()->json([
            'message' => 'Pengaturan recruitment berhasil disimpan.',
            'data' => $recruitment,
        ]);
    }

    public function apply(Request $request, int $recruitmentId): JsonResponse
    {
        $user = $request->user();
        $recruitment = Recruitment::findOrFail($recruitmentId);

        $validated = $request->validate([
            'recruitment_role_id' => ['nullable', 'exists:recruitment_roles,id'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $application = $this->recruitmentService->apply(
            $user,
            $recruitment,
            $validated['recruitment_role_id'] ?? null,
            $validated['message'] ?? null
        );

        return response()->json([
            'message' => 'Lamaran berhasil dikirim.',
            'data' => $application,
        ], 201);
    }

    public function applications(Request $request, int $recruitmentId): JsonResponse
    {
        $user = $request->user();
        $recruitment = Recruitment::with('team.project.skills')->findOrFail($recruitmentId);

        $this->authorize('manageRecruitment', $recruitment->team);

        $project = $recruitment->team->project;

        $applications = Application::where('recruitment_id', $recruitment->id)
            ->with(['user.profile.skills', 'role'])
            ->latest()
            ->get();

        $data = $applications->map(function (Application $app) use ($project) {
            $match = null;
            if ($project && $app->user->profile) {
                $match = $this->matchingService->matchStudentToProject($app->user->profile, $project);
            }

            return [
                'id' => $app->id,
                'status' => $app->status->value,
                'message' => $app->message,
                'created_at' => $app->created_at->toIso8601String(),
                'role' => $app->role ? [
                    'id' => $app->role->id,
                    'name' => $app->role->name,
                ] : null,
                'applicant' => [
                    'id' => $app->user->id,
                    'name' => $app->user->name,
                    'study_program' => $app->user->profile?->study_program,
                    'semester' => $app->user->profile?->semester,
                    'skills' => $app->user->profile?->skills->map(fn ($s) => [
                        'name' => $s->name,
                        'proficiency' => $s->pivot->proficiency,
                    ]) ?? [],
                ],
                'match_score' => $match['match_score'] ?? null,
                'match_breakdown' => $match ? [
                    'matched_skills' => $match['matched_skills'],
                    'missing_skills' => $match['missing_skills'],
                    'explanation' => $match['explanation'],
                ] : null,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function decideApplication(Request $request, int $applicationId): JsonResponse
    {
        $user = $request->user();
        $application = Application::with('recruitment.team')->findOrFail($applicationId);

        $validated = $request->validate([
            'action' => ['required', 'in:accept,reject'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validated['action'] === 'accept') {
            $member = $this->recruitmentService->acceptApplication($application, $user, $validated['note'] ?? null);
            return response()->json([
                'message' => 'Aplikasi diterima. Mahasiswa telah resmi menjadi anggota tim.',
                'member' => $member,
            ]);
        } else {
            $this->recruitmentService->rejectApplication($application, $user, $validated['note'] ?? null);
            return response()->json([
                'message' => 'Aplikasi telah ditolak.',
            ]);
        }
    }

    public function invite(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'team_id' => ['required', 'exists:teams,id'],
            'invitee_id' => ['required', 'exists:users,id'],
            'recruitment_role_id' => ['nullable', 'exists:recruitment_roles,id'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $team = Team::findOrFail($validated['team_id']);
        $invitee = User::findOrFail($validated['invitee_id']);

        $invitation = $this->recruitmentService->invite(
            $user,
            $team,
            $invitee,
            $validated['recruitment_role_id'] ?? null,
            $validated['message'] ?? null
        );

        return response()->json([
            'message' => 'Undangan berhasil dikirim.',
            'data' => $invitation,
        ], 201);
    }

    public function myInvitations(Request $request): JsonResponse
    {
        $user = $request->user();
        $invitations = Invitation::where('invitee_id', $user->id)
            ->with(['team.project', 'team.leader:id,name', 'role'])
            ->latest()
            ->get();

        return response()->json(['data' => $invitations]);
    }

    public function respondInvitation(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $invitation = Invitation::findOrFail($id);

        $validated = $request->validate([
            'action' => ['required', 'in:accept,decline'],
        ]);

        if ($validated['action'] === 'accept') {
            $member = $this->recruitmentService->acceptInvitation($invitation, $user);
            return response()->json([
                'message' => 'Undangan diterima. Selamat datang di tim!',
                'data' => $member,
            ]);
        } else {
            $this->recruitmentService->declineInvitation($invitation, $user);
            return response()->json([
                'message' => 'Undangan ditolak.',
            ]);
        }
    }
}
