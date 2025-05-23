<?php

namespace App\Http\Controllers;

use App\Models\CustomerRecord;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CustomerRecordController extends Controller
{
    /**
     * Display a listing of customer records with pagination and filtering
     */
    public function index(Request $request)
    {
        // Start with base query
        $query = CustomerRecord::query();

        // Handle date filtering
        if ($request->has('date')) {
            $date = Carbon::parse($request->date);
            $query->whereDate('served_at', $date);
        } else {
            // Default to today's records
            $query->whereDate('served_at', Carbon::today());
        }

        // Handle status filtering
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Handle purpose filtering
        if ($request->has('purpose') && $request->purpose !== 'all') {
            $query->where('purpose', $request->purpose);
        }

        // Handle search by name or student_id
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'LIKE', "%{$search}%")
                    ->orWhere('student_id', 'LIKE', "%{$search}%");
            });
        }

        // Get sorted results
        $records = $query->orderBy('served_at', 'desc')
            ->paginate($request->per_page ?? 10);

        // Get purposes only for today's records
        $purposes = CustomerRecord::whereDate('served_at', Carbon::today())
            ->distinct('purpose')
            ->pluck('purpose');

        return response()->json([
            'records' => $records,
            'purposes' => $purposes
        ]);
    }

    /**
     * Get stats for the current day
     */
    public function getDailyStats()
    {
        $today = Carbon::today();

        $totalServed = CustomerRecord::whereDate('served_at', $today)
            ->where('status', 'served')
            ->count();

        $totalSkipped = CustomerRecord::whereDate('served_at', $today)
            ->where('status', 'skipped')
            ->count();

        $byPurpose = CustomerRecord::whereDate('served_at', $today)
            ->whereIn('status', ['served', 'skipped'])
            ->selectRaw('purpose, COUNT(*) as count')
            ->groupBy('purpose')
            ->orderBy('count', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'purpose' => $item->purpose,
                    'count' => $item->count,
                ];
            })
            ->toArray();

        return response()->json([
            'total_served' => $totalServed,
            'total_skipped' => $totalSkipped,
            'by_purpose' => $byPurpose
        ]);
    }
}
