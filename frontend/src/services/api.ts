import axios from 'axios';
import type {
  DashboardMetrics,
  PaginatedResponse,
  Purchase,
  PurchaseFilters,
} from '../types';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

function sanitizeFilterParams(
  filters: PurchaseFilters = {},
): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  (Object.entries(filters) as Array<[keyof PurchaseFilters, unknown]>).forEach(
    ([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== '') {
          params[key] = trimmed;
        }
        return;
      }

      if (typeof value === 'number' && !Number.isNaN(value)) {
        params[key] = value;
      }
    },
  );

  return params;
}

export async function getDashboardMetrics(
  signal?: AbortSignal,
): Promise<DashboardMetrics> {
  const { data } = await api.get<DashboardMetrics>('/dashboard', { signal });
  return data;
}

export async function getPurchases(
  filters: PurchaseFilters = {},
  signal?: AbortSignal,
): Promise<PaginatedResponse<Purchase>> {
  const { data } = await api.get<PaginatedResponse<Purchase>>('/purchases', {
    params: sanitizeFilterParams(filters),
    signal,
  });
  return data;
}
