<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MultimediaSchedulingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MultimediaController extends Controller
{
    protected MultimediaSchedulingService $multimediaService;

    public function __construct(MultimediaSchedulingService $multimediaService)
    {
        $this->multimediaService = $multimediaService;
    }

    /**
     * Endpoint ketersediaan slot jadwal Multimedia (PRD FR-MM-03)
     */
    public function availability(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        $bookedSlots = $this->multimediaService->getAvailability($date);

        return response()->json([
            'status' => 'success',
            'data' => [
                'date' => $date,
                'booked_slots' => $bookedSlots,
            ],
        ]);
    }
}
