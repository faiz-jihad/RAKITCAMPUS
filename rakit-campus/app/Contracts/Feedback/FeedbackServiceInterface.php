<?php

namespace App\Contracts\Feedback;

use App\Models\SystemFeedback;
use App\Models\User;

interface FeedbackServiceInterface
{
    /**
     * Store system feedback, suggestion, or bug report atomically.
     *
     * @param  array<string, mixed>  $data
     */
    public function submitFeedback(array $data, ?User $user = null, ?string $ip = null, ?string $userAgent = null): SystemFeedback;

    /**
     * Update status and resolution notes of a feedback item atomically.
     */
    public function updateStatus(int|SystemFeedback $feedback, string $status, ?string $adminNotes = null, ?User $admin = null): SystemFeedback;

    /**
     * Delete a feedback record atomically.
     */
    public function deleteFeedback(int|SystemFeedback $feedback, ?User $admin = null): bool;
}
