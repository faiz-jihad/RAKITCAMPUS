<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Project;
use App\Models\StudentProfile;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

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
                'loc' => $baseUrl . '/competitions',
                'lastmod' => $now,
                'changefreq' => 'daily',
                'priority' => '0.9',
            ],
            [
                'loc' => $baseUrl . '/projects',
                'lastmod' => $now,
                'changefreq' => 'daily',
                'priority' => '0.9',
            ],
            [
                'loc' => $baseUrl . '/leaderboard',
                'lastmod' => $now,
                'changefreq' => 'daily',
                'priority' => '0.8',
            ],
            [
                'loc' => $baseUrl . '/matching',
                'lastmod' => $now,
                'changefreq' => 'weekly',
                'priority' => '0.8',
            ],
        ];

        // Public Active Competitions
        try {
            $competitions = Competition::where('moderation_status', 'visible')
                ->select('id', 'slug', 'name', 'cover_image', 'updated_at')
                ->latest('updated_at')
                ->take(500)
                ->get();

            foreach ($competitions as $competition) {
                $slugOrId = !empty($competition->slug) ? $competition->slug : $competition->id;
                $entry = [
                    'loc' => $baseUrl . '/competitions/' . urlencode($slugOrId),
                    'lastmod' => $competition->updated_at?->toAtomString() ?? $now,
                    'changefreq' => 'weekly',
                    'priority' => '0.8',
                ];

                if (!empty($competition->cover_image)) {
                    $imgUrl = Str::startsWith($competition->cover_image, ['http://', 'https://'])
                        ? $competition->cover_image
                        : $baseUrl . '/' . ltrim($competition->cover_image, '/');
                    $entry['image'] = [
                        'loc' => $imgUrl,
                        'title' => $competition->name,
                    ];
                }

                $urls[] = $entry;
            }
        } catch (\Throwable) {
            // graceful fallback if DB error
        }

        // Public Projects
        try {
            $projects = Project::where('moderation_status', 'visible')
                ->where('visibility', 'public')
                ->select('id', 'slug', 'title', 'cover_image', 'updated_at')
                ->latest('updated_at')
                ->take(500)
                ->get();

            foreach ($projects as $project) {
                $slugOrId = !empty($project->slug) ? $project->slug : $project->id;
                $entry = [
                    'loc' => $baseUrl . '/projects/' . urlencode($slugOrId),
                    'lastmod' => $project->updated_at?->toAtomString() ?? $now,
                    'changefreq' => 'weekly',
                    'priority' => '0.8',
                ];

                if (!empty($project->cover_image)) {
                    $imgUrl = Str::startsWith($project->cover_image, ['http://', 'https://'])
                        ? $project->cover_image
                        : $baseUrl . '/' . ltrim($project->cover_image, '/');
                    $entry['image'] = [
                        'loc' => $imgUrl,
                        'title' => $project->title,
                    ];
                }

                $urls[] = $entry;
            }
        } catch (\Throwable) {
            // graceful fallback
        }

        // Public Student Portfolios
        try {
            $profiles = StudentProfile::where('portfolio_public', true)
                ->whereNotNull('slug')
                ->where('slug', '!=', '')
                ->with('user:id,name')
                ->select('id', 'user_id', 'slug', 'updated_at')
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
        $xml .= '        xmlns:xhtml="http://www.w3.org/1999/xhtml"' . "\n";
        $xml .= '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

        foreach ($urls as $item) {
            $xml .= '    <url>' . "\n";
            $xml .= '        <loc>' . htmlspecialchars($item['loc'], ENT_XML1, 'UTF-8') . '</loc>' . "\n";
            $xml .= '        <lastmod>' . $item['lastmod'] . '</lastmod>' . "\n";
            $xml .= '        <changefreq>' . $item['changefreq'] . '</changefreq>' . "\n";
            $xml .= '        <priority>' . $item['priority'] . '</priority>' . "\n";
            if (!empty($item['image'])) {
                $xml .= '        <image:image>' . "\n";
                $xml .= '            <image:loc>' . htmlspecialchars($item['image']['loc'], ENT_XML1, 'UTF-8') . '</image:loc>' . "\n";
                if (!empty($item['image']['title'])) {
                    $xml .= '            <image:title>' . htmlspecialchars($item['image']['title'], ENT_XML1, 'UTF-8') . '</image:title>' . "\n";
                }
                $xml .= '        </image:image>' . "\n";
            }
            $xml .= '    </url>' . "\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
            'X-Robots-Tag' => 'noindex, follow',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
