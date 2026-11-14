<?php

namespace Tests\Feature;

use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\GitHub\GitHubBranch;
use App\Models\GitHub\GitHubCommit;
use App\Models\GitHub\GitHubContributor;
use App\Models\GitHub\GitHubMemberMapping;
use App\Models\GitHub\GitHubPullRequest;
use App\Models\GitHub\GitHubRepository;
use App\Models\GitHub\GitHubWebhookEvent;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\GitHub\ContributorMappingService;
use App\Services\GitHub\GitHubAnalyticsService;
use App\Services\GitHub\GitHubAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class GitHubContributionMonitoringTest extends TestCase
{
    use RefreshDatabase;

    private Campus $campus;
    private User $owner;
    private User $member;
    private User $outsider;
    private Team $team;

    protected function setUp(): void
    {
        parent::setUp();

        $this->campus = Campus::create([
            'name' => 'Institut Teknologi Bandung',
            'slug' => 'itb',
        ]);

        $this->owner = User::factory()->create([
            'name' => 'Faiz Jihad Al Baihaqi',
            'email' => 'faiz@rakitcampus.id',
        ]);

        $this->member = User::factory()->create([
            'name' => 'Ahmad Dev',
            'email' => 'ahmad@rakitcampus.id',
        ]);

        $this->outsider = User::factory()->create([
            'name' => 'Stranger Danger',
            'email' => 'stranger@example.com',
        ]);

        CampusMembership::create([
            'user_id' => $this->owner->id,
            'campus_id' => $this->campus->id,
            'role' => 'student',
            'status' => 'active',
        ]);

        CampusMembership::create([
            'user_id' => $this->member->id,
            'campus_id' => $this->campus->id,
            'role' => 'student',
            'status' => 'active',
        ]);

        $this->team = Team::create([
            'campus_id' => $this->campus->id,
            'name' => 'Team Alpha Hackathon',
            'type' => \App\Enums\TeamType::Competition,
            'creator_id' => $this->owner->id,
            'leader_id' => $this->owner->id,
            'capacity' => 5,
        ]);

        TeamMember::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'role_name' => 'Team Lead & Architect',
            'permission' => 'leader',
            'status' => 'active',
        ]);

        TeamMember::create([
            'team_id' => $this->team->id,
            'user_id' => $this->member->id,
            'role_name' => 'Frontend Developer',
            'permission' => 'member',
            'status' => 'active',
        ]);
    }

    public function test_github_app_service_parses_various_repo_urls(): void
    {
        $service = new GitHubAppService();

        $cases = [
            'https://github.com/rakitcampus/rakit-platform' => ['rakitcampus', 'rakit-platform'],
            'https://github.com/rakitcampus/rakit-platform.git' => ['rakitcampus', 'rakit-platform'],
            'http://github.com/rakitcampus/rakit-platform/' => ['rakitcampus', 'rakit-platform'],
            'rakitcampus/rakit-platform' => ['rakitcampus', 'rakit-platform'],
            'git@github.com:rakitcampus/rakit-platform.git' => ['rakitcampus', 'rakit-platform'],
        ];

        foreach ($cases as $input => $expected) {
            $parsed = $service->parseRepositoryUrl($input);
            $this->assertNotNull($parsed, "Failed to parse: {$input}");
            $this->assertEquals($expected[0], $parsed['owner']);
            $this->assertEquals($expected[1], $parsed['repo']);
            $this->assertEquals("{$expected[0]}/{$expected[1]}", $parsed['full_name']);
        }

        $this->expectException(\InvalidArgumentException::class);
        $service->parseRepositoryUrl('https://gitlab.com/owner/repo');
    }

    public function test_unauthenticated_user_cannot_access_github_endpoints(): void
    {
        $this->getJson("/api/v1/workspaces/{$this->team->id}/github/repository")
            ->assertUnauthorized();

        $this->postJson("/api/v1/workspaces/{$this->team->id}/github/repository", [
            'repository_url' => 'https://github.com/rakitcampus/rakit-core',
        ])->assertUnauthorized();
    }

    public function test_outsider_user_is_forbidden_from_viewing_team_github_data(): void
    {
        $this->actingAs($this->outsider)
            ->getJson("/api/v1/workspaces/{$this->team->id}/github/repository")
            ->assertForbidden();

        $this->actingAs($this->outsider)
            ->getJson("/api/v1/workspaces/{$this->team->id}/github/overview")
            ->assertForbidden();
    }

    public function test_team_member_can_view_repository_but_cannot_connect_or_disconnect(): void
    {
        // Member can view repository status (even if null)
        $this->actingAs($this->member)
            ->getJson("/api/v1/workspaces/{$this->team->id}/github/repository")
            ->assertOk()
            ->assertJsonPath('data.connected', false);

        // Member cannot connect repository (only leader/admin)
        $this->actingAs($this->member)
            ->postJson("/api/v1/workspaces/{$this->team->id}/github/repository", [
                'repository_url' => 'https://github.com/rakitcampus/rakit-core',
            ])->assertForbidden();

        // Connect as leader first
        $repo = GitHubRepository::create([
            'team_id' => $this->team->id,
            'github_id' => 1234567,
            'owner' => 'rakitcampus',
            'name' => 'rakit-core',
            'full_name' => 'rakitcampus/rakit-core',
            'html_url' => 'https://github.com/rakitcampus/rakit-core',
            'default_branch' => 'main',
            'is_private' => false,
            'status' => 'connected',
            'sync_status' => 'completed',
        ]);

        // Member cannot disconnect
        $this->actingAs($this->member)
            ->deleteJson("/api/v1/workspaces/{$this->team->id}/github/repository")
            ->assertForbidden();

        // Member cannot trigger manual sync
        $this->actingAs($this->member)
            ->postJson("/api/v1/workspaces/{$this->team->id}/github/repository/sync")
            ->assertForbidden();

        // Member can view overview
        $this->actingAs($this->member)
            ->getJson("/api/v1/workspaces/{$this->team->id}/github/overview")
            ->assertOk()
            ->assertJsonPath('data.repository.full_name', 'rakitcampus/rakit-core');
    }

    public function test_leader_can_connect_repository_with_valid_url(): void
    {
        \Illuminate\Support\Facades\Queue::fake([\App\Jobs\SyncGitHubRepositoryJob::class]);

        \Illuminate\Support\Facades\Http::fake([
            'https://api.github.com/repos/rakitcampus/rakit-app*' => \Illuminate\Support\Facades\Http::response([
                'id' => 1234567,
                'name' => 'rakit-app',
                'full_name' => 'rakitcampus/rakit-app',
                'private' => false,
                'html_url' => 'https://github.com/rakitcampus/rakit-app',
                'default_branch' => 'main',
                'description' => 'RAKIT test repo',
                'open_issues_count' => 0,
            ], 200),
            'https://api.github.com/*' => \Illuminate\Support\Facades\Http::response([], 200),
        ]);

        $response = $this->actingAs($this->owner)
            ->postJson("/api/v1/workspaces/{$this->team->id}/github/repository", [
                'repository_url' => 'https://github.com/rakitcampus/rakit-app',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.repository.full_name', 'rakitcampus/rakit-app')
            ->assertJsonPath('data.repository.status', 'active');

        $this->assertDatabaseHas('github_repositories', [
            'team_id' => $this->team->id,
            'full_name' => 'rakitcampus/rakit-app',
            'status' => 'active',
        ]);

        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\SyncGitHubRepositoryJob::class);
    }

    public function test_connecting_with_invalid_url_fails_validation(): void
    {
        $this->actingAs($this->owner)
            ->postJson("/api/v1/workspaces/{$this->team->id}/github/repository", [
                'repository_url' => 'https://invalid-url.com/something',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['repository_url']);
    }

    public function test_leader_can_disconnect_repository(): void
    {
        $repo = GitHubRepository::create([
            'team_id' => $this->team->id,
            'github_id' => 999123,
            'owner' => 'rakitcampus',
            'name' => 'rakit-disconnect',
            'full_name' => 'rakitcampus/rakit-disconnect',
            'html_url' => 'https://github.com/rakitcampus/rakit-disconnect',
            'default_branch' => 'main',
            'status' => 'connected',
            'sync_status' => 'completed',
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/v1/workspaces/{$this->team->id}/github/repository")
            ->assertOk();

        $this->assertEquals('disconnected', $repo->fresh()->status);
    }

    public function test_contributor_auto_mapping_and_manual_mapping(): void
    {
        $repo = GitHubRepository::create([
            'team_id' => $this->team->id,
            'github_id' => 555000,
            'owner' => 'rakitcampus',
            'name' => 'rakit-contributors',
            'full_name' => 'rakitcampus/rakit-contributors',
            'html_url' => 'https://github.com/rakitcampus/rakit-contributors',
            'default_branch' => 'main',
            'status' => 'connected',
            'sync_status' => 'completed',
        ]);

        // Contributor with email matching our member (ahmad@rakitcampus.id)
        $contributor = GitHubContributor::create([
            'github_repository_id' => $repo->id,
            'github_id' => 12345,
            'login' => 'ahmaddev',
            'name' => 'Ahmad Fauzan',
            'email' => 'ahmad@rakitcampus.id',
            'avatar_url' => 'https://avatars.githubusercontent.com/u/12345',
            'total_commits' => 15,
            'total_additions' => 500,
            'total_deletions' => 100,
        ]);

        $mappingService = app(ContributorMappingService::class);
        $mapping = $mappingService->autoMapContributor($contributor, $this->team);

        $this->assertNotNull($mapping);
        $this->assertEquals($this->member->id, $mapping->user_id);
        $this->assertEquals('email', $mapping->mapping_type);

        // Now test manual override mapping to owner via API
        $this->actingAs($this->owner)
            ->putJson("/api/v1/workspaces/{$this->team->id}/github/mappings/{$mapping->id}", [
                'user_id' => $this->owner->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.user_id', $this->owner->id)
            ->assertJsonPath('data.mapping_type', 'manual');

        $this->assertDatabaseHas('github_member_mappings', [
            'id' => $mapping->id,
            'user_id' => $this->owner->id,
            'mapping_type' => 'manual',
        ]);
    }

    public function test_analytics_deduplicates_commits_across_multiple_branches(): void
    {
        $repo = GitHubRepository::create([
            'team_id' => $this->team->id,
            'github_id' => 777111,
            'owner' => 'rakitcampus',
            'name' => 'rakit-analytics',
            'full_name' => 'rakitcampus/rakit-analytics',
            'html_url' => 'https://github.com/rakitcampus/rakit-analytics',
            'default_branch' => 'main',
            'status' => 'connected',
            'sync_status' => 'completed',
        ]);

        GitHubBranch::create([
            'github_repository_id' => $repo->id,
            'name' => 'main',
            'sha' => 'commit111',
            'is_default' => true,
        ]);

        GitHubBranch::create([
            'github_repository_id' => $repo->id,
            'name' => 'feature/auth',
            'sha' => 'commit111',
            'is_default' => false,
        ]);

        // Commit appears in BOTH main and feature/auth
        GitHubCommit::create([
            'github_repository_id' => $repo->id,
            'sha' => 'commit111',
            'message' => 'Initial commit with auth logic',
            'author_name' => 'Faiz Jihad',
            'author_email' => 'faiz@rakitcampus.id',
            'committed_at' => now()->subDays(2),
            'branches' => ['main', 'feature/auth'],
        ]);

        GitHubCommit::create([
            'github_repository_id' => $repo->id,
            'sha' => 'commit222',
            'message' => 'Add UI components',
            'author_name' => 'Ahmad Dev',
            'author_email' => 'ahmad@rakitcampus.id',
            'committed_at' => now()->subDay(),
            'branches' => ['main'],
        ]);

        $analytics = app(GitHubAnalyticsService::class);
        $overview = $analytics->getOverview($repo);

        // Must count 2 unique commits even though commit111 is in 2 branches
        $this->assertEquals(2, $overview['metrics']['total_commits']);
        $this->assertEquals(2, $overview['metrics']['total_branches']);
    }

    public function test_webhook_signature_verification_and_idempotency(): void
    {
        Config::set('github.webhook_secret', 'rakit-secret-key-12345');

        $repo = GitHubRepository::create([
            'team_id' => $this->team->id,
            'github_id' => 888222,
            'owner' => 'rakitcampus',
            'name' => 'rakit-webhook-test',
            'full_name' => 'rakitcampus/rakit-webhook-test',
            'html_url' => 'https://github.com/rakitcampus/rakit-webhook-test',
            'default_branch' => 'main',
            'status' => 'connected',
            'sync_status' => 'completed',
        ]);

        $payload = [
            'repository' => [
                'id' => 888222,
                'full_name' => 'rakitcampus/rakit-webhook-test',
            ],
            'ref' => 'refs/heads/main',
            'commits' => [
                [
                    'id' => 'sha999000',
                    'message' => 'feat: support webhook sync',
                    'timestamp' => now()->toIso8601String(),
                    'author' => [
                        'name' => 'Faiz Jihad',
                        'email' => 'faiz@rakitcampus.id',
                    ],
                    'added' => ['app/Service.php'],
                    'removed' => [],
                    'modified' => [],
                ],
            ],
        ];

        $payloadJson = json_encode($payload);
        $validSignature = 'sha256=' . hash_hmac('sha256', $payloadJson, 'rakit-secret-key-12345');
        $invalidSignature = 'sha256=invalid-signature-hash';

        // 1. Missing delivery/event headers -> 400
        $this->postJson('/api/v1/integrations/github/webhook', $payload)
            ->assertStatus(400);

        // 2. Missing signature with event headers -> 401
        $this->postJson('/api/v1/integrations/github/webhook', $payload, [
            'X-GitHub-Event' => 'push',
            'X-GitHub-Delivery' => 'delivery-uuid-000',
        ])->assertUnauthorized();

        // 3. Invalid signature -> 401
        $this->postJson('/api/v1/integrations/github/webhook', $payload, [
            'X-Hub-Signature-256' => $invalidSignature,
            'X-GitHub-Event' => 'push',
            'X-GitHub-Delivery' => 'delivery-uuid-001',
        ])->assertUnauthorized();

        // 4. Valid signature -> 200 OK
        $this->postJson('/api/v1/integrations/github/webhook', $payload, [
            'X-Hub-Signature-256' => $validSignature,
            'X-GitHub-Event' => 'push',
            'X-GitHub-Delivery' => 'delivery-uuid-001',
        ])->assertOk()
            ->assertJson(['status' => 'processed']);

        $this->assertDatabaseHas('github_webhook_events', [
            'delivery_id' => 'delivery-uuid-001',
            'event' => 'push',
            'processed' => true,
        ]);

        // 4. Duplicate delivery ID (Idempotency) -> 200 OK with duplicate status
        $this->postJson('/api/v1/integrations/github/webhook', $payload, [
            'X-Hub-Signature-256' => $validSignature,
            'X-GitHub-Event' => 'push',
            'X-GitHub-Delivery' => 'delivery-uuid-001',
        ])->assertOk()
            ->assertJson(['status' => 'duplicate']);
    }
}
