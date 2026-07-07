<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Chantier;
use App\Models\Client;
use App\Models\ClientInvoice;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\MonetaryTransaction;
use App\Models\Payment;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\SupplierInvoice;
use App\Models\Task;
use Illuminate\Support\Facades\DB;

class DashboardApiController extends Controller
{
    public function index()
    {
        $monthStart = now()->startOfMonth();

        $stockDepot = Product::where('status', 'actif')
            ->selectRaw('SUM(quantity_in_stock * COALESCE(NULLIF(purchase_price, 0), unit_price)) as total')
            ->value('total') ?? 0;

        $totalDebit = (float) MonetaryTransaction::where('statut', 'Débit')->sum('amount');
        $creditEnInstance = (float) MonetaryTransaction::where('statut', 'Crédit')->sum('amount');
        $nombreClientsActifs = Client::where('status', 'actif')->count();

        $totalCharges = Expense::sum('amount');

        $chantiersActifs = Chantier::where('status', 'en_cours')->where('archived', false)->count();
        $chantiersTermines = Chantier::where('status', 'termine')->count();

        $depensesMois = Expense::where('expense_date', '>=', $monthStart)->sum('amount')
            + SupplierInvoice::where('invoice_date', '>=', $monthStart)->sum('total_ttc')
            + Employee::where('status', 'actif')->sum('monthly_salary');

        $achatsMois = PurchaseOrder::where('order_date', '>=', $monthStart)
            ->whereIn('status', ['valide', 'livre'])
            ->sum('total_ttc');

        $stockDisponible = Product::where('status', 'actif')
            ->selectRaw('SUM(quantity_in_stock * COALESCE(purchase_price, unit_price)) as total')
            ->value('total') ?? 0;

        $facturesImpayees = ClientInvoice::whereIn('status', ['en_attente', 'partielle', 'en_retard'])
            ->selectRaw('COUNT(*) as count, SUM(total_ttc - amount_paid) as amount')
            ->first();

        $chargesMensuelles = Expense::where('expense_date', '>=', $monthStart)->sum('amount');

        $recettesMois = ClientInvoice::where('invoice_date', '>=', $monthStart)->sum('total_ttc');
        $benefices = $recettesMois - $depensesMois;

        $stockFaible = Product::where('status', 'actif')
            ->whereColumn('quantity_in_stock', '<=', 'min_stock_alert')
            ->count();

        $personnelPresent = Attendance::whereDate('date', today())
            ->where('status', 'present')
            ->count();

        $expensesChart = Expense::select(
            DB::raw('MONTH(expense_date) as month'),
            DB::raw('SUM(amount) as total')
        )->whereYear('expense_date', now()->year)
            ->groupBy('month')->orderBy('month')->get();

        $revenueChart = ClientInvoice::select(
            DB::raw('MONTH(invoice_date) as month'),
            DB::raw('SUM(total_ttc) as total')
        )->whereYear('invoice_date', now()->year)
            ->groupBy('month')->orderBy('month')->get();

        $purchasesChart = PurchaseOrder::select(
            DB::raw('MONTH(order_date) as month'),
            DB::raw('SUM(total_ttc) as total')
        )->whereYear('order_date', now()->year)
            ->whereIn('status', ['valide', 'livre'])
            ->groupBy('month')->orderBy('month')->get();

        $chargesBreakdown = Expense::select('category', DB::raw('SUM(amount) as total'))
            ->where('expense_date', '>=', $monthStart)
            ->groupBy('category')->get();

        $chantiersEnCours = Chantier::with('client')
            ->where('status', 'en_cours')->where('archived', false)
            ->orderByDesc('progress')->limit(6)->get();

        $tachesRetard = Task::with(['chantier', 'assignee'])
            ->where('status', 'en_retard')
            ->orWhere(function ($q) {
                $q->whereIn('status', ['a_faire', 'en_cours'])
                    ->where('due_date', '<', now());
            })
            ->limit(8)->get();

        $calendrier = Chantier::where('archived', false)
            ->whereNotNull('start_date')
            ->select('id', 'name', 'reference', 'start_date', 'end_date', 'status', 'city')
            ->get();

        $etatReglementsFournisseur = Payment::where('type', 'fournisseur')
            ->with(['payable.supplier'])
            ->latest('payment_date')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'date' => $p->payment_date?->format('d/m/Y'),
                'fournisseur' => $p->payable instanceof SupplierInvoice
                    ? ($p->payable->supplier?->name ?? '—')
                    : '—',
                'type_regl' => $this->formatPaymentMethod($p->method),
                'numero' => $p->reference ?? ($p->payable instanceof SupplierInvoice ? $p->payable->reference : '—'),
                'montant' => round((float) $p->amount, 2),
                'date_decaiss' => $p->payment_date?->format('d/m/Y'),
            ]);

        if ($etatReglementsFournisseur->isEmpty()) {
            $etatReglementsFournisseur = SupplierInvoice::with('supplier')
                ->latest('invoice_date')
                ->limit(5)
                ->get()
                ->map(fn ($inv) => [
                    'date' => $inv->invoice_date?->format('d/m/Y'),
                    'fournisseur' => $inv->supplier?->name ?? '—',
                    'type_regl' => 'Facture',
                    'numero' => $inv->reference,
                    'montant' => round((float) $inv->total_ttc, 2),
                    'date_decaiss' => $inv->due_date?->format('d/m/Y') ?? '—',
                ]);
        }

        $etatReglementsClient = Payment::where('type', 'client')
            ->with(['payable.client'])
            ->latest('payment_date')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'date' => $p->payment_date?->format('d/m/Y'),
                'client' => $p->payable instanceof ClientInvoice
                    ? ($p->payable->client?->name ?? '—')
                    : '—',
                'type_regl' => $this->formatPaymentMethod($p->method),
                'numero' => $p->reference ?? ($p->payable instanceof ClientInvoice ? $p->payable->reference : '—'),
                'montant' => round((float) $p->amount, 2),
                'date_encaiss' => $p->payment_date?->format('d/m/Y'),
            ]);

        if ($etatReglementsClient->isEmpty()) {
            $etatReglementsClient = ClientInvoice::with('client')
                ->where('amount_paid', '>', 0)
                ->latest('invoice_date')
                ->limit(5)
                ->get()
                ->map(fn ($inv) => [
                    'date' => $inv->invoice_date?->format('d/m/Y'),
                    'client' => $inv->client?->name ?? '—',
                    'type_regl' => 'Facture',
                    'numero' => $inv->reference,
                    'montant' => round((float) $inv->amount_paid, 2),
                    'date_encaiss' => $inv->invoice_date?->format('d/m/Y') ?? '—',
                ]);
        }

        $etatProduitsActifs = Product::where('status', 'actif')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'ref' => $p->reference,
                'designation' => $p->name,
                'etat' => $this->mapProductStatut($p),
                'statut' => $this->mapProductEtat($p),
            ]);

        $etatCharges = Expense::with('chantier')
            ->latest('expense_date')
            ->limit(25)
            ->get()
            ->map(fn ($e) => [
                'date' => $e->expense_date?->format('d/m/Y'),
                'designation' => $e->description ?? ucfirst(str_replace('_', ' ', $e->category)),
                'montant' => round((float) $e->amount, 2),
                'destination' => $e->chantier?->name ?? 'Général',
            ]);

        return response()->json([
            'kpis' => [
                'total_debit' => round($totalDebit, 2),
                'credit_en_instance' => round($creditEnInstance, 2),
                'valeur_stock_depot' => round($stockDepot, 2),
                'total_charges' => round($totalCharges, 2),
                'nombre_clients_actifs' => $nombreClientsActifs,
                'chantiers_actifs' => $chantiersActifs,
                'chantiers_termines' => $chantiersTermines,
                'depenses_mois' => round($depensesMois, 2),
                'achats_mois' => round($achatsMois, 2),
                'stock_disponible' => round($stockDisponible, 2),
                'factures_impayees_count' => $facturesImpayees->count ?? 0,
                'factures_impayees_amount' => round($facturesImpayees->amount ?? 0, 2),
                'charges_mensuelles' => round($chargesMensuelles, 2),
                'benefices' => round($benefices, 2),
                'stock_faible' => $stockFaible,
                'personnel_present' => $personnelPresent,
            ],
            'charts' => [
                'expenses' => $expensesChart,
                'revenue' => $revenueChart,
                'purchases' => $purchasesChart,
                'charges_breakdown' => $chargesBreakdown,
            ],
            'chantiers' => $chantiersEnCours,
            'taches_retard' => $tachesRetard,
            'calendrier' => $calendrier,
            'tables' => [
                'etat_reglements_fournisseur' => $etatReglementsFournisseur->values(),
                'etat_reglements_client' => $etatReglementsClient->values(),
                'etat_produits_actifs' => $etatProduitsActifs->values(),
                'etat_charges' => $etatCharges->values(),
            ],
        ]);
    }

    private function formatPaymentMethod(?string $method): string
    {
        return match ($method) {
            'especes' => 'Espèces',
            'cheque' => 'Chèque',
            'virement' => 'Virement',
            'carte' => 'Carte',
            default => $method ? ucfirst($method) : '—',
        };
    }

    private function mapProductStatut(?Product $product): string
    {
        if (! $product) {
            return '—';
        }

        return $product->status === 'actif' ? 'Actif' : 'Inactif';
    }

    private function mapProductEtat(?Product $product): string
    {
        if (! $product) {
            return '—';
        }

        return $product->etatLabel();
    }
}
