<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MatchingWebController extends Controller
{
    /**
     * Redirect legacy /matching route directly to Competition Hub's Cari Tim (Radar Rekrutmen).
     */
    public function index(Request $request): RedirectResponse
    {
        return redirect()->to('/competitions?tab=teams&view=radar');
    }
}
