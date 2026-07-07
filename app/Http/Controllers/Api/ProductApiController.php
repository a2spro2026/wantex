<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductApiController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('reference', 'like', "%{$s}%")
                    ->orWhere('article_id', 'like', "%{$s}%")
                    ->orWhere('famille', 'like', "%{$s}%");
            }))
            ->orderBy('id');

        if ($request->boolean('all')) {
            $products = $query->get();
            $purchaseStatsMap = $this->buildPurchaseStatsMap($products);
            $familles = Product::whereNotNull('famille')
                ->where('famille', '!=', '')
                ->distinct()
                ->orderBy('famille')
                ->pluck('famille')
                ->values();

            return response()->json([
                'data' => $products->map(function ($p) use ($purchaseStatsMap) {
                    $stats = $purchaseStatsMap[$p->id] ?? [
                        'purchase_qty' => 0.0,
                        'destinations' => ['Depot' => 0.0, 'Entrepot' => 0.0],
                    ];

                    return $this->formatProduct(
                        $p,
                        $stats['purchase_qty'],
                        $stats['destinations'],
                    );
                }),
                'meta' => [
                    'next_ref' => $this->nextReference(),
                    'familles' => $familles,
                ],
            ]);
        }

        return response()->json(
            $query->paginate(15)->through(fn ($p) => $this->formatProduct($p))
        );
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);
        $initialStock = (float) ($validated['initial_stock'] ?? 0);
        unset($validated['photo']);

        $product = DB::transaction(function () use ($request, $validated, $initialStock) {
            $product = Product::create([
                ...$validated,
                'reference' => 'Réf-PENDING',
                'quantity_in_stock' => $initialStock,
                'min_stock_alert' => $validated['min_stock_alert'] ?? 0,
                'etat' => $validated['etat'] ?? 'Rupture',
            ]);

            $product->update(['reference' => $this->referenceFor($product->id)]);

            if ($request->hasFile('photo')) {
                $product->update(['photo' => $this->storePhoto($request->file('photo'), $product->id)]);
            }

            return $product;
        });

        return response()->json($this->formatProduct($product), 201);
    }

    public function show(Product $product)
    {
        return response()->json($this->formatProduct($product));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $this->validated($request, $product->id);
        unset($validated['photo']);

        if (array_key_exists('initial_stock', $validated)) {
            $validated['quantity_in_stock'] = (float) $validated['initial_stock'];
        }

        unset($validated['reference']);

        $product->update($validated);

        if ($request->hasFile('photo')) {
            if ($product->photo) {
                Storage::disk('public')->delete($product->photo);
            }
            $product->update(['photo' => $this->storePhoto($request->file('photo'), $product->id)]);
        }

        return response()->json($this->formatProduct($product->fresh()));
    }

    public function destroy(Product $product)
    {
        if ($product->photo) {
            Storage::disk('public')->delete($product->photo);
        }

        $product->delete();

        return response()->json(['message' => 'Produit supprimé']);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $articleUnique = 'unique:products,article_id';
        if ($ignoreId) {
            $articleUnique .= ','.$ignoreId;
        }

        return $request->validate([
            'name' => 'required|string|max:500',
            'article_id' => 'nullable|string|max:50|'.$articleUnique,
            'consistance' => 'nullable|string|in:F,M,F+M',
            'unit' => 'nullable|string|max:20',
            'famille' => 'nullable|string|max:255',
            'initial_stock' => 'numeric|min:0',
            'min_stock_alert' => 'nullable|numeric|min:0',
            'status' => 'in:actif,inactif',
            'etat' => 'nullable|in:Dispo,Faible,Rupture',
            'photo' => 'nullable|image|max:5120',
        ]);
    }

    private function storePhoto($file, int $productId): string
    {
        $ext = $file->getClientOriginalExtension() ?: 'jpg';

        return $file->storeAs('products', "product-{$productId}.{$ext}", 'public');
    }

    private function nextReference(): string
    {
        return $this->referenceFor((Product::max('id') ?? 0) + 1);
    }

    private function referenceFor(int $id): string
    {
        return 'Réf-'.str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }

    private function formatProduct(Product $product, ?float $purchaseQty = null, ?array $destinations = null): array
    {
        if ($purchaseQty === null || $destinations === null) {
            $stats = $this->buildPurchaseStatsMap(collect([$product]))[$product->id] ?? [
                'purchase_qty' => 0.0,
                'destinations' => ['Depot' => 0.0, 'Entrepot' => 0.0],
            ];
            $purchaseQty = $stats['purchase_qty'];
            $destinations = $stats['destinations'];
        }

        $initialStock = (float) $product->initial_stock;
        $stockReel = $initialStock + $purchaseQty;
        $destinationMeta = $this->formatDestinationMeta($destinations);

        return [
            'id' => $product->id,
            'reference' => $product->reference,
            'article_id' => $product->article_id,
            'photo' => $product->photo,
            'photo_url' => $product->photo ? asset('storage/'.$product->photo) : null,
            'name' => $product->name,
            'designation' => $product->name,
            'consistance' => $product->consistance,
            'unit' => $product->unit,
            'famille' => $product->famille,
            'initial_stock' => $initialStock,
            'stock_initial' => $initialStock,
            'purchase_qty' => $purchaseQty,
            'stock_reel' => $stockReel,
            'destinations' => $destinations,
            'destination' => $destinationMeta['destination'],
            'destination_label' => $destinationMeta['label'],
            'quantity_in_stock' => (float) $product->quantity_in_stock,
            'purchase_price' => (float) ($product->purchase_price ?? 0),
            'unit_price' => (float) ($product->unit_price ?? 0),
            'min_stock_alert' => (float) $product->min_stock_alert,
            'status' => $product->status,
            'statut' => $product->status === 'actif' ? 'Actif' : 'Inactif',
            'etat' => $product->etatLabel(),
            'created_at' => $product->created_at?->format('d/m/Y'),
        ];
    }

    private function buildPurchaseStatsMap($products): array
    {
        $map = [];
        foreach ($products as $product) {
            $map[$product->id] = [
                'purchase_qty' => 0.0,
                'destinations' => ['Depot' => 0.0, 'Entrepot' => 0.0],
            ];
        }

        if ($products->isEmpty()) {
            return $map;
        }

        $items = PurchaseOrderItem::query()
            ->with(['order:id,destination'])
            ->get(['product_id', 'article_ref', 'description', 'quantity', 'purchase_order_id']);

        foreach ($items as $item) {
            $productId = $this->resolveProductIdForItem($item, $products);
            if (! $productId || ! isset($map[$productId])) {
                continue;
            }

            $qty = (float) $item->quantity;
            $map[$productId]['purchase_qty'] += $qty;

            $destination = $item->order?->destination;
            if ($destination === 'Depot' || $destination === 'Entrepot') {
                $map[$productId]['destinations'][$destination] += $qty;
            }
        }

        return $map;
    }

    private function resolveProductIdForItem(PurchaseOrderItem $item, $products): ?int
    {
        if ($item->product_id) {
            foreach ($products as $product) {
                if ($product->id === $item->product_id) {
                    return $product->id;
                }
            }
        }

        $articleRef = trim($item->article_ref ?? '');
        $description = trim($item->description ?? '');

        foreach ($products as $product) {
            if ($articleRef && ($articleRef === $product->article_id || $articleRef === $product->reference)) {
                return $product->id;
            }

            if ($description && $description === $product->name) {
                return $product->id;
            }
        }

        return null;
    }

    private function formatDestinationMeta(array $destinations): array
    {
        $depotQty = (float) ($destinations['Depot'] ?? 0);
        $entrepotQty = (float) ($destinations['Entrepot'] ?? 0);

        if ($depotQty <= 0 && $entrepotQty <= 0) {
            return ['destination' => null, 'label' => '—'];
        }

        $parts = [];
        if ($depotQty > 0) {
            $parts[] = 'Dépôt ('.rtrim(rtrim(number_format($depotQty, 3, '.', ' '), '0'), '.').')';
        }
        if ($entrepotQty > 0) {
            $parts[] = 'Entrepôt ('.rtrim(rtrim(number_format($entrepotQty, 3, '.', ' '), '0'), '.').')';
        }

        $destination = null;
        if ($depotQty > 0 && $entrepotQty <= 0) {
            $destination = 'Depot';
        } elseif ($entrepotQty > 0 && $depotQty <= 0) {
            $destination = 'Entrepot';
        } else {
            $destination = 'both';
        }

        return [
            'destination' => $destination,
            'label' => implode(' · ', $parts),
        ];
    }
}
