import { Banknote, Package, Receipt, Wallet } from 'lucide-react';
import ReportTable from './ReportTable';

function EtatProduitBadge({ value }) {
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

function StatutStockBadge({ value }) {
    const styles = {
        Dispo: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        Faible: 'bg-amber-400/20 text-amber-700 dark:text-amber-300',
        Rupture: 'bg-red-500/15 text-red-700 dark:text-red-400',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[value] ?? 'bg-slate-100 text-slate-600'}`}>
            {value}
        </span>
    );
}

const fournisseurColumns = [
    { key: 'date', label: 'Date' },
    { key: 'fournisseur', label: 'Nom Fournisseur' },
    { key: 'type_regl', label: 'Type Règl.' },
    { key: 'numero', label: 'N°' },
    { key: 'montant', label: 'Montant', align: 'right' },
    { key: 'date_decaiss', label: 'Date Décaiss.' },
];

const clientColumns = [
    { key: 'date', label: 'Date' },
    { key: 'client', label: 'Nom Client' },
    { key: 'type_regl', label: 'Type Règlement' },
    { key: 'numero', label: 'N°' },
    { key: 'montant', label: 'Montant', align: 'right' },
    { key: 'date_encaiss', label: 'Date Encaiss' },
];

const produitsActifsColumns = [
    { key: 'ref', label: 'Réf' },
    { key: 'designation', label: 'Désignation' },
    { key: 'etat', label: 'Etat', render: (v) => <EtatProduitBadge value={v} /> },
    { key: 'statut', label: 'Statut', render: (v) => <StatutStockBadge value={v} /> },
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ReportTable
                    title="Etat 5 Derniers Règlements Fournisseur"
                    icon={Banknote}
                    columns={fournisseurColumns}
                    rows={tables?.etat_reglements_fournisseur}
                    loading={loading}
                    accent="from-brand-navy via-blue-800 to-blue-900"
                    compact
                />

                <ReportTable
                    title="Etat 5 Derniers Règlement Client"
                    icon={Wallet}
                    columns={clientColumns}
                    rows={tables?.etat_reglements_client}
                    loading={loading}
                    accent="from-emerald-600 via-teal-600 to-green-800"
                    compact
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ReportTable
                    title="Etat 5 Produits Actifs"
                    icon={Package}
                    columns={produitsActifsColumns}
                    rows={tables?.etat_produits_actifs}
                    loading={loading}
                    accent="from-amber-500 via-orange-500 to-orange-700"
                    compact
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
