<?php

declare(strict_types=1);

namespace App\DTOs;

readonly class PurchaseFilterData
{
    public function __construct(
        public ?string $referenceCode = null,
        public ?string $customer = null,
        public ?string $date = null,
        public ?string $startDate = null,
        public ?string $endDate = null,
        public ?float $amount = null,
        public ?float $minAmount = null,
        public ?float $maxAmount = null,
        public int $perPage = 15,
    ) {}
}
