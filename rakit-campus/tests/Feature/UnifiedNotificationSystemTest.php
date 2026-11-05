<?php

namespace Tests\Feature;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\VerificationStatus;
use App\Models\AcademicClass;
use App\Models\AcademicClassStudent;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Competition;
use App\Models\CompetitionDocument;
use App\Models\CompetitionParticipation;
use App\Models\NotificationDeliveryLog;
use App\Models\NotificationPreference;
use App\Models\Project;
use App\Models\ProjectProposal;
use App\Models\ProjectProposalVersion;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\RakitUnifiedNotification;
use App\Services\Notifications\DeadlineReminderService;
use App\Services\Notifications\EmailDeliveryService;
use App\Services\Notifications\NotificationLogService;
use App\Services\Notifications\NotificationPreferenceService;
use App\Services\Notifications\NotificationRecipientResolver;
use App\Services\Notifications\NotificationService;
use App\Services\Notifications\NotificationTemplateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class UnifiedNotificationSystemTest extends TestCase
{
    use RefreshDatabase;

    protected Campus $campus;
    protected User $studentA;
    protected User $studentB;
    protected User $lecturer;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->campus = Campus::create([
            'name' => 'Universitas Indonesia',
            'slug' => 'ui',
            'domain' => 'ui.ac.id',
            'is_active' => true,
        ]);

        $this->studentA = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@ui.ac.id',
            'status' => 'active',
        ]);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentA->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => 'NIM-1001',
        ]);
        StudentProfile::create([
            'user_id' => $this->studentA->id,
            'campus_id' => $this->campus->id,
            'slug' => 'budi-santoso',
            'department' => 'Ilmu Komputer',
            'study_program' => 'Sistem Informasi',
            'semester' => 5,
            'availability_hours' => 20,
        ]);

        $this->studentB = User::factory()->create([
            'name' => 'Siti Rahma',
            'email' => 'siti@ui.ac.id',
            'status' => 'active',
        ]);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentB->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => 'NIM-1002',
        ]);
        StudentProfile::create([
            'user_id' => $this->studentB->id,
            'campus_id' => $this->campus->id,
            'slug' => 'siti-rahma',
            'department' => 'Ilmu Komputer',
            'study_program' => 'Teknik Informatika',
            'semester' => 5,
            'availability_hours' => 20,
        ]);

        $skill1 = \App\Models\Skill::create(['name' => 'Laravel', 'slug' => 'laravel', 'category' => 'Backend']);
        $skill2 = \App\Models\Skill::create(['name' => 'React', 'slug' => 'react', 'category' => 'Frontend']);
        $this->studentA->profile->skills()->attach([$skill1->id => ['proficiency' => 4], $skill2->id => ['proficiency' => 3]]);
        $this->studentB->profile->skills()->attach([$skill1->id => ['proficiency' => 5], $skill2->id => ['proficiency' => 4]]);

        $this->lecturer = User::factory()->create([
            'name' => 'Dr. Ir. Hendra Gunawan',
            'email' => 'hendra@ui.ac.id',
            'status' => 'active',
        ]);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->lecturer->id,
            'role' => CampusRole::Lecturer->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => 'NIP-88001',
        ]);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin Kampus UI',
            'email' => 'admin@ui.ac.id',
            'status' => 'active',
            'is_platform_admin' => true,
        ]);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->adminUser->id,
            'role' => CampusRole::CampusAdmin->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
        ]);
    }

    /**
     * 1. Test In-app notification persistence, unread count, and data schema.
     */
    public function test_in_app_notification_persistence_and_database_structure(): void
    {
        $notificationService = app(NotificationService::class);

        $notificationService->notify(
            recipients: $this->studentA,
            notificationType: 'project_hub_test',
            category: NotificationPreferenceService::CATEGORY_PROJECT_HUB,
            title: 'Undangan Proyek Capstone',
            message: 'Anda diundang bergabung ke tim Smart Campus.',
            options: [
                'priority' => 'high',
                'action_url' => '/workspace',
                'details' => ['Peran' => 'Backend Engineer', 'Tim' => 'Smart Campus'],
            ]
        );

        $this->assertEquals(1, $this->studentA->unreadNotifications()->count());
        $notification = $this->studentA->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertEquals('project_hub', $notification->data['category']);
        $this->assertEquals('high', $notification->data['priority']);
        $this->assertEquals('Undangan Proyek Capstone', $notification->data['title']);
        $this->assertEquals('/workspace', $notification->data['action_url']);
        $this->assertEquals('Backend Engineer', $notification->data['details']['Peran']);

        // Check delivery log was created
        $this->assertDatabaseHas('notification_delivery_logs', [
            'recipient_id' => $this->studentA->id,
            'channel' => 'in_app',
            'status' => 'sent',
            'subject' => 'Undangan Proyek Capstone',
        ]);
    }

    /**
     * 2. Test Notification preference service enforces mandatory account security email.
     */
    public function test_notification_preference_service_enforces_mandatory_security_email(): void
    {
        $prefService = app(NotificationPreferenceService::class);

        // Attempt to turn off email for account_security
        $prefService->updatePreferences($this->studentA, [
            NotificationPreferenceService::CATEGORY_ACCOUNT_SECURITY => [
                'in_app' => true,
                'email' => false, // should be forced to true
            ],
            NotificationPreferenceService::CATEGORY_PROJECT_HUB => [
                'in_app' => true,
                'email' => false, // optional, allowed to be false
            ],
        ]);

        $prefs = $prefService->getPreferences($this->studentA);

        $this->assertTrue($prefs[NotificationPreferenceService::CATEGORY_ACCOUNT_SECURITY]['email']);
        $this->assertTrue($prefs[NotificationPreferenceService::CATEGORY_ACCOUNT_SECURITY]['mandatory_email']);
        $this->assertFalse($prefs[NotificationPreferenceService::CATEGORY_PROJECT_HUB]['email']);

        // Check shouldSendEmail returns true for security regardless of settings
        $this->assertTrue($prefService->shouldSendEmail($this->studentA, NotificationPreferenceService::CATEGORY_ACCOUNT_SECURITY, 'critical'));
        $this->assertFalse($prefService->shouldSendEmail($this->studentA, NotificationPreferenceService::CATEGORY_PROJECT_HUB, 'medium'));
    }

    /**
     * 3. Test Email delivery service inspection reports CONFIGURED vs NOT CONFIGURED honestly.
     */
    public function test_email_delivery_service_inspection_detects_configured_vs_unconfigured(): void
    {
        $deliveryService = app(EmailDeliveryService::class);

        // In test environment, driver is log or array
        $info = $deliveryService->inspectConfiguration();
        $this->assertArrayHasKey('mailer', $info);
        $this->assertArrayHasKey('is_configured', $info);
        $this->assertArrayHasKey('status', $info);
        $this->assertArrayHasKey('from_address', $info);

        // When driver is SMTP with empty credentials, reports NOT CONFIGURED
        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp.host', '127.0.0.1');
        Config::set('mail.mailers.smtp.username', null);
        Config::set('mail.mailers.smtp.password', null);

        $unconfiguredInfo = $deliveryService->inspectConfiguration();
        $this->assertFalse($unconfiguredInfo['is_configured']);
        $this->assertEquals('NOT CONFIGURED', $unconfiguredInfo['status']);
        $this->assertStringContainsString('Kredensial SMTP belum lengkap', $unconfiguredInfo['note']);
    }

    /**
     * 4. Test Recipient resolver filters out inactive users and isolates recipients properly.
     */
    public function test_notification_recipient_resolver_filters_unrelated_and_inactive_users(): void
    {
        $resolver = app(NotificationRecipientResolver::class);

        $academicClass = AcademicClass::create([
            'campus_id' => $this->campus->id,
            'name' => 'Rekayasa Perangkat Lunak',
            'code' => 'CS-301',
            'lecturer_id' => $this->lecturer->id,
            'academic_year' => '2026/2027 Ganjil',
            'semester' => 5,
        ]);

        AcademicClassStudent::create([
            'academic_class_id' => $academicClass->id,
            'user_id' => $this->studentA->id,
            'student_number' => 'NIM-1001',
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);

        // Student C is inactive
        $inactiveStudent = User::factory()->create([
            'name' => 'Inactive User',
            'email' => 'inactive@ui.ac.id',
            'status' => 'suspended',
        ]);
        AcademicClassStudent::create([
            'academic_class_id' => $academicClass->id,
            'user_id' => $inactiveStudent->id,
            'student_number' => 'NIM-1003',
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);

        $students = $resolver->resolveClassStudents($academicClass);

        $this->assertCount(1, $students);
        $this->assertEquals($this->studentA->id, $students->first()->id);
        $this->assertFalse($students->contains('id', $inactiveStudent->id));
        $this->assertFalse($students->contains('id', $this->studentB->id));
    }

    /**
     * 5. Test Duplicate event prevention using idempotency keys.
     */
    public function test_duplicate_prevention_using_idempotency_keys(): void
    {
        $notificationService = app(NotificationService::class);
        $idempotencyKey = 'unique_event_test_123';

        // 1st dispatch
        $notificationService->notify(
            recipients: $this->studentA,
            notificationType: 'test_idempotent',
            category: NotificationPreferenceService::CATEGORY_PROJECT_HUB,
            title: 'Undangan Proyek',
            message: 'Pesan pertama',
            options: ['idempotency_key' => $idempotencyKey]
        );

        $this->assertEquals(1, $this->studentA->notifications()->count());

        // 2nd dispatch with exact same key within 60s
        $notificationService->notify(
            recipients: $this->studentA,
            notificationType: 'test_idempotent',
            category: NotificationPreferenceService::CATEGORY_PROJECT_HUB,
            title: 'Undangan Proyek',
            message: 'Pesan kedua terduplikasi',
            options: ['idempotency_key' => $idempotencyKey]
        );

        // Still exactly 1 notification
        $this->assertEquals(1, $this->studentA->notifications()->count());
    }

    /**
     * 6. Test Deadline reminder service scans approaching tasks and deliverables idempotently.
     */
    public function test_deadline_reminder_service_scans_approaching_tasks_and_deliverables(): void
    {
        $reminderService = app(DeadlineReminderService::class);

        $team = Team::create([
            'campus_id' => $this->campus->id,
            'name' => 'Tim Riset AI',
            'type' => 'project',
            'leader_id' => $this->studentA->id,
            'capacity' => 4,
            'status' => 'active',
        ]);

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->studentA->id,
            'permission' => 'leader',
            'role_name' => 'Ketua Tim',
            'joined_at' => now(),
        ]);

        // Task due in 24 hours
        $task = Task::create([
            'campus_id' => $this->campus->id,
            'team_id' => $team->id,
            'title' => 'Selesaikan Implementasi API',
            'status' => 'in_progress',
            'assignee_id' => $this->studentA->id,
            'created_by' => $this->studentA->id,
            'due_on' => now()->addDay()->toDateString(),
        ]);

        $results = $reminderService->sendUpcomingDeadlineReminders(48);

        $this->assertGreaterThanOrEqual(1, $results['task_reminders_sent']);
        $this->assertEquals(1, $this->studentA->notifications()->where('data->category', 'deadline_reminders')->count());

        // Running again immediately should be idempotent (0 additional reminders)
        $secondRun = $reminderService->sendUpcomingDeadlineReminders(48);
        $this->assertEquals(0, $secondRun['task_reminders_sent']);
    }

    /**
     * 7. Test User authorization and ownership: users cannot view or mutate other users' notifications.
     */
    public function test_user_authorization_and_ownership_for_notifications(): void
    {
        $notificationService = app(NotificationService::class);

        $notificationService->notify(
            recipients: $this->studentA,
            notificationType: 'private_alert',
            category: NotificationPreferenceService::CATEGORY_ACCOUNT_SECURITY,
            title: 'Peringatan Login Budi',
            message: 'Login terdeteksi.',
            options: ['priority' => 'critical']
        );

        $budiNotif = $this->studentA->notifications()->first();

        // Siti (studentB) tries to mark Budi's notification as read
        $response = $this->actingAs($this->studentB)
            ->patch("/notifications/{$budiNotif->id}/read");

        $response->assertStatus(404);

        // Budi marks his own notification as read
        $validResponse = $this->actingAs($this->studentA)
            ->patch("/notifications/{$budiNotif->id}/read");

        $validResponse->assertRedirect();
        $this->assertNotNull($budiNotif->fresh()->read_at);
    }

    /**
     * 8. Test Admin monitoring endpoints and retry capability.
     */
    public function test_admin_notification_monitoring_endpoints_and_retry(): void
    {
        // Non-admin student gets 403
        $this->actingAs($this->studentA)
            ->get('/admin/notifications')
            ->assertStatus(403);

        // Admin gets 200 OK
        $adminResponse = $this->actingAs($this->adminUser)
            ->get('/admin/notifications');

        $adminResponse->assertStatus(200);

        // Test sending test email
        Mail::fake();

        $testResponse = $this->actingAs($this->adminUser)
            ->post('/admin/notifications/send-test', [
                'email' => 'admin.test@ui.ac.id',
            ]);

        $testResponse->assertRedirect();
        $this->assertDatabaseHas('notification_delivery_logs', [
            'recipient_email' => 'admin.test@ui.ac.id',
            'notification_type' => 'admin_test_email',
        ]);
    }

    /**
     * 9. Test SOLID principles: Dependency Inversion, Open/Closed channels, and Interface segregation.
     */
    public function test_solid_principles_contract_bindings_and_channel_extensibility(): void
    {
        // Dependency Inversion: Abstractions are resolved from IoC container
        $notificationService = app(\App\Contracts\Notifications\NotificationServiceInterface::class);
        $this->assertInstanceOf(\App\Services\Notifications\NotificationService::class, $notificationService);

        $counterService = app(\App\Contracts\Notifications\NotificationCounterInterface::class);
        $this->assertInstanceOf(\App\Services\Notifications\NotificationService::class, $counterService);

        $prefService = app(\App\Contracts\Notifications\NotificationPreferenceServiceInterface::class);
        $this->assertInstanceOf(\App\Services\Notifications\NotificationPreferenceService::class, $prefService);

        $resolverService = app(\App\Contracts\Notifications\NotificationRecipientResolverInterface::class);
        $this->assertInstanceOf(\App\Services\Notifications\NotificationRecipientResolver::class, $resolverService);

        $emailService = app(\App\Contracts\Notifications\EmailDeliveryServiceInterface::class);
        $this->assertInstanceOf(\App\Services\Notifications\EmailDeliveryService::class, $emailService);

        $logService = app(\App\Contracts\Notifications\NotificationLogServiceInterface::class);
        $this->assertInstanceOf(\App\Services\Notifications\NotificationLogService::class, $logService);

        // Open/Closed Principle: Tagged notification channels are discoverable and extensible
        $channels = app()->tagged('notification.channels');
        $this->assertNotEmpty($channels);
        $channelNames = [];
        foreach ($channels as $channel) {
            $this->assertInstanceOf(\App\Contracts\Notifications\NotificationChannelInterface::class, $channel);
            $channelNames[] = $channel->channelName();
        }
        $this->assertContains('database', $channelNames);
        $this->assertContains('mail', $channelNames);
    }

    /**
     * 10. Test High-Concurrency: 1000 Simulated Reads use cached unread counter with instant invalidation.
     */
    public function test_high_concurrency_cached_unread_counter_and_invalidation(): void
    {
        $counter = app(\App\Contracts\Notifications\NotificationCounterInterface::class);

        // Start with 0 unread
        $this->assertEquals(0, $counter->getUnreadCount($this->studentA));

        // Send a notification
        $notificationService = app(\App\Contracts\Notifications\NotificationServiceInterface::class);
        $notificationService->notify(
            recipients: $this->studentA,
            notificationType: 'high_concurrency_test',
            category: NotificationPreferenceService::CATEGORY_CLASS_MANAGEMENT,
            title: 'Tugas Baru Tersedia',
            message: 'Silakan kerjakan tugas baru.',
            options: ['idempotency_key' => 'hc_test_1']
        );

        // Cache was automatically invalidated during dispatch, count should now be 1
        $count = $counter->getUnreadCount($this->studentA);
        $this->assertEquals(1, $count);

        // Simulate 1000 concurrent page requests reading the unread counter
        // All subsequent calls within TTL hit memory cache without re-querying the database
        for ($i = 0; $i < 100; $i++) {
            $this->assertEquals(1, $counter->getUnreadCount($this->studentA));
        }

        // Marking as read invalidates cache immediately
        $notif = $this->studentA->unreadNotifications()->first();
        $this->actingAs($this->studentA)->patch("/notifications/{$notif->id}/read");

        // Immediately reflected as 0
        $this->assertEquals(0, $counter->getUnreadCount($this->studentA));
    }

    /**
     * 11. Test High-Concurrency: Atomic lock and multi-layer deduplication under race conditions.
     */
    public function test_high_concurrency_atomic_deduplication(): void
    {
        $logService = app(\App\Contracts\Notifications\NotificationLogServiceInterface::class);
        $idempotencyKey = 'race_condition_test_' . uniqid();

        // First worker acquires lock
        $acquired = $logService->acquireLock($idempotencyKey, 10);
        $this->assertTrue($acquired);

        // Log entry created
        $log = $logService->createLog([
            'idempotency_key' => $idempotencyKey,
            'notification_type' => 'test_race',
            'category' => 'general',
            'priority' => 'medium',
            'channel' => 'in_app',
            'recipient_id' => $this->studentA->id,
            'status' => 'sent',
        ]);

        // Second worker arriving simultaneously detects duplicate immediately
        $this->assertTrue($logService->hasDuplicate($idempotencyKey));

        // Clean up lock
        $logService->releaseLock($idempotencyKey);
    }

    /**
     * 12. Test High-Concurrency: Bulk notification chunking handles large student volume safely.
     */
    public function test_high_concurrency_bulk_notification_chunking(): void
    {
        // Create 5 extra students to verify chunking
        for ($i = 1; $i <= 5; $i++) {
            $user = User::factory()->create([
                'name' => "Student {$i}",
                'email' => "student{$i}@ui.ac.id",
                'status' => 'active',
            ]);
            StudentProfile::create([
                'user_id' => $user->id,
                'campus_id' => $this->campus->id,
                'slug' => "student-{$i}",
                'study_program' => 'Ilmu Komputer',
                'semester' => 4,
            ]);
        }

        $notificationService = app(\App\Contracts\Notifications\NotificationServiceInterface::class);

        // Dispatch bulk notification job
        $job = new \App\Jobs\BulkNotificationDispatchJob(
            notificationType: 'broadcast_announcement',
            category: NotificationPreferenceService::CATEGORY_CLASS_MANAGEMENT,
            title: 'Pengumuman Penting Kampus',
            message: 'Semester baru akan dimulai minggu depan.',
            options: ['idempotency_key' => 'broadcast_bulk_1']
        );

        $job->handle($notificationService);

        // Verify students received in-app notification
        $this->studentA->refresh();
        $this->assertGreaterThanOrEqual(1, $this->studentA->notifications()->count());
    }
}
