<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'phone',
        'is_active',
        'access_rights',
        'sequence',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'access_rights' => 'array',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    public function allPermissions(): array
    {
        $rolePerms = $this->role?->permissions?->pluck('slug')->all() ?? [];
        $custom = $this->access_rights ?? [];
        $permissions = array_values(array_unique(array_merge($rolePerms, $custom)));

        foreach ($permissions as $permission) {
            $parts = explode('.', $permission);
            if (count($parts) !== 3) {
                continue;
            }

            [$section, $module, $action] = $parts;
            $permissions[] = "{$section}.{$action}";

            if ($section === 'configuration') {
                $permissions[] = "{$module}.{$action}";
            }
        }

        return array_values(array_unique($permissions));
    }

    public function hasPermission(string $slug): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $permissions = $this->allPermissions();

        if (in_array($slug, $permissions, true)) {
            return true;
        }

        if (preg_match('/^([^.]+)\.view$/', $slug, $matches)) {
            $prefix = $matches[1].'.';
            foreach ($permissions as $permission) {
                if (str_starts_with($permission, $prefix) && str_ends_with($permission, '.view')) {
                    return true;
                }
            }
        }

        if (preg_match('/^([^.]+)\.([^.]+)$/', $slug, $matches)) {
            [, $module, $action] = $matches;
            foreach ($permissions as $permission) {
                if (str_ends_with($permission, ".{$module}.{$action}")) {
                    return true;
                }
            }
        }

        return false;
    }

    public function isAdmin(): bool
    {
        return $this->role?->slug === 'administrateur';
    }

    public static function resequence(): void
    {
        $seq = 0;
        static::query()->orderBy('id')->get(['id'])->each(function (User $user) use (&$seq) {
            $seq++;
            static::withoutTimestamps(fn () => static::whereKey($user->id)->update(['sequence' => $seq]));
        });
    }

    public static function nextSequence(): int
    {
        return (static::max('sequence') ?? 0) + 1;
    }
}
