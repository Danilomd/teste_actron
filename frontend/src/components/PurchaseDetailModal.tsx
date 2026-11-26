import {
  Calendar,
  CreditCard,
  FileText,
  Hash,
  Mail,
  Package,
  User,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import type { Purchase } from '../types';
import {
  formatCpf,
  formatCurrency,
  formatDateTime,
  formatInteger,
} from '../utils/formatters';

interface PurchaseDetailModalProps {
  purchase: Purchase | null;
  onClose: () => void;
}

export function PurchaseDetailModal({
  purchase,
  onClose,
}: PurchaseDetailModalProps) {
  useEffect(() => {
    if (!purchase) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [purchase, onClose]);

  if (!purchase) {
    return null;
  }

  const items = purchase.items ?? [];
  const itemsGrossTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-detail-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-700 ring-1 ring-indigo-600/15">
                <Hash className="h-3.5 w-3.5" />
                {purchase.reference_code}
              </span>
              <span className="text-xs text-slate-400">ID #{purchase.id}</span>
            </div>
            <h2
              id="purchase-detail-title"
              className="mt-2 text-lg font-bold text-slate-900"
            >
              Detalhes da Compra
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Realizada em {formatDateTime(purchase.purchased_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">
              <User className="h-3.5 w-3.5 text-indigo-600" />
              Dados do Cliente
            </h3>

            {purchase.customer ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Nome</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {purchase.customer.name}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    E-mail
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-slate-700">
                    <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="truncate">{purchase.customer.email}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">CPF</p>
                  <p className="mt-0.5 font-mono text-xs font-medium text-slate-700">
                    {formatCpf(purchase.customer.cpf)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Informações do cliente indisponíveis.
              </p>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">
                <Package className="h-3.5 w-3.5 text-indigo-600" />
                Itens da Compra ({formatInteger(items.length)})
              </h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                {formatInteger(totalQuantity)} unidade(s) no total
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200/80">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <tr className="border-b border-slate-200/80">
                    <th className="py-3 pr-3 pl-4">Produto</th>
                    <th className="px-3 py-3 text-right">Qtd.</th>
                    <th className="px-3 py-3 text-right">Valor Unit.</th>
                    <th className="py-3 pr-4 pl-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        Nenhum item vinculado a esta compra.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-3 pl-4">
                          <p className="font-semibold text-slate-900">
                            {item.product?.name ?? `Produto #${item.product_id}`}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            ID do Produto: #{item.product_id}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700 tabular-nums">
                          {formatInteger(item.quantity)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600 tabular-nums">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 pr-4 pl-3 text-right font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">
              <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
              Resumo Financeiro
            </h3>

            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <dt>Subtotal dos produtos</dt>
                <dd className="font-medium tabular-nums">
                  {formatCurrency(itemsGrossTotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between text-amber-700">
                <dt>Desconto aplicado</dt>
                <dd className="font-medium tabular-nums">
                  - {formatCurrency(purchase.discount)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-900">
                <dt>Valor Total Pago</dt>
                <dd className="text-emerald-700 tabular-nums">
                  {formatCurrency(purchase.total_amount)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Observações
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {purchase.notes?.trim()
                ? purchase.notes
                : 'Nenhuma observação registrada para esta transação.'}
            </p>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-3.5">
          <p className="text-[11px] text-slate-400">
            Criado em {formatDateTime(purchase.created_at)}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
