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
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminWebController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $isAdmin = $user->isPlatformAdmin()
            || $user->isCampusAdmin()
            || ($membership && (
                $membership->role === CampusRole::CampusAdmin
                || $membership->role?->value === 'campus_admin'
                || (string) $membership->role === 'campus_admin'
            ));

        if (!$isAdmin) {
            abort(403, 'Akses terbatas untuk Administrator Kampus.');
        }

        $campusId = $user->isPlatformAdmin() ? null : $membership?->campus_id;

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
            'google_students' => (clone $studentsQuery)->whereHas('user', fn ($u) => $u->whereNotNull('google_id'))->count(),
            'total_feedback' => \App\Models\SystemFeedback::count(),
            'pending_feedback' => \App\Models\SystemFeedback::where('status', 'pending')->count(),
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

        $recentFeedbacks = \App\Models\SystemFeedback::with(['user:id,name,email,avatar'])
            ->latest()
            ->take(6)
            ->get()
            ->map(fn ($fb) => [
                'id' => $fb->id,
                'name' => $fb->name ?: ($fb->user?->name ?? 'Anonim'),
                'email' => $fb->email ?: ($fb->user?->email ?? '-'),
                'category' => $fb->category,
                'message' => $fb->message,
                'rating' => $fb->rating,
                'status' => $fb->status,
                'created_at' => $fb->created_at?->diffForHumans() ?? 'Baru saja',
            ]);

        return Inertia::render('admin/index', [
            'stats' => $stats,
            'pendingVerifications' => $pendingVerifications,
            'recentProjects' => $recentProjects,
            'recentFeedbacks' => $recentFeedbacks,
        ]);
    }

    public function students(Request $request): Response
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $isAdmin = $user->isPlatformAdmin()
            || $user->isCampusAdmin()
            || ($membership && (
                $membership->role === CampusRole::CampusAdmin
                || $membership->role?->value === 'campus_admin'
                || (string) $membership->role === 'campus_admin'
            ));

        if (!$isAdmin) {
            abort(403);
        }

        $campusId = $user->isPlatformAdmin() ? null : $membership?->campus_id;

        $query = CampusMembership::with(['user.profile', 'campus:id,name'])
            ->where('role', CampusRole::Student);

        if ($campusId) {
            $query->where('campus_id', $campusId);
        }

        if ($request->filled('status')) {
            $query->where('verification_status', $request->input('status'));
        }

        // Filter by auth provider (google / email)
        if ($request->input('auth_provider') === 'google') {
            $query->whereHas('user', fn ($u) => $u->whereNotNull('google_id'));
        } elseif ($request->input('auth_provider') === 'email') {
            $query->whereHas('user', fn ($u) => $u->whereNull('google_id'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->whereHas('user', fn ($u) => $u->where('name', 'like', $search)->orWhere('email', 'like', $search));
        }

        $students = $query->latest('id')->paginate(20)->withQueryString();

        $baseCountQuery = CampusMembership::where('role', CampusRole::Student);
        if ($campusId) {
            $baseCountQuery->where('campus_id', $campusId);
        }

        $studentStats = [
            'total' => (clone $baseCountQuery)->count(),
            'google_users' => (clone $baseCountQuery)->whereHas('user', fn ($u) => $u->whereNotNull('google_id'))->count(),
            'email_users' => (clone $baseCountQuery)->whereHas('user', fn ($u) => $u->whereNull('google_id'))->count(),
            'verified' => (clone $baseCountQuery)->where('verification_status', VerificationStatus::Verified)->count(),
            'unverified' => (clone $baseCountQuery)->where('verification_status', VerificationStatus::Unverified)->count(),
        ];

        return Inertia::render('admin/students', [
            'students' => $students,
            'stats' => $studentStats,
            'filters' => $request->only(['search', 'status', 'auth_provider']),
        ]);
    }

    /**
     * Admin Teams Management
     */
    public function teams(Request $request): Response
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $isAdmin = $user->isPlatformAdmin()
            || $user->isCampusAdmin()
            || ($membership && (
                $membership->role === CampusRole::CampusAdmin
                || $membership->role?->value === 'campus_admin'
                || (string) $membership->role === 'campus_admin'
            ));

        if (!$isAdmin) {
            abort(403, 'Akses terbatas untuk Administrator Kampus.');
        }

        $campusId = $user->isPlatformAdmin() ? null : $membership?->campus_id;

        $query = Team::query()
            ->with([
                'leader:id,name,email,avatar,google_id',
                'campus:id,name',
                'project:id,title,slug,status,category',
                'participations.competition:id,name,slug,status,category',
                'members.user:id,name,email,avatar,google_id',
            ])
            ->withCount('members');

        if ($campusId) {
            $query->where('campus_id', $campusId);
        }

        if ($request->input('status') === 'trashed') {
            $query->onlyTrashed();
        } elseif ($request->input('status') === 'all') {
            $query->withTrashed();
        }

        if ($request->filled('type') && in_array($request->input('type'), ['project', 'competition'])) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('description', 'like', $search)
                  ->orWhereHas('leader', fn ($u) => $u->where('name', 'like', $search)->orWhere('email', 'like', $search))
                  ->orWhereHas('project', fn ($p) => $p->where('title', 'like', $search))
                  ->orWhereHas('participations.competition', fn ($c) => $c->where('name', 'like', $search));
            });
        }

        $teams = $query->latest('id')->paginate(15)->withQueryString();

        $statsQuery = Team::query();
        if ($campusId) {
            $statsQuery->where('campus_id', $campusId);
        }

        $teamStats = [
            'total' => (clone $statsQuery)->count(),
            'project_teams' => (clone $statsQuery)->where('type', 'project')->count(),
            'competition_teams' => (clone $statsQuery)->where('type', 'competition')->count(),
            'trashed_teams' => Team::onlyTrashed()->when($campusId, fn ($q) => $q->where('campus_id', $campusId))->count(),
        ];

        return Inertia::render('admin/teams', [
            'teams' => $teams,
            'stats' => $teamStats,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    /**
     * Delete a team (Admin)
     */
    public function destroyTeam(Request $request, int $teamId): RedirectResponse
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $isAdmin = $user->isPlatformAdmin()
            || $user->isCampusAdmin()
            || ($membership && (
                $membership->role === CampusRole::CampusAdmin
                || $membership->role?->value === 'campus_admin'
                || (string) $membership->role === 'campus_admin'
            ));

        if (!$isAdmin) {
            abort(403, 'Akses terbatas untuk Administrator Kampus.');
        }

        $team = Team::withTrashed()->findOrFail($teamId);

        if (!$user->isPlatformAdmin() && $team->campus_id !== $membership?->campus_id) {
            abort(403, 'Anda tidak memiliki hak akses untuk kampus ini.');
        }

        $teamName = $team->name;

        DB::transaction(function () use ($team, $request) {
            // Close active recruitment if any
            if ($team->recruitment) {
                $team->recruitment->update(['status' => 'closed']);
                if ($request->boolean('force') || $team->trashed()) {
                    $team->recruitment->delete();
                }
            }

            if ($request->boolean('force') || $team->trashed()) {
                $team->members()->delete();
                $team->participations()->delete();
                $team->tasks()->delete();
                $team->milestones()->delete();
                $team->posts()->delete();
                $team->forceDelete();
            } else {
                $team->delete();
            }
        });

        $message = ($request->boolean('force') || $team->trashed())
            ? "Tim \"{$teamName}\" berhasil dihapus secara permanen."
            : "Tim \"{$teamName}\" berhasil dihapus.";

        return back()->with('success', $message);
    }

    /**
     * Restore a deleted team (Admin)
     */
    public function restoreTeam(Request $request, int $teamId): RedirectResponse
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $isAdmin = $user->isPlatformAdmin()
            || $user->isCampusAdmin()
            || ($membership && (
                $membership->role === CampusRole::CampusAdmin
                || $membership->role?->value === 'campus_admin'
                || (string) $membership->role === 'campus_admin'
            ));

        if (!$isAdmin) {
            abort(403);
        }

        $team = Team::onlyTrashed()->findOrFail($teamId);

        if (!$user->isPlatformAdmin() && $team->campus_id !== $membership?->campus_id) {
            abort(403);
        }

        $team->restore();

        return back()->with('success', "Tim \"{$team->name}\" berhasil dipulihkan.");
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
