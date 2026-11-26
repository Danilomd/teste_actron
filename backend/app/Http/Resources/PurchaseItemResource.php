<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PurchaseItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseItem
 */
class PurchaseItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $unitPrice = round((float) $this->unit_price, 2);

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'unit_price' => $unitPrice,
            'subtotal' => round($this->quantity * $unitPrice, 2),
            'product' => ProductResource::make($this->whenLoaded('product')),
        ];
    }
}
