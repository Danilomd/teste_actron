<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\ShopifyWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])
    ->name('api.register');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login')
    ->name('api.login');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('api.logout');

    Route::get('/user', [AuthController::class, 'user'])
        ->name('api.user');
});

Route::get('/purchases', [PurchaseController::class, 'index'])
    ->name('api.purchases.index');

Route::post('/purchases', [PurchaseController::class, 'store'])
    ->name('api.purchases.store');

Route::get('/dashboard', DashboardController::class)
    ->name('api.dashboard');

Route::post('/webhooks/shopify', ShopifyWebhookController::class)
    ->name('api.webhooks.shopify');
