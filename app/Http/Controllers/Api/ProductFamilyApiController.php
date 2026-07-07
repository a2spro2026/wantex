<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductFamily;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductFamilyApiController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductFamily::query()
            ->when($request->search, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('famille', 'like', "%{$search}%")
                        ->orWhere('sous_famille', 'like', "%{$search}%")
                        ->orWhere('reference', 'like', "%{$search}%");
                });
            })
            ->orderBy('id');

        if ($request->boolean('all')) {
            return response()->json([
                'data' => $query->get()->map(fn ($row) => $this->format($row)),
                'meta' => ['next_ref' => $this->nextReference()],
            ]);
        }

        return response()->json(
            $query->paginate(15)->through(fn ($row) => $this->format($row))
        );
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $family = DB::transaction(function () use ($validated) {
            $family = ProductFamily::create([
                ...$validated,
                'reference' => 'Fam-PENDING',
            ]);

            $family->update(['reference' => $this->referenceFor($family->id)]);

            return $family;
        });

        return response()->json($this->format($family), 201);
    }

    public function show(ProductFamily $productFamily)
    {
        return response()->json($this->format($productFamily));
    }

    public function update(Request $request, ProductFamily $productFamily)
    {
        $validated = $this->validated($request, $productFamily->id);
        unset($validated['reference']);

        $productFamily->update($validated);

        return response()->json($this->format($productFamily->fresh()));
    }

    public function destroy(ProductFamily $productFamily)
    {
        $productFamily->delete();

        return response()->json(['message' => 'Famille produit supprimée']);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'famille' => 'required|string|max:255',
            'sous_famille' => 'nullable|string|max:255',
        ]);
    }

    private function nextReference(): string
    {
        return $this->referenceFor((ProductFamily::max('id') ?? 0) + 1);
    }

    private function referenceFor(int $id): string
    {
        return 'Fam-'.str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }

    private function format(ProductFamily $family): array
    {
        return [
            'id' => $family->id,
            'reference' => $family->reference,
            'famille' => $family->famille,
            'sous_famille' => $family->sous_famille,
            'created_at' => $family->created_at?->format('d/m/Y'),
        ];
    }
}
