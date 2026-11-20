<?php

namespace App\Services\Payment;

use App\Exceptions\KaseraPayException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KaseraPayService
{
    protected ?string $apiKey;
    protected ?string $webhookSecret;
    protected string $baseUrl;
    protected string $environment;
    protected int $webhookTolerance;
    protected int $timeout;

    public function __construct()
    {
        $this->apiKey = config('kaserapay.api_key');
        $this->webhookSecret = config('kaserapay.webhook_secret');
        $this->baseUrl = rtrim(config('kaserapay.base_url', 'https://pay.kasera.id'), '/');
        $this->environment = config('kaserapay.environment', 'sandbox');
        $this->webhookTolerance = (int) config('kaserapay.webhook_tolerance', 300);
        $this->timeout = (int) config('kaserapay.timeout', 15);
    }

    /**
     * Check whether Kasera Pay credentials are configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Check whether live production mode is active.
     */
    public function isLive(): bool
    {
        return str_starts_with($this->apiKey ?? '', 'kp_live_') || $this->environment === 'production';
    }

    public function getEnvironment(): string
    {
        return $this->environment;
    }

    /**
     * Create a payment transaction via Kasera Pay Hosted Checkout.
     *
     * @param array{
     *     amount: int,
     *     description: string,
     *     external_id: string,
     *     payment_methods?: array,
     *     return_url?: string,
     *     customer?: array,
     *     metadata?: array
     * } $params
     * @return array
     * @throws KaseraPayException
     */
    public function createTransaction(array $params): array
    {
        if (!$this->isConfigured()) {
            throw new KaseraPayException(
                'Kredensial API Kasera Pay (KASERA_PAY_API_KEY) belum dikonfigurasi di server.',
                500
            );
        }

        $amount = (int) $params['amount'];
        if ($amount <= 0) {
            throw new KaseraPayException('Nominal pembayaran harus lebih besar dari 0 Rupiah.', 422);
        }

        $externalId = (string) ($params['external_id'] ?? $params['order_number'] ?? '');
        if (empty($externalId)) {
            throw new KaseraPayException('Parameter external_id atau order_number wajib diisi.', 422);
        }

        $payload = [
            'amount' => $amount,
            'description' => (string) ($params['description'] ?? 'Pembayaran RAKIT Campus'),
            'external_id' => $externalId,
            'payment_methods' => $params['payment_methods'] ?? ['qris'],
        ];

        if (!empty($params['return_url'])) {
            $payload['return_url'] = $params['return_url'];
        }

        if (!empty($params['customer'])) {
            $payload['customer'] = $params['customer'];
        }

        if (!empty($params['metadata'])) {
            $payload['metadata'] = $params['metadata'];
        }

        try {
            $response = Http::timeout($this->timeout)
                ->withToken($this->apiKey)
                ->withHeaders([
                    'Idempotency-Key' => $externalId,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post("{$this->baseUrl}/v1/transactions", $payload);

            if ($response->successful()) {
                $json = $response->json();
                Log::info('Kasera Pay transaction created successfully', [
                    'external_id' => $externalId,
                    'transaction_id' => $json['id'] ?? null,
                    'status' => $json['status'] ?? null,
                ]);
                return $json;
            }

            $errorBody = $response->json() ?? [];
            $errorMessage = $errorBody['message'] ?? $errorBody['error'] ?? "Kasera Pay API Error (HTTP {$response->status()})";

            Log::error('Kasera Pay API createTransaction failed', [
                'external_id' => $params['external_id'],
                'http_status' => $response->status(),
                'error' => $errorBody,
            ]);

            throw new KaseraPayException(
                $errorMessage,
                $response->status(),
                $response->status(),
                $errorBody
            );
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Kasera Pay connection timeout', [
                'external_id' => $params['external_id'],
                'message' => $e->getMessage(),
            ]);
            throw new KaseraPayException('Gagal terhubung ke server Kasera Pay. Silakan periksa koneksi internet Anda.', 504, 504, null, $e);
        }
    }

    /**
     * Retrieve transaction status by Kasera transaction ID (e.g. payreq_9b2f).
     *
     * @param string $transactionId
     * @return array
     * @throws KaseraPayException
     */
    public function getTransaction(string $transactionId): array
    {
        if (!$this->isConfigured()) {
            throw new KaseraPayException('Kredensial API Kasera Pay belum dikonfigurasi.', 500);
        }

        try {
            $response = Http::timeout($this->timeout)
                ->withToken($this->apiKey)
                ->withHeaders(['Accept' => 'application/json'])
                ->get("{$this->baseUrl}/v1/transactions/{$transactionId}");

            if ($response->successful()) {
                return $response->json();
            }

            $errorBody = $response->json() ?? [];
            throw new KaseraPayException(
                $errorBody['message'] ?? "Gagal mengambil data transaksi dari Kasera Pay (HTTP {$response->status()})",
                $response->status(),
                $response->status(),
                $errorBody
            );
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            throw new KaseraPayException('Koneksi ke Kasera Pay terputus saat verifikasi status.', 504, 504, null, $e);
        }
    }

    /**
     * Query transaction by external order reference ID.
     *
     * @param string $externalId
     * @return array|null
     */
    public function getTransactionByExternalId(string $externalId): ?array
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $response = Http::timeout($this->timeout)
                ->withToken($this->apiKey)
                ->withHeaders(['Accept' => 'application/json'])
                ->get("{$this->baseUrl}/v1/transactions", [
                    'external_id' => $externalId,
                    'limit' => 1,
                ]);

            if ($response->successful()) {
                $json = $response->json();
                $data = $json['data'] ?? $json['transactions'] ?? (is_array($json) && isset($json[0]) ? $json : null);
                if (!empty($data) && is_array($data)) {
                    return $data[0] ?? null;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Kasera Pay getTransactionByExternalId failed', [
                'external_id' => $externalId,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Cryptographically verify incoming webhook signature from Kasera Pay.
     *
     * Signature Header format:
     * Kasera-Signature-V1: t=<unix_timestamp>,v1=<hex_signature>
     *
     * Signed string:
     * <unix_timestamp>.<raw_body>
     *
     * Algorithm:
     * HMAC-SHA256 with webhook_secret
     *
     * @param string $rawBody
     * @param string|null $signatureHeader
     * @return bool
     */
    public function verifyWebhookSignature(string $rawBody, ?string $signatureHeader): bool
    {
        if (empty($rawBody) || empty($signatureHeader) || empty($this->webhookSecret)) {
            Log::warning('Kasera Pay webhook signature verification failed: missing body, signature header, or webhook secret', [
                'has_body' => !empty($rawBody),
                'has_header' => !empty($signatureHeader),
                'has_secret' => !empty($this->webhookSecret),
            ]);
            return false;
        }

        // Parse comma-separated parts
        $parts = explode(',', $signatureHeader);
        $timestamp = null;
        $signatures = [];

        foreach ($parts as $part) {
            $part = trim($part);
            if (str_starts_with($part, 't=')) {
                $timestamp = (int) substr($part, 2);
            } elseif (str_starts_with($part, 'v1=')) {
                $signatures[] = substr($part, 3);
            }
        }

        if ($timestamp === null || empty($signatures)) {
            Log::warning('Kasera Pay webhook signature format invalid', [
                'header' => $signatureHeader,
            ]);
            return false;
        }

        // Replay attack protection (tolerance window)
        $now = time();
        if (abs($now - $timestamp) > $this->webhookTolerance) {
            Log::warning('Kasera Pay webhook timestamp outside tolerance window', [
                'timestamp' => $timestamp,
                'now' => $now,
                'diff' => abs($now - $timestamp),
                'tolerance' => $this->webhookTolerance,
            ]);
            return false;
        }

        $signedPayload = "{$timestamp}.{$rawBody}";
        $expectedSignature = hash_hmac('sha256', $signedPayload, $this->webhookSecret);

        foreach ($signatures as $receivedSig) {
            if (hash_equals($expectedSignature, $receivedSig)) {
                return true;
            }
        }

        Log::warning('Kasera Pay webhook signature mismatch', [
            'timestamp' => $timestamp,
            'signatures_count' => count($signatures),
        ]);

        return false;
    }
}
