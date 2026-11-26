import type { PurchaseFilters } from '../types';

export interface PurchaseFilterFormState {
  reference_code: string;
  customer: string;
  dateMode: 'range' | 'exact';
  date: string;
  start_date: string;
  end_date: string;
  amountMode: 'range' | 'exact';
  amount: string;
  min_amount: string;
  max_amount: string;
}

export const INITIAL_FILTER_FORM_STATE: PurchaseFilterFormState = {
  reference_code: '',
  customer: '',
  dateMode: 'range',
  date: '',
  start_date: '',
  end_date: '',
  amountMode: 'range',
  amount: '',
  min_amount: '',
  max_amount: '',
};

export function formStateToApiFilters(
  state: PurchaseFilterFormState,
): PurchaseFilters {
  const filters: PurchaseFilters = {};

  if (state.reference_code.trim()) {
    filters.reference_code = state.reference_code.trim();
  }
  if (state.customer.trim()) {
    filters.customer = state.customer.trim();
  }

  if (state.dateMode === 'exact') {
    if (state.date) {
      filters.date = state.date;
    }
  } else {
    if (state.start_date) {
      filters.start_date = state.start_date;
    }
    if (state.end_date) {
      filters.end_date = state.end_date;
    }
  }

  if (state.amountMode === 'exact') {
    if (state.amount !== '') {
      filters.amount = Number(state.amount);
    }
  } else {
    if (state.min_amount !== '') {
      filters.min_amount = Number(state.min_amount);
    }
    if (state.max_amount !== '') {
      filters.max_amount = Number(state.max_amount);
    }
  }

  return filters;
}
