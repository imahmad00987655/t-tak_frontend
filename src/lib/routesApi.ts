import type { Route } from '@/types';
import { apiFetch } from './api';

export interface RouteDto extends Route {
  workerNames: string[];
}

export interface RouteLookups {
  workers: Array<{ id: string; name: string }>;
}

export interface EmployeeLookups {
  areas: string[];
  zones: string[];
  routes: Array<{ id: string; name: string; area: string; zone?: string }>;
}

export interface CustomerFormLookups {
  areas: string[];
  zones: string[];
  routes: string[];
  workers: Array<{ id: string; name: string }>;
}

export async function fetchRoutes(): Promise<RouteDto[]> {
  const json = await apiFetch<{ data: RouteDto[] }>('/api/routes');
  return json.data;
}

export async function fetchRouteLookups(): Promise<RouteLookups> {
  const json = await apiFetch<{ data: RouteLookups }>('/api/lookups/routes-form');
  return json.data;
}

export async function createRoute(body: {
  name: string;
  area: string;
  zone?: string;
  workerIds: string[];
}): Promise<RouteDto | null> {
  const json = await apiFetch<{ data: RouteDto | null }>('/api/routes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchEmployeeLookups(): Promise<EmployeeLookups> {
  const json = await apiFetch<{ data: EmployeeLookups }>('/api/lookups/employee-form');
  return json.data;
}

export async function fetchCustomerFormLookups(): Promise<CustomerFormLookups> {
  const json = await apiFetch<{ data: CustomerFormLookups }>('/api/lookups/customer-form');
  return json.data;
}
