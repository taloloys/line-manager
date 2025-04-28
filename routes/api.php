<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QueueController;

Route::post('/queue/register', [QueueController::class, 'registerCustomer']);
Route::get('/queue/status', [QueueController::class, 'getQueueStatus']);
Route::get('/queue/status/{queue_number}', [QueueController::class, 'getStatus']);
Route::put('/queue/serve-next', [QueueController::class, 'serveNext']);
Route::put('/queue/skip/{queue_number}', [QueueController::class, 'skipCustomer']);
ROute::post('/queue/reset', [QueueController::class, 'resetQueue']);
