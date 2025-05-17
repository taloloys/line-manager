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
        $query = CustomerRecord::where('status', 'served');

        // Handle date filtering
        if ($request->has('date')) {
            $date = Carbon::parse($request->date);
            $query->whereDate('served_at', $date);
        } else {
            // Default to today's records
            $query->whereDate('served_at', Carbon::today());
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

        // Get unique purposes for filter dropdown
        $purposes = CustomerRecord::distinct('purpose')->pluck('purpose');

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

        $byPurpose = CustomerRecord::whereDate('served_at', $today)
            ->where('status', 'served')
            ->selectRaw('purpose, COUNT(*) as count')
            ->groupBy('purpose')
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
            'by_purpose' => $byPurpose
        ]);
    }
}
