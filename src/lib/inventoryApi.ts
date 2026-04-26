import type { InventoryItem } from '@/types';
import { apiFetch } from './api';

export interface InventoryLookups {
  items: InventoryItem[];
}

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const json = await apiFetch<{ data: InventoryItem[] }>('/api/inventory/items');
  return json.data;
}

export async function fetchInventoryLookups(): Promise<InventoryLookups> {
  const json = await apiFetch<{ data: InventoryLookups }>('/api/lookups/inventory-form');
  return json.data;
}

export async function createInventoryTransaction(body: {
  itemId: string;
  type: 'stock_in' | 'stock_out' | 'damage' | 'loss';
  quantity: number;
  notes?: string;
}): Promise<InventoryItem> {
  const json = await apiFetch<{ data: InventoryItem }>('/api/inventory/transactions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function updateInventoryItem(
  id: string,
  body: Partial<{
    name: string;
    category: string;
    unit: string;
    minStockLevel: number;
    unitCost: number;
    status: 'active' | 'inactive';
  }>
): Promise<InventoryItem> {
  const json = await apiFetch<{ data: InventoryItem }>(`/api/inventory/items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return json.data;
}
