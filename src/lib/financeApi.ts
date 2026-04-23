import { apiFetch } from './api';
import type { DeliveryItem } from '@/types';

export interface FinanceCustomerLookup {
  id: string;
  customerId: string;
  name: string;
  walletBalance: number;
}

export interface PaymentDto {
  id: string;
  dbId: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'online' | 'other';
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

export async function fetchFinanceLookups(): Promise<{ customers: FinanceCustomerLookup[] }> {
  const json = await apiFetch<{ data: { customers: FinanceCustomerLookup[]; supportsWalkIn?: boolean } }>('/api/lookups/finance-form');
  return json.data;
}

export async function fetchPayments(): Promise<PaymentDto[]> {
  const json = await apiFetch<{ data: PaymentDto[] }>('/api/payments');
  return json.data;
}

export async function recordPayment(body: {
  customerId: string;
  walkInName?: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'online' | 'other';
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
  method?: 'cash' | 'bank_transfer' | 'online' | 'other';
  referenceId?: string;
  notes?: string;
}) {
  const json = await apiFetch<{ data: unknown }>('/api/wallets/recharge', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchInvoices(): Promise<InvoiceDto[]> {
  const json = await apiFetch<{ data: InvoiceDto[] }>('/api/billing/invoices');
  return json.data;
}
