<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\QueueSetting;

class QueueSettingsController extends Controller
{
    // ✅ Get the current max queue size
    public function getMaxQueueSize()
    {
        $setting = QueueSetting::first();
        return response()->json(['max_queue_size' => $setting ? $setting->max_queue_size : 50]);
    }

    // ✅ Update max queue size
    public function updateMaxQueueSize(Request $request)
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

        return response()->json(['message' => 'Max queue size updated.', 'max_queue_size' => $setting->max_queue_size]);
    }
}
