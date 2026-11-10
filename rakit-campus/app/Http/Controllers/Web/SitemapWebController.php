<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Project;
use App\Models\StudentProfile;
use Illuminate\Http\Response;

class SitemapWebController extends Controller
{
    /**
     * Generate dynamic XML Sitemap for Google, Bing, and AI search crawlers.
     */
    public function index(): Response
    {
        $baseUrl = rtrim(config('app.url', 'https://rakitcampus.my.id'), '/');
        $now = now()->toAtomString();

        $urls = [
            [
                'loc' => $baseUrl . '/',
                'lastmod' => $now,
                'changefreq' => 'daily',
                'priority' => '1.0',
            ],
            [
                'loc' => $baseUrl . '/projects',
                'lastmod' => $now,
                'changefreq' => 'daily',
                'priority' => '0.9',
            ],
            [
                'loc' => $baseUrl . '/competitions',
                'lastmod' => $now,
                'changefreq' => 'daily',
                'priority' => '0.9',
            ],
            [
                'loc' => $baseUrl . '/matching',
                'lastmod' => $now,
                'changefreq' => 'weekly',
                'priority' => '0.8',
            ],
            [
                'loc' => $baseUrl . '/login',
                'lastmod' => $now,
                'changefreq' => 'monthly',
                'priority' => '0.5',
            ],
            [
                'loc' => $baseUrl . '/register',
                'lastmod' => $now,
                'changefreq' => 'monthly',
                'priority' => '0.5',
            ],
        ];

        // Public Projects
        try {
            $projects = Project::visibleTo(null)
                ->select('id', 'updated_at')
                ->latest('updated_at')
                ->take(500)
                ->get();

            foreach ($projects as $project) {
                $urls[] = [
                    'loc' => $baseUrl . '/projects/' . $project->id,
                    'lastmod' => $project->updated_at?->toAtomString() ?? $now,
                    'changefreq' => 'weekly',
                    'priority' => '0.8',
                ];
            }
        } catch (\Throwable) {
            // graceful fallback if DB is unreachable
        }

        // Public Competitions
        try {
            $competitions = Competition::visibleTo(null)
                ->select('id', 'updated_at')
                ->latest('updated_at')
                ->take(500)
                ->get();

            foreach ($competitions as $competition) {
                $urls[] = [
                    'loc' => $baseUrl . '/competitions/' . $competition->id,
                    'lastmod' => $competition->updated_at?->toAtomString() ?? $now,
                    'changefreq' => 'weekly',
                    'priority' => '0.8',
                ];
            }
        } catch (\Throwable) {
            // graceful fallback
        }

        // Public Portfolios
        try {
            $profiles = StudentProfile::whereNotNull('slug')
                ->where('slug', '!=', '')
                ->select('slug', 'updated_at')
                ->latest('updated_at')
                ->take(500)
                ->get();

            foreach ($profiles as $profile) {
                $urls[] = [
                    'loc' => $baseUrl . '/p/' . urlencode($profile->slug),
                    'lastmod' => $profile->updated_at?->toAtomString() ?? $now,
                    'changefreq' => 'weekly',
                    'priority' => '0.7',
                ];
            }
        } catch (\Throwable) {
            // graceful fallback
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
        $xml .= '        xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";

        foreach ($urls as $item) {
            $xml .= '    <url>' . "\n";
            $xml .= '        <loc>' . htmlspecialchars($item['loc'], ENT_XML1, 'UTF-8') . '</loc>' . "\n";
            $xml .= '        <lastmod>' . $item['lastmod'] . '</lastmod>' . "\n";
            $xml .= '        <changefreq>' . $item['changefreq'] . '</changefreq>' . "\n";
            $xml .= '        <priority>' . $item['priority'] . '</priority>' . "\n";
            $xml .= '    </url>' . "\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
            'X-Robots-Tag' => 'noindex, follow', // Do not index the sitemap XML itself, but follow the URLs
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
