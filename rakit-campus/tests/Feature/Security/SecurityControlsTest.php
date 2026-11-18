<?php

namespace Tests\Feature\Security;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SecurityControlsTest extends TestCase
{
    use RefreshDatabase;

    private Campus $campus;
    private User $ownerUser;
    private User $attackerUser;
    private Team $team;

    protected function setUp(): void
    {
        parent::setUp();

        $this->campus = Campus::create([
            'name' => 'Institut Teknologi Keamanan',
            'slug' => 'itk-sec',
        ]);

        $this->ownerUser = User::factory()->create([
            'name' => 'Legitimate Owner',
            'email' => 'owner@security.test',
        ]);

        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->ownerUser->id,
            'role' => CampusRole::Student,
            'status' => MembershipStatus::Active,
            'verification_status' => VerificationStatus::Verified,
        ]);

        StudentProfile::create([
            'user_id' => $this->ownerUser->id,
            'campus_id' => $this->campus->id,
            'slug' => 'owner-profile-' . $this->ownerUser->id,
            'is_onboarded' => true,
        ]);

        $this->attackerUser = User::factory()->create([
            'name' => 'Malicious Actor',
            'email' => 'attacker@security.test',
        ]);

        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->attackerUser->id,
            'role' => CampusRole::Student,
            'status' => MembershipStatus::Active,
            'verification_status' => VerificationStatus::Verified,
        ]);

        StudentProfile::create([
            'user_id' => $this->attackerUser->id,
            'campus_id' => $this->campus->id,
            'slug' => 'attacker-profile-' . $this->attackerUser->id,
            'is_onboarded' => true,
        ]);

        $this->team = Team::create([
            'campus_id' => $this->campus->id,
            'name' => 'Alpha Security Team',
            'type' => TeamType::Project,
            'leader_id' => $this->ownerUser->id,
            'capacity' => 4,
        ]);

        TeamMember::create([
            'team_id' => $this->team->id,
            'user_id' => $this->ownerUser->id,
            'role_name' => 'Team Lead',
        ]);
    }

    public function test_security_headers_are_present_on_responses(): void
    {
        $response = $this->get('/login');

        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }

    public function test_hsts_header_present_on_secure_requests(): void
    {
        $response = $this->withHeaders(['X-Forwarded-Proto' => 'https'])
            ->get('/login');

        $response->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_google_demo_login_is_blocked_in_production(): void
    {
        $originalEnv = app()->environment();

        putenv('APP_ENV=production');
        $_ENV['APP_ENV'] = 'production';
        $_SERVER['APP_ENV'] = 'production';
        $this->app['env'] = 'production';

        $response = $this->get('/auth/google/demo');
        $response->assertStatus(404);

        putenv("APP_ENV={$originalEnv}");
        $_ENV['APP_ENV'] = $originalEnv;
        $_SERVER['APP_ENV'] = $originalEnv;
        $this->app['env'] = $originalEnv;
    }

    public function test_unauthorized_user_cannot_create_task_in_another_team_workspace(): void
    {
        $response = $this->actingAs($this->attackerUser)
            ->post("/workspace/{$this->team->id}/tasks", [
                'title' => 'Malicious Injected Task',
                'priority' => TaskPriority::High->value,
                'status' => TaskStatus::Todo->value,
            ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('tasks', [
            'team_id' => $this->team->id,
            'title' => 'Malicious Injected Task',
        ]);
    }

    public function test_authorized_member_can_create_task_in_team_workspace(): void
    {
        $response = $this->actingAs($this->ownerUser)
            ->post("/workspace/{$this->team->id}/tasks", [
                'title' => 'Legitimate Sprint Task',
                'priority' => TaskPriority::High->value,
                'status' => TaskStatus::Todo->value,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tasks', [
            'team_id' => $this->team->id,
            'title' => 'Legitimate Sprint Task',
        ]);
    }

    public function test_unauthorized_user_cannot_update_task_in_another_team_workspace(): void
    {
        $task = Task::create([
            'campus_id' => $this->campus->id,
            'team_id' => $this->team->id,
            'created_by' => $this->ownerUser->id,
            'title' => 'Legitimate Task To Tamper',
            'status' => TaskStatus::Todo->value,
            'priority' => TaskPriority::Medium->value,
        ]);

        $response = $this->actingAs($this->attackerUser)
            ->patch("/workspace/{$this->team->id}/tasks/{$task->id}", [
                'title' => 'Tampered Title by Attacker',
            ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('tasks', [
            'id' => $task->id,
            'title' => 'Tampered Title by Attacker',
        ]);
    }

    public function test_unauthorized_user_cannot_delete_task_in_another_team_workspace(): void
    {
        $task = Task::create([
            'campus_id' => $this->campus->id,
            'team_id' => $this->team->id,
            'created_by' => $this->ownerUser->id,
            'title' => 'Protected Task From Deletion',
            'status' => TaskStatus::Todo->value,
            'priority' => TaskPriority::Medium->value,
        ]);

        $response = $this->actingAs($this->attackerUser)
            ->delete("/workspace/{$this->team->id}/tasks/{$task->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
        ]);
    }

    public function test_non_lecturer_cannot_submit_evaluation_grade(): void
    {
        $project = Project::create([
            'campus_id' => $this->campus->id,
            'creator_id' => $this->ownerUser->id,
            'leader_id' => $this->ownerUser->id,
            'title' => 'Capstone Project Alpha',
            'slug' => 'capstone-project-alpha',
            'short_description' => 'Security assessment test project',
            'category' => \App\Enums\ProjectCategory::Academic,
            'description' => 'Test Project for Security Assessment',
            'status' => ProjectStatus::InProgress,
        ]);

        $this->team->update(['project_id' => $project->id]);

        $response = $this->actingAs($this->attackerUser)
            ->post("/workspace/{$this->team->id}/evaluation", [
                'lecturer_evaluation' => 'A (95)',
                'lecturer_notes' => 'Self-assigned fraudulent grade',
            ]);

        $response->assertStatus(403);
    }

    public function test_upload_blocks_dangerous_file_extensions(): void
    {
        Storage::fake('public');

        $dangerousFiles = [
            UploadedFile::fake()->create('malicious.php', 10, 'text/x-php'),
            UploadedFile::fake()->create('payload.exe', 10, 'application/x-msdownload'),
            UploadedFile::fake()->create('xss.html', 10, 'text/html'),
            UploadedFile::fake()->create('vector.svg', 10, 'image/svg+xml'),
        ];

        foreach ($dangerousFiles as $file) {
            $response = $this->actingAs($this->ownerUser)
                ->postJson('/api/v1/uploads', [
                    'file' => $file,
                    'type' => 'document',
                ]);

            $this->assertTrue(
                in_array($response->status(), [422, 400], true),
                "Upload for extension {$file->getClientOriginalName()} should be rejected."
            );
        }
    }

    public function test_storage_download_rejects_directory_traversal(): void
    {
        $response = $this->actingAs($this->ownerUser)
            ->get('/storage-download/..%2F..%2Fetc%2Fpasswd');

        $this->assertTrue(
            in_array($response->status(), [400, 404], true),
            'Directory traversal attempt must be rejected.'
        );
    }

    public function test_github_webhook_rejects_missing_signature_when_secret_is_configured(): void
    {
        Config::set('github.webhook_secret', 'production-super-secret-key-12345');

        $response = $this->withHeaders([
            'X-GitHub-Event' => 'push',
            'X-GitHub-Delivery' => 'test-delivery-id-777',
        ])->postJson('/api/v1/integrations/github/webhook', [
            'action' => 'push',
            'repository' => ['full_name' => 'rakit/campus-repo'],
        ]);

        $response->assertStatus(401);
    }

    public function test_api_login_is_rate_limited_against_brute_force(): void
    {
        $lastResponse = null;

        for ($i = 0; $i < 6; $i++) {
            $lastResponse = $this->postJson('/api/v1/auth/login', [
                'email' => 'attacker@security.test',
                'password' => 'wrongpassword',
            ]);
        }

        $lastResponse->assertStatus(429);
    }
}
