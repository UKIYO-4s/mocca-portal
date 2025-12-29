<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureTwoFactorAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // If user has 2FA enabled but hasn't verified in this session
        if ($user &&
            $user->two_factor_confirmed_at &&
            !$request->session()->get('two_factor_confirmed')
        ) {
            // Allow access to 2FA related routes
            if ($request->routeIs('two-factor.challenge', 'two-factor.verify', 'two-factor.setup', 'logout')) {
                return $next($request);
            }

            return redirect()->route('two-factor.challenge');
        }

        return $next($request);
    }
}
