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

        $vehicles = Vehicle::with('driver')
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($vehicles);
    }

    public function store(Request $request)
    {
        $this->ensureAdmin($request);

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
        ]);

        $data['public_id'] = (string) Str::uuid();
        $data['created_by'] = $request->user()->id;

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')
                ->store('vehicles', 'public');
        }

        $vehicle = Vehicle::create($data);

        return response()->json([
            'message' => 'تمت إضافة المركبة بنجاح.',
            'vehicle' => $vehicle->load('driver'),
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $vehicle = Vehicle::with(['driver', 'badges'])
            ->findOrFail($id);

        return response()->json([
            'vehicle' => $vehicle,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $vehicle = Vehicle::findOrFail($id);

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
        ]);

        if ($request->hasFile('photo')) {
            if ($vehicle->photo) {
                Storage::disk('public')->delete($vehicle->photo);
            }

            $data['photo'] = $request->file('photo')
                ->store('vehicles', 'public');
        }

        $vehicle->update($data);

        return response()->json([
            'message' => 'تم تحديث بيانات المركبة بنجاح.',
            'vehicle' => $vehicle->fresh()->load('driver'),
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $vehicle = Vehicle::findOrFail($id);

        if ($vehicle->badges()->exists()) {
            return response()->json([
                'message' => 'لا يمكن حذف مركبة مرتبطة ببطاقات. احذف البطاقات المرتبطة أولاً.',
            ], 422);
        }

        if ($vehicle->photo) {
            Storage::disk('public')->delete($vehicle->photo);
        }

        $vehicle->delete();

        return response()->json([
            'message' => 'تم حذف المركبة بنجاح.',
        ]);
    }
}