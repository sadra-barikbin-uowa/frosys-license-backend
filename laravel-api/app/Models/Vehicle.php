<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    protected $fillable = [
        'public_id',
        'vehicle_number',
        'vehicle_type',
        'model',
        'year',
        'color',
        'photo',
        'driver_id',
        'created_by',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function badges(): HasMany
    {
        return $this->hasMany(Badge::class);
    }
}