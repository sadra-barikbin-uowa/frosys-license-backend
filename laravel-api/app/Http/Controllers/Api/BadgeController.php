<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\Driver;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class BadgeController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->role === 'admin',
            403,
            'غير مصرح لك بتنفيذ هذه العملية.'
        );
    }

    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $badges = Badge::with(['driver', 'vehicle'])
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($badges);
    }

    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'badge_number' => [
                'required', 'string', 'max:100',
                'unique:badges,badge_number',
            ],
            'driver_id' => ['required', 'integer', 'exists:drivers,id'],
            'vehicle_id' => [
                'nullable', 'integer',
                Rule::exists('vehicles', 'id'),
            ],
            'issue_date' => ['required', 'date'],
            'expiry_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'status' => ['sometimes', 'required', Rule::in(['Active', 'Inactive', 'Expired'])],
        ]);

        $driver = Driver::findOrFail($data['driver_id']);

        $vehicle = null;

        if (!empty($data['vehicle_id'])) {
            $vehicle = Vehicle::findOrFail($data['vehicle_id']);

            if (
                $vehicle->driver_id !== null &&
                (int) $vehicle->driver_id !== (int) $driver->id
            ) {
                return response()->json([
                    'message' => 'المركبة مرتبطة بسائق آخر. اختر مركبة السائق المحدد.',
                ], 422);
            }
        }

        $badge = Badge::create([
            'public_id' => (string) Str::uuid(),
            'badge_number' => $data['badge_number'],
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle?->id,

            'driver_name' => $driver->full_name,
            'job_title' => $driver->job_title,
            'person_type' => $driver->person_type,
            'driver_photo' => $driver->photo,
            'national_id' => $driver->national_id,
            'license_number' => $driver->license_number,

            'vehicle_type' => $vehicle?->vehicle_type,
            'vehicle_number' => $vehicle?->vehicle_number,
            'vehicle_model' => $vehicle?->model,
            'vehicle_color' => $vehicle?->color,

            'issue_date' => $data['issue_date'],
            'expiry_date' => $data['expiry_date'],
            'status' => $data['status'] ?? 'Active',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'تم إنشاء بطاقة التعريف بنجاح.',
            'badge' => $badge->load(['driver', 'vehicle']),
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $badge = Badge::with(['driver', 'vehicle'])
            ->findOrFail($id);

        return response()->json([
            'badge' => $badge,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $badge = Badge::findOrFail($id);

        $data = $request->validate([
            'badge_number' => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('badges', 'badge_number')->ignore($badge->id),
            ],
            'driver_id' => ['sometimes', 'required', 'integer', 'exists:drivers,id'],
            'vehicle_id' => ['sometimes', 'nullable', 'integer', 'exists:vehicles,id'],
            'issue_date' => ['sometimes', 'required', 'date'],
            'expiry_date' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', 'required', Rule::in(['Active', 'Inactive', 'Expired'])],
        ]);

        $driver = isset($data['driver_id'])
            ? Driver::findOrFail($data['driver_id'])
            : Driver::findOrFail($badge->driver_id);

        $vehicle = array_key_exists('vehicle_id', $data)
            ? (!empty($data['vehicle_id']) ? Vehicle::findOrFail($data['vehicle_id']) : null)
            : ($badge->vehicle_id ? Vehicle::findOrFail($badge->vehicle_id) : null);

        if (
            $vehicle &&
            $vehicle->driver_id !== null &&
            (int) $vehicle->driver_id !== (int) $driver->id
        ) {
            return response()->json([
                'message' => 'المركبة مرتبطة بسائق آخر. اختر مركبة السائق المحدد.',
            ], 422);
        }

        if (
            isset($data['issue_date'], $data['expiry_date']) &&
            $data['expiry_date'] < $data['issue_date']
        ) {
            return response()->json([
                'message' => 'تاريخ الانتهاء يجب ألا يسبق تاريخ الإصدار.',
            ], 422);
        }

        $badge->fill($data);

        $badge->driver_id = $driver->id;
        $badge->vehicle_id = $vehicle?->id;

        $badge->driver_name = $driver->full_name;
        $badge->job_title = $driver->job_title;
        $badge->person_type = $driver->person_type;
        $badge->driver_photo = $driver->photo;
        $badge->national_id = $driver->national_id;
        $badge->license_number = $driver->license_number;

        $badge->vehicle_type = $vehicle?->vehicle_type;
        $badge->vehicle_number = $vehicle?->vehicle_number;
        $badge->vehicle_model = $vehicle?->model;
        $badge->vehicle_color = $vehicle?->color;

        $badge->save();

        return response()->json([
            'message' => 'تم تحديث بطاقة التعريف بنجاح.',
            'badge' => $badge->fresh()->load(['driver', 'vehicle']),
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $badge = Badge::findOrFail($id);
        $badge->delete();

        return response()->json([
            'message' => 'تم حذف بطاقة التعريف بنجاح.',
        ]);
    }
}