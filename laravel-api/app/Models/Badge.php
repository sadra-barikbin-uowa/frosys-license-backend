<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Badge extends Model
{
    protected $fillable = [
        'public_id',
        'badge_number',
        'driver_id',
        'vehicle_id',
        'driver_name',
        'job_title',
        'person_type',
        'driver_photo',
        'national_id',
        'license_number',
        'vehicle_type',
        'vehicle_number',
        'vehicle_model',
        'vehicle_color',
        'issue_date',
        'expiry_date',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date:Y-m-d',
            'expiry_date' => 'date:Y-m-d',
        ];
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}