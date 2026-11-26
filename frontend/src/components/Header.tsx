import { Clock, RefreshCw } from 'lucide-react';
import actronLogo from '../assets/actron-logo.png';

interface HeaderProps {
  lastUpdated: Date | null;
  isRefreshing: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
}

export function Header({
  lastUpdated,
  isRefreshing,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onRefresh,
}: HeaderProps) {
  const formattedTime = lastUpdated
    ? new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(lastUpdated)
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src={actronLogo}
            alt="Actron"
            className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm shadow-indigo-600/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Actron Analytics
              </h1>
              <span className="hidden rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-600/15 sm:inline-flex">
                BI • Compras
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Painel executivo de transações, receita, descontos e performance
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <nav
            aria-label="Seções do painel"
            className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 md:flex"
          >
            <a
              href="#kpis"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              Indicadores
            </a>
            <a
              href="#rankings"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              Rankings
            </a>
            <a
              href="#purchases"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              Transações
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {formattedTime && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Atualizado às {formattedTime}
              </span>
            )}

            <div className="inline-flex items-center divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`}
                />
                Atualizar
              </button>

              <button
                type="button"
                onClick={onToggleAutoRefresh}
                aria-pressed={autoRefreshEnabled}
                aria-label={
                  autoRefreshEnabled
                    ? 'Pausar atualização automática'
                    : 'Ativar atualização automática'
                }
                title={
                  autoRefreshEnabled
                    ? 'Atualização automática ativa (a cada 10s) - clique para pausar'
                    : 'Atualização automática pausada - clique para ativar'
                }
                className="inline-flex self-stretch items-center justify-center px-2.5 transition hover:bg-slate-50 cursor-pointer"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    autoRefreshEnabled
                      ? 'animate-pulse bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
