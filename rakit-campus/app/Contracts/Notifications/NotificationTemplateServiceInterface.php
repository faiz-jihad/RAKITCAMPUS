<?php

namespace App\Contracts\Notifications;

interface NotificationTemplateServiceInterface
{
    /**
     * Render responsive branded HTML email.
     */
    public function renderHtml(array $payload): string;

    /**
     * Render plain-text fallback.
     */
    public function renderText(array $payload): string;
}
