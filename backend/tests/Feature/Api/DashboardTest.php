<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Customer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_zeroed_metrics_when_database_is_empty(): void
    {
        $response = $this->getJson(route('api.dashboard'));

        $response->assertOk()
            ->assertExactJson([
                'total_purchases_count' => 0,
                'total_purchases_amount' => 0,
                'average_purchases_amount' => 0,
                'total_discounts_amount' => 0,
                'average_discounts_amount' => 0,
                'total_products_amount' => 0,
                'average_products_amount' => 0,
                'purchases_by_customer' => [],
                'purchases_by_product' => [],
            ]);
    }

    public function test_it_calculates_aggregated_dashboard_metrics_accurately(): void
    {
        $this->postJson(route('api.purchases.store'), [
            'reference_code' => 'DASH-001',
            'discount' => 10.00,
            'total_amount' => 290.00,
            'purchased_at' => '2026-11-18 10:00:00',
            'customer' => [
                'name' => 'Maria Silva',
                'email' => 'maria@example.com',
                'cpf' => '11111111111',
            ],
            'products' => [
                [
                    'name' => 'Teclado',
                    'quantity' => 2,
                    'unit_price' => 100.00,
                ],
                [
                    'name' => 'Mouse',
                    'quantity' => 1,
                    'unit_price' => 100.00,
                ],
            ],
        ])->assertCreated();

        $this->postJson(route('api.purchases.store'), [
            'reference_code' => 'DASH-002',
            'discount' => 20.00,
            'total_amount' => 180.00,
            'purchased_at' => '2026-11-19 11:00:00',
            'customer' => [
                'name' => 'Maria Silva',
                'email' => 'maria@example.com',
                'cpf' => '11111111111',
            ],
            'products' => [
                [
                    'name' => 'Teclado',
                    'quantity' => 2,
                    'unit_price' => 100.00,
                ],
            ],
        ])->assertCreated();

        $this->postJson(route('api.purchases.store'), [
            'reference_code' => 'DASH-003',
            'discount' => 0.00,
            'total_amount' => 50.00,
            'purchased_at' => '2026-11-20 12:00:00',
            'customer' => [
                'name' => 'Carlos Lima',
                'email' => 'carlos@example.com',
                'cpf' => null,
            ],
            'products' => [
                [
                    'name' => 'Mouse',
                    'quantity' => 1,
                    'unit_price' => 50.00,
                ],
            ],
        ])->assertCreated();

        $maria = Customer::where('email', 'maria@example.com')->firstOrFail();
        $carlos = Customer::where('email', 'carlos@example.com')->firstOrFail();
        $teclado = Product::where('name', 'Teclado')->firstOrFail();
        $mouse = Product::where('name', 'Mouse')->firstOrFail();

        $response = $this->getJson(route('api.dashboard'));

        $response->assertOk()
            ->assertExactJson([
                'total_purchases_count' => 3,
                'total_purchases_amount' => 520,
                'average_purchases_amount' => 173.33,
                'total_discounts_amount' => 30,
                'average_discounts_amount' => 10,
                'total_products_amount' => 550,
                'average_products_amount' => 137.5,
                'purchases_by_customer' => [
                    [
                        'customer_id' => $maria->id,
                        'name' => 'Maria Silva',
                        'email' => 'maria@example.com',
                        'cpf' => '11111111111',
                        'total_amount' => 470,
                        'average_amount' => 235,
                    ],
                    [
                        'customer_id' => $carlos->id,
                        'name' => 'Carlos Lima',
                        'email' => 'carlos@example.com',
                        'cpf' => null,
                        'total_amount' => 50,
                        'average_amount' => 50,
                    ],
                ],
                'purchases_by_product' => [
                    [
                        'product_id' => $teclado->id,
                        'name' => 'Teclado',
                        'total_quantity' => 4,
                        'total_amount' => 400,
                        'average_amount' => 200,
                    ],
                    [
                        'product_id' => $mouse->id,
                        'name' => 'Mouse',
                        'total_quantity' => 2,
                        'total_amount' => 150,
                        'average_amount' => 75,
                    ],
                ],
            ]);
    }
}
