<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\Driver;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BadgeController extends Controller
{
    private function badgesFor(Request $request)
    {
        $query = Badge::query();

        if ($request->user()?->role !== 'admin') {
            $query->where('created_by', $request->user()->id);
        }

        return $query;
    }

    private function driversFor(Request $request)
    {
        $query = Driver::query();

        if ($request->user()?->role !== 'admin') {
            $query->where('created_by', $request->user()->id);
        }

        return $query;
    }

    private function vehiclesFor(Request $request)
    {
        $query = Vehicle::query();

        if ($request->user()?->role !== 'admin') {
            $query->where('created_by', $request->user()->id);
        }

        return $query;
    }

    public function index(Request $request)
    {
        $badges = $this->badgesFor($request)
            ->with(['driver', 'vehicle', 'creator'])
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($badges);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'badge_number' => [
                'sometimes', 'required', 'string', 'max:100',
                'unique:badges,badge_number',
            ],
            'driver_id' => ['required', 'integer', 'exists:drivers,id'],
            'vehicle_id' => [
                'nullable', 'integer',
                Rule::exists('vehicles', 'id'),
            ],
            'issue_date' => ['required', 'date'],
            'expiry_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'status' => ['sometimes', 'required', Rule::in(['Active', 'Inactive', 'Expired', 'Suspended'])],
        ]);

        $driver = $this->driversFor($request)->findOrFail($data['driver_id']);

        $vehicle = null;

        if (! empty($data['vehicle_id'])) {
            $vehicle = $this->vehiclesFor($request)->findOrFail($data['vehicle_id']);

            if (
                $vehicle->driver_id !== null &&
                (int) $vehicle->driver_id !== (int) $driver->id
            ) {
                return response()->json([
                    'message' => 'المركبة مرتبطة بسائق آخر. اختر مركبة السائق المحدد.',
                ], 422);
            }
        }

        $badge = DB::transaction(function () use ($data, $driver, $vehicle, $request) {
            $badge = Badge::create([
                'public_id' => (string) Str::uuid(),
                'badge_number' => $data['badge_number']
                    ?? 'PENDING-'.(string) Str::uuid(),
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle?->id,
                'driver_name' => $driver->full_name,
                'job_title' => $driver->job_title,
                'person_type' => $driver->person_type,
                'driver_photo' => $driver->photo,
                'national_id' => $driver->national_id,
                'vehicle_type' => $vehicle?->vehicle_type,
                'vehicle_number' => $vehicle?->vehicle_number,
                'vehicle_model' => $vehicle?->model,
                'vehicle_color' => $vehicle?->color,
                'issue_date' => $data['issue_date'],
                'expiry_date' => $data['expiry_date'],
                'status' => $data['status'] ?? 'Active',
                'created_by' => $request->user()->id,
            ]);

            if (! isset($data['badge_number'])) {
                $badge->badge_number = sprintf('DRV-%s-%05d', date('Y'), $badge->id);
                $badge->save();
            }

            return $badge;
        });

        return response()->json([
            'message' => 'تم إنشاء بطاقة التعريف بنجاح.',
            'badge' => $badge->load(['driver', 'vehicle', 'creator']),
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $badge = $this->badgesFor($request)
            ->with(['driver', 'vehicle', 'creator'])
            ->findOrFail($id);

        return response()->json([
            'badge' => $badge,
        ]);
    }

    public function authorizePrint(Request $request, string $id)
    {
        abort_unless(
            $request->user()->can('badges.view'),
            403,
            'تحتاج إلى صلاحية عرض البطاقة قبل طباعتها.'
        );

        $this->badgesFor($request)->findOrFail($id);

        return response()->noContent();
    }

    public function update(Request $request, string $id)
    {
        $badge = $this->badgesFor($request)->findOrFail($id);

        $request->validate([
            'driver_id' => ['sometimes', 'required', 'integer'],
        ]);
        abort_if(
            $request->exists('driver_id') && ! $request->user()->can('drivers.edit'),
            403,
            'لا تملك صلاحية تعديل بيانات السائق.'
        );
        $driverId = $request->input('driver_id', $badge->driver_id);
        $driver = $this->driversFor($request)->findOrFail($driverId);

        $data = $request->validate([
            'badge_number' => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('badges', 'badge_number')->ignore($badge->id),
            ],
            'driver_id' => ['sometimes', 'required', 'integer'],
            'vehicle_id' => ['sometimes', 'nullable', 'integer', 'exists:vehicles,id'],
            'driver_name' => ['sometimes', 'required', 'string', 'max:255'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'person_type' => ['sometimes', 'nullable', 'string', 'max:100'],
            'driver_photo' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'national_id' => [
                'sometimes', 'nullable', 'string', 'max:100',
                Rule::unique('drivers', 'national_id')->ignore($driver->id),
            ],
            'vehicle_type' => ['sometimes', 'nullable', 'string', 'max:100'],
            'vehicle_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'vehicle_model' => ['sometimes', 'nullable', 'string', 'max:255'],
            'vehicle_color' => ['sometimes', 'nullable', 'string', 'max:100'],
            'issue_date' => ['sometimes', 'required', 'date'],
            'expiry_date' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', 'required', Rule::in(['Active', 'Inactive', 'Expired', 'Suspended'])],
        ]);

        $driverFields = [
            'driver_id',
            'driver_name',
            'job_title',
            'person_type',
            'driver_photo',
            'national_id',
        ];
        abort_if(
            array_intersect($driverFields, array_keys($data)) &&
                ! $request->user()->can('drivers.edit'),
            403,
            'لا تملك صلاحية تعديل بيانات السائق.'
        );

        $vehicleFields = [
            'vehicle_id',
            'vehicle_type',
            'vehicle_number',
            'vehicle_model',
            'vehicle_color',
        ];
        abort_if(
            array_intersect($vehicleFields, array_keys($data)) &&
                ! $request->user()->can('vehicles.manage'),
            403,
            'لا تملك صلاحية إدارة المركبات.'
        );

        $vehicle = array_key_exists('vehicle_id', $data)
            ? (! empty($data['vehicle_id']) ? $this->vehiclesFor($request)->findOrFail($data['vehicle_id']) : null)
            : ($badge->vehicle_id ? $this->vehiclesFor($request)->findOrFail($badge->vehicle_id) : null);

        if (
            $vehicle &&
            $vehicle->driver_id !== null &&
            (int) $vehicle->driver_id !== (int) $driver->id
        ) {
            return response()->json([
                'message' => 'المركبة مرتبطة بسائق آخر. اختر مركبة السائق المحدد.',
            ], 422);
        }

        $driverUpdates = [];
        foreach ([
            'driver_name' => 'full_name',
            'job_title' => 'job_title',
            'person_type' => 'person_type',
            'national_id' => 'national_id',
        ] as $requestField => $driverField) {
            if (array_key_exists($requestField, $data)) {
                $driverUpdates[$driverField] = $data[$requestField];
            }
        }

        if ($request->hasFile('driver_photo')) {
            $newPhoto = $request->file('driver_photo')->store('drivers', 'public');
            if ($driver->photo) {
                Storage::disk('public')->delete($driver->photo);
            }
            $driverUpdates['photo'] = $newPhoto;
            $data['driver_photo'] = $newPhoto;
        } elseif (array_key_exists('driver_photo', $data)) {
            if ($driver->photo) {
                Storage::disk('public')->delete($driver->photo);
            }
            $driverUpdates['photo'] = null;
        }

        if ($driverUpdates) {
            $driver->update($driverUpdates);
            $driver->badges()->update([
                'driver_name' => $driver->full_name,
                'job_title' => $driver->job_title,
                'person_type' => $driver->person_type,
                'driver_photo' => $driver->photo,
                'national_id' => $driver->national_id,
            ]);
        }

        if ($vehicle) {
            $vehicleUpdates = [];
            foreach ([
                'vehicle_type' => 'vehicle_type',
                'vehicle_number' => 'vehicle_number',
                'vehicle_model' => 'model',
                'vehicle_color' => 'color',
            ] as $requestField => $vehicleField) {
                if (array_key_exists($requestField, $data)) {
                    $vehicleUpdates[$vehicleField] = $data[$requestField];
                }
            }

            if ($vehicleUpdates) {
                $vehicle->update($vehicleUpdates);
                $vehicle->badges()->update([
                    'vehicle_type' => $vehicle->vehicle_type,
                    'vehicle_number' => $vehicle->vehicle_number,
                    'vehicle_model' => $vehicle->model,
                    'vehicle_color' => $vehicle->color,
                ]);
            }
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

        $badge->vehicle_type = $vehicle?->vehicle_type
            ?? ($data['vehicle_type'] ?? $badge->vehicle_type);
        $badge->vehicle_number = $vehicle?->vehicle_number
            ?? ($data['vehicle_number'] ?? $badge->vehicle_number);
        $badge->vehicle_model = $vehicle?->model
            ?? ($data['vehicle_model'] ?? $badge->vehicle_model);
        $badge->vehicle_color = $vehicle?->color
            ?? ($data['vehicle_color'] ?? $badge->vehicle_color);

        $badge->save();

        return response()->json([
            'message' => 'تم تحديث بطاقة التعريف بنجاح.',
            'badge' => $badge->fresh()->load(['driver', 'vehicle', 'creator']),
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $badge = $this->badgesFor($request)->findOrFail($id);
        $badge->delete();

        return response()->json([
            'message' => 'تم حذف بطاقة التعريف بنجاح.',
        ]);
    }
}
