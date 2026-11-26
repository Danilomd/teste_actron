import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  ReceiptText,
  ShoppingCart,
} from 'lucide-react';
import type { PaginationMeta, Purchase } from '../types';
import {
  formatCpf,
  formatCurrency,
  formatDateTime,
  formatInteger,
} from '../utils/formatters';
import { EmptyState } from './StateFeedback';

interface PurchasesTableProps {
  purchases: Purchase[];
  meta: PaginationMeta | null;
  loading: boolean;
  perPage: number;
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onSelectPurchase: (purchase: Purchase) => void;
  onClearFilters: () => void;
}

function getVisiblePageNumbers(
  currentPage: number,
  lastPage: number,
): Array<number | 'ellipsis'> {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(lastPage - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < lastPage - 2) {
    pages.push('ellipsis');
  }

  pages.push(lastPage);
  return pages;
}

function summarizeProducts(purchase: Purchase): {
  totalUnits: number;
  productNames: string[];
} {
  const items = purchase.items ?? [];
  const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
  const productNames = items.map(
    (item) => item.product?.name ?? `Produto #${item.product_id}`,
  );
  return { totalUnits, productNames };
}

export function PurchasesTable({
  purchases,
  meta,
  loading,
  perPage,
  hasActiveFilters,
  onPageChange,
  onPerPageChange,
  onSelectPurchase,
  onClearFilters,
}: PurchasesTableProps) {
  const currentPage = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;
  const total = meta?.total ?? purchases.length;
  const pageNumbers = getVisiblePageNumbers(currentPage, lastPage);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ReceiptText className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Listagem de Compras
              </h3>
              {loading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
              )}
            </div>
            <p className="text-xs text-slate-500">
              {total > 0
                ? `${formatInteger(total)} transação(ões) encontrada(s)`
                : 'Nenhuma transação encontrada para os critérios atuais'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <label htmlFor="per-page-select" className="font-medium">
            Itens por página:
          </label>
          <select
            id="per-page-select"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {loading && purchases.length === 0 ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-14 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={<ShoppingCart className="h-6 w-6" />}
            title="Nenhuma compra encontrada"
            description={
              hasActiveFilters
                ? 'Tente ajustar ou remover alguns filtros para visualizar outras transações.'
                : 'Nenhuma transação de compra foi registrada até o momento.'
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 cursor-pointer"
                >
                  Limpar filtros
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          {loading && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-white/55 backdrop-blur-[1px]" />
          )}

          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              <tr className="border-b border-slate-200/80">
                <th className="py-3.5 pr-3 pl-5">Código Ref.</th>
                <th className="px-3 py-3.5">Data</th>
                <th className="px-3 py-3.5">Cliente</th>
                <th className="px-3 py-3.5">Produtos</th>
                <th className="px-3 py-3.5 text-right">Desconto</th>
                <th className="px-3 py-3.5 text-right">Valor Total</th>
                <th className="px-3 py-3.5">Observações</th>
                <th className="py-3.5 pr-5 pl-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((purchase) => {
                const { totalUnits, productNames } =
                  summarizeProducts(purchase);
                const visibleNames = productNames.slice(0, 2);
                const remainingCount = productNames.length - visibleNames.length;

                return (
                  <tr
                    key={purchase.id}
                    onClick={() => onSelectPurchase(purchase)}
                    className="group cursor-pointer transition hover:bg-indigo-50/40"
                  >
                    <td className="py-3.5 pr-3 pl-5 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-800 group-hover:bg-indigo-100 group-hover:text-indigo-800">
                        {purchase.reference_code}
                      </span>
                    </td>

                    <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 tabular-nums">
                      {formatDateTime(purchase.purchased_at)}
                    </td>

                    <td className="max-w-[220px] px-3 py-3.5">
                      {purchase.customer ? (
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {purchase.customer.name}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {purchase.customer.email}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            CPF: {formatCpf(purchase.customer.cpf)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="max-w-[240px] px-3 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {formatInteger(totalUnits)} un.
                        </span>
                        <span className="truncate text-slate-700">
                          {visibleNames.length > 0
                            ? visibleNames.join(', ')
                            : 'Sem itens'}
                        </span>
                        {remainingCount > 0 && (
                          <span className="inline-flex shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            +{remainingCount}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-right whitespace-nowrap tabular-nums">
                      {purchase.discount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                          - {formatCurrency(purchase.discount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">R$ 0,00</span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-right font-bold whitespace-nowrap text-slate-900 tabular-nums">
                      {formatCurrency(purchase.total_amount)}
                    </td>

                    <td className="max-w-[180px] px-3 py-3.5">
                      {purchase.notes ? (
                        <span
                          title={purchase.notes}
                          className="inline-flex max-w-full items-center gap-1 truncate text-slate-600"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{purchase.notes}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td className="py-3.5 pr-5 pl-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPurchase(purchase);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-2xs transition group-hover:border-indigo-200 group-hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:flex-row">
          <p className="text-xs text-slate-500">
            Exibindo{' '}
            <span className="font-semibold text-slate-800">
              {meta.from ?? 0}
            </span>{' '}
            a{' '}
            <span className="font-semibold text-slate-800">{meta.to ?? 0}</span>{' '}
            de{' '}
            <span className="font-semibold text-slate-800">
              {formatInteger(meta.total)}
            </span>{' '}
            compras • Página{' '}
            <span className="font-semibold text-slate-800">{currentPage}</span>{' '}
            de <span className="font-semibold text-slate-800">{lastPage}</span>
          </p>

          <nav
            aria-label="Paginação"
            className="flex items-center gap-1.5"
          >
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => onPageChange(currentPage - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>

            <div className="hidden items-center gap-1 sm:flex">
              {pageNumbers.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-xs text-slate-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    disabled={loading}
                    onClick={() => onPageChange(item)}
                    aria-current={item === currentPage ? 'page' : undefined}
                    className={`min-w-[30px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      item === currentPage
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              disabled={currentPage >= lastPage || loading}
              onClick={() => onPageChange(currentPage + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            >
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
