<?php

declare(strict_types=1);

namespace App\DTOs;

readonly class PurchaseItemData
{
    public string $name;

    public function __construct(
        string $name,
        public int $quantity,
        public float $unitPrice,
    ) {
        $this->name = trim($name);
    }
}
