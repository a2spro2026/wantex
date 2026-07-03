<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderApiController extends Controller
{
    public function index()
    {
        return response()->json(
            PurchaseOrder::with(['supplier', 'chantier'])->latest('order_date')->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'chantier_id' => 'nullable|exists:chantiers,id',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tva_rate' => 'numeric|min:0',
        ]);

        $order = DB::transaction(function () use ($validated, $request) {
            $reference = 'BA-'.now()->format('Ymd').'-'.str_pad(PurchaseOrder::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);
            $totalHt = collect($validated['items'])->sum(fn ($i) => $i['quantity'] * $i['unit_price']);
            $tva = collect($validated['items'])->sum(fn ($i) => ($i['quantity'] * $i['unit_price']) * (($i['tva_rate'] ?? 20) / 100));

            $order = PurchaseOrder::create([
                'reference' => $reference,
                'order_date' => $validated['order_date'],
                'supplier_id' => $validated['supplier_id'],
                'chantier_id' => $validated['chantier_id'] ?? null,
                'total_ht' => $totalHt,
                'tva' => $tva,
                'total_ttc' => $totalHt + $tva,
                'status' => 'en_attente',
                'user_id' => $request->user()->id,
            ]);

            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $order->items()->create([
                    'product_id' => $item['product_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tva_rate' => $item['tva_rate'] ?? 20,
                    'total' => $lineTotal,
                ]);
            }

            return $order;
        });

        return response()->json($order->load(['supplier', 'items']), 201);
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return response()->json($purchaseOrder->load(['supplier', 'chantier', 'items.product']));
    }

    public function validateOrder(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->update(['status' => 'valide']);

        return response()->json($purchaseOrder);
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->delete();

        return response()->json(['message' => 'Bon d\'achat supprimé']);
    }
}
