<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IndexPurchaseRequest;
use App\Http\Requests\Api\StorePurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Models\Purchase;
use App\Services\ProcessPurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PurchaseController extends Controller
{
    /**
     * Listar compras com filtros opcionais e paginação.
     */
    public function index(IndexPurchaseRequest $request): AnonymousResourceCollection
    {
        $filters = $request->toDto();

        $purchases = Purchase::query()
            ->with(['customer', 'items.product'])
            ->applyFilters($filters)
            ->orderByDesc('purchased_at')
            ->orderByDesc('id')
            ->paginate($filters->perPage);

        return PurchaseResource::collection($purchases);
    }

    /**
     * Processar uma nova compra de forma idempotente.
     */
    public function store(
        StorePurchaseRequest $request,
        ProcessPurchaseService $processPurchaseService,
    ): JsonResponse {
        $result = $processPurchaseService->execute($request->toDto());

        return PurchaseResource::make($result->purchase)
            ->additional([
                'meta' => [
                    'already_processed' => $result->alreadyProcessed,
                ],
            ])
            ->response()
            ->setStatusCode($result->alreadyProcessed ? 200 : 201);
    }
}
