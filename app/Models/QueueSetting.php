<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QueueSetting extends Model
{
    use HasFactory;

    protected $fillable = ['max_queue_size']; // ✅ Allows updates
}
