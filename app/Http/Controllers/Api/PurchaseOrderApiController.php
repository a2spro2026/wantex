<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderApiController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier'])
            ->when($request->search, fn ($q, $s) => $q->where('reference', 'like', "%{$s}%")
                ->orWhere('designation', 'like', "%{$s}%"))
            ->latest('order_date');

        if ($request->boolean('all')) {
            $orders = $query->get()->map(fn ($o) => $this->formatOrder($o));

            return response()->json([
                'data' => $orders,
                'meta' => [
                    'next_ref' => $this->nextReference(),
                    'date' => now()->format('d/m/Y'),
                ],
            ]);
        }

        return response()->json($query->paginate(15)->through(fn ($o) => $this->formatOrder($o)));
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $order = DB::transaction(function () use ($validated, $request) {
            $subtotal = (float) ($validated['subtotal'] ?? ($validated['unit_price'] * ($validated['quantity'] ?? 1)));

            $order = PurchaseOrder::create([
                ...$validated,
                'reference' => 'BA-PENDING',
                'subtotal' => $subtotal,
                'total_ht' => $subtotal,
                'tva' => 0,
                'total_ttc' => $subtotal,
                'status' => 'en_attente',
                'user_id' => $request->user()->id,
            ]);

            $order->update(['reference' => $this->referenceFor($order->id)]);

            $order->items()->create([
                'description' => $validated['designation'] ?? 'Bon d\'achat',
                'quantity' => $validated['quantity'] ?? 1,
                'unit_price' => $validated['unit_price'] ?? 0,
                'tva_rate' => 0,
                'total' => $subtotal,
            ]);

            return $order->fresh(['supplier']);
        });

        return response()->json($this->formatOrder($order), 201);
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return response()->json($this->formatOrder($purchaseOrder->load(['supplier', 'items'])));
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $this->validated($request, true);
        $subtotal = (float) ($validated['subtotal'] ?? ($validated['unit_price'] * ($validated['quantity'] ?? 1)));

        $purchaseOrder->update([
            ...$validated,
            'subtotal' => $subtotal,
            'total_ht' => $subtotal,
            'tva' => 0,
            'total_ttc' => $subtotal,
        ]);

        $item = $purchaseOrder->items()->first();
        if ($item) {
            $item->update([
                'description' => $validated['designation'] ?? $item->description,
                'quantity' => $validated['quantity'] ?? 1,
                'unit_price' => $validated['unit_price'] ?? 0,
                'total' => $subtotal,
            ]);
        }

        return response()->json($this->formatOrder($purchaseOrder->fresh(['supplier'])));
    }

    public function validateOrder(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->update(['status' => 'valide']);

        return response()->json($this->formatOrder($purchaseOrder));
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->delete();

        return response()->json(['message' => 'Bon d\'achat supprimé']);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $rules = [
            'supplier_id' => ($partial ? 'sometimes' : 'required').'|exists:suppliers,id',
            'order_date' => ($partial ? 'sometimes' : 'required').'|date',
            'designation' => 'nullable|string|max:255',
            'consistance' => 'nullable|in:F,M,F+M',
            'unit' => 'nullable|in:JEU,KG,KM,KM-UNIF,M,M²,M³,ML,T,U',
            'unit_price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|numeric|min:0.001',
            'subtotal' => 'nullable|numeric|min:0',
            'reglement' => 'nullable|in:Esp,Chq,Eff,Vir,Vers',
            'echeance' => 'nullable|in:Esp,A vue,30Jrs,45Jrs,60Jrs,75Jrs,90Jrs',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'chantier_type' => 'nullable|in:Public,Privé',
            'responsible_name' => 'nullable|string|max:255',
            'chantier_id' => 'nullable|exists:chantiers,id',
        ];

        return $request->validate($rules);
    }

    private function nextReference(): string
    {
        $next = (PurchaseOrder::max('id') ?? 0) + 1;

        return $this->referenceFor($next);
    }

    private function referenceFor(int $id): string
    {
        return 'BA-'.str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }

    private function formatOrder(PurchaseOrder $order): array
    {
        $order->loadMissing('supplier');

        return [
            'id' => $order->id,
            'reference' => $order->reference,
            'order_date' => $order->order_date?->format('d/m/Y'),
            'order_date_raw' => $order->order_date?->format('Y-m-d'),
            'supplier_id' => $order->supplier_id,
            'fournisseur' => $order->supplier?->name,
            'designation' => $order->designation,
            'consistance' => $order->consistance,
            'unit' => $order->unit,
            'unit_price' => round((float) $order->unit_price, 2),
            'quantity' => (float) $order->quantity,
            'subtotal' => round((float) $order->subtotal, 2),
            'montant' => round((float) $order->total_ttc, 2),
            'reglement' => $order->reglement,
            'echeance' => $order->echeance,
            'city' => $order->city,
            'address' => $order->address,
            'chantier_type' => $order->chantier_type,
            'responsible_name' => $order->responsible_name,
            'status' => $order->status,
        ];
    }
}
