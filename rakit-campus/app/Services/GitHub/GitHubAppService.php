<?php

namespace App\Services\GitHub;

use App\Models\GitHub\GitHubInstallation;
use App\Models\GitHub\GitHubRepository;
use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class GitHubAppService
{
    protected ?string $appId;
    protected ?string $privateKey;
    protected ?string $webhookSecret;
    protected ?string $fallbackToken;
    protected string $apiUrl;
    protected string $userAgent;

    public function __construct()
    {
        $this->appId = (string) config('github.app_id');
        $this->webhookSecret = config('github.webhook_secret');
        $this->fallbackToken = config('github.token');
        $this->apiUrl = rtrim(config('github.api_url', 'https://api.github.com'), '/');
        $this->userAgent = config('github.user_agent', 'RAKIT-Campus-Integration/1.0');

        $this->privateKey = config('github.private_key');
        if (! $this->privateKey && ($path = config('github.private_key_path')) && file_exists($path)) {
            $this->privateKey = file_get_contents($path);
        }
    }

    /**
     * Parse any GitHub repository URL or slug into [owner, repo, full_name].
     */
    public function parseRepositoryUrl(string $url): array
    {
        $cleaned = trim($url);
        $cleaned = rtrim($cleaned, '/');

        // Remove trailing .git
        $cleaned = preg_replace('/\.git$/i', '', $cleaned);

        // Support formats:
        // https://github.com/owner/repo
        // http://github.com/owner/repo
        // github.com/owner/repo
        // git@github.com:owner/repo
        // owner/repo
        $pattern = '#^(?:https?://github\.com/|github\.com/|git@github\.com:)?([a-zA-Z0-9_\-\.]+)/([a-zA-Z0-9_\-\.]+)$#i';

        if (preg_match($pattern, $cleaned, $matches)) {
            $owner = $matches[1];
            $repo = $matches[2];

            return [
                'owner' => $owner,
                'repo' => $repo,
                'full_name' => "{$owner}/{$repo}",
                'html_url' => "https://github.com/{$owner}/{$repo}",
            ];
        }

        throw new InvalidArgumentException("Format URL repositori GitHub tidak valid: '{$url}'. Contoh format yang didukung: https://github.com/owner/repo");
    }

    /**
     * Verify HMAC-SHA256 signature from GitHub Webhook header (X-Hub-Signature-256).
     */
    public function verifyWebhookSignature(string $rawPayload, ?string $signatureHeader, ?string $customSecret = null): bool
    {
        $secret = $customSecret ?: $this->webhookSecret;

        if (empty($secret) || empty($signatureHeader)) {
            return false;
        }

        if (! str_starts_with($signatureHeader, 'sha256=')) {
            return false;
        }

        $expectedSignature = 'sha256=' . hash_hmac('sha256', $rawPayload, $secret);

        return hash_equals($expectedSignature, $signatureHeader);
    }

    /**
     * Generate an RS256 JWT for GitHub App authentication.
     */
    public function generateAppJwt(): ?string
    {
        if (empty($this->appId) || empty($this->privateKey)) {
            return null;
        }

        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $now = time();
        $payload = [
            'iat' => $now - 60,       // Issued 1 min ago to prevent clock drift
            'exp' => $now + (10 * 60),// 10 minutes max
            'iss' => (int) $this->appId,
        ];

        $encodedHeader = $this->base64UrlEncode(json_encode($header));
        $encodedPayload = $this->base64UrlEncode(json_encode($payload));
        $dataToSign = "{$encodedHeader}.{$encodedPayload}";

        $signature = '';
        $binaryKey = openssl_pkey_get_private($this->privateKey);

        if (! $binaryKey) {
            Log::warning('GitHub App private key is invalid or cannot be parsed.');
            return null;
        }

        $success = openssl_sign($dataToSign, $signature, $binaryKey, OPENSSL_ALGO_SHA256);

        if (! $success) {
            Log::error('Failed to sign GitHub App JWT using OpenSSL.');
            return null;
        }

        $encodedSignature = $this->base64UrlEncode($signature);

        return "{$dataToSign}.{$encodedSignature}";
    }

    /**
     * Get or fetch an installation access token for a given installation ID.
     */
    public function getInstallationToken(int $installationId): ?string
    {
        $cacheKey = "github:installation_token:{$installationId}";

        return Cache::remember($cacheKey, 50 * 60, function () use ($installationId) {
            $jwt = $this->generateAppJwt();

            if (! $jwt) {
                return $this->fallbackToken;
            }

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$jwt}",
                'Accept' => 'application/vnd.github+json',
                'User-Agent' => $this->userAgent,
                'X-GitHub-Api-Version' => '2022-11-28',
            ])->post("{$this->apiUrl}/app/installations/{$installationId}/access_tokens");

            if ($response->successful()) {
                $data = $response->json();
                $token = $data['token'] ?? null;
                $expiresAt = isset($data['expires_at']) ? strtotime($data['expires_at']) : null;

                // Update installation record if present
                if ($installation = GitHubInstallation::where('installation_id', $installationId)->first()) {
                    $installation->update([
                        'access_token' => $token,
                        'token_expires_at' => $expiresAt ? date('Y-m-d H:i:s', $expiresAt) : null,
                        'permissions' => $data['permissions'] ?? null,
                    ]);
                }

                return $token;
            }

            Log::warning("Failed to obtain GitHub App installation access token for ID {$installationId}: " . $response->body());
            return $this->fallbackToken;
        });
    }

    /**
     * Discover installation ID for a given repository owner/name.
     */
    public function findRepositoryInstallationId(string $owner, string $repo): ?int
    {
        $jwt = $this->generateAppJwt();

        if (! $jwt) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$jwt}",
                'Accept' => 'application/vnd.github+json',
                'User-Agent' => $this->userAgent,
                'X-GitHub-Api-Version' => '2022-11-28',
            ])->get("{$this->apiUrl}/repos/{$owner}/{$repo}/installation");

            if ($response->successful()) {
                $instData = $response->json();
                $instId = $instData['id'] ?? null;

                if ($instId) {
                    GitHubInstallation::updateOrCreate(
                        ['installation_id' => $instId],
                        [
                            'account_login' => $instData['account']['login'] ?? $owner,
                            'account_type' => $instData['account']['type'] ?? 'User',
                            'repository_selection' => $instData['repository_selection'] ?? 'selected',
                            'permissions' => $instData['permissions'] ?? null,
                        ]
                    );

                    return (int) $instId;
                }
            }
        } catch (Exception $e) {
            Log::warning("Error discovering installation for {$owner}/{$repo}: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Send an authenticated API request with rate-limit and error handling.
     */
    public function request(string $method, string $path, array $queryParams = [], ?GitHubRepository $repo = null, array $body = []): Response
    {
        $url = str_starts_with($path, 'http') ? $path : "{$this->apiUrl}/" . ltrim($path, '/');
        $token = $this->resolveTokenForRepo($repo);

        $headers = [
            'Accept' => 'application/vnd.github+json',
            'User-Agent' => $this->userAgent,
            'X-GitHub-Api-Version' => '2022-11-28',
        ];

        if ($token) {
            $headers['Authorization'] = "Bearer {$token}";
        }

        $timeout = config('github.sync.timeout_seconds', 45);

        $response = Http::withHeaders($headers)
            ->timeout($timeout)
            ->retry(3, 1000, function ($exception, $request) {
                // Retry on connection timeout or 5xx server errors
                return $exception instanceof \Illuminate\Http\Client\ConnectionException;
            })
            ->send($method, $url, [
                'query' => $queryParams,
                'json' => ! empty($body) ? $body : null,
            ]);

        // Track and log rate-limit headers
        $this->handleRateLimitHeaders($response);

        return $response;
    }

    /**
     * Resolve the best available access token for a repository.
     */
    protected function resolveTokenForRepo(?GitHubRepository $repo): ?string
    {
        if ($repo && $repo->installation_id) {
            $token = $this->getInstallationToken($repo->installation_id);
            if ($token) {
                return $token;
            }
        }

        return $this->fallbackToken;
    }

    protected function handleRateLimitHeaders(Response $response): void
    {
        $remaining = $response->header('X-RateLimit-Remaining');
        $resetTime = $response->header('X-RateLimit-Reset');

        if ($remaining !== null && (int) $remaining <= config('github.sync.rate_limit_pause_threshold', 10)) {
            Log::warning("GitHub API rate limit critical: {$remaining} requests remaining. Resets at " . date('Y-m-d H:i:s', (int) $resetTime));
        }
    }

    /**
     * Fetch repository metadata from GitHub.
     */
    public function getRepository(string $owner, string $repo, ?GitHubRepository $repoModel = null): ?array
    {
        $response = $this->request('GET', "repos/{$owner}/{$repo}", [], $repoModel);

        if ($response->successful()) {
            return $response->json();
        }

        if ($response->status() === 404) {
            throw new Exception("Repositori '{$owner}/{$repo}' tidak ditemukan di GitHub atau berstatus private tanpa izin akses GitHub App.");
        }

        if ($response->status() === 401 || $response->status() === 403) {
            throw new Exception("Akses ke repositori '{$owner}/{$repo}' ditolak ({$response->status()}). Pastikan GitHub App telah diinstal di repositori ini.");
        }

        throw new Exception("Gagal menghubungi GitHub API: HTTP {$response->status()} - {$response->body()}");
    }

    /**
     * Fetch all branches for a repository.
     */
    public function getBranches(string $owner, string $repo, ?GitHubRepository $repoModel = null): array
    {
        $branches = [];
        $page = 1;

        do {
            $response = $this->request('GET', "repos/{$owner}/{$repo}/branches", [
                'per_page' => 100,
                'page' => $page,
            ], $repoModel);

            if (! $response->successful()) {
                Log::warning("Failed to fetch branches page {$page} for {$owner}/{$repo}: " . $response->body());
                break;
            }

            $items = $response->json();
            if (empty($items) || ! is_array($items)) {
                break;
            }

            $branches = array_merge($branches, $items);
            $page++;
        } while (count($items) === 100 && $page <= 10);

        return $branches;
    }

    /**
     * Fetch commits for a repository with pagination.
     */
    public function getCommits(string $owner, string $repo, array $params = [], ?GitHubRepository $repoModel = null): array
    {
        $commits = [];
        $perPage = config('github.sync.commits_per_page', 100);
        $maxPages = config('github.sync.max_commit_pages', 30);
        $page = 1;

        do {
            $queryParams = array_merge([
                'per_page' => $perPage,
                'page' => $page,
            ], $params);

            $response = $this->request('GET', "repos/{$owner}/{$repo}/commits", $queryParams, $repoModel);

            if (! $response->successful()) {
                Log::warning("Failed to fetch commits page {$page} for {$owner}/{$repo}: " . $response->body());
                break;
            }

            $items = $response->json();
            if (empty($items) || ! is_array($items)) {
                break;
            }

            $commits = array_merge($commits, $items);
            $page++;
        } while (count($items) === $perPage && $page <= $maxPages);

        return $commits;
    }

    /**
     * Fetch all Pull Requests for a repository.
     */
    public function getPullRequests(string $owner, string $repo, array $params = [], ?GitHubRepository $repoModel = null): array
    {
        $prs = [];
        $perPage = config('github.sync.prs_per_page', 100);
        $maxPages = config('github.sync.max_pr_pages', 10);
        $page = 1;

        do {
            $queryParams = array_merge([
                'state' => 'all',
                'per_page' => $perPage,
                'page' => $page,
            ], $params);

            $response = $this->request('GET', "repos/{$owner}/{$repo}/pulls", $queryParams, $repoModel);

            if (! $response->successful()) {
                Log::warning("Failed to fetch PRs page {$page} for {$owner}/{$repo}: " . $response->body());
                break;
            }

            $items = $response->json();
            if (empty($items) || ! is_array($items)) {
                break;
            }

            $prs = array_merge($prs, $items);
            $page++;
        } while (count($items) === $perPage && $page <= $maxPages);

        return $prs;
    }

    /**
     * Fetch reviews for a specific pull request.
     */
    public function getPullRequestReviews(string $owner, string $repo, int $prNumber, ?GitHubRepository $repoModel = null): array
    {
        $response = $this->request('GET', "repos/{$owner}/{$repo}/pulls/{$prNumber}/reviews", [
            'per_page' => 100,
        ], $repoModel);

        if ($response->successful()) {
            return $response->json() ?: [];
        }

        return [];
    }

    /**
     * Fetch repository contributor stats.
     */
    public function getContributors(string $owner, string $repo, ?GitHubRepository $repoModel = null): array
    {
        $response = $this->request('GET', "repos/{$owner}/{$repo}/contributors", [
            'per_page' => 100,
            'anon' => 'true',
        ], $repoModel);

        if ($response->successful()) {
            return $response->json() ?: [];
        }

        return [];
    }

    /**
     * Base64Url helper according to RFC 7515.
     */
    protected function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
