<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot()
    {
        $this->app['router']->group([
            'namespace' => 'App\Http\Controllers',
            'prefix' => 'api',
        ], function ($router) {
            Route::post('/queue/checkin', 'QueueController@checkIn');
            Route::get('/queue/status/{queue_number}', 'QueueController@getStatus');
            Route::put('/queue/serve/{queue_number}', 'QueueController@serve');
        });
    }
}
