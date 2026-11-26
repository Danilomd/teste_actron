import { Calendar, DollarSign, Filter, Hash, RotateCcw, Search, User } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import {
  INITIAL_FILTER_FORM_STATE,
  type PurchaseFilterFormState,
} from '../utils/purchaseFilters';

interface PurchaseFiltersBarProps {
  value: PurchaseFilterFormState;
  activeFilterCount: number;
  loading: boolean;
  onApply: (nextState: PurchaseFilterFormState) => void;
  onClear: () => void;
}

export function PurchaseFiltersBar({
  value,
  activeFilterCount,
  loading,
  onApply,
  onClear,
}: PurchaseFiltersBarProps) {
  const [draft, setDraft] = useState<PurchaseFilterFormState>(value);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value);
    setValidationError(null);
  }, [value]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      draft.dateMode === 'range' &&
      draft.start_date &&
      draft.end_date &&
      draft.end_date < draft.start_date
    ) {
      setValidationError(
        'A data final deve ser igual ou posterior à data inicial.',
      );
      return;
    }

    if (
      draft.amountMode === 'range' &&
      draft.min_amount !== '' &&
      draft.max_amount !== '' &&
      Number(draft.max_amount) < Number(draft.min_amount)
    ) {
      setValidationError(
        'O valor máximo deve ser maior ou igual ao valor mínimo.',
      );
      return;
    }

    setValidationError(null);
    onApply(draft);
  };

  const handleReset = () => {
    setDraft(INITIAL_FILTER_FORM_STATE);
    setValidationError(null);
    onClear();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Filtros de Transações
          </h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-600/15">
              {activeFilterCount} ativo(s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading && activeFilterCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            Filtrar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <label
            htmlFor="filter-reference-code"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
          >
            <Hash className="h-3.5 w-3.5 text-slate-400" />
            Código de Referência
          </label>
          <input
            id="filter-reference-code"
            type="text"
            value={draft.reference_code}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, reference_code: e.target.value }))
            }
            placeholder="Ex.: REF-2026-001"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="filter-customer"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
          >
            <User className="h-3.5 w-3.5 text-slate-400" />
            Cliente (Nome, E-mail ou CPF)
          </label>
          <input
            id="filter-customer"
            type="text"
            value={draft.customer}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, customer: e.target.value }))
            }
            placeholder="Ex.: Maria, maria@email.com ou CPF"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Data da Compra
            </span>
            <div className="inline-flex rounded-md bg-slate-100 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, dateMode: 'range', date: '' }))
                }
                className={`rounded px-2 py-0.5 font-medium transition cursor-pointer ${
                  draft.dateMode === 'range'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Período
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    dateMode: 'exact',
                    start_date: '',
                    end_date: '',
                  }))
                }
                className={`rounded px-2 py-0.5 font-medium transition cursor-pointer ${
                  draft.dateMode === 'exact'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Exata
              </button>
            </div>
          </div>

          {draft.dateMode === 'exact' ? (
            <input
              aria-label="Data exata da compra"
              type="date"
              value={draft.date}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <input
                aria-label="Data inicial"
                type="date"
                value={draft.start_date}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, start_date: e.target.value }))
                }
                title="Data inicial"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
              />
              <input
                aria-label="Data final"
                type="date"
                value={draft.end_date}
                min={draft.start_date || undefined}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, end_date: e.target.value }))
                }
                title="Data final"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
              Valor Total (R$)
            </span>
            <div className="inline-flex rounded-md bg-slate-100 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    amountMode: 'range',
                    amount: '',
                  }))
                }
                className={`rounded px-2 py-0.5 font-medium transition cursor-pointer ${
                  draft.amountMode === 'range'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Faixa
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    amountMode: 'exact',
                    min_amount: '',
                    max_amount: '',
                  }))
                }
                className={`rounded px-2 py-0.5 font-medium transition cursor-pointer ${
                  draft.amountMode === 'exact'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Exato
              </button>
            </div>
          </div>

          {draft.amountMode === 'exact' ? (
            <input
              aria-label="Valor exato"
              type="number"
              min="0"
              step="0.01"
              value={draft.amount}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, amount: e.target.value }))
              }
              placeholder="Ex.: 250.00"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <input
                aria-label="Valor mínimo"
                type="number"
                min="0"
                step="0.01"
                value={draft.min_amount}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, min_amount: e.target.value }))
                }
                placeholder="Mínimo"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
              />
              <input
                aria-label="Valor máximo"
                type="number"
                min="0"
                step="0.01"
                value={draft.max_amount}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, max_amount: e.target.value }))
                }
                placeholder="Máximo"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {validationError && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
          {validationError}
        </p>
      )}
    </form>
  );
}
