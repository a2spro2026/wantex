export const UNIT_OPTIONS = ['', 'JEU', 'KG', 'KM', 'KM-UNIF', 'M', 'M²', 'M³', 'ML', 'T', 'U'];
export const DESTINATION_OPTIONS = ['', 'Depot', 'Entrepot'];

export const emptyFilters = {
    date_from: '',
    date_to: '',
    supplier_id: '',
    destination: '',
};

let lineKey = 0;

export function newLine() {
    return {
        _key: ++lineKey,
        article_ref: '',
        designation: '',
        famille: '',
        quantity: '',
        unit: '',
        unit_price: '',
    };
}

export const emptyHeader = {
    supplier_id: '',
    order_date: '',
    destination: '',
    reglement: '',
    echeance: '',
    city: '',
    address: '',
};

export function lineSubtotal(line) {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unit_price) || 0;
    return qty * price;
}

export function formatMontant(value) {
    const n = Number(value) || 0;
    return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

export function mapRowToLines(row) {
    if (row.items?.length) {
        return row.items.map((item) => ({
            _key: ++lineKey,
            article_ref: item.article_ref || '',
            designation: item.designation || '',
            famille: item.famille || '',
            quantity: String(item.quantity ?? 1),
            unit: item.unit || '',
            unit_price: item.unit_price != null ? String(item.unit_price) : '',
        }));
    }

    return [{
        _key: ++lineKey,
        article_ref: row.article_ref || '',
        designation: row.designation || '',
        famille: row.famille || '',
        quantity: String(row.quantity ?? 1),
        unit: row.unit || '',
        unit_price: row.unit_price != null ? String(row.unit_price) : '',
    }];
}

function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatMontantPlain(value) {
    const n = Number(value) || 0;
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildBonHtml(row) {
    const itemsRows = (row.items || []).map((item, i) => `
<tr>
<td class="num">${i + 1}</td>
<td>${esc(item.article_ref || '—')}</td>
<td class="left">${esc(item.designation || '—')}</td>
<td class="left">${esc(item.famille || '—')}</td>
<td class="num">${item.quantity ?? 1}</td>
<td>${esc(item.unit || '—')}</td>
<td class="num">${formatMontantPlain(item.unit_price)}</td>
<td class="num strong">${formatMontantPlain(item.subtotal)}</td>
</tr>`).join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Bon ${esc(row.reference)}</title>
<style>
@page { size: A4 portrait; margin: 10mm 12mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #1e293b; line-height: 1.35; }
.header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8px; border-bottom: 2px solid #1e3a5f; margin-bottom: 10px; }
.brand h1 { font-size: 18px; color: #1e3a5f; }
.doc-title { font-size: 15px; font-weight: 700; color: #ea580c; text-transform: uppercase; }
.doc-ref { display: inline-block; margin-top: 4px; padding: 3px 10px; background: #fff7ed; color: #ea580c; border: 1px solid #fdba74; border-radius: 999px; font-weight: 700; font-size: 11px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
.info-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; }
.info-card h3 { font-size: 9px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
table.items { width: 100%; border-collapse: collapse; margin-top: 8px; }
table.items th, table.items td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: center; }
table.items th { background: #f8fafc; font-weight: 600; font-size: 9px; text-transform: uppercase; }
table.items td.left { text-align: left; }
table.items td.num { text-align: right; font-variant-numeric: tabular-nums; }
table.items td.strong { font-weight: 700; }
.total-row { margin-top: 10px; text-align: right; font-size: 12px; font-weight: 700; color: #1e3a5f; }
</style>
</head>
<body>
<div class="header">
<div class="brand"><h1>WANTEX</h1><p>Bon d'Achat</p></div>
<div style="text-align:right">
<div class="doc-title">Bon d'Achat</div>
<div class="doc-ref">${esc(row.reference)}</div>
<div style="margin-top:6px;font-size:9px;color:#475569">Date : ${esc(row.order_date)}</div>
</div>
</div>
<div class="info-grid">
<div class="info-card">
<h3>Fournisseur</h3>
<div><strong>${esc(row.fournisseur || '—')}</strong></div>
<div>ID : ${esc(row.supplier_code || row.supplier_id || '—')}</div>
</div>
<div class="info-card">
<h3>Destination & Conditions</h3>
<div>Destination : ${esc(row.destination || '—')}</div>
<div>Règlement : ${esc(row.reglement || '—')}</div>
<div>Échéance : ${esc(row.echeance || '—')}</div>
</div>
</div>
<table class="items">
<thead>
<tr><th>#</th><th>Réf</th><th>Désignation</th><th>Famille</th><th>Qté</th><th>U/M</th><th>Prix U</th><th>Sous-Total</th></tr>
</thead>
<tbody>${itemsRows}</tbody>
</table>
<div class="total-row">Montant Total : ${formatMontantPlain(row.montant)} MAD</div>
</body>
</html>`;
}

export function openPrintable(row) {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(buildBonHtml(row));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
}

export function exportCsv(rows) {
    const headers = ['Date', 'Nom Fournisseur', 'N° Bon', 'Montant Total', 'Destination'];
    const lines = rows.map((row) => [
        row.order_date,
        row.fournisseur || '',
        row.reference,
        row.montant,
        row.destination || '',
    ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'));

    const bom = '\uFEFF';
    const csv = bom + [headers.join(';'), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bons-achats-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
