<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\CustomerData;
use App\DTOs\ProcessedPurchaseResult;
use App\DTOs\PurchaseData;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Purchase;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class ProcessPurchaseService
{
    public function execute(PurchaseData $data): ProcessedPurchaseResult
    {
        $existingPurchase = $this->findExistingPurchase($data->referenceCode);

        if ($existingPurchase !== null) {
            return new ProcessedPurchaseResult(
                purchase: $existingPurchase,
                alreadyProcessed: true,
            );
        }

        try {
            return DB::transaction(function () use ($data): ProcessedPurchaseResult {
                $lockedExisting = Purchase::query()
                    ->where('reference_code', $data->referenceCode)
                    ->lockForUpdate()
                    ->first();

                if ($lockedExisting !== null) {
                    return new ProcessedPurchaseResult(
                        purchase: $lockedExisting->load(['customer', 'items.product']),
                        alreadyProcessed: true,
                    );
                }

                $customer = $this->resolveCustomer($data->customer);

                $purchase = Purchase::create([
                    'customer_id' => $customer->id,
                    'reference_code' => $data->referenceCode,
                    'discount' => $data->discount,
                    'total_amount' => $data->totalAmount,
                    'purchased_at' => $data->purchasedAt,
                    'notes' => $data->notes,
                ]);

                foreach ($data->products as $item) {
                    $product = Product::updateOrCreate(
                        ['name' => $item->name],
                        ['price' => $item->unitPrice],
                    );

                    $purchase->items()->create([
                        'product_id' => $product->id,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unitPrice,
                    ]);
                }

                return new ProcessedPurchaseResult(
                    purchase: $purchase->load(['customer', 'items.product']),
                    alreadyProcessed: false,
                );
            });
        } catch (UniqueConstraintViolationException $exception) {
            $existingPurchase = $this->findExistingPurchase($data->referenceCode);

            if ($existingPurchase !== null) {
                return new ProcessedPurchaseResult(
                    purchase: $existingPurchase,
                    alreadyProcessed: true,
                );
            }

            throw $exception;
        }
    }

    private function findExistingPurchase(string $referenceCode): ?Purchase
    {
        return Purchase::query()
            ->with(['customer', 'items.product'])
            ->where('reference_code', $referenceCode)
            ->first();
    }

    private function resolveCustomer(CustomerData $customerData): Customer
    {
        $customer = null;

        if ($customerData->cpf !== null) {
            $customer = Customer::query()
                ->where('cpf', $customerData->cpf)
                ->first();
        }

        if ($customer === null) {
            $customer = Customer::query()
                ->where('email', $customerData->email)
                ->first();

            if ($customer !== null && $customerData->cpf !== null && $customer->cpf === null) {
                $customer->update(['cpf' => $customerData->cpf]);
            }
        }

        if ($customer !== null) {
            return $customer;
        }

        return Customer::create([
            'name' => $customerData->name,
            'email' => $customerData->email,
            'cpf' => $customerData->cpf,
        ]);
    }
}
