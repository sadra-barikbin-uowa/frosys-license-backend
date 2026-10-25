<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DriverController extends Controller
{
    private function driversFor(Request $request)
    {
        $query = Driver::query();

        if ($request->user()?->role !== 'admin') {
            $query->where('created_by', $request->user()->id);
        }

        return $query;
    }

    public function index(Request $request)
    {
        $drivers = $this->driversFor($request)
            ->with('vehicles')
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($drivers);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'person_type' => ['required', 'string', 'max:100'],
            'national_id' => ['nullable', 'string', 'max:100', 'unique:drivers,national_id'],
            'birth_date' => ['nullable', 'date'],
            'phone' => ['required', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:1000'],
            'identity_document' => ['required', 'image', 'max:5120'],
            'identity_document_type' => ['required', Rule::in(['university_id', 'administrative_order'])],
            'identity_document_back' => ['required_if:identity_document_type,university_id', 'image', 'max:5120', 'prohibited_unless:identity_document_type,university_id'],
            'photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $data['public_id'] = (string) Str::uuid();
        $data['created_by'] = $request->user()->id;

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')
                ->store('drivers', 'public');
        }

        $data['identity_document'] = $request->file('identity_document')
            ->store('driver-documents', 'public');
        if ($request->hasFile('identity_document_back')) {
            $data['identity_document_back'] = $request->file('identity_document_back')
                ->store('driver-documents', 'public');
        }

        $driver = Driver::create($data);

        return response()->json([
            'message' => 'تمت إضافة السائق بنجاح.',
            'driver' => $driver,
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $driver = $this->driversFor($request)
            ->with(['vehicles', 'badges', 'creator'])
            ->findOrFail($id);

        return response()->json(['driver' => $driver]);
    }

    public function update(Request $request, string $id)
    {
        $driver = $this->driversFor($request)->findOrFail($id);

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
            'photo' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'identity_document' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'identity_document_type' => ['sometimes', Rule::in(['university_id', 'administrative_order'])],
            'identity_document_back' => [
                Rule::requiredIf(fn () =>
                    ($request->input('identity_document_type', $driver->identity_document_type) === 'university_id')
                    && (!$driver->identity_document_back
                        || ($request->exists('identity_document_back') && !$request->hasFile('identity_document_back')))
                ),
                'nullable',
                'image',
                'max:5120',
                'prohibited_unless:identity_document_type,university_id',
            ],
        ]);

        if ($request->hasFile('photo')) {
            if ($driver->photo) {
                Storage::disk('public')->delete($driver->photo);
            }

            $data['photo'] = $request->file('photo')
                ->store('drivers', 'public');
        } elseif (array_key_exists('photo', $data) && $driver->photo) {
            Storage::disk('public')->delete($driver->photo);
        }

        if ($request->hasFile('identity_document')) {
            if ($driver->identity_document) {
                Storage::disk('public')->delete($driver->identity_document);
            }

            $data['identity_document'] = $request->file('identity_document')
                ->store('driver-documents', 'public');
        } elseif (array_key_exists('identity_document', $data) && $driver->identity_document) {
            Storage::disk('public')->delete($driver->identity_document);
        }

        if ($request->hasFile('identity_document_back')) {
            if ($driver->identity_document_back) {
                Storage::disk('public')->delete($driver->identity_document_back);
            }
            $data['identity_document_back'] = $request->file('identity_document_back')
                ->store('driver-documents', 'public');
        } elseif (array_key_exists('identity_document_back', $data) && $driver->identity_document_back) {
            Storage::disk('public')->delete($driver->identity_document_back);
            $data['identity_document_back'] = null;
        }

        if (($data['identity_document_type'] ?? null) === 'administrative_order') {
            if ($driver->identity_document_back) {
                Storage::disk('public')->delete($driver->identity_document_back);
            }
            $data['identity_document_back'] = null;
        }

        $driver->update($data);
        $driver->badges()->update([
            'driver_name' => $driver->full_name,
            'job_title' => $driver->job_title,
            'person_type' => $driver->person_type,
            'driver_photo' => $driver->photo,
            'national_id' => $driver->national_id,
        ]);

        return response()->json([
            'message' => 'تم تحديث بيانات السائق بنجاح.',
            'driver' => $driver->fresh()->load('vehicles'),
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $driver = $this->driversFor($request)->findOrFail($id);

        if ($driver->badges()->exists()) {
            return response()->json([
                'message' => 'لا يمكن حذف سائق مرتبط ببطاقات. احذف البطاقات المرتبطة أولاً.',
            ], 422);
        }

        if ($driver->photo) {
            Storage::disk('public')->delete($driver->photo);
        }

        if ($driver->identity_document) {
            Storage::disk('public')->delete($driver->identity_document);
        }
        if ($driver->identity_document_back) {
            Storage::disk('public')->delete($driver->identity_document_back);
        }

        $driver->delete();

        return response()->json([
            'message' => 'تم حذف السائق بنجاح.',
        ]);
    }
}