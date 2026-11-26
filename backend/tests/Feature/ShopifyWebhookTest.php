<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShopifyWebhookTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function makeShopifyOrderPayload(array $overrides = []): array
    {
        return array_replace_recursive([
            'id' => 820982911946154508,
            'order_number' => 1042,
            'name' => '#1042',
            'created_at' => '2026-11-24T15:30:00-03:00',
            'currency' => 'BRL',
            'total_discounts' => '35.50',
            'total_price' => '414.50',
            'note' => 'Entregar no período da tarde',
            'note_attributes' => [
                [
                    'name' => 'cpf',
                    'value' => '123.456.789-01',
                ],
                [
                    'name' => 'canal',
                    'value' => 'loja-online',
                ],
            ],
            'customer' => [
                'id' => 115310627314723954,
                'first_name' => 'Ana',
                'last_name' => 'Beatriz',
                'email' => 'ANA.BEATRIZ@example.com',
                'default_address' => [
                    'company' => null,
                    'city' => 'São Paulo',
                ],
            ],
            'line_items' => [
                [
                    'id' => 866550311766439020,
                    'title' => 'Camiseta Actron Tech',
                    'quantity' => 2,
                    'price' => '125.00',
                ],
                [
                    'id' => 141249953214522974,
                    'title' => 'Mochila Executiva',
                    'quantity' => 1,
                    'price' => '200.00',
                ],
            ],
        ], $overrides);
    }

    public function test_it_processes_shopify_order_created_webhook_and_persists_purchase(): void
    {
        $payload = $this->makeShopifyOrderPayload();

        $response = $this->postJson('/api/webhooks/shopify', $payload);

        $response->assertCreated()
            ->assertJsonPath('meta.already_processed', false)
            ->assertJsonPath('data.reference_code', '#1042')
            ->assertJsonPath('data.discount', 35.5)
            ->assertJsonPath('data.total_amount', 414.5)
            ->assertJsonPath('data.notes', 'Entregar no período da tarde')
            ->assertJsonPath('data.customer.name', 'Ana Beatriz')
            ->assertJsonPath('data.customer.email', 'ana.beatriz@example.com')
            ->assertJsonPath('data.customer.cpf', '123.456.789-01')
            ->assertJsonCount(2, 'data.items');

        $this->assertDatabaseHas('customers', [
            'name' => 'Ana Beatriz',
            'email' => 'ana.beatriz@example.com',
            'cpf' => '123.456.789-01',
        ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Camiseta Actron Tech',
            'price' => '125.00',
        ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Mochila Executiva',
            'price' => '200.00',
        ]);

        $this->assertDatabaseHas('purchases', [
            'reference_code' => '#1042',
            'discount' => '35.50',
            'total_amount' => '414.50',
            'notes' => 'Entregar no período da tarde',
        ]);

        $purchaseId = $response->json('data.id');

        $this->assertDatabaseCount('purchase_items', 2);
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchaseId,
            'quantity' => 2,
            'unit_price' => '125.00',
        ]);
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchaseId,
            'quantity' => 1,
            'unit_price' => '200.00',
        ]);
    }

    public function test_it_is_idempotent_when_receiving_the_same_shopify_order_twice(): void
    {
        $payload = $this->makeShopifyOrderPayload([
            'name' => '#2099',
            'order_number' => 2099,
        ]);

        $firstResponse = $this->postJson('/api/webhooks/shopify', $payload);

        $firstResponse->assertCreated()
            ->assertJsonPath('meta.already_processed', false)
            ->assertJsonPath('data.reference_code', '#2099');

        $secondResponse = $this->postJson('/api/webhooks/shopify', $payload);

        $secondResponse->assertOk()
            ->assertJsonPath('meta.already_processed', true)
            ->assertJsonPath('data.id', $firstResponse->json('data.id'))
            ->assertJsonPath('data.reference_code', '#2099');

        $this->assertDatabaseCount('purchases', 1);
        $this->assertDatabaseCount('customers', 1);
        $this->assertDatabaseCount('products', 2);
        $this->assertDatabaseCount('purchase_items', 2);
    }

    public function test_it_extracts_cpf_from_default_address_company_and_uses_default_notes_when_note_is_null(): void
    {
        $payload = $this->makeShopifyOrderPayload([
            'name' => null,
            'order_number' => 3050,
            'note' => null,
            'note_attributes' => [],
            'customer' => [
                'first_name' => 'Bruno',
                'last_name' => 'Costa',
                'email' => 'bruno.costa@example.com',
                'default_address' => [
                    'company' => '987.654.321-00',
                ],
            ],
        ]);
        $payload['note_attributes'] = [];

        $response = $this->postJson('/api/webhooks/shopify', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.reference_code', '3050')
            ->assertJsonPath('data.notes', 'Pedido importado via Shopify')
            ->assertJsonPath('data.customer.name', 'Bruno Costa')
            ->assertJsonPath('data.customer.cpf', '987.654.321-00');

        $this->assertDatabaseHas('customers', [
            'email' => 'bruno.costa@example.com',
            'cpf' => '987.654.321-00',
        ]);
    }

    public function test_it_allows_null_cpf_and_falls_back_to_order_id_when_name_and_order_number_are_missing(): void
    {
        $payload = $this->makeShopifyOrderPayload([
            'id' => 999888777,
            'name' => null,
            'order_number' => null,
            'note' => '',
            'customer' => [
                'first_name' => 'Carla',
                'last_name' => 'Mendes',
                'email' => 'carla.mendes@example.com',
                'default_address' => [
                    'company' => null,
                ],
            ],
        ]);
        $payload['note_attributes'] = [];

        $response = $this->postJson('/api/webhooks/shopify', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.reference_code', '999888777')
            ->assertJsonPath('data.notes', 'Pedido importado via Shopify')
            ->assertJsonPath('data.customer.cpf', null);

        $this->assertDatabaseHas('customers', [
            'email' => 'carla.mendes@example.com',
            'cpf' => null,
        ]);
    }

    public function test_it_validates_missing_line_items_or_order_identifier(): void
    {
        $response = $this->postJson('/api/webhooks/shopify', [
            'total_price' => '100.00',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['line_items']);

        $missingIdentifierResponse = $this->postJson('/api/webhooks/shopify', [
            'total_price' => '100.00',
            'line_items' => [
                [
                    'title' => 'Produto Teste',
                    'quantity' => 1,
                    'price' => '100.00',
                ],
            ],
        ]);

        $missingIdentifierResponse->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }
}
