<?php

namespace App\Services\Notifications;

use App\Contracts\Notifications\NotificationPreferenceServiceInterface;
use App\Models\NotificationPreference;
use App\Models\User;

class NotificationPreferenceService implements NotificationPreferenceServiceInterface
{
    public const CATEGORY_ACCOUNT_SECURITY = 'account_security';
    public const CATEGORY_CLASS_MANAGEMENT = 'class_management';
    public const CATEGORY_PROJECT_HUB = 'project_hub';
    public const CATEGORY_COMPETITION_HUB = 'competition_hub';
    public const CATEGORY_DEADLINE_REMINDERS = 'deadline_reminders';

    /**
     * Category definitions with metadata.
     */
    public static function categories(): array
    {
        return [
            self::CATEGORY_ACCOUNT_SECURITY => [
                'name' => 'Keamanan & Akun',
                'description' => 'Aktivitas login, reset password, dan perubahan keamanan penting.',
                'mandatory_email' => true,
                'default_in_app' => true,
                'default_email' => true,
            ],
            self::CATEGORY_CLASS_MANAGEMENT => [
                'name' => 'Manajemen Kelas',
                'description' => 'Enrollment kelas kuliah, pembagian kelompok oleh dosen, dan pengumuman kelas.',
                'mandatory_email' => false,
                'default_in_app' => true,
                'default_email' => true,
            ],
            self::CATEGORY_PROJECT_HUB => [
                'name' => 'Project Hub',
                'description' => 'Undangan tim proyek, approval proposal, review dosen, dan penilaian UTS/UAS.',
                'mandatory_email' => false,
                'default_in_app' => true,
                'default_email' => true,
            ],
            self::CATEGORY_COMPETITION_HUB => [
                'name' => 'Competition Hub',
                'description' => 'Undangan tim lomba, progres babak seleksi, ulasan deliverable, dan verifikasi prestasi.',
                'mandatory_email' => false,
                'default_in_app' => true,
                'default_email' => true,
            ],
            self::CATEGORY_DEADLINE_REMINDERS => [
                'name' => 'Pengingat Deadline',
                'description' => 'Pengingat otomatis H-2 dan H-1 pengumpulan tugas proyek dan submit deliverable kompetisi.',
                'mandatory_email' => false,
                'default_in_app' => true,
                'default_email' => true,
            ],
        ];
    }

    /**
     * Get user preferences across all categories, merged with system defaults.
     */
    public function getPreferences(User $user): array
    {
        $saved = NotificationPreference::where('user_id', $user->id)
            ->get()
            ->keyBy('type');

        $result = [];
        foreach (self::categories() as $key => $meta) {
            $pref = $saved->get($key);
            $result[$key] = [
                'key' => $key,
                'name' => $meta['name'],
                'description' => $meta['description'],
                'mandatory_email' => $meta['mandatory_email'],
                'in_app' => $pref ? (bool) $pref->in_app : $meta['default_in_app'],
                'email' => $meta['mandatory_email'] ? true : ($pref ? (bool) $pref->email : $meta['default_email']),
            ];
        }

        return $result;
    }

    /**
     * Update user preferences safely.
     */
    public function updatePreferences(User $user, array $preferences): void
    {
        $categories = self::categories();

        foreach ($preferences as $key => $settings) {
            if (!isset($categories[$key])) {
                continue;
            }

            $meta = $categories[$key];
            $inApp = isset($settings['in_app']) ? (bool) $settings['in_app'] : true;
            // Mandatory email cannot be turned off for security
            $email = $meta['mandatory_email'] ? true : (isset($settings['email']) ? (bool) $settings['email'] : true);

            NotificationPreference::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'type' => $key,
                ],
                [
                    'in_app' => $inApp,
                    'email' => $email,
                ]
            );
        }
    }

    /**
     * Check if email should be dispatched.
     */
    public function shouldSendEmail(User $user, string $category, string $priority = 'medium'): bool
    {
        // Critical alerts and account security always send email
        if ($priority === 'critical' || $category === self::CATEGORY_ACCOUNT_SECURITY) {
            return true;
        }

        $pref = NotificationPreference::where('user_id', $user->id)
            ->where('type', $category)
            ->first();

        if (!$pref) {
            // Default: send email for critical and high priority; low priority defaults to in-app only
            return in_array($priority, ['critical', 'high', 'medium'], true);
        }

        return (bool) $pref->email;
    }

    /**
     * Check if in-app notification should be persisted.
     */
    public function shouldSendInApp(User $user, string $category): bool
    {
        $pref = NotificationPreference::where('user_id', $user->id)
            ->where('type', $category)
            ->first();

        if (!$pref) {
            return true;
        }

        return (bool) $pref->in_app;
    }
}
