<?php

namespace App\Http\Controllers\Web;

use App\Enums\CampusRole;
use App\Enums\ProjectStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Competition;
use App\Models\Project;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminWebController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $membership = $user->activeMembership();

        if (!$user->isPlatformAdmin() && (!$membership || $membership->role !== CampusRole::CampusAdmin)) {
            abort(403, 'Akses terbatas untuk Administrator Kampus.');
        }

        $campusId = $user->isPlatformAdmin() ? null : $membership->campus_id;

        $studentsQuery = CampusMembership::where('role', CampusRole::Student);
        $projectsQuery = Project::query();
        $competitionsQuery = Competition::query();
        $teamsQuery = Team::query();

        if ($campusId) {
            $studentsQuery->where('campus_id', $campusId);
            $projectsQuery->where('campus_id', $campusId);
            $competitionsQuery->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)->orWhereNull('campus_id');
            });
            $teamsQuery->where('campus_id', $campusId);
        }

        $stats = [
            'total_students' => (clone $studentsQuery)->count(),
            'verified_students' => (clone $studentsQuery)->where('verification_status', VerificationStatus::Verified)->count(),
            'unverified_students' => (clone $studentsQuery)->where('verification_status', VerificationStatus::Unverified)->count(),
            'active_projects' => (clone $projectsQuery)->whereIn('status', [
                ProjectStatus::Recruiting->value,
                ProjectStatus::InProgress->value,
            ])->count(),
            'completed_projects' => (clone $projectsQuery)->where('status', ProjectStatus::Completed->value)->count(),
            'active_competitions' => (clone $competitionsQuery)->whereIn('status', ['open', 'upcoming', 'ongoing'])->count(),
            'total_teams' => (clone $teamsQuery)->count(),
        ];

        $pendingVerifications = (clone $studentsQuery)
            ->where('verification_status', VerificationStatus::Unverified)
            ->with(['user', 'campus'])
            ->latest()
            ->take(8)
            ->get();

        $recentProjects = (clone $projectsQuery)
            ->with(['leader:id,name', 'campus:id,name'])
            ->latest()
            ->take(8)
            ->get();

        return Inertia::render('admin/index', [
            'stats' => $stats,
            'pendingVerifications' => $pendingVerifications,
            'recentProjects' => $recentProjects,
        ]);
    }

    public function students(Request $request): Response
    {
        $user = $request->user();
        $membership = $user->activeMembership();

        if (!$user->isPlatformAdmin() && (!$membership || $membership->role !== CampusRole::CampusAdmin)) {
            abort(403);
        }

        $campusId = $user->isPlatformAdmin() ? null : $membership->campus_id;

        $query = CampusMembership::with(['user.profile', 'campus:id,name'])
            ->where('role', CampusRole::Student);

        if ($campusId) {
            $query->where('campus_id', $campusId);
        }

        if ($request->filled('status')) {
            $query->where('verification_status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->whereHas('user', fn ($u) => $u->where('name', 'like', $search)->orWhere('email', 'like', $search));
        }

        $students = $query->paginate(20)->withQueryString();

        return Inertia::render('admin/students', [
            'students' => $students,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Update a user's campus role (e.g. promoting student to lecturer or vice-versa).
     * Restricted strictly to Campus Admins and Platform Admins.
     */
    public function updateMemberRole(Request $request, int $membershipId): RedirectResponse
    {
        $user = $request->user();
        $membership = $user->activeMembership();

        if (!$user->isPlatformAdmin() && (!$membership || $membership->role !== CampusRole::CampusAdmin)) {
            abort(403, 'Akses terbatas untuk Administrator Kampus.');
        }

        $targetMembership = CampusMembership::findOrFail($membershipId);

        if (!$user->isPlatformAdmin() && $targetMembership->campus_id !== $membership->campus_id) {
            abort(403, 'Anda tidak memiliki hak akses untuk kampus ini.');
        }

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:student,lecturer,campus_admin'],
        ]);

        $newRole = CampusRole::from($validated['role']);
        $targetMembership->update([
            'role' => $newRole,
        ]);

        return back()->with('success', 'Peran anggota ' . $targetMembership->user?->name . ' berhasil diubah menjadi: ' . $newRole->label());
    }
}
