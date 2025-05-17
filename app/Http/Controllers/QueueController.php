<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache; // ✅ Added caching support

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
            'created_at' => now(),
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
     * Get status of a specific queue number. 
     */
    public function getStatus($queue_number): JsonResponse
    {
        $queue = Queue::where('queue_number', $queue_number)->first();

        if (!$queue) {
            return response()->json(['message' => 'Queue number not found.'], 404);
        }

        // Calculate queue position dynamically
        $position = Queue::where('status', 'waiting')
            ->where('queue_number', '<=', $queue_number)
            ->count();

        return response()->json([
            'queue_number' => $queue_number,
            'position_in_queue' => $position,
            'status' => $queue->status,
        ]);
    }

    /** 
     * Serve the first waiting customer and shift the queue forward automatically. 
     */
    public function serveNext(): JsonResponse
    {
        $currentQueue = Queue::where('status', 'waiting')->orderBy('queue_number', 'asc')->first();

        if (!$currentQueue) {
            return response()->json(['message' => 'No queue to serve.'], 404);
        }

        $currentQueue->update([
            'status' => 'served',
            'served_at' => now(),
        ]);

        // ✅ Clear cache so updated queue status reflects instantly
        Cache::forget('queue_status');

        // Find next waiting customer
        $nextQueue = Queue::where('status', 'waiting')->orderBy('queue_number', 'asc')->first();

        return response()->json([
            'message' => 'Customer served successfully.',
            'nextQueue' => $nextQueue ?? null,
        ]);
    }

    public function skipCustomer($queue_number)
    {
        try {
            $queue = Queue::where('queue_number', $queue_number)->firstOrFail();
            $queue->status = 'skipped'; // Ensure this value matches the database schema
            $queue->served_at = now();
            $queue->save();

            return response()->json(['message' => 'Customer skipped successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function resetQueue()
    {
        try {
            // Reset queue numbers and statuses without truncating the table
            Queue::query()->update([
                'queue_number' => null,
                'status' => 'waiting',
                'served_at' => null,
            ]);

            Cache::forget('queue_status'); // Clear cache

            return response()->json(['message' => 'Queue reset successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
