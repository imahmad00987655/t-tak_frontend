import type { UserRole } from '@/types';
import { apiFetch } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive';
  employeeId?: string;
  customerId?: string;
}

export async function loginWithCredentials(identifier: string, password: string): Promise<AuthUser> {
  const json = await apiFetch<{ data: { user: AuthUser } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  return json.data.user;
}

export async function quickLoginByRole(role: UserRole): Promise<AuthUser> {
  const json = await apiFetch<{ data: { user: AuthUser } }>('/api/auth/quick-login', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
  return json.data.user;
}
