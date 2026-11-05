<?php

namespace App\Services\Notifications;

use Illuminate\Support\HtmlString;

class NotificationTemplateService
{
    /**
     * Render responsive branded HTML email.
     */
    public function renderHtml(array $payload): string
    {
        $title = htmlspecialchars($payload['title'] ?? 'Notifikasi RAKIT Campus', ENT_QUOTES, 'UTF-8');
        $greeting = htmlspecialchars($payload['greeting'] ?? 'Halo Rekan RAKIT,', ENT_QUOTES, 'UTF-8');
        $message = nl2br(htmlspecialchars($payload['message'] ?? '', ENT_QUOTES, 'UTF-8'));
        $actionUrl = $payload['action_url'] ?? null;
        $actionText = htmlspecialchars($payload['action_text'] ?? 'Buka RAKIT Campus', ENT_QUOTES, 'UTF-8');
        $category = htmlspecialchars($payload['category_name'] ?? 'Notifikasi Sistem', ENT_QUOTES, 'UTF-8');
        $details = $payload['details'] ?? [];
        $appName = config('app.name', 'RAKIT Campus');
        $year = date('Y');

        $detailsHtml = '';
        if (!empty($details) && is_array($details)) {
            $detailsHtml .= '<table style="width: 100%; margin: 16px 0; border-collapse: collapse; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">';
            foreach ($details as $label => $val) {
                $cleanLabel = htmlspecialchars((string) $label, ENT_QUOTES, 'UTF-8');
                $cleanVal = htmlspecialchars((string) $val, ENT_QUOTES, 'UTF-8');
                $detailsHtml .= "<tr>
                    <td style=\"padding: 10px 14px; font-weight: 600; color: #475569; font-size: 13px; width: 35%; border-bottom: 1px solid #E2E8F0;\">{$cleanLabel}</td>
                    <td style=\"padding: 10px 14px; color: #0F172A; font-size: 13px; border-bottom: 1px solid #E2E8F0;\">{$cleanVal}</td>
                </tr>";
            }
            $detailsHtml .= '</table>';
        }

        $buttonHtml = '';
        if ($actionUrl) {
            $safeUrl = htmlspecialchars($actionUrl, ENT_QUOTES, 'UTF-8');
            $buttonHtml = "
            <div style=\"margin: 28px 0; text-align: center;\">
                <a href=\"{$safeUrl}\" style=\"display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFFFFF; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);\">
                    {$actionText} &rarr;
                </a>
            </div>
            <p style=\"font-size: 11px; color: #94A3B8; text-align: center; margin-top: 8px;\">
                Jika tombol di atas tidak dapat diklik, salin tautan berikut ke peramban web Anda:<br/>
                <a href=\"{$safeUrl}\" style=\"color: #2563EB; word-break: break-all;\">{$safeUrl}</a>
            </p>";
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table role="presentation" style="max-width: 580px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); border: 1px solid #E2E8F0;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 24px 32px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-bottom: 3px solid #2563EB;">
                            <table style="width: 100%;">
                                <tr>
                                    <td>
                                        <div style="font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                                            RAKIT<span style="color: #60A5FA;">CAMPUS</span>
                                        </div>
                                    </td>
                                    <td align="right">
                                        <span style="background-color: rgba(37, 99, 235, 0.2); border: 1px solid rgba(96, 165, 250, 0.3); color: #93C5FD; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
                                            {$category}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px;">
                            <h1 style="font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 16px 0; line-height: 1.4;">
                                {$title}
                            </h1>
                            <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0;">
                                {$greeting}
                            </p>
                            <div style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                                {$message}
                            </div>

                            {$detailsHtml}
                            {$buttonHtml}
                        </td>
                    </tr>

                    <!-- Security & Footer -->
                    <tr>
                        <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
                            <p style="font-size: 12px; color: #64748B; margin: 0 0 8px 0;">
                                Email otomatis dari platform <strong>{$appName}</strong>. Jangan membalas email ini secara langsung.
                            </p>
                            <p style="font-size: 11px; color: #94A3B8; margin: 0;">
                                &copy; {$year} RAKIT Campus • Project & Competition Academic Ecosystem.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * Render plain-text fallback.
     */
    public function renderText(array $payload): string
    {
        $title = $payload['title'] ?? 'Notifikasi RAKIT Campus';
        $greeting = $payload['greeting'] ?? 'Halo Rekan RAKIT,';
        $message = $payload['message'] ?? '';
        $actionUrl = $payload['action_url'] ?? '';
        $details = $payload['details'] ?? [];
        $appName = config('app.name', 'RAKIT Campus');

        $text = "RAKIT CAMPUS - {$title}\n";
        $text .= str_repeat('=', strlen($title) + 16) . "\n\n";
        $text .= "{$greeting}\n\n";
        $text .= "{$message}\n\n";

        if (!empty($details)) {
            $text .= "RINCIAN:\n";
            foreach ($details as $label => $val) {
                $text .= "- {$label}: {$val}\n";
            }
            $text .= "\n";
        }

        if ($actionUrl) {
            $text .= "Akses tautan: {$actionUrl}\n\n";
        }

        $text .= "---\n";
        $text .= "Email dikirim secara otomatis oleh {$appName}.";

        return $text;
    }
}
