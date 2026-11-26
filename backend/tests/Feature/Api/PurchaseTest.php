<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PurchaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_purchase_and_persists_all_four_tables(): void
    {
        $payload = [
            'reference_code' => 'PUR-2026-0001',
            'discount' => 25.50,
            'total_amount' => 374.50,
            'purchased_at' => '2026-11-20 14:30:00',
            'notes' => 'Entrega expressa',
            'customer' => [
                'name' => 'Maria Oliveira',
                'email' => 'MARIA@example.com',
                'cpf' => '12345678901',
            ],
            'products' => [
                [
                    'name' => 'Teclado Mecânico',
                    'quantity' => 1,
                    'unit_price' => 250.00,
                ],
                [
                    'name' => 'Mouse Sem Fio',
                    'quantity' => 2,
                    'unit_price' => 75.00,
                ],
            ],
        ];

        $response = $this->postJson(route('api.purchases.store'), $payload);

        $response->assertCreated()
            ->assertJsonPath('meta.already_processed', false)
            ->assertJsonPath('data.reference_code', 'PUR-2026-0001')
            ->assertJsonPath('data.discount', 25.5)
            ->assertJsonPath('data.total_amount', 374.5)
            ->assertJsonPath('data.notes', 'Entrega expressa')
            ->assertJsonPath('data.customer.name', 'Maria Oliveira')
            ->assertJsonPath('data.customer.email', 'maria@example.com')
            ->assertJsonPath('data.customer.cpf', '12345678901')
            ->assertJsonCount(2, 'data.items');

        $this->assertDatabaseHas('customers', [
            'name' => 'Maria Oliveira',
            'email' => 'maria@example.com',
            'cpf' => '12345678901',
        ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Teclado Mecânico',
            'price' => '250.00',
        ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Mouse Sem Fio',
            'price' => '75.00',
        ]);

        $this->assertDatabaseHas('purchases', [
            'reference_code' => 'PUR-2026-0001',
            'discount' => '25.50',
            'total_amount' => '374.50',
            'notes' => 'Entrega expressa',
        ]);

        $purchaseId = $response->json('data.id');

        $this->assertDatabaseCount('purchase_items', 2);
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchaseId,
            'quantity' => 1,
            'unit_price' => '250.00',
        ]);
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchaseId,
            'quantity' => 2,
            'unit_price' => '75.00',
        ]);
    }

    public function test_it_ignores_duplicate_reference_code_for_idempotency(): void
    {
        $payload = [
            'reference_code' => 'PUR-IDEMP-001',
            'discount' => 10.00,
            'total_amount' => 190.00,
            'purchased_at' => '2026-11-21 10:00:00',
            'customer' => [
                'name' => 'Carlos Souza',
                'email' => 'carlos@example.com',
                'cpf' => '98765432100',
            ],
            'products' => [
                [
                    'name' => 'Headset USB',
                    'quantity' => 2,
                    'unit_price' => 100.00,
                ],
            ],
        ];

        $firstResponse = $this->postJson(route('api.purchases.store'), $payload);

        $firstResponse->assertCreated()
            ->assertJsonPath('meta.already_processed', false);

        $duplicatePayload = $payload;
        $duplicatePayload['total_amount'] = 999.99;

        $secondResponse = $this->postJson(route('api.purchases.store'), $duplicatePayload);

        $secondResponse->assertOk()
            ->assertJsonPath('meta.already_processed', true)
            ->assertJsonPath('data.id', $firstResponse->json('data.id'))
            ->assertJsonPath('data.total_amount', 190);

        $this->assertDatabaseCount('purchases', 1);
        $this->assertDatabaseCount('customers', 1);
        $this->assertDatabaseCount('products', 1);
        $this->assertDatabaseCount('purchase_items', 1);
    }

    public function test_it_reuses_customer_by_cpf_or_email_and_updates_product_base_price(): void
    {
        $this->postJson(route('api.purchases.store'), [
            'reference_code' => 'PUR-REUSE-001',
            'total_amount' => 150.00,
            'purchased_at' => '2026-11-20 09:00:00',
            'customer' => [
                'name' => 'João Pereira',
                'email' => 'joao@example.com',
                'cpf' => '11122233344',
            ],
            'products' => [
                [
                    'name' => 'Monitor 27',
                    'quantity' => 1,
                    'unit_price' => 150.00,
                ],
            ],
        ])->assertCreated();

        $this->postJson(route('api.purchases.store'), [
            'reference_code' => 'PUR-REUSE-002',
            'total_amount' => 180.00,
            'purchased_at' => '2026-11-21 09:00:00',
            'customer' => [
                'name' => 'João Pereira',
                'email' => 'joao.novo@example.com',
                'cpf' => '11122233344',
            ],
            'products' => [
                [
                    'name' => 'Monitor 27',
                    'quantity' => 1,
                    'unit_price' => 180.00,
                ],
            ],
        ])->assertCreated();

        $this->postJson(route('api.purchases.store'), [
            'reference_code' => 'PUR-REUSE-003',
            'total_amount' => 180.00,
            'purchased_at' => '2026-11-22 09:00:00',
            'customer' => [
                'name' => 'João Pereira',
                'email' => 'joao@example.com',
                'cpf' => null,
            ],
            'products' => [
                [
                    'name' => 'Monitor 27',
                    'quantity' => 1,
                    'unit_price' => 180.00,
                ],
            ],
        ])->assertCreated();

        $this->assertDatabaseCount('customers', 1);
        $this->assertDatabaseCount('products', 1);
        $this->assertDatabaseCount('purchases', 3);
        $this->assertDatabaseCount('purchase_items', 3);

        $this->assertDatabaseHas('products', [
            'name' => 'Monitor 27',
            'price' => '180.00',
        ]);
    }

    public function test_it_validates_store_purchase_payload(): void
    {
        $this->postJson(route('api.purchases.store'), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'reference_code',
                'total_amount',
                'purchased_at',
                'customer',
                'products',
            ]);

        $this->postJson(route('api.purchases.store'), [
            'reference_code' => 'PUR-INVALID',
            'discount' => -5,
            'total_amount' => -10,
            'purchased_at' => 'not-a-date',
            'customer' => [
                'name' => '',
                'email' => 'invalid-email',
            ],
            'products' => [
                [
                    'name' => '',
                    'quantity' => 0,
                    'unit_price' => -1,
                ],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'discount',
                'total_amount',
                'purchased_at',
                'customer.name',
                'customer.email',
                'products.0.name',
                'products.0.quantity',
                'products.0.unit_price',
            ]);
    }

    public function test_it_lists_paginated_purchases_without_n_plus_one_queries(): void
    {
        $product = Product::factory()->create();

        Purchase::factory()
            ->count(4)
            ->create()
            ->each(function (Purchase $purchase) use ($product): void {
                PurchaseItem::factory()->create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                ]);
            });

        DB::enableQueryLog();
        DB::flushQueryLog();

        $response = $this->getJson(route('api.purchases.index', ['per_page' => 2]));

        $queryCount = count(DB::getQueryLog());
        DB::disableQueryLog();

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 4)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'reference_code',
                        'discount',
                        'total_amount',
                        'purchased_at',
                        'customer' => ['id', 'name', 'email', 'cpf'],
                        'items' => [
                            '*' => [
                                'id',
                                'product_id',
                                'quantity',
                                'unit_price',
                                'subtotal',
                                'product' => ['id', 'name', 'price'],
                            ],
                        ],
                    ],
                ],
                'links',
                'meta',
            ]);

        // 1 count + 1 purchases + 1 customers + 1 items + 1 products = 5 queries
        $this->assertLessThanOrEqual(5, $queryCount);
    }

    public function test_it_filters_purchases_by_reference_code(): void
    {
        Purchase::factory()->create(['reference_code' => 'ORD-ALPHA-100']);
        Purchase::factory()->create(['reference_code' => 'ORD-BETA-200']);

        $response = $this->getJson(route('api.purchases.index', [
            'reference_code' => 'ALPHA',
        ]));

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reference_code', 'ORD-ALPHA-100');
    }

    public function test_it_filters_purchases_by_customer_name_email_or_cpf(): void
    {
        $maria = Customer::factory()->create([
            'name' => 'Maria Fernanda',
            'email' => 'maria.fernanda@example.com',
            'cpf' => '55544433322',
        ]);

        $pedro = Customer::factory()->create([
            'name' => 'Pedro Alves',
            'email' => 'pedro.alves@example.com',
            'cpf' => '99988877766',
        ]);

        Purchase::factory()->create(['customer_id' => $maria->id, 'reference_code' => 'PUR-MARIA']);
        Purchase::factory()->create(['customer_id' => $pedro->id, 'reference_code' => 'PUR-PEDRO']);

        $this->getJson(route('api.purchases.index', ['customer' => 'Fernanda']))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reference_code', 'PUR-MARIA');

        $this->getJson(route('api.purchases.index', ['customer' => 'pedro.alves@example.com']))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reference_code', 'PUR-PEDRO');

        $this->getJson(route('api.purchases.index', ['customer' => '55544433322']))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reference_code', 'PUR-MARIA');
    }

    public function test_it_filters_purchases_by_date_and_date_range(): void
    {
        Purchase::factory()->create([
            'reference_code' => 'PUR-DAY-10',
            'purchased_at' => '2026-11-10 15:00:00',
        ]);
        Purchase::factory()->create([
            'reference_code' => 'PUR-DAY-15',
            'purchased_at' => '2026-11-15 11:00:00',
        ]);
        Purchase::factory()->create([
            'reference_code' => 'PUR-DAY-25',
            'purchased_at' => '2026-11-25 18:00:00',
        ]);

        $this->getJson(route('api.purchases.index', ['date' => '2026-11-15']))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reference_code', 'PUR-DAY-15');

        $this->getJson(route('api.purchases.index', [
            'start_date' => '2026-11-10',
            'end_date' => '2026-11-15',
        ]))
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_it_filters_purchases_by_amount_and_amount_range(): void
    {
        Purchase::factory()->create([
            'reference_code' => 'PUR-LOW',
            'total_amount' => 50.00,
        ]);
        Purchase::factory()->create([
            'reference_code' => 'PUR-MID',
            'total_amount' => 250.00,
        ]);
        Purchase::factory()->create([
            'reference_code' => 'PUR-HIGH',
            'total_amount' => 600.00,
        ]);

        $this->getJson(route('api.purchases.index', ['amount' => 250]))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reference_code', 'PUR-MID');

        $this->getJson(route('api.purchases.index', [
            'min_amount' => 100,
            'max_amount' => 300,
        ]))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reference_code', 'PUR-MID');
    }
}
