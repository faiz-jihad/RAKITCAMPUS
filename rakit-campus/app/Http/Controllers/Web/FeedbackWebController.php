<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\SystemFeedback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FeedbackWebController extends Controller
{
    /**
     * Store feedback and suggestions for the system.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:150'],
            'category' => ['required', 'string', 'in:saran_fitur,antarmuka_ui,kendala_bug,performa,lainnya'],
            'message' => ['required', 'string', 'min:5', 'max:2000'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ], [
            'category.required' => 'Pilih kategori saran atau masukan.',
            'category.in' => 'Kategori masukan tidak valid.',
            'message.required' => 'Tuliskan pesan masukan atau saran Anda.',
            'message.min' => 'Pesan masukan minimal 5 karakter.',
            'message.max' => 'Pesan masukan maksimal 2000 karakter.',
            'email.email' => 'Format email tidak valid.',
        ]);

        $user = $request->user();

        $name = $validated['name'] ?? null;
        $email = $validated['email'] ?? null;

        if ($user) {
            $name = $name ?: $user->name;
            $email = $email ?: $user->email;
        }

        SystemFeedback::create([
            'user_id' => $user?->id,
            'name' => $name,
            'email' => $email,
            'category' => $validated['category'],
            'message' => $validated['message'],
            'rating' => $validated['rating'] ?? null,
            'status' => 'pending',
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        return back()->with('feedback_success', 'Terima kasih atas saran dan masukan Anda! Masukan Anda sangat berharga untuk pengembangan RAKIT Campus.');
    }
}
