@php $e = $employee ?? null; @endphp
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div><label class="block text-sm font-medium mb-1">Prénom *</label><input type="text" name="first_name" value="{{ old('first_name', $e?->first_name) }}" required class="w-full rounded-lg border-slate-300 text-sm"></div>
    <div><label class="block text-sm font-medium mb-1">Nom *</label><input type="text" name="last_name" value="{{ old('last_name', $e?->last_name) }}" required class="w-full rounded-lg border-slate-300 text-sm"></div>
    <div><label class="block text-sm font-medium mb-1">CIN</label><input type="text" name="cin" value="{{ old('cin', $e?->cin) }}" class="w-full rounded-lg border-slate-300 text-sm"></div>
    <div><label class="block text-sm font-medium mb-1">Poste *</label><input type="text" name="position" value="{{ old('position', $e?->position) }}" required class="w-full rounded-lg border-slate-300 text-sm"></div>
    <div><label class="block text-sm font-medium mb-1">Taux journalier</label><input type="number" step="0.01" name="daily_rate" value="{{ old('daily_rate', $e?->daily_rate ?? 0) }}" class="w-full rounded-lg border-slate-300 text-sm"></div>
    <div><label class="block text-sm font-medium mb-1">Salaire mensuel</label><input type="number" step="0.01" name="monthly_salary" value="{{ old('monthly_salary', $e?->monthly_salary ?? 0) }}" class="w-full rounded-lg border-slate-300 text-sm"></div>
    <div><label class="block text-sm font-medium mb-1">Date embauche</label><input type="date" name="hire_date" value="{{ old('hire_date', $e?->hire_date?->format('Y-m-d')) }}" class="w-full rounded-lg border-slate-300 text-sm"></div>
    <div><label class="block text-sm font-medium mb-1">Statut</label><select name="status" class="w-full rounded-lg border-slate-300 text-sm"><option value="actif" @selected(old('status', $e?->status)==='actif')>Actif</option><option value="inactif" @selected(old('status', $e?->status)==='inactif')>Inactif</option></select></div>
</div>
