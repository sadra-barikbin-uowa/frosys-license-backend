<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class VehicleController extends Controller
{
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
        $vehicles = $this->vehiclesFor($request)
            ->with('driver')
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($vehicles);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vehicle_number' => [
                'required', 'string', 'max:100',
                'unique:vehicles,vehicle_number',
            ],
            'vehicle_type' => ['required', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'color' => ['nullable', 'string', 'max:100'],
            'driver_id' => ['nullable', 'integer', 'exists:drivers,id'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'registration_front' => ['required', 'image', 'max:5120'],
            'registration_back' => ['required', 'image', 'max:5120'],
        ]);

        $data['public_id'] = (string) Str::uuid();
        $data['created_by'] = $request->user()->id;

        if (!empty($data['driver_id'])) {
            $this->driversFor($request)->findOrFail($data['driver_id']);
        }

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')
                ->store('vehicles', 'public');
        }
        foreach (['registration_front', 'registration_back'] as $field) {
            $data[$field] = $request->file($field)->store('vehicle-registrations', 'public');
        }

        $vehicle = Vehicle::create($data);

        return response()->json([
            'message' => 'تمت إضافة المركبة بنجاح.',
            'vehicle' => $vehicle->load('driver'),
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $vehicle = $this->vehiclesFor($request)
            ->with(['driver', 'badges', 'creator'])
            ->findOrFail($id);

        return response()->json([
            'vehicle' => $vehicle,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $vehicle = $this->vehiclesFor($request)->findOrFail($id);

        $data = $request->validate([
            'vehicle_number' => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('vehicles', 'vehicle_number')->ignore($vehicle->id),
            ],
            'vehicle_type' => ['sometimes', 'required', 'string', 'max:100'],
            'model' => ['sometimes', 'nullable', 'string', 'max:255'],
            'year' => [
                'sometimes', 'nullable', 'integer',
                'min:1900', 'max:' . (date('Y') + 1),
            ],
            'color' => ['sometimes', 'nullable', 'string', 'max:100'],
            'driver_id' => ['sometimes', 'nullable', 'integer', 'exists:drivers,id'],
            'photo' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'registration_front' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'registration_back' => ['sometimes', 'nullable', 'image', 'max:5120'],
        ]);

        if (!empty($data['driver_id'])) {
            $this->driversFor($request)->findOrFail($data['driver_id']);
        }

        if ($request->hasFile('photo')) {
            if ($vehicle->photo) {
                Storage::disk('public')->delete($vehicle->photo);
            }

            $data['photo'] = $request->file('photo')
                ->store('vehicles', 'public');
        } elseif (array_key_exists('photo', $data) && $vehicle->photo) {
            Storage::disk('public')->delete($vehicle->photo);
        }

        foreach (['registration_front', 'registration_back'] as $field) {
            if ($request->hasFile($field)) {
                if ($vehicle->{$field}) {
                    Storage::disk('public')->delete($vehicle->{$field});
                }
                $data[$field] = $request->file($field)->store('vehicle-registrations', 'public');
            } elseif (array_key_exists($field, $data) && $vehicle->{$field}) {
                Storage::disk('public')->delete($vehicle->{$field});
                $data[$field] = null;
            }
        }

        $vehicle->update($data);
        $vehicle->badges()->update([
            'vehicle_type' => $vehicle->vehicle_type,
            'vehicle_number' => $vehicle->vehicle_number,
            'vehicle_model' => $vehicle->model,
            'vehicle_color' => $vehicle->color,
        ]);

        return response()->json([
            'message' => 'تم تحديث بيانات المركبة بنجاح.',
            'vehicle' => $vehicle->fresh()->load('driver'),
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $vehicle = $this->vehiclesFor($request)->findOrFail($id);

        if ($vehicle->badges()->exists()) {
            return response()->json([
                'message' => 'لا يمكن حذف مركبة مرتبطة ببطاقات. احذف البطاقات المرتبطة أولاً.',
            ], 422);
        }

        if ($vehicle->photo) {
            Storage::disk('public')->delete($vehicle->photo);
        }
        foreach (['registration_front', 'registration_back'] as $field) {
            if ($vehicle->{$field}) {
                Storage::disk('public')->delete($vehicle->{$field});
            }
        }

        $vehicle->delete();

        return response()->json([
            'message' => 'تم حذف المركبة بنجاح.',
        ]);
    }

    private function driversFor(Request $request)
    {
        $query = \App\Models\Driver::query();

        if ($request->user()?->role !== 'admin') {
            $query->where('created_by', $request->user()->id);
        }

        return $query;
    }
}