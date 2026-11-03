<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\ProjectStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Competition;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    protected function authorizeAdmin(Request $request): int
    {
        $user = $request->user();
        if ($user->isPlatformAdmin()) {
            return $request->input('campus_id') ? (int) $request->input('campus_id') : 0;
        }

        $activeMembership = $user->activeMembership();
        if (!$activeMembership || $activeMembership->role !== CampusRole::CampusAdmin) {
            abort(403, 'Akses terbatas untuk Administrator Kampus.');
        }

        return $activeMembership->campus_id;
    }

    public function stats(Request $request): JsonResponse
    {
        $campusId = $this->authorizeAdmin($request);

        $studentsQuery = CampusMembership::where('role', CampusRole::Student);
        $projectsQuery = Project::query();
        $competitionsQuery = Competition::query();
        $teamsQuery = Team::query();

        if ($campusId > 0) {
            $studentsQuery->where('campus_id', $campusId);
            $projectsQuery->where('campus_id', $campusId);
            $competitionsQuery->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)->orWhereNull('campus_id');
            });
            $teamsQuery->where('campus_id', $campusId);
        }

        $totalStudents = (clone $studentsQuery)->count();
        $verifiedStudents = (clone $studentsQuery)->where('verification_status', VerificationStatus::Verified)->count();
        $unverifiedStudents = (clone $studentsQuery)->where('verification_status', VerificationStatus::Unverified)->count();

        $activeProjects = (clone $projectsQuery)->whereIn('status', [
            ProjectStatus::Recruiting->value,
            ProjectStatus::InProgress->value,
            ProjectStatus::TeamFormation->value,
        ])->count();
        $completedProjects = (clone $projectsQuery)->where('status', ProjectStatus::Completed->value)->count();

        $activeCompetitions = (clone $competitionsQuery)->whereIn('status', ['open', 'upcoming', 'ongoing'])->count();
        $totalTeams = (clone $teamsQuery)->count();

        return response()->json([
            'data' => [
                'students' => [
                    'total' => $totalStudents,
                    'verified' => $verifiedStudents,
                    'unverified' => $unverifiedStudents,
                ],
                'projects' => [
                    'active' => $activeProjects,
                    'completed' => $completedProjects,
                    'total' => (clone $projectsQuery)->count(),
                ],
                'competitions' => [
                    'active' => $activeCompetitions,
                    'total' => (clone $competitionsQuery)->count(),
                ],
                'teams' => [
                    'total' => $totalTeams,
                ],
            ],
        ]);
    }

    public function students(Request $request): JsonResponse
    {
        $campusId = $this->authorizeAdmin($request);

        $query = CampusMembership::with(['user.profile', 'campus:id,name'])
            ->where('role', CampusRole::Student);

        if ($campusId > 0) {
            $query->where('campus_id', $campusId);
        }

        if ($request->filled('status')) {
            $query->where('verification_status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->whereHas('user', fn ($u) => $u->where('name', 'like', $search)->orWhere('email', 'like', $search));
        }

        $students = $query->paginate(20);

        return response()->json($students);
    }

    public function verifyStudent(Request $request, int $membershipId): JsonResponse
    {
        $admin = $request->user();
        $campusId = $this->authorizeAdmin($request);

        $membership = CampusMembership::findOrFail($membershipId);
        if ($campusId > 0 && $membership->campus_id !== $campusId) {
            abort(403, 'Anda tidak memiliki hak akses untuk kampus ini.');
        }

        $validated = $request->validate([
            'status' => ['required', Rule::enum(VerificationStatus::class)],
            'student_number' => ['nullable', 'string', 'max:50'],
        ]);

        $membership->update([
            'verification_status' => $validated['status'],
            'student_number' => $validated['student_number'] ?? $membership->student_number,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        return response()->json([
            'message' => 'Status verifikasi mahasiswa berhasil diperbarui.',
            'data' => $membership,
        ]);
    }

    public function moderateProject(Request $request, int $projectId): JsonResponse
    {
        $campusId = $this->authorizeAdmin($request);
        $project = Project::findOrFail($projectId);

        if ($campusId > 0 && $project->campus_id !== $campusId) {
            abort(403);
        }

        $validated = $request->validate([
            'moderation_status' => ['required', 'in:visible,hidden'],
        ]);

        $project->update(['moderation_status' => $validated['moderation_status']]);

        return response()->json([
            'message' => 'Status moderasi proyek diperbarui.',
            'data' => $project,
        ]);
    }

    public function verifyCompetition(Request $request, int $competitionId): JsonResponse
    {
        $admin = $request->user();
        $competition = Competition::findOrFail($competitionId);

        $validated = $request->validate([
            'verification_status' => ['required', Rule::enum(VerificationStatus::class)],
        ]);

        $competition->update([
            'verification_status' => $validated['verification_status'],
            'last_verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        return response()->json([
            'message' => 'Status verifikasi kompetisi diperbarui.',
            'data' => $competition,
        ]);
    }
}
