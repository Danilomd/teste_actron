<?php

declare(strict_types=1);

namespace App\Models;

use App\DTOs\PurchaseFilterData;
use Carbon\CarbonImmutable;
use Database\Factories\PurchaseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['customer_id', 'reference_code', 'discount', 'total_amount', 'purchased_at', 'notes'])]
class Purchase extends Model
{
    /** @use HasFactory<PurchaseFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'discount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'purchased_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return HasMany<PurchaseItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * @return BelongsToMany<Product, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'purchase_items')
            ->withPivot(['quantity', 'unit_price'])
            ->withTimestamps();
    }

    /**
     * @param  Builder<Purchase>  $query
     * @return Builder<Purchase>
     */
    #[Scope]
    protected function filterByReferenceCode(Builder $query, ?string $referenceCode): Builder
    {
        if ($referenceCode === null || $referenceCode === '') {
            return $query;
        }

        return $query->where('reference_code', 'like', '%'.$referenceCode.'%');
    }

    /**
     * @param  Builder<Purchase>  $query
     * @return Builder<Purchase>
     */
    #[Scope]
    protected function filterByCustomer(Builder $query, ?string $customer): Builder
    {
        if ($customer === null || $customer === '') {
            return $query;
        }

        return $query->whereHas('customer', function (Builder $customerQuery) use ($customer): void {
            $term = '%'.$customer.'%';

            $customerQuery->where(function (Builder $nested) use ($term): void {
                $nested->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('cpf', 'like', $term);
            });
        });
    }

    /**
     * @param  Builder<Purchase>  $query
     * @return Builder<Purchase>
     */
    #[Scope]
    protected function filterByDateRange(
        Builder $query,
        ?string $date = null,
        ?string $startDate = null,
        ?string $endDate = null,
    ): Builder {
        if ($date !== null && $date !== '') {
            return $query->whereDate('purchased_at', $date);
        }

        if ($startDate !== null && $startDate !== '') {
            $query->where('purchased_at', '>=', CarbonImmutable::parse($startDate)->startOfDay());
        }

        if ($endDate !== null && $endDate !== '') {
            $query->where('purchased_at', '<=', CarbonImmutable::parse($endDate)->endOfDay());
        }

        return $query;
    }

    /**
     * @param  Builder<Purchase>  $query
     * @return Builder<Purchase>
     */
    #[Scope]
    protected function filterByAmount(
        Builder $query,
        ?float $amount = null,
        ?float $minAmount = null,
        ?float $maxAmount = null,
    ): Builder {
        if ($amount !== null) {
            return $query->where('total_amount', $amount);
        }

        if ($minAmount !== null) {
            $query->where('total_amount', '>=', $minAmount);
        }

        if ($maxAmount !== null) {
            $query->where('total_amount', '<=', $maxAmount);
        }

        return $query;
    }

    /**
     * @param  Builder<Purchase>  $query
     * @return Builder<Purchase>
     */
    #[Scope]
    protected function applyFilters(Builder $query, PurchaseFilterData $filters): Builder
    {
        return $query
            ->filterByReferenceCode($filters->referenceCode)
            ->filterByCustomer($filters->customer)
            ->filterByDateRange($filters->date, $filters->startDate, $filters->endDate)
            ->filterByAmount($filters->amount, $filters->minAmount, $filters->maxAmount);
    }
}
