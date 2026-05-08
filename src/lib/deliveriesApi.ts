import type { Delivery } from '@/types';
import { apiFetch } from './api';

export interface DeliveryLookupData {
  customers: Array<{ id: string; customerId: string; name: string; area: string; status: string; walletBalance: number }>;
  workers: Array<{ id: string; name: string; assignedArea: string }>;
  products: Array<{ id: string; name: string; defaultPrice: number; status: string; unit?: string }>;
}

export async function fetchDeliveries(): Promise<Delivery[]> {
  const json = await apiFetch<{ data: Delivery[] }>('/api/deliveries');
  return json.data;
}

export async function fetchDeliveryLookups(): Promise<DeliveryLookupData> {
  const json = await apiFetch<{ data: DeliveryLookupData }>('/api/lookups/delivery-form');
  return json.data;
}

export async function createDelivery(body: {
  customerId: string;
  workerId: string;
  requireQrVerification?: boolean;
  qrToken?: string;
  status: string;
  paymentStatus: string;
  walletDeduction?: number;
  deliveryDate: string;
  deliveryTime?: string;
  periodStartDate?: string;
  periodEndDate?: string;
  advanceAmount?: number;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
  }>;
}): Promise<Delivery> {
  const json = await apiFetch<{ data: Delivery }>('/api/deliveries', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function updateDelivery(
  id: string,
  body: Partial<{ status: string; notes: string; deliveryDate: string; workerId: string }>
): Promise<Delivery> {
  const json = await apiFetch<{ data: Delivery }>(`/api/deliveries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchWorkerAssignedDelivery(customerId: string, workerId: string): Promise<Delivery | null> {
  const params = new URLSearchParams({ customerId, workerId });
  const json = await apiFetch<{ data: Delivery | null }>(`/api/deliveries/worker-assigned?${params.toString()}`);
  return json.data;
}

export async function completeDeliveryRuntime(
  id: string,
  body: {
    extraItems?: Array<{ productId: string; quantity: number; unitPrice?: number }>;
    paymentReceivedAmount?: number;
    paymentMethod?: 'cash' | 'bank_transfer' | 'online' | 'card' | 'other';
    referenceId?: string;
    paymentNotes?: string;
    notes?: string;
  }
): Promise<Delivery> {
  const json = await apiFetch<{ data: Delivery }>(`/api/deliveries/${encodeURIComponent(id)}/runtime-complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}
