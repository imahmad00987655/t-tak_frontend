import { apiFetch } from './api';
import type { DeliveryItem } from '@/types';

export interface FinanceCustomerLookup {
  id: string;
  customerId: string;
  name: string;
  walletBalance: number;
}

export interface FinanceProductLookup {
  id: string;
  name: string;
  defaultPrice: number;
  status: string;
}

export interface PaymentDto {
  id: string;
  dbId: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'online' | 'card' | 'other';
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface WalletCustomerDto {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  area: string;
  walletBalance: number;
}

export interface InvoiceDto {
  id: string;
  deliveryId: string;
  customerName: string;
  customerId: string;
  area: string;
  workerName: string;
  items: DeliveryItem[];
  totalAmount: number;
  walletDeduction: number;
  amountDue: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  date: string;
}

export async function fetchFinanceLookups(): Promise<{ customers: FinanceCustomerLookup[]; products: FinanceProductLookup[] }> {
  const json = await apiFetch<{
    data: { customers: FinanceCustomerLookup[]; products: FinanceProductLookup[]; supportsWalkIn?: boolean };
  }>('/api/lookups/finance-form');
  return json.data;
}

export async function fetchPayments(filters?: { from?: string; to?: string }): Promise<PaymentDto[]> {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const q = params.toString() ? `?${params.toString()}` : '';
  const json = await apiFetch<{ data: PaymentDto[] }>(`/api/payments${q}`);
  return json.data;
}

export async function recordPayment(body: {
  customerId: string;
  walkInName?: string;
  amount: number;
  items?: Array<{ productId: string; quantity: number; unitPrice?: number }>;
  method: 'cash' | 'bank_transfer' | 'online' | 'card' | 'other';
  referenceId?: string;
  notes?: string;
  actor?: string;
}) {
  const json = await apiFetch<{ data: unknown }>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchWallets(): Promise<WalletCustomerDto[]> {
  const json = await apiFetch<{ data: WalletCustomerDto[] }>('/api/wallets');
  return json.data;
}

export async function rechargeWallet(body: {
  customerId: string;
  amount: number;
  method?: 'cash' | 'bank_transfer' | 'online' | 'card' | 'other';
  referenceId?: string;
  notes?: string;
}) {
  const json = await apiFetch<{ data: unknown }>('/api/wallets/recharge', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchInvoices(filters?: { from?: string; to?: string }): Promise<InvoiceDto[]> {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const q = params.toString() ? `?${params.toString()}` : '';
  const json = await apiFetch<{ data: InvoiceDto[] }>(`/api/billing/invoices${q}`);
  return json.data;
}

export interface ReturnDamageDto {
  id: string;
  entryType: 'return' | 'damage';
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  adjustmentAmount: number;
  reason: string;
  notes: string;
  createdAt: string;
}

export async function fetchReturnsDamages(filters?: { from?: string; to?: string }): Promise<ReturnDamageDto[]> {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const q = params.toString() ? `?${params.toString()}` : '';
  const json = await apiFetch<{ data: ReturnDamageDto[] }>(`/api/returns-damages${q}`);
  return json.data;
}

export async function createReturnDamage(body: {
  entryType: 'return' | 'damage';
  scenario?: 'delivery' | 'inventory' | 'in_house' | 'customer_side';
  customerId: string;
  walkInName?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  reason?: string;
  notes?: string;
}) {
  const json = await apiFetch<{ data: { id: string } }>('/api/returns-damages', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}
