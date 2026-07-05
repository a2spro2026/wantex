import { useCallback, useEffect, useState } from 'react';
import { Save, RotateCcw, Eye, Pencil, Trash2, Printer, FileText, X, RefreshCw } from 'lucide-react';
import api from '../lib/api';

const CONSISTANCE_OPTIONS = ['', 'F', 'M', 'F+M'];
const UNIT_OPTIONS = ['', 'JEU', 'KG', 'KM', 'KM-UNIF', 'M', 'M²', 'M³', 'ML', 'T', 'U'];
const STATUT_OPTIONS = [
    { value: 'actif', label: 'Actif' },
    { value: 'inactif', label: 'Inactif' },
];
const ETAT_OPTIONS = [
    { value: 'Dispo', label: 'Dispo' },
    { value: 'Faible', label: 'Faible' },
    { value: 'Rupture', label: 'Rupture' },
];

const emptyForm = {
    article_id: '',
    name: '',
    consistance: '',
    unit: '',
    famille: '',
    initial_stock: '',
    status: 'actif',
    etat: 'Rupture',
};

function Field({ label, children, className = '', compact = false }) {
    return (
        <div className={className}>
            <label className={`block font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 truncate text-center ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-1.5 py-1 text-[11px] text-center outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-all min-w-0';

const readOnlyClass =
    'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-1.5 py-1 text-[11px] text-center cursor-not-allowed min-w-0';

function etatSelectClass(value) {
    const base = 'w-full rounded-lg border px-1.5 py-1 text-[11px] text-center font-semibold outline-none focus:ring-2 transition-all min-w-0 cursor-pointer appearance-none';
    switch (value) {
        case 'Dispo':
            return `${base} bg-emerald-50 border-emerald-300 text-emerald-700 focus:ring-emerald-400/40 focus:border-emerald-400 dark:bg-emerald-900/35 dark:border-emerald-600 dark:text-emerald-300`;
        case 'Faible':
            return `${base} bg-amber-50 border-amber-300 text-amber-700 focus:ring-amber-400/40 focus:border-amber-400 dark:bg-amber-900/35 dark:border-amber-600 dark:text-amber-300`;
        case 'Rupture':
            return `${base} bg-red-50 border-red-300 text-red-700 focus:ring-red-400/40 focus:border-red-400 dark:bg-red-900/35 dark:border-red-600 dark:text-red-300`;
        default:
            return inputClass;
    }
}

function EtatBadge({ value }) {
    const styles = {
        Dispo: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
        Faible: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
        Rupture: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };
    return (
        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${styles[value] || 'bg-slate-100 text-slate-600'}`}>
            {value || '—'}
        </span>
    );
}

function StatutBadge({ value }) {
    const actif = value === 'Actif' || value === 'actif';
    return (
        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${actif ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            {actif ? 'Actif' : 'Inactif'}
        </span>
    );
}

function buildFicheHtml(row) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Produit ${row.reference}</title>
<style>
body{font-family:Arial,sans-serif;padding:32px;color:#1e293b}
h1{color:#1e3a5f;font-size:22px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{border:1px solid #e2e8f0;padding:10px;font-size:13px;text-align:center}
th{background:#f8fafc;font-weight:600;width:160px}
.badge{background:#ecfdf5;color:#059669;padding:4px 10px;border-radius:999px;font-weight:700}
</style></head><body>
<h1>BATIXPERT — Fiche Produit</h1>
<table>
<tr><th>Réf</th><td><span class="badge">${row.reference}</span></td></tr>
<tr><th>ID Article</th><td>${row.article_id || '—'}</td></tr>
<tr><th>Désignation</th><td>${row.name || '—'}</td></tr>
<tr><th>Consistance</th><td>${row.consistance || '—'}</td></tr>
<tr><th>Unité</th><td>${row.unit || '—'}</td></tr>
<tr><th>Famille</th><td>${row.famille || '—'}</td></tr>
<tr><th>Stock Initial</th><td>${row.initial_stock ?? 0}</td></tr>
<tr><th>Statut</th><td>${row.statut || '—'}</td></tr>
<tr><th>État</th><td>${row.etat || '—'}</td></tr>
</table></body></html>`;
}

function openPrintable(row) {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(buildFicheHtml(row));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
}

function ActionBtn({ title, onClick, icon: Icon, color = 'slate' }) {
    const colors = {
        blue: 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400',
        amber: 'hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-400',
        red: 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400',
        slate: 'hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200',
        orange: 'hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/30 dark:hover:text-orange-400',
    };

    return (
        <button type="button" title={title} onClick={onClick} className={`p-1.5 rounded-lg text-slate-400 transition-colors ${colors[color]}`}>
            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
    );
}

function ViewModal({ row, onClose }) {
    if (!row) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700">
                    <div>
                        <p className="text-[10px] text-emerald-100 uppercase tracking-wider">Fiche Produit</p>
                        <p className="text-white font-bold font-mono">{row.reference}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-5 space-y-3 text-sm">
                    {[
                        ['ID Article', row.article_id],
                        ['Désignation', row.name],
                        ['Consistance', row.consistance],
                        ['Unité', row.unit],
                        ['Famille', row.famille],
                        ['Stock Initial', row.initial_stock],
                        ['Statut', row.statut],
                        ['État', row.etat],
                    ].map(([label, val]) => (
                        <div key={label} className="flex justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="text-slate-500 text-xs uppercase">{label}</span>
                            <span className="font-medium text-slate-800 dark:text-white text-right">
                                {label === 'Statut' ? <StatutBadge value={val} /> : label === 'État' ? <EtatBadge value={val} /> : (val || '—')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function FicheProduitPage() {
    const [form, setForm] = useState(emptyForm);
    const [rows, setRows] = useState([]);
    const [familles, setFamilles] = useState([]);
    const [meta, setMeta] = useState({ next_ref: '—' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [viewRow, setViewRow] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        api.get('/products', { params: { all: 1 } })
            .then((res) => {
                setRows(res.data.data ?? []);
                setFamilles(res.data.meta?.familles ?? []);
                setMeta(res.data.meta ?? { next_ref: '—' });
            })
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setError('');
        load();
    };

    const handleNew = () => {
        resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fillForm = (row) => {
        setForm({
            article_id: row.article_id || '',
            name: row.name || '',
            consistance: row.consistance || '',
            unit: row.unit || '',
            famille: row.famille || '',
            initial_stock: row.initial_stock ?? '',
            status: row.status || 'actif',
            etat: row.etat || 'Rupture',
        });
        setEditingId(row.id);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Supprimer le produit « ${row.reference} — ${row.name} » ?`)) return;
        try {
            await api.delete(`/products/${row.id}`);
            if (editingId === row.id) resetForm();
            else load();
        } catch {
            setError('Impossible de supprimer ce produit');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        const payload = {
            article_id: form.article_id || null,
            name: form.name,
            consistance: form.consistance || null,
            unit: form.unit,
            famille: form.famille || null,
            initial_stock: parseFloat(form.initial_stock) || 0,
            status: form.status,
            etat: form.etat,
        };
        try {
            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post('/products', payload);
            }
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    const currentRef = editingId
        ? rows.find((r) => r.id === editingId)?.reference ?? meta.next_ref
        : meta.next_ref;

    return (
        <div className="flex flex-col flex-1 min-h-0 gap-4">
            <ViewModal row={viewRow} onClose={() => setViewRow(null)} />

            <form onSubmit={handleSubmit} className="shrink-0 glass-card p-4 lg:p-5 shadow-card border border-slate-200/60 dark:border-slate-700/60">
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800">{error}</div>
                )}
                {editingId && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-200 dark:border-amber-800">
                        Mode modification — Mettez à jour puis enregistrez
                    </div>
                )}

                <div className="grid grid-cols-[0.75fr_0.8fr_1.7fr_0.85fr_0.55fr_0.75fr_0.65fr_0.6fr] gap-1.5 items-end w-full">
                    <Field label="Réf" compact>
                        <input type="text" readOnly value={currentRef} className={readOnlyClass} />
                    </Field>
                    <Field label="ID Article" compact>
                        <input type="text" value={form.article_id} onChange={(e) => set('article_id', e.target.value)} placeholder="01-01-01" className={inputClass} />
                    </Field>
                    <Field label="Désignation">
                        <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Désignation" className={inputClass} />
                    </Field>
                    <Field label="Consistance" compact>
                        <select value={form.consistance} onChange={(e) => set('consistance', e.target.value)} className={inputClass}>
                            {CONSISTANCE_OPTIONS.map((v) => <option key={v || 'e'} value={v}>{v || '—'}</option>)}
                        </select>
                    </Field>
                    <Field label="Unité" compact>
                        <select required value={form.unit} onChange={(e) => set('unit', e.target.value)} className={inputClass}>
                            {UNIT_OPTIONS.map((v) => <option key={v || 'e'} value={v}>{v || '—'}</option>)}
                        </select>
                    </Field>
                    <Field label="Famille" compact>
                        <input type="text" list="familles-list" value={form.famille} onChange={(e) => set('famille', e.target.value)} placeholder="Famille" className={inputClass} />
                        <datalist id="familles-list">
                            {familles.map((f) => <option key={f} value={f} />)}
                        </datalist>
                    </Field>
                    <Field label="Statut" compact>
                        <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                            {STATUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </Field>
                    <Field label="État" compact>
                        <select
                            value={form.etat}
                            onChange={(e) => set('etat', e.target.value)}
                            className={etatSelectClass(form.etat)}
                        >
                            {ETAT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white">
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="submit" disabled={saving} className="btn-primary text-sm">
                        <Save className="w-4 h-4" />
                        {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                    <button type="button" onClick={handleNew} className="btn-secondary text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">
                        <RotateCcw className="w-4 h-4" />
                        Nouveau
                    </button>
                    <button type="button" onClick={load} disabled={loading} className="btn-secondary text-sm" title="Actualiser">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                    {editingId && (
                        <button type="button" onClick={handleNew} className="btn-secondary text-sm">
                            <RotateCcw className="w-4 h-4" /> Annuler
                        </button>
                    )}
                </div>
            </form>

            <div className="flex-1 min-h-0 flex flex-col glass-card overflow-hidden shadow-card border border-slate-200/60 dark:border-slate-700/60">
                <div className="shrink-0 px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Liste des produits</h3>
                </div>
                <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full text-sm min-w-[1100px] border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                {['Réf', 'ID Article', 'Désignation', 'Consistance', 'Unité', 'Famille', 'Stock Initial', 'Statut', 'État', 'Actions'].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap text-center bg-slate-50 dark:bg-slate-800 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(51,65,85,1)]"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>{[...Array(10)].map((__, j) => (
                                        <td key={j} className="px-4 py-3 text-center"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto max-w-[80px]" /></td>
                                    ))}</tr>
                                ))
                            ) : rows.length ? (
                                rows.map((row) => (
                                    <tr key={row.id} className={`hover:bg-emerald-50/40 dark:hover:bg-slate-800/40 transition-colors ${editingId === row.id ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}`}>
                                        <td className="px-4 py-2.5 text-center font-mono text-xs font-semibold text-brand-navy dark:text-emerald-400">{row.reference}</td>
                                        <td className="px-4 py-2.5 text-center font-mono text-xs text-slate-600 dark:text-slate-300">{row.article_id || '—'}</td>
                                        <td className="px-4 py-2.5 text-center font-medium text-slate-800 dark:text-white max-w-[200px] truncate" title={row.name}>{row.name || '—'}</td>
                                        <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-300">{row.consistance || '—'}</td>
                                        <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-300">{row.unit || '—'}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 max-w-[160px] truncate" title={row.famille}>{row.famille || '—'}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center tabular-nums font-medium text-slate-700 dark:text-slate-200">{Number(row.initial_stock).toLocaleString('fr-FR')}</td>
                                        <td className="px-4 py-2.5 text-center"><StatutBadge value={row.statut} /></td>
                                        <td className="px-4 py-2.5 text-center"><EtatBadge value={row.etat} /></td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <ActionBtn title="Voir" icon={Eye} color="blue" onClick={() => setViewRow(row)} />
                                                <ActionBtn title="Modifier" icon={Pencil} color="amber" onClick={() => fillForm(row)} />
                                                <ActionBtn title="Supprimer" icon={Trash2} color="red" onClick={() => handleDelete(row)} />
                                                <ActionBtn title="Imprimer" icon={Printer} color="slate" onClick={() => openPrintable(row)} />
                                                <ActionBtn title="PDF" icon={FileText} color="orange" onClick={() => openPrintable(row)} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">Aucun produit enregistré</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
