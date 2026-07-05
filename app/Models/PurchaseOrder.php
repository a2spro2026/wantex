<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'reference', 'order_date', 'supplier_id', 'chantier_id',
        'designation', 'consistance', 'unit', 'unit_price', 'quantity', 'subtotal',
        'reglement', 'echeance', 'city', 'address', 'chantier_type', 'responsible_name',
        'total_ht', 'tva', 'total_ttc', 'status', 'notes', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'unit_price' => 'decimal:2',
            'quantity' => 'decimal:3',
            'subtotal' => 'decimal:2',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function chantier(): BelongsTo
    {
        return $this->belongsTo(Chantier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
