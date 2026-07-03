<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierApiController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Supplier::withCount('invoices')
                ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
                ->latest()->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'ice' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'status' => 'in:actif,inactif',
        ]);

        return response()->json(Supplier::create($validated), 201);
    }

    public function show(Supplier $supplier)
    {
        return response()->json($supplier->load(['invoices']));
    }

    public function update(Request $request, Supplier $supplier)
    {
        $supplier->update($request->validate([
            'name' => 'sometimes|string|max:255',
            'contact_person' => 'nullable|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'status' => 'in:actif,inactif',
        ]));

        return response()->json($supplier);
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        return response()->json(['message' => 'Fournisseur supprimé']);
    }
}
