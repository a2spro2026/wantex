import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Check, Eye, FileDown, Pencil, Plus, Printer, RefreshCw, Search, Trash2, X,
} from 'lucide-react';
import api from '../../lib/api';
import DesignationPicker from '../../components/DesignationPicker';
import {
    DESTINATION_OPTIONS,
    UNIT_OPTIONS,
    emptyFilters,
    emptyHeader,
    exportCsv,
    formatMontant,
    lineSubtotal,
    mapRowToLines,
    newLine,
    openPrintable,
} from './bonAchatsUtils';

const COLS = ['Date', 'N° Bon', 'ID Fourn.', 'Fournisseur', 'Réf', 'Désignation', 'Famille', 'Qté', 'U/M', 'Prix U', 'Sous-Total', 'Destination', ''];
const lineGrid = 'grid w-full grid-cols-[100px_74px_68px_minmax(72px,0.45fr)_54px_minmax(52px,0.32fr)_minmax(44px,0.26fr)_74px_62px_58px_78px_108px_28px] gap-1.5 items-end min-w-[1100px]';

const cellBase = 'w-full h-8 rounded-lg border text-[10px] outline-none transition-all shadow-sm min-w-0';
const cellDate = `${cellBase} border-slate-300/80 dark:border-slate-600 bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 text-slate-700 dark:text-slate-200 px-1 text-[9px] text-center focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400`;
const cellBon = `${cellBase} border-orange-300/70 dark:border-orange-600/50 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/40 dark:to-slate-900 text-brand-navy dark:text-orange-300 font-mono font-bold px-1.5 text-center focus:ring-2 focus:ring-orange-400/35 focus:border-orange-400`;
const cellId = `${cellBase} border-slate-300/70 dark:border-slate-600 bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 px-0.5 text-center text-[9px] font-mono font-bold cursor-default truncate`;
const cellSupplier = `${cellBase} border-indigo-200/70 dark:border-indigo-800/50 bg-indigo-50/40 dark:bg-indigo-950/30 text-slate-800 dark:text-slate-100 pl-1.5 pr-1 text-left text-[9px] leading-tight focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 truncate`;
const cellRef = `${cellBase} border-slate-200 dark:border-slate-600 bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 px-1.5 text-center cursor-default truncate`;
const cellFamille = `${cellBase} border-slate-200/80 dark:border-slate-600 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-1 text-[9px] text-center cursor-default truncate`;
const cellQty = `${cellBase} border-blue-200/70 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/25 text-slate-800 dark:text-slate-100 px-2 text-center text-[11px] font-bold tabular-nums focus:ring-2 focus:ring-blue-400/35`;
const cellUnit = `${cellBase} border-teal-200/70 dark:border-teal-800/50 bg-teal-50/40 dark:bg-teal-950/25 text-slate-800 dark:text-slate-100 px-1.5 text-center text-[10px] font-semibold focus:ring-2 focus:ring-teal-400/35`;
const cellPrice = `${cellBase} border-amber-200/70 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20 text-slate-800 dark:text-slate-100 px-1 text-center font-semibold tabular-nums focus:ring-2 focus:ring-amber-400/35`;
const cellTotal = `${cellBase} border-emerald-200/70 dark:border-emerald-800/50 bg-gradient-to-b from-emerald-50 to-emerald-100/70 dark:from-emerald-950/40 dark:to-emerald-900/20 text-emerald-800 dark:text-emerald-300 px-1.5 text-center font-bold tabular-nums cursor-default text-[9px]`;
const cellDest = `${cellBase} border-violet-300/80 dark:border-violet-700/50 bg-violet-50/70 dark:bg-violet-950/35 text-violet-900 dark:text-violet-200 px-1.5 text-center text-[10px] font-bold focus:ring-2 focus:ring-violet-400/40 appearance-auto cursor-pointer`;

function destinationLabel(value) {
    if (value === 'Depot') return 'Dépôt';
    if (value === 'Entrepot') return 'Entrepôt';
    return 'Dest.';
}
const filterClass =
    'h-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 text-xs outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy shadow-sm shrink-0';

function Th({ children }) {
    return (
        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center truncate pb-0.5">
            {children}
        </div>
    );
}

function ActionBtn({ onClick, title, children, danger = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded-lg transition-colors ${
                danger
                    ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-slate-500 hover:text-brand-navy hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-orange-400'
            }`}
        >
            {children}
        </button>
    );
}

function DestinationBadge({ value }) {
    if (!value) return <span className="text-slate-400">—</span>;
    const styles = value === 'Depot'
        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
        : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300';
    return (
        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${styles}`}>
            {destinationLabel(value)}
        </span>
    );
}

export default function BonAchatsListPage() {
    const [filters, setFilters] = useState(emptyFilters);
    const [rows, setRows] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [header, setHeader] = useState({
        ...emptyHeader,
        order_date: new Date().toISOString().slice(0, 10),
        destination: '',
    });
    const [lines, setLines] = useState([newLine()]);
    const [meta, setMeta] = useState({ next_ref: '—' });
    const [reference, setReference] = useState('');
    const [referenceAuto, setReferenceAuto] = useState(true);
    const [supplierCode, setSupplierCode] = useState('—');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [viewRow, setViewRow] = useState(null);

    const totalBon = useMemo(
        () => lines.reduce((sum, line) => sum + lineSubtotal(line), 0),
        [lines],
    );

    const selectedSupplierName = useMemo(() => {
        const supplier = suppliers.find((s) => String(s.id) === String(header.supplier_id));
        return supplier?.name || '';
    }, [suppliers, header.supplier_id]);

    const load = useCallback(() => {
        setLoading(true);
        const params = { all: 1, ...filters };
        Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });

        Promise.all([
            api.get('/purchase-orders', { params }),
            api.get('/suppliers', { params: { all: 1 } }),
            api.get('/products', { params: { all: 1 } }),
        ])
            .then(([ordersRes, suppliersRes, productsRes]) => {
                setRows(ordersRes.data.data ?? []);
                setSuppliers(suppliersRes.data.data ?? []);
                setProducts(productsRes.data.data ?? []);
                const m = ordersRes.data.meta ?? { next_ref: '—' };
                setMeta(m);
                if (!editingId) {
                    setReference(m.next_ref);
                    setReferenceAuto(true);
                }
            })
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, [filters, editingId]);

    useEffect(() => { load(); }, [load]);

    const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

    const resetForm = useCallback(() => {
        setHeader({
            ...emptyHeader,
            order_date: new Date().toISOString().slice(0, 10),
            destination: '',
        });
        setLines([newLine()]);
        setEditingId(null);
        setSupplierCode('—');
        setReference(meta.next_ref);
        setReferenceAuto(true);
        setError('');
    }, [meta.next_ref]);

    const fillForm = async (row) => {
        setError('');
        setEditingId(row.id);
        try {
            const { data } = await api.get(`/purchase-orders/${row.id}`);
            setHeader({
                supplier_id: data.supplier_id || '',
                order_date: data.order_date_raw || new Date().toISOString().slice(0, 10),
                destination: data.destination || '',
                reglement: data.reglement || '',
                echeance: data.echeance || '',
                city: data.city || '',
                address: data.address || '',
            });
            setLines(mapRowToLines(data));
            setReference(data.reference);
            setReferenceAuto(false);
            setSupplierCode(data.supplier_code || String(data.supplier_id || '—'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            setError('Impossible de charger ce bon d\'achat');
        }
    };

    const handleView = async (row) => {
        try {
            const { data } = await api.get(`/purchase-orders/${row.id}`);
            setViewRow(data);
        } catch {
            setError('Impossible d\'afficher ce bon');
        }
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Supprimer le bon ${row.reference} ?`)) return;
        try {
            await api.delete(`/purchase-orders/${row.id}`);
            if (editingId === row.id) resetForm();
            load();
        } catch {
            setError('Impossible de supprimer ce bon');
        }
    };

    const handleSupplierChange = (supplierId) => {
        const supplier = suppliers.find((s) => String(s.id) === String(supplierId));
        setSupplierCode(supplier?.code || (supplierId ? String(supplierId) : '—'));
        setHeader((h) => ({
            ...h,
            supplier_id: supplierId,
            reglement: supplier?.reglement || h.reglement,
            echeance: supplier?.echeance || supplier?.payment_terms || h.echeance,
            city: supplier?.city || h.city,
            address: supplier?.address || h.address,
        }));
    };

    const updateLine = (index, key, value) => {
        setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [key]: value } : line)));
    };

    const handleDesignationSelect = (index, product) => {
        setLines((prev) => prev.map((line, i) => (
            i === index
                ? {
                    ...line,
                    article_ref: product.article_id || product.reference || '',
                    designation: product.name,
                    famille: product.famille || '',
                    unit: product.unit || line.unit,
                    unit_price: product.purchase_price != null && product.purchase_price > 0
                        ? String(product.purchase_price)
                        : line.unit_price,
                }
                : line
        )));
    };

    const addLine = () => setLines((prev) => [...prev, newLine()]);
    const removeLine = (index) => setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

    const buildPayload = () => {
        const clean = (value) => {
            const v = typeof value === 'string' ? value.trim() : value;
            return v || null;
        };

        return {
        reference: editingId
            ? (reference?.trim() || null)
            : (referenceAuto ? null : (reference?.trim() || null)),
        supplier_id: header.supplier_id ? Number(header.supplier_id) : null,
        order_date: header.order_date || new Date().toISOString().slice(0, 10),
        destination: clean(header.destination),
        reglement: clean(header.reglement),
        echeance: clean(header.echeance),
        city: clean(header.city),
        address: clean(header.address),
        items: lines
            .filter((line) => line.designation?.trim())
            .map((line) => ({
                article_ref: line.article_ref?.trim() || null,
                designation: line.designation.trim(),
                unit: line.unit || null,
                quantity: parseFloat(line.quantity) || 1,
                unit_price: parseFloat(line.unit_price) || 0,
            })),
    };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!header.supplier_id) {
            setError('Sélectionnez un fournisseur');
            return;
        }

        const itemsWithDesignation = lines.filter((line) => line.designation?.trim());
        if (!itemsWithDesignation.length) {
            setError('Sélectionnez au moins un produit dans le catalogue (colonne Désignation)');
            return;
        }

        const payload = buildPayload();
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/purchase-orders/${editingId}`, payload);
            } else {
                await api.post('/purchase-orders', payload);
            }
            resetForm();
            load();
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

    const handlePrintList = () => {
        if (!rows.length) return;
        rows.forEach((row, i) => setTimeout(() => openPrintable(row), i * 400));
    };

    return (
        <div className="space-y-4">
            {/* ——— Saisie ——— */}
            <form onSubmit={handleSubmit} noValidate className="glass-card shadow-card border border-slate-200/60 dark:border-slate-700/60">
                <div className="px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Saisie bon d&apos;achat</h3>
                    {editingId && (
                        <span className="text-[10px] font-semibold text-white/90 bg-white/15 px-2.5 py-1 rounded-full">
                            Modification — {reference}
                        </span>
                    )}
                </div>

                <div className="p-4 space-y-3">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20 p-2.5 pb-3">
                        <div className={`${lineGrid} mb-1.5`}>
                            {COLS.map((label) => <Th key={label || 'act'}>{label}</Th>)}
                        </div>

                        {lines.map((line, index) => {
                            const sub = lineSubtotal(line);
                            return (
                                <div key={line._key} className={`${lineGrid} ${index > 0 ? 'mt-1.5' : ''}`}>
                                    {index === 0 ? (
                                        <>
                                            <input
                                                type="date"
                                                value={header.order_date}
                                                onChange={(e) => setHeader((h) => ({ ...h, order_date: e.target.value }))}
                                                className={cellDate}
                                            />
                                            <input
                                                type="text"
                                                value={reference}
                                                onChange={(e) => {
                                                    setReference(e.target.value);
                                                    setReferenceAuto(false);
                                                }}
                                                placeholder="N° Bon"
                                                className={cellBon}
                                                title="N° Bon (saisie manuelle)"
                                            />
                                            <input type="text" readOnly value={supplierCode} className={cellId} title={supplierCode} />
                                            <div className="min-w-0 overflow-hidden" title={selectedSupplierName || 'Sélectionner un fournisseur'}>
                                                <select
                                                    value={header.supplier_id}
                                                    onChange={(e) => handleSupplierChange(e.target.value)}
                                                    className={cellSupplier}
                                                >
                                                    <option value="">— Choisir —</option>
                                                    {suppliers.map((s) => (
                                                        <option key={s.id} value={s.id} title={s.name}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="col-span-4" aria-hidden="true" />
                                    )}
                                    <input
                                        type="text"
                                        readOnly
                                        value={line.article_ref}
                                        placeholder="Réf"
                                        className={`${cellRef} cursor-default`}
                                        title={line.article_ref || 'Réf. article (catalogue)'}
                                    />
                                    <div className="min-w-0">
                                        <DesignationPicker
                                            products={products}
                                            value={line.designation}
                                            onSelect={(product) => handleDesignationSelect(index, product)}
                                            fitCell
                                            placeholder="— Choisir —"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        readOnly
                                        value={line.famille}
                                        placeholder="Fam."
                                        className={cellFamille}
                                        title={line.famille || 'Famille (catalogue)'}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value={line.quantity}
                                        onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                                        placeholder=""
                                        className={cellQty}
                                        title={line.quantity ? `Quantité : ${line.quantity}` : 'Quantité'}
                                    />
                                    <div className="min-w-0">
                                        <input
                                            type="text"
                                            list={`unit-options-${line._key}`}
                                            value={line.unit}
                                            onChange={(e) => updateLine(index, 'unit', e.target.value)}
                                            placeholder="U/M"
                                            maxLength={20}
                                            className={cellUnit}
                                            title={line.unit ? `Unité : ${line.unit}` : 'Saisie manuelle U/M'}
                                        />
                                        <datalist id={`unit-options-${line._key}`}>
                                            {UNIT_OPTIONS.filter(Boolean).map((v) => (
                                                <option key={v} value={v} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={line.unit_price}
                                        onChange={(e) => updateLine(index, 'unit_price', e.target.value)}
                                        placeholder="0.00"
                                        className={cellPrice}
                                    />
                                    <input
                                        type="text"
                                        readOnly
                                        value={sub ? sub.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                                        className={cellTotal}
                                    />
                                    {index === 0 ? (
                                        <div className="min-w-0 shrink-0">
                                            <select
                                                value={header.destination}
                                                onChange={(e) => setHeader((h) => ({ ...h, destination: e.target.value }))}
                                                className={cellDest}
                                                title={header.destination ? `Destination : ${destinationLabel(header.destination)}` : 'Choisir une destination'}
                                            >
                                                {DESTINATION_OPTIONS.map((v) => (
                                                    <option key={v || 'e'} value={v}>{destinationLabel(v)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="h-8 rounded-lg border border-dashed border-violet-200/50 dark:border-violet-800/30 bg-violet-50/20 dark:bg-violet-950/10" aria-hidden="true" />
                                    )}
                                    <div className="flex justify-center pb-0.5">
                                        {index === 0 ? (
                                            <button
                                                type="button"
                                                onClick={addLine}
                                                className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-colors"
                                                title="Ajouter un article"
                                            >
                                                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => removeLine(index)}
                                                className="p-0.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title="Supprimer la ligne"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <button type="submit" disabled={saving} className="btn-primary text-sm">
                            <Check className="w-4 h-4" />
                            {saving ? 'Enregistrement…' : 'Valider'}
                        </button>
                        <p className="text-sm font-bold text-brand-navy dark:text-orange-400 tabular-nums">
                            Montant Total : {formatMontant(totalBon)}
                        </p>
                    </div>
                </div>
            </form>

            {/* ——— Consultation lite ——— */}
            <div className="glass-card overflow-hidden shadow-card border border-slate-200/60 dark:border-slate-700/60">
                <div className="px-5 py-3 bg-gradient-to-r from-slate-600 to-slate-800 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Bons d&apos;achat</h3>
                </div>

                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 overflow-x-auto">
                    <div className="flex items-center gap-2 flex-nowrap w-max min-w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 shrink-0">Du</span>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => setFilter('date_from', e.target.value)}
                            title="Date du"
                            className={`${filterClass} w-[134px]`}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 shrink-0">Au</span>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => setFilter('date_to', e.target.value)}
                            title="Date au"
                            className={`${filterClass} w-[134px]`}
                        />
                        <select
                            value={filters.supplier_id}
                            onChange={(e) => setFilter('supplier_id', e.target.value)}
                            title="Nom fournisseur"
                            className={`${filterClass} w-[150px] max-w-[150px]`}
                        >
                            <option value="">Fournisseur</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <select
                            value={filters.destination}
                            onChange={(e) => setFilter('destination', e.target.value)}
                            title="Destination"
                            className={`${filterClass} w-[118px]`}
                        >
                            <option value="">Destination</option>
                            {DESTINATION_OPTIONS.filter(Boolean).map((v) => (
                                <option key={v} value={v}>{destinationLabel(v)}</option>
                            ))}
                        </select>

                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-600 shrink-0 mx-1" aria-hidden />

                        <button type="button" onClick={load} className="btn-secondary text-xs h-8 px-3 shrink-0">
                            <Search className="w-3.5 h-3.5" /> Rechercher
                        </button>
                        <button type="button" onClick={handlePrintList} disabled={!rows.length} className="btn-secondary text-xs h-8 px-3 shrink-0 disabled:opacity-40">
                            <Printer className="w-3.5 h-3.5" /> Imprimer
                        </button>
                        <button type="button" onClick={() => exportCsv(rows)} disabled={!rows.length} className="btn-secondary text-xs h-8 px-3 shrink-0 disabled:opacity-40">
                            <FileDown className="w-3.5 h-3.5" /> Exporter
                        </button>
                        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Actualiser">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                {['Date', 'Nom Fournisseur', 'N° Bon', 'Montant Total', 'Destination', 'Actions'].map((h) => (
                                    <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(6)].map((__, j) => (
                                            <td key={j} className="px-3 py-3">
                                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto max-w-[80px]" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : rows.length ? (
                                rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={`transition-colors ${
                                            editingId === row.id
                                                ? 'bg-orange-50 dark:bg-orange-900/15'
                                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                                        }`}
                                    >
                                        <td className="px-3 py-2.5 text-center text-xs text-slate-600 dark:text-slate-300">{row.order_date}</td>
                                        <td className="px-3 py-2.5 text-center text-xs font-medium text-slate-800 dark:text-white">{row.fournisseur || '—'}</td>
                                        <td className="px-3 py-2.5 text-center font-mono text-xs font-bold text-brand-navy dark:text-orange-400">{row.reference}</td>
                                        <td className="px-3 py-2.5 text-center text-xs font-bold tabular-nums text-brand-navy dark:text-orange-400">{formatMontant(row.montant)}</td>
                                        <td className="px-3 py-2.5 text-center"><DestinationBadge value={row.destination} /></td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <ActionBtn onClick={() => handleView(row)} title="Voir">
                                                    <Eye className="w-4 h-4" />
                                                </ActionBtn>
                                                <ActionBtn onClick={() => fillForm(row)} title="Modifier">
                                                    <Pencil className="w-4 h-4" />
                                                </ActionBtn>
                                                <ActionBtn onClick={() => openPrintable(row)} title="Imprimer">
                                                    <Printer className="w-4 h-4" />
                                                </ActionBtn>
                                                <ActionBtn onClick={() => handleDelete(row)} title="Supprimer" danger>
                                                    <Trash2 className="w-4 h-4" />
                                                </ActionBtn>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">Aucun bon d&apos;achat</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ——— Modal voir ——— */}
            {viewRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewRow(null)}>
                    <div
                        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-700 to-slate-800">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Bon d&apos;achat</p>
                                <p className="text-lg font-bold text-white font-mono">{viewRow.reference}</p>
                            </div>
                            <button type="button" onClick={() => setViewRow(null)} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div><span className="text-xs text-slate-500">Date</span><p className="font-medium">{viewRow.order_date}</p></div>
                                <div><span className="text-xs text-slate-500">Destination</span><p><DestinationBadge value={viewRow.destination} /></p></div>
                                <div className="col-span-2"><span className="text-xs text-slate-500">Fournisseur</span><p className="font-medium">{viewRow.fournisseur || '—'}</p></div>
                            </div>
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr>
                                            {['Désignation', 'Famille', 'Qté', 'U/M', 'Prix U', 'Total'].map((h) => (
                                                <th key={h} className="px-2 py-2 font-bold uppercase text-slate-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {(viewRow.items || []).map((item) => (
                                            <tr key={item.id ?? item.designation}>
                                                <td className="px-2 py-2">{item.designation}</td>
                                                <td className="px-2 py-2">{item.famille || '—'}</td>
                                                <td className="px-2 py-2 text-center">{item.quantity}</td>
                                                <td className="px-2 py-2 text-center">{item.unit || '—'}</td>
                                                <td className="px-2 py-2 text-right tabular-nums">{formatMontant(item.unit_price)}</td>
                                                <td className="px-2 py-2 text-right tabular-nums font-semibold">{formatMontant(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-brand-navy dark:text-orange-400">{formatMontant(viewRow.montant)}</span>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setViewRow(null); fillForm(viewRow); }} className="btn-secondary text-xs">
                                        <Pencil className="w-3.5 h-3.5" /> Modifier
                                    </button>
                                    <button type="button" onClick={() => openPrintable(viewRow)} className="btn-primary text-xs">
                                        <Printer className="w-3.5 h-3.5" /> Imprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
