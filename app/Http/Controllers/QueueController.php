<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class QueueController extends Controller
{
    /**
     * Check-in a customer and assign a queue number.
     */
    public function checkIn(Request $request): JsonResponse
    {
        // Validate input
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
        ]);

        // Generate next queue number safely
        $queueNumber = Queue::max('queue_number') ? Queue::max('queue_number') + 1 : 1;

        // Create a new queue record
        $queue = Queue::create([
            'customer_name' => $validated['customer_name'],
            'queue_number' => $queueNumber,
            'status' => 'waiting',
        ]);

        return response()->json([
            'message' => 'Customer added to queue.',
            'queue_number' => $queue->queue_number
        ], 201);
    }

    /**
     * Get the status of a specific queue number.
     */
    public function getStatus($queue_number): JsonResponse
    {
        $queue = Queue::where('queue_number', $queue_number)->first();

        // If queue number does not exist, return 404
        if (!$queue) {
            return response()->json(['message' => 'Queue number not found.'], 404);
        }

        // Calculate queue position
        $position = Queue::where('status', 'waiting')
            ->where('queue_number', '<=', $queue_number)
            ->count();

        return response()->json([
            'queue_number' => $queue_number,
            'position_in_queue' => $position,
            'status' => $queue->status
        ]);
    }

    /**
     * Get the entire queue status.
     */
    public function getQueueStatus(): JsonResponse
    {
        $queue = Queue::whereNotNull('status')->orderBy('queue_number', 'asc')->get();
        return response()->json(['queue' => $queue]);
    }

    /**
     * Serve a customer and update their status.
     */
    public function serve($queue_number): JsonResponse
    {
        $queue = Queue::where('queue_number', $queue_number)->first();

        // If queue number does not exist, return 404
        if (!$queue) {
            return response()->json(['message' => 'Queue number not found.'], 404);
        }

        // Mark as served
        $queue->update([
            'status' => 'served',
            'served_at' => now(),
        ]);

        return response()->json(['message' => 'Customer has been served.']);
    }
}
