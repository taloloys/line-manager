<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\CustomerRecordController;

Route::post('/queue/register', [QueueController::class, 'registerCustomer']);
Route::get('/queue/status', [QueueController::class, 'getQueueStatus']);
Route::get('/queue/status/{queue_number}', [QueueController::class, 'getStatus']);
Route::put('/queue/serve-next', [QueueController::class, 'serveNext']);
Route::put('/queue/skip/{queue_number}', [QueueController::class, 'skipCustomer']);
Route::post('/queue/reset', [QueueController::class, 'resetQueue']);
Route::get('/records', [CustomerRecordController::class, 'index']);
Route::get('/records/stats', [CustomerRecordController::class, 'getDailyStats']);
