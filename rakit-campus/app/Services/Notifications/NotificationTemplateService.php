<?php

namespace App\Services\Notifications;

use App\Contracts\Notifications\NotificationTemplateServiceInterface;
use Illuminate\Support\HtmlString;

class NotificationTemplateService implements NotificationTemplateServiceInterface
{
    /**
     * Render responsive branded HTML email aligned with the RAKIT Campus design system.
     */
    public function renderHtml(array $payload): string
    {
        $title = htmlspecialchars($payload['title'] ?? 'Notifikasi RAKIT Campus', ENT_QUOTES, 'UTF-8');
        $greeting = htmlspecialchars($payload['greeting'] ?? 'Halo Rekan Mahasiswa,', ENT_QUOTES, 'UTF-8');
        $rawMessage = $payload['message'] ?? '';
        $message = nl2br(htmlspecialchars($rawMessage, ENT_QUOTES, 'UTF-8'));
        $previewText = htmlspecialchars(mb_strimwidth(strip_tags($rawMessage), 0, 110, '...'), ENT_QUOTES, 'UTF-8');
        $rawActionUrl = $payload['action_url'] ?? null;
        $actionUrl = $rawActionUrl ? (str_starts_with($rawActionUrl, 'http') ? $rawActionUrl : url($rawActionUrl)) : null;
        $actionText = htmlspecialchars($payload['action_text'] ?? 'Buka RAKIT Campus', ENT_QUOTES, 'UTF-8');
        $category = htmlspecialchars($payload['category_name'] ?? 'Notifikasi', ENT_QUOTES, 'UTF-8');
        $recipientEmail = !empty($payload['recipient_email']) ? htmlspecialchars((string) $payload['recipient_email'], ENT_QUOTES, 'UTF-8') : null;
        $details = $payload['details'] ?? [];
        $year = date('Y');

        $detailsHtml = '';
        if (!empty($details) && is_array($details)) {
            $detailsHtml .= '<div style="margin: 22px 0; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 6px 18px;">';
            $detailsHtml .= '<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">';
            $keys = array_keys($details);
            $lastIndex = count($keys) - 1;
            $i = 0;
            foreach ($details as $label => $val) {
                $cleanLabel = htmlspecialchars(ucwords(str_replace('_', ' ', (string) $label)), ENT_QUOTES, 'UTF-8');
                $cleanVal = htmlspecialchars((string) $val, ENT_QUOTES, 'UTF-8');
                $borderBottom = ($i < $lastIndex) ? 'border-bottom: 1px solid #EEF2F6;' : '';
                $detailsHtml .= "<tr>
                    <td style=\"padding: 11px 0; font-weight: 500; color: #64748B; font-size: 13px; width: 40%; vertical-align: top; {$borderBottom}\">{$cleanLabel}</td>
                    <td style=\"padding: 11px 0; color: #0F172A; font-weight: 600; font-size: 13px; text-align: right; vertical-align: top; {$borderBottom}\">{$cleanVal}</td>
                </tr>";
                $i++;
            }
            $detailsHtml .= '</table></div>';
        }

        $buttonHtml = '';
        if ($actionUrl) {
            $safeUrl = htmlspecialchars($actionUrl, ENT_QUOTES, 'UTF-8');
            $buttonHtml = "
            <div style=\"margin: 28px 0 24px 0;\">
                <table role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin: 0 auto;\">
                    <tr>
                        <td align=\"center\" style=\"border-radius: 10px; background-color: #2563EB;\">
                            <a href=\"{$safeUrl}\" target=\"_blank\" style=\"font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 13px 28px; border-radius: 10px; display: inline-block; border: 1px solid #2563EB; letter-spacing: -0.1px;\">
                                {$actionText} &rarr;
                            </a>
                        </td>
                    </tr>
                </table>
            </div>
            <div style=\"margin-top: 16px; padding: 12px 16px; background-color: #F8FAFC; border: 1px dashed #E2E8F0; border-radius: 8px; text-align: left;\">
                <p style=\"font-size: 11.5px; color: #64748B; margin: 0 0 4px 0;\">Tautan akses alternatif:</p>
                <a href=\"{$safeUrl}\" style=\"color: #2563EB; font-size: 11.5px; word-break: break-all; text-decoration: none; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;\">{$safeUrl}</a>
            </div>";
        }

        $recipientNotice = $recipientEmail
            ? "<span style=\"color: #64748B;\">Email ini dikirimkan ke <strong style=\"color: #334155;\">{$recipientEmail}</strong> terkait aktivitas akun RAKIT Campus Anda.</span>"
            : "<span style=\"color: #64748B;\">Email ini dikirimkan kepada Anda terkait aktivitas akun di platform RAKIT Campus.</span>";

        return <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no, address=no, email=no, date=no">
    <title>{$title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <!-- Hidden Preheader for clean inbox preview -->
    <div style="display: none; font-size: 1px; color: #F8FAFC; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        {$previewText}
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #F8FAFC;">
        <tr>
            <td align="center" style="padding: 40px 16px 48px 16px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; border-collapse: collapse; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.03), 0 2px 4px -2px rgba(15, 23, 42, 0.03);">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #FFFFFF; border-bottom: 1px solid #F1F5F9;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="vertical-align: middle;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="vertical-align: middle; padding-right: 12px;">
                                                    <div style="width: 36px; height: 36px; border-radius: 10px; border: 1px solid #E2E8F0; background-color: #FFFFFF; text-align: center; line-height: 36px;">
                                                        <img src="https://rakitcampus.my.id/images/rakit-mark.png" alt="RAKIT" width="22" height="22" style="vertical-align: middle; border: 0; margin-top: 6px;" />
                                                    </div>
                                                </td>
                                                <td style="vertical-align: middle;">
                                                    <div style="font-size: 15px; font-weight: 800; color: #0F172A; letter-spacing: -0.3px; line-height: 1.1;">
                                                        RAKIT CAMPUS
                                                    </div>
                                                    <div style="font-size: 11px; color: #64748B; font-weight: 500; margin-top: 2px;">
                                                        Ruang Kolaborasi Mahasiswa
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right" style="vertical-align: middle;">
                                        <span style="display: inline-block; background-color: #EFF6FF; color: #2563EB; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; border: 1px solid #DBEAFE; text-transform: uppercase; letter-spacing: 0.5px;">
                                            {$category}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 32px 28px 32px;">
                            <h1 style="font-size: 19px; font-weight: 700; color: #0F172A; margin: 0 0 16px 0; line-height: 1.35; letter-spacing: -0.3px;">
                                {$title}
                            </h1>
                            <p style="font-size: 14px; font-weight: 600; color: #334155; margin: 0 0 14px 0;">
                                {$greeting}
                            </p>
                            <div style="font-size: 14px; color: #475569; line-height: 1.65; margin: 0 0 16px 0;">
                                {$message}
                            </div>

                            {$detailsHtml}
                            {$buttonHtml}
                        </td>
                    </tr>

                    <!-- Official Campus Security & Trust Footer -->
                    <tr>
                        <td style="padding: 24px 32px 32px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
                            <p style="font-size: 12px; color: #64748B; line-height: 1.55; margin: 0 0 12px 0;">
                                {$recipientNotice}<br/>
                                <span style="font-size: 11px; color: #94A3B8;">Sistem RAKIT Campus tidak pernah meminta kata sandi Anda melalui email.</span>
                            </p>

                            <div style="padding-top: 8px; border-top: 1px solid #EEF2F6; margin-top: 12px;">
                                <p style="font-size: 11px; color: #94A3B8; margin: 0 0 8px 0;">
                                    <a href="https://rakitcampus.my.id" style="color: #64748B; text-decoration: none; margin: 0 8px; font-weight: 500;">Beranda</a>
                                    &bull;
                                    <a href="https://rakitcampus.my.id/competitions" style="color: #64748B; text-decoration: none; margin: 0 8px; font-weight: 500;">Eksplor Lomba</a>
                                    &bull;
                                    <a href="https://rakitcampus.my.id/notifications" style="color: #64748B; text-decoration: none; margin: 0 8px; font-weight: 500;">Pengaturan Notifikasi</a>
                                </p>
                                <p style="font-size: 11px; color: #94A3B8; margin: 0;">
                                    &copy; {$year} RAKIT Campus &bull; Ekosistem Kolaborasi & Kompetisi Mahasiswa
                                </p>
                            </div>
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
        $greeting = $payload['greeting'] ?? 'Halo Rekan Mahasiswa,';
        $message = $payload['message'] ?? '';
        $rawActionUrl = $payload['action_url'] ?? '';
        $actionUrl = $rawActionUrl ? (str_starts_with($rawActionUrl, 'http') ? $rawActionUrl : url($rawActionUrl)) : '';
        $details = $payload['details'] ?? [];
        $appName = config('app.name', 'RAKIT Campus');

        $text = "RAKIT CAMPUS\n";
        $text .= "Ruang Kolaborasi Mahasiswa\n";
        $text .= str_repeat('=', 40) . "\n\n";
        $text .= "{$title}\n\n";
        $text .= "{$greeting}\n\n";
        $text .= "{$message}\n\n";

        if (!empty($details) && is_array($details)) {
            $text .= "RINCIAN:\n";
            foreach ($details as $label => $val) {
                $cleanLabel = ucwords(str_replace('_', ' ', (string) $label));
                $text .= "• {$cleanLabel}: {$val}\n";
            }
            $text .= "\n";
        }

        if ($actionUrl) {
            $text .= "Akses tautan resmi:\n{$actionUrl}\n\n";
        }

        $text .= "---\n";
        $text .= "Email otomatis dari {$appName} (https://rakitcampus.my.id).\n";
        $text .= "Sistem tidak pernah meminta kata sandi Anda melalui email.\n";

        return $text;
    }
}
