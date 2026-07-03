<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $fillable = [
        'name', 'contact_person', 'email', 'phone', 'address', 'city', 'ice', 'status', 'notes',
    ];

    public function chantiers(): HasMany
    {
        return $this->hasMany(Chantier::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(ClientInvoice::class);
    }
}
