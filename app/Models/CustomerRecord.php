<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name',
        'student_id',
        'purpose',
        'email',
        'queue_number',
        'status',
        'served_at'
    ];

    protected $casts = [
        'served_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
