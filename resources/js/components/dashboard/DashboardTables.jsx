import { Banknote, Package, Receipt } from 'lucide-react';
import ReportTable from './ReportTable';

function StatutBadge({ value }) {
    const isActif = value === 'Actif';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            isActif
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
        }`}>
            {value}
        </span>
    );
}

function EtatBadge({ value }) {
    const styles = {
        Dispo: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        Faible: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        Rupture: 'bg-red-500/15 text-red-700 dark:text-red-400',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[value] ?? 'bg-slate-100 text-slate-600'}`}>
            {value}
        </span>
    );
}

const debitColumns = [
    { key: 'date', label: 'Date' },
    { key: 'fournisseur', label: 'Nom Fournisseur' },
    { key: 'type_regl', label: 'Type Règl.' },
    { key: 'numero', label: 'N°' },
    { key: 'montant', label: 'Montant', align: 'right' },
    { key: 'date_decaiss', label: 'Date Décaiss.' },
];

const consommationColumns = [
    { key: 'ref', label: 'Réf' },
    { key: 'designation', label: 'Désignation' },
    { key: 'qte', label: 'Qté', align: 'right', render: (v) => Number(v).toLocaleString('fr-FR') },
    { key: 'destination', label: 'Destination' },
    { key: 'statut', label: 'Statut', render: (v) => <StatutBadge value={v} /> },
    { key: 'etat', label: 'État', render: (v) => <EtatBadge value={v} /> },
];

const chargesColumns = [
    { key: 'date', label: 'Date' },
    { key: 'designation', label: 'Désignation' },
    { key: 'montant', label: 'Montant', align: 'right' },
    { key: 'destination', label: 'Destination' },
];

export default function DashboardTables({ tables, loading }) {
    return (
        <div className="space-y-6 pb-2">
            <ReportTable
                title="Etat Débit"
                icon={Banknote}
                columns={debitColumns}
                rows={tables?.etat_debit}
                loading={loading}
                accent="from-brand-navy via-blue-800 to-blue-900"
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ReportTable
                    title="Etat Consommation"
                    icon={Package}
                    columns={consommationColumns}
                    rows={tables?.etat_consommation}
                    loading={loading}
                    accent="from-amber-500 via-orange-500 to-orange-700"
                />

                <ReportTable
                    title="Etat Charges"
                    icon={Receipt}
                    columns={chargesColumns}
                    rows={tables?.etat_charges}
                    loading={loading}
                    accent="from-rose-500 via-red-500 to-rose-800"
                />
            </div>
        </div>
    );
}
