<?php

declare(strict_types=1);

namespace App\DTOs;

use Carbon\CarbonImmutable;

readonly class PurchaseData
{
    public string $referenceCode;

    /**
     * @param  array<int, PurchaseItemData>  $products
     */
    public function __construct(
        string $referenceCode,
        public float $discount,
        public float $totalAmount,
        public CarbonImmutable $purchasedAt,
        public ?string $notes,
        public CustomerData $customer,
        public array $products,
    ) {
        $this->referenceCode = trim($referenceCode);
    }
}
