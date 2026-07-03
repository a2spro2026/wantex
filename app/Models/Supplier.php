<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    protected $fillable = [
        'name', 'contact_person', 'email', 'phone', 'address', 'city', 'ice', 'payment_terms', 'status', 'notes',
    ];

    public function invoices(): HasMany
    {
        return $this->hasMany(SupplierInvoice::class);
    }
}
