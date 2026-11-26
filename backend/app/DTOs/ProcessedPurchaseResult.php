<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Models\Purchase;

readonly class ProcessedPurchaseResult
{
    public function __construct(
        public Purchase $purchase,
        public bool $alreadyProcessed,
    ) {}
}
