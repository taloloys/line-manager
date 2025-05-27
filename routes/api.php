<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\CustomerRecordController;
use App\Http\Controllers\QueueSettingsController;


Route::post('/queue/register', [QueueController::class, 'registerCustomer']);
Route::get('/queue/status', [QueueController::class, 'getQueueStatus']);
Route::put('/queue/serve-next', [QueueController::class, 'serveNext']);
Route::put('/queue/skip/{queue_number}', [QueueController::class, 'skipCustomer']);
Route::get('/queue/current-serving', [QueueController::class, 'getCurrentServingQueue']);

Route::get('/records', [CustomerRecordController::class, 'index']);
Route::get('/records/stats', [CustomerRecordController::class, 'getDailyStats']);

Route::get('/settings', [QueueSettingsController::class, 'getSettings']);
Route::put('/settings', [QueueSettingsController::class, 'updateSettings']);
Route::delete('/settings/reset-queue', [QueueSettingsController::class, 'resetQueue']);


Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});
