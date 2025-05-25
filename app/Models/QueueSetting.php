<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QueueSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'max_queue_size',
        'notification_sound',
        'auto_refresh_interval',
        'display_timeout',
        'privacy_mode'
    ];

    protected $casts = [
        'notification_sound' => 'boolean',
        'privacy_mode' => 'boolean'
    ];
}
