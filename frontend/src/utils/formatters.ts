import axios from 'axios';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'R$ 0,00';
  }
  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'R$ 0';
  }
  return compactCurrencyFormatter.format(value);
}

export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0';
  }
  return integerFormatter.format(value);
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) {
    return '—';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return dateTimeFormatter.format(date);
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) {
    return '—';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return dateFormatter.format(date);
}

export function formatCpf(cpf: string | null | undefined): string {
  if (!cpf) {
    return 'Não informado';
  }
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) {
    return cpf;
  }
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

interface LaravelErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export function extractApiErrorMessage(
  error: unknown,
  fallback = 'Não foi possível carregar os dados. Verifique se a API está em execução.',
): string {
  if (axios.isCancel(error)) {
    return '';
  }

  if (axios.isAxiosError<LaravelErrorResponse>(error)) {
    if (!error.response) {
      return 'Não foi possível conectar à API. Verifique se o backend Laravel está rodando em http://localhost.';
    }

    const data = error.response.data;
    if (data?.errors) {
      const firstFieldErrors = Object.values(data.errors).flat();
      if (firstFieldErrors.length > 0) {
        return firstFieldErrors[0];
      }
    }

    if (data?.message) {
      return data.message;
    }

    return `Erro ao comunicar com o servidor (HTTP ${error.response.status}).`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
