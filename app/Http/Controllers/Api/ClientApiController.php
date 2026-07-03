<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientApiController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Client::when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
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
            'status' => 'in:actif,inactif',
        ]);

        return response()->json(Client::create($validated), 201);
    }

    public function show(Client $client)
    {
        return response()->json($client->load(['chantiers', 'invoices']));
    }

    public function update(Request $request, Client $client)
    {
        $client->update($request->validate([
            'name' => 'sometimes|string|max:255',
            'contact_person' => 'nullable|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'ice' => 'nullable|string',
            'status' => 'in:actif,inactif',
        ]));

        return response()->json($client);
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return response()->json(['message' => 'Client supprimé']);
    }
}
