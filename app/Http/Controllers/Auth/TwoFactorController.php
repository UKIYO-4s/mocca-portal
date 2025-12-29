<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use BaconQrCode\Renderer\Color\Rgb;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\Fill;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Display 2FA setup page.
     */
    public function setup(): Response
    {
        $user = Auth::user();

        // Generate new secret if not already set
        if (!$user->two_factor_secret) {
            $secret = $this->google2fa->generateSecretKey();
            $user->two_factor_secret = encrypt($secret);
            $user->save();
        } else {
            $secret = decrypt($user->two_factor_secret);
        }

        // Generate QR code URL (otpauth:// format)
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        // Generate QR code SVG locally using BaconQrCode
        $qrCodeSvg = $this->generateQrCodeSvg($qrCodeUrl);

        return Inertia::render('Auth/TwoFactor/Setup', [
            'qrCodeSvg' => $qrCodeSvg,
            'secret' => $secret,
            'enabled' => (bool) $user->two_factor_confirmed_at,
        ]);
    }

    /**
     * Generate QR code as SVG string.
     */
    protected function generateQrCodeSvg(string $content): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(200, 0, null, null, Fill::uniformColor(new Rgb(255, 255, 255), new Rgb(0, 0, 0))),
            new SvgImageBackEnd()
        );

        $writer = new Writer($renderer);

        return $writer->writeString($content);
    }

    /**
     * Enable 2FA after verifying the code.
     */
    public function enable(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = Auth::user();
        $secret = decrypt($user->two_factor_secret);

        if (!$this->google2fa->verifyKey($secret, $request->code)) {
            throw ValidationException::withMessages([
                'code' => '認証コードが正しくありません。',
            ]);
        }

        // Generate recovery codes
        $recoveryCodes = collect(range(1, 8))->map(function () {
            return Str::random(10) . '-' . Str::random(10);
        })->toArray();

        $user->two_factor_recovery_codes = encrypt(json_encode($recoveryCodes));
        $user->two_factor_confirmed_at = now();
        $user->save();

        // Mark 2FA as confirmed for this session immediately
        // so user can access setup page to see recovery codes
        $request->session()->put('two_factor_confirmed', true);

        return redirect()
            ->route('two-factor.setup')
            ->with('success', '二要素認証を有効にしました。')
            ->with('recoveryCodes', $recoveryCodes);
    }

    /**
     * Disable 2FA.
     */
    public function disable(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => 'required|current_password',
        ]);

        $user = Auth::user();
        $user->two_factor_secret = null;
        $user->two_factor_recovery_codes = null;
        $user->two_factor_confirmed_at = null;
        $user->save();

        // Clear 2FA session flag
        $request->session()->forget('two_factor_confirmed');

        return redirect()
            ->route('two-factor.setup')
            ->with('success', '二要素認証を無効にしました。');
    }

    /**
     * Display 2FA challenge page.
     */
    public function challenge(): Response
    {
        return Inertia::render('Auth/TwoFactor/Challenge');
    }

    /**
     * Verify 2FA code during login.
     */
    public function verify(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $user = Auth::user();

        // Check if it's a recovery code
        if (strlen($request->code) > 6) {
            return $this->verifyRecoveryCode($request, $user);
        }

        $secret = decrypt($user->two_factor_secret);

        if (!$this->google2fa->verifyKey($secret, $request->code)) {
            throw ValidationException::withMessages([
                'code' => '認証コードが正しくありません。',
            ]);
        }

        // Mark 2FA as confirmed for this session
        $request->session()->put('two_factor_confirmed', true);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Verify recovery code.
     */
    protected function verifyRecoveryCode(Request $request, $user): RedirectResponse
    {
        $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);

        if (!in_array($request->code, $recoveryCodes)) {
            throw ValidationException::withMessages([
                'code' => 'リカバリーコードが正しくありません。',
            ]);
        }

        // Remove used recovery code
        $recoveryCodes = array_diff($recoveryCodes, [$request->code]);
        $user->two_factor_recovery_codes = encrypt(json_encode(array_values($recoveryCodes)));
        $user->save();

        // Mark 2FA as confirmed for this session
        $request->session()->put('two_factor_confirmed', true);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Regenerate recovery codes.
     */
    public function regenerateRecoveryCodes(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => 'required|current_password',
        ]);

        $user = Auth::user();

        $recoveryCodes = collect(range(1, 8))->map(function () {
            return Str::random(10) . '-' . Str::random(10);
        })->toArray();

        $user->two_factor_recovery_codes = encrypt(json_encode($recoveryCodes));
        $user->save();

        return redirect()
            ->route('two-factor.setup')
            ->with('success', 'リカバリーコードを再生成しました。')
            ->with('recoveryCodes', $recoveryCodes);
    }
}
