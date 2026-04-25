import { apiFetch } from './api';
import { ApiError } from './api';

export interface SettingsPayload {
  business: {
    businessName: string;
    contactPhone: string;
    emailAddress: string;
    city: string;
    fullAddress: string;
  };
  billing: {
    allowCredit: boolean;
    autoInvoice: boolean;
    clientReportMode: 'daily' | 'weekly' | 'monthly';
    defaultPaymentMethod: 'cash' | 'bank_transfer' | 'online' | 'card' | 'other';
  };
  promotions: {
    buyXGetYEnabled: boolean;
    buyXQty: number;
    buyYQty: number;
    spendXGetYEnabled: boolean;
    spendAmount: number;
    spendFreeQty: number;
  };
  notifications: {
    lowStockAlert: boolean;
    emailNotify: boolean;
    failedDeliveryAlert: boolean;
    paymentReceivedAlert: boolean;
  };
  roles: Array<{
    role: string;
    label: string;
    users: number;
    permissions: string[];
  }>;
}

export interface ManagedUserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff' | 'field_worker' | 'client';
  status: 'active' | 'inactive';
}

export async function fetchSettings(): Promise<SettingsPayload> {
  const json = await apiFetch<{ data: SettingsPayload }>('/api/settings');
  return json.data;
}

export async function updateBusinessSettings(body: SettingsPayload['business']) {
  const json = await apiFetch<{ data: SettingsPayload }>('/api/settings/business', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function updateBillingSettings(body: SettingsPayload['billing']) {
  const json = await apiFetch<{ data: SettingsPayload }>('/api/settings/billing', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function updateNotificationSettings(body: SettingsPayload['notifications']) {
  const json = await apiFetch<{ data: SettingsPayload }>('/api/settings/notifications', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function updatePromotionSettings(body: SettingsPayload['promotions']) {
  const json = await apiFetch<{ data: SettingsPayload }>('/api/settings/promotions', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchManagedUsers(): Promise<ManagedUserDto[]> {
  try {
    const json = await apiFetch<{ data: ManagedUserDto[] }>('/api/settings/users');
    return json.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return [];
    throw e;
  }
}

export async function updateManagedUserStatus(userId: string, status: 'active' | 'inactive') {
  const json = await apiFetch<{ data: ManagedUserDto[] }>(`/api/settings/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return json.data;
}

export async function updateManagedUserPassword(userId: string, password: string) {
  const json = await apiFetch<{ data: { ok: boolean } }>(`/api/settings/users/${encodeURIComponent(userId)}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
  return json.data;
}
