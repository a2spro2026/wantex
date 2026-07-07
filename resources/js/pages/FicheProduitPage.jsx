import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Save, RotateCcw, Eye, Pencil, Trash2, Printer, FileText, X, RefreshCw, Plus, ImagePlus, Loader2 } from 'lucide-react';
import api from '../lib/api';

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
    famille: '',
    initial_stock: '',
    status: 'actif',
    etat: 'Rupture',
};

const emptyFilters = {
    reference: '',
    designation: '',
    famille: '',
    destination: '',
};

const DESTINATION_FILTER_OPTIONS = [
    { value: '', label: 'Toutes' },
    { value: 'Depot', label: 'Dépôt' },
    { value: 'Entrepot', label: 'Entrepôt' },
    { value: 'none', label: 'Sans destination' },
];

const filterClass =
    'h-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 text-xs outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy shadow-sm shrink-0';

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

function DestinationBadge({ value, qty }) {
    if (!value) return <span className="text-slate-400">—</span>;

    const isDepot = value === 'Depot';
    const label = isDepot ? 'Dépôt' : 'Entrepôt';
    const styles = isDepot
        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
        : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300';

    return (
        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${styles}`}>
            {label}{qty > 0 ? ` (${Number(qty).toLocaleString('fr-FR')})` : ''}
        </span>
    );
}

function DestinationCell({ destinations }) {
    const depot = Number(destinations?.Depot ?? 0);
    const entrepot = Number(destinations?.Entrepot ?? 0);

    if (depot <= 0 && entrepot <= 0) {
        return <span className="text-slate-400">—</span>;
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-1">
            {depot > 0 && <DestinationBadge value="Depot" qty={depot} />}
            {entrepot > 0 && <DestinationBadge value="Entrepot" qty={entrepot} />}
        </div>
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
<h1>WANTEX — Fiche Produit</h1>
<table>
<tr><th>Réf</th><td><span class="badge">${row.reference}</span></td></tr>
<tr><th>ID Article</th><td>${row.article_id || '—'}</td></tr>
<tr><th>Désignation</th><td>${row.name || '—'}</td></tr>
<tr><th>Famille</th><td>${row.famille || '—'}</td></tr>
<tr><th>Stock Initial</th><td>${row.initial_stock ?? 0}</td></tr>
<tr><th>Stock Réel</th><td>${row.stock_reel ?? row.initial_stock ?? 0}</td></tr>
<tr><th>Destination</th><td>${row.destination_label || '—'}</td></tr>
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

function parsePhotoText(text, familyChoices = [], products = []) {
    const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 2);

    const articleMatch = text.match(/\b\d{2}[-./]\d{2}[-./]\d{2}\b/);
    const articleId = articleMatch?.[0]?.replace(/[./]/g, '-') || '';

    const candidateLines = lines.filter((line) => (
        !/^\d{2}-\d{2}-\d{2}$/.test(line)
        && !/^\d+$/.test(line)
        && !/^réf/i.test(line)
    ));
    const designation = [...candidateLines].sort((a, b) => b.length - a.length)[0] || '';

    const textLower = text.toLowerCase();
    let famille = '';
    [...familyChoices]
        .sort((a, b) => b.length - a.length)
        .forEach((choice) => {
            if (!famille && choice && textLower.includes(choice.toLowerCase())) {
                famille = choice;
            }
        });

    const product = products.find((p) => {
        if (articleId && (p.article_id === articleId || p.reference === articleId)) {
            return true;
        }
        if (!designation) return false;
        const name = (p.name || '').toLowerCase();
        const des = designation.toLowerCase();
        return name === des || name.includes(des) || des.includes(name);
    });

    if (product) {
        return {
            article_id: product.article_id || articleId,
            name: product.name || designation.slice(0, 500),
            famille: product.famille || famille,
        };
    }

    return {
        article_id: articleId,
        name: designation.slice(0, 500),
        famille,
    };
}

async function scanProductPhoto(file, familyChoices, products, onProgress) {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('fra', 1, {
        logger: (message) => {
            if (message.status === 'recognizing text') {
                onProgress?.(Math.round((message.progress || 0) * 100));
            }
        },
    });
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return parsePhotoText(text, familyChoices, products);
}

function ProductPhotoThumb({ src, alt = 'Photo produit' }) {
    if (!src) {
        return (
            <div className="h-11 w-11 rounded-lg border border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 mx-auto flex items-center justify-center">
                <ImagePlus className="w-4 h-4 text-slate-300" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className="h-11 w-11 rounded-lg object-cover border border-slate-200 dark:border-slate-600 mx-auto shadow-sm bg-white"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
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
                    {row.photo_url && (
                        <div className="flex justify-center pb-2">
                            <img src={row.photo_url} alt={row.name} className="h-32 w-32 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow" />
                        </div>
                    )}
                    {[
                        ['ID Article', row.article_id],
                        ['Désignation', row.name],
                        ['Famille', row.famille],
                        ['Stock Initial', row.initial_stock],
                        ['Stock Réel', row.stock_reel ?? row.initial_stock],
                        ['Destination', row.destination_label],
                        ['Statut', row.statut],
                        ['État', row.etat],
                    ].map(([label, val]) => (
                        <div key={label} className="flex justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="text-slate-500 text-xs uppercase">{label}</span>
                            <span className="font-medium text-slate-800 dark:text-white text-right">
                                {label === 'Statut' ? <StatutBadge value={val} /> : label === 'État' ? <EtatBadge value={val} /> : label === 'Destination' ? <DestinationCell destinations={row.destinations} /> : (val || '—')}
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
    const [familyOptions, setFamilyOptions] = useState([]);
    const [filters, setFilters] = useState(emptyFilters);
    const importFileRef = useRef(null);
    const importPreviewRef = useRef('');
    const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
    const [importPreview, setImportPreview] = useState('');
    const [importScanning, setImportScanning] = useState(false);
    const [importProgress, setImportProgress] = useState(0);

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([
            api.get('/products', { params: { all: 1 } }),
            api.get('/product-families', { params: { all: 1 } }),
        ])
            .then(([res, famRes]) => {
                setRows(res.data.data ?? []);
                setFamilles(res.data.meta?.familles ?? []);
                setMeta(res.data.meta ?? { next_ref: '—' });
                setFamilyOptions(famRes.data.data ?? []);
            })
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => () => {
        if (importPreviewRef.current) {
            URL.revokeObjectURL(importPreviewRef.current);
        }
    }, []);

    const clearPendingPhoto = () => {
        if (importPreviewRef.current) {
            URL.revokeObjectURL(importPreviewRef.current);
            importPreviewRef.current = '';
        }
        setPendingPhotoFile(null);
        setImportPreview('');
        setImportProgress(0);
    };

    const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setError('');
        clearPendingPhoto();
        load();
    };

    const handleNew = () => {
        resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fillForm = (row) => {
        clearPendingPhoto();
        setForm({
            article_id: row.article_id || '',
            name: row.name || '',
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

        const fields = {
            article_id: form.article_id || null,
            name: form.name,
            famille: form.famille || null,
            initial_stock: parseFloat(form.initial_stock) || 0,
            status: form.status,
            etat: form.etat,
        };

        try {
            if (pendingPhotoFile) {
                const formData = new FormData();
                Object.entries(fields).forEach(([key, value]) => {
                    formData.append(key, value ?? '');
                });
                formData.append('photo', pendingPhotoFile);

                if (editingId) {
                    formData.append('_method', 'PUT');
                    await api.post(`/products/${editingId}`, formData);
                } else {
                    await api.post('/products', formData);
                }
            } else if (editingId) {
                await api.put(`/products/${editingId}`, fields);
            } else {
                await api.post('/products', fields);
            }
            resetForm();
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

    const handleImportApply = (draft, { keepEditing = false } = {}) => {
        if (!keepEditing) {
            setEditingId(null);
            setForm({
                ...emptyForm,
                article_id: draft.article_id || '',
                name: draft.name || '',
                famille: draft.famille || '',
            });
        } else {
            setForm((prev) => ({
                ...prev,
                article_id: draft.article_id || prev.article_id,
                name: draft.name || prev.name,
                famille: draft.famille || prev.famille,
            }));
        }
        setError('');
    };

    const handleImportFile = async (file) => {
        if (!file?.type?.startsWith('image/')) {
            setError('Veuillez sélectionner une image (JPG, PNG, etc.)');
            return;
        }

        const isEditing = Boolean(editingId);

        setError('');
        if (importPreviewRef.current) {
            URL.revokeObjectURL(importPreviewRef.current);
        }
        const objectUrl = URL.createObjectURL(file);
        importPreviewRef.current = objectUrl;
        setPendingPhotoFile(file);
        setImportPreview(objectUrl);

        if (isEditing) {
            return;
        }

        setImportScanning(true);
        setImportProgress(0);

        const labels = familyOptions.map((f) => (f.sous_famille ? `${f.famille} / ${f.sous_famille}` : f.famille));

        try {
            const parsed = await scanProductPhoto(file, labels, rows, setImportProgress);
            handleImportApply(parsed);
            if (!parsed.article_id && !parsed.name) {
                setError('Photo importée — aucun texte détecté, complétez le formulaire manuellement.');
            }
        } catch (err) {
            console.error('OCR import failed:', err);
            setError('Photo importée — analyse OCR impossible. Complétez le formulaire manuellement.');
        } finally {
            setImportScanning(false);
            setImportProgress(0);
        }
    };

    const currentRef = editingId
        ? rows.find((r) => r.id === editingId)?.reference ?? meta.next_ref
        : meta.next_ref;

    const familyChoices = (() => {
        const labels = familyOptions.map((f) => (f.sous_famille ? `${f.famille} / ${f.sous_famille}` : f.famille));
        if (form.famille && !labels.includes(form.famille)) {
            labels.push(form.famille);
        }
        return labels;
    })();

    const editingRow = editingId ? rows.find((r) => r.id === editingId) : null;
    const purchaseQty = editingRow?.purchase_qty ?? 0;
    const stockReel = (parseFloat(form.initial_stock) || 0) + purchaseQty;
    const destinationLabel = editingRow?.destination_label ?? '—';

    const designationOptions = useMemo(
        () => [...new Set(rows.map((r) => r.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
        [rows],
    );

    const familleFilterOptions = useMemo(() => {
        const fromProducts = rows.map((r) => r.famille).filter(Boolean);
        const fromConfig = familyOptions.map((f) => (f.sous_famille ? `${f.famille} / ${f.sous_famille}` : f.famille));
        return [...new Set([...fromProducts, ...fromConfig])].sort((a, b) => a.localeCompare(b, 'fr'));
    }, [rows, familyOptions]);

    const filteredRows = useMemo(() => rows.filter((row) => {
        if (filters.reference && !row.reference?.toLowerCase().includes(filters.reference.trim().toLowerCase())) {
            return false;
        }
        if (filters.designation && row.name !== filters.designation) {
            return false;
        }
        if (filters.famille && row.famille !== filters.famille) {
            return false;
        }
        const depotQty = Number(row.destinations?.Depot ?? 0);
        const entrepotQty = Number(row.destinations?.Entrepot ?? 0);
        if (filters.destination === 'Depot' && depotQty <= 0) return false;
        if (filters.destination === 'Entrepot' && entrepotQty <= 0) return false;
        if (filters.destination === 'none' && (depotQty > 0 || entrepotQty > 0)) return false;
        return true;
    }), [rows, filters]);

    const formPhotoSrc = importPreview || editingRow?.photo_url || null;

    return (
        <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-4 overflow-hidden">
            <ViewModal row={viewRow} onClose={() => setViewRow(null)} />

            <form id="product-form" onSubmit={handleSubmit} className="shrink-0 min-w-0 glass-card overflow-hidden shadow-card border border-slate-200/60 dark:border-slate-700/60">
                <div className="px-5 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 border-b border-white/10 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide shrink-0">
                        {editingId ? 'Modification produit' : 'Saisie fiche produit'}
                    </h3>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => importFileRef.current?.click()}
                            disabled={importScanning}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                            title="Importer une photo (OCR)"
                        >
                            {importScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                            {importScanning ? 'Analyse…' : 'Importer (photo)'}
                        </button>
                        {!editingId && (
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors disabled:opacity-60">
                                <Plus className="w-3.5 h-3.5" />
                                {saving ? 'Ajout...' : 'Ajouter'}
                            </button>
                        )}
                        {editingId && (
                            <>
                                <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors disabled:opacity-60">
                                    <Save className="w-3.5 h-3.5" />
                                    {saving ? 'Enregistrement...' : 'Mettre à jour'}
                                </button>
                                <button type="button" onClick={handleNew} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold transition-colors">
                                    <RotateCcw className="w-3.5 h-3.5" /> Annuler
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <input
                    ref={importFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImportFile(file);
                        e.target.value = '';
                    }}
                />

                <div className="p-4 lg:p-5 space-y-3">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800">{error}</div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20 p-2.5">
                        <div className="grid grid-cols-[36px_0.7fr_0.75fr_1.4fr_0.9fr_0.6fr_0.6fr_0.75fr_0.6fr_0.6fr] gap-1.5 items-end w-full min-w-[900px]">
                            <Field label="Photo" compact>
                                <button
                                    type="button"
                                    onClick={() => importFileRef.current?.click()}
                                    disabled={importScanning}
                                    className="relative w-9 h-8 rounded-lg border border-dashed border-teal-300/80 dark:border-teal-700/60 bg-teal-50/40 dark:bg-teal-950/25 overflow-hidden hover:border-teal-500 transition-colors disabled:opacity-60 mx-auto cursor-pointer"
                                    title="Cliquer pour importer ou changer la photo"
                                >
                                    {formPhotoSrc ? (
                                        <img src={formPhotoSrc} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="absolute inset-0 flex items-center justify-center text-teal-600/70 dark:text-teal-400/80">
                                            <ImagePlus className="w-4 h-4" />
                                        </span>
                                    )}
                                    {importScanning && (
                                        <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-white">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        </span>
                                    )}
                                    {formPhotoSrc && !importScanning && (
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => { e.stopPropagation(); clearPendingPhoto(); }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); clearPendingPhoto(); } }}
                                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                                            title="Retirer la photo"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </span>
                                    )}
                                </button>
                            </Field>
                                <Field label="Réf" compact>
                                    <input type="text" readOnly value={currentRef} className={readOnlyClass} />
                                </Field>
                                <Field label="ID Article" compact>
                                    <input type="text" value={form.article_id} onChange={(e) => set('article_id', e.target.value)} placeholder="01-01-01" className={inputClass} />
                                </Field>
                                <Field label="Désignation">
                                    <input type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Désignation" className={inputClass} />
                                </Field>
                                <Field label="Famille" compact>
                                    <select value={form.famille} onChange={(e) => set('famille', e.target.value)} className={inputClass}>
                                        <option value="">— Choisir —</option>
                                        {familyChoices.map((f) => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Stock Initial" compact>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value={form.initial_stock}
                                        onChange={(e) => set('initial_stock', e.target.value)}
                                        placeholder="0"
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Stock Réel" compact>
                                    <input
                                        type="text"
                                        readOnly
                                        value={stockReel.toLocaleString('fr-FR', { maximumFractionDigits: 3 })}
                                        className={`${readOnlyClass} font-bold text-emerald-700 dark:text-emerald-300`}
                                        title="Stock initial + quantités des bons d'achat"
                                    />
                                </Field>
                                <Field label="Destination" compact>
                                    <div
                                        className={`${readOnlyClass} min-h-[30px] flex items-center justify-center px-1`}
                                        title={destinationLabel !== '—' ? destinationLabel : 'Selon les bons d\'achat validés'}
                                    >
                                        {editingRow?.destinations ? (
                                            <DestinationCell destinations={editingRow.destinations} />
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </div>
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
                    </div>
                </div>
            </form>

            <div className="flex-1 min-h-0 flex flex-col glass-card overflow-hidden shadow-card border border-slate-200/60 dark:border-slate-700/60">
                <div className="shrink-0 px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Liste des produits</h3>
                </div>

                <div className="shrink-0 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 overflow-x-auto">
                    <div className="flex items-center gap-2 flex-nowrap w-max min-w-full">
                        <input
                            type="text"
                            value={filters.reference}
                            onChange={(e) => setFilter('reference', e.target.value)}
                            placeholder="Réf"
                            title="Filtrer par référence"
                            className={`${filterClass} w-[100px]`}
                        />
                        <select
                            value={filters.designation}
                            onChange={(e) => setFilter('designation', e.target.value)}
                            title="Désignation"
                            className={`${filterClass} w-[160px] max-w-[160px]`}
                        >
                            <option value="">Désignation</option>
                            {designationOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <select
                            value={filters.famille}
                            onChange={(e) => setFilter('famille', e.target.value)}
                            title="Famille"
                            className={`${filterClass} w-[130px] max-w-[130px]`}
                        >
                            <option value="">Famille</option>
                            {familleFilterOptions.map((f) => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                        <select
                            value={filters.destination}
                            onChange={(e) => setFilter('destination', e.target.value)}
                            title="Destination"
                            className={`${filterClass} w-[130px]`}
                        >
                            {DESTINATION_FILTER_OPTIONS.map((o) => (
                                <option key={o.value || 'all'} value={o.value}>{o.value ? o.label : 'Destination'}</option>
                            ))}
                        </select>

                        {(filters.reference || filters.designation || filters.famille || filters.destination) && (
                            <button
                                type="button"
                                onClick={() => setFilters(emptyFilters)}
                                className="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                                title="Réinitialiser les filtres"
                            >
                                <X className="w-3.5 h-3.5" />
                                Effacer
                            </button>
                        )}

                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-600 shrink-0 mx-1" aria-hidden />

                        <button
                            type="button"
                            onClick={load}
                            disabled={loading}
                            className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Actualiser la liste"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full text-sm min-w-[1180px] border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                {['Réf', 'Photo', 'ID Article', 'Désignation', 'Famille', 'Stock Initial', 'Stock Réel', 'Destination', 'Statut', 'État', 'Actions'].map((h) => (
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
                                    <tr key={i}>{[...Array(11)].map((__, j) => (
                                        <td key={j} className="px-4 py-3 text-center"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto max-w-[80px]" /></td>
                                    ))}</tr>
                                ))
                            ) : filteredRows.length ? (
                                filteredRows.map((row) => (
                                    <tr key={row.id} className={`hover:bg-emerald-50/40 dark:hover:bg-slate-800/40 transition-colors ${editingId === row.id ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}`}>
                                        <td className="px-4 py-2.5 text-center font-mono text-xs font-semibold text-brand-navy dark:text-emerald-400">{row.reference}</td>
                                        <td className="px-2 py-2 text-center">
                                            <ProductPhotoThumb src={row.photo_url} alt={row.name} />
                                        </td>
                                        <td className="px-4 py-2.5 text-center font-mono text-xs text-slate-600 dark:text-slate-300">{row.article_id || '—'}</td>
                                        <td className="px-4 py-2.5 text-center font-medium text-slate-800 dark:text-white max-w-[200px] truncate" title={row.name}>{row.name || '—'}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 max-w-[160px] truncate" title={row.famille}>{row.famille || '—'}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center tabular-nums font-medium text-slate-700 dark:text-slate-200">{Number(row.initial_stock).toLocaleString('fr-FR')}</td>
                                        <td className="px-4 py-2.5 text-center tabular-nums font-bold text-emerald-700 dark:text-emerald-300">{Number(row.stock_reel ?? row.initial_stock).toLocaleString('fr-FR')}</td>
                                        <td className="px-4 py-2.5 text-center"><DestinationCell destinations={row.destinations} /></td>
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
                                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-400">{rows.length ? 'Aucun produit ne correspond aux filtres' : 'Aucun produit enregistré'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
