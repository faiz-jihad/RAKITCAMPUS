<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_incomplete_profile_students_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dashboard')->assertOk();
    }

    public function test_students_cannot_switch_role_to_lecturer()
    {
        $campus = \App\Models\Campus::create(['name' => 'Polindra Test', 'slug' => 'polindra-test']);
        $user = User::factory()->create();
        \App\Models\CampusMembership::create([
            'campus_id' => $campus->id,
            'user_id' => $user->id,
            'role' => \App\Enums\CampusRole::Student,
            'status' => \App\Enums\MembershipStatus::Active,
            'verification_status' => \App\Enums\VerificationStatus::Verified,
            'student_number' => '2105098',
        ]);

        $this->actingAs($user)
            ->post('/switch-role', ['role' => 'lecturer'])
            ->assertForbidden();

        $this->assertFalse($user->fresh()->isLecturer());
    }

    public function test_lecturers_see_lecturer_dashboard_data()
    {
        $campus = \App\Models\Campus::create(['name' => 'Polindra Test', 'slug' => 'polindra-test']);
        $lecturer = User::factory()->create();
        \App\Models\CampusMembership::create([
            'campus_id' => $campus->id,
            'user_id' => $lecturer->id,
            'role' => \App\Enums\CampusRole::Lecturer,
            'status' => \App\Enums\MembershipStatus::Active,
            'verification_status' => \App\Enums\VerificationStatus::Verified,
            'student_number' => 'NIDN-999999',
        ]);

        $this->actingAs($lecturer)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->where('user.is_lecturer', true)
                ->where('user.role', 'lecturer')
                ->where('auth.user.is_lecturer', true)
                ->where('auth.user.role', 'lecturer')
            );
    }

    public function test_authenticated_users_with_completed_profile_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $campus = \App\Models\Campus::create(['name' => 'Polindra Test', 'slug' => 'polindra-test']);
        \App\Models\CampusMembership::create([
            'campus_id' => $campus->id,
            'user_id' => $user->id,
            'role' => \App\Enums\CampusRole::Student,
            'status' => \App\Enums\MembershipStatus::Active,
            'verification_status' => \App\Enums\VerificationStatus::Verified,
            'student_number' => '2105099',
        ]);
        $profile = \App\Models\StudentProfile::create([
            'user_id' => $user->id,
            'campus_id' => $campus->id,
            'slug' => 'student-dashboard-test',
            'department' => 'Teknik Informatika',
            'study_program' => 'Teknik Informatika',
            'availability_hours' => 20,
            'visibility' => \App\Enums\Visibility::Campus,
        ]);
        $s1 = \App\Models\Skill::firstOrCreate(['slug' => 'php'], ['name' => 'PHP', 'category' => 'backend']);
        $s2 = \App\Models\Skill::firstOrCreate(['slug' => 'vue'], ['name' => 'Vue', 'category' => 'frontend']);
        $profile->skills()->attach([$s1->id, $s2->id]);

        $this->actingAs($user);

        $this->get('/dashboard')->assertOk();
    }
}
