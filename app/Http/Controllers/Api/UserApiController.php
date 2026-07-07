<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserApiController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeAccess($request);

        $users = User::with('role')->orderBy('sequence')->orderBy('id')->get();

        return response()->json([
            'data' => $users->map(fn (User $user) => $this->format($user))->values(),
            'meta' => [
                'total' => $users->count(),
                'next_id' => User::nextSequence(),
                'email_domain' => '@wantex.ma',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAccess($request);

        $validated = $this->validated($request);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'] ?? $this->defaultRoleId(),
            'is_active' => $validated['is_active'] ?? true,
            'access_rights' => $this->normalizeAccessRights($validated['access_rights'] ?? []),
            'sequence' => User::nextSequence(),
        ]);

        return response()->json($this->format($user->fresh(['role'])), 201);
    }

    public function show(Request $request, User $user)
    {
        $this->authorizeAccess($request);

        return response()->json($this->format($user));
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeAccess($request);

        $validated = $this->validated($request, $user->id);

        $accessRights = $this->normalizeAccessRights($validated['access_rights'] ?? []);
        if ($user->id === $request->user()->id) {
            $accessRights = $this->normalizeAccessRights([
                ...$accessRights,
                'configuration.utilisateurs.view',
                'utilisateurs.view',
            ]);
        }

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'] ?? $user->role_id ?? $this->defaultRoleId(),
            'is_active' => $validated['is_active'] ?? true,
            'access_rights' => $accessRights,
        ];

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return response()->json($this->format($user->fresh(['role'])));
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorizeAccess($request);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 422);
        }

        $user->delete();

        User::resequence();

        return response()->json(['message' => 'Utilisateur supprimé']);
    }

    private function authorizeAccess(Request $request): void
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return;
        }

        if ($user->hasPermission('utilisateurs.view') || $user->hasPermission('configuration.utilisateurs.view')) {
            return;
        }

        abort(403, 'Accès refusé');
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $emailRule = Rule::unique('users', 'email');
        if ($ignoreId) {
            $emailRule = $emailRule->ignore($ignoreId);
        }

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', 'ends_with:@wantex.ma', $emailRule],
            'password' => [$ignoreId ? 'nullable' : 'required', 'string', Password::min(8)],
            'name' => 'nullable|string|max:255',
            'role_id' => 'nullable|exists:roles,id',
            'is_active' => 'boolean',
            'access_rights' => 'nullable|array',
            'access_rights.*' => 'string|max:120',
        ], [
            'email.ends_with' => 'L\'identifiant doit se terminer par @wantex.ma',
        ]);

        $validated['email'] = strtolower(trim($validated['email']));
        $validated['name'] = trim($validated['name'] ?? '') ?: $this->nameFromEmail($validated['email']);
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['access_rights'] = $this->normalizeAccessRights($validated['access_rights'] ?? []);

        return $validated;
    }

    private function normalizeAccessRights(array $rights): array
    {
        $normalized = [];

        foreach ($rights as $right) {
            if (! is_string($right) || trim($right) === '') {
                continue;
            }

            $right = trim($right);
            $normalized[] = $right;

            $parts = explode('.', $right);
            if (count($parts) !== 3) {
                continue;
            }

            [$section, $module, $action] = $parts;
            $normalized[] = "{$section}.{$action}";

            if ($section === 'configuration') {
                $normalized[] = "{$module}.{$action}";
            }
        }

        return array_values(array_unique($normalized));
    }

    private function nameFromEmail(string $email): string
    {
        $local = explode('@', $email)[0] ?? 'Utilisateur';

        return ucfirst(str_replace(['.', '_', '-'], ' ', $local));
    }

    private function defaultRoleId(): int
    {
        return Role::where('slug', 'employe')->value('id')
            ?? Role::query()->value('id');
    }

    private function format(User $user): array
    {
        $email = $user->email ?? '';
        $local = str_ends_with($email, '@wantex.ma')
            ? substr($email, 0, -strlen('@wantex.ma'))
            : explode('@', $email)[0];

        $number = $user->sequence ?? $user->id;

        return [
            'id' => $user->id,
            'sequence' => $number,
            'display_id' => 'USR-'.str_pad((string) $number, 4, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $email,
            'email_local' => $local,
            'is_active' => (bool) $user->is_active,
            'access_rights' => $user->access_rights ?? [],
            'role' => $user->role?->only(['id', 'name', 'slug']),
            'created_at' => $user->created_at?->format('d/m/Y'),
        ];
    }
}
