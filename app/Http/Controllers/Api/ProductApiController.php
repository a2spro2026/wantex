<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductApiController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Product::with('category')
                ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('reference', 'like', "%{$s}%"))
                ->when($request->alert === 'low', fn ($q) => $q->whereColumn('quantity_in_stock', '<=', 'min_stock_alert'))
                ->when($request->alert === 'out', fn ($q) => $q->where('quantity_in_stock', '<=', 0))
                ->latest()->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'reference' => 'required|string|unique:products',
            'category_id' => 'nullable|exists:product_categories,id',
            'brand' => 'nullable|string',
            'unit' => 'required|string',
            'quantity_in_stock' => 'numeric|min:0',
            'min_stock_alert' => 'numeric|min:0',
            'unit_price' => 'numeric|min:0',
            'purchase_price' => 'numeric|min:0',
            'location' => 'nullable|string',
        ]);

        return response()->json(Product::create($validated), 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['category', 'stockMovements']));
    }

    public function update(Request $request, Product $product)
    {
        $product->update($request->validate([
            'name' => 'sometimes|string',
            'reference' => 'sometimes|string|unique:products,reference,'.$product->id,
            'brand' => 'nullable|string',
            'quantity_in_stock' => 'numeric|min:0',
            'min_stock_alert' => 'numeric|min:0',
            'unit_price' => 'numeric|min:0',
            'purchase_price' => 'numeric|min:0',
            'location' => 'nullable|string',
            'status' => 'in:actif,inactif',
        ]));

        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Produit supprimé']);
    }
}
