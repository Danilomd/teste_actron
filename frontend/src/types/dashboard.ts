export interface CustomerPurchaseSummary {
  customer_id: number;
  name: string;
  email: string;
  cpf: string | null;
  total_amount: number;
  average_amount: number;
}

export interface ProductPurchaseSummary {
  product_id: number;
  name: string;
  total_quantity: number;
  total_amount: number;
  average_amount: number;
}

export interface DashboardMetrics {
  total_purchases_count: number;
  total_purchases_amount: number;
  average_purchases_amount: number;
  total_discounts_amount: number;
  average_discounts_amount: number;
  total_products_amount: number;
  average_products_amount: number;
  purchases_by_customer: CustomerPurchaseSummary[];
  purchases_by_product: ProductPurchaseSummary[];
}
