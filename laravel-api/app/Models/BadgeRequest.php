<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BadgeRequest extends Model
{
    protected $fillable = [
        'public_id',
        'full_name',
        'job_title',
        'person_type',
        'birth_date',
        'phone',
        'address',
        'national_id',
        'photo',
        'identity_document',
        'identity_document_type',
        'identity_document_back',
        'vehicle_type',
        'vehicle_number',
        'model',
        'year',
        'color',
        'vehicle_registration_front',
        'vehicle_registration_back',
        'status',
        'reviewed_by',
        'driver_id',
        'vehicle_id',
        'badge_id',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
        ];
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function badge(): BelongsTo
    {
        return $this->belongsTo(Badge::class);
    }
}
