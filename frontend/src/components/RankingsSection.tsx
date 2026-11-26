import {
  ArrowUpRight,
  BarChart2,
  Package,
  Search,
  Table2,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  CustomerPurchaseSummary,
  ProductPurchaseSummary,
} from '../types';
import {
  formatCompactCurrency,
  formatCpf,
  formatCurrency,
  formatInteger,
} from '../utils/formatters';
import { EmptyState } from './StateFeedback';

interface RankingsSectionProps {
  customers: CustomerPurchaseSummary[];
  products: ProductPurchaseSummary[];
  loading: boolean;
  onSelectCustomerFilter?: (customerQuery: string) => void;
}

const CUSTOMER_BAR_COLORS = [
  '#4f46e5',
  '#6366f1',
  '#818cf8',
  '#a5b4fc',
  '#c7d2fe',
];

const PRODUCT_BAR_COLORS = [
  '#0ea5e9',
  '#0284c7',
  '#38bdf8',
  '#7dd3fc',
  '#bae6fd',
];

function truncateLabel(text: string, maxLength = 18): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function RankingsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-44 rounded bg-slate-200" />
            <div className="h-8 w-28 rounded-lg bg-slate-100" />
          </div>
          <div className="mt-5 h-44 w-full rounded-xl bg-slate-100" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((__, rowIdx) => (
              <div key={rowIdx} className="h-10 w-full rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RankingsSection({
  customers,
  products,
  loading,
  onSelectCustomerFilter,
}: RankingsSectionProps) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showCharts, setShowCharts] = useState(true);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        (item.cpf ?? '').toLowerCase().includes(query),
    );
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter((item) => item.name.toLowerCase().includes(query));
  }, [products, productSearch]);

  const topCustomersChartData = useMemo(
    () =>
      customers.slice(0, 5).map((c) => ({
        name: truncateLabel(c.name, 16),
        fullName: c.name,
        total_amount: c.total_amount,
        average_amount: c.average_amount,
      })),
    [customers],
  );

  const topProductsChartData = useMemo(
    () =>
      products.slice(0, 5).map((p) => ({
        name: truncateLabel(p.name, 16),
        fullName: p.name,
        total_amount: p.total_amount,
        total_quantity: p.total_quantity,
      })),
    [products],
  );

  if (loading && customers.length === 0 && products.length === 0) {
    return <RankingsSkeleton />;
  }

  return (
    <section
      id="rankings"
      aria-label="Rankings por cliente e produto"
      className="scroll-mt-24 space-y-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Análise & Rankings de Performance
          </h2>
          <p className="text-xs text-slate-500">
            Consolidado de faturamento e ticket médio agrupado por cliente e por
            produto
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCharts((prev) => !prev)}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
        >
          {showCharts ? (
            <>
              <Table2 className="h-3.5 w-3.5 text-slate-500" />
              Ocultar gráficos
            </>
          ) : (
            <>
              <BarChart2 className="h-3.5 w-3.5 text-indigo-600" />
              Exibir gráficos Top 5
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Compras por Cliente
                </h3>
                <p className="text-xs text-slate-500">
                  {formatInteger(customers.length)} cliente(s) com compras
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pr-3 pl-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
              />
            </div>
          </div>

          {showCharts && topCustomersChartData.length > 0 && (
            <div className="border-b border-slate-100 bg-slate-50/40 px-4 pt-4 pb-2">
              <p className="mb-2 px-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Top 5 Clientes por Valor Total
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCustomersChartData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) => formatCompactCurrency(v)}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={116}
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      formatter={(value: number) => [
                        formatCurrency(value),
                        'Valor Total',
                      ]}
                      labelFormatter={(_label, payload) =>
                        (payload?.[0]?.payload as { fullName?: string })
                          ?.fullName ?? ''
                      }
                      contentStyle={{
                        borderRadius: '10px',
                        borderColor: '#e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                      }}
                    />
                    <Bar
                      dataKey="total_amount"
                      radius={[0, 6, 6, 0]}
                      barSize={18}
                    >
                      {topCustomersChartData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            CUSTOMER_BAR_COLORS[idx % CUSTOMER_BAR_COLORS.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-x-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Nenhum cliente encontrado"
                  description={
                    customerSearch
                      ? 'Nenhum cliente corresponde ao termo pesquisado.'
                      : 'Ainda não há dados consolidados por cliente.'
                  }
                />
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 text-[11px] font-semibold tracking-wide text-slate-500 uppercase backdrop-blur-xs">
                    <tr className="border-b border-slate-200/80">
                      <th className="py-3 pr-3 pl-5">Cliente</th>
                      <th className="px-3 py-3">CPF</th>
                      <th className="px-3 py-3 text-right">Valor Total</th>
                      <th className="py-3 pr-5 pl-3 text-right">Valor Médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((customer, index) => (
                      <tr
                        key={customer.customer_id}
                        className="group transition hover:bg-indigo-50/40"
                      >
                        <td className="py-3 pr-3 pl-5">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="truncate font-semibold text-slate-900">
                                  {customer.name}
                                </span>
                                {onSelectCustomerFilter && (
                                  <button
                                    type="button"
                                    title={`Filtrar compras de ${customer.name}`}
                                    onClick={() =>
                                      onSelectCustomerFilter(customer.email)
                                    }
                                    className="rounded p-0.5 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-indigo-100 hover:text-indigo-700 cursor-pointer"
                                  >
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="truncate text-[11px] text-slate-500">
                                {customer.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap text-slate-600">
                          {formatCpf(customer.cpf)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold whitespace-nowrap text-slate-900 tabular-nums">
                          {formatCurrency(customer.total_amount)}
                        </td>
                        <td className="py-3 pr-5 pl-3 text-right font-medium whitespace-nowrap text-slate-600 tabular-nums">
                          {formatCurrency(customer.average_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Compras por Produto
                </h3>
                <p className="text-xs text-slate-500">
                  {formatInteger(products.length)} produto(s) comercializado(s)
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pr-3 pl-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/15 focus:outline-none"
              />
            </div>
          </div>

          {showCharts && topProductsChartData.length > 0 && (
            <div className="border-b border-slate-100 bg-slate-50/40 px-4 pt-4 pb-2">
              <p className="mb-2 px-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Top 5 Produtos por Faturamento
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsChartData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) => formatCompactCurrency(v)}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={116}
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      formatter={(value: number) => [
                        formatCurrency(value),
                        'Valor Total',
                      ]}
                      labelFormatter={(_label, payload) => {
                        const row = payload?.[0]?.payload as
                          | { fullName?: string; total_quantity?: number }
                          | undefined;
                        return row
                          ? `${row.fullName} (${formatInteger(row.total_quantity)} un.)`
                          : '';
                      }}
                      contentStyle={{
                        borderRadius: '10px',
                        borderColor: '#e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                      }}
                    />
                    <Bar
                      dataKey="total_amount"
                      radius={[0, 6, 6, 0]}
                      barSize={18}
                    >
                      {topProductsChartData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            PRODUCT_BAR_COLORS[idx % PRODUCT_BAR_COLORS.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-x-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Nenhum produto encontrado"
                  description={
                    productSearch
                      ? 'Nenhum produto corresponde ao termo pesquisado.'
                      : 'Ainda não há dados consolidados por produto.'
                  }
                />
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 text-[11px] font-semibold tracking-wide text-slate-500 uppercase backdrop-blur-xs">
                    <tr className="border-b border-slate-200/80">
                      <th className="py-3 pr-3 pl-5">Produto</th>
                      <th className="px-3 py-3 text-right">Qtd. Vendida</th>
                      <th className="px-3 py-3 text-right">Valor Total</th>
                      <th className="py-3 pr-5 pl-3 text-right">Valor Médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={product.product_id}
                        className="group transition hover:bg-sky-50/40"
                      >
                        <td className="py-3 pr-3 pl-5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 tabular-nums">
                            {formatInteger(product.total_quantity)} un.
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold whitespace-nowrap text-slate-900 tabular-nums">
                          {formatCurrency(product.total_amount)}
                        </td>
                        <td className="py-3 pr-5 pl-3 text-right font-medium whitespace-nowrap text-slate-600 tabular-nums">
                          {formatCurrency(product.average_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
