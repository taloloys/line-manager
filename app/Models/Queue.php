<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name',
        'queue_number',
        'status',
        'served_at',
        'student_id',
        'purpose',
        'email',
        'created_at'
    ];
    protected $casts = [
        'served_at' => 'datetime',
        'created_at' => 'datetime',
    ];
}
