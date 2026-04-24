import type { Delivery } from '@/types';
import { apiFetch } from './api';

export interface DeliveryLookupData {
  customers: Array<{ id: string; customerId: string; name: string; area: string; status: string }>;
  workers: Array<{ id: string; name: string; assignedArea: string }>;
  products: Array<{ id: string; name: string; defaultPrice: number; status: string }>;
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
