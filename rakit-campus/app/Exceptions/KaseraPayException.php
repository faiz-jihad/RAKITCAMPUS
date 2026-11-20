<?php

namespace App\Exceptions;

use Exception;

class KaseraPayException extends Exception
{
    protected ?int $httpStatus;
    protected ?array $providerError;

    public function __construct(string $message, int $code = 0, ?int $httpStatus = null, ?array $providerError = null, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->httpStatus = $httpStatus;
        $this->providerError = $providerError;
    }

    public function getHttpStatus(): ?int
    {
        return $this->httpStatus;
    }

    public function getProviderError(): ?array
    {
        return $this->providerError;
    }
}
