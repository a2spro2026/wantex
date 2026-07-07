import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Pencil, Trash2, LogOut, RefreshCw } from 'lucide-react';
import api from '../lib/api';

const emptyForm = {
    famille: '',
    sous_famille: '',
};

function Field({ label, children }) {
    return (
        <div className="min-w-0">
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 truncate text-center">
                {label}
            </label>
            {children}
        </div>
    );
}

const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2.5 py-2 text-xs text-center outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-all min-w-0';

const readOnlyClass =
    'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-2.5 py-2 text-xs text-center cursor-not-allowed min-w-0 font-mono font-semibold';

export default function FamilleProduitPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState(emptyForm);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ next_ref: '—' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        api.get('/product-families', { params: { all: 1 } })
            .then((res) => {
                setRows(res.data.data ?? []);
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
    };

    const fillForm = (row) => {
        setForm({
            famille: row.famille || '',
            sous_famille: row.sous_famille || '',
        });
        setEditingId(row.id);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Supprimer la famille « ${row.famille}${row.sous_famille ? ` / ${row.sous_famille}` : ''} » ?`)) return;
        try {
            await api.delete(`/product-families/${row.id}`);
            if (editingId === row.id) resetForm();
            load();
        } catch {
            setError('Impossible de supprimer cette famille');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        const payload = {
            famille: form.famille.trim(),
            sous_famille: form.sous_famille?.trim() || null,
        };
        try {
            if (editingId) {
                await api.put(`/product-families/${editingId}`, payload);
            } else {
                await api.post('/product-families', payload);
            }
            resetForm();
            load();
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
            <form onSubmit={handleSubmit} className="shrink-0 glass-card p-4 lg:p-5 shadow-card border border-slate-200/60 dark:border-slate-700/60">
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800">
                        {error}
                    </div>
                )}
                {editingId && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-200 dark:border-amber-800">
                        Mode modification — modifiez puis enregistrez
                    </div>
                )}

                <div className="grid grid-cols-[0.7fr_1.2fr_1.2fr] gap-3 items-end max-w-3xl mx-auto w-full">
                    <Field label="Réf">
                        <input type="text" readOnly value={currentRef} className={readOnlyClass} />
                    </Field>
                    <Field label="Famille">
                        <input
                            type="text"
                            required
                            value={form.famille}
                            onChange={(e) => set('famille', e.target.value)}
                            placeholder="Famille"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Sous-Famille">
                        <input
                            type="text"
                            value={form.sous_famille}
                            onChange={(e) => set('sous_famille', e.target.value)}
                            placeholder="Sous-famille"
                            className={inputClass}
                        />
                    </Field>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="submit" disabled={saving} className="btn-primary text-sm min-w-[140px]">
                        <Save className="w-4 h-4" />
                        {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                    <button type="button" onClick={load} disabled={loading} className="btn-secondary text-sm" title="Actualiser">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </form>

            <div className="flex-1 min-h-0 flex flex-col glass-card overflow-hidden shadow-card border border-slate-200/60 dark:border-slate-700/60">
                <div className="shrink-0 px-5 py-3.5 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Familles produit</h3>
                </div>
                <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full text-sm min-w-[640px] border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                {['Réf', 'Famille', 'Sous-Famille', 'Actions'].map((h) => (
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
                                [...Array(4)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(4)].map((__, j) => (
                                            <td key={j} className="px-4 py-3 text-center">
                                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto max-w-[80px]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : rows.length ? (
                                rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${editingId === row.id ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}`}
                                    >
                                        <td className="px-4 py-2.5 text-center font-mono text-xs font-semibold text-brand-navy dark:text-orange-400">
                                            {row.reference}
                                        </td>
                                        <td className="px-4 py-2.5 text-center font-medium text-slate-800 dark:text-white">
                                            {row.famille || '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-300">
                                            {row.sous_famille || '—'}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fillForm(row)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/25 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    Modifier
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(row)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/35 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                                        Aucune famille enregistrée
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 flex justify-end">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="btn-secondary text-sm border border-slate-300 dark:border-slate-600"
                    >
                        <LogOut className="w-4 h-4" />
                        Quitter
                    </button>
                </div>
            </div>
        </div>
    );
}
