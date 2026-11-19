<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\CompetitionResult;
use App\Models\ContributionRecord;
use App\Models\PortfolioItem;
use App\Models\StudentProfile;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioWebController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $achievements = Achievement::where('user_id', $user->id)
            ->with(['project:id,title,slug', 'participation.competition:id,name,slug'])
            ->latest('achieved_on')
            ->get();

        $competitionResults = CompetitionResult::whereHas('participation.team.members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['participation.competition:id,name,slug,level,category,cover_image,organizer', 'participation.team:id,name', 'verifier:id,name'])
            ->latest()
            ->get();

        $portfolioItems = PortfolioItem::where('user_id', $user->id)
            ->latest()
            ->get();

        $completedProjects = TeamMember::where('user_id', $user->id)
            ->whereHas('team.project', fn ($q) => $q->where('status', 'completed'))
            ->with('team.project')
            ->get();

        $profile = $user->profile()->with('skills')->first();
        $activeSubscription = $user->activeSubscription();
        $isPro = $user->isPro();

        return Inertia::render('portfolio/index', [
            'achievements' => $achievements,
            'competitionResults' => $competitionResults,
            'portfolioItems' => $portfolioItems,
            'completedProjects' => $completedProjects,
            'profile' => $profile,
            'isPro' => $isPro,
            'activeSubscription' => $activeSubscription,
        ]);
    }

    public function publicView(Request $request, string $slug): Response
    {
        $profile = StudentProfile::with(['user', 'skills', 'experiences', 'campus'])
            ->where('slug', $slug)
            ->firstOrFail();

        $viewer = $request->user();
        $isOwner = $viewer && $viewer->id === $profile->user_id;
        $isTeamReviewer = false;

        if ($viewer && !$profile->portfolio_public && !$isOwner) {
            $isTeamReviewer = \App\Models\Application::where('user_id', $profile->user_id)
                ->whereHas('recruitment.team', function ($q) use ($viewer) {
                    $q->where('leader_id', $viewer->id)
                        ->orWhereHas('members', fn ($mq) => $mq->where('user_id', $viewer->id));
                })->exists();
        }

        if (!$profile->portfolio_public && !$isOwner && !$isTeamReviewer && !($viewer && method_exists($viewer, 'hasRole') && $viewer->hasRole('admin'))) {
            abort(403, 'Portfolio ini belum disetel publik oleh mahasiswa terkait.');
        }

        $userId = $profile->user_id;

        $achievements = Achievement::where('user_id', $userId)
            ->when(!$isOwner && !$isTeamReviewer, fn ($q) => $q->where('is_public', true))
            ->with(['project:id,title,slug', 'participation.competition:id,name,slug'])
            ->latest('achieved_on')
            ->get();

        $items = PortfolioItem::where('user_id', $userId)
            ->when(!$isOwner && !$isTeamReviewer, fn ($q) => $q->where('is_public', true))
            ->latest()
            ->get();

        $myLeadingTeams = [];
        if ($viewer) {
            $myLeadingTeams = \App\Models\Team::where('leader_id', $viewer->id)
                ->with([
                    'competitionParticipation.competition:id,name,slug,level,category',
                    'project:id,title,slug',
                    'members:id,team_id,user_id',
                ])
                ->get()
                ->map(function ($t) use ($profile) {
                    $isMember = $t->members->contains('user_id', $profile->user_id);
                    $comp = $t->competitionParticipation?->competition;
                    $proj = $t->project;
                    return [
                        'id' => $t->id,
                        'name' => $t->name,
                        'type' => $comp ? 'competition' : ($proj ? 'project' : 'general'),
                        'context_title' => $comp?->name ?? ($proj?->title ?? 'Tim Kolaborasi'),
                        'participation_id' => $t->competitionParticipation?->id,
                        'is_candidate_member' => $isMember,
                        'is_formation_locked' => (bool) ($t->competitionParticipation?->is_formation_locked ?? false),
                    ];
                })
                ->filter(fn ($t) => !$t['is_candidate_member'] && !$t['is_formation_locked'])
                ->values();
        }

        return Inertia::render('portfolio/public', [
            'profile' => $profile,
            'achievements' => $achievements,
            'items' => $items,
            'myLeadingTeams' => $myLeadingTeams,
            'isOwner' => $isOwner,
        ]);
    }

    /**
     * Send in-app collaboration invitation or team invitation to a portfolio member.
     */
    public function inviteCollaborator(Request $request)
    {
        $viewer = $request->user();
        if (!$viewer) {
            return redirect()->route('login')->with('error', 'Silakan login terlebih dahulu untuk mengajak kolaborasi.');
        }

        $validated = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'team_id' => ['nullable', 'exists:teams,id'],
            'role_name' => ['required', 'string', 'max:100'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $candidate = \App\Models\User::findOrFail($validated['student_id']);
        if ($candidate->id === $viewer->id) {
            return back()->with('error', 'Anda tidak dapat mengundang diri sendiri.');
        }

        $teamId = $validated['team_id'] ?? null;
        $roleName = trim($validated['role_name']);
        $message = trim($validated['message'] ?? '');

        if ($teamId) {
            $team = \App\Models\Team::with(['competitionParticipation.competition', 'project'])->findOrFail($teamId);
            if (!$team->isLeader($viewer)) {
                return back()->with('error', 'Hanya ketua tim yang berwenang mengirimkan undangan tim.');
            }

            if ($team->hasMember($candidate)) {
                return back()->with('error', "{$candidate->name} sudah bergabung dalam tim ini.");
            }

            if ($team->competitionParticipation) {
                $participation = $team->competitionParticipation;
                if ($participation->is_formation_locked) {
                    return back()->with('error', 'Susunan tim kompetisi ini telah dikunci.');
                }

                $teamFormationService = app(\App\Services\Matchmaking\CompetitionTeamFormationService::class);
                $teamFormationService->sendInvitation(
                    $participation,
                    $viewer,
                    $candidate,
                    $roleName,
                    $message ?: null
                );
            } else {
                $invitationService = app(\App\Services\Matchmaking\InvitationService::class);
                $invitationService->sendInvitation(
                    $team,
                    $viewer,
                    $candidate,
                    $roleName,
                    $message ?: 'Mengajak Anda berkolaborasi dalam tim proyek kami.'
                );
            }

            return back()->with('success', "Undangan resmi bergabung ke tim '{$team->name}' telah berhasil dikirim kepada {$candidate->name}!");
        }

        // Direct in-app collaboration notification
        $notificationService = app(\App\Services\Notifications\NotificationService::class);
        $viewerSlug = $viewer->profile?->slug;
        $actionUrl = $viewerSlug ? url("/portfolio/{$viewerSlug}") : url("/dashboard");

        $notificationService->notify(
            recipients: $candidate,
            notificationType: 'collaboration_request',
            category: \App\Services\Notifications\NotificationPreferenceService::CATEGORY_COMPETITION_HUB,
            title: "Ajakan Kolaborasi dari {$viewer->name}",
            message: "{$viewer->name} tertarik dengan portofolio Anda dan ingin mengajak kolaborasi untuk peran {$roleName}." . ($message ? " Pesan: \"{$message}\"" : ""),
            options: [
                'priority' => 'high',
                'action_url' => $actionUrl,
                'action_text' => 'Lihat Profil Pengundang',
                'details' => [
                    'Pengundang' => $viewer->name,
                    'Peran yang Ditawarkan' => $roleName,
                    'Pesan Khusus' => $message ?: 'Mari berkolaborasi bersama.',
                ],
            ]
        );

        return back()->with('success', "Ajakan kolaborasi berhasil dikirim kepada {$candidate->name} melalui notifikasi internal aplikasi.");
    }
}
