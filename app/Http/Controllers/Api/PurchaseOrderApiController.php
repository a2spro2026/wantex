<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderApiController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'items'])
            ->when($request->date_from, fn ($q, $d) => $q->whereDate('order_date', '>=', $d))
            ->when($request->date_to, fn ($q, $d) => $q->whereDate('order_date', '<=', $d))
            ->when($request->supplier_id, fn ($q, $id) => $q->where('supplier_id', $id))
            ->when($request->destination, fn ($q, $d) => $q->where('destination', $d))
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('reference', 'like', "%{$s}%")
                    ->orWhere('designation', 'like', "%{$s}%");
            }))
            ->latest('order_date');

        if ($request->boolean('all')) {
            return response()->json([
                'data' => $query->get()->map(fn ($o) => $this->formatOrder($o)),
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
            $subtotal = $this->syncItemsData($validated['items']);
            $manualRef = trim($validated['reference'] ?? '');

            $order = PurchaseOrder::create([
                'supplier_id' => $validated['supplier_id'],
                'order_date' => $validated['order_date'] ?? now()->toDateString(),
                'reglement' => $validated['reglement'] ?? null,
                'echeance' => $validated['echeance'] ?? null,
                'city' => $validated['city'] ?? null,
                'address' => $validated['address'] ?? null,
                'chantier_type' => $validated['chantier_type'] ?? null,
                'destination' => $validated['destination'] ?? null,
                'reference' => $manualRef ?: 'BA-PENDING',
                'subtotal' => $subtotal,
                'total_ht' => $subtotal,
                'tva' => 0,
                'total_ttc' => $subtotal,
                'status' => 'en_attente',
                'user_id' => $request->user()->id,
                ...$this->legacyFieldsFromItems($validated['items']),
            ]);

            if (! $manualRef) {
                $order->update(['reference' => $this->referenceFor($order->id)]);
            }
            $this->persistItems($order, $validated['items']);
            $this->syncProductsFromItems($validated['items']);

            return $order;
        });

        return response()->json($this->formatOrder($order->fresh(['supplier', 'items'])), 201);
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return response()->json($this->formatOrder($purchaseOrder->load(['supplier', 'items'])));
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $this->validated($request, true, $purchaseOrder->id);
        $subtotal = $this->syncItemsData($validated['items']);
        $legacy = $this->legacyFieldsFromItems($validated['items']);

        $purchaseOrder->update([
            'supplier_id' => $validated['supplier_id'],
            'order_date' => $validated['order_date'],
            'reference' => $validated['reference'] ?? $purchaseOrder->reference,
            'reglement' => $validated['reglement'] ?? null,
            'echeance' => $validated['echeance'] ?? null,
            'city' => $validated['city'] ?? null,
            'address' => $validated['address'] ?? null,
            'chantier_type' => $validated['chantier_type'] ?? null,
            'destination' => $validated['destination'] ?? null,
            'subtotal' => $subtotal,
            'total_ht' => $subtotal,
            'tva' => 0,
            'total_ttc' => $subtotal,
            ...$legacy,
        ]);

        $this->persistItems($purchaseOrder, $validated['items']);
        $this->syncProductsFromItems($validated['items']);

        return response()->json($this->formatOrder($purchaseOrder->fresh(['supplier', 'items'])));
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

    private function validated(Request $request, bool $partial = false, ?int $ignoreId = null): array
    {
        $request->merge([
            'destination' => $request->input('destination') ?: null,
            'reglement' => $request->input('reglement') ?: null,
            'echeance' => $request->input('echeance') ?: null,
        ]);

        $referenceRule = 'nullable|string|max:50';
        if ($ignoreId) {
            $referenceRule .= '|unique:purchase_orders,reference,'.$ignoreId;
        } elseif ($request->filled('reference')) {
            $referenceRule .= '|unique:purchase_orders,reference';
        }

        return $request->validate([
            'reference' => $referenceRule,
            'supplier_id' => ($partial ? 'sometimes' : 'required').'|exists:suppliers,id',
            'order_date' => ($partial ? 'sometimes' : 'required').'|date',
            'destination' => 'nullable|in:Depot,Entrepot',
            'reglement' => 'nullable|in:Esp,Chq,Eff,Vir,Vers',
            'echeance' => 'nullable|string|max:50',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'chantier_type' => 'nullable|in:Public,Privé',
            'items' => ($partial ? 'sometimes' : 'required').'|array|min:1',
            'items.*.article_ref' => 'nullable|string|max:100',
            'items.*.designation' => 'required|string|max:500',
            'items.*.unit' => 'nullable|string|max:20',
            'items.*.quantity' => 'nullable|numeric|min:0.001',
            'items.*.unit_price' => 'nullable|numeric|min:0',
        ]);
    }

    private function syncItemsData(array $items): float
    {
        $total = 0;

        foreach ($items as $row) {
            $qty = (float) ($row['quantity'] ?? 1);
            $price = (float) ($row['unit_price'] ?? 0);
            $total += round($qty * $price, 2);
        }

        return round($total, 2);
    }

    private function persistItems(PurchaseOrder $order, array $items): void
    {
        $order->items()->delete();

        foreach ($items as $row) {
            $qty = (float) ($row['quantity'] ?? 1);
            $price = (float) ($row['unit_price'] ?? 0);
            $lineTotal = round($qty * $price, 2);

            $order->items()->create([
                'product_id' => $this->resolveProductId($row),
                'article_ref' => $row['article_ref'] ?? null,
                'description' => $row['designation'],
                'unit' => $row['unit'] ?? null,
                'quantity' => $qty,
                'unit_price' => $price,
                'tva_rate' => 0,
                'total' => $lineTotal,
            ]);
        }
    }

    private function resolveProductId(array $row): ?int
    {
        $designation = trim($row['designation'] ?? '');
        $articleRef = trim($row['article_ref'] ?? '') ?: null;

        if ($articleRef) {
            $product = Product::query()
                ->where('article_id', $articleRef)
                ->orWhere('reference', $articleRef)
                ->first();

            if ($product) {
                return $product->id;
            }
        }

        if ($designation) {
            $product = Product::where('name', $designation)->first();

            if ($product) {
                return $product->id;
            }
        }

        return null;
    }

    private function legacyFieldsFromItems(array $items): array
    {
        $first = $items[0] ?? [];
        $qty = (float) ($first['quantity'] ?? 1);
        $price = (float) ($first['unit_price'] ?? 0);

        return [
            'article_ref' => $first['article_ref'] ?? null,
            'designation' => $first['designation'] ?? null,
            'unit' => $first['unit'] ?? null,
            'quantity' => $qty,
            'unit_price' => $price,
        ];
    }

    private function nextReference(): string
    {
        return $this->referenceFor((PurchaseOrder::max('id') ?? 0) + 1);
    }

    private function referenceFor(int $id): string
    {
        return 'BA-'.str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }

    private function formatOrder(PurchaseOrder $order): array
    {
        $order->loadMissing('supplier', 'items.product');

        $items = $order->items->map(fn ($item) => [
            'id' => $item->id,
            'article_ref' => $item->article_ref,
            'designation' => $item->description,
            'famille' => $item->product?->famille,
            'unit' => $item->unit,
            'quantity' => (float) $item->quantity,
            'unit_price' => round((float) $item->unit_price, 2),
            'subtotal' => round((float) $item->total, 2),
        ])->values()->all();

        if (count($items) === 0 && $order->designation) {
            $items = [[
                'id' => null,
                'article_ref' => $order->article_ref,
                'designation' => $order->designation,
                'famille' => null,
                'unit' => $order->unit,
                'quantity' => (float) $order->quantity,
                'unit_price' => round((float) $order->unit_price, 2),
                'subtotal' => round((float) $order->subtotal, 2),
            ]];
        }

        $subtotal = round((float) $order->subtotal, 2);

        return [
            'id' => $order->id,
            'reference' => $order->reference,
            'order_date' => $order->order_date?->format('d/m/Y'),
            'order_date_raw' => $order->order_date?->format('Y-m-d'),
            'supplier_id' => $order->supplier_id,
            'supplier_code' => $order->supplier?->code,
            'fournisseur' => $order->supplier?->name,
            'items' => $items,
            'items_count' => count($items),
            'designation' => $this->designationSummary($items),
            'article_ref' => $items[0]['article_ref'] ?? $order->article_ref,
            'unit' => $items[0]['unit'] ?? $order->unit,
            'quantity' => $items[0]['quantity'] ?? (float) $order->quantity,
            'unit_price' => $items[0]['unit_price'] ?? round((float) $order->unit_price, 2),
            'subtotal' => $subtotal,
            'montant' => round((float) $order->total_ttc, 2),
            'reglement' => $order->reglement,
            'echeance' => $order->echeance,
            'city' => $order->city,
            'address' => $order->address,
            'chantier_type' => $order->chantier_type,
            'destination' => $order->destination,
            'status' => $order->status,
        ];
    }

    private function designationSummary(array $items): string
    {
        if (count($items) === 0) {
            return '—';
        }

        if (count($items) === 1) {
            return $items[0]['designation'] ?: '—';
        }

        $first = $items[0]['designation'] ?: 'Article';

        return $first.' (+'.(count($items) - 1).' ligne'.(count($items) > 2 ? 's' : '').')';
    }

    private function syncProductsFromItems(array $items): void
    {
        foreach ($items as $row) {
            $designation = trim($row['designation'] ?? '');
            if ($designation === '') {
                continue;
            }

            $articleRef = trim($row['article_ref'] ?? '') ?: null;
            $unit = trim($row['unit'] ?? '') ?: null;
            $unitPrice = (float) ($row['unit_price'] ?? 0);

            $product = null;
            if ($articleRef) {
                $product = Product::query()
                    ->where('article_id', $articleRef)
                    ->orWhere('reference', $articleRef)
                    ->first();
            }

            if (! $product) {
                $product = Product::where('name', $designation)->first();
            }

            if ($product) {
                $updates = [];
                if ($articleRef && ! $product->article_id) {
                    $updates['article_id'] = $articleRef;
                }
                if ($unit) {
                    $updates['unit'] = $unit;
                }
                if ($unitPrice > 0) {
                    $updates['purchase_price'] = $unitPrice;
                    $updates['unit_price'] = $unitPrice;
                }
                if ($updates !== []) {
                    $product->update($updates);
                }

                continue;
            }

            $product = Product::create([
                'name' => $designation,
                'article_id' => $articleRef,
                'unit' => $unit,
                'purchase_price' => $unitPrice,
                'unit_price' => $unitPrice,
                'quantity_in_stock' => 0,
                'initial_stock' => 0,
                'status' => 'actif',
                'etat' => 'Rupture',
                'reference' => 'Réf-PENDING',
            ]);

            $product->update([
                'reference' => 'Réf-'.str_pad((string) $product->id, 4, '0', STR_PAD_LEFT),
            ]);
        }
    }
}
