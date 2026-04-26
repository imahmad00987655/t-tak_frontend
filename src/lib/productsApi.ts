import type { Product } from '@/types';
import { apiFetch } from './api';

export async function fetchProducts(): Promise<Product[]> {
  const json = await apiFetch<{ data: Product[] }>('/api/products');
  return json.data;
}

export async function createProduct(body: {
  name: string;
  description?: string;
  category: string;
  unit: string;
  defaultPrice: number;
  stockQuantity?: number;
  status?: 'active' | 'inactive';
}): Promise<Product> {
  const json = await apiFetch<{ data: Product }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function updateProduct(
  id: string,
  body: Partial<{
    name: string;
    description: string;
    category: string;
    unit: string;
    defaultPrice: number;
    stockQuantity: number;
    status: 'active' | 'inactive';
  }>
): Promise<Product> {
  const json = await apiFetch<{ data: Product }>(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return json.data;
}
