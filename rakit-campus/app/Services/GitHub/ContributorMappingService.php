<?php

namespace App\Services\GitHub;

use App\Models\GitHub\GitHubContributor;
use App\Models\GitHub\GitHubMemberMapping;
use App\Models\GitHub\GitHubRepository;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ContributorMappingService
{
    /**
     * Automatically resolve or maintain mapping between a GitHub contributor and a Workspace team member.
     *
     * Prioritization:
     * 1. Existing manual mapping (preserves admin decisions)
     * 2. GitHub account ID or username matching against workspace member's profile
     * 3. Verified commit email matching against workspace member user emails
     * 4. Fallback to unmapped record (user_id = null)
     *
     * (Never matches solely based on display names)
     */
    public function autoMapContributor(GitHubContributor $contributor, Team $team): GitHubMemberMapping
    {
        $existing = GitHubMemberMapping::where('github_repository_id', $contributor->github_repository_id)
            ->where('github_contributor_id', $contributor->id)
            ->first();

        // If already manually mapped by an admin, do not override
        if ($existing && $existing->mapping_type === 'manual' && $existing->user_id) {
            return $existing;
        }

        // Get team member users with their profiles
        $teamMembers = $team->members()->with(['user.profile'])->get();
        $matchedUser = null;
        $matchedTeamMember = null;
        $mappingType = 'manual';
        $confidence = 'manual';

        // 1. Check match by GitHub Login / Account
        if (! empty($contributor->login)) {
            foreach ($teamMembers as $tm) {
                $user = $tm->user;
                if (! $user) continue;

                $profileGithub = $user->profile?->github_url;
                if ($profileGithub) {
                    $cleanUsername = strtolower(trim(basename($profileGithub)));
                    if ($cleanUsername === strtolower($contributor->login)) {
                        $matchedUser = $user;
                        $matchedTeamMember = $tm;
                        $mappingType = 'github_id';
                        $confidence = 'high';
                        break;
                    }
                }
            }
        }

        // 2. Check match by Verified Commit Email
        if (! $matchedUser && ! empty($contributor->email)) {
            $contributorEmail = strtolower(trim($contributor->email));

            // Ignore GitHub no-reply emails for email matching (handled by login check)
            if (! str_contains($contributorEmail, 'users.noreply.github.com')) {
                foreach ($teamMembers as $tm) {
                    $user = $tm->user;
                    if (! $user) continue;

                    if (strtolower(trim($user->email)) === $contributorEmail) {
                        $matchedUser = $user;
                        $matchedTeamMember = $tm;
                        $mappingType = 'email';
                        $confidence = 'high';
                        break;
                    }
                }
            }
        }

        // Save or update mapping
        if ($existing) {
            if ($matchedUser && ! $existing->user_id) {
                $existing->update([
                    'user_id' => $matchedUser->id,
                    'team_member_id' => $matchedTeamMember?->id,
                    'mapping_type' => $mappingType,
                    'confidence' => $confidence,
                ]);
            }
            return $existing;
        }

        return GitHubMemberMapping::create([
            'github_repository_id' => $contributor->github_repository_id,
            'github_contributor_id' => $contributor->id,
            'user_id' => $matchedUser?->id,
            'team_member_id' => $matchedTeamMember?->id,
            'mapping_type' => $matchedUser ? $mappingType : 'manual',
            'confidence' => $matchedUser ? $confidence : 'manual',
            'notes' => $matchedUser ? "Otomatis dipetakan melalui {$mappingType} matching." : null,
        ]);
    }

    /**
     * Update or set a manual mapping by an authorized Team Owner / Admin.
     */
    public function updateManualMapping(GitHubRepository $repo, int $mappingId, ?int $userId, User $adminUser, ?string $notes = null): GitHubMemberMapping
    {
        $mapping = GitHubMemberMapping::where('github_repository_id', $repo->id)
            ->findOrFail($mappingId);

        $teamMember = null;
        if ($userId) {
            $targetUser = User::findOrFail($userId);
            $teamMember = TeamMember::where('team_id', $repo->team_id)
                ->where('user_id', $targetUser->id)
                ->first();
        }

        $mapping->update([
            'user_id' => $userId,
            'team_member_id' => $teamMember?->id,
            'mapping_type' => 'manual',
            'confidence' => $userId ? 'manual' : 'manual',
            'mapped_by' => $adminUser->id,
            'notes' => $notes ?: ($userId ? "Dipetakan secara manual oleh {$adminUser->name}." : 'Pemetaan dilepas oleh admin.'),
        ]);

        return $mapping->fresh(['contributor', 'user', 'mappedByUser']);
    }

    /**
     * Retrieve all contributor mappings for a repository with status.
     */
    public function getMappingsForRepository(GitHubRepository $repo): Collection
    {
        return GitHubMemberMapping::where('github_repository_id', $repo->id)
            ->with(['contributor', 'user.profile', 'teamMember', 'mappedByUser:id,name'])
            ->get()
            ->map(function ($map) {
                return [
                    'id' => $map->id,
                    'contributor_id' => $map->github_contributor_id,
                    'login' => $map->contributor?->login,
                    'name' => $map->contributor?->name,
                    'email' => $map->contributor?->email,
                    'avatar_url' => $map->contributor?->avatar_url,
                    'total_commits' => $map->contributor?->total_commits ?? 0,
                    'is_mapped' => $map->isMapped(),
                    'user' => $map->user ? [
                        'id' => $map->user->id,
                        'name' => $map->user->name,
                        'email' => $map->user->email,
                        'avatar' => $map->user->avatar,
                    ] : null,
                    'mapping_type' => $map->mapping_type,
                    'confidence' => $map->confidence,
                    'mapped_by' => $map->mappedByUser?->name,
                    'notes' => $map->notes,
                    'updated_at' => $map->updated_at?->toIso8601String(),
                ];
            });
    }
}
