import type { Customer } from '@/types';
import type { WalletTransaction } from '@/types';
import { apiFetch } from './api';

export interface CustomerDto extends Customer {
  qrToken?: string;
  qrCardUrl?: string;
}

export async function fetchCustomers(): Promise<CustomerDto[]> {
  const json = await apiFetch<{ data: CustomerDto[] }>('/api/customers');
  return json.data;
}

export async function fetchCustomer(id: string): Promise<CustomerDto> {
  const json = await apiFetch<{ data: CustomerDto }>(`/api/customers/${encodeURIComponent(id)}`);
  return json.data;
}

export async function createCustomer(body: {
  name: string;
  phone: string;
  altPhone?: string;
  address: string;
  area: string;
  zone?: string;
  route?: string;
  customerType: string;
  walletBalance?: number;
  notes?: string;
  assignedWorker?: string;
  joiningDate?: string;
  loginPhone?: string;
  loginEmail?: string;
  loginPassword?: string;
}): Promise<CustomerDto> {
  const json = await apiFetch<{ data: CustomerDto }>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function updateCustomer(
  id: string,
  body: Partial<{
    name: string;
    phone: string;
    altPhone: string;
    address: string;
    area: string;
    zone: string;
    route: string;
    customerType: string;
    status: string;
    notes: string;
    assignedWorker: string;
  }>
): Promise<CustomerDto> {
  const json = await apiFetch<{ data: CustomerDto }>(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchWalletTransactions(customerId: string): Promise<WalletTransaction[]> {
  const json = await apiFetch<{ data: WalletTransaction[] }>(
    `/api/customers/${encodeURIComponent(customerId)}/wallet-transactions`
  );
  return json.data;
}

export async function fetchPublicCustomerByToken(token: string): Promise<CustomerDto> {
  const json = await apiFetch<{ data: CustomerDto }>(
    `/api/public/customer/${encodeURIComponent(token)}`
  );
  return json.data;
}
