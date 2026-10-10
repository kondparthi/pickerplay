<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    public function index(): JsonResponse
    {
        $page = AuditLog::with('user:id,name,email')->latest('created_at')->paginate(50);

        return response()->json([
            'data' => $page->items(), 'total' => $page->total(),
            'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(),
        ]);
    }
}
