<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * @return array{
     *     total_purchases_count: int,
     *     total_purchases_amount: float,
     *     average_purchases_amount: float,
     *     total_discounts_amount: float,
     *     average_discounts_amount: float,
     *     total_products_amount: float,
     *     average_products_amount: float,
     *     purchases_by_customer: array<int, array{
     *         customer_id: int,
     *         name: string,
     *         email: string,
     *         cpf: ?string,
     *         total_amount: float,
     *         average_amount: float,
     *     }>,
     *     purchases_by_product: array<int, array{
     *         product_id: int,
     *         name: string,
     *         total_quantity: int,
     *         total_amount: float,
     *         average_amount: float,
     *     }>,
     * }
     */
    public function getMetrics(): array
    {
        $purchaseStats = Purchase::query()
            ->selectRaw('COUNT(*) as total_purchases_count')
            ->selectRaw('COALESCE(SUM(total_amount), 0) as total_purchases_amount')
            ->selectRaw('COALESCE(AVG(total_amount), 0) as average_purchases_amount')
            ->selectRaw('COALESCE(SUM(discount), 0) as total_discounts_amount')
            ->selectRaw('COALESCE(AVG(discount), 0) as average_discounts_amount')
            ->first();

        $productStats = PurchaseItem::query()
            ->selectRaw('COALESCE(SUM(quantity * unit_price), 0) as total_products_amount')
            ->selectRaw('COALESCE(AVG(quantity * unit_price), 0) as average_products_amount')
            ->first();

        $purchasesByCustomer = Customer::query()
            ->join('purchases', 'customers.id', '=', 'purchases.customer_id')
            ->select([
                'customers.id as customer_id',
                'customers.name',
                'customers.email',
                'customers.cpf',
                DB::raw('COALESCE(SUM(purchases.total_amount), 0) as total_amount'),
                DB::raw('COALESCE(AVG(purchases.total_amount), 0) as average_amount'),
            ])
            ->groupBy('customers.id', 'customers.name', 'customers.email', 'customers.cpf')
            ->orderByDesc('total_amount')
            ->orderBy('customers.id')
            ->get()
            ->map(static fn (Customer $row): array => [
                'customer_id' => (int) $row->getAttribute('customer_id'),
                'name' => (string) $row->getAttribute('name'),
                'email' => (string) $row->getAttribute('email'),
                'cpf' => $row->getAttribute('cpf') !== null ? (string) $row->getAttribute('cpf') : null,
                'total_amount' => round((float) $row->getAttribute('total_amount'), 2),
                'average_amount' => round((float) $row->getAttribute('average_amount'), 2),
            ])
            ->values()
            ->all();

        $purchasesByProduct = Product::query()
            ->join('purchase_items', 'products.id', '=', 'purchase_items.product_id')
            ->select([
                'products.id as product_id',
                'products.name',
                DB::raw('COALESCE(SUM(purchase_items.quantity), 0) as total_quantity'),
                DB::raw('COALESCE(SUM(purchase_items.quantity * purchase_items.unit_price), 0) as total_amount'),
                DB::raw('COALESCE(AVG(purchase_items.quantity * purchase_items.unit_price), 0) as average_amount'),
            ])
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_amount')
            ->orderBy('products.id')
            ->get()
            ->map(static fn (Product $row): array => [
                'product_id' => (int) $row->getAttribute('product_id'),
                'name' => (string) $row->getAttribute('name'),
                'total_quantity' => (int) $row->getAttribute('total_quantity'),
                'total_amount' => round((float) $row->getAttribute('total_amount'), 2),
                'average_amount' => round((float) $row->getAttribute('average_amount'), 2),
            ])
            ->values()
            ->all();

        return [
            'total_purchases_count' => (int) ($purchaseStats?->getAttribute('total_purchases_count') ?? 0),
            'total_purchases_amount' => round((float) ($purchaseStats?->getAttribute('total_purchases_amount') ?? 0), 2),
            'average_purchases_amount' => round((float) ($purchaseStats?->getAttribute('average_purchases_amount') ?? 0), 2),
            'total_discounts_amount' => round((float) ($purchaseStats?->getAttribute('total_discounts_amount') ?? 0), 2),
            'average_discounts_amount' => round((float) ($purchaseStats?->getAttribute('average_discounts_amount') ?? 0), 2),
            'total_products_amount' => round((float) ($productStats?->getAttribute('total_products_amount') ?? 0), 2),
            'average_products_amount' => round((float) ($productStats?->getAttribute('average_products_amount') ?? 0), 2),
            'purchases_by_customer' => $purchasesByCustomer,
            'purchases_by_product' => $purchasesByProduct,
        ];
    }
}
