<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\QueueSetting;
use App\Models\Queue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\JsonResponse;

class QueueSettingsController extends Controller
{
    /**
     * Get all settings
     */
    public function getSettings(): JsonResponse
    {
        $settings = QueueSetting::first();
        if (!$settings) {
            $settings = QueueSetting::create([
                'max_queue_size' => 50,
                'notification_sound' => true,
                'auto_refresh_interval' => 5,

                'privacy_mode' => true
            ]);
        }

        return response()->json($settings);
    }

    /**
     * Update settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'max_queue_size' => 'required|integer|min:1',
            'notification_sound' => 'required|boolean',
            'auto_refresh_interval' => 'required|integer|min:1|max:60',
            'privacy_mode' => 'required|boolean'
        ]);

        $settings = QueueSetting::first();
        if (!$settings) {
            $settings = new QueueSetting();
        }

        $settings->fill($request->all());
        $settings->save();

        return response()->json([
            'message' => 'Settings updated successfully.',
            'settings' => $settings
        ]);
    }

    /**
     * Reset the entire queue
     */
    public function resetQueue(): JsonResponse
    {
        // Delete all queue entries
        Queue::truncate();

        // Clear cache to reflect changes instantly
        Cache::forget('queue_status');

        return response()->json(['message' => 'Queue reset successfully.']);
    }

    /**
     * Get the current max queue size (Legacy support)
     */
    public function getMaxQueueSize(): JsonResponse
    {
        $setting = QueueSetting::first();
        return response()->json(['max_queue_size' => $setting ? $setting->max_queue_size : 50]);
    }

    /**
     * Update max queue size (Legacy support)
     */
    public function updateMaxQueueSize(Request $request): JsonResponse
    {
        $request->validate([
            'max_queue_size' => 'required|integer|min:1',
        ]);

        $setting = QueueSetting::first();
        if (!$setting) {
            $setting = QueueSetting::create(['max_queue_size' => $request->max_queue_size]);
        } else {
            $setting->update(['max_queue_size' => $request->max_queue_size]);
        }

        return response()->json([
            'message' => 'Max queue size updated.',
            'max_queue_size' => $setting->max_queue_size
        ]);
    }
}
