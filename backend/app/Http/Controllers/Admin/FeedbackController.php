<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Feedback::query();
        if ($t = $request->query('type')) {
            $q->where('type', $t);
        }
        if ($request->query('unread')) {
            $q->where('is_read', false);
        }
        $page = $q->latest()->paginate(25);

        return response()->json([
            'data' => $page->items(), 'total' => $page->total(),
            'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        Feedback::findOrFail($id)->update($request->validate(['is_read' => ['required', 'boolean']]));

        return response()->json(['ok' => true]);
    }

    public function destroy(int $id): JsonResponse
    {
        Feedback::findOrFail($id)->delete();

        return response()->json(['ok' => true]);
    }
}
