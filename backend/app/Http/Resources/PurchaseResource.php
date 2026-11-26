<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Purchase
 */
class PurchaseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference_code' => $this->reference_code,
            'discount' => round((float) $this->discount, 2),
            'total_amount' => round((float) $this->total_amount, 2),
            'purchased_at' => $this->purchased_at?->toISOString(),
            'notes' => $this->notes,
            'customer' => CustomerResource::make($this->whenLoaded('customer')),
            'items' => PurchaseItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
