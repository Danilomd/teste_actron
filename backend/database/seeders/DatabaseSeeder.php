<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\DTOs\CustomerData;
use App\DTOs\PurchaseData;
use App\DTOs\PurchaseItemData;
use App\Models\User;
use App\Services\ProcessPurchaseService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(ProcessPurchaseService $processPurchaseService): void
    {
        if (! User::query()->where('email', 'test@example.com')->exists()) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }

        $customers = [
            'mariana' => new CustomerData('Mariana Almeida', 'mariana.almeida@example.com', '128.456.789-01'),
            'rafael' => new CustomerData('Rafael Nogueira', 'rafael.nogueira@example.com', '234.918.672-45'),
            'camila' => new CustomerData('Camila Ferreira', 'camila.ferreira@example.com', '389.104.527-19'),
            'lucas' => new CustomerData('Lucas Vasconcelos', 'lucas.vasconcelos@example.com', '471.825.930-62'),
            'beatriz' => new CustomerData('Beatriz Santana', 'beatriz.santana@example.com', '562.739.148-80'),
            'thiago' => new CustomerData('Thiago Carvalho', 'thiago.carvalho@example.com', '619.284.375-33'),
            'juliana' => new CustomerData('Juliana Monteiro', 'juliana.monteiro@example.com', '745.390.816-94'),
        ];

        $catalog = [
            'notebook' => ['name' => 'Notebook Pro 15"', 'price' => 6499.90],
            'monitor' => ['name' => 'Monitor 27" 4K', 'price' => 2199.00],
            'teclado' => ['name' => 'Teclado Mecânico RGB', 'price' => 489.90],
            'mouse' => ['name' => 'Mouse Sem Fio Ergonômico', 'price' => 279.90],
            'headset' => ['name' => 'Headset Noise Cancelling', 'price' => 899.00],
            'hub' => ['name' => 'Hub USB-C 7 em 1', 'price' => 249.90],
        ];

        /**
         * @var array<int, array{
         *     reference_code: string,
         *     customer: string,
         *     days_ago: int,
         *     hour: int,
         *     minute: int,
         *     discount: float,
         *     notes: ?string,
         *     items: array<int, array{product: string, quantity: int}>
         * }> $orders
         */
        $orders = [
            [
                'reference_code' => 'ACT-2026-1001',
                'customer' => 'mariana',
                'days_ago' => 29,
                'hour' => 10,
                'minute' => 15,
                'discount' => 350.00,
                'notes' => 'Compra corporativa para estação de trabalho principal',
                'items' => [
                    ['product' => 'notebook', 'quantity' => 1],
                    ['product' => 'hub', 'quantity' => 1],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1002',
                'customer' => 'rafael',
                'days_ago' => 27,
                'hour' => 14,
                'minute' => 40,
                'discount' => 120.00,
                'notes' => 'Entrega expressa solicitada pelo cliente',
                'items' => [
                    ['product' => 'monitor', 'quantity' => 1],
                    ['product' => 'teclado', 'quantity' => 1],
                    ['product' => 'mouse', 'quantity' => 1],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1003',
                'customer' => 'camila',
                'days_ago' => 25,
                'hour' => 9,
                'minute' => 25,
                'discount' => 0.00,
                'notes' => null,
                'items' => [
                    ['product' => 'headset', 'quantity' => 1],
                    ['product' => 'hub', 'quantity' => 2],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1004',
                'customer' => 'lucas',
                'days_ago' => 23,
                'hour' => 16,
                'minute' => 50,
                'discount' => 200.00,
                'notes' => 'Desconto promocional de primeira compra',
                'items' => [
                    ['product' => 'monitor', 'quantity' => 2],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1005',
                'customer' => 'beatriz',
                'days_ago' => 21,
                'hour' => 11,
                'minute' => 10,
                'discount' => 50.00,
                'notes' => 'Kit home office',
                'items' => [
                    ['product' => 'teclado', 'quantity' => 1],
                    ['product' => 'mouse', 'quantity' => 1],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1006',
                'customer' => 'thiago',
                'days_ago' => 19,
                'hour' => 18,
                'minute' => 5,
                'discount' => 500.00,
                'notes' => 'Pedido para equipe de engenharia',
                'items' => [
                    ['product' => 'notebook', 'quantity' => 2],
                    ['product' => 'headset', 'quantity' => 2],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1007',
                'customer' => 'juliana',
                'days_ago' => 18,
                'hour' => 13,
                'minute' => 30,
                'discount' => 80.00,
                'notes' => 'Cupom TECH80 aplicado no checkout',
                'items' => [
                    ['product' => 'headset', 'quantity' => 1],
                    ['product' => 'mouse', 'quantity' => 1],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1008',
                'customer' => 'mariana',
                'days_ago' => 16,
                'hour' => 15,
                'minute' => 45,
                'discount' => 150.00,
                'notes' => 'Upgrade de monitor secundário',
                'items' => [
                    ['product' => 'monitor', 'quantity' => 1],
                    ['product' => 'hub', 'quantity' => 1],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1009',
                'customer' => 'camila',
                'days_ago' => 14,
                'hour' => 10,
                'minute' => 0,
                'discount' => 300.00,
                'notes' => 'Pagamento via PIX com desconto',
                'items' => [
                    ['product' => 'notebook', 'quantity' => 1],
                    ['product' => 'mouse', 'quantity' => 1],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1010',
                'customer' => 'rafael',
                'days_ago' => 13,
                'hour' => 17,
                'minute' => 20,
                'discount' => 0.00,
                'notes' => null,
                'items' => [
                    ['product' => 'hub', 'quantity' => 3],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1011',
                'customer' => 'beatriz',
                'days_ago' => 11,
                'hour' => 9,
                'minute' => 55,
                'discount' => 180.00,
                'notes' => 'Entregar em horário comercial',
                'items' => [
                    ['product' => 'monitor', 'quantity' => 1],
                    ['product' => 'headset', 'quantity' => 1],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1012',
                'customer' => 'lucas',
                'days_ago' => 9,
                'hour' => 14,
                'minute' => 12,
                'discount' => 60.00,
                'notes' => 'Reposição de periféricos',
                'items' => [
                    ['product' => 'teclado', 'quantity' => 2],
                    ['product' => 'mouse', 'quantity' => 2],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1013',
                'customer' => 'juliana',
                'days_ago' => 8,
                'hour' => 16,
                'minute' => 35,
                'discount' => 400.00,
                'notes' => 'Setup completo de desenvolvimento',
                'items' => [
                    ['product' => 'notebook', 'quantity' => 1],
                    ['product' => 'monitor', 'quantity' => 1],
                    ['product' => 'teclado', 'quantity' => 1],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1014',
                'customer' => 'thiago',
                'days_ago' => 6,
                'hour' => 12,
                'minute' => 48,
                'discount' => 45.00,
                'notes' => 'Cliente recorrente (fidelidade)',
                'items' => [
                    ['product' => 'mouse', 'quantity' => 2],
                    ['product' => 'hub', 'quantity' => 2],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1015',
                'customer' => 'mariana',
                'days_ago' => 4,
                'hour' => 19,
                'minute' => 10,
                'discount' => 90.00,
                'notes' => null,
                'items' => [
                    ['product' => 'headset', 'quantity' => 2],
                ],
            ],
            [
                'reference_code' => 'ACT-2026-1016',
                'customer' => 'camila',
                'days_ago' => 3,
                'hour' => 11,
                'minute' => 22,
                'discount' => 110.00,
                'notes' => 'Embalagem reforçada solicitada',
                'items' => [
                    ['product' => 'monitor', 'quantity' => 1],
                    ['product' => 'teclado', 'quantity' => 1],
                ],
            ],
            [
                'reference_code' => '#1017',
                'customer' => 'rafael',
                'days_ago' => 2,
                'hour' => 15,
                'minute' => 5,
                'discount' => 250.00,
                'notes' => 'Pedido importado via Shopify',
                'items' => [
                    ['product' => 'notebook', 'quantity' => 1],
                    ['product' => 'headset', 'quantity' => 1],
                ],
            ],
            [
                'reference_code' => '#1018',
                'customer' => 'beatriz',
                'days_ago' => 1,
                'hour' => 10,
                'minute' => 40,
                'discount' => 35.00,
                'notes' => 'Pedido importado via Shopify',
                'items' => [
                    ['product' => 'teclado', 'quantity' => 1],
                    ['product' => 'mouse', 'quantity' => 1],
                    ['product' => 'hub', 'quantity' => 1],
                ],
            ],
        ];

        $now = CarbonImmutable::now();

        foreach ($orders as $order) {
            $products = [];
            $grossTotal = 0.0;

            foreach ($order['items'] as $item) {
                $catalogItem = $catalog[$item['product']];
                $unitPrice = $catalogItem['price'];
                $quantity = $item['quantity'];

                $grossTotal += $quantity * $unitPrice;

                $products[] = new PurchaseItemData(
                    name: $catalogItem['name'],
                    quantity: $quantity,
                    unitPrice: $unitPrice,
                );
            }

            $totalAmount = round(max(0.0, $grossTotal - $order['discount']), 2);

            $processPurchaseService->execute(new PurchaseData(
                referenceCode: $order['reference_code'],
                discount: $order['discount'],
                totalAmount: $totalAmount,
                purchasedAt: $now
                    ->subDays($order['days_ago'])
                    ->setTime($order['hour'], $order['minute'], 0),
                notes: $order['notes'],
                customer: $customers[$order['customer']],
                products: $products,
            ));
        }
    }
}
