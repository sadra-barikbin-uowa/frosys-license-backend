<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\BadgeRequest as BadgeRequestModel;
use App\Models\Driver;
use App\Models\SystemSetting;
use App\Models\Vehicle;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BadgeRequestController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'person_type' => ['required', 'string', Rule::in([
                'teaching_staff',
                'employee',
                'teaching_assistant',
                'external_lecturer',
                'student',
            ])],
            'national_id' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date'],
            'phone' => ['required', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:1000'],
            'photo' => ['required', 'image', 'max:5120'],
            'identity_document' => ['required', 'image', 'max:5120'],
            'identity_document_type' => ['required', Rule::in(['university_id', 'administrative_order'])],
            'identity_document_back' => [
                'required_if:identity_document_type,university_id',
                'image',
                'max:5120',
                'prohibited_unless:identity_document_type,university_id',
            ],
            'vehicle_type' => ['required', 'string', Rule::in(['car', 'taxi', 'truck'])],
            'vehicle_number' => ['required', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'color' => ['nullable', 'string', 'max:100'],
            'vehicle_registration_front' => ['required', 'image', 'max:5120'],
            'vehicle_registration_back' => ['required', 'image', 'max:5120'],
        ]);

        foreach ([
            'photo',
            'identity_document',
            'identity_document_back',
            'vehicle_registration_front',
            'vehicle_registration_back',
        ] as $imageField) {
            if ($request->hasFile($imageField)) {
                $data[$imageField] = $request->file($imageField)
                    ->store('badge-requests', 'public');
            }
        }

        $badgeRequest = BadgeRequestModel::create([
            ...$data,
            'public_id' => (string) Str::uuid(),
        ]);

        return response()->json([
            'message' => 'تم إرسال طلب البطاقة بنجاح.',
            'request' => $badgeRequest,
        ], 201);
    }

    public function index()
    {
        return response()->json(BadgeRequestModel::query()
            ->with('reviewer:id,name')
            ->orderByDesc('id')
            ->paginate(20));
    }

    public function pendingCount()
    {
        return response()->json([
            'count' => BadgeRequestModel::query()->where('status', 'pending')->count(),
        ]);
    }

    public function show(string $id)
    {
        return response()->json([
            'request' => BadgeRequestModel::query()
                ->with('reviewer:id,name')
                ->findOrFail($id),
        ]);
    }

    public function approve(Request $request, string $id)
    {
        $badgeRequest = DB::transaction(function () use ($request, $id) {
            $badgeRequest = BadgeRequestModel::query()->lockForUpdate()->findOrFail($id);
            abort_unless($badgeRequest->status === 'pending', 409, 'تمت معالجة هذا الطلب مسبقًا.');

            if ($badgeRequest->national_id && Driver::where('national_id', $badgeRequest->national_id)->exists()) {
                abort(422, 'رقم الهوية مسجل مسبقًا لسائق آخر.');
            }

            if (Vehicle::where('vehicle_number', $badgeRequest->vehicle_number)->exists()) {
                abort(422, 'رقم المركبة مسجل مسبقًا.');
            }

            $driver = Driver::create([
                'public_id' => (string) Str::uuid(),
                'full_name' => $badgeRequest->full_name,
                'job_title' => $badgeRequest->job_title,
                'person_type' => $badgeRequest->person_type,
                'national_id' => $badgeRequest->national_id,
                'birth_date' => $badgeRequest->birth_date,
                'phone' => $badgeRequest->phone,
                'address' => $badgeRequest->address,
                'photo' => $badgeRequest->photo,
                'identity_document' => $badgeRequest->identity_document,
                'identity_document_type' => $badgeRequest->identity_document_type,
                'identity_document_back' => $badgeRequest->identity_document_back,
                'created_by' => $request->user()->id,
            ]);

            $vehicle = Vehicle::create([
                'public_id' => (string) Str::uuid(),
                'vehicle_number' => $badgeRequest->vehicle_number,
                'vehicle_type' => $badgeRequest->vehicle_type,
                'model' => $badgeRequest->model,
                'year' => $badgeRequest->year,
                'color' => $badgeRequest->color,
                'registration_front' => $badgeRequest->vehicle_registration_front,
                'registration_back' => $badgeRequest->vehicle_registration_back,
                'driver_id' => $driver->id,
                'created_by' => $request->user()->id,
            ]);

            $issueDate = CarbonImmutable::today();
            $years = (int) (SystemSetting::query()->value('badge_validity_years') ?: 1);
            $badge = Badge::create([
                'public_id' => (string) Str::uuid(),
                'badge_number' => 'PENDING-' . (string) Str::uuid(),
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle->id,
                'driver_name' => $driver->full_name,
                'job_title' => $driver->job_title,
                'person_type' => $driver->person_type,
                'driver_photo' => $driver->photo,
                'national_id' => $driver->national_id,
                'vehicle_type' => $vehicle->vehicle_type,
                'vehicle_number' => $vehicle->vehicle_number,
                'vehicle_model' => $vehicle->model,
                'vehicle_color' => $vehicle->color,
                'issue_date' => $issueDate->toDateString(),
                'expiry_date' => $issueDate->addYears($years)->toDateString(),
                'status' => 'Active',
                'created_by' => $request->user()->id,
            ]);
            $badge->badge_number = sprintf('DRV-%s-%05d', $issueDate->format('Y'), $badge->id);
            $badge->save();

            $badgeRequest->update([
                'status' => 'approved',
                'reviewed_by' => $request->user()->id,
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle->id,
                'badge_id' => $badge->id,
            ]);

            return $badgeRequest->fresh()->load(['reviewer:id,name', 'driver', 'vehicle', 'badge']);
        });

        return response()->json([
            'message' => 'تمت الموافقة وإصدار البطاقة بنجاح.',
            'request' => $badgeRequest,
        ]);
    }

    public function destroy(string $id)
    {
        $badgeRequest = BadgeRequestModel::query()->findOrFail($id);

        if ($badgeRequest->status === 'pending') {
            foreach ([
                'photo',
                'identity_document',
                'identity_document_back',
                'vehicle_registration_front',
                'vehicle_registration_back',
            ] as $imageField) {
                if ($badgeRequest->{$imageField}) {
                    Storage::disk('public')->delete($badgeRequest->{$imageField});
                }
            }
        }

        $badgeRequest->delete();

        return response()->json(['message' => 'تم حذف الطلب.']);
    }
}
