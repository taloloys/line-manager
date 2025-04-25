<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QueueController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and will be assigned the
| "api" middleware group.
|
*/

Route::post('/queue/checkin', [QueueController::class, 'checkIn']);
Route::get('/queue/status/{queue_number}', [QueueController::class, 'getStatus']);
Route::put('/queue/serve/{queue_number}', [QueueController::class, 'serve']);
