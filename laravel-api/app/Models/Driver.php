<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Driver extends Model
{
    protected $fillable = [
        'public_id',
        'full_name',
        'job_title',
        'person_type',
        'national_id',
        'birth_date',
        'phone',
        'address',
        'license_number',
        'license_issue',
        'license_expiry',
        'photo',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
            'license_issue' => 'date:Y-m-d',
            'license_expiry' => 'date:Y-m-d',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function badges(): HasMany
    {
        return $this->hasMany(Badge::class);
    }
}