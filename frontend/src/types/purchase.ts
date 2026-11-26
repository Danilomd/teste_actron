export interface Customer {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface PurchaseItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface Purchase {
  id: number;
  reference_code: string;
  discount: number;
  total_amount: number;
  purchased_at: string | null;
  notes: string | null;
  customer?: Customer;
  items?: PurchaseItem[];
  created_at: string | null;
  updated_at: string | null;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: PaginationMetaLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface PurchaseFilters {
  reference_code?: string;
  customer?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  amount?: number | string;
  min_amount?: number | string;
  max_amount?: number | string;
  per_page?: number;
  page?: number;
}
