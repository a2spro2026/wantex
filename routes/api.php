<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChantierApiController;
use App\Http\Controllers\Api\ClientApiController;
use App\Http\Controllers\Api\DashboardApiController;
use App\Http\Controllers\Api\DocumentApiController;
use App\Http\Controllers\Api\EmployeeApiController;
use App\Http\Controllers\Api\ExpenseApiController;
use App\Http\Controllers\Api\ProductApiController;
use App\Http\Controllers\Api\ProductFamilyApiController;
use App\Http\Controllers\Api\PurchaseOrderApiController;
use App\Http\Controllers\Api\QuoteApiController;
use App\Http\Controllers\Api\SupplierApiController;
use App\Http\Controllers\Api\TaskApiController;
use App\Http\Controllers\Api\TransactionApiController;
use App\Http\Controllers\Api\UserApiController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/dashboard', [DashboardApiController::class, 'index']);

    Route::apiResource('chantiers', ChantierApiController::class);
    Route::post('chantiers/{chantier}/archive', [ChantierApiController::class, 'archive']);

    Route::apiResource('clients', ClientApiController::class);
    Route::apiResource('quotes', QuoteApiController::class);
    Route::post('quotes/{quote}/send', [QuoteApiController::class, 'send']);
    Route::post('quotes/{quote}/validate', [QuoteApiController::class, 'validateQuote']);
    Route::apiResource('suppliers', SupplierApiController::class);
    Route::apiResource('products', ProductApiController::class);
    Route::apiResource('product-families', ProductFamilyApiController::class);
    Route::apiResource('users', UserApiController::class);
    Route::apiResource('purchase-orders', PurchaseOrderApiController::class);
    Route::post('purchase-orders/{purchase_order}/validate', [PurchaseOrderApiController::class, 'validateOrder']);

    Route::apiResource('employees', EmployeeApiController::class);
    Route::apiResource('expenses', ExpenseApiController::class);
    Route::apiResource('transactions', TransactionApiController::class)
        ->parameters(['transactions' => 'monetary_transaction']);
    Route::apiResource('documents', DocumentApiController::class)->except(['update']);
    Route::get('documents/{document}/download', [DocumentApiController::class, 'download']);

    Route::get('/tasks', [TaskApiController::class, 'index']);
    Route::get('/tasks/overdue', [TaskApiController::class, 'overdue']);
    Route::post('/tasks', [TaskApiController::class, 'store']);
    Route::put('/tasks/{task}', [TaskApiController::class, 'update']);

    Route::get('/reports/financial', [ReportApiController::class, 'financial']);
    Route::get('/reports/export/{type}', [ReportApiController::class, 'export']);
});
