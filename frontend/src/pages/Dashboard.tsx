import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { KpiCards } from '../components/KpiCards';
import { PurchaseDetailModal } from '../components/PurchaseDetailModal';
import { PurchaseFiltersBar } from '../components/PurchaseFiltersBar';
import { PurchasesTable } from '../components/PurchasesTable';
import { RankingsSection } from '../components/RankingsSection';
import { ErrorBanner } from '../components/StateFeedback';
import { API_BASE_URL, getDashboardMetrics, getPurchases } from '../services/api';
import type { DashboardMetrics, PaginationMeta, Purchase } from '../types';
import { extractApiErrorMessage } from '../utils/formatters';
import {
  INITIAL_FILTER_FORM_STATE,
  formStateToApiFilters,
  type PurchaseFilterFormState,
} from '../utils/purchaseFilters';

const AUTO_REFRESH_INTERVAL_MS = 10_000;

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null,
  );
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);

  const [filterForm, setFilterForm] = useState<PurchaseFilterFormState>(
    INITIAL_FILTER_FORM_STATE,
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null,
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshState, setRefreshState] = useState({ count: 0, silent: false });
  const [dashboardBgRefreshing, setDashboardBgRefreshing] = useState(false);
  const [purchasesBgRefreshing, setPurchasesBgRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const purchasesSectionRef = useRef<HTMLElement | null>(null);
  const lastQuerySignatureRef = useRef<string>('');

  const appliedApiFilters = useMemo(
    () => formStateToApiFilters(filterForm),
    [filterForm],
  );

  const activeFilterCount = useMemo(
    () => Object.keys(appliedApiFilters).length,
    [appliedApiFilters],
  );

  // Atualiza os dados em segundo plano a cada 10s enquanto a aba estiver ativa
  useEffect(() => {
    if (!autoRefreshEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      setRefreshState((prev) => ({ count: prev.count + 1, silent: true }));
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [autoRefreshEnabled, refreshState.count]);

  useEffect(() => {
    const controller = new AbortController();
    const isSilent = refreshState.silent && refreshState.count > 0;

    async function loadDashboard() {
      if (isSilent) {
        setDashboardBgRefreshing(true);
      } else {
        setDashboardLoading(true);
      }
      setDashboardError(null);

      try {
        const data = await getDashboardMetrics(controller.signal);
        setMetrics(data);
        setLastUpdated(new Date());
      } catch (error) {
        if (axios.isCancel(error)) return;
        setDashboardError(extractApiErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) {
          setDashboardLoading(false);
          setDashboardBgRefreshing(false);
        }
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [refreshState]);

  useEffect(() => {
    const controller = new AbortController();
    const querySignature = JSON.stringify({ appliedApiFilters, page, perPage });
    const isQueryChange = lastQuerySignatureRef.current !== querySignature;
    lastQuerySignatureRef.current = querySignature;
    const isSilent =
      !isQueryChange && refreshState.silent && refreshState.count > 0;

    async function loadPurchases() {
      if (isSilent) {
        setPurchasesBgRefreshing(true);
      } else {
        setPurchasesLoading(true);
      }
      setPurchasesError(null);

      try {
        const response = await getPurchases(
          {
            ...appliedApiFilters,
            page,
            per_page: perPage,
          },
          controller.signal,
        );
        setPurchases(response.data);
        setPaginationMeta(response.meta);
        setLastUpdated(new Date());
      } catch (error) {
        if (axios.isCancel(error)) return;
        setPurchasesError(extractApiErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) {
          setPurchasesLoading(false);
          setPurchasesBgRefreshing(false);
        }
      }
    }

    void loadPurchases();
    return () => controller.abort();
  }, [appliedApiFilters, page, perPage, refreshState]);

  const handleRefreshAll = useCallback(() => {
    setRefreshState((prev) => ({ count: prev.count + 1, silent: false }));
  }, []);

  const handleToggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  const handleApplyFilters = useCallback((nextForm: PurchaseFilterFormState) => {
    setFilterForm(nextForm);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterForm(INITIAL_FILTER_FORM_STATE);
    setPage(1);
  }, []);

  const handlePerPageChange = useCallback((nextPerPage: number) => {
    setPerPage(nextPerPage);
    setPage(1);
  }, []);

  const handleFilterByCustomerFromRanking = useCallback((customerQuery: string) => {
    setFilterForm({
      ...INITIAL_FILTER_FORM_STATE,
      customer: customerQuery,
    });
    setPage(1);
    purchasesSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        lastUpdated={lastUpdated}
        isRefreshing={
          dashboardLoading ||
          purchasesLoading ||
          dashboardBgRefreshing ||
          purchasesBgRefreshing
        }
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={handleToggleAutoRefresh}
        onRefresh={handleRefreshAll}
      />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:px-6 lg:px-8">
        {dashboardError && (
          <ErrorBanner
            title="Falha ao carregar métricas do dashboard"
            message={dashboardError}
            onRetry={handleRefreshAll}
          />
        )}

        <KpiCards metrics={metrics} loading={dashboardLoading} />

        <RankingsSection
          customers={metrics?.purchases_by_customer ?? []}
          products={metrics?.purchases_by_product ?? []}
          loading={dashboardLoading}
          onSelectCustomerFilter={handleFilterByCustomerFromRanking}
        />

        <section
          id="purchases"
          ref={purchasesSectionRef}
          aria-label="Listagem de transações de compra"
          className="scroll-mt-24 space-y-4"
        >
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Transações de Compra
            </h2>
            <p className="text-xs text-slate-500">
              Consulte, filtre e inspecione os itens detalhados de cada compra
              registrada
            </p>
          </div>

          <PurchaseFiltersBar
            value={filterForm}
            activeFilterCount={activeFilterCount}
            loading={purchasesLoading}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />

          {purchasesError && (
            <ErrorBanner
              title="Falha ao carregar listagem de compras"
              message={purchasesError}
              onRetry={handleRefreshAll}
            />
          )}

          <PurchasesTable
            purchases={purchases}
            meta={paginationMeta}
            loading={purchasesLoading}
            perPage={perPage}
            hasActiveFilters={activeFilterCount > 0}
            onPageChange={setPage}
            onPerPageChange={handlePerPageChange}
            onSelectPurchase={setSelectedPurchase}
            onClearFilters={handleClearFilters}
          />
        </section>
      </main>

      <footer className="mt-10 border-t border-slate-200/70 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>Actron Analytics • Dashboard de Transações de Compra</p>
          <p className="font-mono text-[11px] text-slate-400">
            API: {API_BASE_URL}
          </p>
        </div>
      </footer>

      <PurchaseDetailModal
        purchase={selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
      />
    </div>
  );
}
