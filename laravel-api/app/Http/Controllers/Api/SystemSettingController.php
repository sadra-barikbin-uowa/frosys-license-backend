<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SystemSettingController extends Controller
{
    public function show()
    {
        return response()->json([
            'settings' => $this->settingsPayload($this->currentSettings()),
        ]);
    }

    public function update(Request $request)
    {
        abort_unless(
            $request->user()?->role === 'admin',
            403,
            'غير مصرح لك بتنفيذ هذه العملية.'
        );

        $data = $request->validate([
            'system_name' => ['sometimes', 'required', 'string', 'max:255'],
            'logo' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'manager_signature' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'manager_signature_color' => ['sometimes', 'required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'manager_signature_width' => ['sometimes', 'required', 'integer', 'min:1', 'max:12'],
            'badge_color' => ['sometimes', 'required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'contact_info' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'badge_validity_years' => ['sometimes', 'required', 'integer', 'min:1', 'max:20'],
            'expiring_soon_days' => ['sometimes', 'required', 'integer', 'min:1', 'max:365'],
        ]);

        $settings = $this->currentSettings();

        foreach (['logo', 'manager_signature'] as $imageField) {
            if ($request->hasFile($imageField)) {
                if ($settings->{$imageField}) {
                    Storage::disk('public')->delete($settings->{$imageField});
                }

                $data[$imageField] = $request->file($imageField)
                    ->store('settings', 'public');
            } elseif (array_key_exists($imageField, $data) && $settings->{$imageField}) {
                Storage::disk('public')->delete($settings->{$imageField});
            }
        }

        $settings->update($data);

        return response()->json([
            'message' => 'تم حفظ إعدادات النظام بنجاح.',
            'settings' => $this->settingsPayload($settings->fresh()),
        ]);
    }

    private function currentSettings(): SystemSetting
    {
        return SystemSetting::query()->firstOrCreate(['id' => 1]);
    }

    private function settingsPayload(SystemSetting $settings): array
    {
        return [
            'system_name' => $settings->system_name,
            'logo' => $settings->logo ? asset('storage/' . $settings->logo) : '',
            'manager_signature' => $settings->manager_signature
                ? asset('storage/' . $settings->manager_signature)
                : '',
            'manager_signature_color' => $settings->manager_signature_color,
            'manager_signature_width' => $settings->manager_signature_width,
            'badge_color' => $settings->badge_color,
            'contact_info' => $settings->contact_info ?? '',
            'badge_validity_years' => $settings->badge_validity_years,
            'expiring_soon_days' => $settings->expiring_soon_days,
        ];
    }
}
