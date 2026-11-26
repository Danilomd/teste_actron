import {
  BadgePercent,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { DashboardMetrics } from '../types';
import { formatCurrency, formatInteger } from '../utils/formatters';

interface KpiCardsProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-10 w-10 rounded-xl bg-slate-100" />
          </div>
          <div className="mt-4 h-8 w-40 rounded bg-slate-200" />
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="h-3.5 w-24 rounded bg-slate-100" />
            <div className="h-4 w-20 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function KpiCards({ metrics, loading }: KpiCardsProps) {
  if (loading && !metrics) {
    return <KpiSkeleton />;
  }

  const totalPurchasesCount = metrics?.total_purchases_count ?? 0;
  const totalPurchasesAmount = metrics?.total_purchases_amount ?? 0;
  const averagePurchasesAmount = metrics?.average_purchases_amount ?? 0;
  const totalDiscountsAmount = metrics?.total_discounts_amount ?? 0;
  const averageDiscountsAmount = metrics?.average_discounts_amount ?? 0;
  const totalProductsAmount = metrics?.total_products_amount ?? 0;
  const averageProductsAmount = metrics?.average_products_amount ?? 0;

  const discountRate =
    totalProductsAmount > 0
      ? ((totalDiscountsAmount / totalProductsAmount) * 100).toFixed(1)
      : '0.0';

  const uniqueCustomers = metrics?.purchases_by_customer.length ?? 0;
  const uniqueProducts = metrics?.purchases_by_product.length ?? 0;

  return (
    <section id="kpis" aria-label="Métricas principais" className="scroll-mt-24">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:border-indigo-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Quantidade de Compras
              </p>
              <p className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {formatInteger(totalPurchasesCount)}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-600/10">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">Base ativa no período</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
              {formatInteger(uniqueCustomers)} clientes •{' '}
              {formatInteger(uniqueProducts)} prod.
            </span>
          </div>
        </article>

        <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:border-emerald-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Valor Total de Compras
              </p>
              <p className="mt-2.5 truncate text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-[26px]">
                {formatCurrency(totalPurchasesAmount)}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Ticket médio
            </span>
            <span className="font-semibold text-emerald-700 tabular-nums">
              {formatCurrency(averagePurchasesAmount)}
            </span>
          </div>
        </article>

        <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:border-amber-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Valor Total de Descontos
              </p>
              <p className="mt-2.5 truncate text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-[26px]">
                {formatCurrency(totalDiscountsAmount)}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-600/10">
              <BadgePercent className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">
              Desconto médio ({discountRate}% bruto)
            </span>
            <span className="font-semibold text-amber-700 tabular-nums">
              {formatCurrency(averageDiscountsAmount)}
            </span>
          </div>
        </article>

        <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:border-blue-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Valor Total de Produtos
              </p>
              <p className="mt-2.5 truncate text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-[26px]">
                {formatCurrency(totalProductsAmount)}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-600/10">
              <Package className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">Valor médio por item</span>
            <span className="font-semibold text-blue-700 tabular-nums">
              {formatCurrency(averageProductsAmount)}
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}
