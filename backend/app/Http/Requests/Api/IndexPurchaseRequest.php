<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\DTOs\PurchaseFilterData;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexPurchaseRequest extends FormRequest
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
            'reference_code' => ['nullable', 'string', 'max:255'],
            'customer' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
            'start_date' => ['nullable', 'date'],
            'end_date' => [
                'nullable',
                'date',
                Rule::when($this->filled('start_date'), ['after_or_equal:start_date']),
            ],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'min_amount' => ['nullable', 'numeric', 'min:0'],
            'max_amount' => [
                'nullable',
                'numeric',
                'min:0',
                Rule::when($this->filled('min_amount'), ['gte:min_amount']),
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function toDto(): PurchaseFilterData
    {
        /** @var array{
         *     reference_code?: ?string,
         *     customer?: ?string,
         *     date?: ?string,
         *     start_date?: ?string,
         *     end_date?: ?string,
         *     amount?: float|int|string|null,
         *     min_amount?: float|int|string|null,
         *     max_amount?: float|int|string|null,
         *     per_page?: int|string|null,
         * } $validated
         */
        $validated = $this->validated();

        return new PurchaseFilterData(
            referenceCode: isset($validated['reference_code']) ? trim($validated['reference_code']) : null,
            customer: isset($validated['customer']) ? trim($validated['customer']) : null,
            date: $validated['date'] ?? null,
            startDate: $validated['start_date'] ?? null,
            endDate: $validated['end_date'] ?? null,
            amount: isset($validated['amount']) ? (float) $validated['amount'] : null,
            minAmount: isset($validated['min_amount']) ? (float) $validated['min_amount'] : null,
            maxAmount: isset($validated['max_amount']) ? (float) $validated['max_amount'] : null,
            perPage: isset($validated['per_page']) ? (int) $validated['per_page'] : 15,
        );
    }
}
