<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductFamily extends Model
{
    protected $fillable = [
        'reference',
        'famille',
        'sous_famille',
    ];
}
