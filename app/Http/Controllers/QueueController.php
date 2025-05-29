<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use App\Models\CustomerRecord;
use App\Models\QueueSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class QueueController extends Controller
{
    /** 
     * Check-in a customer and assign a queue number. 
     */
    public function registerCustomer(Request $request): JsonResponse
    {
        // Validate API Key
        if ($request->header('x-api-key') !== env('QUEUE_API_KEY')) {
            return response()->json(['message' => 'Unauthorized API request'], 403);
        }

        // Get queue settings
        $settings = QueueSetting::first();
        if (!$settings) {
            $settings = QueueSetting::create(['max_queue_size' => 50]); // Default value
        }

        // Check if queue is full
        $currentQueueSize = Queue::where('status', 'waiting')->count();
        if ($currentQueueSize >= $settings->max_queue_size) {
            return response()->json([
                'message' => 'Queue is currently full. Please try again later.',
                'current_size' => $currentQueueSize,
                'max_size' => $settings->max_queue_size
            ], 409); // 409 Conflict status code
        }

        // Accept either 'customer_name' or 'name'
        $validated = $request->validate([
            'customer_name' => 'sometimes|required|string|max:255',
            'name' => 'sometimes|required|string|max:255',
            'student_id' => 'nullable|string|max:50',
            'purpose' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
        ]);

        // Use 'customer_name' if present, otherwise use 'name'
        $customerName = $validated['customer_name'] ?? $validated['name'];

        // Generate queue number safely
        $queueNumber = Queue::max('queue_number') ? Queue::max('queue_number') + 1 : 1;

        // Store customer in queue
        $queue = Queue::create([
            'customer_name' => $customerName,
            'student_id' => $validated['student_id'] ?? null,
            'purpose' => $validated['purpose'] ?? null,
            'email' => $validated['email'] ?? null,
            'queue_number' => $queueNumber,
            'status' => 'waiting',
        ]);

        return response()->json([
            'message' => 'Customer registered successfully.',
            'queue_number' => $queue->queue_number,
        ], 201);
    }

    /** 
     * Get the entire queue status (cached for efficiency). 
     */
    public function getQueueStatus(): JsonResponse
    {
        $queue = Cache::remember('queue_status', 5, function () {
            return Queue::orderBy('queue_number', 'asc')->get();
        });

        if ($queue->isEmpty()) {
            return response()->json(['message' => 'No queue data found.'], 404);
        }

        return response()->json(['queue' => $queue]);
    }


    /** 
     * Serve the first waiting customer and shift the queue forward automatically. 
     * Also creates a record in customer_records.
     */
    public function serveNext(): JsonResponse
    {
        try {
            $currentQueue = Queue::where('status', 'waiting')->orderBy('queue_number', 'asc')->first();

            if (!$currentQueue) {
                return response()->json(['message' => 'No queue to serve.'], 404);
            }

            // Update queue status
            $currentQueue->update([
                'status' => 'served',
                'served_at' => now(),
            ]);

            // Create record in customer_records table
            CustomerRecord::insert([
                'customer_name' => $currentQueue->customer_name,
                'student_id' => $currentQueue->student_id,
                'purpose' => $currentQueue->purpose,
                'email' => $currentQueue->email,
                'queue_number' => $currentQueue->queue_number,
                'status' => 'served',
                'served_at' => $currentQueue->served_at,
                'created_at' => $currentQueue->created_at,
                'updated_at' => now(),
            ]);

            // Clear cache so updated queue status reflects instantly
            Cache::forget('queue_status');

            // Find next waiting customer
            $nextQueue = Queue::where('status', 'waiting')->orderBy('queue_number', 'asc')->first();

            return response()->json([
                'message' => 'Customer served successfully.',
                'nextQueue' => $nextQueue ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Error serving customer: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to serve customer',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Skip a customer and record in customer_records.
     */
    public function skipCustomer($queue_number)
    {
        try {
            $queue = Queue::where('queue_number', $queue_number)->firstOrFail();
            $queue->status = 'skipped';
            $queue->served_at = now();
            $queue->save();

            // Create record in customer_records table for skipped customer
            CustomerRecord::insert([
                'customer_name' => $queue->customer_name,
                'student_id' => $queue->student_id,
                'purpose' => $queue->purpose,
                'email' => $queue->email,
                'queue_number' => $queue->queue_number,
                'status' => 'skipped',
                'served_at' => $queue->served_at,
                'created_at' => $queue->created_at
            ]);

            return response()->json(['message' => 'Customer skipped successfully.']);
        } catch (\Exception $e) {
            Log::error('Error skipping customer: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to skip customer',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function resetQueue(): JsonResponse
    {
        // ✅ Delete all queue entries
        \App\Models\Queue::truncate();

        // ✅ Clear cache to reflect changes instantly
        Cache::forget('queue_status');

        return response()->json(['message' => 'Queue reset successfully.']);
    }

    /**
     * Get the currently serving queue number (first 'waiting' customer).
     */
    public function getCurrentServingQueue(): JsonResponse
    {
        $current = Queue::where('status', 'waiting')
            ->orderBy('queue_number', 'asc')
            ->first();

        if (!$current) {
            return response()->json(['message' => 'No customer is currently being served.'], 404);
        }

        return response()->json([
            'current_queue_number' => $current->queue_number,
            'customer_name' => $current->customer_name,
            'status' => $current->status,
        ]);
    }

    /**
     * Cancel a specific queue number.
     * Requires API key authentication.
     */
    public function cancelQueue(Request $request, $queue_number): JsonResponse
    {
        if ($request->header('x-api-key') !== env('QUEUE_API_KEY')) {
            return response()->json(['message' => 'Unauthorized API request'], 403);
        }

        try {
            $queue = Queue::where('queue_number', $queue_number)
                         ->where('status', 'waiting')
                         ->first();

            if (!$queue) {
                return response()->json([
                    'message' => 'Queue number not found or already processed.'
                ], 404);
            }

            // Update queue status
            $queue->update([
                'status' => 'cancelled',
                'served_at' => now(),
            ]);

            // Create record in customer_records table
            CustomerRecord::insert([
                'customer_name' => $queue->customer_name,
                'student_id' => $queue->student_id,
                'purpose' => $queue->purpose,
                'email' => $queue->email,
                'queue_number' => $queue->queue_number,
                'status' => 'cancelled',
                'served_at' => $queue->served_at,
                'created_at' => $queue->created_at,
                'updated_at' => now(),
            ]);

            Cache::forget('queue_status');

            return response()->json([
                'message' => 'Queue cancelled successfully.',
                'queue_number' => $queue_number
            ]);

        } catch (\Exception $e) {
            Log::error('Error cancelling queue: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to cancel queue',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
