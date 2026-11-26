<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DTOs\CustomerData;
use App\DTOs\PurchaseData;
use App\DTOs\PurchaseItemData;
use App\Http\Controllers\Controller;
use App\Http\Resources\PurchaseResource;
use App\Services\ProcessPurchaseService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ShopifyWebhookController extends Controller
{
    /**
     * Receber webhook orders/create da Shopify e processar a compra de forma idempotente.
     */
    public function __invoke(
        Request $request,
        ProcessPurchaseService $processPurchaseService,
    ): JsonResponse {
        $request->validate([
            'name' => ['nullable'],
            'order_number' => ['nullable'],
            'id' => ['nullable'],
            'total_discounts' => ['nullable', 'numeric', 'min:0'],
            'total_price' => ['nullable', 'numeric', 'min:0'],
            'created_at' => ['nullable', 'date'],
            'note' => ['nullable', 'string'],
            'note_attributes' => ['nullable', 'array'],
            'customer' => ['nullable', 'array'],
            'line_items' => ['required', 'array', 'min:1'],
            'line_items.*.title' => ['nullable', 'string', 'max:255'],
            'line_items.*.name' => ['nullable', 'string', 'max:255'],
            'line_items.*.quantity' => ['required', 'integer', 'min:1'],
            'line_items.*.price' => ['required', 'numeric', 'min:0'],
        ]);

        /** @var array<string, mixed> $payload */
        $payload = $request->all();

        $referenceCode = $this->extractReferenceCode($payload);

        if ($referenceCode === '') {
            throw ValidationException::withMessages([
                'name' => ['O payload da Shopify deve conter ao menos um identificador do pedido (name, order_number ou id).'],
            ]);
        }

        $purchaseData = $this->mapPayloadToDto($payload, $referenceCode);
        $result = $processPurchaseService->execute($purchaseData);

        return PurchaseResource::make($result->purchase)
            ->additional([
                'meta' => [
                    'already_processed' => $result->alreadyProcessed,
                ],
            ])
            ->response()
            ->setStatusCode($result->alreadyProcessed ? 200 : 201);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function mapPayloadToDto(array $payload, string $referenceCode): PurchaseData
    {
        $discount = round((float) ($payload['total_discounts'] ?? 0), 2);
        $totalAmount = round((float) ($payload['total_price'] ?? 0), 2);

        $purchasedAt = isset($payload['created_at']) && trim((string) $payload['created_at']) !== ''
            ? CarbonImmutable::parse((string) $payload['created_at'])
            : CarbonImmutable::now();

        $rawNote = isset($payload['note']) ? trim((string) $payload['note']) : '';
        $notes = $rawNote !== '' ? $rawNote : 'Pedido importado via Shopify';

        $customer = $this->extractCustomer($payload);
        $products = $this->extractProducts($payload);

        return new PurchaseData(
            referenceCode: $referenceCode,
            discount: $discount,
            totalAmount: $totalAmount,
            purchasedAt: $purchasedAt,
            notes: $notes,
            customer: $customer,
            products: $products,
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function extractReferenceCode(array $payload): string
    {
        foreach (['name', 'order_number', 'id'] as $key) {
            if (isset($payload[$key]) && trim((string) $payload[$key]) !== '') {
                return trim((string) $payload[$key]);
            }
        }

        return '';
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function extractCustomer(array $payload): CustomerData
    {
        /** @var array<string, mixed> $customerPayload */
        $customerPayload = is_array($payload['customer'] ?? null) ? $payload['customer'] : [];

        $firstName = trim((string) ($customerPayload['first_name'] ?? ''));
        $lastName = trim((string) ($customerPayload['last_name'] ?? ''));
        $fullName = trim($firstName.' '.$lastName);

        if ($fullName === '') {
            $billingName = is_array($payload['billing_address'] ?? null)
                ? trim((string) ($payload['billing_address']['name'] ?? ''))
                : '';
            $shippingName = is_array($payload['shipping_address'] ?? null)
                ? trim((string) ($payload['shipping_address']['name'] ?? ''))
                : '';

            $fullName = $billingName !== '' ? $billingName : ($shippingName !== '' ? $shippingName : 'Cliente Shopify');
        }

        $email = trim((string) (
            $customerPayload['email']
            ?? $payload['email']
            ?? $payload['contact_email']
            ?? ''
        ));

        if ($email === '') {
            $customerIdentifier = $customerPayload['id'] ?? $payload['id'] ?? 'guest';
            $email = sprintf('shopify-customer-%s@shopify.local', (string) $customerIdentifier);
        }

        $cpf = $this->extractCpf($payload, $customerPayload);

        return new CustomerData(
            name: $fullName,
            email: $email,
            cpf: $cpf,
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $customerPayload
     */
    private function extractCpf(array $payload, array $customerPayload): ?string
    {
        $noteAttributes = $payload['note_attributes'] ?? [];

        if (is_array($noteAttributes)) {
            foreach ($noteAttributes as $attribute) {
                if (! is_array($attribute)) {
                    continue;
                }

                $attrName = Str::lower(trim((string) ($attribute['name'] ?? '')));
                $attrValue = trim((string) ($attribute['value'] ?? ''));

                if ($attrValue !== '' && Str::contains($attrName, 'cpf')) {
                    return $attrValue;
                }
            }
        }

        $defaultAddress = $customerPayload['default_address'] ?? null;

        if (is_array($defaultAddress)) {
            $company = trim((string) ($defaultAddress['company'] ?? ''));

            if ($company !== '') {
                return $company;
            }
        }

        $billingAddress = $payload['billing_address'] ?? null;

        if (is_array($billingAddress)) {
            $company = trim((string) ($billingAddress['company'] ?? ''));

            if ($company !== '') {
                return $company;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, PurchaseItemData>
     */
    private function extractProducts(array $payload): array
    {
        /** @var array<int, array<string, mixed>> $lineItems */
        $lineItems = is_array($payload['line_items'] ?? null) ? $payload['line_items'] : [];

        return array_map(
            static function (array $item): PurchaseItemData {
                $title = trim((string) ($item['title'] ?? $item['name'] ?? ''));

                return new PurchaseItemData(
                    name: $title !== '' ? $title : 'Produto Shopify',
                    quantity: max(1, (int) ($item['quantity'] ?? 1)),
                    unitPrice: round((float) ($item['price'] ?? 0), 2),
                );
            },
            $lineItems,
        );
    }
}
