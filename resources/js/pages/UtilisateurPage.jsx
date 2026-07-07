import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Check, ChevronDown, KeyRound, Pencil, Plus, RefreshCw, RotateCcw, Save, Shield, Trash2, UserPlus,
} from 'lucide-react';
import api from '../lib/api';
import {
    EMAIL_DOMAIN,
    allPermissionSlugs,
    buildPermissionMatrix,
    moduleActions,
    moduleSlugs,
    permissionSlug,
} from '../config/permissionsMatrix';

const matrix = buildPermissionMatrix();
const allSlugs = allPermissionSlugs();

const emptyForm = {
    email_local: '',
    password: '',
    is_active: true,
    access_rights: [],
};

const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-all min-w-0';

const readOnlyClass =
    'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-3 py-2 text-sm text-center cursor-not-allowed font-mono font-semibold';

const SECTION_THEME = {
    dashboard: { bar: 'bg-slate-500', chip: 'border-slate-300/60 bg-slate-50 dark:bg-slate-800/60', accent: 'text-slate-700 dark:text-slate-200' },
    fournisseurs: { bar: 'bg-orange-500', chip: 'border-orange-200/70 bg-orange-50/60 dark:bg-orange-950/20', accent: 'text-orange-700 dark:text-orange-300' },
    clients: { bar: 'bg-blue-500', chip: 'border-blue-200/70 bg-blue-50/60 dark:bg-blue-950/20', accent: 'text-blue-700 dark:text-blue-300' },
    stock: { bar: 'bg-emerald-500', chip: 'border-emerald-200/70 bg-emerald-50/60 dark:bg-emerald-950/20', accent: 'text-emerald-700 dark:text-emerald-300' },
    chantiers: { bar: 'bg-amber-500', chip: 'border-amber-200/70 bg-amber-50/60 dark:bg-amber-950/20', accent: 'text-amber-700 dark:text-amber-300' },
    personnel: { bar: 'bg-violet-500', chip: 'border-violet-200/70 bg-violet-50/60 dark:bg-violet-950/20', accent: 'text-violet-700 dark:text-violet-300' },
    monetaire: { bar: 'bg-cyan-500', chip: 'border-cyan-200/70 bg-cyan-50/60 dark:bg-cyan-950/20', accent: 'text-cyan-700 dark:text-cyan-300' },
    configuration: { bar: 'bg-slate-600', chip: 'border-slate-300/60 bg-slate-50 dark:bg-slate-800/60', accent: 'text-slate-700 dark:text-slate-200' },
};

const ACTION_STYLE = {
    view: 'data-[on=true]:bg-blue-500 data-[on=true]:border-blue-500 data-[on=true]:text-white',
    create: 'data-[on=true]:bg-emerald-500 data-[on=true]:border-emerald-500 data-[on=true]:text-white',
    edit: 'data-[on=true]:bg-amber-500 data-[on=true]:border-amber-500 data-[on=true]:text-white',
    import: 'data-[on=true]:bg-violet-500 data-[on=true]:border-violet-500 data-[on=true]:text-white',
    delete: 'data-[on=true]:bg-red-500 data-[on=true]:border-red-500 data-[on=true]:text-white',
    print: 'data-[on=true]:bg-slate-600 data-[on=true]:border-slate-600 data-[on=true]:text-white',
    export: 'data-[on=true]:bg-cyan-600 data-[on=true]:border-cyan-600 data-[on=true]:text-white',
};

function Field({ label, children, className = '' }) {
    return (
        <div className={className}>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                {label}
            </label>
            {children}
        </div>
    );
}

function ActionPill({ action, checked, onChange, title }) {
    return (
        <button
            type="button"
            data-on={checked}
            onClick={() => onChange(!checked)}
            title={title}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wide transition-all
                border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400
                hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm
                ${ACTION_STYLE[action.key] || ''}`}
        >
            <span className="w-3.5 text-center opacity-70">{action.short}</span>
            <span className="hidden sm:inline">{action.label}</span>
        </button>
    );
}

function PermissionsMatrix({ rights, onChange }) {
    const [openSections, setOpenSections] = useState(() => new Set(['dashboard', 'fournisseurs']));

    const set = useCallback((slug, value) => {
        onChange((prev) => {
            const next = new Set(prev);
            if (value) next.add(slug);
            else next.delete(slug);
            return [...next];
        });
    }, [onChange]);

    const toggleModule = useCallback((sectionId, moduleKey, value) => {
        const slugs = moduleSlugs(sectionId, moduleKey);
        onChange((prev) => {
            const next = new Set(prev);
            slugs.forEach((slug) => (value ? next.add(slug) : next.delete(slug)));
            return [...next];
        });
    }, [onChange]);

    const toggleSection = useCallback((section, value) => {
        const slugs = section.modules.flatMap((m) => moduleSlugs(section.id, m.key));
        onChange((prev) => {
            const next = new Set(prev);
            slugs.forEach((slug) => (value ? next.add(slug) : next.delete(slug)));
            return [...next];
        });
    }, [onChange]);

    const toggleAll = useCallback((value) => {
        onChange(value ? [...allSlugs] : []);
    }, [onChange]);

    const rightsSet = useMemo(() => new Set(rights), [rights]);
    const total = allSlugs.length;
    const checkedCount = rights.filter((s) => allSlugs.includes(s)).length;
    const progress = total ? Math.round((checkedCount / total) * 100) : 0;

    const toggleSectionOpen = (sectionId) => {
        setOpenSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    };

    return (
        <div className="h-full min-h-0 rounded-xl border border-slate-200/80 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900/50 shadow-sm flex flex-col">
            {/* En-tête */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-white min-w-0">
                        <div className="p-1.5 rounded-lg bg-teal-500/20">
                            <Shield className="w-4 h-4 text-teal-300" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-wide">Autorisations</h4>
                            <p className="text-[10px] text-slate-400">{checkedCount} sur {total} droits actifs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10">
                            <div className="w-20 h-1.5 rounded-full bg-white/20 overflow-hidden">
                                <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-white tabular-nums">{progress}%</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => toggleAll(checkedCount < total)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                        >
                            {checkedCount < total ? 'Tout cocher' : 'Tout décocher'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Sections accordéon */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {matrix.map((section) => {
                    const theme = SECTION_THEME[section.id] || SECTION_THEME.configuration;
                    const sectionSlugs = section.modules.flatMap((m) => moduleSlugs(section.id, m.key));
                    const sectionChecked = sectionSlugs.filter((s) => rightsSet.has(s)).length;
                    const sectionTotal = sectionSlugs.length;
                    const sectionFull = sectionChecked === sectionTotal && sectionTotal > 0;
                    const isOpen = openSections.has(section.id);

                    return (
                        <div key={section.id} className="bg-white dark:bg-slate-900/30">
                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <button
                                    type="button"
                                    onClick={() => toggleSectionOpen(section.id)}
                                    className="flex flex-1 items-center gap-3 min-w-0 text-left"
                                >
                                    <span className={`w-1 self-stretch rounded-full shrink-0 ${theme.bar}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs font-bold uppercase tracking-wide ${theme.accent}`}>
                                                {section.label}
                                            </span>
                                            <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                                                {sectionChecked}/{sectionTotal}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden max-w-[200px]">
                                            <div
                                                className={`h-full rounded-full transition-all ${theme.bar}`}
                                                style={{ width: sectionTotal ? `${(sectionChecked / sectionTotal) * 100}%` : '0%' }}
                                            />
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section, !sectionFull)}
                                    className="shrink-0 px-2 py-1 rounded-md text-[10px] font-semibold border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title={sectionFull ? 'Décocher toute la section' : 'Cocher toute la section'}
                                >
                                    {sectionFull ? 'Aucun' : 'Tous'}
                                </button>
                            </div>

                            {isOpen && (
                                <div className="px-3 pb-3 space-y-2">
                                    {section.modules.map((module) => {
                                        const slugs = moduleSlugs(section.id, module.key);
                                        const actions = moduleActions(module);
                                        const rowChecked = slugs.every((s) => rightsSet.has(s));
                                        const rowPartial = !rowChecked && slugs.some((s) => rightsSet.has(s));

                                        return (
                                            <div
                                                key={`${section.id}-${module.key}`}
                                                className={`rounded-xl border p-3 transition-all ${theme.chip} ${
                                                    rowChecked ? 'ring-1 ring-teal-500/30' : rowPartial ? 'ring-1 ring-amber-400/30' : ''
                                                }`}
                                            >
                                                <div className="space-y-2">
                                                    <p className={`text-xs font-bold ${theme.accent}`}>
                                                        {module.label}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {actions.map((action) => {
                                                            const slug = permissionSlug(section.id, module.key, action.key);
                                                            return (
                                                                <ActionPill
                                                                    key={slug}
                                                                    action={action}
                                                                    checked={rightsSet.has(slug)}
                                                                    onChange={(v) => set(slug, v)}
                                                                    title={`${module.label} — ${action.label}`}
                                                                />
                                                            );
                                                        })}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleModule(section.id, module.key, !rowChecked)}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                                                                rowChecked
                                                                    ? 'border-teal-500 bg-teal-500 text-white'
                                                                    : rowPartial
                                                                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                                                                        : 'border-slate-200 dark:border-slate-600 text-slate-400 hover:border-slate-300'
                                                            }`}
                                                            title={rowChecked ? 'Tout décocher' : 'Tout cocher'}
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            Tout
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function UtilisateurPage() {
    const [form, setForm] = useState(emptyForm);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ next_id: 1 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [showPermissions, setShowPermissions] = useState(false);
    const [formExpanded, setFormExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('infos'); // 'infos' | 'acces'

    const upsertRow = useCallback((user) => {
        if (!user?.id) return;
        setRows((prev) => {
            const next = prev.filter((r) => r.id !== user.id);
            return [...next, user].sort((a, b) => (a.sequence ?? a.id) - (b.sequence ?? b.id));
        });
    }, []);

    const load = useCallback(() => {
        setLoading(true);
        api.get('/users')
            .then((res) => {
                const list = Array.isArray(res.data?.data)
                    ? res.data.data
                    : (Array.isArray(res.data) ? res.data : []);
                setRows(list);
                setMeta(res.data?.meta ?? { next_id: list.length + 1, total: list.length });
                setError('');
            })
            .catch((err) => {
                setRows([]);
                const msg = err.response?.status === 403
                    ? 'Accès refusé : vous n’avez pas le droit de voir la liste des utilisateurs.'
                    : 'Impossible de charger la liste des utilisateurs.';
                setError(msg);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const editingRow = editingId ? rows.find((r) => r.id === editingId) : null;
    const displayId = editingRow
        ? editingRow.display_id ?? `USR-${String(editingRow.sequence ?? editingId).padStart(4, '0')}`
        : `USR-${String(meta.next_id ?? 1).padStart(4, '0')}`;

    const fullEmail = `${form.email_local.trim().toLowerCase()}${EMAIL_DOMAIN}`;

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowPermissions(false);
        setFormExpanded(false);
        setError('');
    };

    const handleNew = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowPermissions(false);
        setFormExpanded(true);
        setActiveTab('infos');
        setError('');
    };

    const fillForm = (row) => {
        setForm({
            email_local: row.email_local || '',
            password: '',
            is_active: row.is_active !== false,
            access_rights: row.access_rights ?? [],
        });
        setEditingId(row.id);
        setShowPermissions(true);
        setFormExpanded(true);
        setActiveTab('infos');
        setError('');
        document.getElementById('user-form')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Supprimer l'utilisateur « ${row.email} » ?`)) return;
        try {
            await api.delete(`/users/${row.id}`);
            if (editingId === row.id) resetForm();
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Impossible de supprimer cet utilisateur');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.email_local.trim()) {
            setError('Saisissez l\'identifiant (partie avant @wantex.ma)');
            return;
        }

        if (!editingId && !form.password) {
            setError('Le mot de passe est obligatoire pour un nouvel utilisateur');
            return;
        }

        const payload = {
            email: fullEmail,
            is_active: form.is_active,
            access_rights: form.access_rights,
        };

        if (form.password) {
            payload.password = form.password;
        }

        setSaving(true);
        try {
            let saved;
            if (editingId) {
                const { data } = await api.put(`/users/${editingId}`, payload);
                saved = data;
            } else {
                const { data } = await api.post('/users', payload);
                saved = data;
            }
            upsertRow(saved);
            resetForm();
            setShowPermissions(false);
            await load();
        } catch (err) {
            const data = err.response?.data;
            const fieldErrors = data?.errors
                ? Object.values(data.errors).flat().join(' ')
                : '';
            setError(fieldErrors || data?.message || 'Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    const setRights = (updater) => {
        setForm((f) => ({
            ...f,
            access_rights: typeof updater === 'function' ? updater(f.access_rights) : updater,
        }));
    };

    return (
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 overflow-hidden">
            {/* Liste — panneau gauche */}
            <div className="flex-1 min-h-[360px] flex flex-col glass-card overflow-hidden shadow-card border border-slate-200/60 dark:border-slate-700/60">
                <div className="shrink-0 px-5 py-3 bg-gradient-to-r from-slate-600 to-slate-800 border-b border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide shrink-0">Liste des utilisateurs</h3>
                        {!loading && (
                            <span className="text-[11px] font-semibold text-white/80 bg-white/10 px-2 py-0.5 rounded-full tabular-nums">
                                {rows.length}{meta.total != null && meta.total !== rows.length ? ` / ${meta.total}` : ''} utilisateur{rows.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleNew}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Nouvel utilisateur
                        </button>
                        <button
                            type="button"
                            onClick={load}
                            disabled={loading}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                            title="Actualiser"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {error && !loading && (
                    <div className="shrink-0 mx-4 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800">
                        {error}
                    </div>
                )}

                <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full text-sm min-w-[720px]">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                {['ID', 'Identifiant', 'Droits', 'Statut', 'Créé le', 'Actions'].map((h) => (
                                    <th key={h} className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(6)].map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto max-w-[100px]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : rows.length ? (
                                rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${editingId === row.id ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}`}
                                    >
                                        <td className="px-4 py-3 text-center font-mono text-xs font-semibold text-brand-navy dark:text-teal-400">
                                            {row.display_id}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-800 dark:text-white font-medium">
                                            {row.email}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tabular-nums">
                                                {(row.access_rights?.length ?? 0)} droit{(row.access_rights?.length ?? 0) > 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${
                                                row.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                    : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {row.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 text-xs">
                                            {row.created_at || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button type="button" title="Modifier" onClick={() => fillForm(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button type="button" title="Supprimer" onClick={() => handleDelete(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                        Aucun utilisateur enregistré
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <form
                id="user-form"
                onSubmit={handleSubmit}
                className="shrink-0 flex flex-col glass-card shadow-card border border-slate-200/60 dark:border-slate-700/60 overflow-hidden lg:w-[520px] xl:w-[560px] min-h-[360px]"
            >
                <div className="shrink-0 px-5 py-3 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => setFormExpanded((v) => !v)}
                        className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wide"
                    >
                        <UserPlus className="w-4 h-4" />
                        {editingId ? 'Utilisateur — modification' : 'Utilisateur — création'}
                        <ChevronDown className={`w-4 h-4 transition-transform lg:hidden ${formExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleNew}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {editingId ? 'Nouveau' : 'Réinitialiser'}
                        </button>
                        {!editingId && (
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold transition-colors disabled:opacity-60">
                                <Plus className="w-3.5 h-3.5" />
                                {saving ? 'Création...' : 'Créer'}
                            </button>
                        )}
                        {editingId && (
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold transition-colors disabled:opacity-60">
                                <Save className="w-3.5 h-3.5" />
                                {saving ? 'Enregistrement...' : 'Mettre à jour'}
                            </button>
                        )}
                    </div>
                </div>

                <div className={`${formExpanded ? 'block' : 'hidden'} lg:block flex-1 min-h-0 flex flex-col`}>
                    {/* Tabs */}
                    <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/30">
                        {error && (
                            <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800">
                                {error}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('infos')}
                                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide border transition-colors ${
                                    activeTab === 'infos'
                                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                Informations
                            </button>
                            <button
                                type="button"
                                onClick={() => { setActiveTab('acces'); setShowPermissions(true); }}
                                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide border transition-colors ${
                                    activeTab === 'acces'
                                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                Accès & autorisations
                            </button>
                            <div className="ml-auto text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                                {editingId ? displayId : `Prochain ID: ${displayId}`}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        {activeTab === 'infos' && (
                            <div className="h-full overflow-y-auto p-4 lg:p-5 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                    <Field label="ID">
                                        <input type="text" readOnly value={displayId} className={readOnlyClass} />
                                    </Field>
                                    <Field label="Statut">
                                        <label className="flex items-center gap-2 h-[42px] px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.is_active}
                                                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                                                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/40"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-200">Compte actif</span>
                                        </label>
                                    </Field>
                                </div>

                                <Field label="Identifiant (e-mail @wantex.ma)">
                                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden focus-within:ring-2 focus-within:ring-brand-navy/30 focus-within:border-brand-navy bg-white dark:bg-slate-800">
                                        <input
                                            type="text"
                                            value={form.email_local}
                                            onChange={(e) => setForm((f) => ({ ...f, email_local: e.target.value.replace(/@/g, '').toLowerCase() }))}
                                            placeholder="prenom.nom"
                                            className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent outline-none text-slate-900 dark:text-white"
                                            autoComplete="off"
                                        />
                                        <span className="shrink-0 px-2.5 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border-l border-slate-200 dark:border-slate-600">
                                            {EMAIL_DOMAIN}
                                        </span>
                                    </div>
                                </Field>

                                <Field label={editingId ? 'Mot de passe (optionnel)' : 'Mot de passe'}>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <input
                                            type="password"
                                            value={form.password}
                                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                            placeholder={editingId ? 'Laisser vide pour ne pas changer' : 'Minimum 8 caractères'}
                                            className={`${inputClass} pl-9`}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </Field>

                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                        Étape suivante
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                        Passe à l’onglet <span className="font-semibold">Accès & autorisations</span> pour cocher les accès convenables.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => { setActiveTab('acces'); setShowPermissions(true); }}
                                        className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                                    >
                                        <Shield className="w-4 h-4" />
                                        Attribuer les accès
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'acces' && (
                            <div className="h-full flex flex-col min-h-0">
                                <div className="shrink-0 px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/20">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                        <Shield className="w-4 h-4 text-teal-600" />
                                        <span className="text-xs font-bold uppercase tracking-wide">Autorisations</span>
                                        <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                                            {(form.access_rights?.length ?? 0)} sélectionnées
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPermissions((v) => !v)}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        {showPermissions ? 'Masquer' : 'Afficher'}
                                    </button>
                                </div>

                                <div className="flex-1 min-h-0 overflow-hidden p-4 lg:p-5">
                                    {showPermissions ? (
                                        <div className="h-full min-h-0">
                                            <PermissionsMatrix rights={form.access_rights} onChange={setRights} />
                                        </div>
                                    ) : (
                                        <div className="h-full grid place-items-center text-slate-400 text-sm">
                                            Autorisations masquées
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky footer */}
                    <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {editingId ? 'Modification en cours' : 'Création en cours'}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
