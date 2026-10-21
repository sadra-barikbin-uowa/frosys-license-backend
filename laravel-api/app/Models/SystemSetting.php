<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'system_name',
        'logo',
        'manager_signature',
        'manager_signature_color',
        'manager_signature_width',
        'badge_color',
        'contact_info',
        'badge_validity_years',
        'expiring_soon_days',
    ];
}
