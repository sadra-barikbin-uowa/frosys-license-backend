<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class DriverController extends Controller
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

        $drivers = Driver::with('vehicles')
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($drivers);
    }

    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'person_type' => ['required', 'string', 'max:100'],
            'national_id' => ['nullable', 'string', 'max:100', 'unique:drivers,national_id'],
            'birth_date' => ['nullable', 'date'],
            'phone' => ['required', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:1000'],
            'license_number' => ['required', 'string', 'max:100', 'unique:drivers,license_number'],
            'license_issue' => ['nullable', 'date'],
            'license_expiry' => ['required', 'date', 'after_or_equal:today'],
            'photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $data['public_id'] = (string) Str::uuid();
        $data['created_by'] = $request->user()->id;

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')
                ->store('drivers', 'public');
        }

        $driver = Driver::create($data);

        return response()->json([
            'message' => 'تمت إضافة السائق بنجاح.',
            'driver' => $driver,
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $driver = Driver::with(['vehicles', 'badges'])
            ->findOrFail($id);

        return response()->json(['driver' => $driver]);
    }

    public function update(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $driver = Driver::findOrFail($id);

        $data = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'person_type' => ['sometimes', 'required', 'string', 'max:100'],
            'national_id' => [
                'sometimes', 'nullable', 'string', 'max:100',
                Rule::unique('drivers', 'national_id')->ignore($driver->id),
            ],
            'birth_date' => ['sometimes', 'nullable', 'date'],
            'phone' => ['sometimes', 'required', 'string', 'max:50'],
            'address' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'license_number' => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('drivers', 'license_number')->ignore($driver->id),
            ],
            'license_issue' => ['sometimes', 'nullable', 'date'],
            'license_expiry' => ['sometimes', 'required', 'date', 'after_or_equal:today'],
            'photo' => ['sometimes', 'nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')
                ->store('drivers', 'public');
        }

        $driver->update($data);

        return response()->json([
            'message' => 'تم تحديث بيانات السائق بنجاح.',
            'driver' => $driver->fresh(),
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $driver = Driver::findOrFail($id);

        if ($driver->badges()->exists()) {
            return response()->json([
                'message' => 'لا يمكن حذف سائق مرتبط ببطاقات. احذف البطاقات المرتبطة أولاً.',
            ], 422);
        }

        $driver->delete();

        return response()->json([
            'message' => 'تم حذف السائق بنجاح.',
        ]);
    }
}