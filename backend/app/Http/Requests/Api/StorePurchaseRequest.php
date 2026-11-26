<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\DTOs\CustomerData;
use App\DTOs\PurchaseData;
use App\DTOs\PurchaseItemData;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'reference_code' => ['required', 'string', 'max:255'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'purchased_at' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'customer' => ['required', 'array'],
            'customer.name' => ['required', 'string', 'max:255'],
            'customer.email' => ['required', 'string', 'email', 'max:255'],
            'customer.cpf' => ['nullable', 'string', 'max:20'],
            'products' => ['required', 'array', 'min:1'],
            'products.*.name' => ['required', 'string', 'max:255'],
            'products.*.quantity' => ['required', 'integer', 'min:1'],
            'products.*.unit_price' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function toDto(): PurchaseData
    {
        /** @var array{
         *     reference_code: string,
         *     discount?: float|int|string|null,
         *     total_amount: float|int|string,
         *     purchased_at: string,
         *     notes?: ?string,
         *     customer: array{name: string, email: string, cpf?: ?string},
         *     products: array<int, array{name: string, quantity: int|string, unit_price: float|int|string}>
         * } $validated
         */
        $validated = $this->validated();

        $customer = new CustomerData(
            name: $validated['customer']['name'],
            email: $validated['customer']['email'],
            cpf: $validated['customer']['cpf'] ?? null,
        );

        $products = array_map(
            static fn (array $item): PurchaseItemData => new PurchaseItemData(
                name: $item['name'],
                quantity: (int) $item['quantity'],
                unitPrice: round((float) $item['unit_price'], 2),
            ),
            $validated['products'],
        );

        return new PurchaseData(
            referenceCode: $validated['reference_code'],
            discount: isset($validated['discount']) ? round((float) $validated['discount'], 2) : 0.0,
            totalAmount: round((float) $validated['total_amount'], 2),
            purchasedAt: CarbonImmutable::parse($validated['purchased_at']),
            notes: $validated['notes'] ?? null,
            customer: $customer,
            products: $products,
        );
    }
}
