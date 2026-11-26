<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Retornar os dados agregados de compras para o dashboard.
     */
    public function __invoke(DashboardService $dashboardService): JsonResponse
    {
        return response()->json($dashboardService->getMetrics());
    }
}
